<script lang="ts">
	import { tr } from '#lib/i18n.ts';
	import { goto } from '$app/navigation';
	import { onDestroy } from 'svelte';
	import { ArrowRight, Building, ChevronLeft, HandHeart, Mail, Smartphone } from '@lucide/svelte';
	import { app } from '#lib/app.svelte.ts';
	import InstallApp from '#lib/components/InstallApp.svelte';
	import LanguagePicker from '#lib/components/LanguagePicker.svelte';
	import Logo from '#lib/components/Logo.svelte';
	import OrgPicker from '#lib/components/OrgPicker.svelte';
	import OtpInput from '#lib/components/OtpInput.svelte';
	import { CODE_LENGTH, confirmSms, sendSms, smsEnabled, smsError } from '#lib/sms.ts';
	import type { Role, Session } from '#lib/types.ts';

	let mode = $state<'login' | 'signup'>('login');
	let method = $state<Session['method']>('phone');
	let role = $state<Role>('volunteer');
	let name = $state('');
	let orgChoice = $state('');
	let newOrg = $state({ name: '', city: '', about: '' });

	let phone = $state('');
	let code = $state('');
	let codeSent = $state(false);
	let resendIn = $state(0);
	let sending = $state(false);
	let smsProblem = $state('');
	let timer: ReturnType<typeof setInterval> | undefined;

	let email = $state('');
	let password = $state('');
	let linkSent = $state(false);

	const phoneDigits = $derived(phone.replace(/\D/g, ''));
	const phoneValid = $derived(phoneDigits.length >= 9);
	const emailValid = $derived(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
	const orgOk = $derived(
		!!orgChoice && (orgChoice !== 'new' || (newOrg.name.trim().length > 1 && !!newOrg.city.trim()))
	);
	/** Для регистрации: имя волонтёра или выбранная организация */
	const nameOk = $derived(mode === 'login' || (role === 'org' ? orgOk : name.trim().length > 1));

	function finish(session: Omit<Session, 'role'>) {
		if (mode === 'signup' && role === 'org') {
			const orgId =
				orgChoice === 'new'
					? app.createOrg({
							name: newOrg.name.trim(),
							city: newOrg.city.trim(),
							about: newOrg.about.trim()
						})
					: orgChoice;
			app.chooseOrg(orgId);
		}
		app.login(
			{ ...session, role },
			mode === 'signup' && role === 'volunteer' ? name.trim() : undefined
		);
		goto(role === 'org' ? '/cabinet' : '/', { replaceState: true });
	}

	const fullPhone = $derived(`+996${phoneDigits.slice(-9)}`);

	async function sendCode(e?: SubmitEvent) {
		e?.preventDefault();
		if (!phoneValid || !nameOk || sending) return;
		smsProblem = '';
		if (smsEnabled) {
			sending = true;
			try {
				await sendSms(fullPhone, 'recaptcha');
			} catch (error) {
				smsProblem = smsError(error);
				return;
			} finally {
				sending = false;
			}
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
		smsProblem = '';
		if (smsEnabled) {
			sending = true;
			try {
				await confirmSms(code);
			} catch (error) {
				smsProblem = smsError(error);
				code = '';
				return;
			} finally {
				sending = false;
			}
		}
		finish({ method: 'phone', contact: `+996 ${phoneDigits.slice(-9)}` });
	}

	function emailLogin(e: SubmitEvent) {
		e.preventDefault();
		if (emailValid && password.length >= 6 && nameOk) finish({ method: 'email', contact: email });
	}

	function demo(demoRole: Role) {
		// Демо-организация — клуб с заполненными заявками, часами и мероприятиями
		if (demoRole === 'org') app.chooseOrg('eco');
		app.login({
			method: 'email',
			contact: demoRole === 'org' ? 'eco@volna.kg' : 'demo@volna.kg',
			role: demoRole
		});
		goto(demoRole === 'org' ? '/cabinet' : '/', { replaceState: true });
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

			{#if mode === 'signup' && !(method === 'phone' && codeSent) && !linkSent}
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
				{/if}
			{:else if mode === 'login' && role === 'org'}
				<p class="mt-4 rounded-2xl bg-surface-2 px-4 py-3 text-sm text-muted">
					{tr('Вход в кабинет организации')} <b class="text-ink">{app.org(app.myOrgId)?.name}</b>
				</p>
			{/if}

			{#if method === 'phone'}
				{#if !codeSent}
					<form class="mt-5 space-y-4" onsubmit={sendCode}>
						<label class="block">
							<span class="label">{tr('Номер телефона')}</span>
							<div class="flex gap-2">
								<span class="input w-auto shrink-0 font-semibold">🇰🇬 +996</span>
								<input
									class="input"
									type="tel"
									inputmode="tel"
									autocomplete="tel-national"
									placeholder="700 123 456"
									bind:value={phone}
								/>
							</div>
						</label>
						{#if smsProblem}<p
								class="rounded-2xl bg-pastel-peach p-3 text-sm text-pastel-peach-ink"
							>
								{smsProblem}
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
							<ChevronLeft class="size-4" /> +996 {phoneDigits.slice(-9)}
						</button>
						<div>
							<span class="label">{tr('Код из SMS')}</span>
							<OtpInput
								bind:value={code}
								length={CODE_LENGTH}
								disabled={sending}
								invalid={!!smsProblem}
								oncomplete={() => verifyCode()}
							/>
						</div>
						{#if smsProblem}
							<p class="rounded-2xl bg-pastel-peach p-3 text-sm text-pastel-peach-ink">
								{smsProblem}
							</p>
						{:else if smsEnabled}
							<p class="text-sm text-muted">
								{tr('Мы отправили SMS с кодом на +996 {0}', phoneDigits.slice(-9))}
							</p>
						{:else}
							<p class="rounded-2xl bg-pastel-yellow p-3 text-xs text-pastel-yellow-ink">
								{tr(
									'Демо-режим: SMS не отправляется, подойдёт любой код из {0} цифр.',
									CODE_LENGTH
								)}
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
			{:else if !linkSent}
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
					<button
						class="btn w-full btn-primary py-3"
						disabled={!emailValid || password.length < 6 || !nameOk}
					>
						{mode === 'login' ? tr('Войти') : tr('Зарегистрироваться')}
					</button>
					<button
						type="button"
						class="btn w-full btn-ghost"
						disabled={!emailValid || !nameOk}
						onclick={() => (linkSent = true)}
					>
						{tr('Прислать ссылку для входа')}
					</button>
				</form>
			{:else}
				<div class="mt-5 space-y-4 text-center">
					<div class="mx-auto grid size-16 place-items-center rounded-3xl bg-pastel-blue text-3xl">
						📬
					</div>
					<p class="text-sm">
						{tr('Мы отправили ссылку на')} <b>{email}</b>{tr(
							'. Откройте письмо и нажмите «Войти».'
						)}
					</p>
					<p class="rounded-2xl bg-pastel-yellow p-3 text-xs text-pastel-yellow-ink">
						{tr('Демо-режим: письмо не отправляется.')}
					</p>
					<button
						class="btn w-full btn-primary"
						onclick={() => finish({ method: 'email', contact: email })}
						>{tr('Открыть ссылку из письма')}</button
					>
					<button class="text-sm font-semibold text-muted" onclick={() => (linkSent = false)}
						>{tr('Изменить email')}</button
					>
				</div>
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
				<p class="mb-2 text-center text-xs font-semibold text-muted">
					{tr('Демо без регистрации')}
				</p>
				<div class="grid grid-cols-2 gap-2">
					<button class="btn btn-soft" onclick={() => demo('volunteer')}
						><HandHeart class="size-4" /> {tr('Волонтёр')}</button
					>
					<button class="btn btn-ghost" onclick={() => demo('org')}
						><Building class="size-4" /> {tr('Организация')}</button
					>
				</div>
			</div>
		</div>
		<div id="recaptcha"></div>
	</main>
</div>
