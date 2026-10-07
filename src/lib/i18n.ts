import { en, enPlurals } from './locales/en.ts';
import { ky, kyPlurals } from './locales/ky.ts';

export type Locale = 'ky' | 'ru' | 'en';

export const locales: Record<Locale, { label: string; short: string; date: string }> = {
	ky: { label: 'Кыргызча', short: 'KG', date: 'ky-KG' },
	ru: { label: 'Русский', short: 'RU', date: 'ru-RU' },
	en: { label: 'English', short: 'EN', date: 'en-US' }
};

const STORAGE_KEY = 'volna:locale';

function detect(): Locale {
	try {
		const saved = localStorage.getItem(STORAGE_KEY);
		if (saved && saved in locales) return saved as Locale;
	} catch {
		// хранилище недоступно — берём язык браузера
	}
	const browser = typeof navigator === 'undefined' ? 'ru' : navigator.language.slice(0, 2);
	return browser === 'ky' || browser === 'en' ? browser : 'ru';
}

/** Язык читается один раз при загрузке; смена языка перезагружает приложение */
const current: Locale = detect();

export function getLocale() {
	return current;
}

export function setLocale(locale: Locale) {
	if (locale === current) return;
	try {
		localStorage.setItem(STORAGE_KEY, locale);
	} catch {
		// без хранилища язык продержится до перезагрузки
	}
	document.documentElement.lang = locale;
	location.reload();
}

/** Код для Intl: даты и время на языке интерфейса */
export function dateLocale() {
	return locales[current].date;
}

const dictionaries: Record<Locale, Record<string, string> | undefined> = { ky, en, ru: undefined };

/**
 * Перевод фразы интерфейса. Ключ — русский текст, {0}, {1}… — подстановки.
 * Если перевода нет, показывается русский текст.
 */
export function tr(key: string, ...params: unknown[]): string {
	const text = dictionaries[current]?.[key] ?? key;
	return params.length
		? text.replace(/\{(\d+)\}/g, (_, i) => String(params[Number(i)] ?? ''))
		: text;
}

/**
 * Форма слова после числа. Принимает русские формы (1 час, 2 часа, 5 часов),
 * для других языков ищет перевод по форме «много».
 */
export function pluralForm(n: number, one: string, few: string, many: string) {
	if (current === 'en') {
		const forms = enPlurals[many];
		if (forms) return Math.abs(n) === 1 ? forms[0] : forms[1];
	}
	if (current === 'ky') {
		// В кыргызском существительное после числа не меняется
		const form = kyPlurals[many];
		if (form) return form;
	}
	const mod10 = Math.abs(n) % 10;
	const mod100 = Math.abs(n) % 100;
	if (mod10 === 1 && mod100 !== 11) return one;
	if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
	return many;
}
