/** Цвета интерфейса: разбор HEX/RGB, HSL, контраст по WCAG 2.1 */

export type Rgb = [number, number, number];
export type Hsl = [number, number, number];

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/** Принимает #abc, #aabbcc или rgb(1, 2, 3). Возвращает #rrggbb или null */
export function parseColor(input: string): string | null {
	const s = input.trim().toLowerCase();
	const short = /^#?([0-9a-f])([0-9a-f])([0-9a-f])$/.exec(s);
	if (short) return `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}`;
	const long = /^#?([0-9a-f]{6})$/.exec(s);
	if (long) return `#${long[1]}`;
	const rgb = /^rgba?\(\s*(\d{1,3})\s*[, ]\s*(\d{1,3})\s*[, ]\s*(\d{1,3})/.exec(s);
	if (rgb) return rgbToHex(rgb.slice(1, 4).map((n) => clamp(Number(n), 0, 255)) as Rgb);
	return null;
}

export function hexToRgb(hex: string): Rgb {
	const n = parseInt(hex.slice(1), 16);
	return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHex([r, g, b]: Rgb) {
	return `#${[r, g, b].map((n) => Math.round(n).toString(16).padStart(2, '0')).join('')}`;
}

export function hexToHsl(hex: string): Hsl {
	const [r, g, b] = hexToRgb(hex).map((n) => n / 255);
	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	const l = (max + min) / 2;
	if (max === min) return [0, 0, Math.round(l * 100)];
	const d = max - min;
	const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
	const h =
		max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
	return [Math.round(h * 60), Math.round(s * 100), Math.round(l * 100)];
}

export function hslToHex([h, s, l]: Hsl) {
	const sat = s / 100;
	const light = l / 100;
	const k = (n: number) => (n + h / 30) % 12;
	const a = sat * Math.min(light, 1 - light);
	const f = (n: number) => light - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
	return rgbToHex([f(0) * 255, f(8) * 255, f(4) * 255]);
}

/** Относительная яркость по WCAG */
function luminance(hex: string) {
	const [r, g, b] = hexToRgb(hex).map((n) => {
		const c = n / 255;
		return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
	});
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Коэффициент контрастности 1–21. Для обычного текста WCAG AA требует 4.5, для крупного — 3 */
export function contrast(a: string, b: string) {
	const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m);
	return (x + 0.05) / (y + 0.05);
}

/** Тёмно-синий или белый — что читается лучше на этом фоне */
export function readableOn(bg: string, dark = '#091540', light = '#ffffff') {
	return contrast(dark, bg) >= contrast(light, bg) ? dark : light;
}

/** Сдвигает светлоту цвета, пока он не станет достаточно контрастным к фону */
export function ensureContrast(fg: string, bg: string, ratio = 4.5) {
	if (contrast(fg, bg) >= ratio) return fg;
	const [h, s, l] = hexToHsl(fg);
	const darker = luminance(bg) > 0.18;
	for (let step = 1; step <= 100; step++) {
		const candidate = hslToHex([h, s, clamp(darker ? l - step : l + step, 0, 100)]);
		if (contrast(candidate, bg) >= ratio) return candidate;
	}
	return readableOn(bg);
}

/**
 * CSS-переменные акцента для участка страницы: кнопки, обводки и значки
 * внутри него окрашиваются в выбранный оттенок.
 */
export function accentVars(hex: string, mode: 'light' | 'dark') {
	const surface = mode === 'dark' ? '#1a1d25' : '#ffffff';
	const strong = ensureContrast(hex, surface, 4.5);
	return [
		`--accent: ${hex}`,
		`--accent-strong: ${strong}`,
		`--accent-ink: ${readableOn(hex)}`,
		`--accent-text: ${strong}`,
		`--accent-soft: color-mix(in srgb, ${hex} ${mode === 'dark' ? 18 : 28}%, var(--surface))`
	].join('; ');
}
