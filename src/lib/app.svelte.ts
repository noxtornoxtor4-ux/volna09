import { tr } from './i18n.ts';
import {
	ME,
	MY_ORG,
	ONLINE,
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
	seedConversations,
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
	Conversation,
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
const SCHEMA = 3;

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
	conversations: Conversation[];
	announcements: Announcement[];
	alerts: Alert[];
	dayPhotos: DayPhoto[];
	following: string[];
	privacy: Privacy;
	/** Организация, которой управляет аккаунт организации */
	myOrgId: string;
	/** Город, по которому фильтруется лента возможностей; all — все города */
	viewCity: string;
	/** Версия формата данных — для однократных миграций */
	schema: number;
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
		conversations: seedConversations,
		announcements: seedAnnouncements,
		alerts: seedAlerts,
		dayPhotos: [],
		following: seedFollowing,
		privacy: { publicProfile: true, showHours: true, searchable: true, messages: 'all' },
		myOrgId: MY_ORG,
		customOrgs: [],
		viewCity: seedProfile.city,
		schema: SCHEMA
	});
}

function load(): Snapshot {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		return raw ? migrate({ ...fresh(), ...JSON.parse(raw) }) : fresh();
	} catch {
		return fresh();
	}
}

/** Дополняет данные, сохранённые старыми версиями приложения */
function migrate(s: Snapshot): Snapshot {
	if ((s.schema ?? 0) < 3) {
		// Витрина демо-организации (баннер, анонсы, ссылки) появилась в версии 3
		if (s.myOrgId === MY_ORG) s.orgProfile = { ...seedOrgProfile, ...s.orgProfile };
		s.schema = 3;
	}
	const seeds = new Map(seedOpportunities.map((o) => [o.id, o]));
	// Раньше у мероприятий не было города — без него они пропали бы из ленты
	for (const o of s.opportunities) o.city ??= seeds.get(o.id)?.city ?? seedProfile.city;
	// Новые демо-мероприятия появляются и у тех, кто уже открывал приложение
	const known = new Set(s.opportunities.map((o) => o.id));
	for (const seed of seedOpportunities) {
		if (!known.has(seed.id)) s.opportunities.push(structuredClone(seed));
	}
	return s;
}

const uid = () => crypto.randomUUID().slice(0, 8);
const now = () => new Date().toISOString();

