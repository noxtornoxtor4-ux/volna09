export function formatDate(
	date: string,
	options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' }
) {
	return new Date(`${date}T00:00:00`).toLocaleDateString('ru-RU', options);
}

/** «через 3 дня», «завтра», «сегодня» */
export function relativeDay(date: string) {
	const today = new Date(new Date().toLocaleDateString('sv-SE'));
	const diff = Math.round((Date.parse(date) - today.getTime()) / 864e5);
	if (diff === 0) return 'сегодня';
	if (diff === 1) return 'завтра';
	if (diff === -1) return 'вчера';
	if (diff > 0) return `через ${diff} ${plural(diff, 'день', 'дня', 'дней')}`;
	return `${-diff} ${plural(-diff, 'день', 'дня', 'дней')} назад`;
}

export function timeAgo(iso: string) {
	const minutes = Math.round((Date.now() - Date.parse(iso)) / 60_000);
	if (minutes < 1) return 'только что';
	if (minutes < 60) return `${minutes} мин`;
	const hours = Math.round(minutes / 60);
	if (hours < 24) return `${hours} ч`;
	const days = Math.round(hours / 24);
	return `${days} ${plural(days, 'день', 'дня', 'дней')}`;
}

export function plural(n: number, one: string, few: string, many: string) {
	const mod10 = n % 10;
	const mod100 = n % 100;
	if (mod10 === 1 && mod100 !== 11) return one;
	if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
	return many;
}

export const hoursLabel = (n: number) => `${n} ${plural(n, 'час', 'часа', 'часов')}`;
