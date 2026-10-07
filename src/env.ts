import { defineEnvVars } from '@sveltejs/kit/env';

/**
 * Публичная конфигурация веб-приложения Firebase (проект «volna») для настоящих SMS при входе.
 * Эти значения не секретные: их видит браузер любого посетителя, а доступ ограничен
 * списком разрешённых доменов в Firebase. Переменные окружения с теми же именами
 * перекрывают значения по умолчанию — например, для отдельного тестового проекта.
 */
const withDefault = (fallback: string) => (value: string | undefined) => value || fallback;

export const variables = defineEnvVars({
	FIREBASE_API_KEY: {
		public: true,
		static: true,
		schema: withDefault('AIzaSyDKS2TtQV6jmIQjf03X7rOA14qZlbjATIY')
	},
	FIREBASE_AUTH_DOMAIN: {
		public: true,
		static: true,
		schema: withDefault('volna-a7de4.firebaseapp.com')
	},
	FIREBASE_PROJECT_ID: { public: true, static: true, schema: withDefault('volna-a7de4') },
	FIREBASE_APP_ID: {
		public: true,
		static: true,
		schema: withDefault('1:375451056746:web:b42caeca8bff7100036813')
	}
});
