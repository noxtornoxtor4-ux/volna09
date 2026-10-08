import { tr } from './i18n.ts';
import { firebaseAuth } from './firebase.ts';

/** Вход через Google одним касанием. Возвращает имя и почту из аккаунта Google */
export async function googleSignIn() {
	const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
	const provider = new GoogleAuthProvider();
	provider.setCustomParameters({ prompt: 'select_account' });
	const { user } = await signInWithPopup(await firebaseAuth(), provider);
	return { name: user.displayName ?? '', email: user.email ?? '' };
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
