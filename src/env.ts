import { defineEnvVars } from '@sveltejs/kit/env';

/** Необязательная переменная: пустая строка считается отсутствием значения */
const optional = (value: string | undefined) => value || undefined;

/**
 * Ключи веб-приложения Firebase для отправки настоящих SMS при входе по телефону.
 * Это публичная конфигурация клиента (её видно в браузере), секретов здесь нет.
 * Без ключей вход по телефону работает в демо-режиме.
 */
export const variables = defineEnvVars({
	FIREBASE_API_KEY: { public: true, static: true, schema: optional },
	FIREBASE_AUTH_DOMAIN: { public: true, static: true, schema: optional },
	FIREBASE_PROJECT_ID: { public: true, static: true, schema: optional },
	FIREBASE_APP_ID: { public: true, static: true, schema: optional }
});
