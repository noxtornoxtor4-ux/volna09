export type Category = 'project' | 'training' | 'action' | 'meeting' | 'recruitment';

export type Interest =
	'ecology' | 'animals' | 'education' | 'social' | 'sport' | 'culture' | 'media' | 'health';

/** Ключ пастельного цвета из дизайн-системы */
export type Tone = 'blue' | 'yellow' | 'green' | 'lilac' | 'peach';

export type Accent =
	'sky' | 'sun' | 'mint' | 'lilac' | 'peach' | 'lemon' | 'blush' | 'aqua' | 'orchid' | 'periwinkle';

export interface Organization {
	id: string;
	name: string;
	tone: Tone;
	emoji: string;
	verified: boolean;
}

export interface Person {
	id: string;
	name: string;
	age: number;
	city: string;
	tone: Tone;
	interests: Interest[];
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
	tags: Interest[];
	description: string;
	emoji: string;
	tone: Tone;
	/** Дедлайн подачи заявок, YYYY-MM-DD */
	deadline?: string;
}

export type ApplicationStatus = 'pending' | 'approved' | 'declined';

export interface Application {
	id: string;
	opportunityId: string;
	personId: string;
	status: ApplicationStatus;
	createdAt: string;
	motivation: string;
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

export interface Media {
	type: 'photo' | 'video';
	tone: Tone;
	emoji: string;
	/** Реальный файл, загруженный пользователем (data URL или object URL) */
	src?: string;
	/** Длительность видео в секундах для демо-роликов */
	duration?: number;
}

export interface Comment {
	id: string;
	authorId: string;
	text: string;
	createdAt: string;
}

export interface Post {
	id: string;
	authorId: string;
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

export interface Certificate {
	id: string;
	title: string;
	issuer: string;
	date: string;
	fileName: string;
	src?: string;
	tone: Tone;
}

export interface Membership {
	orgId: string;
	role: string;
	since: string;
}

export interface Plan {
	id: string;
	date: string;
	title: string;
}

export interface Profile {
	name: string;
	age: number;
	city: string;
	bio: string;
	interests: Interest[];
	tone: Tone;
}

export interface Session {
	method: 'phone' | 'email';
	contact: string;
}
