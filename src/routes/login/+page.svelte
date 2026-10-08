<script lang="ts">
	import { tr } from '#lib/i18n.ts';
	import { goto } from '$app/navigation';
	import { onDestroy } from 'svelte';
	import { ArrowRight, Building, ChevronLeft, HandHeart, Mail, Smartphone } from '@lucide/svelte';
	import { app } from '#lib/app.svelte.ts';
	import { authError, emailSignIn, emailSignUp, resetPassword } from '#lib/auth.ts';
	import InstallApp from '#lib/components/InstallApp.svelte';
	import LanguagePicker from '#lib/components/LanguagePicker.svelte';
	import Logo from '#lib/components/Logo.svelte';
	import OrgPicker from '#lib/components/OrgPicker.svelte';
	import OtpInput from '#lib/components/OtpInput.svelte';
	import { cities } from '#lib/data.ts';
	import { CODE_LENGTH, confirmSms, sendSms, smsError } from '#lib/sms.ts';
	import type { Role, Session } from '#lib/types.ts';

	let mode = $state<'login' | 'signup'>('login');
	let method = $state<Session['method']>('phone');
	let role = $state<Role>('volunteer');
	let name = $state('');
	let city = $state(cities[0]);
	let orgChoice = $state('');
	let newOrg = $state({ name: '', city: '', about: '' });

	let phone = $state('');
	let code = $state('');
	let codeSent = $state(false);
	let resendIn = $state(0);
	let sending = $state(false);
	let problem = $state('');
	let notice = $state('');
	let timer: ReturnType<typeof setInterval> | undefined;

	let email = $state('');
	let password = $state('');

	/** Страны для входа по телефону; other — номер целиком с кодом страны */
	const countries = [
		{ id: 'kg', flag: '🇰🇬', code: '+996', digits: 9, example: '700 123 456' },
		{ id: 'kz', flag: '🇰🇿', code: '+7', digits: 10, example: '701 123 4567' },
		{ id: 'ru', flag: '🇷🇺', code: '+7', digits: 10, example: '912 345 6789' },
		{ id: 'uz', flag: '🇺🇿', code: '+998', digits: 9, example: '90 123 4567' },
		{ id: 'tj', flag: '🇹🇯', code: '+992', digits: 9, example: '93 123 4567' },
		{ id: 'other', flag: '🌍', code: '+', digits: 0, example: '+44 7700 900123' }
	];
	let countryId = $state('kg');
	const country = $derived(countries.find((c) => c.id === countryId) ?? countries[0]);

	const phoneDigits = $derived(phone.replace(/\D/g, ''));
	const phoneValid = $derived(
		country.id === 'other'
			? phoneDigits.length >= 8 && phoneDigits.length <= 15
			: phoneDigits.length >= country.digits
	);
	/** Номер в международном формате: +996700123456 */
	const fullPhone = $derived(
		country.id === 'other'
			? `+${phoneDigits}`
			: `${country.code}${phoneDigits.slice(-country.digits)}`
	);
	const emailValid = $derived(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
	const orgOk = $derived(
		!!orgChoice && (orgChoice !== 'new' || (newOrg.name.trim().length > 1 && !!newOrg.city.trim()))
	);
	/** Для регистрации: имя волонтёра или выбранная организация */
	const nameOk = $derived(mode === 'login' || (role === 'org' ? orgOk : name.trim().length > 1));

	/** Firebase подтвердил пользователя — создаём профиль при первом входе и открываем приложение */
	async function finish(session: Omit<Session, 'role'>) {
		await app.completeSignIn(session, {
			role,
			name: mode === 'signup' && role === 'volunteer' ? name.trim() : undefined,
			city: mode === 'signup' && role === 'volunteer' ? city : undefined,
			orgId: mode === 'signup' && role === 'org' && orgChoice !== 'new' ? orgChoice : undefined,
			newOrg:
				mode === 'signup' && role === 'org' && orgChoice === 'new'
					? { name: newOrg.name.trim(), city: newOrg.city.trim(), about: newOrg.about.trim() }
					: undefined
		});
		goto(app.isOrg ? '/cabinet' : '/', { replace: true });
	}

	async function sendCode(e?: SubmitEvent) {
		e?.preventDefault();
		if (!phoneValid || !nameOk || sending) return;
		problem = '';
		sending = true;
		try {
			await sendSms(fullPhone, 'recaptcha');
		} catch (error) {
			problem = smsError(error);
			return;
		} finally {
			sending = false;
		}
		codeSent = true;
		code = '';
		resendIn = 30;
		clearInterval(timer);
		timer = setInterval(() => {
			resendIn -= 1;
			if (resendIn <= 0) clearInterval(timer);
		}, 1000);
	}

	async function verifyCode(e?: SubmitEvent) {
		e?.preventDefault();
		if (code.length !== CODE_LENGTH || sending) return;
		problem = '';
		sending = true;
		try {
			await confirmSms(code);
			await finish({ method: 'phone', contact: fullPhone });
		} catch (error) {
			problem = smsError(error);
			code = '';
		} finally {
			sending = false;
		}
	}

	async function emailLogin(e: SubmitEvent) {
		e.preventDefault();
		if (!emailValid || password.length < 6 || !nameOk || sending) return;
		problem = notice = '';
		sending = true;
		try {
			if (mode === 'signup') await emailSignUp(email, password);
			else await emailSignIn(email, password);
			await finish({ method: 'email', contact: email.trim() });
		} catch (error) {
			problem = authError(error);
		} finally {
			sending = false;
		}
	}

	async function forgot() {
		problem = notice = '';
		try {
			await resetPassword(email);
			notice = tr('Письмо для сброса пароля отправлено на {0}', email.trim());
		} catch (error) {
			problem = authError(error);
		}
	}

	onDestroy(() => clearInterval(timer));
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
			<h2 class="text-2xl font-extrabold tracking-tight">
				{mode === 'login' ? tr('С возвращением!') : tr('Создать аккаунт')}
			</h2>
			<p class="mt-1 text-sm text-muted">
				{mode === 'login'
					? tr('Войдите, чтобы продолжить.')
					: role === 'org'
						? tr('Найдите свою организацию или добавьте новую.')
						: tr('Пара шагов — и можно подавать заявки.')}
			</p>

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

			<div class="mt-4 grid grid-cols-2 rounded-2xl bg-surface-2 p-1 text-sm font-semibold">
				<button
					class="flex items-center justify-center gap-2 rounded-xl py-2.5 {method === 'phone'
						? 'bg-surface shadow-sm'
						: 'text-muted'}"
					onclick={() => (method = 'phone')}
				>
					<Smartphone class="size-4" />
					{tr('Телефон')}
				</button>
				<button
					class="flex items-center justify-center gap-2 rounded-xl py-2.5 {method === 'email'
						? 'bg-surface shadow-sm'
						: 'text-muted'}"
					onclick={() => (method = 'email')}
				>
					<Mail class="size-4" /> Email
				</button>
			</div>

			{#if mode === 'signup' && !(method === 'phone' && codeSent)}
				{#if role === 'org'}
					<OrgPicker bind:selected={orgChoice} bind:draft={newOrg} />
				{:else}
					<label class="mt-5 block">
						<span class="label">{tr('Как тебя зовут?')}</span>
						<input
							class="input"
							autocomplete="name"
							placeholder={tr('Имя и фамилия')}
							bind:value={name}
						/>
					</label>
					<label class="mt-3 block">
						<span class="label">{tr('Город')}</span>
						<select class="input" bind:value={city}>
							{#each cities as c (c)}<option value={c}>{tr(c)}</option>{/each}
						</select>
					</label>
				{/if}
			{/if}

			{#if method === 'phone'}
				{#if !codeSent}
					<form class="mt-5 space-y-4" onsubmit={sendCode}>
						<label class="block">
							<span class="label">{tr('Номер телефона')}</span>
							<div class="flex gap-2">
								<select
									class="input w-auto shrink-0 pr-8 font-semibold"
									bind:value={countryId}
									aria-label={tr('Страна')}
								>
									{#each countries as c (c.id)}
										<option value={c.id}>{c.flag} {c.id === 'other' ? tr('Другая') : c.code}</option
										>
									{/each}
								</select>
								<input
									class="input"
									type="tel"
									inputmode="tel"
									autocomplete={country.id === 'other' ? 'tel' : 'tel-national'}
									placeholder={country.example}
									bind:value={phone}
								/>
							</div>
						</label>
						{#if problem}<p class="rounded-2xl bg-pastel-peach p-3 text-sm text-pastel-peach-ink">
								{problem}
							</p>{/if}
						<button
							class="btn w-full btn-primary py-3"
							disabled={!phoneValid || !nameOk || sending}
						>
							{sending ? tr('Отправляем SMS…') : tr('Получить код')}
							<ArrowRight class="size-4" />
						</button>
					</form>
				{:else}
					<form class="mt-5 space-y-4" onsubmit={verifyCode}>
						<button
							type="button"
							class="flex items-center gap-1 text-sm font-semibold text-muted hover:text-ink"
							onclick={() => (codeSent = false)}
						>
							<ChevronLeft class="size-4" />
							{fullPhone}
						</button>
						<div>
							<span class="label">{tr('Код из SMS')}</span>
							<OtpInput
								bind:value={code}
								length={CODE_LENGTH}
								disabled={sending}
								invalid={!!problem}
								oncomplete={() => verifyCode()}
							/>
						</div>
						{#if problem}
							<p class="rounded-2xl bg-pastel-peach p-3 text-sm text-pastel-peach-ink">
								{problem}
							</p>
						{:else}
							<p class="text-sm text-muted">
								{tr('Мы отправили SMS с кодом на {0}', fullPhone)}
							</p>
						{/if}
						<button
							class="btn w-full btn-primary py-3"
							disabled={code.length !== CODE_LENGTH || sending}
						>
							{sending ? tr('Проверяем…') : tr('Подтвердить')}
						</button>
						<button
							type="button"
							class="w-full text-sm font-semibold text-muted disabled:opacity-60"
							disabled={resendIn > 0}
							onclick={() => sendCode()}
						>
							{resendIn > 0
								? tr('Отправить снова через {0} с', resendIn)
								: tr('Отправить код ещё раз')}
						</button>
					</form>
				{/if}
			{:else}
				<form class="mt-5 space-y-4" onsubmit={emailLogin}>
					<label class="block">
						<span class="label">Email</span>
						<input
							class="input"
							type="email"
							autocomplete="email"
							placeholder="you@mail.com"
							bind:value={email}
						/>
					</label>
					<label class="block">
						<span class="label">{tr('Пароль')}</span>
						<input
							class="input"
							type="password"
							autocomplete={mode === 'login' ? 'current-password' : 'new-password'}
							placeholder={tr('Минимум 6 символов')}
							bind:value={password}
						/>
					</label>
					{#if problem}<p class="rounded-2xl bg-pastel-peach p-3 text-sm text-pastel-peach-ink">
							{problem}
						</p>{/if}
					{#if notice}<p class="rounded-2xl bg-pastel-green p-3 text-sm text-pastel-green-ink">
							{notice}
						</p>{/if}
					<button
						class="btn w-full btn-primary py-3"
						disabled={!emailValid || password.length < 6 || !nameOk || sending}
					>
						{sending ? tr('Проверяем…') : mode === 'login' ? tr('Войти') : tr('Зарегистрироваться')}
					</button>
					{#if mode === 'login'}
						<button
							type="button"
							class="w-full text-sm font-semibold text-muted hover:text-ink disabled:opacity-50"
							disabled={!emailValid}
							onclick={forgot}>{tr('Забыли пароль?')}</button
						>
					{/if}
				</form>
			{/if}

			<p class="mt-6 text-center text-sm text-muted">
				{mode === 'login' ? tr('Впервые здесь?') : tr('Уже есть аккаунт?')}
				<button
					class="font-semibold text-accent-text"
					onclick={() => (mode = mode === 'login' ? 'signup' : 'login')}
				>
					{mode === 'login' ? tr('Зарегистрироваться') : tr('Войти')}
				</button>
			</p>

			<div class="mt-8 border-t border-line pt-6">
				<InstallApp variant="banner" />
			</div>
		</div>
		<div id="recaptcha"></div>
	</main>
</div>