export interface Author {
	name: string;
	tone: Tone;
	emoji?: string;
	avatar?: string;
	avatarEmoji?: string;
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
	conversations = $state<Conversation[]>([]);
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
	viewCity = $state<string>(seedProfile.city);
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
		this.conversations = s.conversations;
		this.announcements = s.announcements;
		this.alerts = s.alerts;
		this.dayPhotos = s.dayPhotos;
		this.following = s.following;
		this.privacy = s.privacy;
		this.myOrgId = s.myOrgId;
		this.viewCity = s.viewCity;
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
			conversations: this.conversations,
			announcements: this.announcements,
			alerts: this.alerts,
			dayPhotos: this.dayPhotos,
			following: this.following,
			privacy: this.privacy,
			myOrgId: this.myOrgId,
			viewCity: this.viewCity,
			schema: SCHEMA,
			customOrgs: this.customOrgs
		});
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
		} catch {
			this.notify(tr('Не удалось сохранить: в браузере закончилось место'));
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
			role === 'org'
				? tr('Вы вошли как {0}', this.orgProfile.name)
				: tr('Вы вошли как {0}', this.profile.name)
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
		this.notify(tr('Учётная запись обновлена'));
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
		// Сменили город в профиле — лента сразу показывает возможности этого города
		if (profile.city !== this.profile.city) this.viewCity = profile.city;
		this.profile = profile;
		this.#save();
		this.notify(tr('Профиль сохранён'));
	}

	updateOrgProfile(profile: OrgProfile) {
		this.orgProfile = profile;
		this.#save();
		this.notify(tr('Профиль организации сохранён'));
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
		this.notify(tr('Демо-данные восстановлены'));
	}

	// ───────── Справочники ─────────

	org(id: string) {
		const org = this.allOrgs.find((o) => o.id === id);
		if (!org || id !== this.myOrgId) return org;
		return {
			...org,
			name: this.orgProfile.name,
			city: this.orgProfile.city,
			about: this.orgProfile.about,
			tone: this.orgProfile.tone ?? org.tone
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
				avatarEmoji: this.profile.avatarEmoji,
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
				avatarEmoji: id === this.myOrgId ? this.orgProfile.avatarEmoji : undefined,
				isOrg: true,
				verified: org.verified
			};
		}
		const person = people.find((p) => p.id === id);
		return { name: person?.name ?? tr('Волонтёр'), tone: person?.tone ?? 'blue', isOrg: false };
	}

	topic(id: string) {
		return this.topics.find((t) => t.id === id);
	}

	addTopic(topic: Omit<Topic, 'id' | 'custom'>) {
		const id = `t-${uid()}`;
		this.topics.push({ ...topic, id, custom: true });
		this.#save();
		this.notify(tr('Тема создана и видна всем'));
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

	/** Предстоящие мероприятия выбранного города (онлайн видны везде) */
	get localUpcoming() {
		if (this.viewCity === 'all') return this.upcoming;
		return this.upcoming.filter((o) => o.city === this.viewCity || o.city === ONLINE);
	}

	setViewCity(city: string) {
		this.viewCity = city;
		this.#save();
	}

	byTopic(topicId: string) {
		return this.localUpcoming.filter((o) => o.tags.includes(topicId));
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
				tr('{0} подала заявку на «{1}»', this.profile.name, o.title),
				'/cabinet?folder=applications'
			);
		}
		this.#save();
		this.notify(tr('Анкета отправлена организатору'));
	}

	openApply(opportunityId: string) {
		if (this.isOrg) {
			this.notify(tr('Подавать заявки можно из аккаунта волонтёра'));
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
			this.notify(tr('Убрано из «Напомнить позже»'));
		} else {
			this.reminders.push(opportunityId);
			this.notify(tr('Напомним за день до дедлайна 🔔'));
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
			this.#alert('org', '💬', tr('Новый вопрос по «{0}»', o.title), `/chat?id=${id}`);
		}
		if (o && this.isOrg && personId === ME) {
			this.#alert(
				'volunteer',
				'💬',
				tr('{0} ответил на ваш вопрос', this.orgProfile.name),
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
			tr(
				'Уведомление отправлено {0} {1}',
				count,
				plural(count, 'участнику', 'участникам', 'участникам')
			)
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
					text: tr(
						'{0} заявки ждут вашего решения. Волонтёры быстрее откликаются, если ответить в течение суток.',
						pending
					),
					action: { label: tr('Открыть заявки'), href: '/cabinet?folder=applications' }
				});
			const hours = this.orgHours.filter((h) => h.status === 'pending');
			if (hours.length)
				tips.push({
					id: 'hours',
					emoji: '⏱️',
					text: tr(
						'Подтвердите {0} ч волонтёрства от {1} участников — без этого часы не попадут в их портфолио.',
						hours.reduce((s, h) => s + h.hours, 0),
						hours.length
					),
					action: { label: tr('Подтвердить часы'), href: '/cabinet?folder=hours' }
				});
			const questions = this.orgOpportunities
				.flatMap((o) => this.threadsFor(o.id))
				.filter((t) => this.isUnanswered(t));
			if (questions.length)
				tips.push({
					id: 'questions',
					emoji: '💬',
					text: tr('{0} вопрос(а) от волонтёров без ответа.', questions.length),
					action: { label: tr('Ответить'), href: `/chat?id=${questions[0].id}` }
				});
			for (const o of this.orgOpportunities.filter((o) => o.date === tomorrow)) {
				tips.push({
					id: `tmr-${o.id}`,
					emoji: '📣',
					text: tr('Завтра «{0}». Напомните участникам о времени и месте.', o.title),
					action: { label: tr('Создать уведомление'), href: `/notifications?event=${o.id}` }
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
				text: tr(
					'Завтра «{0}» в {1}. Не забудьте: {2}.',
					o.title,
					o.time.split('–')[0],
					o.requirements.slice(1).join(', ').toLowerCase() || tr('хорошее настроение')
				),
				action: { label: tr('Подробнее'), href: `/o?id=${o.id}` }
			});
		}
		for (const o of this.upcoming) {
			if (!o.deadline || this.myApplication(o.id)) continue;
			const days = Math.round((Date.parse(o.deadline) - Date.parse(day(0))) / 864e5);
			if (this.isReminded(o.id) && days >= 0 && days <= 7) {
				tips.push({
					id: `dl-${o.id}`,
					emoji: '🔔',
					text: tr(
						'Вы просили напомнить: приём заявок на «{0}» закрывается {1}.',
						o.title,
						formatDate(o.deadline)
					),
					action: { label: tr('Податься'), href: `/o?id=${o.id}&apply=1` }
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
				text: tr(
					'Вам может понравиться «{0}»{1}.',
					pick.title,
					topic ? tr(' — это про {0}', tr(topic.label).toLowerCase()) : ''
				),
				action: { label: tr('Посмотреть'), href: `/o?id=${pick.id}` }
			});
		}
		if (this.pendingHours) {
			tips.push({
				id: 'hours',
				emoji: '⏱️',
				text: tr(
					'{0} ч ждут подтверждения организаторами. Как только подтвердят — они появятся в портфолио.',
					this.pendingHours
				),
				action: { label: tr('Портфолио'), href: '/portfolio?tab=requests' }
			});
		}
		return tips;
	}

	get recommendations() {
		const mine = new Set(this.profile.interests);
		return this.localUpcoming
			.map((o) => ({ o, score: o.tags.filter((t) => mine.has(t)).length }))
			.filter((r) => r.score > 0)
			.sort((a, b) => b.score - a.score)
			.map((r) => r.o);
	}

	// ───────── Личные и групповые чаты ─────────

	/** Чаты текущего аккаунта, свежие сверху */
	get myConversations() {
		const me = this.actorId;
		return this.conversations
			.filter((c) => c.members.includes(me))
			.sort((a, b) =>
				(b.messages.at(-1)?.at ?? b.createdAt).localeCompare(a.messages.at(-1)?.at ?? a.createdAt)
			);
	}

	conversation(id: string) {
		return this.conversations.find((c) => c.id === id);
	}

	/** Собеседник в личном диалоге */
	partnerOf(conversation: Conversation) {
		return conversation.members.find((m) => m !== this.actorId) ?? this.actorId;
	}

	unreadIn(conversation: Conversation) {
		const me = this.actorId;
		const since = conversation.lastRead[me] ?? '';
		return conversation.messages.filter((m) => m.from !== me && m.at > since).length;
	}

	get unreadMessages() {
		return this.myConversations.reduce((sum, c) => sum + this.unreadIn(c), 0);
	}

	markConversationRead(conversation: Conversation) {
		if (!this.unreadIn(conversation)) return;
		conversation.lastRead[this.actorId] = now();
		this.#save();
	}

	/** Открывает существующий личный диалог или создаёт новый */
	startDm(personId: string) {
		const me = this.actorId;
		const existing = this.conversations.find(
			(c) => c.kind === 'dm' && c.members.includes(me) && c.members.includes(personId)
		);
		if (existing) return existing.id;
		const id = `dm-${uid()}`;
		this.conversations.push({
			id,
			kind: 'dm',
			members: [me, personId],
			createdBy: me,
			createdAt: now(),
			messages: [],
			lastRead: { [me]: now() }
		});
		this.#save();
		return id;
	}

	createGroup(group: {
		title: string;
		emoji: string;
		tone: Tone;
		opportunityId?: string;
		members: string[];
	}) {
		const me = this.actorId;
		const id = `g-${uid()}`;
		this.conversations.push({
			...group,
			id,
			kind: 'group',
			members: [me, ...group.members.filter((m) => m !== me)],
			createdBy: me,
			createdAt: now(),
			messages: [],
			lastRead: { [me]: now() }
		});
		this.#save();
		this.notify(tr('Групповой чат создан'));
		return id;
	}

	addMembers(conversation: Conversation, members: string[]) {
		conversation.members = [...new Set([...conversation.members, ...members])];
		this.#save();
	}

	leaveConversation(conversation: Conversation) {
		conversation.members = conversation.members.filter((m) => m !== this.actorId);
		this.#save();
		this.notify(tr('Вы вышли из чата'));
	}

	sendToConversation(conversation: Conversation, text: string) {
		const me = this.actorId;
		conversation.messages.push({ id: uid(), from: me, text, at: now() });
		conversation.lastRead[me] = now();
		this.#save();
	}

	/** Вопросы по мероприятиям, где участвует текущий аккаунт */
	get myEventThreads() {
		const mine = this.isOrg
			? this.threads.filter((t) => this.opportunity(t.opportunityId)?.orgId === this.myOrgId)
			: this.threads.filter((t) => t.personId === ME);
		return mine
			.filter((t) => t.messages.length)
			.sort((a, b) => (b.messages.at(-1)?.at ?? '').localeCompare(a.messages.at(-1)?.at ?? ''));
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
		this.notify(post.kind === 'review' ? tr('Отзыв опубликован') : tr('Пост опубликован'));
	}

	postsBy(authorId: string) {
		return this.posts.filter((p) => p.authorId === authorId);
	}

	toggleLike(post: Post) {
		post.liked = !post.liked;
		post.likes += post.liked ? 1 : -1;
		this.#save();
	}

	/** Лайк по двойному тапу: только ставит отметку, снять её можно кнопкой */
	likePost(post: Post) {
		if (post.liked) return;
		post.liked = true;
		post.likes += 1;
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
				await navigator.share({ title: tr('Волна'), text: post.text.slice(0, 80), url });
			else await navigator.clipboard.writeText(url);
			post.shares += 1;
			this.#save();
			if (!navigator.share) this.notify(tr('Ссылка скопирована'));
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
				tr('{0} просит подтвердить {1} ч', this.profile.name, entry.hours),
				'/cabinet?folder=hours'
			);
		}
		this.#save();
		this.notify(tr('Заявка на подтверждение часов отправлена'));
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
		this.notify(tr('Документ добавлен на полку'));
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
				tr('{0} наградил вас: «{1}»', this.orgProfile.name, award.title),
				'/awards'
			);
		}
		this.#save();
		this.notify(
			tr(
				'Награда вручена {0} {1}',
				personIds.length,
				plural(personIds.length, 'волонтёру', 'волонтёрам', 'волонтёрам')
			)
		);
	}

	// ───────── Календарь ─────────

	photosFor(date: string) {
		return this.dayPhotos.filter((p) => p.date === date && p.owner === this.role);
	}

	addDayPhoto(date: string, src: string) {
		this.dayPhotos.push({ id: uid(), owner: this.role, date, src });
		this.#save();
		this.notify(tr('Фото добавлено в календарь'));
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
		this.notify(tr('Мероприятие опубликовано'));
		return id;
	}

	promote(opportunityId: string, days: number) {
		const o = this.opportunity(opportunityId);
		if (!o) return;
		o.promotedUntil = day(days);
		this.#save();
		this.notify(tr('«{0}» продвигается до {1}', o.title, formatDate(o.promotedUntil)));
	}

	decide(application: Application, status: ApplicationStatus) {
		application.status = status;
		if (status === 'approved') application.role ??= tr('Волонтёр');
		const o = this.opportunity(application.opportunityId);
		if (o && application.personId === ME && status !== 'pending') {
			this.#alert(
				'volunteer',
				status === 'approved' ? '✅' : '😔',
				status === 'approved'
					? tr('Заявка на «{0}» подтверждена — день отмечен в календаре', o.title)
					: tr('Заявка на «{0}» отклонена', o.title),
				status === 'approved' ? '/calendar' : `/o?id=${o.id}`
			);
		}
		this.#save();
		this.notify(
			status === 'approved'
				? tr('Участие подтверждено')
				: status === 'declined'
					? tr('Заявка отклонена')
					: tr('Заявка возвращена')
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
			note: tr('Начислено куратором')
		});
		if (application.personId === ME)
			this.#alert(
				'volunteer',
				'⏱️',
				tr('Начислено {0} ч за «{1}»', o.hours, o.title),
				'/portfolio?tab=hours'
			);
		this.#save();
		this.notify(tr('Начислено {0} ч', o.hours));
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
					? tr('Подтверждено {0} ч: «{1}»', entry.hours, entry.title)
					: tr('Часы за «{0}» не подтверждены', entry.title),
				'/portfolio?tab=requests'
			);
		}
		this.#save();
		this.notify(ok ? tr('Подтверждено {0} ч', entry.hours) : tr('Часы отклонены'));
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
