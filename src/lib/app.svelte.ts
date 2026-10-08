import { tr } from './i18n.ts';
import { ONLINE, builtinTopics, day } from './data.ts';
import { PENDING_ROLE_KEY } from './auth.ts';
import { demoMode, firebaseAuth, firebaseEnabled } from './firebase.ts';
import { formatDate, plural } from './format.ts';
import { deleteBlob } from './media-db.ts';
import { getOne, listen, push, type Doc, type Filter, type Remote } from './sync.ts';
import type {
	Accent,
	Alert,
	Announcement,
	Answers,
	Application,
	Appeal,
	AuditEntry,
	ModeratorRole,
	Report,
	ApplicationStatus,
	Award,
	Consent,
	Conversation,
	CustomTheme,
	DayPhoto,
	HoursEntry,
	LogoColors,
	Membership,
	Opportunity,
	OrgProfile,
	OrgVerification,
	Organization,
	Person,
	Post,
	Privacy,
	Profile,
	Role,
	SavedTheme,
	Session,
	Skill,
	SkillMaterial,
	ThemeMode,
	Thread,
	Tone,
	Topic
} from './types.ts';

/** Настройки этого устройства. Общие данные живут в Firestore */
const PREFS_KEY = 'volna:prefs:v3';
/** Демо-данные прошлых версий — удаляем при первом запуске */
const LEGACY_KEYS = ['volna:state:v2'];

interface Prefs {
	session: Session | null;
	accent: Accent;
	mode: ThemeMode;
	/** Своя палитра интерфейса на этом устройстве; null — стандартная тема */
	customTheme: CustomTheme | null;
	/** Папка «Мои темы»: все созданные темы, ни одна не теряется */
	savedThemes: SavedTheme[];
	/** Тема из папки, которая сейчас применена и автоматически сохраняется */
	activeThemeId: string | null;
	/** Свои цвета логотипа; null — фирменные */
	logoColors: LogoColors | null;
	/** Шрифт названия у логотипа; null — шрифт приложения */
	logoFont: string | null;
	/** Город, по которому фильтруется лента возможностей; all — все города */
	viewCity: string;
	/** Мероприятия из «Напомнить позже» */
	reminders: string[];
}

const defaultPrefs = (): Prefs => ({
	session: null,
	accent: 'wave',
	mode: 'light',
	customTheme: null,
	savedThemes: [],
	activeThemeId: null,
	logoColors: null,
	logoFont: null,
	viewCity: 'all',
	reminders: []
});

function loadPrefs(): Prefs {
	try {
		for (const key of LEGACY_KEYS) localStorage.removeItem(key);
		const raw = localStorage.getItem(PREFS_KEY);
		return raw ? { ...defaultPrefs(), ...JSON.parse(raw) } : defaultPrefs();
	} catch {
		return defaultPrefs();
	}
}

/** Синхронизируемые коллекции: поле хранилища → коллекция Firestore */
const COLLECTIONS = {
	people: 'people',
	orgs: 'orgs',
	customTopics: 'topics',
	opportunities: 'opportunities',
	applications: 'applications',
	hours: 'hours',
	posts: 'posts',
	awards: 'awards',
	skills: 'skills',
	skillMaterials: 'skillMaterials',
	threads: 'threads',
	conversations: 'conversations',
	announcements: 'announcements',
	alerts: 'alerts',
	dayPhotos: 'dayPhotos',
	reports: 'reports',
	appeals: 'appeals',
	auditLog: 'auditLog'
} as const;

type Field = keyof typeof COLLECTIONS;
const FIELDS = Object.keys(COLLECTIONS) as Field[];

/**
 * Личные коллекции загружаются только для своих аккаунтов (волонтёр и его организация).
 * Жалобы и журнал видят только модераторы, апелляции — автор и модераторы.
 */
const SCOPED: Partial<
	Record<Field, (ids: string[], moderator: boolean) => Filter | null | 'skip'>
> = {
	appeals: (ids, moderator) => (moderator ? null : { field: 'personId', op: '==', value: ids[0] }),
	reports: (_, moderator) => (moderator ? null : 'skip'),
	auditLog: (_, moderator) => (moderator ? null : 'skip'),
	alerts: (ids) => ({ field: 'to', op: 'in', value: ids }),
	conversations: (ids) => ({ field: 'members', op: 'array-contains-any', value: ids }),
	threads: (ids) => ({ field: 'members', op: 'array-contains-any', value: ids }),
	dayPhotos: (ids) => ({ field: 'ownerId', op: 'in', value: ids })
};
const SCOPED_FIELDS = Object.keys(SCOPED) as Field[];

const byNewest =
	<T>(key: (item: T) => string) =>
	(a: T, b: T) =>
		key(b).localeCompare(key(a));

const ORDER: Partial<Record<Field, (a: never, b: never) => number>> = {
	posts: byNewest<Post>((p) => p.createdAt),
	alerts: byNewest<Alert>((a) => a.at),
	awards: byNewest<Award>((a) => a.date),
	reports: byNewest<Report>((r) => r.createdAt),
	appeals: byNewest<Appeal>((a) => a.createdAt),
	auditLog: byNewest<AuditEntry>((e) => e.at)
};

const uid = () => crypto.randomUUID().replace(/-/g, '').slice(0, 16);
/** ID сертификата: VLN-XXXX-XXXX, без похожих символов (0/O, 1/I) */
const certificateCode = () => {
	const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
	const bytes = crypto.getRandomValues(new Uint8Array(8));
	const chars = [...bytes].map((b) => alphabet[b % alphabet.length]).join('');
	return `VLN-${chars.slice(0, 4)}-${chars.slice(4)}`;
};
const now = () => new Date().toISOString();
const TONES: Tone[] = ['blue', 'yellow', 'green', 'lilac', 'peach'];

/** Поля, которые меняет форма профиля (подписки и организация не затрагиваются) */
const LOOK_KEYS = [
	'avatar',
	'avatarEmoji',
	'cover',
	'coverPreset',
	'coverVideoId',
	'coverVideoUrl',
	'tint'
] as const;
const PROFILE_KEYS = [...LOOK_KEYS, 'name', 'age', 'city', 'bio', 'interests', 'tone'] as const;
const ORG_KEYS = [
	...LOOK_KEYS,
	'name',
	'city',
	'about',
	'tone',
	'website',
	'telegram',
	'banner',
	'announcements'
] as const;

/** Копирует только перечисленные поля; отсутствующие удаляются */
function assign<T extends object>(target: T, source: object, keys: readonly string[]) {
	for (const key of keys)
		(target as Record<string, unknown>)[key] = (source as Record<string, unknown>)[key];
}

const blankProfile = (): Profile => ({
	name: '',
	age: 0,
	city: '',
	bio: '',
	interests: [],
	tone: 'blue'
});

export interface Author {
	name: string;
	tone: Tone;
	emoji?: string;
	avatar?: string;
	avatarEmoji?: string;
	isOrg: boolean;
	verified?: boolean;
}

/** Данные регистрации: имя волонтёра и организация куратора */
export interface SignUp {
	role: Role;
	name?: string;
	city?: string;
	/** Существующая организация или данные новой */
	orgId?: string;
	newOrg?: Pick<Organization, 'name' | 'city' | 'about'>;
}

