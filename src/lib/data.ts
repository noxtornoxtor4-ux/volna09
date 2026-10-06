import { CalendarHeart, GraduationCap, HandHeart, Megaphone, Rocket } from '@lucide/svelte';
import type {
	Accent,
	Application,
	Category,
	Certificate,
	HoursEntry,
	Interest,
	Membership,
	Opportunity,
	Organization,
	Person,
	Plan,
	Post,
	Profile,
	Tone
} from './types.ts';

/** Локальная дата со сдвигом в днях, формат YYYY-MM-DD */
export function day(offset = 0) {
	const date = new Date();
	date.setDate(date.getDate() + offset);
	return date.toLocaleDateString('sv-SE');
}

const ago = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();

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

export const interests: Record<Interest, { label: string; emoji: string }> = {
	ecology: { label: 'Экология', emoji: '🌱' },
	animals: { label: 'Животные', emoji: '🐾' },
	education: { label: 'Образование', emoji: '📚' },
	social: { label: 'Помощь людям', emoji: '🤝' },
	sport: { label: 'Спорт', emoji: '⚽' },
	culture: { label: 'Культура', emoji: '🎭' },
	media: { label: 'Медиа', emoji: '🎬' },
	health: { label: 'Здоровье', emoji: '💚' }
};

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
export const toneClass: Record<Tone, { bg: string; text: string }> = {
	blue: { bg: 'bg-pastel-blue', text: 'text-pastel-blue-ink' },
	yellow: { bg: 'bg-pastel-yellow', text: 'text-pastel-yellow-ink' },
	green: { bg: 'bg-pastel-green', text: 'text-pastel-green-ink' },
	lilac: { bg: 'bg-pastel-lilac', text: 'text-pastel-lilac-ink' },
	peach: { bg: 'bg-pastel-peach', text: 'text-pastel-peach-ink' }
};

export const organizations: Organization[] = [
	{ id: 'eco', name: 'Эко-клуб «Зелёный город»', tone: 'green', emoji: '🌳', verified: true },
	{ id: 'paws', name: 'Приют «Лапа помощи»', tone: 'peach', emoji: '🐶', verified: true },
	{ id: 'school', name: 'Школа волонтёров', tone: 'yellow', emoji: '🎓', verified: true },
	{ id: 'media', name: 'Медиа-клуб «Голос»', tone: 'lilac', emoji: '🎙️', verified: false },
	{ id: 'care', name: 'Фонд «Тёплые руки»', tone: 'blue', emoji: '🧣', verified: true }
];

export const people: Person[] = [
	{
		id: 'p1',
		name: 'Тимур Абдыкадыров',
		age: 16,
		city: 'Бишкек',
		tone: 'blue',
		interests: ['ecology', 'sport']
	},
	{
		id: 'p2',
		name: 'Аружан Сапарова',
		age: 15,
		city: 'Бишкек',
		tone: 'yellow',
		interests: ['animals', 'media']
	},
	{
		id: 'p3',
		name: 'Миша Ли',
		age: 17,
		city: 'Ош',
		tone: 'lilac',
		interests: ['education', 'culture']
	},
	{
		id: 'p4',
		name: 'Камила Исаева',
		age: 16,
		city: 'Бишкек',
		tone: 'peach',
		interests: ['social', 'health']
	},
	{
		id: 'p5',
		name: 'Данияр Омуров',
		age: 14,
		city: 'Каракол',
		tone: 'green',
		interests: ['ecology', 'animals']
	},
	{
		id: 'p6',
		name: 'Соня Белова',
		age: 17,
		city: 'Бишкек',
		tone: 'blue',
		interests: ['media', 'culture']
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
		emoji: '🌳',
		tone: 'green',
		deadline: day(3)
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
		tags: ['animals'],
		description:
			'Ищем ответственных ребят 14+ для регулярных прогулок с собаками. Обучение в первый день.',
		emoji: '🐕',
		tone: 'peach',
		deadline: day(7)
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
		tags: ['media', 'social'],
		description: 'Разберём сценарий, свет и монтаж на телефоне. В конце — съёмка ролика для фонда.',
		emoji: '🎬',
		tone: 'lilac'
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
		emoji: '📚',
		tone: 'yellow',
		deadline: day(10)
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
		tags: ['ecology', 'social'],
		description: 'Пицца, награждение лучших волонтёров и планы на зиму.',
		emoji: '🍕',
		tone: 'lilac'
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
		tags: ['social', 'health'],
		description: 'Принимаем и сортируем вещи, упаковываем наборы для одиноких пожилых людей.',
		emoji: '🧣',
		tone: 'blue'
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
		emoji: '🩹',
		tone: 'yellow'
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
		emoji: '♻️',
		tone: 'green',
		deadline: day(12)
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
		tags: ['sport', 'social'],
		description: 'Волонтёры на старте, пунктах воды и регистрации. Все взносы — в фонд.',
		emoji: '🏃',
		tone: 'blue'
	},
	// Прошедшие события — для истории участия
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
		emoji: '🌲',
		tone: 'green'
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
		emoji: '📸',
		tone: 'peach'
	}
];

