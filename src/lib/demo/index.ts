/**
 * Демо-режим: тот же сайт, но без Firebase и на выдуманных данных.
 * Данные приводятся к текущим типам и хранятся только в браузере посетителя.
 */
import type {
	Alert,
	Announcement,
	Appeal,
	Application,
	AuditEntry,
	Award,
	Conversation,
	HoursEntry,
	Opportunity,
	Organization,
	Person,
	Post,
	Report,
	Skill,
	SkillMaterial,
	Thread
} from '../types.ts';
import {
	ME,
	MY_ORG,
	organizations,
	people,
	seedAlerts,
	seedAnnouncements,
	seedApplications,
	seedAwards,
	seedConversations,
	seedFollowers,
	seedFollowing,
	seedHours,
	seedOpportunities,
	seedOrgFollowers,
	seedOrgProfile,
	seedPosts,
	seedProfile,
	seedThreads
} from './seed.ts';

export interface DemoState {
	people: Person[];
	orgs: Organization[];
	opportunities: Opportunity[];
	applications: Application[];
	hours: HoursEntry[];
	posts: Post[];
	awards: Award[];
	skills: Skill[];
	skillMaterials: SkillMaterial[];
	threads: Thread[];
	conversations: Conversation[];
	announcements: Announcement[];
	alerts: Alert[];
	reports: Report[];
	appeals: Appeal[];
	auditLog: AuditEntry[];
}

const ago = (days: number) => new Date(Date.now() - days * 864e5).toISOString();
const consent = { terms: true as const, adult: false, parental: true, at: ago(30) };

