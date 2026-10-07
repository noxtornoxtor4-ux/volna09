import { CalendarHeart, GraduationCap, HandHeart, Megaphone, Rocket } from '@lucide/svelte';
import { tr } from './i18n.ts';
import type {
	Accent,
	AwardTier,
	AwardType,
	Category,
	FormQuestion,
	SkillLevel,
	Tone,
	Topic
} from './types.ts';

/** Локальная дата со сдвигом в днях, формат YYYY-MM-DD */
export function day(offset = 0) {
	const date = new Date();
	date.setDate(date.getDate() + offset);
	return date.toLocaleDateString('sv-SE');
}

export const categories: Record<
	Category,
	{ label: string; plural: string; tone: Tone; icon: typeof Rocket }
> = {
	project: { label: tr('Проект'), plural: tr('Проекты'), tone: 'blue', icon: Rocket },
	training: { label: tr('Тренинг'), plural: tr('Тренинги'), tone: 'yellow', icon: GraduationCap },
	action: {
		label: tr('Разовая акция'),
		plural: tr('Разовые акции'),
		tone: 'green',
		icon: HandHeart
	},
	meeting: { label: tr('Встреча'), plural: tr('Встречи'), tone: 'lilac', icon: CalendarHeart },
	recruitment: { label: tr('Набор'), plural: tr('Наборы'), tone: 'peach', icon: Megaphone }
};

/** Встроенные темы; пользователи могут добавлять свои */
export const builtinTopics: Topic[] = [
	{ id: 'ecology', label: 'Экология', emoji: '🌱', tone: 'green' },
	{ id: 'education', label: 'Образование', emoji: '📚', tone: 'yellow' },
	{ id: 'culture', label: 'Культура', emoji: '🎭', tone: 'lilac' },
	{ id: 'business', label: 'Бизнес', emoji: '💼', tone: 'blue' },
	{ id: 'charity', label: 'Благотворительность', emoji: '💝', tone: 'peach' },
	{ id: 'animals', label: 'Животные', emoji: '🐾', tone: 'peach' },
	{ id: 'health', label: 'Здоровье', emoji: '💚', tone: 'green' },
	{ id: 'sport', label: 'Спорт', emoji: '⚽', tone: 'blue' },
	{ id: 'media', label: 'Медиа', emoji: '🎬', tone: 'lilac' }
];

export const accents: Record<Accent, { label: string; color: string }> = {
	wave: { label: tr('Волна — фирменный'), color: '#7692ff' },
	sky: { label: tr('Пастельно-голубой'), color: '#a9d4ff' },
	sun: { label: tr('Мягкий жёлтый'), color: '#ffe08a' },
	mint: { label: tr('Пастельно-зелёный'), color: '#a8e6c4' },
	lilac: { label: tr('Лавандовый'), color: '#cdb8ff' },
	peach: { label: tr('Персиковый'), color: '#ffc4a8' },
	lemon: { label: tr('Лимонный'), color: '#fffabf' },
	blush: { label: tr('Нежно-розовый'), color: '#ffe7ff' },
	aqua: { label: tr('Аквамарин'), color: '#b2f9e7' },
	orchid: { label: tr('Орхидея'), color: '#f4adef' },
	periwinkle: { label: tr('Барвинок'), color: '#bfc4ff' }
};

/** Готовые Tailwind-классы для пастельных тонов (статические строки, чтобы Tailwind их увидел) */
export const toneClass: Record<Tone, { bg: string; text: string; ring: string }> = {
	blue: { bg: 'bg-pastel-blue', text: 'text-pastel-blue-ink', ring: 'ring-pastel-blue-ink' },
	yellow: {
		bg: 'bg-pastel-yellow',
		text: 'text-pastel-yellow-ink',
		ring: 'ring-pastel-yellow-ink'
	},
	green: { bg: 'bg-pastel-green', text: 'text-pastel-green-ink', ring: 'ring-pastel-green-ink' },
	lilac: { bg: 'bg-pastel-lilac', text: 'text-pastel-lilac-ink', ring: 'ring-pastel-lilac-ink' },
	peach: { bg: 'bg-pastel-peach', text: 'text-pastel-peach-ink', ring: 'ring-pastel-peach-ink' }
};

/** Города для фильтра возможностей; «Онлайн» видно во всех городах */
export const ONLINE = 'Онлайн';
export const cities = [
	'Бишкек',
	'Ош',
	'Каракол',
	'Джалал-Абад',
	'Нарын',
	'Талас',
	'Баткен',
	'Токмок',
	'Чолпон-Ата',
	'Кара-Балта'
];

/** Готовые шаблоны постеров профиля */
export const coverPresets: Record<string, { label: string; css: string }> = {
	dawn: { label: tr('Рассвет'), css: 'linear-gradient(135deg, #ffd6e0, #ffe7ba 50%, #c6f1ff)' },
	sky: { label: tr('Небо'), css: 'linear-gradient(160deg, #a9d4ff, #bfc4ff 55%, #f4adef)' },
	mint: { label: tr('Мята'), css: 'linear-gradient(135deg, #b2f9e7, #a9d4ff)' },
	forest: { label: tr('Лес'), css: 'linear-gradient(135deg, #a8e6c4, #daf5e6 60%, #fff4c7)' },
	sun: {
		label: tr('Солнце'),
		css: 'radial-gradient(circle at 20% 30%, #fffabf, transparent 45%), linear-gradient(135deg, #ffe08a, #ffc4a8)'
	},
	lavender: { label: tr('Лаванда'), css: 'linear-gradient(135deg, #cdb8ff, #ffe7ff)' },
	dots: {
		label: tr('Горошек'),
		css: 'radial-gradient(#ffffff99 2.5px, transparent 2.5px) 0 0 / 22px 22px, linear-gradient(135deg, #a9d4ff, #cdb8ff)'
	},
	stripes: {
		label: tr('Полоски'),
		css: 'repeating-linear-gradient(45deg, #ffffff55 0 12px, transparent 12px 24px), linear-gradient(135deg, #ffc4a8, #f4adef)'
	},
	night: { label: tr('Ночь'), css: 'linear-gradient(135deg, #1f2633, #5b62e8 70%, #cdb8ff)' }
};

