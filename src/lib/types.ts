export type Role = 'volunteer' | 'org';

export type Category = 'project' | 'training' | 'action' | 'meeting' | 'recruitment';

/** Ключ пастельного цвета из дизайн-системы */
export type Tone = 'blue' | 'yellow' | 'green' | 'lilac' | 'peach';

export type Accent =
	'sky' | 'sun' | 'mint' | 'lilac' | 'peach' | 'lemon' | 'blush' | 'aqua' | 'orchid' | 'periwinkle';

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
	/** Реальный файл, загруженный пользователем (data URL или object URL) */
	src?: string;
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
	src?: string;
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

export interface Profile {
	name: string;
	age: number;
	city: string;
	bio: string;
	interests: string[];
	tone: Tone;
	avatar?: string;
	cover?: string;
}

export interface OrgProfile {
	name: string;
	city: string;
	about: string;
	avatar?: string;
	cover?: string;
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
