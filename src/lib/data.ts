import { CalendarHeart, GraduationCap, HandHeart, Megaphone, Rocket } from '@lucide/svelte';
import type {
	Accent,
	Alert,
	Announcement,
	Application,
	Award,
	AwardTier,
	AwardType,
	Category,
	FormQuestion,
	HoursEntry,
	Membership,
	Opportunity,
	OrgProfile,
	Organization,
	Person,
	Post,
	Profile,
	Thread,
	Tone,
	Topic
} from './types.ts';

/** Локальная дата со сдвигом в днях, формат YYYY-MM-DD */
export function day(offset = 0) {
	const date = new Date();
	date.setDate(date.getDate() + offset);
	return date.toLocaleDateString('sv-SE');
}

const ago = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();

/** Демо-аккаунт волонтёра и организации, которой управляет куратор */
export const ME = 'me';
export const MY_ORG = 'eco';

export const categories: Record<
	Category,
	{ label: string; plural: string; tone: Tone; icon: typeof Rocket }
> = {
	project: { label: 'Проект', plural: 'Проекты', tone: 'blue', icon: Rocket },
	training: { label: 'Тренинг', plural: 'Тренинги', tone: 'yellow', icon: GraduationCap },
	action: { label: 'Разовая акция', plural: 'Разовые акции', tone: 'green', icon: HandHeart },
	meeting: { label: 'Встреча', plural: 'Встречи', tone: 'lilac', icon: CalendarHeart },
	recruitment: { label: 'Набор', plural: 'Наборы', tone: 'peach', icon: Megaphone }
};

