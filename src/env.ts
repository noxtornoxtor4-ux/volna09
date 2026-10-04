import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	// Необязательно: без ключа Scope Defender работает на встроенной эвристике
	OPENAI_API_KEY: { schema: (value) => value || undefined },
	OPENAI_MODEL: { schema: (value) => value || 'gpt-4o-mini' }
});