class AppState {
	// ───────── Настройки устройства ─────────
	session = $state<Session | null>(null);
	accent = $state<Accent>('wave');
	mode = $state<ThemeMode>('light');
	customTheme = $state<CustomTheme | null>(null);
	savedThemes = $state<SavedTheme[]>([]);
	activeThemeId = $state<string | null>(null);
	logoColors = $state<LogoColors | null>(null);
	logoFont = $state<string | null>(null);
	/** Тёмная ли тема в системе — для режима «Системная» */
	systemDark = $state(false);
	viewCity = $state('all');
	reminders = $state<string[]>([]);

	// ───────── Общие данные (Firestore) ─────────
	people = $state<Person[]>([]);
	orgs = $state<Organization[]>([]);
	customTopics = $state<Topic[]>([]);
	opportunities = $state<Opportunity[]>([]);
	applications = $state<Application[]>([]);
	hours = $state<HoursEntry[]>([]);
	posts = $state<Post[]>([]);
	awards = $state<Award[]>([]);
	skills = $state<Skill[]>([]);
	skillMaterials = $state<SkillMaterial[]>([]);
	threads = $state<Thread[]>([]);
	conversations = $state<Conversation[]>([]);
	announcements = $state<Announcement[]>([]);
	alerts = $state<Alert[]>([]);
	dayPhotos = $state<DayPhoto[]>([]);
	reports = $state<Report[]>([]);
	appeals = $state<Appeal[]>([]);
	auditLog = $state<AuditEntry[]>([]);
	/** Роль модератора: назначается в Firestore (коллекция moderators), не из приложения */
	modRole = $state<ModeratorRole | null>(null);

	// ───────── Состояние подключения ─────────
	/** id пользователя Firebase */
	uid = $state<string | null>(null);
	/** Firebase сообщил, вошёл ли пользователь — до этого не перенаправляем на вход */
	ready = $state(!firebaseEnabled && !demoMode);
	/** Сервер недоступен: данные сохраняются на устройстве и уйдут при подключении */
	offline = $state(false);

	toast = $state<{ id: number; text: string } | null>(null);
	/** Мероприятие, анкету на которое сейчас заполняет волонтёр */
	applyingId = $state<string | null>(null);

	#remote = Object.fromEntries(FIELDS.map((f) => [f, new Map()])) as Record<Field, Remote>;
	#unsubscribe = new Map<Field, () => void>();
	#scope = '';

	constructor() {
		const prefs = loadPrefs();
		this.session = prefs.session;
		this.accent = prefs.accent;
		this.mode = prefs.mode;
		this.customTheme = prefs.customTheme;
		this.savedThemes = prefs.savedThemes;
		this.activeThemeId = prefs.activeThemeId;
		// Тема, созданная до появления «Моих тем», тоже попадает в папку
		if (this.customTheme && !this.savedThemes.length) this.#addSavedTheme(this.customTheme);
		this.logoColors = prefs.logoColors;
		this.logoFont = prefs.logoFont;
		this.viewCity = prefs.viewCity;
		this.reminders = prefs.reminders;
		if (demoMode && typeof window !== 'undefined') this.#loadDemo();
		else if (firebaseEnabled && typeof window !== 'undefined') this.#watchAuth();
	}

	// ───────── Демо-версия ─────────

	/** Выдуманные данные демо-версии живут только в этом браузере */
	static readonly DEMO_KEY = 'volna:demo:v1';

