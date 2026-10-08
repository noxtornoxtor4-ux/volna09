import {
	FIREBASE_API_KEY,
	FIREBASE_APP_ID,
	FIREBASE_AUTH_DOMAIN,
	FIREBASE_PROJECT_ID
} from '$app/env/public';
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

/** Ключ демо-версии: включается страницей /demo, данные выдуманные и живут только в браузере */
export const DEMO_FLAG = 'volna:demo';

export const demoMode = (() => {
	try {
		return typeof localStorage !== 'undefined' && localStorage.getItem(DEMO_FLAG) === '1';
	} catch {
		return false;
	}
})();

/** Сервер подключён, когда в окружении есть конфигурация веб-приложения Firebase */
export const firebaseEnabled =
	!demoMode &&
	!!(FIREBASE_API_KEY && FIREBASE_AUTH_DOMAIN && FIREBASE_PROJECT_ID && FIREBASE_APP_ID);

let appPromise: Promise<FirebaseApp> | undefined;
let authPromise: Promise<Auth> | undefined;
let dbPromise: Promise<Firestore> | undefined;

/** Основной адрес сайта: на нём служебные страницы входа Firebase проксируются через vercel.json */
const PRODUCTION_HOST = 'volna09.vercel.app';

/**
 * Домен входа. На основном сайте вход идёт через его же адрес (/__/auth → Firebase),
 * поэтому браузеры с защитой от сторонних cookie (Safari, Chrome, Firefox) не теряют вход
 * после возврата со страницы Google. На localhost и превью — стандартный домен Firebase.
 */
function authDomain() {
	return typeof location !== 'undefined' && location.hostname === PRODUCTION_HOST
		? PRODUCTION_HOST
		: FIREBASE_AUTH_DOMAIN;
}

/** Firebase загружается лениво, чтобы первый экран показывался без ожидания SDK */
export function firebaseApp() {
	appPromise ??= import('firebase/app').then(
		({ getApps, initializeApp }) =>
			getApps()[0] ??
			initializeApp({
				apiKey: FIREBASE_API_KEY,
				authDomain: authDomain(),
				projectId: FIREBASE_PROJECT_ID,
				appId: FIREBASE_APP_ID
			})
	);
	return appPromise;
}

export function firebaseAuth() {
	authPromise ??= Promise.all([firebaseApp(), import('firebase/auth')]).then(([app, sdk]) => {
		const auth = sdk.getAuth(app);
		auth.useDeviceLanguage();
		return auth;
	});
	return authPromise;
}

/** Firestore с офлайн-кэшем: данные видны без сети, изменения уходят на сервер при подключении */
export function firestore() {
	dbPromise ??= Promise.all([firebaseApp(), import('firebase/firestore')]).then(([app, sdk]) => {
		try {
			return sdk.initializeFirestore(app, {
				localCache: sdk.persistentLocalCache({ tabManager: sdk.persistentMultipleTabManager() }),
				ignoreUndefinedProperties: true
			});
		} catch {
			// Кэш недоступен (приватный режим) или Firestore уже создан — работаем без него
			return sdk.getFirestore(app);
		}
	});
	return dbPromise;
}
