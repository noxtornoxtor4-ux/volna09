export type Role = 'volunteer' | 'org';

export type Category = 'project' | 'training' | 'action' | 'meeting' | 'recruitment';

/** Ключ пастельного цвета из дизайн-системы */
export type Tone = 'blue' | 'yellow' | 'green' | 'lilac' | 'peach';

export type Accent =
	| 'wave'
	| 'sky'
	| 'sun'
	| 'mint'
	| 'lilac'
	| 'peach'
	| 'lemon'
	| 'blush'
	| 'aqua'
	| 'orchid'
	| 'periwinkle';

/** Тема для сторисов и рекомендаций. Пользователи могут создавать свои */
export interface Topic {
	id: string;
	label: string;
	emoji: string;
	tone: Tone;
	custom?: boolean;
}

export interface Organization {
	id: string;
	name: string;
	tone: Tone;
	emoji: string;
	verified: boolean;
	city: string;
	about: string;
	followers: number;
}

export interface Person {
	id: string;
	name: string;
	age: number;
	city: string;
	tone: Tone;
	interests: string[];
	bio: string;
	followers: number;
}

export type QuestionType = 'text' | 'textarea' | 'choice' | 'multi';

/** Вопрос анкеты, которую организатор прикладывает к мероприятию */
export interface FormQuestion {
	id: string;
	label: string;
	type: QuestionType;
	options?: string[];
	required: boolean;
	/** Подставить ответ из профиля волонтёра */
	prefill?: 'name' | 'age' | 'city';
}

export interface Opportunity {
	id: string;
	category: Category;
	title: string;
	orgId: string;
	/** Дата в формате YYYY-MM-DD */
	date: string;
	time: string;
	/** Город проведения или «Онлайн» — по нему фильтруется лента волонтёра */
	city: string;
	place: string;
	spots: number;
	hours: number;
	/** Идентификаторы тем */
	tags: string[];
	description: string;
	tasks: string[];
	requirements: string[];
	emoji: string;
	tone: Tone;
	/** Дедлайн подачи заявок, YYYY-MM-DD */
	deadline?: string;
	/** Загруженный постер (data URL) */
	poster?: string;
	questions: FormQuestion[];
	/** До какой даты публикация продвигается, YYYY-MM-DD */
	promotedUntil?: string;
}

export type ApplicationStatus = 'pending' | 'approved' | 'declined';

export type Answers = Record<string, string | string[]>;

export interface Application {
	id: string;
	opportunityId: string;
	personId: string;
	status: ApplicationStatus;
	createdAt: string;
	answers: Answers;
	role?: string;
}

export type HoursStatus = 'pending' | 'verified' | 'rejected';

export interface HoursEntry {
	id: string;
	personId: string;
	orgId: string;
	opportunityId?: string;
	title: string;
	date: string;
	hours: number;
	status: HoursStatus;
	note: string;
}

/** short — вертикальное видео, video — длинное горизонтальное */
export type MediaType = 'photo' | 'short' | 'video';

export interface Media {
	type: MediaType;
	tone: Tone;
	emoji: string;
	/** Фото пользователя (data URL) или временная ссылка на видео до публикации */
	src?: string;
	/** Ключ видеофайла в IndexedDB — видео хранится на устройстве и переживает перезагрузку */
	videoId?: string;
	/** Превью видео (data URL): кадр из ролика или загруженная обложка */
	poster?: string;
	/** Длительность демо-ролика в секундах */
	duration?: number;
	/** Подпись к демо-ролику */
	caption?: string;
}

export interface Comment {
	id: string;
	authorId: string;
	text: string;
	createdAt: string;
}

/** review — отзыв об опыте, post — обычная публикация для рекомендаций */
export interface Post {
	id: string;
	authorId: string;
	kind: 'review' | 'post';
	text: string;
	media?: Media;
	opportunityId?: string;
	orgId?: string;
	likes: number;
	liked: boolean;
	shares: number;
	comments: Comment[];
	createdAt: string;
}

export type AwardType = 'medal' | 'cup' | 'certificate';
export type AwardTier = 'gold' | 'silver' | 'bronze';

export interface Award {
	id: string;
	type: AwardType;
	tier: AwardTier;
	title: string;
	description: string;
	personId: string;
	/** Кто выдал. Пусто, если волонтёр загрузил документ сам */
	orgId?: string;
	opportunityId?: string;
	date: string;
	fileName?: string;
	/** Превью: сама фотография сертификата (уменьшенная) */
	src?: string;
	/** Кто выдал — для сертификатов, загруженных волонтёром */
	issuer?: string;
	/** Навыки, которые подтверждает сертификат */
	skillIds?: string[];
	/** Фото бумажного документа или цифровая версия (изображение, PDF) */
	format?: 'photo' | 'digital';
	/** Оригинал файла в хранилище медиа */
	fileId?: string;
	mime?: string;
}

