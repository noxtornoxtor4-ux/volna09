import {
	ME,
	MY_ORG,
	day,
	organizations,
	people,
	seedAlerts,
	seedAnnouncements,
	seedApplications,
	seedAwards,
	seedFollowers,
	seedFollowing,
	seedHours,
	seedMemberships,
	seedOpportunities,
	seedOrgFollowers,
	seedOrgProfile,
	seedPosts,
	seedProfile,
	seedThreads,
	seedTopics
} from './data.ts';
import { formatDate, plural } from './format.ts';
import type {
	Accent,
	Alert,
	Announcement,
	Answers,
	Application,
	ApplicationStatus,
	Award,
	DayPhoto,
	HoursEntry,
	Membership,
	Opportunity,
	OrgProfile,
	Organization,
	Post,
	Privacy,
	Profile,
	Role,
	Session,
	Thread,
	Tone,
	Topic
} from './types.ts';

const STORAGE_KEY = 'volna:state:v2';

interface Snapshot {
	session: Session | null;
	accent: Accent;
	mode: 'light' | 'dark';
	profile: Profile;
	orgProfile: OrgProfile;
	topics: Topic[];
	opportunities: Opportunity[];
	applications: Application[];
	reminders: string[];
	hours: HoursEntry[];
	posts: Post[];
	awards: Award[];
	memberships: Membership[];
	threads: Thread[];
	announcements: Announcement[];
	alerts: Alert[];
	dayPhotos: DayPhoto[];
	following: string[];
	privacy: Privacy;
	/** Организация, которой управляет аккаунт организации */
	myOrgId: string;
	/** Организации, добавленные пользователями при регистрации */
	customOrgs: Organization[];
}

