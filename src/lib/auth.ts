import { tr } from './i18n.ts';
import { firebaseAuth } from './firebase.ts';

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
	await sendPasswordResetEmail(await firebaseAuth(), email.trim());
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
	if (
		code.includes('invalid-credential') ||
		code.includes('wrong-password') ||
		code.includes('user-not-found')
	)
		return tr('Неверный email или пароль');
	if (code.includes('invalid-email')) return tr('Проверьте адрес почты');
	if (code.includes('weak-password')) return tr('Пароль слишком простой — минимум 6 символов');
	if (code.includes('requires-recent-login'))
		return tr('Для смены пароля выйдите и войдите заново');
	if (code.includes('too-many-requests')) return tr('Слишком много попыток. Попробуйте позже');
	if (code.includes('operation-not-allowed')) return tr('Вход по почте не включён в Firebase');
	if (code.includes('network')) return tr('Нет соединения с интернетом');
	return tr('Не удалось войти. Попробуйте ещё раз');
}