export function demoState(): DemoState {
	const clone = <T>(value: T): T => structuredClone(value);

	// Люди: Алина (вы) и выдуманные волонтёры; подписчики — через списки подписок
	const persons: Person[] = people.map((p) => {
		const rest: Partial<typeof p> = { ...p };
		delete rest.followers;
		const following: string[] = [];
		if (seedFollowers.includes(p.id)) following.push(ME);
		if (seedOrgFollowers.includes(p.id)) following.push(MY_ORG);
		return { ...rest, following, consent, createdAt: ago(60) } as Person;
	});
	persons.unshift({
		...clone(seedProfile),
		id: ME,
		following: [...seedFollowing],
		orgId: MY_ORG,
		consent,
		createdAt: ago(90)
	} as Person);

	// Организации: Эко-клуб ведёте вы; одна новая ждёт проверки модератора
	const orgs: Organization[] = organizations.map((o) => {
		const rest: Partial<typeof o> = { ...o };
		delete rest.followers;
		const base = { ...rest, ownerIds: o.id === MY_ORG ? [ME] : [], createdAt: ago(200) };
		return (o.id === MY_ORG ? { ...base, ...clone(seedOrgProfile) } : base) as Organization;
	});
	orgs.push({
		id: 'org-karakol',
		name: 'Школьный клуб «Иссык-Куль чистый»',
		city: 'Каракол',
		about: 'Ученики школы №3 убирают берег и рассказывают туристам о сортировке.',
		tone: 'blue',
		emoji: '🌊',
		verified: false,
		ownerIds: ['p6'],
		verification: {
			status: 'pending',
			docs: [],
			links: 'instagram.com/clean_issykkul',
			note: 'Клуб при школе №3 Каракола, письмо от директора приложим по запросу.',
			requestedAt: ago(1)
		},
		createdAt: ago(5)
	});

	const opportunities = clone(seedOpportunities) as unknown as Opportunity[];
	const hoursOf = (id?: string) => opportunities.find((o) => o.id === id)?.hours;

	const posts: Post[] = seedPosts.map((p) => {
		const { likes, liked, ...rest } = clone(p) as typeof p & { likes: number; liked: boolean };
		const fans = Array.from({ length: Math.max(0, likes - Number(liked)) }, (_, i) =>
			i < persons.length - 1 ? persons[i + 1].id : `fan-${i}`
		);
		return { ...rest, likedBy: liked ? [ME, ...fans] : fans } as unknown as Post;
	});

	// Сертификаты, выданные организациями, получают ID для страницы проверки
	let n = 0;
	const awards: Award[] = seedAwards.map((a) => {
		const award = clone(a) as unknown as Award;
		if (award.type !== 'certificate' || !award.orgId) return award;
		n += 1;
		const certificateId = `VLN-DEMO-${String(n).padStart(4, '0')}`;
		return {
			...award,
			id: certificateId,
			certificateId,
			status: 'valid',
			hours: hoursOf(award.opportunityId)
		};
	});

	const hours: HoursEntry[] = (clone(seedHours) as unknown as HoursEntry[]).map((h) => ({
		...h,
		source: h.status === 'verified' ? 'roster' : 'request'
	}));

	const threads: Thread[] = (clone(seedThreads) as unknown as Thread[]).map((t) => ({
		...t,
		members: [t.personId, opportunities.find((o) => o.id === t.opportunityId)?.orgId ?? MY_ORG]
	}));

	const alerts: Alert[] = seedAlerts.map((a) => ({
		...(clone(a) as unknown as Alert),
		to: (a as { to: string }).to === 'org' ? MY_ORG : ME
	}));

	const skills: Skill[] = [
		{
			id: 'sk-demo-photo',
			personId: ME,
			emoji: '📸',
			title: 'Фотография',
			description: 'Снимаю волонтёрские акции и животных из приюта — помогаю им найти дом.',
			level: 'advanced',
			featured: true,
			createdAt: ago(40)
		},
		{
			id: 'sk-demo-talk',
			personId: ME,
			emoji: '🗣',
			title: 'Коммуникабельность',
			description: 'Веду встречи новых волонтёров и рассказываю о сортировке в школах.',
			level: 'intermediate',
			featured: true,
			createdAt: ago(38)
		},
		{
			id: 'sk-demo-p2',
			personId: 'p2',
			emoji: '🎬',
			title: 'Видеомонтаж',
			description: 'Монтирую ролики для приюта и НКО.',
			level: 'expert',
			featured: true,
			createdAt: ago(20)
		}
	];
	const skillMaterials: SkillMaterial[] = [
		{
			id: 'mt-demo-1',
			skillId: 'sk-demo-photo',
			personId: ME,
			kind: 'text',
			text: 'Фотоотчёт с субботника в парке Ататюрка собрал 300 репостов в паблике эко-клуба.',
			createdAt: ago(10)
		},
		{
			id: 'mt-demo-2',
			skillId: 'sk-demo-talk',
			personId: ME,
			kind: 'text',
			text: 'Провела 4 урока о раздельном сборе для 5–7 классов.',
			createdAt: ago(6)
		}
	];

	const firstPost = posts.find((p) => p.authorId !== ME);
	const reports: Report[] = firstPost
		? [
				{
					id: 'rep-demo-1',
					targetType: 'post',
					targetId: firstPost.id,
					reason: 'Спам или реклама: ссылка на сторонний магазин',
					reporterId: 'p3',
					createdAt: ago(0.2),
					status: 'open'
				}
			]
		: [];

	const appeals: Appeal[] = [
		{
			id: 'ap-demo-1',
			personId: 'p1',
			orgId: MY_ORG,
			opportunityId: opportunities[0]?.id,
			text: 'Был на субботнике все 3 часа, но часы так и не начислили.',
			status: 'open',
			createdAt: ago(0.5)
		}
	];

	const auditLog: AuditEntry[] = [
		{
			id: 'au-demo-1',
			moderatorId: ME,
			action: 'verification:approved',
			targetType: 'org',
			targetId: MY_ORG,
			details: 'Устав и письмо школы проверены',
			at: ago(30)
		}
	];

	return {
		people: persons,
		orgs,
		opportunities,
		applications: clone(seedApplications) as unknown as Application[],
		hours,
		posts,
		awards,
		skills,
		skillMaterials,
		threads,
		conversations: clone(seedConversations) as unknown as Conversation[],
		announcements: clone(seedAnnouncements) as unknown as Announcement[],
		alerts,
		reports,
		appeals,
		auditLog
	};
}