function fresh(): Snapshot {
	return structuredClone({
		session: null,
		accent: 'sky',
		mode: 'light',
		profile: seedProfile,
		orgProfile: seedOrgProfile,
		topics: seedTopics,
		opportunities: seedOpportunities,
		applications: seedApplications,
		reminders: ['o7', 'o4'],
		hours: seedHours,
		posts: seedPosts,
		awards: seedAwards,
		memberships: seedMemberships,
		threads: seedThreads,
		announcements: seedAnnouncements,
		alerts: seedAlerts,
		dayPhotos: [],
		following: seedFollowing,
		privacy: { publicProfile: true, showHours: true, searchable: true, messages: 'all' },
		myOrgId: MY_ORG,
		customOrgs: []
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
const now = () => new Date().toISOString();

export interface Author {
	name: string;
	tone: Tone;
	emoji?: string;
	avatar?: string;
	isOrg: boolean;
	verified?: boolean;
}

export interface AiTip {
	id: string;
	emoji: string;
	text: string;
	action?: { label: string; href: string };
}

class AppState {
	session = $state<Session | null>(null);
	accent = $state<Accent>('sky');
	mode = $state<'light' | 'dark'>('light');
	profile = $state<Profile>(seedProfile);
	orgProfile = $state<OrgProfile>(seedOrgProfile);
	topics = $state<Topic[]>([]);
	opportunities = $state<Opportunity[]>([]);
	applications = $state<Application[]>([]);
	reminders = $state<string[]>([]);
	hours = $state<HoursEntry[]>([]);
	posts = $state<Post[]>([]);
	awards = $state<Award[]>([]);
	memberships = $state<Membership[]>([]);
	threads = $state<Thread[]>([]);
	announcements = $state<Announcement[]>([]);
	alerts = $state<Alert[]>([]);
	dayPhotos = $state<DayPhoto[]>([]);
	following = $state<string[]>([]);
	privacy = $state<Privacy>({
		publicProfile: true,
		showHours: true,
		searchable: true,
		messages: 'all'
	});
	myOrgId = $state<string>(MY_ORG);
	customOrgs = $state<Organization[]>([]);
	toast = $state<{ id: number; text: string } | null>(null);
	/** Мероприятие, анкету на которое сейчас заполняет волонтёр */
	applyingId = $state<string | null>(null);

	constructor() {
		this.#apply(load());
	}

	#apply(s: Snapshot) {
		this.session = s.session;
		this.accent = s.accent;
		this.mode = s.mode;
		this.profile = s.profile;
		this.orgProfile = s.orgProfile;
		this.topics = s.topics;
		this.opportunities = s.opportunities;
		this.applications = s.applications;
		this.reminders = s.reminders;
		this.hours = s.hours;
		this.posts = s.posts;
		this.awards = s.awards;
		this.memberships = s.memberships;
		this.threads = s.threads;
		this.announcements = s.announcements;
		this.alerts = s.alerts;
		this.dayPhotos = s.dayPhotos;
		this.following = s.following;
		this.privacy = s.privacy;
		this.myOrgId = s.myOrgId;
		this.customOrgs = s.customOrgs;
	}

	#save() {
		const snapshot: Snapshot = $state.snapshot({
			session: this.session,
			accent: this.accent,
			mode: this.mode,
			profile: this.profile,
			orgProfile: this.orgProfile,
			topics: this.topics,
			opportunities: this.opportunities,
			applications: this.applications,
			reminders: this.reminders,
			hours: this.hours,
			// Загруженные видео живут как object URL только до перезагрузки — не сохраняем их
			posts: this.posts.map((p) =>
				p.media?.src?.startsWith('blob:') ? { ...p, media: { ...p.media, src: undefined } } : p
			),
			awards: this.awards,
			memberships: this.memberships,
			threads: this.threads,
			announcements: this.announcements,
			alerts: this.alerts,
			dayPhotos: this.dayPhotos,
			following: this.following,
			privacy: this.privacy,
			myOrgId: this.myOrgId,
			customOrgs: this.customOrgs
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

	#alert(to: Role, emoji: string, text: string, href?: string) {
		this.alerts.unshift({ id: uid(), to, emoji, text, href, at: now(), read: false });
	}

	// ───────── Роль и аккаунты ─────────

	get role(): Role {
		return this.session?.role ?? 'volunteer';
	}

	get isOrg() {
		return this.role === 'org';
	}

	/** Идентификатор текущего автора: волонтёр или организация */
	get actorId() {
		return this.isOrg ? this.myOrgId : ME;
	}

	login(session: Session, name?: string) {
		this.session = session;
		if (name && session.role === 'volunteer') this.profile.name = name;
		this.#save();
	}

	/** Все организации платформы: справочник и добавленные пользователями */
	get allOrgs(): Organization[] {
		return [...organizations, ...this.customOrgs];
	}

	/** Аккаунт организации начинает управлять выбранной организацией */
	chooseOrg(orgId: string) {
		const org = this.allOrgs.find((o) => o.id === orgId);
		if (!org) return;
		this.myOrgId = org.id;
		this.orgProfile = { name: org.name, city: org.city, about: org.about };
		this.#save();
	}

	/** Новая организация, которой ещё нет на платформе. Проверку проходит позже */
	createOrg(data: Pick<Organization, 'name' | 'city' | 'about'>) {
		const tones: Tone[] = ['blue', 'yellow', 'green', 'lilac', 'peach'];
		const org: Organization = {
			...data,
			id: `org-${uid()}`,
			tone: tones[this.customOrgs.length % tones.length],
			emoji: '🏢',
			verified: false,
			followers: 0
		};
		this.customOrgs.push(org);
		this.#save();
		return org.id;
	}

	switchRole(role: Role) {
		if (!this.session) return;
		this.session.role = role;
		this.#save();
		this.notify(
			role === 'org' ? `Вы вошли как ${this.orgProfile.name}` : `Вы вошли как ${this.profile.name}`
		);
	}

	logout() {
		this.session = null;
		this.#save();
	}

	updateContact(contact: string) {
		if (!this.session) return;
		this.session.contact = contact;
		this.#save();
		this.notify('Учётная запись обновлена');
	}

	setAccent(accent: Accent) {
		this.accent = accent;
		this.#save();
	}

	setMode(mode: 'light' | 'dark') {
		this.mode = mode;
		this.#save();
	}

	setPrivacy(privacy: Privacy) {
		this.privacy = privacy;
		this.#save();
	}

	updateProfile(profile: Profile) {
		this.profile = profile;
		this.#save();
		this.notify('Профиль сохранён');
	}

	updateOrgProfile(profile: OrgProfile) {
		this.orgProfile = profile;
		this.#save();
		this.notify('Профиль организации сохранён');
	}

	resetDemo() {
		const { session, myOrgId, customOrgs, orgProfile } = this;
		// Аккаунт и выбранная организация сохраняются, сбрасываются только демо-данные
		this.#apply({
			...fresh(),
			session,
			myOrgId,
			customOrgs,
			orgProfile: $state.snapshot(orgProfile)
		});
		this.#save();
		this.notify('Демо-данные восстановлены');
	}

	// ───────── Справочники ─────────

	org(id: string) {
		const org = this.allOrgs.find((o) => o.id === id);
		if (!org || id !== this.myOrgId) return org;
		return {
			...org,
			name: this.orgProfile.name,
			city: this.orgProfile.city,
			about: this.orgProfile.about
		};
	}

	person(id: string) {
		if (id === ME) {
			return { id: ME, ...this.profile, followers: seedFollowers.length };
		}
		return people.find((p) => p.id === id);
	}

	/** Автор поста, комментария или сообщения: я, другой волонтёр или организация */
	author(id: string): Author {
		if (id === ME) {
			return {
				name: this.profile.name,
				tone: this.profile.tone,
				avatar: this.profile.avatar,
				isOrg: false
			};
		}
		const org = this.org(id);
		if (org) {
			return {
				name: org.name,
				tone: org.tone,
				emoji: org.emoji,
				avatar: id === this.myOrgId ? this.orgProfile.avatar : undefined,
				isOrg: true,
				verified: org.verified
			};
		}
		const person = people.find((p) => p.id === id);
		return { name: person?.name ?? 'Волонтёр', tone: person?.tone ?? 'blue', isOrg: false };
	}

	topic(id: string) {
		return this.topics.find((t) => t.id === id);
	}

	addTopic(topic: Omit<Topic, 'id' | 'custom'>) {
		const id = `t-${uid()}`;
		this.topics.push({ ...topic, id, custom: true });
		this.#save();
		this.notify('Тема создана и видна всем');
		return id;
	}

	opportunity(id: string) {
		return this.opportunities.find((o) => o.id === id);
	}

	isPromoted(o: Opportunity) {
		return !!o.promotedUntil && o.promotedUntil >= day(0);
	}

	/** Предстоящие мероприятия: продвигаемые выше, затем по дате */
	get upcoming() {
		const today = day(0);
		return this.opportunities
			.filter((o) => o.date >= today)
			.sort(
				(a, b) =>
					Number(this.isPromoted(b)) - Number(this.isPromoted(a)) || a.date.localeCompare(b.date)
			);
	}

	byTopic(topicId: string) {
		return this.upcoming.filter((o) => o.tags.includes(topicId));
	}

	/** Темы для сторисов: сначала интересы пользователя, затем остальные с мероприятиями */
	get storyTopics() {
		const mine = new Set(this.profile.interests);
		return [...this.topics].sort(
			(a, b) =>
				Number(mine.has(b.id)) - Number(mine.has(a.id)) ||
				this.byTopic(b.id).length - this.byTopic(a.id).length
		);
	}

	// ───────── Заявки и анкеты ─────────

	myApplication(opportunityId: string) {
		return this.applications.find((a) => a.opportunityId === opportunityId && a.personId === ME);
	}

	taken(opportunityId: string) {
		return this.applications.filter(
			(a) => a.opportunityId === opportunityId && a.status !== 'declined'
		).length;
	}

	participants(opportunityId: string) {
		return this.applications.filter(
			(a) => a.opportunityId === opportunityId && a.status === 'approved'
		);
	}

	apply(opportunityId: string, answers: Answers) {
		const o = this.opportunity(opportunityId);
		if (!o || this.myApplication(opportunityId)) return;
		this.applications.push({
			id: uid(),
			opportunityId,
			personId: ME,
			status: 'pending',
			createdAt: now(),
			answers
		});
		if (o.orgId === this.myOrgId) {
			this.#alert(
				'org',
				'📝',
				`${this.profile.name} подала заявку на «${o.title}»`,
				'/cabinet?folder=applications'
			);
		}
		this.#save();
		this.notify('Анкета отправлена организатору');
	}

	openApply(opportunityId: string) {
		if (this.isOrg) {
			this.notify('Подавать заявки можно из аккаунта волонтёра');
			return;
		}
		this.applyingId = opportunityId;
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

	// ───────── Чаты и уведомления ─────────

	threadId(opportunityId: string, personId: string) {
		return `${opportunityId}__${personId}`;
	}

	thread(id: string) {
		return this.threads.find((t) => t.id === id);
	}

	threadsFor(opportunityId: string) {
		return this.threads
			.filter((t) => t.opportunityId === opportunityId && t.messages.length)
			.sort((a, b) => (b.messages.at(-1)?.at ?? '').localeCompare(a.messages.at(-1)?.at ?? ''));
	}

	/** Вопрос без ответа: последнее сообщение от волонтёра */
	isUnanswered(thread: Thread) {
		return thread.messages.at(-1)?.from === thread.personId;
	}

	sendMessage(opportunityId: string, personId: string, text: string) {
		const id = this.threadId(opportunityId, personId);
		let thread = this.thread(id);
		if (!thread) {
			this.threads.push({ id, opportunityId, personId, messages: [] });
			thread = this.thread(id)!;
		}
		const from = this.isOrg ? this.myOrgId : ME;
		thread.messages.push({ id: uid(), from, text, at: now() });
		const o = this.opportunity(opportunityId);
		if (o && !this.isOrg && o.orgId === this.myOrgId) {
			this.#alert('org', '💬', `Новый вопрос по «${o.title}»`, `/chat?id=${id}`);
		}
		if (o && this.isOrg && personId === ME) {
			this.#alert(
				'volunteer',
				'💬',
				`${this.orgProfile.name} ответил на ваш вопрос`,
				`/chat?id=${id}`
			);
		}
		this.#save();
	}

	announcementsFor(opportunityId: string) {
		return this.announcements
			.filter((a) => a.opportunityId === opportunityId)
			.sort((a, b) => b.at.localeCompare(a.at));
	}

	announce(opportunityId: string, title: string, text: string) {
		const o = this.opportunity(opportunityId);
		if (!o) return;
		this.announcements.push({ id: uid(), opportunityId, title, text, at: now() });
		const mine = this.myApplication(opportunityId);
		if (mine && mine.status !== 'declined') {
			this.#alert(
				'volunteer',
				'📣',
				`${this.org(o.orgId)?.name}: ${title}`,
				`/notifications?event=${o.id}`
			);
		}
		this.#save();
		const count = this.participants(opportunityId).length;
		this.notify(
			`Уведомление отправлено ${count} ${plural(count, 'участнику', 'участникам', 'участникам')}`
		);
	}

	get myAlerts() {
		return this.alerts.filter((a) => a.to === this.role);
	}

	get unread() {
		return this.myAlerts.filter((a) => !a.read).length;
	}

	markAlertsRead() {
		let changed = false;
		for (const a of this.alerts) {
			if (a.to === this.role && !a.read) {
				a.read = true;
				changed = true;
			}
		}
		if (changed) this.#save();
	}

	/** Мероприятия во вкладке «Уведомления» */
	get notificationEvents() {
		const today = day(0);
		if (this.isOrg) return this.orgOpportunities.filter((o) => o.date >= today).reverse();
		const ids = new Set([
			...this.applications
				.filter((a) => a.personId === ME && a.status !== 'declined')
				.map((a) => a.opportunityId),
			...this.reminders
		]);
		return this.upcoming.filter((o) => ids.has(o.id)).sort((a, b) => a.date.localeCompare(b.date));
	}

	/**
	 * ИИ-помощник: напоминания, собранные из состояния заявок, дедлайнов и часов.
	 * Правила простые и прозрачные — в проде их можно заменить вызовом LLM.
	 */
	get aiTips(): AiTip[] {
		const tips: AiTip[] = [];
		const tomorrow = day(1);
		if (this.isOrg) {
			const pending = this.orgApplications.filter((a) => a.status === 'pending').length;
			if (pending)
				tips.push({
					id: 'apps',
					emoji: '📝',
					text: `${pending} заявки ждут вашего решения. Волонтёры быстрее откликаются, если ответить в течение суток.`,
					action: { label: 'Открыть заявки', href: '/cabinet?folder=applications' }
				});
			const hours = this.orgHours.filter((h) => h.status === 'pending');
			if (hours.length)
				tips.push({
					id: 'hours',
					emoji: '⏱️',
					text: `Подтвердите ${hours.reduce((s, h) => s + h.hours, 0)} ч волонтёрства от ${hours.length} участников — без этого часы не попадут в их портфолио.`,
					action: { label: 'Подтвердить часы', href: '/cabinet?folder=hours' }
				});
			const questions = this.orgOpportunities
				.flatMap((o) => this.threadsFor(o.id))
				.filter((t) => this.isUnanswered(t));
			if (questions.length)
				tips.push({
					id: 'questions',
					emoji: '💬',
					text: `${questions.length} вопрос(а) от волонтёров без ответа.`,
					action: { label: 'Ответить', href: `/chat?id=${questions[0].id}` }
				});
			for (const o of this.orgOpportunities.filter((o) => o.date === tomorrow)) {
				tips.push({
					id: `tmr-${o.id}`,
					emoji: '📣',
					text: `Завтра «${o.title}». Напомните участникам о времени и месте.`,
					action: { label: 'Создать уведомление', href: `/notifications?event=${o.id}` }
				});
			}
			return tips;
		}
		for (const { opportunity: o } of this.participation.filter(
			(p) => p.opportunity.date === tomorrow
		)) {
			tips.push({
				id: `tmr-${o.id}`,
				emoji: '⏰',
				text: `Завтра «${o.title}» в ${o.time.split('–')[0]}. Не забудьте: ${o.requirements.slice(1).join(', ').toLowerCase() || 'хорошее настроение'}.`,
				action: { label: 'Подробнее', href: `/o?id=${o.id}` }
			});
		}
		for (const o of this.upcoming) {
			if (!o.deadline || this.myApplication(o.id)) continue;
			const days = Math.round((Date.parse(o.deadline) - Date.parse(day(0))) / 864e5);
			if (this.isReminded(o.id) && days >= 0 && days <= 7) {
				tips.push({
					id: `dl-${o.id}`,
					emoji: '🔔',
					text: `Вы просили напомнить: приём заявок на «${o.title}» закрывается ${formatDate(o.deadline)}.`,
					action: { label: 'Податься', href: `/o?id=${o.id}&apply=1` }
				});
			}
		}
		const pick = this.recommendations.find(
			(o) => !this.myApplication(o.id) && !this.isReminded(o.id)
		);
		if (pick) {
			const topic = this.topic(pick.tags.find((t) => this.profile.interests.includes(t)) ?? '');
			tips.push({
				id: `rec-${pick.id}`,
				emoji: '✨',
				text: `Вам может понравиться «${pick.title}»${topic ? ` — это про ${topic.label.toLowerCase()}` : ''}.`,
				action: { label: 'Посмотреть', href: `/o?id=${pick.id}` }
			});
		}
		if (this.pendingHours) {
			tips.push({
				id: 'hours',
				emoji: '⏱️',
				text: `${this.pendingHours} ч ждут подтверждения организаторами. Как только подтвердят — они появятся в портфолио.`,
				action: { label: 'Портфолио', href: '/portfolio?tab=requests' }
			});
		}
		return tips;
	}

	get recommendations() {
		const mine = new Set(this.profile.interests);
		return this.upcoming
			.map((o) => ({ o, score: o.tags.filter((t) => mine.has(t)).length }))
			.filter((r) => r.score > 0)
			.sort((a, b) => b.score - a.score)
			.map((r) => r.o);
	}

	// ───────── Лента ─────────

	addPost(post: Pick<Post, 'kind' | 'text' | 'media' | 'opportunityId' | 'orgId'>) {
		this.posts.unshift({
			...post,
			id: uid(),
			authorId: this.actorId,
			likes: 0,
			liked: false,
			shares: 0,
			comments: [],
			createdAt: now()
		});
		this.#save();
		this.notify(post.kind === 'review' ? 'Отзыв опубликован' : 'Пост опубликован');
	}

	postsBy(authorId: string) {
		return this.posts.filter((p) => p.authorId === authorId);
	}

	toggleLike(post: Post) {
		post.liked = !post.liked;
		post.likes += post.liked ? 1 : -1;
		this.#save();
	}

	addComment(post: Post, text: string) {
		post.comments.push({ id: uid(), authorId: this.actorId, text, createdAt: now() });
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

	// ───────── Подписки ─────────

	isFollowing(id: string) {
		return this.following.includes(id);
	}

	toggleFollow(id: string) {
		this.following = this.isFollowing(id)
			? this.following.filter((f) => f !== id)
			: [...this.following, id];
		this.#save();
	}

	followersCount(id: string) {
		if (id === ME) return seedFollowers.length;
		const base = this.org(id)?.followers ?? people.find((p) => p.id === id)?.followers ?? 0;
		return base + (this.isFollowing(id) ? 1 : 0);
	}

	get myFollowers() {
		if (!this.isOrg) return seedFollowers;
		return this.myOrgId === MY_ORG ? seedOrgFollowers : [];
	}

	// ───────── Часы, проекты, награды ─────────

	hoursOf(personId: string) {
		return this.hours
			.filter((h) => h.personId === personId)
			.sort((a, b) => b.date.localeCompare(a.date));
	}

	get myHours() {
		return this.hoursOf(ME);
	}

	verifiedHoursOf(personId: string) {
		return this.hoursOf(personId)
			.filter((h) => h.status === 'verified')
			.reduce((s, h) => s + h.hours, 0);
	}

	get verifiedHours() {
		return this.verifiedHoursOf(ME);
	}

	get pendingHours() {
		return this.myHours.filter((h) => h.status === 'pending').reduce((s, h) => s + h.hours, 0);
	}

	logHours(
		entry: Pick<HoursEntry, 'orgId' | 'opportunityId' | 'title' | 'date' | 'hours' | 'note'>
	) {
		this.hours.push({ ...entry, id: uid(), personId: ME, status: 'pending' });
		if (entry.orgId === this.myOrgId) {
			this.#alert(
				'org',
				'⏱️',
				`${this.profile.name} просит подтвердить ${entry.hours} ч`,
				'/cabinet?folder=hours'
			);
		}
		this.#save();
		this.notify('Заявка на подтверждение часов отправлена');
	}

	participationOf(personId: string) {
		return this.applications
			.filter((a) => a.personId === personId && a.status === 'approved')
			.map((a) => ({ application: a, opportunity: this.opportunity(a.opportunityId)! }))
			.filter((p) => p.opportunity)
			.sort((a, b) => b.opportunity.date.localeCompare(a.opportunity.date));
	}

	get participation() {
		return this.participationOf(ME);
	}

	awardsOf(personId: string) {
		return this.awards
			.filter((a) => a.personId === personId)
			.sort((a, b) => b.date.localeCompare(a.date));
	}

	get myAwards() {
		return this.awardsOf(ME);
	}

	get issuedAwards() {
		return this.awards
			.filter((a) => a.orgId === this.myOrgId)
			.sort((a, b) => b.date.localeCompare(a.date));
	}

	uploadCertificate(award: Pick<Award, 'title' | 'description' | 'fileName' | 'src'>) {
		this.awards.unshift({
			...award,
			id: uid(),
			type: 'certificate',
			tier: 'silver',
			personId: ME,
			date: day(0)
		});
		this.#save();
		this.notify('Документ добавлен на полку');
	}

	removeAward(id: string) {
		this.awards = this.awards.filter((a) => a.id !== id);
		this.#save();
	}

	grantAward(
		award: Pick<Award, 'type' | 'tier' | 'title' | 'description' | 'opportunityId'>,
		personIds: string[]
	) {
		for (const personId of personIds) {
			this.awards.unshift({ ...award, id: uid(), personId, orgId: this.myOrgId, date: day(0) });
		}
		if (personIds.includes(ME)) {
			this.#alert(
				'volunteer',
				'🏆',
				`${this.orgProfile.name} наградил вас: «${award.title}»`,
				'/awards'
			);
		}
		this.#save();
		this.notify(
			`Награда вручена ${personIds.length} ${plural(personIds.length, 'волонтёру', 'волонтёрам', 'волонтёрам')}`
		);
	}

	// ───────── Календарь ─────────

	photosFor(date: string) {
		return this.dayPhotos.filter((p) => p.date === date && p.owner === this.role);
	}

	addDayPhoto(date: string, src: string) {
		this.dayPhotos.push({ id: uid(), owner: this.role, date, src });
		this.#save();
		this.notify('Фото добавлено в календарь');
	}

	removeDayPhoto(id: string) {
		this.dayPhotos = this.dayPhotos.filter((p) => p.id !== id);
		this.#save();
	}

	// ───────── Кабинет организации ─────────

	get myOrg() {
		return this.org(this.myOrgId)!;
	}

	get orgOpportunities() {
		return this.opportunities
			.filter((o) => o.orgId === this.myOrgId)
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
			.filter((h) => h.orgId === this.myOrgId)
			.sort((a, b) => b.date.localeCompare(a.date));
	}

	/** Волонтёры организации: сколько мероприятий посетили и сколько часов получили */
	get orgVolunteers() {
		const today = day(0);
		const rows: Record<
			string,
			{ personId: string; attended: number; upcoming: number; hours: number }
		> = {};
		for (const a of this.orgApplications.filter((a) => a.status === 'approved')) {
			const o = this.opportunity(a.opportunityId)!;
			const row = rows[a.personId] ?? {
				personId: a.personId,
				attended: 0,
				upcoming: 0,
				hours: 0
			};
			if (o.date < today) row.attended += 1;
			else row.upcoming += 1;
			rows[a.personId] = row;
		}
		for (const h of this.orgHours.filter((h) => h.status === 'verified')) {
			const row = rows[h.personId] ?? {
				personId: h.personId,
				attended: 0,
				upcoming: 0,
				hours: 0
			};
			row.hours += h.hours;
			rows[h.personId] = row;
		}
		return Object.values(rows).sort((a, b) => b.attended - a.attended || b.hours - a.hours);
	}

	createOpportunity(data: Omit<Opportunity, 'id' | 'orgId'>) {
		const id = uid();
		this.opportunities.push({ ...data, id, orgId: this.myOrgId });
		this.#save();
		this.notify('Мероприятие опубликовано');
		return id;
	}

	promote(opportunityId: string, days: number) {
		const o = this.opportunity(opportunityId);
		if (!o) return;
		o.promotedUntil = day(days);
		this.#save();
		this.notify(`«${o.title}» продвигается до ${formatDate(o.promotedUntil)}`);
	}

	decide(application: Application, status: ApplicationStatus) {
		application.status = status;
		if (status === 'approved') application.role ??= 'Волонтёр';
		const o = this.opportunity(application.opportunityId);
		if (o && application.personId === ME && status !== 'pending') {
			this.#alert(
				'volunteer',
				status === 'approved' ? '✅' : '😔',
				status === 'approved'
					? `Заявка на «${o.title}» подтверждена — день отмечен в календаре`
					: `Заявка на «${o.title}» отклонена`,
				status === 'approved' ? '/calendar' : `/o?id=${o.id}`
			);
		}
		this.#save();
		this.notify(
			status === 'approved'
				? 'Участие подтверждено'
				: status === 'declined'
					? 'Заявка отклонена'
					: 'Заявка возвращена'
		);
	}

	/** Начислить часы участнику одобренной заявки после мероприятия */
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
		if (application.personId === ME)
			this.#alert(
				'volunteer',
				'⏱️',
				`Начислено ${o.hours} ч за «${o.title}»`,
				'/portfolio?tab=hours'
			);
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
		if (entry.personId === ME) {
			this.#alert(
				'volunteer',
				ok ? '⏱️' : '😔',
				ok
					? `Подтверждено ${entry.hours} ч: «${entry.title}»`
					: `Часы за «${entry.title}» не подтверждены`,
				'/portfolio?tab=requests'
			);
		}
		this.#save();
		this.notify(ok ? `Подтверждено ${entry.hours} ч` : 'Часы отклонены');
	}

	// ───────── Архив и поиск ─────────

	get archive() {
		const today = day(0);
		if (this.isOrg) return this.orgOpportunities.filter((o) => o.date < today);
		return this.participation.map((p) => p.opportunity).filter((o) => o.date < today);
	}

	search(query: string) {
		const q = query.trim().toLowerCase();
		const match = (...fields: string[]) => !q || fields.some((f) => f.toLowerCase().includes(q));
		return {
			people: people.filter((p) => match(p.name, p.city, p.bio)),
			orgs: this.allOrgs.map((o) => this.org(o.id)!).filter((o) => match(o.name, o.about, o.city)),
			opportunities: this.upcoming.filter((o) =>
				match(o.title, o.description, o.place, this.org(o.orgId)?.name ?? '')
			)
		};
	}
}

export const app = new AppState();