export const seedTopics: Topic[] = [
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
	sky: { label: 'Пастельно-голубой', color: '#a9d4ff' },
	sun: { label: 'Мягкий жёлтый', color: '#ffe08a' },
	mint: { label: 'Пастельно-зелёный', color: '#a8e6c4' },
	lilac: { label: 'Лавандовый', color: '#cdb8ff' },
	peach: { label: 'Персиковый', color: '#ffc4a8' },
	lemon: { label: 'Лимонный', color: '#fffabf' },
	blush: { label: 'Нежно-розовый', color: '#ffe7ff' },
	aqua: { label: 'Аквамарин', color: '#b2f9e7' },
	orchid: { label: 'Орхидея', color: '#f4adef' },
	periwinkle: { label: 'Барвинок', color: '#bfc4ff' }
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

export const tones: Tone[] = ['blue', 'yellow', 'green', 'lilac', 'peach'];

export const awardTypes: Record<AwardType, { label: string; plural: string; emoji: string }> = {
	medal: { label: 'Медаль', plural: 'Медали', emoji: '🏅' },
	cup: { label: 'Кубок', plural: 'Кубки', emoji: '🏆' },
	certificate: { label: 'Сертификат', plural: 'Сертификаты и грамоты', emoji: '📜' }
};

export const awardTiers: Record<AwardTier, { label: string; color: string }> = {
	gold: { label: 'Золото', color: '#f5c542' },
	silver: { label: 'Серебро', color: '#c3cad6' },
	bronze: { label: 'Бронза', color: '#d99a6c' }
};

export function defaultQuestions(): FormQuestion[] {
	return [
		{ id: 'q-name', label: 'Имя и фамилия', type: 'text', required: true, prefill: 'name' },
		{ id: 'q-age', label: 'Возраст', type: 'text', required: true, prefill: 'age' },
		{ id: 'q-contact', label: 'Телефон или Telegram для связи', type: 'text', required: true },
		{ id: 'q-why', label: 'Почему хотите участвовать?', type: 'textarea', required: true },
		{
			id: 'q-exp',
			label: 'Был ли у вас опыт волонтёрства?',
			type: 'choice',
			options: ['Да, много раз', 'Пару раз', 'Это мой первый раз'],
			required: false
		}
	];
}

export const organizations: Organization[] = [
	{
		id: 'eco',
		name: 'Эко-клуб «Зелёный город»',
		tone: 'green',
		emoji: '🌳',
		verified: true,
		city: 'Бишкек',
		about: 'Сажаем деревья, убираем парки и учим школьников сортировать отходы с 2019 года.',
		followers: 1240
	},
	{
		id: 'paws',
		name: 'Приют «Лапа помощи»',
		tone: 'peach',
		emoji: '🐶',
		verified: true,
		city: 'Бишкек',
		about: 'Приют для 80 собак и кошек. Ищем волонтёров для прогулок, ухода и фотосессий.',
		followers: 2310
	},
	{
		id: 'school',
		name: 'Школа волонтёров',
		tone: 'yellow',
		emoji: '🎓',
		verified: true,
		city: 'Бишкек',
		about:
			'Бесплатные тренинги для подростков: от первой помощи до социального предпринимательства.',
		followers: 870
	},
	{
		id: 'media',
		name: 'Медиа-клуб «Голос»',
		tone: 'lilac',
		emoji: '🎙️',
		verified: false,
		city: 'Бишкек',
		about: 'Снимаем видео и подкасты о добрых делах вместе с подростками.',
		followers: 540
	},
	{
		id: 'care',
		name: 'Фонд «Тёплые руки»',
		tone: 'blue',
		emoji: '🧣',
		verified: true,
		city: 'Бишкек',
		about: 'Помогаем одиноким пожилым людям: продукты, тёплые вещи и общение.',
		followers: 1680
	}
];

export const people: Person[] = [
	{
		id: 'p1',
		name: 'Тимур Абдыкадыров',
		age: 16,
		city: 'Бишкек',
		tone: 'blue',
		interests: ['ecology', 'sport'],
		bio: 'Бегаю марафоны и сажаю деревья 🌲',
		followers: 212
	},
	{
		id: 'p2',
		name: 'Аружан Сапарова',
		age: 15,
		city: 'Бишкек',
		tone: 'yellow',
		interests: ['animals', 'media'],
		bio: 'Снимаю собак из приюта, чтобы они нашли дом 📸',
		followers: 864
	},
	{
		id: 'p3',
		name: 'Миша Ли',
		age: 17,
		city: 'Ош',
		tone: 'lilac',
		interests: ['education', 'culture'],
		bio: 'Вожу книги в сёла и читаю детям сказки',
		followers: 143
	},
	{
		id: 'p4',
		name: 'Камила Исаева',
		age: 16,
		city: 'Бишкек',
		tone: 'peach',
		interests: ['charity', 'health'],
		bio: 'Будущий врач. Волонтёрю в фонде «Тёплые руки» 💙',
		followers: 390
	},
	{
		id: 'p5',
		name: 'Данияр Омуров',
		age: 14,
		city: 'Каракол',
		tone: 'green',
		interests: ['ecology', 'animals'],
		bio: 'Самый молодой в эко-клубе, но самый быстрый на субботниках',
		followers: 77
	},
	{
		id: 'p6',
		name: 'Соня Белова',
		age: 17,
		city: 'Бишкек',
		tone: 'blue',
		interests: ['media', 'business'],
		bio: 'Делаю ролики для НКО и мечтаю о своём социальном стартапе',
		followers: 1520
	}
];

export const seedProfile: Profile = {
	name: 'Алина Ким',
	age: 16,
	city: 'Бишкек',
	bio: 'Люблю природу и животных, учусь снимать короткие видео о добрых делах 🌿',
	interests: ['ecology', 'animals', 'media'],
	tone: 'green'
};

export const seedOrgProfile: OrgProfile = {
	name: organizations[0].name,
	city: organizations[0].city,
	about: organizations[0].about
};

const q = defaultQuestions;

export const seedOpportunities: Opportunity[] = [
	{
		id: 'o1',
		category: 'action',
		title: 'Субботник в парке Ататюрка',
		orgId: 'eco',
		date: day(4),
		time: '10:00–14:00',
		place: 'Бишкек, парк Ататюрка',
		spots: 30,
		hours: 4,
		tags: ['ecology'],
		description: 'Убираем аллеи, сортируем мусор и сажаем 50 саженцев. Перчатки и чай — от клуба.',
		tasks: [
			'Собрать мусор на аллеях и у пруда',
			'Рассортировать отходы по 4 контейнерам',
			'Посадить 50 саженцев клёна вместе с садовником',
			'Сфотографировать результат для отчёта'
		],
		requirements: ['Возраст от 13 лет', 'Удобная одежда и закрытая обувь', 'Бутылка воды'],
		emoji: '🌳',
		tone: 'green',
		deadline: day(3),
		questions: q()
	},
	{
		id: 'o2',
		category: 'recruitment',
		title: 'Набор в команду выгула собак',
		orgId: 'paws',
		date: day(9),
		time: 'по выходным',
		place: 'Приют «Лапа помощи»',
		spots: 12,
		hours: 3,
		tags: ['animals', 'charity'],
		description:
			'Ищем ответственных ребят 14+ для регулярных прогулок с собаками. Обучение в первый день.',
		tasks: [
			'Пройти вводный инструктаж с кинологом',
			'Гулять с 2–3 собаками по 40 минут',
			'Отмечать самочувствие собак в журнале'
		],
		requirements: ['Возраст от 14 лет', 'Не бояться крупных собак', 'Минимум 2 выхода в месяц'],
		emoji: '🐕',
		tone: 'peach',
		deadline: day(7),
		questions: [
			...q(),
			{
				id: 'q-dogs',
				label: 'Есть ли у вас опыт с собаками?',
				type: 'choice',
				options: ['Есть своя собака', 'Гулял(а) с чужими', 'Нет опыта'],
				required: true
			}
		]
	},
	{
		id: 'o3',
		category: 'training',
		title: 'Тренинг «Как снимать социальные Reels»',
		orgId: 'media',
		date: day(6),
		time: '16:00–18:00',
		place: 'Онлайн, Zoom',
		spots: 50,
		hours: 2,
		tags: ['media', 'culture'],
		description: 'Разберём сценарий, свет и монтаж на телефоне. В конце — съёмка ролика для фонда.',
		tasks: [
			'Посмотреть 3 разбора роликов',
			'Написать сценарий на 30 секунд',
			'Снять и смонтировать ролик'
		],
		requirements: ['Телефон с камерой', 'Приложение CapCut или InShot'],
		emoji: '🎬',
		tone: 'lilac',
		questions: q(),
		promotedUntil: day(5)
	},
	{
		id: 'o4',
		category: 'project',
		title: 'Проект «Книги в каждое село»',
		orgId: 'school',
		date: day(14),
		time: '3 месяца',
		place: 'Бишкек + выезды',
		spots: 20,
		hours: 24,
		tags: ['education', 'culture'],
		description: 'Собираем и сортируем книги, проводим чтения для детей в сёлах Чуйской области.',
		tasks: [
			'Принимать и сортировать книги на складе',
			'Готовить наборы для 12 сельских библиотек',
			'Проводить громкие чтения для детей на выездах'
		],
		requirements: ['Возраст от 15 лет', 'Согласие родителей на выезды'],
		emoji: '📚',
		tone: 'yellow',
		deadline: day(10),
		questions: q()
	},
	{
		id: 'o5',
		category: 'meeting',
		title: 'Встреча волонтёров: итоги сезона',
		orgId: 'eco',
		date: day(11),
		time: '18:00–20:00',
		place: 'Коворкинг «Платформа»',
		spots: 40,
		hours: 1,
		tags: ['ecology', 'charity'],
		description: 'Пицца, награждение лучших волонтёров и планы на зиму.',
		tasks: ['Прийти и познакомиться с командой', 'Предложить идею проекта на зиму'],
		requirements: ['Хорошее настроение'],
		emoji: '🍕',
		tone: 'lilac',
		questions: q().slice(0, 3)
	},
	{
		id: 'o6',
		category: 'action',
		title: 'Сбор тёплых вещей для пожилых',
		orgId: 'care',
		date: day(2),
		time: '12:00–17:00',
		place: 'ТЦ «Вефа», 1 этаж',
		spots: 15,
		hours: 5,
		tags: ['charity', 'health'],
		description: 'Принимаем и сортируем вещи, упаковываем наборы для одиноких пожилых людей.',
		tasks: ['Принимать вещи у посетителей', 'Сортировать по размерам', 'Упаковывать наборы'],
		requirements: ['Возраст от 14 лет'],
		emoji: '🧣',
		tone: 'blue',
		questions: q()
	},
	{
		id: 'o7',
		category: 'training',
		title: 'Первая помощь для волонтёров',
		orgId: 'school',
		date: day(8),
		time: '11:00–15:00',
		place: 'Школа волонтёров',
		spots: 25,
		hours: 4,
		tags: ['health', 'education'],
		description: 'Практика с инструктором и именной сертификат по итогам.',
		tasks: [
			'Освоить сердечно-лёгочную реанимацию на манекене',
			'Научиться накладывать повязки',
			'Сдать мини-тест'
		],
		requirements: ['Возраст от 14 лет'],
		emoji: '🩹',
		tone: 'yellow',
		questions: q()
	},
	{
		id: 'o8',
		category: 'project',
		title: 'Эко-марафон «Ноль отходов в школе»',
		orgId: 'eco',
		date: day(18),
		time: '6 недель',
		place: 'Школы Бишкека',
		spots: 16,
		hours: 18,
		tags: ['ecology', 'education'],
		description: 'Запускаем раздельный сбор в 5 школах и проводим уроки для младших классов.',
		tasks: [
			'Поставить контейнеры и сделать навигацию',
			'Провести 3 эко-урока для начальной школы',
			'Считать собранное вторсырьё каждую неделю'
		],
		requirements: ['Возраст от 14 лет', 'Свободные 2 часа в неделю'],
		emoji: '♻️',
		tone: 'green',
		deadline: day(12),
		questions: q()
	},
	{
		id: 'o9',
		category: 'action',
		title: 'Забег «Добрые километры»',
		orgId: 'care',
		date: day(20),
		time: '08:00–12:00',
		place: 'Бишкек, Южная магистраль',
		spots: 60,
		hours: 4,
		tags: ['sport', 'charity'],
		description: 'Волонтёры на старте, пунктах воды и регистрации. Все взносы — в фонд.',
		tasks: ['Выдавать стартовые номера', 'Работать на пункте воды', 'Встречать финишёров'],
		requirements: ['Возраст от 14 лет'],
		emoji: '🏃',
		tone: 'blue',
		questions: q()
	},
	{
		id: 'o12',
		category: 'training',
		title: 'Интенсив «Социальное предпринимательство»',
		orgId: 'school',
		date: day(13),
		time: '15:00–19:00',
		place: 'Технопарк, ауд. 204',
		spots: 30,
		hours: 4,
		tags: ['business', 'education'],
		description:
			'Придумываем бизнес, который решает социальную проблему, и защищаем идею перед менторами.',
		tasks: [
			'Найти проблему и аудиторию',
			'Собрать модель на одной странице',
			'Защитить идею за 3 минуты'
		],
		requirements: ['Возраст от 14 лет', 'Ноутбук или планшет'],
		emoji: '💡',
		tone: 'blue',
		questions: q(),
		promotedUntil: day(6)
	},
	{
		id: 'o13',
		category: 'meeting',
		title: 'Благотворительная ярмарка поделок',
		orgId: 'care',
		date: day(16),
		time: '11:00–16:00',
		place: 'Площадь Ала-Тоо',
		spots: 25,
		hours: 5,
		tags: ['charity', 'culture', 'business'],
		description:
			'Продаём поделки ребят из творческих кружков, вся выручка — на лекарства для пожилых.',
		tasks: ['Оформить прилавки', 'Помогать с продажей и кассой', 'Рассказывать гостям о фонде'],
		requirements: ['Возраст от 14 лет'],
		emoji: '🧺',
		tone: 'peach',
		questions: q()
	},
	// Прошедшие события — для истории участия и архива
	{
		id: 'o10',
		category: 'action',
		title: 'Посадка деревьев у озера',
		orgId: 'eco',
		date: day(-20),
		time: '09:00–15:00',
		place: 'Иссык-Куль, Чолпон-Ата',
		spots: 25,
		hours: 6,
		tags: ['ecology'],
		description: 'Посадили 120 саженцев облепихи вдоль берега.',
		tasks: ['Копать лунки', 'Сажать саженцы', 'Поливать и мульчировать'],
		requirements: [],
		emoji: '🌲',
		tone: 'green',
		questions: q()
	},
	{
		id: 'o11',
		category: 'project',
		title: 'Фотопроект «Хвосты ищут дом»',
		orgId: 'paws',
		date: day(-35),
		time: '1 месяц',
		place: 'Приют «Лапа помощи»',
		spots: 6,
		hours: 12,
		tags: ['animals', 'media'],
		description: 'Фотосессии для собак из приюта: 14 питомцев нашли хозяев.',
		tasks: ['Фотосессии питомцев', 'Обработка фото', 'Публикация анкет'],
		requirements: [],
		emoji: '📸',
		tone: 'peach',
		questions: q()
	}
];

const answers = (why: string) => ({ 'q-why': why, 'q-exp': 'Пару раз' });

export const seedApplications: Application[] = [
	{
		id: 'a1',
		opportunityId: 'o10',
		personId: ME,
		status: 'approved',
		createdAt: ago(60 * 24 * 30),
		answers: {},
		role: 'Волонтёр-посадчик'
	},
	{
		id: 'a2',
		opportunityId: 'o11',
		personId: ME,
		status: 'approved',
		createdAt: ago(60 * 24 * 45),
		answers: {},
		role: 'Фотограф'
	},
	{
		id: 'a8',
		opportunityId: 'o5',
		personId: ME,
		status: 'approved',
		createdAt: ago(60 * 24 * 2),
		answers: answers('Хочу узнать планы клуба на зиму'),
		role: 'Участник'
	},
	{
		id: 'a9',
		opportunityId: 'o2',
		personId: ME,
		status: 'pending',
		createdAt: ago(60 * 5),
		answers: { ...answers('Обожаю собак, у меня есть корги'), 'q-dogs': 'Есть своя собака' }
	},
	{
		id: 'a3',
		opportunityId: 'o1',
		personId: 'p1',
		status: 'pending',
		createdAt: ago(90),
		answers: {
			'q-name': 'Тимур Абдыкадыров',
			'q-age': '16',
			'q-contact': '@timur_run',
			...answers('Хочу помочь парку рядом с домом, уже участвовал в двух субботниках.')
		}
	},
	{
		id: 'a4',
		opportunityId: 'o1',
		personId: 'p5',
		status: 'pending',
		createdAt: ago(240),
		answers: {
			'q-name': 'Данияр Омуров',
			'q-age': '14',
			'q-contact': '+996 555 010 203',
			'q-why': 'Мне 14, но я очень хочу сажать деревья! Приду с папой.',
			'q-exp': 'Это мой первый раз'
		}
	},
	{
		id: 'a5',
		opportunityId: 'o8',
		personId: 'p3',
		status: 'pending',
		createdAt: ago(600),
		answers: {
			'q-name': 'Миша Ли',
			'q-age': '17',
			'q-contact': '@misha_li',
			...answers('Могу вести уроки для младших, у меня есть опыт вожатого.')
		}
	},
	{
		id: 'a6',
		opportunityId: 'o5',
		personId: 'p4',
		status: 'approved',
		createdAt: ago(1500),
		answers: answers('Хочу познакомиться с командой.')
	},
	{
		id: 'a7',
		opportunityId: 'o1',
		personId: 'p6',
		status: 'approved',
		createdAt: ago(3000),
		answers: answers('Сниму видео для соцсетей клуба.')
	},
	{
		id: 'a10',
		opportunityId: 'o10',
		personId: 'p1',
		status: 'approved',
		createdAt: ago(60 * 24 * 31),
		answers: {},
		role: 'Волонтёр-посадчик'
	},
	{
		id: 'a11',
		opportunityId: 'o10',
		personId: 'p5',
		status: 'approved',
		createdAt: ago(60 * 24 * 31),
		answers: {},
		role: 'Волонтёр-посадчик'
	}
];

export const seedHours: HoursEntry[] = [
	{
		id: 'h1',
		personId: ME,
		orgId: 'eco',
		opportunityId: 'o10',
		title: 'Посадка деревьев у озера',
		date: day(-20),
		hours: 6,
		status: 'verified',
		note: ''
	},
	{
		id: 'h2',
		personId: ME,
		orgId: 'paws',
		opportunityId: 'o11',
		title: 'Фотопроект «Хвосты ищут дом»',
		date: day(-35),
		hours: 12,
		status: 'verified',
		note: ''
	},
	{
		id: 'h3',
		personId: ME,
		orgId: 'paws',
		title: 'Выгул собак',
		date: day(-13),
		hours: 3,
		status: 'verified',
		note: ''
	},
	{
		id: 'h4',
		personId: ME,
		orgId: 'care',
		title: 'Упаковка продуктовых наборов',
		date: day(-6),
		hours: 4,
		status: 'verified',
		note: ''
	},
	{
		id: 'h5',
		personId: ME,
		orgId: 'paws',
		title: 'Выгул собак',
		date: day(-2),
		hours: 2,
		status: 'pending',
		note: 'Гуляли с Бимом и Лаки'
	},
	{
		id: 'h6',
		personId: 'p1',
		orgId: 'eco',
		opportunityId: 'o10',
		title: 'Посадка деревьев у озера',
		date: day(-20),
		hours: 6,
		status: 'pending',
		note: 'Был на посадке весь день'
	},
	{
		id: 'h7',
		personId: 'p6',
		orgId: 'eco',
		title: 'Съёмка видео для клуба',
		date: day(-4),
		hours: 3,
		status: 'pending',
		note: 'Ролик про сортировку мусора'
	},
	{
		id: 'h8',
		personId: 'p5',
		orgId: 'eco',
		opportunityId: 'o10',
		title: 'Посадка деревьев у озера',
		date: day(-20),
		hours: 6,
		status: 'verified',
		note: ''
	}
];

export const seedPosts: Post[] = [
	{
		id: 's1',
		authorId: 'p2',
		kind: 'review',
		text: 'Первый день в приюте! Бим сначала боялся, а через час уже приносил мячик 🥹 Кураторы всё объяснили, очень рекомендую.',
		media: { type: 'short', tone: 'peach', emoji: '🐕', duration: 24, caption: 'Бим и мячик' },
		opportunityId: 'o2',
		orgId: 'paws',
		likes: 128,
		liked: false,
		shares: 14,
		comments: [
			{
				id: 'c1',
				authorId: 'p5',
				text: 'Бим лучший! Я тоже хожу по воскресеньям',
				createdAt: ago(50)
			},
			{
				id: 'c2',
				authorId: 'paws',
				text: 'Спасибо, Аружан! Ждём всех в субботу в 11:00 🐾',
				createdAt: ago(30)
			}
		],
		createdAt: ago(75)
	},
	{
		id: 's2',
		authorId: 'eco',
		kind: 'post',
		text: 'Итоги посадки у Иссык-Куля: 120 саженцев облепихи и 25 волонтёров. Спасибо каждому, кто приехал в 7 утра! 🌲',
		media: { type: 'photo', tone: 'green', emoji: '🌲' },
		opportunityId: 'o10',
		orgId: 'eco',
		likes: 342,
		liked: true,
		shares: 41,
		comments: [
			{ id: 'c3', authorId: ME, text: 'Это было лучшее утро осени!', createdAt: ago(60 * 20) }
		],
		createdAt: ago(60 * 26)
	},
	{
		id: 's3',
		authorId: 'p3',
		kind: 'review',
		text: 'Провёл чтения в селе Беловодское. Дети попросили ещё про космос, так что везём новые книги. Школа волонтёров — лучшие организаторы, всё чётко по плану.',
		orgId: 'school',
		opportunityId: 'o4',
		likes: 87,
		liked: false,
		shares: 9,
		comments: [],
		createdAt: ago(60 * 5)
	},
	{
		id: 's4',
		authorId: 'p6',
		kind: 'post',
		text: 'Как сортировать мусор за 30 секунд. Сохраняйте и отправляйте родителям 😄',
		media: {
			type: 'short',
			tone: 'lilac',
			emoji: '♻️',
			duration: 31,
			caption: 'Сортировка за 30 секунд'
		},
		orgId: 'eco',
		likes: 506,
		liked: false,
		shares: 120,
		comments: [
			{
				id: 'c4',
				authorId: 'p1',
				text: 'Наконец понял, куда девать тетрапак',
				createdAt: ago(60 * 9)
			}
		],
		createdAt: ago(60 * 10)
	},
	{
		id: 's5',
		authorId: 'p4',
		kind: 'review',
		text: 'Отзыв о фонде «Тёплые руки»: заботливые кураторы, всё объяснили, дали чай и пледы, а часы подтвердили в тот же вечер. 10/10 рекомендую новичкам 💙',
		media: { type: 'photo', tone: 'blue', emoji: '🧣' },
		orgId: 'care',
		likes: 64,
		liked: false,
		shares: 3,
		comments: [],
		createdAt: ago(60 * 30)
	},
	{
		id: 's6',
		authorId: 'media',
		kind: 'post',
		text: 'Документальный фильм «Лес у озера»: как 25 подростков за один день посадили рощу. Смотрите до конца — там сюрприз от местных жителей 🎥',
		media: { type: 'video', tone: 'green', emoji: '🎥', duration: 252, caption: 'Лес у озера' },
		opportunityId: 'o10',
		orgId: 'media',
		likes: 219,
		liked: false,
		shares: 37,
		comments: [{ id: 'c5', authorId: 'p1', text: 'Я в кадре на 2:15 😎', createdAt: ago(60 * 40) }],
		createdAt: ago(60 * 44)
	},
	{
		id: 's7',
		authorId: 'p1',
		kind: 'post',
		text: '5 вещей, которые я понял за год волонтёрства:\n1. Добрые дела заразны\n2. Перчатки — лучший подарок\n3. Часы — не главное, люди — главное\n4. Бояться звонить организаторам не надо\n5. Начни с одного субботника',
		likes: 151,
		liked: false,
		shares: 22,
		comments: [],
		createdAt: ago(60 * 52)
	},
	{
		id: 's8',
		authorId: 'p2',
		kind: 'post',
		text: 'Фотосессия для Лаки — ищет дом! Ласковая, 2 года, стерилизована 🧡',
		media: { type: 'photo', tone: 'peach', emoji: '🐩' },
		orgId: 'paws',
		likes: 402,
		liked: false,
		shares: 88,
		comments: [],
		createdAt: ago(60 * 70)
	},
	{
		id: 's9',
		authorId: ME,
		kind: 'review',
		text: 'Посадка у озера — мой лучший день этой осенью. Эко-клуб организовал всё идеально: автобус, обед и даже гитара у костра 🌲',
		media: { type: 'photo', tone: 'green', emoji: '🌿' },
		opportunityId: 'o10',
		orgId: 'eco',
		likes: 58,
		liked: false,
		shares: 2,
		comments: [],
		createdAt: ago(60 * 24 * 18)
	},
	{
		id: 's10',
		authorId: ME,
		kind: 'post',
		text: 'Мой первый ролик про приют. Бим теперь звезда!',
		media: { type: 'short', tone: 'yellow', emoji: '🐶', duration: 18, caption: 'Бим — звезда' },
		orgId: 'paws',
		likes: 97,
		liked: false,
		shares: 6,
		comments: [],
		createdAt: ago(60 * 24 * 30)
	}
];

export const seedAwards: Award[] = [
	{
		id: 'aw1',
		type: 'medal',
		tier: 'gold',
		title: 'Лучший волонтёр месяца',
		description: 'За 3 акции подряд и помощь новичкам.',
		personId: ME,
		orgId: 'eco',
		date: day(-10)
	},
	{
		id: 'aw2',
		type: 'medal',
		tier: 'silver',
		title: 'Фото-герой приюта',
		description: '14 питомцев нашли дом благодаря вашим фотографиям.',
		personId: ME,
		orgId: 'paws',
		opportunityId: 'o11',
		date: day(-30)
	},
	{
		id: 'aw3',
		type: 'cup',
		tier: 'bronze',
		title: 'Кубок «Зелёная команда»',
		description: '3 место в осеннем эко-рейтинге клуба.',
		personId: ME,
		orgId: 'eco',
		date: day(-15)
	},
	{
		id: 'aw4',
		type: 'certificate',
		tier: 'gold',
		title: 'Благодарность за посадку деревьев',
		description: 'За участие в посадке 120 саженцев у Иссык-Куля.',
		personId: ME,
		orgId: 'eco',
		opportunityId: 'o10',
		date: day(-18),
		fileName: 'blagodarnost-eco.pdf'
	},
	{
		id: 'aw5',
		type: 'certificate',
		tier: 'silver',
		title: 'Сертификат «Основы волонтёрства»',
		description: 'Курс из 4 занятий Школы волонтёров.',
		personId: ME,
		orgId: 'school',
		date: day(-60),
		fileName: 'osnovy-volonterstva.pdf'
	},
	{
		id: 'aw6',
		type: 'cup',
		tier: 'gold',
		title: 'Кубок марафонца добра',
		description: 'Больше всех часов на спортивных событиях.',
		personId: 'p1',
		orgId: 'care',
		date: day(-40)
	},
	{
		id: 'aw7',
		type: 'medal',
		tier: 'bronze',
		title: 'Первая посадка',
		description: 'За участие в посадке у озера.',
		personId: 'p5',
		orgId: 'eco',
		opportunityId: 'o10',
		date: day(-19)
	},
	{
		id: 'aw8',
		type: 'medal',
		tier: 'gold',
		title: 'Голос приюта',
		description: 'Самые популярные ролики о питомцах.',
		personId: 'p2',
		orgId: 'paws',
		date: day(-25)
	}
];

export const seedMemberships: Membership[] = [
	{ orgId: 'eco', role: 'Активист клуба', since: day(-120) },
	{ orgId: 'paws', role: 'Волонтёр по выгулу', since: day(-60) },
	{ orgId: 'media', role: 'Участник', since: day(-30) }
];

export const seedThreads: Thread[] = [
	{
		id: 'o5__me',
		opportunityId: 'o5',
		personId: ME,
		messages: [
			{ id: 'm1', from: ME, text: 'Здравствуйте! Можно прийти с подругой?', at: ago(60 * 20) },
			{
				id: 'm2',
				from: 'eco',
				text: 'Конечно! Только пусть тоже подаст заявку, чтобы хватило пиццы 🙂',
				at: ago(60 * 19)
			}
		]
	},
	{
		id: 'o1__p1',
		opportunityId: 'o1',
		personId: 'p1',
		messages: [
			{ id: 'm3', from: 'p1', text: 'Нужно ли брать свои перчатки или выдадут?', at: ago(45) }
		]
	},
	{
		id: 'o2__me',
		opportunityId: 'o2',
		personId: ME,
		messages: [
			{
				id: 'm4',
				from: ME,
				text: 'Подскажите, во сколько начинается первая прогулка?',
				at: ago(60 * 3)
			},
			{
				id: 'm5',
				from: 'paws',
				text: 'В субботу в 11:00, инструктаж займёт 20 минут. До встречи!',
				at: ago(60 * 2)
			}
		]
	}
];

export const seedAnnouncements: Announcement[] = [
	{
		id: 'n1',
		opportunityId: 'o5',
		title: 'Место встречи',
		text: 'Встречаемся в коворкинге «Платформа», 3 этаж. Вход со стороны парка.',
		at: ago(60 * 24)
	},
	{
		id: 'n2',
		opportunityId: 'o5',
		title: 'Голосование за лучшего волонтёра',
		text: 'До пятницы можно предложить кандидата в комментариях к посту клуба.',
		at: ago(60 * 6)
	},
	{
		id: 'n3',
		opportunityId: 'o1',
		title: 'Что взять с собой',
		text: 'Перчатки выдадим, но возьмите воду и головной убор. Сбор у фонтана.',
		at: ago(60 * 10)
	},
	{
		id: 'n4',
		opportunityId: 'o2',
		title: 'Обучение в первый день',
		text: 'Первое занятие — инструктаж с кинологом. Приходите в удобной обуви.',
		at: ago(60 * 30)
	}
];

export const seedAlerts: Alert[] = [
	{
		id: 'al1',
		to: 'volunteer',
		emoji: '✅',
		text: 'Заявка на «Встреча волонтёров: итоги сезона» подтверждена',
		at: ago(60 * 24 * 2),
		href: '/o?id=o5',
		read: false
	},
	{
		id: 'al2',
		to: 'volunteer',
		emoji: '🏅',
		text: 'Эко-клуб вручил вам медаль «Лучший волонтёр месяца»',
		at: ago(60 * 24 * 10),
		href: '/awards',
		read: true
	},
	{
		id: 'al3',
		to: 'org',
		emoji: '📝',
		text: 'Тимур Абдыкадыров подал заявку на «Субботник в парке Ататюрка»',
		at: ago(90),
		href: '/cabinet?folder=applications',
		read: false
	},
	{
		id: 'al4',
		to: 'org',
		emoji: '💬',
		text: 'Новый вопрос по «Субботнику в парке Ататюрка»',
		at: ago(45),
		href: '/chat?id=o1__p1',
		read: false
	}
];

/** На кого я подписана и кто подписан на меня */
export const seedFollowing = ['eco', 'paws', 'p2'];
export const seedFollowers = ['p1', 'p2', 'p4', 'p6', 'p5'];
export const seedOrgFollowers = ['p1', 'p3', 'p4', 'p5', 'p6'];