export const seedApplications: Application[] = [
	{
		id: 'a1',
		opportunityId: 'o10',
		personId: ME,
		status: 'approved',
		createdAt: ago(60 * 24 * 30),
		motivation: '',
		role: 'Волонтёр-посадчик'
	},
	{
		id: 'a2',
		opportunityId: 'o11',
		personId: ME,
		status: 'approved',
		createdAt: ago(60 * 24 * 45),
		motivation: '',
		role: 'Фотограф'
	},
	{
		id: 'a3',
		opportunityId: 'o1',
		personId: 'p1',
		status: 'pending',
		createdAt: ago(90),
		motivation: 'Хочу помочь парку рядом с домом, уже участвовал в двух субботниках.'
	},
	{
		id: 'a4',
		opportunityId: 'o1',
		personId: 'p5',
		status: 'pending',
		createdAt: ago(240),
		motivation: 'Мне 14, но я очень хочу сажать деревья! Приду с папой.'
	},
	{
		id: 'a5',
		opportunityId: 'o8',
		personId: 'p3',
		status: 'pending',
		createdAt: ago(600),
		motivation: 'Могу вести уроки для младших, у меня есть опыт вожатого.'
	},
	{
		id: 'a6',
		opportunityId: 'o5',
		personId: 'p4',
		status: 'approved',
		createdAt: ago(1500),
		motivation: 'Хочу познакомиться с командой.'
	},
	{
		id: 'a7',
		opportunityId: 'o1',
		personId: 'p6',
		status: 'approved',
		createdAt: ago(3000),
		motivation: 'Сниму видео для соцсетей клуба.'
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
	}
];

export const seedPosts: Post[] = [
	{
		id: 's1',
		authorId: 'p2',
		text: 'Первый день в приюте! Бим сначала боялся, а через час уже приносил мячик 🥹 Кто хочет с нами по субботам — набор открыт.',
		media: { type: 'video', tone: 'peach', emoji: '🐕', duration: 24 },
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
		text: 'Провёл чтения в селе Беловодское. Дети попросили ещё про космос, так что везём новые книги. Если у вас дома лежат детские энциклопедии — приносите в Школу волонтёров!',
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
		text: 'Сняла короткий ролик о том, как правильно сортировать мусор за 30 секунд. Сохраняйте и отправляйте родителям 😄',
		media: { type: 'video', tone: 'lilac', emoji: '♻️', duration: 31 },
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
		text: 'Отзыв о фонде «Тёплые руки»: очень заботливые кураторы, всё объяснили, дали чай и пледы, а часы подтвердили в тот же вечер. 10/10 рекомендую новичкам 💙',
		media: { type: 'photo', tone: 'blue', emoji: '🧣' },
		orgId: 'care',
		likes: 64,
		liked: false,
		shares: 3,
		comments: [],
		createdAt: ago(60 * 30)
	}
];

export const seedCertificates: Certificate[] = [
	{
		id: 'cert1',
		title: 'Благодарность за посадку деревьев',
		issuer: 'Эко-клуб «Зелёный город»',
		date: day(-18),
		fileName: 'blagodarnost-eco.pdf',
		tone: 'green'
	},
	{
		id: 'cert2',
		title: 'Сертификат «Основы волонтёрства»',
		issuer: 'Школа волонтёров',
		date: day(-60),
		fileName: 'osnovy-volonterstva.pdf',
		tone: 'yellow'
	}
];

export const seedMemberships: Membership[] = [
	{ orgId: 'eco', role: 'Активист клуба', since: day(-120) },
	{ orgId: 'paws', role: 'Волонтёр по выгулу', since: day(-60) },
	{ orgId: 'media', role: 'Участник', since: day(-30) }
];

export const seedPlans: Plan[] = [{ id: 'pl1', date: day(5), title: 'Выгул собак в приюте' }];
