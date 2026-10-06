import {
	ME,
	MY_ORG,
	day,
	organizations,
	people,
	seedApplications,
	seedCertificates,
	seedHours,
	seedMemberships,
	seedOpportunities,
	seedPlans,
	seedPosts,
	seedProfile
} from './data.ts';
import type {
	Accent,
	Application,
	ApplicationStatus,
	Certificate,
	HoursEntry,
	Membership,
	Opportunity,
	Plan,
	Post,
	Profile,
	Session,
	Tone
} from './types.ts';

const STORAGE_KEY = 'volna:state:v1';

interface Snapshot {
	session: Session | null;
	accent: Accent;
	mode: 'light' | 'dark';
	profile: Profile;
	opportunities: Opportunity[];
	applications: Application[];
	reminders: string[];
	hours: HoursEntry[];
	posts: Post[];
	certificates: Certificate[];
	memberships: Membership[];
	plans: Plan[];
}

function fresh(): Snapshot {
	return structuredClone({
		session: null,
		accent: 'sky',
		mode: 'light',
		profile: seedProfile,
		opportunities: seedOpportunities,
		applications: seedApplications,
		reminders: ['o7'],
		hours: seedHours,
		posts: seedPosts,
		certificates: seedCertificates,
		memberships: seedMemberships,
		plans: seedPlans
	});
}

function load(): Snapshot {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		return raw ? { ...fresh(), ...JSON.parse(raw) } : fresh();
	} catch {
		return fresh();
	}
}

const uid = () => crypto.randomUUID().slice(0, 8);

class AppState {
	session = $state<Session | null>(null);
	accent = $state<Accent>('sky');
	mode = $state<'light' | 'dark'>('light');
	profile = $state<Profile>(seedProfile);
	opportunities = $state<Opportunity[]>([]);
	applications = $state<Application[]>([]);
	reminders = $state<string[]>([]);
	hours = $state<HoursEntry[]>([]);
	posts = $state<Post[]>([]);
	certificates = $state<Certificate[]>([]);
	memberships = $state<Membership[]>([]);
	plans = $state<Plan[]>([]);
	toast = $state<{ id: number; text: string } | null>(null);

	constructor() {
		this.#apply(load());
	}

