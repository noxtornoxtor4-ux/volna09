<script lang="ts">
	import { tr } from '#lib/i18n.ts';
	import { goto } from '$app/navigation';
	import { Building, ChevronDown, Compass, Gavel, HandHeart } from '@lucide/svelte';
	import { app } from '#lib/app.svelte.ts';
	import {
		authError,
		emailSignIn,
		emailSignUp,
		googleSignIn,
		prepareGoogle,
		resetPassword
	} from '#lib/auth.ts';
	import { onMount } from 'svelte';
	import { demoMode } from '#lib/firebase.ts';
	import InstallApp from '#lib/components/InstallApp.svelte';
	import LanguagePicker from '#lib/components/LanguagePicker.svelte';
	import Logo from '#lib/components/Logo.svelte';
	import OrgPicker from '#lib/components/OrgPicker.svelte';
	import { installer } from '#lib/install.svelte.ts';
	import type { Role, Session } from '#lib/types.ts';

	let role = $state<Role>('volunteer');
	let orgChoice = $state('');
	let newOrg = $state({ name: '', city: '', about: '' });
	/** Вход по почте — запасной способ, спрятан под кнопкой Google */
	let showEmail = $state(false);
	let email = $state('');
	let password = $state('');
	let busy = $state(false);
	let problem = $state('');
	let notice = $state('');

	// Firebase загружается заранее, чтобы окно Google не блокировалось браузером
	onMount(() => {
		prepareGoogle().catch(() => {});
	});

	const emailValid = $derived(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
	const errorCode = (error: unknown) => (error as { code?: string })?.code ?? '';

	/** Firebase подтвердил пользователя — создаём профиль при первом входе и открываем приложение */
	async function finish(session: Omit<Session, 'role'>, name: string) {
		await app.completeSignIn(session, {
			role,
			name,
			orgId: role === 'org' && orgChoice && orgChoice !== 'new' ? orgChoice : undefined,
			newOrg:
				role === 'org' && orgChoice === 'new' && newOrg.name.trim().length > 1
					? { name: newOrg.name.trim(), city: newOrg.city.trim(), about: newOrg.about.trim() }
					: undefined
		});
		goto(app.isOrg ? '/cabinet' : '/', { replace: true });
	}

	/** Демо: вход одной кнопкой за готового пользователя */
	function demoEnter(as: 'volunteer' | 'org' | 'moderator') {
		app.demoLogin(as);
		goto(as === 'org' ? '/cabinet' : as === 'moderator' ? '/moderation' : '/', { replace: true });
	}

	async function google() {
		problem = notice = '';
		busy = true;
		try {
			// Окно Google открывается сразу по нажатию — до любых ожиданий
			const user = await googleSignIn(role);
			if (!user) return; // ушли на страницу Google, вход завершится после возврата
			await finish({ method: 'google', contact: user.email }, user.name);
		} catch (error) {
			problem = authError(error);
		} finally {
			busy = false;
		}
	}

	/**
	 * Почта одной кнопкой: есть аккаунт — входим, нет — создаём. Firebase не говорит,
	 * есть ли почта, поэтому при неудачном входе пробуем создать аккаунт; если почта
	 * занята, значит, неверен пароль.
	 */
	async function emailLogin(e: SubmitEvent) {
		e.preventDefault();
		if (!emailValid || password.length < 6 || busy) return;
		problem = notice = '';
		busy = true;
		try {
			try {
				await emailSignIn(email, password);
			} catch (error) {
				const code = errorCode(error);
				if (!code.includes('invalid-credential') && !code.includes('user-not-found')) throw error;
				try {
					await emailSignUp(email, password);
				} catch (signUpError) {
					if (errorCode(signUpError).includes('email-already-in-use'))
						throw { code: 'auth/wrong-password' };
					throw signUpError;
				}
			}
			await finish({ method: 'email', contact: email.trim() }, email.trim().split('@')[0]);
		} catch (error) {
			problem = authError(error);
		} finally {
			busy = false;
		}
	}

	async function forgot() {
		problem = notice = '';
		try {
			await resetPassword(email);
			notice = tr(
				'Письмо для сброса пароля отправлено на {0}. Его отправитель — noreply@volna-a7de4.firebaseapp.com. Если письма нет во «Входящих», проверьте «Спам» и «Промоакции».',
				email.trim()
			);
		} catch (error) {
			problem = authError(error);
		}
	}
</script>

<svelte:head><title>{tr('Вход — Волна')}</title></svelte:head>

<div class="grid min-h-dvh lg:grid-cols-2">
	<aside class="relative hidden overflow-hidden bg-accent-soft p-12 lg:flex lg:flex-col">
		<Logo />
		<div class="my-auto max-w-md">
			<h1 class="text-4xl leading-tight font-extrabold tracking-tight">
				{tr('Делай добро и собирай портфолио, которое видно всем')}
			</h1>
			<ul class="mt-8 space-y-4 text-[15px]">
				<li class="flex items-center gap-3">
					<span class="grid size-11 place-items-center rounded-2xl bg-pastel-blue text-xl">🧭</span
					>{tr('Проекты, акции и тренинги рядом с тобой')}
				</li>
				<li class="flex items-center gap-3">
					<span class="grid size-11 place-items-center rounded-2xl bg-pastel-yellow text-xl"
						>⏱️</span
					>{tr('Часы, которые подтверждают организации')}
				</li>
				<li class="flex items-center gap-3">
					<span class="grid size-11 place-items-center rounded-2xl bg-pastel-green text-xl">🎬</span
					>{tr('Истории и видео от таких же волонтёров')}
				</li>
			</ul>
		</div>
		<div
			class="pointer-events-none absolute -right-24 -bottom-24 size-96 rounded-full bg-accent/40 blur-3xl"
		></div>
	</aside>

	<main class="flex flex-col px-5 py-8 sm:px-10">
		<div class="lg:hidden"><Logo /></div>
		<div class="mx-auto my-auto w-full max-w-sm py-10">
			<div class="mb-6"><LanguagePicker /></div>
			<h2 class="text-2xl font-extrabold tracking-tight">{tr('Добро пожаловать!')}</h2>
			<p class="mt-1 text-sm text-muted">
				{tr('Один вход — и для новых, и для тех, кто уже с нами.')}
			</p>

			{#if demoMode}
				<p class="mt-5 rounded-2xl bg-pastel-yellow p-3 text-sm text-pastel-yellow-ink">
					{tr('Это демо-версия: все люди и данные выдуманные. Выберите, за кого войти.')}
				</p>
				<div class="mt-4 grid gap-2">
					{#each [{ id: 'volunteer' as const, label: tr('Войти как волонтёр'), hint: tr('Алина — мероприятия, часы, сертификаты'), icon: HandHeart }, { id: 'org' as const, label: tr('Войти как организация'), hint: tr('Эко-клуб «Зелёный город» — заявки и QR-часы'), icon: Building }, { id: 'moderator' as const, label: tr('Войти как модератор'), hint: tr('Проверка организаций, жалобы, апелляции'), icon: Gavel }] as d (d.id)}
						<button
							class="flex items-center gap-3 rounded-3xl border-2 border-line p-4 text-left transition hover:border-accent hover:bg-accent-soft"
							onclick={() => demoEnter(d.id)}
						>
							<d.icon class="size-7 shrink-0 text-accent" />
							<span>
								<span class="block font-bold">{d.label}</span>
								<span class="block text-xs text-muted">{d.hint}</span>
							</span>
						</button>
					{/each}
				</div>
			{:else}
				<div class="mt-6 grid grid-cols-2 gap-2">
					{#each [{ id: 'volunteer' as Role, label: tr('Я волонтёр'), icon: HandHeart }, { id: 'org' as Role, label: tr('Я организация'), icon: Building }] as r (r.id)}
						<button
							class="flex flex-col items-center gap-1.5 rounded-3xl border-2 p-3 text-sm font-bold transition {role ===
							r.id
								? 'border-accent bg-accent-soft text-accent-text'
								: 'border-line text-muted hover:border-accent/50'}"
							onclick={() => (role = r.id)}
							aria-pressed={role === r.id}
						>
							<r.icon class="size-6" />
							{r.label}
						</button>
					{/each}
				</div>

				{#if role === 'org'}
					<OrgPicker bind:selected={orgChoice} bind:draft={newOrg} />
					<p class="mt-2 text-xs text-muted">
						{tr('Уже ведёте организацию? Можно ничего не выбирать — она подключится сама.')}
					</p>
				{/if}

				{#if installer.inApp}
					<!-- Google не пускает во встроенные браузеры Telegram, WhatsApp, Instagram -->
					<div class="mt-5 rounded-2xl bg-pastel-yellow p-3 text-sm text-pastel-yellow-ink">
						{tr(
							'Вход через Google не работает внутри Telegram и WhatsApp. Откройте сайт в браузере или войдите по почте.'
						)}
						{#if installer.ios}
							<button
								class="mt-2 btn w-full bg-ink py-2.5 text-bg"
								onclick={() => installer.openInSafari()}
								><Compass class="size-4" /> {tr('Открыть в Safari')}</button
							>
						{/if}
					</div>
				{/if}

				<button
					class="mt-5 btn w-full border border-line bg-surface py-3.5 text-[15px] text-ink shadow-sm hover:bg-surface-2"
					onclick={google}
					disabled={busy}
				>
					<svg viewBox="0 0 48 48" class="size-5" aria-hidden="true">
						<path
							fill="#ffc107"
							d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
						/>
						<path
							fill="#ff3d00"
							d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
						/>
						<path
							fill="#4caf50"
							d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
						/>
						<path
							fill="#1976d2"
							d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"
						/>
					</svg>
					{busy ? tr('Входим…') : tr('Войти через Google')}
				</button>

				{#if problem && !showEmail}<p
						class="mt-3 rounded-2xl bg-pastel-peach p-3 text-sm text-pastel-peach-ink"
					>
						{problem}
					</p>{/if}

				<button
					class="mt-4 flex w-full items-center justify-center gap-1 text-sm font-semibold text-muted hover:text-ink"
					onclick={() => (showEmail = !showEmail)}
					aria-expanded={showEmail}
				>
					{tr('Войти по почте и паролю')}
					<ChevronDown class="size-4 transition {showEmail ? 'rotate-180' : ''}" />
				</button>

				{#if showEmail}
					<form class="mt-3 space-y-3" onsubmit={emailLogin}>
						<input
							class="input"
							type="email"
							autocomplete="email"
							placeholder="you@mail.com"
							aria-label="Email"
							bind:value={email}
						/>
						<input
							class="input"
							type="password"
							autocomplete="current-password"
							placeholder={tr('Пароль — минимум 6 символов')}
							aria-label={tr('Пароль')}
							bind:value={password}
						/>
						{#if problem}<p class="rounded-2xl bg-pastel-peach p-3 text-sm text-pastel-peach-ink">
								{problem}
							</p>{/if}
						{#if notice}<p class="rounded-2xl bg-pastel-green p-3 text-sm text-pastel-green-ink">
								{notice}
							</p>{/if}
						<button
							class="btn w-full btn-primary py-3"
							disabled={!emailValid || password.length < 6 || busy}
							>{busy ? tr('Входим…') : tr('Войти')}</button
						>
						<p class="text-center text-xs text-muted">
							{tr('Нет аккаунта? Он создастся автоматически с этой почтой и паролем.')}
						</p>
						<button
							type="button"
							class="w-full text-sm font-semibold text-muted hover:text-ink disabled:opacity-50"
							disabled={!emailValid}
							onclick={forgot}>{tr('Забыли пароль?')}</button
						>
					</form>
				{/if}
			{/if}

			<p class="mt-6 text-center text-xs text-muted">
				<a href="/terms" class="underline hover:text-ink">{tr('Условия использования')}</a>
				·
				<a href="/privacy" class="underline hover:text-ink">{tr('Политика конфиденциальности')}</a>
			</p>

			<div class="mt-8 border-t border-line pt-6">
				<InstallApp variant="banner" />
			</div>
		</div>
	</main>
</div>
