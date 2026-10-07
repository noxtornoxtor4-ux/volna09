import {
	FIREBASE_API_KEY,
	FIREBASE_APP_ID,
	FIREBASE_AUTH_DOMAIN,
	FIREBASE_PROJECT_ID
} from '$app/env/public';
import type { ConfirmationResult, RecaptchaVerifier } from 'firebase/auth';

/** Настоящие SMS включаются, когда в окружении заданы ключи Firebase */
export const smsEnabled = !!(
	FIREBASE_API_KEY &&
	FIREBASE_AUTH_DOMAIN &&
	FIREBASE_PROJECT_ID &&
	FIREBASE_APP_ID
);

/** Длина кода: у Firebase всегда 6 цифр, в демо-режиме держим так же */
export const CODE_LENGTH = 6;

let confirmation: ConfirmationResult | null = null;
let verifier: RecaptchaVerifier | null = null;

/**
 * Отправляет SMS с кодом. Firebase загружается только здесь, чтобы не утяжелять приложение.
 * containerId — элемент для невидимой reCAPTCHA, которую Firebase требует от ботов.
 */
export async function sendSms(phone: string, containerId: string) {
	const { getApps, initializeApp } = await import('firebase/app');
	const { getAuth, RecaptchaVerifier, signInWithPhoneNumber } = await import('firebase/auth');
	const firebase =
		getApps()[0] ??
		initializeApp({
			apiKey: FIREBASE_API_KEY,
			authDomain: FIREBASE_AUTH_DOMAIN,
			projectId: FIREBASE_PROJECT_ID,
			appId: FIREBASE_APP_ID
		});
	const auth = getAuth(firebase);
	auth.languageCode = 'ru';
	verifier ??= new RecaptchaVerifier(auth, containerId, { size: 'invisible' });
	try {
		confirmation = await signInWithPhoneNumber(auth, phone, verifier);
	} catch (error) {
		// После ошибки reCAPTCHA нужно пересоздать, иначе повторная отправка не сработает
		verifier.clear();
		verifier = null;
		throw error;
	}
}

/** Проверяет код из SMS */
export async function confirmSms(code: string) {
	if (!confirmation) throw new Error('auth/missing-verification-id');
	await confirmation.confirm(code);
	confirmation = null;
}

/** Понятное сообщение об ошибке Firebase */
export function smsError(error: unknown) {
	const code = (error as { code?: string })?.code ?? String(error);
	if (code.includes('invalid-phone-number')) return 'Проверьте номер телефона';
	if (code.includes('invalid-verification-code'))
		return 'Неверный код. Проверьте SMS и попробуйте ещё раз';
	if (code.includes('code-expired')) return 'Код устарел — отправьте новый';
	if (code.includes('too-many-requests')) return 'Слишком много попыток. Попробуйте позже';
	if (code.includes('billing')) return 'SMS пока недоступны для этого номера. Войдите по email';
	if (code.includes('quota-exceeded')) return 'Лимит SMS на сегодня исчерпан. Войдите по email';
	if (code.includes('operation-not-allowed')) return 'Вход по телефону не включён в Firebase';
	if (code.includes('captcha') || code.includes('network'))
		return 'Не удалось проверить, что вы не робот. Проверьте интернет';
	return 'Не удалось отправить SMS. Попробуйте ещё раз';
}
