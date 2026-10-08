/**
 * Шрифты для названия у логотипа. Все бесплатные (Google Fonts, OFL) и с кириллицей.
 * Загружаются только буквы названия на всех языках, поэтому каждый шрифт весит пару килобайт.
 */
export const logoFonts: { family: string; weight: number }[] = [
	{ family: 'Comfortaa', weight: 700 },
	{ family: 'Unbounded', weight: 800 },
	{ family: 'Montserrat Alternates', weight: 800 },
	{ family: 'Lobster', weight: 400 },
	{ family: 'Russo One', weight: 400 },
	{ family: 'Pacifico', weight: 400 }
];

/** Все буквы, которые встречаются в названии на русском, кыргызском и английском */
const LETTERS = 'ВолнаТолкунWAVEwave';

const loaded = new Set<string>();

/** Подключает шрифт с Google Fonts, если он ещё не подключён */
export function loadLogoFont(family: string) {
	const font = logoFonts.find((f) => f.family === family);
	if (!font || loaded.has(family) || typeof document === 'undefined') return;
	loaded.add(family);
	const link = document.createElement('link');
	link.rel = 'stylesheet';
	link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${font.weight}&text=${encodeURIComponent(LETTERS)}&display=swap`;
	document.head.append(link);
}

export const logoFontWeight = (family: string) =>
	logoFonts.find((f) => f.family === family)?.weight ?? 900;
