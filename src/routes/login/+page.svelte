<script lang="ts">
	import { goto } from '$app/navigation';
	import { onDestroy } from 'svelte';
	import { ArrowRight, Building, ChevronLeft, HandHeart, Mail, Smartphone } from '@lucide/svelte';
	import { app } from '#lib/app.svelte.ts';
	import Logo from '#lib/components/Logo.svelte';
	import type { Role, Session } from '#lib/types.ts';

	let mode = $state<'login' | 'signup'>('login');
	let method = $state<Session['method']>('phone');
	let role = $state<Role>('volunteer');
	let name = $state('');

	let phone = $state('');
	let code = $state('');
	let codeSent = $state(false);
	let resendIn = $state(0);
	let timer: ReturnType<typeof setInterval> | undefined;

	let email = $state('');
	let password = $state('');
	let linkSent = $state(false);

	const phoneDigits = $derived(phone.replace(/\D/g, ''));
	const phoneValid = $derived(phoneDigits.length >= 9);
	const emailValid = $derived(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
	const nameOk = $derived(mode === 'login' || name.trim().length > 1);

	function finish(session: Omit<Session, 'role'>) {
		app.login({ ...session, role }, mode === 'signup' ? name.trim() : undefined);
		goto(role === 'org' ? '/cabinet' : '/', { replaceState: true });
	}

	function sendCode(e?: SubmitEvent) {
		e?.preventDefault();
		if (!phoneValid || !nameOk) return;
		codeSent = true;
		code = '';
		resendIn = 30;
		clearInterval(timer);
		timer = setInterval(() => {
			resendIn -= 1;
			if (resendIn <= 0) clearInterval(timer);
		}, 1000);
	}

	function verifyCode(e: SubmitEvent) {
		e.preventDefault();
		if (code.length === 4) finish({ method: 'phone', contact: `+996 ${phoneDigits.slice(-9)}` });
	}

	function emailLogin(e: SubmitEvent) {
		e.preventDefault();
		if (emailValid && password.length >= 6 && nameOk) finish({ method: 'email', contact: email });
	}

	function demo(demoRole: Role) {
		app.login({
			method: 'email',
			contact: demoRole === 'org' ? 'eco@volna.kg' : 'demo@volna.kg',
			role: demoRole
		});
		goto(demoRole === 'org' ? '/cabinet' : '/', { replaceState: true });
	}

	onDestroy(() => clearInterval(timer));
</script>

<svelte:head><title>Вход — Волна</title></svelte:head>

<div class="grid min-h-dvh lg:grid-cols-2">
	<aside class="relative hidden overflow-hidden bg-accent-soft p-12 lg:flex lg:flex-col">
		<Logo />
		<div class="my-auto max-w-md">
			<h1 class="text-4xl leading-tight font-extrabold tracking-tight">
				Делай добро и собирай портфолио, которое видно всем
			</h1>
			<ul class="mt-8 space-y-4 text-[15px]">
				<li class="flex items-center gap-3">
					<span class="grid size-11 place-items-center rounded-2xl bg-pastel-blue text-xl">🧭</span
					>Проекты, акции и тренинги рядом с тобой
				</li>
				<li class="flex items-center gap-3">
					<span class="grid size-11 place-items-center rounded-2xl bg-pastel-yellow text-xl"
						>⏱️</span
					>Часы, которые подтверждают организации
				</li>
				<li class="flex items-center gap-3">
					<span class="grid size-11 place-items-center rounded-2xl bg-pastel-green text-xl">🎬</span
					>Истории и видео от таких же волонтёров
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
			<h2 class="text-2xl font-extrabold tracking-tight">
				{mode === 'login' ? 'С возвращением!' : 'Создать аккаунт'}
			</h2>
			<p class="mt-1 text-sm text-muted">
				{mode === 'login' ? 'Войдите, чтобы продолжить.' : 'Пара шагов — и можно подавать заявки.'}
			</p>

			<div class="mt-6 grid grid-cols-2 gap-2">
				{#each [{ id: 'volunteer' as Role, label: 'Я волонтёр', icon: HandHeart }, { id: 'org' as Role, label: 'Я организация', icon: Building }] as r (r.id)}
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
					<Smartphone class="size-4" /> Телефон
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
				<label class="mt-5 block">
					<span class="label">{role === 'org' ? 'Название организации' : 'Как тебя зовут?'}</span>
					<input
						class="input"
						autocomplete="name"
						placeholder={role === 'org' ? 'Например: Эко-клуб' : 'Имя и фамилия'}
						bind:value={name}
					/>
				</label>
			{/if}

			{#if method === 'phone'}
				{#if !codeSent}
					<form class="mt-5 space-y-4" onsubmit={sendCode}>
						<label class="block">
							<span class="label">Номер телефона</span>
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
						<button class="btn w-full btn-primary py-3" disabled={!phoneValid || !nameOk}
							>Получить код <ArrowRight class="size-4" /></button
						>
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
						<label class="block">
							<span class="label">Код из SMS</span>
							<input
								class="input text-center text-2xl font-bold tracking-[0.6em]"
								inputmode="numeric"
								autocomplete="one-time-code"
								maxlength="4"
								placeholder="••••"
								bind:value={() => code, (v) => (code = v.replace(/\D/g, '').slice(0, 4))}
							/>
						</label>
						<p class="rounded-2xl bg-pastel-yellow p-3 text-xs text-pastel-yellow-ink">
							Демо-режим: SMS не отправляется, подойдёт любой код из 4 цифр.
						</p>
						<button class="btn w-full btn-primary py-3" disabled={code.length !== 4}
							>Подтвердить</button
						>
						<button
							type="button"
							class="w-full text-sm font-semibold text-muted disabled:opacity-60"
							disabled={resendIn > 0}
							onclick={() => sendCode()}
						>
							{resendIn > 0 ? `Отправить снова через ${resendIn} с` : 'Отправить код ещё раз'}
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
						<span class="label">Пароль</span>
						<input
							class="input"
							type="password"
							autocomplete={mode === 'login' ? 'current-password' : 'new-password'}
							placeholder="Минимум 6 символов"
							bind:value={password}
						/>
					</label>
					<button
						class="btn w-full btn-primary py-3"
						disabled={!emailValid || password.length < 6 || !nameOk}
					>
						{mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
					</button>
					<button
						type="button"
						class="btn w-full btn-ghost"
						disabled={!emailValid || !nameOk}
						onclick={() => (linkSent = true)}
					>
						Прислать ссылку для входа
					</button>
				</form>
			{:else}
				<div class="mt-5 space-y-4 text-center">
					<div class="mx-auto grid size-16 place-items-center rounded-3xl bg-pastel-blue text-3xl">
						📬
					</div>
					<p class="text-sm">
						Мы отправили ссылку на <b>{email}</b>. Откройте письмо и нажмите «Войти».
					</p>
					<p class="rounded-2xl bg-pastel-yellow p-3 text-xs text-pastel-yellow-ink">
						Демо-режим: письмо не отправляется.
					</p>
					<button
						class="btn w-full btn-primary"
						onclick={() => finish({ method: 'email', contact: email })}
						>Открыть ссылку из письма</button
					>
					<button class="text-sm font-semibold text-muted" onclick={() => (linkSent = false)}
						>Изменить email</button
					>
				</div>
			{/if}

			<p class="mt-6 text-center text-sm text-muted">
				{mode === 'login' ? 'Впервые здесь?' : 'Уже есть аккаунт?'}
				<button
					class="font-semibold text-accent-text"
					onclick={() => (mode = mode === 'login' ? 'signup' : 'login')}
				>
					{mode === 'login' ? 'Зарегистрироваться' : 'Войти'}
				</button>
			</p>

			<div class="mt-8 border-t border-line pt-6">
				<p class="mb-2 text-center text-xs font-semibold text-muted">Демо без регистрации</p>
				<div class="grid grid-cols-2 gap-2">
					<button class="btn btn-soft" onclick={() => demo('volunteer')}
						><HandHeart class="size-4" /> Волонтёр</button
					>
					<button class="btn btn-ghost" onclick={() => demo('org')}
						><Building class="size-4" /> Организация</button
					>
				</div>
			</div>
		</div>
	</main>
</div>