/** Фирменная палитра: оттенки профиля и цвета своей темы */
export const brandPalette = [
	'#7692ff',
	'#091540',
	'#abd2fa',
	'#3d518c',
	'#1b2cc1',
	'#375299',
	'#051f45',
	'#93abd9',
	'#bfc4ff',
	'#695d9e',
	'#362c75',
	'#3a345b',
	'#2d1c42',
	'#999aae',
	'#e7bef8',
	'#f4adef',
	'#ecd0ec',
	'#ba71a2',
	'#d183a9',
	'#71557a',
	'#502450',
	'#461d3a',
	'#4b1535',
	'#7e2a53',
	'#bf1e62',
	'#cd5782',
	'#e27396',
	'#f2619c',
	'#eb9ab2',
	'#f8b6bf',
	'#f2c4cd',
	'#f3c8dd',
	'#efcfe3',
	'#ffe7ff',
	'#fef0f4',
	'#f0eef3',
	'#95d5d1',
	'#b2f9e7',
	'#c7dad8',
	'#e5f4f4',
	'#ecf2d8',
	'#ede986',
	'#fffabf',
	'#f2e5bd',
	'#dcd3aa'
];

/** Готовые аватары-эмодзи */
export const avatarEmojis = [
	'🦊',
	'🐼',
	'🐨',
	'🦁',
	'🐯',
	'🐸',
	'🐧',
	'🦄',
	'🌻',
	'🌈',
	'⭐',
	'🚀',
	'🌳',
	'💙'
];

export const tones: Tone[] = ['blue', 'yellow', 'green', 'lilac', 'peach'];

export const awardTypes: Record<AwardType, { label: string; plural: string; emoji: string }> = {
	medal: { label: tr('Медаль'), plural: tr('Медали'), emoji: '🏅' },
	cup: { label: tr('Кубок'), plural: tr('Кубки'), emoji: '🏆' },
	certificate: { label: tr('Сертификат'), plural: tr('Сертификаты и грамоты'), emoji: '📜' }
};

export const awardTiers: Record<AwardTier, { label: string; color: string }> = {
	gold: { label: tr('Золото'), color: '#f5c542' },
	silver: { label: tr('Серебро'), color: '#c3cad6' },
	bronze: { label: tr('Бронза'), color: '#d99a6c' }
};

/** Быстрый выбор навыка: эмодзи и название */
export const skillPresets: { emoji: string; title: string }[] = [
	{ emoji: '🎨', title: tr('Рисование') },
	{ emoji: '🗣', title: tr('Коммуникабельность') },
	{ emoji: '💻', title: tr('Программирование') },
	{ emoji: '🎤', title: tr('Публичные выступления') },
	{ emoji: '🌍', title: tr('Иностранные языки') },
	{ emoji: '🎵', title: tr('Музыка') },
	{ emoji: '📸', title: tr('Фотография') },
	{ emoji: '🎬', title: tr('Видеомонтаж') },
	{ emoji: '✍️', title: tr('Тексты и журналистика') },
	{ emoji: '🧩', title: tr('Организация мероприятий') },
	{ emoji: '🩺', title: tr('Первая помощь') },
	{ emoji: '⚽', title: tr('Спорт') }
];

export const skillEmojis = [
	'🎨',
	'🗣',
	'💻',
	'🎤',
	'🌍',
	'🎵',
	'📸',
	'🎬',
	'✍️',
	'🧩',
	'🩺',
	'⚽',
	'📚',
	'🧪',
	'🌱',
	'🐾',
	'🍳',
	'🧵',
	'🎭',
	'🤝',
	'📊',
	'🛠️',
	'♟️',
	'💡'
];

export const skillLevels: Record<SkillLevel, string> = {
	beginner: tr('Начинающий'),
	intermediate: tr('Уверенный'),
	advanced: tr('Продвинутый'),
	expert: tr('Эксперт')
};

export function defaultQuestions(): FormQuestion[] {
	return [
		{ id: 'q-name', label: tr('Имя и фамилия'), type: 'text', required: true, prefill: 'name' },
		{ id: 'q-age', label: tr('Возраст'), type: 'text', required: true, prefill: 'age' },
		{ id: 'q-contact', label: tr('Телефон или Telegram для связи'), type: 'text', required: true },
		{ id: 'q-why', label: tr('Почему хотите участвовать?'), type: 'textarea', required: true },
		{
			id: 'q-exp',
			label: tr('Был ли у вас опыт волонтёрства?'),
			type: 'choice',
			options: [tr('Да, много раз'), tr('Пару раз'), tr('Это мой первый раз')],
			required: false
		}
	];
}
