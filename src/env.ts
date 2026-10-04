import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	// Необязательно: без ключа ИИ-репетитор отвечает встроенными разборами задач
	OPENAI_API_KEY: { schema: (value) => value || undefined },
	OPENAI_MODEL: { schema: (value) => value || 'gpt-4o-mini' }
});
