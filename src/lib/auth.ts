import { tr } from './i18n.ts';
import { firebaseAuth } from './firebase.ts';

type AuthSdk = typeof import('firebase/auth');
let prepared: { auth: Awaited<ReturnType<typeof firebaseAuth>>; sdk: AuthSdk } | null = null;

/**
 * Заранее загружает Firebase Auth. Окно Google браузер пропускает, только если оно
 * открывается сразу по нажатию — без ожидания загрузки модулей.
 */
export async function prepareGoogle() {
	const [auth, sdk] = await Promise.all([firebaseAuth(), import('firebase/auth')]);
	prepared = { auth, sdk };
}

/** Роль, выбранная перед уходом на страницу Google, — чтобы завершить вход после возврата */
export const PENDING_ROLE_KEY = 'volna:pending-role';

function provider(sdk: AuthSdk) {
	const google = new sdk.GoogleAuthProvider();
	google.setCustomParameters({ prompt: 'select_account' });
	return google;
}

/** Вход через Google через переход на страницу Google — когда всплывающие окна заблокированы */
export async function googleRedirect(role: string) {
	const sdk = prepared?.sdk ?? (await import('firebase/auth'));
	const auth = prepared?.auth ?? (await firebaseAuth());
	try {
		sessionStorage.setItem(PENDING_ROLE_KEY, role);
	} catch {
		// без хранилища войдём волонтёром — роль можно сменить в настройках
	}
	await sdk.signInWithRedirect(auth, provider(sdk));
}

/**
 * Вход через Google одним касанием. Окно открывается синхронно в обработчике нажатия;
 * если браузер его заблокировал, вход продолжается через переход на страницу Google.
 */
export async function googleSignIn(role: string) {
	if (!prepared) {
		await googleRedirect(role);
		return null;
	}
	try {
		const { user } = await prepared.sdk.signInWithPopup(prepared.auth, provider(prepared.sdk));
		return { name: user.displayName ?? '', email: user.email ?? '' };
	} catch (error) {
		const code = (error as { code?: string })?.code ?? '';
		if (code.includes('popup-blocked') || code.includes('operation-not-supported')) {
			await googleRedirect(role);
			return null;
		}
		throw error;
	}
}

/** Вход по почте и паролю */
export async function emailSignIn(email: string, password: string) {
	const { signInWithEmailAndPassword } = await import('firebase/auth');
	await signInWithEmailAndPassword(await firebaseAuth(), email.trim(), password);
}

/** Регистрация по почте и паролю */
export async function emailSignUp(email: string, password: string) {
	const { createUserWithEmailAndPassword } = await import('firebase/auth');
	await createUserWithEmailAndPassword(await firebaseAuth(), email.trim(), password);
}

/** Письмо со ссылкой для сброса пароля */
export async function resetPassword(email: string) {
	const { sendPasswordResetEmail } = await import('firebase/auth');
	// После смены пароля Firebase предложит вернуться на страницу входа
	await sendPasswordResetEmail(await firebaseAuth(), email.trim(), {
		url: `${location.origin}/login`
	});
}

/** Новый пароль для вошедшего по почте пользователя */
export async function changePassword(password: string) {
	const [auth, { updatePassword }] = await Promise.all([firebaseAuth(), import('firebase/auth')]);
	if (!auth.currentUser) throw new Error('auth/no-current-user');
	await updatePassword(auth.currentUser, password);
}

/** Понятное сообщение об ошибке входа по почте */
export function authError(error: unknown) {
	const code = (error as { code?: string })?.code ?? String(error);
	if (code.includes('email-already-in-use'))
		return tr('Этот email уже зарегистрирован — войдите в аккаунт');
	if (code.includes('wrong-password'))
		return tr('Неверный пароль. Нажмите «Забыли пароль?» — пришлём ссылку для сброса');
	if (code.includes('invalid-credential') || code.includes('user-not-found'))
		return tr('Неверный email или пароль');
	if (code.includes('invalid-email')) return tr('Проверьте адрес почты');
	if (code.includes('weak-password')) return tr('Пароль слишком простой — минимум 6 символов');
	if (code.includes('requires-recent-login'))
		return tr('Для смены пароля выйдите и войдите заново');
	if (code.includes('too-many-requests')) return tr('Слишком много попыток. Попробуйте позже');
	if (code.includes('operation-not-allowed')) return tr('Этот способ входа не включён в Firebase');
	if (code.includes('popup-closed') || code.includes('cancelled-popup'))
		return tr('Окно Google закрыто — нажмите кнопку ещё раз');
	if (code.includes('popup-blocked'))
		return tr('Браузер заблокировал окно Google — разрешите всплывающие окна или войдите по почте');
	if (code.includes('unauthorized-domain')) return tr('Этот адрес сайта не разрешён в Firebase');
	if (code.includes('network')) return tr('Нет соединения с интернетом');
	return tr('Не удалось войти. Попробуйте ещё раз');
}
