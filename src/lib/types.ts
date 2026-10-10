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

/** Организация на платформе. Страницу ведут её кураторы (ownerIds) */
export interface Organization extends OrgProfile {
	id: string;
	tone: Tone;
	emoji: string;
	/** Синий бейдж «Верифицированная организация» — ставит только модератор */
	verified: boolean;
	ownerIds: string[];
	/** Заявка на проверку документов */
	verification?: OrgVerification;
	createdAt: string;
}

export type VerificationStatus = 'pending' | 'approved' | 'rejected' | 'needs_info';

/** Заявка организации на статус «Проверенный организатор» */
export interface OrgVerification {
	status: VerificationStatus;
	/** Устав, письмо, справка от учебного заведения или НКО */
	docs: { fileId: string; name: string; mime: string }[];
	/** Сайт и соцсети */
	links: string;
	note: string;
	/** Причина отказа или вопрос модератора */
	message?: string;
	requestedAt: string;
	reviewedAt?: string;
	reviewerId?: string;
}

/** Публичный профиль пользователя. Телефон и почта сюда не попадают */
export interface Person extends Profile {
	id: string;
	/** На кого подписан: волонтёры и организации */
	following: string[];
	privacy?: Privacy;
	/** Организация, которую ведёт этот пользователь */
	orgId?: string;
	/** Согласие с условиями и (для младше 18) разрешение родителей */
	consent?: Consent;
	/** Предупреждения модератора */
	warnings?: { reason: string; at: string; by: string }[];
	/** Блокировка: until — до какого времени, без until — навсегда */
	ban?: { reason: string; at: string; by: string; until?: string };
	createdAt: string;
}

export interface Consent {
	/** Мне исполнилось 14 лет, согласен с Условиями и Политикой */
	terms: true;
	/** Мне уже есть 18 лет */
	adult: boolean;
	/** Есть разрешение родителей или опекунов (обязательно, если младше 18) */
	parental: boolean;
	at: string;
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
	/** Снято модератором с публикации */
	removed?: { reason: string; by: string; at: string };
	/** Модератор просмотрел мероприятие */
	reviewedBy?: string;
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
	/** Как начислены: QR на месте, ведомость куратора, решение модератора */
	source?: 'qr' | 'roster' | 'moderator' | 'request';
}

/** short — вертикальное видео, video — длинное горизонтальное */
export type MediaType = 'photo' | 'short' | 'video';

export interface Media {
	type: MediaType;
	tone: Tone;
	emoji: string;
	/** Фото пользователя (data URL) или временная ссылка на видео до публикации */
	src?: string;
	/** Видео в Cloudinary — его видят все пользователи */
	url?: string;
	/** Ключ видеофайла: на устройстве (IndexedDB) и частями в Firestore */
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
	/** Кто поставил «нравится» */
	likedBy: string[];
	/** Видео скрыто автором: не показывается в ленте и профиле, но не удалено */
	hidden?: boolean;
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
	/** Сертификат, выданный организацией через платформу: проверяется по ссылке /verify/ID */
	certificateId?: string;
	/** Действителен или отозван модератором */
	status?: 'valid' | 'revoked';
	revokedReason?: string;
	/** Подтверждённые часы, за которые выдан сертификат */
	hours?: number;
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
	/** Приглашение в видеозвонок: код комнаты для /call */
	call?: string;
}

/** Переписка волонтёра с организатором по конкретному мероприятию */
export interface Thread {
	id: string;
	opportunityId: string;
	personId: string;
	/** Волонтёр и организация — для загрузки только своих вопросов */
	members: string[];
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
	/** Получатель: id волонтёра или организации */
	to: string;
	text: string;
	at: string;
	href?: string;
	read: boolean;
	emoji: string;
}

export interface DayPhoto {
	id: string;
	/** Чей календарь: id волонтёра или организации */
	ownerId: string;
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
	/** Видео-постер в Cloudinary */
	coverVideoUrl?: string;
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
	method: 'phone' | 'email' | 'google';
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
	/** Видео в Cloudinary */
	videoUrl?: string;
	poster?: string;
	/** Скрыто автором из списка работ, но не удалено */
	hidden?: boolean;
	createdAt: string;
}

/** Свои цвета логотипа на этом устройстве */
export interface LogoColors {
	/** Значок и волна в надписи WAVE */
	icon: string;
	/** Название «Волна» и блоки букв WAVE */
	text: string;
}

/** Своя тема в папке «Мои темы» */
export interface SavedTheme {
	id: string;
	name: string;
	theme: CustomTheme;
	createdAt: string;
	updatedAt: string;
}

export type ModeratorRole = 'moderator' | 'admin';

/** Жалоба пользователя на контент */
export interface Report {
	id: string;
	targetType: 'post' | 'comment' | 'opportunity' | 'person';
	targetId: string;
	/** Пост, к которому относится комментарий */
	postId?: string;
	reason: string;
	reporterId: string;
	createdAt: string;
	status: 'open' | 'resolved' | 'dismissed';
	resolvedBy?: string;
}

/** Апелляция волонтёра по часам: не начислили или начислили неверно */
export interface Appeal {
	id: string;
	personId: string;
	orgId?: string;
	opportunityId?: string;
	text: string;
	status: 'open' | 'resolved' | 'rejected';
	response?: string;
	createdAt: string;
	resolvedAt?: string;
	resolvedBy?: string;
}

/** Запись журнала действий модераторов */
export interface AuditEntry {
	id: string;
	moderatorId: string;
	action: string;
	targetType: string;
	targetId: string;
	details: string;
	at: string;
}