	#apply(s: Snapshot) {
		this.session = s.session;
		this.accent = s.accent;
		this.mode = s.mode;
		this.profile = s.profile;
		this.opportunities = s.opportunities;
		this.applications = s.applications;
		this.reminders = s.reminders;
		this.hours = s.hours;
		this.posts = s.posts;
		this.certificates = s.certificates;
		this.memberships = s.memberships;
		this.plans = s.plans;
	}

	#save() {
		const snapshot: Snapshot = $state.snapshot({
			session: this.session,
			accent: this.accent,
			mode: this.mode,
			profile: this.profile,
			opportunities: this.opportunities,
			applications: this.applications,
			reminders: this.reminders,
			hours: this.hours,
			// Загруженные видео живут как object URL только до перезагрузки — не сохраняем их
			posts: this.posts.map((p) =>
				p.media?.src?.startsWith('blob:') ? { ...p, media: { ...p.media, src: undefined } } : p
			),
			certificates: this.certificates,
			memberships: this.memberships,
			plans: this.plans
		});
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
		} catch {
			this.notify('Не удалось сохранить: в браузере закончилось место');
		}
	}

	notify(text: string) {
		this.toast = { id: Date.now(), text };
		const id = this.toast.id;
		setTimeout(() => {
			if (this.toast?.id === id) this.toast = null;
		}, 2600);
	}

	// ───────── Справочники ─────────

	org(id: string) {
		return organizations.find((o) => o.id === id);
	}

	opportunity(id: string) {
		return this.opportunities.find((o) => o.id === id);
	}

	/** Автор поста или комментария: я, другой волонтёр или организация */
	author(id: string): {
		name: string;
		tone: Tone;
		emoji?: string;
		isOrg: boolean;
		verified?: boolean;
	} {
		if (id === ME) return { name: this.profile.name, tone: this.profile.tone, isOrg: false };
		const org = this.org(id);
		if (org)
			return {
				name: org.name,
				tone: org.tone,
				emoji: org.emoji,
				isOrg: true,
				verified: org.verified
			};
		const person = people.find((p) => p.id === id);
		return { name: person?.name ?? 'Волонтёр', tone: person?.tone ?? 'blue', isOrg: false };
	}

	// ───────── Авторизация и настройки ─────────

	login(session: Session, name?: string) {
		this.session = session;
		if (name) this.profile.name = name;
		this.#save();
	}

	logout() {
		this.session = null;
		this.#save();
	}

	setAccent(accent: Accent) {
		this.accent = accent;
		this.#save();
	}

	setMode(mode: 'light' | 'dark') {
		this.mode = mode;
		this.#save();
	}

	updateProfile(profile: Profile) {
		this.profile = profile;
		this.#save();
		this.notify('Профиль сохранён');
	}

	resetDemo() {
		const session = this.session;
		this.#apply({ ...fresh(), session });
		this.#save();
		this.notify('Демо-данные восстановлены');
	}

	// ───────── Лента возможностей ─────────

	myApplication(opportunityId: string) {
		return this.applications.find((a) => a.opportunityId === opportunityId && a.personId === ME);
	}

	taken(opportunityId: string) {
		return this.applications.filter(
			(a) => a.opportunityId === opportunityId && a.status !== 'declined'
		).length;
	}

	apply(opportunityId: string, motivation = '') {
		if (this.myApplication(opportunityId)) return;
		this.applications.push({
			id: uid(),
			opportunityId,
			personId: ME,
			status: 'pending',
			createdAt: new Date().toISOString(),
			motivation
		});
		this.#save();
		this.notify('Заявка отправлена организатору');
	}

	isReminded(opportunityId: string) {
		return this.reminders.includes(opportunityId);
	}

	toggleReminder(opportunityId: string) {
		if (this.isReminded(opportunityId)) {
			this.reminders = this.reminders.filter((id) => id !== opportunityId);
			this.notify('Убрано из «Напомнить позже»');
		} else {
			this.reminders.push(opportunityId);
			this.notify('Напомним за день до дедлайна 🔔');
		}
		this.#save();
	}

	/** Рекомендации: совпадение тегов с интересами + бонус за скорый дедлайн */
	get recommendations() {
		const mine = new Set(this.profile.interests);
		return this.upcoming
			.map((o) => ({
				o,
				score:
					o.tags.filter((t) => mine.has(t)).length * 10 -
					(Date.parse(o.date) - Date.now()) / 864e5 / 10
			}))
			.filter((r) => r.score > 0)
			.sort((a, b) => b.score - a.score)
			.slice(0, 5)
			.map((r) => r.o);
	}

	get upcoming() {
		const today = day(0);
		return this.opportunities
			.filter((o) => o.date >= today)
			.sort((a, b) => a.date.localeCompare(b.date));
	}

	// ───────── Социальная лента ─────────

	addPost(post: Pick<Post, 'text' | 'media' | 'opportunityId' | 'orgId'>) {
		this.posts.unshift({
			...post,
			id: uid(),
			authorId: ME,
			likes: 0,
			liked: false,
			shares: 0,
			comments: [],
			createdAt: new Date().toISOString()
		});
		this.#save();
		this.notify('Пост опубликован');
	}

	toggleLike(post: Post) {
		post.liked = !post.liked;
		post.likes += post.liked ? 1 : -1;
		this.#save();
	}

	addComment(post: Post, text: string) {
		post.comments.push({ id: uid(), authorId: ME, text, createdAt: new Date().toISOString() });
		this.#save();
	}

	async share(post: Post) {
		const url = `${location.origin}/feed#${post.id}`;
		try {
			if (navigator.share)
				await navigator.share({ title: 'Волна', text: post.text.slice(0, 80), url });
			else await navigator.clipboard.writeText(url);
			post.shares += 1;
			this.#save();
			if (!navigator.share) this.notify('Ссылка скопирована');
		} catch {
			// пользователь закрыл системное окно «Поделиться»
		}
	}

	// ───────── Трекер и портфолио ─────────

	get myHours() {
		return this.hours.filter((h) => h.personId === ME).sort((a, b) => b.date.localeCompare(a.date));
	}

	get verifiedHours() {
		return this.myHours.filter((h) => h.status === 'verified').reduce((sum, h) => sum + h.hours, 0);
	}

	get pendingHours() {
		return this.myHours.filter((h) => h.status === 'pending').reduce((sum, h) => sum + h.hours, 0);
	}

	logHours(
		entry: Pick<HoursEntry, 'orgId' | 'opportunityId' | 'title' | 'date' | 'hours' | 'note'>
	) {
		this.hours.push({ ...entry, id: uid(), personId: ME, status: 'pending' });
		this.#save();
		this.notify('Часы отправлены куратору на подтверждение');
	}

	/** История участия: одобренные заявки на прошедшие и текущие события */
	get participation() {
		return this.applications
			.filter((a) => a.personId === ME && a.status === 'approved')
			.map((a) => ({ application: a, opportunity: this.opportunity(a.opportunityId)! }))
			.filter((p) => p.opportunity)
			.sort((a, b) => b.opportunity.date.localeCompare(a.opportunity.date));
	}

	addPlan(date: string, title: string) {
		this.plans.push({ id: uid(), date, title });
		this.#save();
		this.notify('Добавлено в календарь');
	}

	removePlan(id: string) {
		this.plans = this.plans.filter((p) => p.id !== id);
		this.#save();
	}

	addCertificate(certificate: Omit<Certificate, 'id'>) {
		this.certificates.unshift({ ...certificate, id: uid() });
		this.#save();
		this.notify('Документ добавлен в портфолио');
	}

	removeCertificate(id: string) {
		this.certificates = this.certificates.filter((c) => c.id !== id);
		this.#save();
	}

	// ───────── Кабинет организатора ─────────

	get myOrg() {
		return this.org(MY_ORG)!;
	}

	get orgOpportunities() {
		return this.opportunities
			.filter((o) => o.orgId === MY_ORG)
			.sort((a, b) => b.date.localeCompare(a.date));
	}

	get orgApplications() {
		const ids = new Set(this.orgOpportunities.map((o) => o.id));
		return this.applications
			.filter((a) => ids.has(a.opportunityId))
			.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
	}

	get orgHours() {
		return this.hours
			.filter((h) => h.orgId === MY_ORG)
			.sort((a, b) => b.date.localeCompare(a.date));
	}

	createOpportunity(data: Omit<Opportunity, 'id' | 'orgId'>) {
		this.opportunities.push({ ...data, id: uid(), orgId: MY_ORG });
		this.#save();
		this.notify('Мероприятие опубликовано в ленте');
	}

	decide(application: Application, status: ApplicationStatus) {
		application.status = status;
		if (status === 'approved') application.role ??= 'Волонтёр';
		this.#save();
		this.notify(status === 'approved' ? 'Участие подтверждено' : 'Заявка отклонена');
	}

	/** Начислить часы участнику одобренной заявки (сразу подтверждённые) */
	creditHours(application: Application) {
		const o = this.opportunity(application.opportunityId);
		if (!o || o.date > day(0) || this.isCredited(application)) return;
		this.hours.push({
			id: uid(),
			personId: application.personId,
			orgId: o.orgId,
			opportunityId: o.id,
			title: o.title,
			date: o.date,
			hours: o.hours,
			status: 'verified',
			note: 'Начислено куратором'
		});
		this.#save();
		this.notify(`Начислено ${o.hours} ч`);
	}

	isCredited(application: Application) {
		return this.hours.some(
			(h) =>
				h.personId === application.personId &&
				h.opportunityId === application.opportunityId &&
				h.status === 'verified'
		);
	}

	verifyHours(entry: HoursEntry, ok: boolean) {
		entry.status = ok ? 'verified' : 'rejected';
		this.#save();
		this.notify(ok ? `Подтверждено ${entry.hours} ч` : 'Часы отклонены');
	}
}

export const app = new AppState();
