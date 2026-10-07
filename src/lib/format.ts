import { dateLocale, getLocale, pluralForm, tr } from './i18n.ts';

const kyMonths = [
	'январь',
	'февраль',
	'март',
	'апрель',
	'май',
	'июнь',
	'июль',
	'август',
	'сентябрь',
	'октябрь',
	'ноябрь',
	'декабрь'
];
const kyWeekdays = ['жекшемби', 'дүйшөмбү', 'шейшемби', 'шаршемби', 'бейшемби', 'жума', 'ишемби'];

/** Не во всех браузерах есть кыргызская локаль Intl — тогда собираем дату сами: «шаршемби, 7-октябрь 2026» */
const kyIntl =
	typeof Intl !== 'undefined' && Intl.DateTimeFormat.supportedLocalesOf('ky').length > 0;

export function formatDateValue(value: Date, options: Intl.DateTimeFormatOptions) {
	if (getLocale() !== 'ky' || kyIntl) return value.toLocaleDateString(dateLocale(), options);
	const fullMonth = kyMonths[value.getMonth()];
	const month = options.month === 'short' ? fullMonth.slice(0, 3) : fullMonth;
	const date = options.day
		? `${value.getDate()}-${month}`
		: month[0].toUpperCase() + month.slice(1);
	const year = options.year ? ` ${value.getFullYear()}` : '';
	return `${options.weekday ? `${kyWeekdays[value.getDay()]}, ` : ''}${date}${year}`;
}

export function formatDate(
	date: string,
	options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' }
) {
	return formatDateValue(new Date(`${date}T00:00:00`), options);
}

/** Время сообщения: 14:05 */
export function formatTime(iso: string) {
	return new Date(iso).toLocaleTimeString(dateLocale(), { hour: '2-digit', minute: '2-digit' });
}

/** «через 3 дня», «завтра», «сегодня» */
export function relativeDay(date: string) {
	const today = new Date(new Date().toLocaleDateString('sv-SE'));
	const diff = Math.round((Date.parse(date) - today.getTime()) / 864e5);
	if (diff === 0) return tr('сегодня');
	if (diff === 1) return tr('завтра');
	if (diff === -1) return tr('вчера');
	if (diff > 0) return tr('через {0} {1}', diff, plural(diff, 'день', 'дня', 'дней'));
	return tr('{0} {1} назад', -diff, plural(-diff, 'день', 'дня', 'дней'));
}

export function timeAgo(iso: string) {
	const minutes = Math.round((Date.now() - Date.parse(iso)) / 60_000);
	if (minutes < 1) return tr('только что');
	if (minutes < 60) return tr('{0} мин', minutes);
	const hours = Math.round(minutes / 60);
	if (hours < 24) return tr('{0} ч', hours);
	const days = Math.round(hours / 24);
	return `${days} ${plural(days, 'день', 'дня', 'дней')}`;
}

/** Форма слова после числа с учётом языка интерфейса (передаются русские формы) */
export const plural = pluralForm;

export const hoursLabel = (n: number) => `${n} ${plural(n, 'час', 'часа', 'часов')}`;

/** «16 лет» или пусто, если возраст не указан */
export const ageLabel = (n: number) => (n > 0 ? `${n} ${plural(n, 'год', 'года', 'лет')}` : '');

/** Подпись под именем волонтёра: возраст и город, если они указаны */
export const personMeta = (age: number, city: string) =>
	[ageLabel(age), city ? tr(city) : ''].filter(Boolean).join(' · ');