	async #loadDemo() {
		let saved: Partial<Record<Field, Doc[]>> & { modRole?: ModeratorRole | null };
		try {
			saved = JSON.parse(localStorage.getItem(AppState.DEMO_KEY) ?? '{}');
		} catch {
			saved = {};
		}
		const { demoState } = await import('./demo/index.ts');
		const seed = demoState() as unknown as Partial<Record<Field, Doc[]>>;
		for (const field of FIELDS) {
			(this as unknown as Record<Field, Doc[]>)[field] = saved[field] ?? seed[field] ?? [];
		}
		this.modRole = saved.modRole ?? null;
		if (this.session) this.uid = 'me';
		this.ready = true;
	}

	#saveDemo() {
		const data = Object.fromEntries(
			FIELDS.map((f) => [f, $state.snapshot((this as unknown as Record<Field, Doc[]>)[f])])
		);
		try {
			localStorage.setItem(AppState.DEMO_KEY, JSON.stringify({ ...data, modRole: this.modRole }));
		} catch {
			// хранилище переполнено — изменения продержатся до перезагрузки
		}
	}

	/** Вход в демо-версию без регистрации: волонтёр, организация или модератор */
	demoLogin(as: 'volunteer' | 'org' | 'moderator') {
		this.uid = 'me';
		this.modRole = as === 'moderator' ? 'admin' : null;
		this.session = {
			method: 'email',
			contact: 'demo@volna.kg',
			role: as === 'org' ? 'org' : 'volunteer'
		};
		this.#savePrefs();
		this.#saveDemo();
	}

	/** Вернуть демо-данные к исходным */
	async resetDemo() {
		localStorage.removeItem(AppState.DEMO_KEY);
		await this.#loadDemo();
		this.notify(tr('Демо-данные восстановлены'));
	}

	// ───────── Подключение к серверу ─────────

	async #watchAuth() {
		try {
			const [auth, { onAuthStateChanged, getRedirectResult }] = await Promise.all([
				firebaseAuth(),
				import('firebase/auth')
			]);
			// Вернулись со страницы Google (всплывающее окно было заблокировано) — завершаем вход
			getRedirectResult(auth)
				.then((result) => {
					if (!result?.user) return;
					let role: Role = 'volunteer';
					try {
						if (sessionStorage.getItem(PENDING_ROLE_KEY) === 'org') role = 'org';
						sessionStorage.removeItem(PENDING_ROLE_KEY);
					} catch {
						// хранилище недоступно — входим волонтёром
					}
					return this.completeSignIn(
						{ method: 'google', contact: result.user.email ?? '' },
						{ role, name: result.user.displayName ?? '' }
					);
				})
				.catch((e) => console.warn('auth: redirect', e));
			onAuthStateChanged(auth, (user) => {
				this.uid = user?.uid ?? null;
				if (user) {
					this.session ??= {
						method: user.providerData.some((p) => p.providerId === 'google.com')
							? 'google'
							: 'email',
						contact: user.email ?? user.phoneNumber ?? '',
						role: 'volunteer'
					};
					if (!this.#unsubscribe.size) this.#start();
					this.#loadRole(user.uid);
				} else {
					this.session = null;
					this.#stop(FIELDS);
				}
				this.ready = true;
				this.#savePrefs();
			});
		} catch {
			this.ready = true;
			this.offline = true;
		}
	}

	/** Свои аккаунты: волонтёр и организация, которую он ведёт */
	get #ids() {
		return [this.uid, this.myOrgId].filter(Boolean) as string[];
	}

	#start() {
		this.#stop(FIELDS);
		this.#scope = this.#ids.join();
		for (const field of FIELDS) this.#listen(field);
	}

	#listen(field: Field) {
		const scoped = SCOPED[field];
		const filter = scoped ? scoped(this.#ids, this.isModerator) : null;
		if (filter === 'skip') return;
		const ready = listen<Doc>(
			COLLECTIONS[field],
			filter,
			this.#remote[field],
			(docs) => {
				const order = ORDER[field];
				(this as unknown as Record<Field, Doc[]>)[field] = order
					? docs.sort(order as (a: Doc, b: Doc) => number)
					: docs;
				this.offline = false;
				// Появилась или сменилась своя организация — переподписываем личные коллекции
				if (field === 'people' && this.#ids.join() !== this.#scope) this.#rescope();
			},
			(error) => {
				console.warn(`sync: ${field}`, error);
				this.offline = true;
			}
		);
		// Отписка может понадобиться раньше, чем подписка успеет установиться
		this.#unsubscribe.set(field, () => ready.then((stop) => stop()).catch(() => {}));
	}

	/** Модераторы перечислены в коллекции moderators — её правят только через консоль Firebase */
	async #loadRole(uid: string) {
		try {
			const found = await getOne<Doc & { role?: ModeratorRole }>('moderators', uid);
			const role = found ? (found.role ?? 'moderator') : null;
			if (role === this.modRole) return;
			this.modRole = role;
			this.#rescope();
		} catch {
			this.modRole = null;
		}
	}

	get isModerator() {
		return !!this.modRole;
	}

	#rescope() {
		this.#scope = this.#ids.join();
		this.#stop(SCOPED_FIELDS);
		for (const field of SCOPED_FIELDS) this.#listen(field);
	}

	#stop(fields: Field[]) {
		for (const field of fields) {
			this.#unsubscribe.get(field)?.();
			this.#unsubscribe.delete(field);
			this.#remote[field].clear();
			(this as unknown as Record<Field, Doc[]>)[field] = [];
		}
	}

	#savePrefs() {
		const prefs: Prefs = $state.snapshot({
			session: this.session,
			accent: this.accent,
			mode: this.mode,
			customTheme: this.customTheme,
			savedThemes: this.savedThemes,
			activeThemeId: this.activeThemeId,
			logoColors: this.logoColors,
			logoFont: this.logoFont,
			viewCity: this.viewCity,
			reminders: this.reminders
		});
		try {
			localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
		} catch {
			// хранилище недоступно — настройки продержатся до перезагрузки
		}
	}

	/** Сохраняет настройки и отправляет изменения указанных коллекций на сервер */
	#save(...fields: Field[]) {
		this.#savePrefs();
		if (demoMode) {
			this.#saveDemo();
			return;
		}
		if (!this.uid) return;
		for (const field of fields) {
			push(
				COLLECTIONS[field],
				$state.snapshot((this as unknown as Record<Field, Doc[]>)[field]) as Doc[],
				this.#remote[field]
			).catch((e) => console.warn(`sync: push ${field}`, e));
		}
	}

	/** Актуальная версия объекта из коллекции (после обновления с сервера ссылка могла устареть) */
	#fresh<T extends Doc>(list: T[], item: T) {
		return list.find((x) => x.id === item.id);
	}

	notify(text: string) {
		this.toast = { id: Date.now(), text };
		const id = this.toast.id;
		setTimeout(() => {
			if (this.toast?.id === id) this.toast = null;
		}, 2600);
	}

	/** Личное уведомление получателю: волонтёру или организации */
	#alert(to: string, emoji: string, text: string, href?: string) {
		if (!to || to === this.actorId) return;
		this.alerts.unshift({ id: uid(), to, emoji, text, href, at: now(), read: false });
	}

	// ───────── Аккаунт ─────────

	get role(): Role {
		return this.session?.role ?? 'volunteer';
	}

	get isOrg() {
		return this.role === 'org' && !!this.myOrgId;
	}

	/** id текущего пользователя (волонтёра) */
	get me() {
		return this.uid ?? '';
	}

	/** Мой публичный профиль */
	get myPerson() {
		return this.people.find((p) => p.id === this.me);
	}

	get profile(): Profile {
		return this.myPerson ?? blankProfile();
	}

	get myOrgId() {
		return this.myPerson?.orgId ?? '';
	}

	/** Текущий автор: волонтёр или организация */
	get actorId() {
		return this.isOrg ? this.myOrgId : this.me;
	}

	get privacy(): Privacy {
		return (
			this.myPerson?.privacy ?? {
				publicProfile: true,
				showHours: true,
				searchable: true,
				messages: 'all'
			}
		);
	}

	/**
	 * Завершает вход: Firebase уже подтвердил пользователя. При первом входе создаёт
	 * профиль, а для куратора — организацию или привязку к существующей.
	 */
	async completeSignIn(session: Omit<Session, 'role'>, data: SignUp) {
		const auth = await firebaseAuth();
		const id = auth.currentUser?.uid;
		if (!id) throw new Error('auth/no-current-user');
		this.uid = id;
		let person = this.people.find((p) => p.id === id);
		if (!person) {
			try {
				person = await getOne<Person>('people', id);
			} catch {
				person = undefined;
			}
		}
		person ??= {
			...blankProfile(),
			id,
			name: data.name?.trim() || data.newOrg?.name || session.contact,
			city: data.city ?? data.newOrg?.city ?? '',
			tone: TONES[Math.floor(Math.random() * TONES.length)],
			following: [],
			createdAt: now()
		};
		if (data.role === 'org') {
			const orgId = data.newOrg ? this.#createOrg(data.newOrg, id) : data.orgId;
			const org = this.orgs.find((o) => o.id === orgId);
			// К проверенной организации нельзя присоединиться самому — иначе её часы мог бы начислять кто угодно
			if (orgId && (!org || org.ownerIds.includes(id) || !org.verified)) {
				person = { ...person, orgId };
				if (org && !org.ownerIds.includes(id)) org.ownerIds = [...org.ownerIds, id];
			}
		}
		const index = this.people.findIndex((p) => p.id === id);
		if (index === -1) this.people.push(person);
		else this.people[index] = person;
		this.session = { ...session, role: data.role === 'org' && person.orgId ? 'org' : 'volunteer' };
		if (person.city) this.viewCity = person.city;
		this.#save('people', 'orgs');
		this.#rescope();
	}

	/** Все организации платформы */
	get allOrgs(): Organization[] {
		return this.orgs;
	}

	#createOrg(data: Pick<Organization, 'name' | 'city' | 'about'>, ownerId: string) {
		const org: Organization = {
			...data,
			id: `org-${uid()}`,
			tone: TONES[this.orgs.length % TONES.length],
			emoji: '🏢',
			verified: false,
			ownerIds: [ownerId],
			createdAt: now()
		};
		this.orgs.push(org);
		return org.id;
	}

	/** Добавить аккаунт организации к уже вошедшему волонтёру */
	addOrgAccount(data: { orgId?: string; newOrg?: Pick<Organization, 'name' | 'city' | 'about'> }) {
		const me = this.myPerson;
		if (!me) return;
		const orgId = data.newOrg ? this.#createOrg(data.newOrg, me.id) : data.orgId;
		if (!orgId) return;
		const org = this.orgs.find((o) => o.id === orgId);
		if (org?.verified && !org.ownerIds.includes(me.id)) {
			this.notify(tr('К проверенной организации куратора добавляет сама организация'));
			return;
		}
		if (org && !org.ownerIds.includes(me.id)) org.ownerIds = [...org.ownerIds, me.id];
		me.orgId = orgId;
		this.#save('people', 'orgs');
		this.#rescope();
		this.switchRole('org');
	}

	switchRole(role: Role) {
		if (!this.session) return;
		this.session.role = role;
		this.#savePrefs();
		this.notify(
			role === 'org'
				? tr('Вы вошли как {0}', this.orgProfile.name)
				: tr('Вы вошли как {0}', this.profile.name)
		);
	}

	async logout() {
		this.session = null;
		if (demoMode) {
			this.uid = null;
			this.modRole = null;
			this.#saveDemo();
		}
		this.#savePrefs();
		if (!firebaseEnabled) return;
		try {
			const [auth, { signOut }] = await Promise.all([firebaseAuth(), import('firebase/auth')]);
			await signOut(auth);
		} catch {
			// без сети выход завершится при следующем подключении
		}
	}

	updateContact(contact: string) {
		if (!this.session) return;
		this.session.contact = contact;
		this.#savePrefs();
		this.notify(tr('Учётная запись обновлена'));
	}

	setAccent(accent: Accent) {
		this.accent = accent;
		this.#savePrefs();
	}

	setMode(mode: ThemeMode) {
		this.mode = mode;
		this.#savePrefs();
	}

	/** Итоговая тема с учётом режима «Системная» */
	get isDark() {
		return this.mode === 'system' ? this.systemDark : this.mode === 'dark';
	}

	/**
	 * Своя палитра применяется сразу на всех экранах. Каждое изменение автоматически
	 * сохраняется в «Мои темы»: в текущую тему, а если её нет — в новую.
	 */
	setCustomTheme(theme: CustomTheme | null) {
		this.customTheme = theme;
		// Выключение темы не теряет её: в папке остаётся и последняя применённая
		if (theme) {
			const active = this.savedThemes.find((t) => t.id === this.activeThemeId);
			if (active) {
				active.theme = { ...theme };
				active.updatedAt = now();
			} else this.#addSavedTheme(theme);
		}
		this.#savePrefs();
	}

	/** Новая тема в папке с уникальным именем «Моя тема N» */
	#addSavedTheme(theme: CustomTheme) {
		const numbers = this.savedThemes.map((t) => Number(/(\d+)$/.exec(t.name)?.[1] ?? 0));
		const saved: SavedTheme = {
			id: uid(),
			name: tr('Моя тема {0}', Math.max(0, ...numbers) + 1),
			theme: { ...theme },
			createdAt: now(),
			updatedAt: now()
		};
		this.savedThemes.unshift(saved);
		this.activeThemeId = saved.id;
		return saved;
	}

	/** Сохранить текущие цвета отдельной темой, не трогая прежнюю */
	saveThemeAsNew(theme?: CustomTheme) {
		const source = theme ?? this.customTheme;
		if (!source) return;
		this.customTheme = { ...source };
		const saved = this.#addSavedTheme(source);
		this.#savePrefs();
		this.notify(tr('Сохранено в «Мои темы»: {0}', saved.name));
	}

	applySavedTheme(id: string) {
		const saved = this.savedThemes.find((t) => t.id === id);
		if (!saved) return;
		this.customTheme = { ...saved.theme };
		this.activeThemeId = id;
		this.#savePrefs();
	}

	renameSavedTheme(id: string, name: string) {
		const saved = this.savedThemes.find((t) => t.id === id);
		if (!saved || !name.trim()) return;
		saved.name = name.trim();
		this.#savePrefs();
	}

	/** Удаление только по явной просьбе; применённые цвета остаются на экране */
	deleteSavedTheme(id: string) {
		this.savedThemes = this.savedThemes.filter((t) => t.id !== id);
		if (this.activeThemeId === id) this.activeThemeId = null;
		this.#savePrefs();
	}

	/** Цвета значка и надписи логотипа меняются сразу на всех экранах */
	setLogoColors(colors: LogoColors | null) {
		this.logoColors = colors;
		this.#savePrefs();
	}

	setLogoFont(font: string | null) {
		this.logoFont = font;
		this.#savePrefs();
	}

	/** Согласие с условиями сохраняется в профиле один раз */
	saveConsent(consent: Omit<Consent, 'at'>) {
		const me = this.myPerson;
		if (!me) return;
		me.consent = { ...consent, at: now() };
		this.#save('people');
	}

	setPrivacy(privacy: Privacy) {
		const me = this.myPerson;
		if (!me) return;
		me.privacy = privacy;
		this.#save('people');
	}

	updateProfile(profile: Profile) {
		const me = this.myPerson;
		if (!me) return;
		// Сменили город в профиле — лента сразу показывает возможности этого города
		if (profile.city && profile.city !== me.city) this.viewCity = profile.city;
		assign(me, profile, PROFILE_KEYS);
		this.#save('people');
		this.notify(tr('Профиль сохранён'));
	}

	get myOrg(): Organization {
		return (
			this.org(this.myOrgId) ?? {
				id: '',
				name: '',
				city: '',
				about: '',
				tone: 'blue',
				emoji: '🏢',
				verified: false,
				ownerIds: [],
				createdAt: ''
			}
		);
	}

	get orgProfile(): OrgProfile {
		return this.myOrg;
	}

	updateOrgProfile(profile: OrgProfile) {
		const org = this.orgs.find((o) => o.id === this.myOrgId);
		if (!org) return;
		assign(org, { ...profile, tone: profile.tone ?? org.tone }, ORG_KEYS);
		this.#save('orgs');
		this.notify(tr('Профиль организации сохранён'));
	}

	// ───────── Справочники ─────────

	org(id: string) {
		return this.orgs.find((o) => o.id === id);
	}

	person(id: string) {
		return this.people.find((p) => p.id === id);
	}

	/** Автор поста, комментария или сообщения: волонтёр или организация */
	author(id: string): Author {
		const org = this.org(id);
		if (org) {
			return {
				name: org.name,
				tone: org.tone,
				emoji: org.emoji,
				avatar: org.avatar,
				avatarEmoji: org.avatarEmoji,
				isOrg: true,
				verified: org.verified
			};
		}
		const person = this.person(id);
		return {
			name: person?.name || tr('Пользователь'),
			tone: person?.tone ?? 'blue',
			avatar: person?.avatar,
			avatarEmoji: person?.avatarEmoji,
			isOrg: false
		};
	}

	get topics(): Topic[] {
		return [...builtinTopics, ...this.customTopics];
	}

	topic(id: string) {
		return this.topics.find((t) => t.id === id);
	}

	addTopic(topic: Omit<Topic, 'id' | 'custom'>) {
		const id = `t-${uid()}`;
		this.customTopics.push({ ...topic, id, custom: true });
		this.#save('customTopics');
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
			.filter((o) => o.date >= today && !o.removed)
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
		this.#savePrefs();
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
		return this.applications.find(
			(a) => a.opportunityId === opportunityId && a.personId === this.me
		);
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
		if (!o || !this.me || this.myApplication(opportunityId)) return;
		this.applications.push({
			id: uid(),
			opportunityId,
			personId: this.me,
			status: 'pending',
			createdAt: now(),
			answers
		});
		this.#alert(
			o.orgId,
			'📝',
			tr('{0} подала заявку на «{1}»', this.profile.name, o.title),
			'/cabinet?folder=applications'
		);
		this.#save('applications', 'alerts');
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
		this.#savePrefs();
	}

	// ───────── Вопросы по мероприятиям и уведомления ─────────

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
		const o = this.opportunity(opportunityId);
		if (!o) return;
		const id = this.threadId(opportunityId, personId);
		let thread = this.thread(id);
		if (!thread) {
			this.threads.push({
				id,
				opportunityId,
				personId,
				members: [personId, o.orgId],
				messages: []
			});
			thread = this.thread(id)!;
		}
		thread.messages.push({ id: uid(), from: this.actorId, text, at: now() });
		if (this.isOrg) {
			this.#alert(
				personId,
				'💬',
				tr('{0} ответил на ваш вопрос', this.orgProfile.name),
				`/chat?id=${id}`
			);
		} else {
			this.#alert(o.orgId, '💬', tr('Новый вопрос по «{0}»', o.title), `/chat?id=${id}`);
		}
		this.#save('threads', 'alerts');
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
		const recipients = this.applications.filter(
			(a) => a.opportunityId === opportunityId && a.status !== 'declined'
		);
		for (const a of recipients) {
			this.#alert(
				a.personId,
				'📣',
				`${this.org(o.orgId)?.name}: ${title}`,
				`/notifications?event=${o.id}`
			);
		}
		this.#save('announcements', 'alerts');
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
		return this.alerts.filter((a) => a.to === this.actorId);
	}

	get unread() {
		return this.myAlerts.filter((a) => !a.read).length;
	}

	markAlertsRead() {
		let changed = false;
		for (const a of this.alerts) {
			if (a.to === this.actorId && !a.read) {
				a.read = true;
				changed = true;
			}
		}
		if (changed) this.#save('alerts');
	}

	/** Мероприятия во вкладке «Уведомления» */
	get notificationEvents() {
		const today = day(0);
		if (this.isOrg) return this.orgOpportunities.filter((o) => o.date >= today).reverse();
		const ids = new Set([
			...this.applications
				.filter((a) => a.personId === this.me && a.status !== 'declined')
				.map((a) => a.opportunityId),
			...this.reminders
		]);
		return this.upcoming.filter((o) => ids.has(o.id)).sort((a, b) => a.date.localeCompare(b.date));
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
		const c = this.#fresh(this.conversations, conversation);
		if (!c || !this.unreadIn(c)) return;
		c.lastRead[this.actorId] = now();
		this.#save('conversations');
	}

	/** Открывает существующий личный диалог или создаёт новый */
	startDm(personId: string) {
		const me = this.actorId;
		const existing = this.conversations.find(
			(c) => c.kind === 'dm' && c.members.includes(me) && c.members.includes(personId)
		);
		if (existing) return existing.id;
		// Один id для пары собеседников — двое не создадут два разных диалога
		const id = `dm-${[me, personId].sort().join('-')}`;
		this.conversations.push({
			id,
			kind: 'dm',
			members: [me, personId],
			createdBy: me,
			createdAt: now(),
			messages: [],
			lastRead: { [me]: now() }
		});
		this.#save('conversations');
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
		this.#save('conversations');
		this.notify(tr('Групповой чат создан'));
		return id;
	}

	addMembers(conversation: Conversation, members: string[]) {
		const c = this.#fresh(this.conversations, conversation);
		if (!c) return;
		c.members = [...new Set([...c.members, ...members])];
		this.#save('conversations');
	}

	leaveConversation(conversation: Conversation) {
		const c = this.#fresh(this.conversations, conversation);
		if (!c) return;
		c.members = c.members.filter((m) => m !== this.actorId);
		this.#save('conversations');
		this.notify(tr('Вы вышли из чата'));
	}

	sendToConversation(conversation: Conversation, text: string) {
		const c = this.#fresh(this.conversations, conversation);
		if (!c) return;
		const me = this.actorId;
		c.messages.push({ id: uid(), from: me, text, at: now() });
		c.lastRead[me] = now();
		this.#save('conversations');
	}

	/** Вопросы по мероприятиям, где участвует текущий аккаунт */
	get myEventThreads() {
		const mine = this.isOrg
			? this.threads.filter((t) => this.opportunity(t.opportunityId)?.orgId === this.myOrgId)
			: this.threads.filter((t) => t.personId === this.me);
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
			likedBy: [],
			shares: 0,
			comments: [],
			createdAt: now()
		});
		this.#save('posts');
		this.notify(post.kind === 'review' ? tr('Отзыв опубликован') : tr('Пост опубликован'));
	}

	/** Публикации для ленты: без скрытых автором видео */
	get visiblePosts() {
		return this.posts.filter((p) => !p.hidden);
	}

	postsBy(authorId: string) {
		return this.visiblePosts.filter((p) => p.authorId === authorId);
	}

	/** Скрытые видео автора — их можно вернуть или удалить окончательно */
	hiddenPostsBy(authorId: string) {
		return this.posts.filter((p) => p.hidden && p.authorId === authorId);
	}

	/** Скрыть публикацию из ленты и профиля, не удаляя её */
	setPostHidden(post: Post, hidden: boolean) {
		const p = this.#fresh(this.posts, post);
		if (!p) return;
		p.hidden = hidden || undefined;
		this.#save('posts');
		this.notify(
			hidden
				? tr('Публикация скрыта — её можно вернуть в профиле, в разделе «Скрытые»')
				: tr('Публикация снова видна')
		);
	}

	/** Окончательное удаление публикации вместе с видеофайлом */
	deletePost(post: Post) {
		if (post.media?.videoId) deleteBlob(post.media.videoId).catch(() => {});
		this.posts = this.posts.filter((p) => p.id !== post.id);
		this.#save('posts');
		this.notify(tr('Удалено'));
	}

	isLiked(post: Post) {
		return post.likedBy.includes(this.actorId);
	}

	toggleLike(post: Post) {
		const p = this.#fresh(this.posts, post);
		if (!p) return;
		const me = this.actorId;
		p.likedBy = p.likedBy.includes(me) ? p.likedBy.filter((id) => id !== me) : [...p.likedBy, me];
		this.#save('posts');
	}

	/** Лайк по двойному тапу: только ставит отметку, снять её можно кнопкой */
	likePost(post: Post) {
		const p = this.#fresh(this.posts, post);
		if (!p || p.likedBy.includes(this.actorId)) return;
		p.likedBy = [...p.likedBy, this.actorId];
		this.#save('posts');
	}

	addComment(post: Post, text: string) {
		const p = this.#fresh(this.posts, post);
		if (!p) return;
		p.comments.push({ id: uid(), authorId: this.actorId, text, createdAt: now() });
		this.#save('posts');
	}

	async share(post: Post) {
		const url = `${location.origin}/feed#${post.id}`;
		try {
			if (navigator.share)
				await navigator.share({ title: tr('Волна'), text: post.text.slice(0, 80), url });
			else await navigator.clipboard.writeText(url);
			const p = this.#fresh(this.posts, post);
			if (p) p.shares += 1;
			this.#save('posts');
			if (!navigator.share) this.notify(tr('Ссылка скопирована'));
		} catch {
			// пользователь закрыл системное окно «Поделиться»
		}
	}

	// ───────── Подписки ─────────

	get following() {
		return this.myPerson?.following ?? [];
	}

	isFollowing(id: string) {
		return this.following.includes(id);
	}

	toggleFollow(id: string) {
		const me = this.myPerson;
		if (!me) return;
		me.following = this.isFollowing(id)
			? me.following.filter((f) => f !== id)
			: [...me.following, id];
		this.#save('people');
	}

	followersOf(id: string) {
		return this.people.filter((p) => p.following?.includes(id)).map((p) => p.id);
	}

	followersCount(id: string) {
		return this.followersOf(id).length;
	}

	get myFollowers() {
		return this.followersOf(this.actorId);
	}

	// ───────── Часы, проекты, награды ─────────

	hoursOf(personId: string) {
		return this.hours
			.filter((h) => h.personId === personId)
			.sort((a, b) => b.date.localeCompare(a.date));
	}

	get myHours() {
		return this.hoursOf(this.me);
	}

	verifiedHoursOf(personId: string) {
		return this.hoursOf(personId)
			.filter((h) => h.status === 'verified')
			.reduce((s, h) => s + h.hours, 0);
	}

	get verifiedHours() {
		return this.verifiedHoursOf(this.me);
	}

	get pendingHours() {
		return this.myHours.filter((h) => h.status === 'pending').reduce((s, h) => s + h.hours, 0);
	}

	participationOf(personId: string) {
		return this.applications
			.filter((a) => a.personId === personId && a.status === 'approved')
			.map((a) => ({ application: a, opportunity: this.opportunity(a.opportunityId)! }))
			.filter((p) => p.opportunity)
			.sort((a, b) => b.opportunity.date.localeCompare(a.opportunity.date));
	}

	get participation() {
		return this.participationOf(this.me);
	}

	/** Организации, где волонтёр участвовал: роль и дата первой подтверждённой заявки */
	get memberships(): Membership[] {
		const rows: Record<string, Membership> = {};
		for (const { application, opportunity } of [...this.participation].reverse()) {
			rows[opportunity.orgId] ??= {
				orgId: opportunity.orgId,
				role: application.role ?? tr('Волонтёр'),
				since: application.createdAt.slice(0, 10)
			};
		}
		return Object.values(rows);
	}

	awardsOf(personId: string) {
		return this.awards
			.filter((a) => a.personId === personId)
			.sort((a, b) => b.date.localeCompare(a.date));
	}

	get myAwards() {
		return this.awardsOf(this.me);
	}

	get issuedAwards() {
		return this.awards
			.filter((a) => a.orgId === this.myOrgId)
			.sort((a, b) => b.date.localeCompare(a.date));
	}

	/** Сертификат, который волонтёр загрузил сам: фото документа или цифровая версия */
	addCertificate(
		certificate: Pick<
			Award,
			| 'title'
			| 'description'
			| 'issuer'
			| 'date'
			| 'skillIds'
			| 'format'
			| 'fileId'
			| 'fileName'
			| 'mime'
			| 'src'
		>
	) {
		this.awards.unshift({
			...certificate,
			id: uid(),
			type: 'certificate',
			tier: 'silver',
			personId: this.me
		});
		this.#save('awards');
		this.notify(tr('Сертификат добавлен'));
	}

	certificatesOf(personId: string) {
		return this.awardsOf(personId).filter((a) => a.type === 'certificate');
	}

	certificatesForSkill(skillId: string) {
		return this.awards
			.filter((a) => a.skillIds?.includes(skillId))
			.sort((a, b) => b.date.localeCompare(a.date));
	}

	removeAward(id: string) {
		const fileId = this.awards.find((a) => a.id === id)?.fileId;
		if (fileId) deleteBlob(fileId).catch(() => {});
		this.awards = this.awards.filter((a) => a.id !== id);
		this.#save('awards');
	}

	grantAward(
		award: Pick<Award, 'type' | 'tier' | 'title' | 'description' | 'opportunityId'>,
		personIds: string[]
	) {
		if (!this.#requireVerified()) return;
		for (const personId of personIds) {
			// Сертификат получает уникальный ID — по нему документ проверяют на /verify/ID
			const certificateId = award.type === 'certificate' ? certificateCode() : undefined;
			const hours = award.opportunityId ? this.opportunity(award.opportunityId)?.hours : undefined;
			this.awards.unshift({
				...award,
				id: certificateId ?? uid(),
				personId,
				orgId: this.myOrgId,
				date: day(0),
				...(certificateId ? { certificateId, status: 'valid' as const, hours } : {})
			});
			this.#alert(
				personId,
				'🏆',
				tr('{0} наградил вас: «{1}»', this.orgProfile.name, award.title),
				'/awards'
			);
		}
		this.#save('awards', 'alerts');
		this.notify(
			tr(
				'Награда вручена {0} {1}',
				personIds.length,
				plural(personIds.length, 'волонтёру', 'волонтёрам', 'волонтёрам')
			)
		);
	}

	// ───────── Навыки ─────────

	/** Навыки человека: основные сверху, затем по времени добавления */
	skillsOf(personId: string) {
		return this.skills
			.filter((s) => s.personId === personId)
			.sort(
				(a, b) => Number(b.featured) - Number(a.featured) || a.createdAt.localeCompare(b.createdAt)
			);
	}

	skill(id: string) {
		return this.skills.find((s) => s.id === id);
	}

	addSkill(data: Pick<Skill, 'emoji' | 'title' | 'description' | 'level' | 'featured'>) {
		const id = `sk-${uid()}`;
		this.skills.push({ ...data, id, personId: this.me, createdAt: now() });
		this.#save('skills');
		this.notify(tr('Навык добавлен'));
		return id;
	}

	updateSkill(skill: Skill) {
		const index = this.skills.findIndex((s) => s.id === skill.id);
		if (index === -1) return;
		this.skills[index] = skill;
		this.#save('skills');
		this.notify(tr('Навык сохранён'));
	}

	/** Удаляет навык вместе с его материалами; сертификаты остаются, но отвязываются */
	removeSkill(id: string) {
		for (const m of this.skillMaterials) {
			if (m.skillId === id && m.videoId) deleteBlob(m.videoId).catch(() => {});
		}
		this.skills = this.skills.filter((s) => s.id !== id);
		this.skillMaterials = this.skillMaterials.filter((m) => m.skillId !== id);
		for (const a of this.awards) {
			if (a.skillIds?.includes(id)) a.skillIds = a.skillIds.filter((s) => s !== id);
		}
		this.#save('skills', 'skillMaterials', 'awards');
	}

	materialsOf(skillId: string) {
		return this.skillMaterials
			.filter((m) => m.skillId === skillId)
			.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
	}

	addMaterial(
		material: Pick<
			SkillMaterial,
			'skillId' | 'kind' | 'text' | 'src' | 'videoId' | 'videoUrl' | 'poster'
		>
	) {
		this.skillMaterials.push({ ...material, id: uid(), personId: this.me, createdAt: now() });
		this.#save('skillMaterials');
		this.notify(tr('Материал добавлен'));
	}

	/** Скрыть видео из работ навыка, не удаляя его */
	setMaterialHidden(id: string, hidden: boolean) {
		const m = this.skillMaterials.find((x) => x.id === id);
		if (!m) return;
		m.hidden = hidden || undefined;
		this.#save('skillMaterials');
		this.notify(
			hidden ? tr('Видео скрыто — его можно вернуть в разделе «Скрытые»') : tr('Видео снова видно')
		);
	}

	removeMaterial(id: string) {
		const videoId = this.skillMaterials.find((m) => m.id === id)?.videoId;
		if (videoId) deleteBlob(videoId).catch(() => {});
		this.skillMaterials = this.skillMaterials.filter((m) => m.id !== id);
		this.#save('skillMaterials');
	}

	// ───────── Календарь ─────────

	photosFor(date: string) {
		return this.dayPhotos.filter((p) => p.date === date && p.ownerId === this.actorId);
	}

	addDayPhoto(date: string, src: string) {
		this.dayPhotos.push({ id: uid(), ownerId: this.actorId, date, src });
		this.#save('dayPhotos');
		this.notify(tr('Фото добавлено в календарь'));
	}

	removeDayPhoto(id: string) {
		this.dayPhotos = this.dayPhotos.filter((p) => p.id !== id);
		this.#save('dayPhotos');
	}

	// ───────── Кабинет организации ─────────

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
		const row = (personId: string) =>
			(rows[personId] ??= { personId, attended: 0, upcoming: 0, hours: 0 });
		for (const a of this.orgApplications.filter((a) => a.status === 'approved')) {
			const o = this.opportunity(a.opportunityId)!;
			if (o.date < today) row(a.personId).attended += 1;
			else row(a.personId).upcoming += 1;
		}
		for (const h of this.orgHours.filter((h) => h.status === 'verified')) {
			row(h.personId).hours += h.hours;
		}
		return Object.values(rows).sort((a, b) => b.attended - a.attended || b.hours - a.hours);
	}

	createOpportunity(data: Omit<Opportunity, 'id' | 'orgId'>) {
		if (!this.#requireVerified()) return '';
		const id = uid();
		this.opportunities.push({ ...data, id, orgId: this.myOrgId });
		this.#save('opportunities');
		this.notify(tr('Мероприятие опубликовано'));
		return id;
	}

	promote(opportunityId: string, days: number) {
		const o = this.opportunity(opportunityId);
		if (!o) return;
		o.promotedUntil = day(days);
		this.#save('opportunities');
		this.notify(tr('«{0}» продвигается до {1}', o.title, formatDate(o.promotedUntil)));
	}

	decide(application: Application, status: ApplicationStatus) {
		const a = this.#fresh(this.applications, application);
		if (!a) return;
		a.status = status;
		if (status === 'approved') a.role ??= tr('Волонтёр');
		const o = this.opportunity(a.opportunityId);
		if (o && status !== 'pending') {
			this.#alert(
				a.personId,
				status === 'approved' ? '✅' : '😔',
				status === 'approved'
					? tr('Заявка на «{0}» подтверждена — день отмечен в календаре', o.title)
					: tr('Заявка на «{0}» отклонена', o.title),
				status === 'approved' ? '/calendar' : `/o?id=${o.id}`
			);
		}
		this.#save('applications', 'alerts');
		this.notify(
			status === 'approved'
				? tr('Участие подтверждено')
				: status === 'declined'
					? tr('Заявка отклонена')
					: tr('Заявка возвращена')
		);
	}

	/** Начислить часы участнику одобренной заявки после мероприятия */
	/** Начислить часы участнику после мероприятия: по ведомости или QR-коду на месте */
	creditHours(application: Application, source: 'qr' | 'roster' = 'roster') {
		if (!this.#requireVerified()) return;
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
			note: source === 'qr' ? tr('Подтверждено по QR-коду') : tr('Подтверждено по ведомости'),
			source
		});
		this.#alert(
			application.personId,
			'⏱️',
			tr('Начислено {0} ч за «{1}»', o.hours, o.title),
			'/portfolio?tab=hours'
		);
		this.#save('hours', 'alerts');
		this.notify(tr('Начислено {0} ч', o.hours));
	}

	/** QR на месте: подтвердить участие (если заявка ещё не одобрена) и сразу начислить часы */
	checkIn(application: Application, source: 'qr' | 'roster' = 'qr') {
		if (!this.#requireVerified()) return;
		const a = this.#fresh(this.applications, application);
		if (!a) return;
		if (a.status !== 'approved') {
			a.status = 'approved';
			a.role ??= tr('Волонтёр');
			this.#save('applications');
		}
		this.creditHours(a, source);
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
		if (!this.#requireVerified()) return;
		const h = this.#fresh(this.hours, entry);
		if (!h) return;
		h.status = ok ? 'verified' : 'rejected';
		this.#alert(
			h.personId,
			ok ? '⏱️' : '😔',
			ok
				? tr('Подтверждено {0} ч: «{1}»', h.hours, h.title)
				: tr('Часы за «{0}» не подтверждены', h.title),
			'/portfolio?tab=requests'
		);
		this.#save('hours', 'alerts');
		this.notify(ok ? tr('Подтверждено {0} ч', h.hours) : tr('Часы отклонены'));
	}

	// ───────── Верификация организаций ─────────

	/** Проверенная организация: может публиковать мероприятия, начислять часы и выдавать сертификаты */
	get canManage() {
		return this.isOrg && this.myOrg.verified;
	}

	#requireVerified() {
		if (this.canManage) return true;
		this.notify(tr('Сначала пройдите проверку организации — это делает модератор'));
		return false;
	}

	/** Заявка на синий бейдж с документами */
	requestVerification(data: Pick<OrgVerification, 'docs' | 'links' | 'note'>) {
		const org = this.orgs.find((o) => o.id === this.myOrgId);
		if (!org) return;
		org.verification = { ...data, status: 'pending', requestedAt: now() };
		this.#save('orgs');
		this.notify(tr('Заявка отправлена модератору'));
	}

	// ───────── Модерация ─────────

	/** Каждое действие модератора попадает в журнал аудита */
	#audit(action: string, targetType: string, targetId: string, details = '') {
		this.auditLog.unshift({
			id: uid(),
			moderatorId: this.me,
			action,
			targetType,
			targetId,
			details,
			at: now()
		});
		this.#save('auditLog');
	}

	/** Организации, ждущие проверки (и требующие уточнений) */
	get verificationQueue() {
		return this.orgs
			.filter((o) => o.verification && !o.verified)
			.sort((a, b) =>
				(b.verification?.requestedAt ?? '').localeCompare(a.verification?.requestedAt ?? '')
			);
	}

	reviewVerification(
		orgId: string,
		decision: 'approved' | 'rejected' | 'needs_info',
		message = ''
	) {
		const org = this.orgs.find((o) => o.id === orgId);
		if (!org || !this.isModerator) return;
		org.verified = decision === 'approved';
		org.verification = {
			...(org.verification ?? { docs: [], links: '', note: '', requestedAt: now() }),
			status: decision,
			message: message.trim() || undefined,
			reviewedAt: now(),
			reviewerId: this.me
		};
		const text =
			decision === 'approved'
				? tr('Организация проверена — синий бейдж получен')
				: decision === 'rejected'
					? tr('Заявка на проверку отклонена: {0}', message)
					: tr('Модератор просит уточнить данные: {0}', message);
		this.#alert(
			orgId,
			decision === 'approved' ? '✅' : decision === 'rejected' ? '❌' : '❓',
			text,
			'/cabinet'
		);
		this.#save('orgs', 'alerts');
		this.#audit(`verification:${decision}`, 'org', orgId, message);
	}

	/** Снять бейдж у организации (например, при нарушениях) */
	revokeVerification(orgId: string, reason: string) {
		const org = this.orgs.find((o) => o.id === orgId);
		if (!org || !this.isModerator) return;
		org.verified = false;
		if (org.verification)
			org.verification = { ...org.verification, status: 'rejected', message: reason };
		this.#save('orgs');
		this.#audit('verification:revoked', 'org', orgId, reason);
	}

	/** Мероприятие снимается с публикации, но не удаляется */
	removeOpportunity(id: string, reason: string) {
		const o = this.opportunity(id);
		if (!o || !this.isModerator) return;
		o.removed = { reason, by: this.me, at: now() };
		this.#alert(o.orgId, '🚫', tr('Мероприятие «{0}» снято модератором: {1}', o.title, reason));
		this.#save('opportunities', 'alerts');
		this.#audit('opportunity:removed', 'opportunity', id, reason);
	}

	restoreOpportunity(id: string) {
		const o = this.opportunity(id);
		if (!o || !this.isModerator) return;
		o.removed = undefined;
		this.#save('opportunities');
		this.#audit('opportunity:restored', 'opportunity', id);
	}

	markReviewed(id: string) {
		const o = this.opportunity(id);
		if (!o || !this.isModerator) return;
		o.reviewedBy = this.me;
		this.#save('opportunities');
		this.#audit('opportunity:reviewed', 'opportunity', id);
	}

	/** Жалоба на пост, комментарий, мероприятие или профиль */
	report(target: Pick<Report, 'targetType' | 'targetId' | 'postId'>, reason: string) {
		if (!this.me) return;
		this.reports.unshift({
			...target,
			id: uid(),
			reason: reason.trim(),
			reporterId: this.me,
			createdAt: now(),
			status: 'open'
		});
		this.#save('reports');
		this.notify(tr('Жалоба отправлена модератору'));
	}

	resolveReport(id: string, status: 'resolved' | 'dismissed') {
		const r = this.reports.find((x) => x.id === id);
		if (!r || !this.isModerator) return;
		r.status = status;
		r.resolvedBy = this.me;
		this.#save('reports');
		this.#audit(`report:${status}`, r.targetType, r.targetId, r.reason);
	}

	/** Удаление публикации модератором по жалобе */
	moderatePost(postId: string, reason: string) {
		const post = this.posts.find((p) => p.id === postId);
		if (!post || !this.isModerator) return;
		if (post.media?.videoId) deleteBlob(post.media.videoId).catch(() => {});
		this.posts = this.posts.filter((p) => p.id !== postId);
		this.#alert(post.authorId, '🚫', tr('Ваша публикация удалена модератором: {0}', reason));
		this.#save('posts', 'alerts');
		this.#audit('post:deleted', 'post', postId, reason);
	}

	moderateComment(postId: string, commentId: string, reason: string) {
		const post = this.posts.find((p) => p.id === postId);
		if (!post || !this.isModerator) return;
		post.comments = post.comments.filter((c) => c.id !== commentId);
		this.#save('posts');
		this.#audit('comment:deleted', 'comment', commentId, reason);
	}

	/** Апелляция волонтёра: часы не начислили или начислили неверно */
	createAppeal(data: Pick<Appeal, 'orgId' | 'opportunityId' | 'text'>) {
		if (!this.me) return;
		this.appeals.unshift({
			...data,
			id: uid(),
			personId: this.me,
			text: data.text.trim(),
			status: 'open',
			createdAt: now()
		});
		this.#save('appeals');
		this.notify(tr('Обращение отправлено модератору'));
	}

	get myAppeals() {
		return this.appeals.filter((a) => a.personId === this.me);
	}

	/** Решение по апелляции; при удовлетворении можно сразу начислить часы */
	resolveAppeal(id: string, decision: 'resolved' | 'rejected', response: string, hours = 0) {
		const a = this.appeals.find((x) => x.id === id);
		if (!a || !this.isModerator) return;
		a.status = decision;
		a.response = response.trim();
		a.resolvedAt = now();
		a.resolvedBy = this.me;
		if (decision === 'resolved' && hours) {
			const o = a.opportunityId ? this.opportunity(a.opportunityId) : undefined;
			this.#addHours(
				a.personId,
				hours,
				o?.title ?? tr('Решение по апелляции'),
				a.orgId ?? o?.orgId ?? '',
				o?.id
			);
		}
		const text =
			decision === 'resolved'
				? tr('Апелляция удовлетворена: {0}', response)
				: tr('Апелляция отклонена: {0}', response);
		this.#alert(a.personId, decision === 'resolved' ? '✅' : '😔', text, '/portfolio?tab=requests');
		this.#save('appeals', 'alerts', 'hours');
		this.#audit(
			`appeal:${decision}`,
			'person',
			a.personId,
			hours ? `${response} (+${hours} ч)` : response
		);
	}

	#addHours(personId: string, hours: number, title: string, orgId: string, opportunityId?: string) {
		this.hours.push({
			id: uid(),
			personId,
			orgId,
			opportunityId,
			title,
			date: day(0),
			hours,
			status: 'verified',
			note: tr('Начислено модератором'),
			source: 'moderator'
		});
	}

	/** Ручная корректировка часов при накрутке: отрицательное число списывает часы */
	adjustHours(personId: string, hours: number, reason: string) {
		if (!this.isModerator || !hours) return;
		this.#addHours(personId, hours, tr('Корректировка: {0}', reason), '');
		this.#alert(
			personId,
			'⚖️',
			tr('Модератор скорректировал часы: {0} ч. {1}', hours, reason),
			'/portfolio?tab=hours'
		);
		this.#save('hours', 'alerts');
		this.#audit('hours:adjusted', 'person', personId, `${hours} ч: ${reason}`);
	}

	/** Все выданные платформой сертификаты */
	get issuedCertificates() {
		return this.awards.filter((a) => a.certificateId);
	}

	setCertificateStatus(awardId: string, status: 'valid' | 'revoked', reason = '') {
		const a = this.awards.find((x) => x.id === awardId);
		if (!a || !this.isModerator) return;
		a.status = status;
		a.revokedReason = status === 'revoked' ? reason : undefined;
		const text =
			status === 'revoked'
				? tr('Сертификат «{0}» отозван: {1}', a.title, reason)
				: tr('Сертификат «{0}» снова действителен', a.title);
		this.#alert(a.personId, status === 'revoked' ? '🚫' : '✅', text, '/awards');
		this.#save('awards', 'alerts');
		this.#audit(`certificate:${status}`, 'certificate', awardId, reason);
	}

	/** Предупреждение пользователю */
	warnUser(personId: string, reason: string) {
		const p = this.person(personId);
		if (!p || !this.isModerator || personId === this.me) return;
		p.warnings = [...(p.warnings ?? []), { reason, at: now(), by: this.me }];
		this.#alert(personId, '⚠️', tr('Предупреждение от модератора: {0}', reason));
		this.#save('people', 'alerts');
		this.#audit('user:warned', 'person', personId, reason);
	}

	/** Блокировка на days дней; без days — навсегда */
	banUser(personId: string, reason: string, days?: number) {
		const p = this.person(personId);
		if (!p || !this.isModerator || personId === this.me) return;
		const until = days ? new Date(Date.now() + days * 864e5).toISOString() : undefined;
		p.ban = { reason, at: now(), by: this.me, until };
		this.#save('people');
		this.#audit(
			days ? 'user:temp-ban' : 'user:ban',
			'person',
			personId,
			days ? `${reason} (${days} дн.)` : reason
		);
	}

	unbanUser(personId: string) {
		const p = this.person(personId);
		if (!p || !this.isModerator) return;
		p.ban = undefined;
		this.#save('people');
		this.#audit('user:unbanned', 'person', personId);
	}

	/** Действующая блокировка пользователя */
	activeBan(person?: Person) {
		const ban = person?.ban;
		if (!ban) return undefined;
		return !ban.until || ban.until > now() ? ban : undefined;
	}

	// ───────── Архив и поиск ─────────

	get archive() {
		const today = day(0);
		if (this.isOrg) return this.orgOpportunities.filter((o) => o.date < today);
		return this.participation.map((p) => p.opportunity).filter((o) => o.date < today);
	}

	search(query: string) {
		const q = query.trim().toLowerCase();
		const match = (...fields: (string | undefined)[]) =>
			!q || fields.some((f) => f?.toLowerCase().includes(q));
		return {
			people: this.people.filter(
				(p) =>
					p.id !== this.me &&
					!!p.name &&
					p.privacy?.searchable !== false &&
					match(p.name, p.city, p.bio)
			),
			orgs: this.orgs.filter((o) => match(o.name, o.about, o.city)),
			opportunities: this.upcoming.filter((o) =>
				match(o.title, o.description, o.place, this.org(o.orgId)?.name)
			)
		};
	}
}

export const app = new AppState();
