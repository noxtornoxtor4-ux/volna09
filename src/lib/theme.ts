import { contrast, ensureContrast } from './color.ts';
import { tr } from './i18n.ts';
import type { CustomTheme } from './types.ts';

/** Стандартные палитры — отправная точка для своей темы */
export const themePresets: Record<'light' | 'dark', CustomTheme> = {
	light: {
		bg: '#f6f8fc',
		surface: '#ffffff',
		ink: '#1f2633',
		muted: '#6b7486',
		button: '#7692ff',
		buttonInk: '#091540',
		buttonPressed: '#5f7de8',
		accent: '#3d5bd9'
	},
	dark: {
		bg: '#111319',
		surface: '#1a1d25',
		ink: '#eef1f7',
		muted: '#9aa3b5',
		button: '#7692ff',
		buttonInk: '#091540',
		buttonPressed: '#5f7de8',
		accent: '#9fb3ff'
	}
};

/** Настраиваемые цвета, сгруппированные как в ТЗ */
export const themeGroups: { title: string; keys: { key: keyof CustomTheme; label: string }[] }[] = [
	{ title: tr('Фон'), keys: [{ key: 'bg', label: tr('Основной фон экранов') }] },
	{
		title: tr('Текст'),
		keys: [
			{ key: 'ink', label: tr('Основной текст и заголовки') },
			{ key: 'muted', label: tr('Второстепенный текст') }
		]
	},
	{
		title: tr('Кнопки'),
		keys: [
			{ key: 'button', label: tr('Активная кнопка') },
			{ key: 'buttonInk', label: tr('Текст на кнопке') },
			{ key: 'buttonPressed', label: tr('Кнопка при нажатии') }
		]
	},
	{
		title: tr('Акцентные элементы'),
		keys: [{ key: 'accent', label: tr('Переключатели, иконки меню, индикаторы') }]
	},
	{ title: tr('Карточки и блоки'), keys: [{ key: 'surface', label: tr('Фон списков и диалогов') }] }
];

/** CSS-переменные дизайн-токенов для своей темы */
export function themeVars(t: CustomTheme): Record<string, string> {
	return {
		'--bg': t.bg,
		'--surface': t.surface,
		'--surface-2': `color-mix(in srgb, ${t.surface} 92%, ${t.ink})`,
		'--line': `color-mix(in srgb, ${t.surface} 86%, ${t.ink})`,
		'--ink': t.ink,
		'--muted': t.muted,
		'--accent': t.button,
		'--accent-ink': t.buttonInk,
		'--accent-pressed': t.buttonPressed,
		'--accent-strong': t.accent,
		'--accent-text': t.accent,
		'--accent-soft': `color-mix(in srgb, ${t.button} 24%, ${t.surface})`
	};
}

export interface ContrastIssue {
	fg: keyof CustomTheme;
	bg: keyof CustomTheme;
	label: string;
	ratio: number;
	min: number;
}

/** Пары цветов, которые должны читаться (WCAG 2.1: 4.5 для текста, 3 для крупных элементов) */
const pairs: { fg: keyof CustomTheme; bg: keyof CustomTheme; min: number; label: () => string }[] =
	[
		{ fg: 'ink', bg: 'bg', min: 4.5, label: () => tr('Текст на фоне') },
		{ fg: 'ink', bg: 'surface', min: 4.5, label: () => tr('Текст на карточках') },
		{ fg: 'muted', bg: 'surface', min: 3, label: () => tr('Второстепенный текст') },
		{ fg: 'buttonInk', bg: 'button', min: 4.5, label: () => tr('Текст на кнопке') },
		{ fg: 'buttonInk', bg: 'buttonPressed', min: 3, label: () => tr('Текст на нажатой кнопке') },
		{ fg: 'accent', bg: 'surface', min: 3, label: () => tr('Акцентные элементы на карточках') }
	];

export function contrastIssues(t: CustomTheme): ContrastIssue[] {
	return pairs
		.map((p) => ({
			fg: p.fg,
			bg: p.bg,
			min: p.min,
			label: p.label(),
			ratio: contrast(t[p.fg], t[p.bg])
		}))
		.filter((p) => p.ratio < p.min);
}

/** Автоматически подбирает читаемый оттенок для всех проблемных пар */
export function fixContrast(t: CustomTheme): CustomTheme {
	const next = { ...t };
	for (const p of pairs) {
		if (contrast(next[p.fg], next[p.bg]) < p.min)
			next[p.fg] = ensureContrast(next[p.fg], next[p.bg], p.min);
	}
	return next;
}

/** Экспорт/импорт темы через JSON-код */
export function parseTheme(json: string): CustomTheme | null {
	try {
		const data = JSON.parse(json);
		const keys = Object.keys(themePresets.light) as (keyof CustomTheme)[];
		if (!keys.every((k) => typeof data[k] === 'string' && /^#[0-9a-f]{6}$/i.test(data[k])))
			return null;
		return Object.fromEntries(
			keys.map((k) => [k, data[k].toLowerCase()])
		) as unknown as CustomTheme;
	} catch {
		return null;
	}
}

export const themeVarNames = Object.keys(themeVars(themePresets.light));