export interface Membership {
	orgId: string;
	role: string;
	since: string;
}

export interface Message {
	id: string;
	from: string;
	text: string;
	at: string;
}

/** Переписка волонтёра с организатором по конкретному мероприятию */
export interface Thread {
	id: string;
	opportunityId: string;
	personId: string;
	messages: Message[];
}

/** Уведомление организатора для всех участников мероприятия */
export interface Announcement {
	id: string;
	opportunityId: string;
	title: string;
	text: string;
	at: string;
}

/** Личное событие: смена статуса заявки, награда, новая заявка и т.п. */
export interface Alert {
	id: string;
	to: Role;
	text: string;
	at: string;
	href?: string;
	read: boolean;
	emoji: string;
}

export interface DayPhoto {
	id: string;
	owner: Role;
	date: string;
	src: string;
}

/** Оформление профиля: постер (шаблон, фото или видео) и аватар (фото или эмодзи) */
export interface ProfileLook {
	avatar?: string;
	avatarEmoji?: string;
	cover?: string;
	coverPreset?: string;
	/** Видео-постер, хранится в IndexedDB */
	coverVideoId?: string;
	/** Оттенок профиля (#rrggbb): шапка, обводка аватара, кнопки и значки. Виден всем */
	tint?: string;
}

export interface Profile extends ProfileLook {
	name: string;
	age: number;
	city: string;
	bio: string;
	interests: string[];
	tone: Tone;
}

/** Баннер на странице организации: набор, акция или важное объявление */
export interface OrgBanner {
	title: string;
	text: string;
	ctaLabel?: string;
	/** Ссылка кнопки: мероприятие организации или внешний адрес */
	ctaHref?: string;
	tone: Tone;
}

export interface OrgNews {
	id: string;
	title: string;
	text: string;
	date: string;
}

export interface OrgProfile extends ProfileLook {
	name: string;
	city: string;
	about: string;
	/** Цвет страницы организации */
	tone?: Tone;
	website?: string;
	telegram?: string;
	banner?: OrgBanner;
	announcements?: OrgNews[];
}

export interface Privacy {
	publicProfile: boolean;
	showHours: boolean;
	searchable: boolean;
	messages: 'all' | 'orgs' | 'none';
}

export interface Session {
	method: 'phone' | 'email';
	contact: string;
	role: Role;
}

/** Личный диалог или групповой чат. Участники — волонтёры и организации */
export interface Conversation {
	id: string;
	kind: 'dm' | 'group';
	/** Название и иконка группы; у личного диалога берутся из профиля собеседника */
	title?: string;
	emoji?: string;
	tone?: Tone;
	/** Проект, который обсуждает группа */
	opportunityId?: string;
	members: string[];
	createdBy: string;
	createdAt: string;
	messages: Message[];
	/** Когда участник последний раз читал чат: id участника → ISO-время */
	lastRead: Record<string, string>;
}

export type ThemeMode = 'light' | 'dark' | 'system';

/** Своя палитра интерфейса (цвета #rrggbb), настраивается в «Стиль приложения» */
export interface CustomTheme {
	/** Основной фон экранов */
	bg: string;
	/** Карточки, списки, диалоги */
	surface: string;
	/** Основной текст и заголовки */
	ink: string;
	/** Второстепенный текст */
	muted: string;
	/** Кнопка в активном состоянии */
	button: string;
	/** Текст на кнопке */
	buttonInk: string;
	/** Кнопка при нажатии */
	buttonPressed: string;
	/** Акцентные элементы: переключатели, иконки меню, индикаторы */
	accent: string;
}

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

/** Навык волонтёра — отдельная сущность, к которой привязаны работы и сертификаты */
export interface Skill {
	id: string;
	personId: string;
	emoji: string;
	title: string;
	description: string;
	level?: SkillLevel;
	/** Основные навыки показываются в профиле первыми */
	featured: boolean;
	createdAt: string;
}

export type MaterialKind = 'photo' | 'text' | 'video';

/** Материал внутри навыка: фото работы, текст или видео */
export interface SkillMaterial {
	id: string;
	skillId: string;
	personId: string;
	kind: MaterialKind;
	text?: string;
	/** Фото работы (уменьшенное) */
	src?: string;
	/** Видео в хранилище медиа и его обложка */
	videoId?: string;
	poster?: string;
	createdAt: string;
}
