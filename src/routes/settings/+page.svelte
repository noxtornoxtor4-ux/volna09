<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import {
		Archive,
		BookOpen,
		Check,
		ChevronLeft,
		ChevronRight,
		Lock,
		LogOut,
		Moon,
		Palette,
		Plus,
		Smartphone,
		RotateCcw,
		Sun,
		UserCog,
		Users
	} from '@lucide/svelte';
	import { app } from '#lib/app.svelte.ts';
	import Avatar from '#lib/components/Avatar.svelte';
	import InstallApp from '#lib/components/InstallApp.svelte';
	import { ME, accents, toneClass } from '#lib/data.ts';
	import { formatDate } from '#lib/format.ts';
	import type { Accent, Privacy, Role } from '#lib/types.ts';

	type Section = 'install' | 'guide' | 'account' | 'accounts' | 'style' | 'archive' | 'privacy';

	const sections: { id: Section; label: string; hint: string; icon: typeof BookOpen }[] = [
		{
			id: 'install',
			label: 'Установить приложение',
			hint: 'Иконка на телефоне и компьютере',
			icon: Smartphone
		},
		{
			id: 'guide',
			label: 'Руководство по использованию',
			hint: 'Как всё устроено',
			icon: BookOpen
		},
		{ id: 'account', label: 'Учётная запись', hint: 'Телефон, email, пароль', icon: UserCog },
		{ id: 'accounts', label: 'Аккаунты', hint: 'Волонтёр и организация', icon: Users },
		{ id: 'style', label: 'Стиль приложения', hint: 'Цвет и тема', icon: Palette },
		{ id: 'archive', label: 'Архив мероприятий', hint: 'Прошедшие события', icon: Archive },
		{ id: 'privacy', label: 'Конфиденциальность', hint: 'Кто что видит', icon: Lock }
	];

	const section = $derived(page.url.searchParams.get('s') as Section | null);
	const current = $derived(sections.find((s) => s.id === section));

	let contact = $state(app.session?.contact ?? '');
	let password = $state('');
	let privacy = $state<Privacy>($state.snapshot(app.privacy));

	const guide = $derived(
		app.isOrg
			? [
					{
						emoji: '➕',
						title: 'Публикуйте мероприятия',
						text: 'Кнопка «+» в кабинете открывает конструктор: описание, задачи, постер и своя анкета для волонтёров.'
					},
					{
						emoji: '📁',
						title: 'Работайте с папками',
						text: 'В кабинете три папки: заявки, волонтёры и подтверждение часов.'
					},
					{
						emoji: '📣',
						title: 'Отправляйте уведомления',
						text: 'Откройте мероприятие в «Уведомлениях» — можно написать всем участникам и ответить на вопросы в чате.'
					},
					{
						emoji: '🏆',
						title: 'Награждайте',
						text: 'В «Кабинете наград» создайте медаль, кубок или сертификат и вручите участникам.'
					},
					{
						emoji: '🚀',
						title: 'Продвигайте',
						text: 'Продвижение поднимает мероприятие в начало ленты и сторисов.'
					}
				]
			: [
					{
						emoji: '✨',
						title: 'Смотрите «Для вас»',
						text: 'Сторисы по темам на главной — листайте постеры и сразу подавайтесь.'
					},
					{
						emoji: '📝',
						title: 'Подавайте анкету',
						text: 'Кнопка «Податься» открывает анкету организатора. Ответ придёт в уведомления.'
					},
					{
						emoji: '🗓️',
						title: 'Следите за календарём',
						text: 'После подтверждения день отмечается сам, а ИИ напомнит накануне.'
					},
					{
						emoji: '⏱️',
						title: 'Подтверждайте часы',
						text: 'В портфолио отправьте организации заявку — подтверждённые часы видны всем.'
					},
					{
						emoji: '🏅',
						title: 'Собирайте награды',
						text: 'Медали, кубки и сертификаты стоят на полках в «Кабинете наград».'
					}
				]
	);

	function open(id: Section) {
		goto(`?s=${id}`, { reset: false });
	}

	function switchTo(role: Role) {
		app.switchRole(role);
		goto(role === 'org' ? '/cabinet' : '/');
	}

	function logout() {
		app.logout();
		goto('/login', { replaceState: true });
	}

	function savePrivacy() {
		app.setPrivacy($state.snapshot(privacy));
	}
</script>

<svelte:head><title>Настройки — Волна</title></svelte:head>

{#if !current}
	<h1 class="mb-5 text-2xl font-extrabold tracking-tight sm:text-3xl">Настройки</h1>
	<div class="mx-auto max-w-2xl space-y-4">
		<a href="/profile" class="flex items-center gap-3 card p-4 transition hover:border-accent">
			<Avatar id={app.actorId} size="lg" />
			<div class="min-w-0 flex-1">
				<div class="truncate font-bold">{app.author(app.actorId).name}</div>
				<div class="text-sm text-muted">
					{app.isOrg ? 'Аккаунт организации' : 'Аккаунт волонтёра'} · {app.session?.contact}
				</div>
			</div>
			<ChevronRight class="size-5 text-muted" />
		</a>
		<ul class="divide-y divide-line card">
			{#each sections as s (s.id)}
				<li>
					<button
						class="flex w-full items-center gap-3 p-4 text-left transition hover:bg-surface-2"
						onclick={() => open(s.id)}
					>
						<span
							class="grid size-10 place-items-center rounded-2xl bg-accent-soft text-accent-text"
							><s.icon class="size-5" /></span
						>
						<span class="min-w-0 flex-1">
							<span class="block font-semibold">{s.label}</span>
							<span class="block text-xs text-muted">{s.hint}</span>
						</span>
						<ChevronRight class="size-5 text-muted" />
					</button>
				</li>
			{/each}
		</ul>
		<button class="btn w-full btn-ghost text-pastel-peach-ink" onclick={logout}
			><LogOut class="size-4" /> Выйти</button
		>
	</div>
{:else}
	<a href="/settings" class="mb-4 btn btn-ghost"><ChevronLeft class="size-4" /> Настройки</a>
	<div class="mx-auto max-w-2xl">
		<h1 class="mb-5 flex items-center gap-2 text-2xl font-extrabold tracking-tight">
			<current.icon class="size-6 text-accent-text" />
			{current.label}
		</h1>

		{#if section === 'install'}
			<InstallApp />
		{:else if section === 'guide'}
			<ol class="space-y-3">
				{#each guide as step, i (step.title)}
					<li class="flex gap-4 card p-4">
						<span class="grid size-12 shrink-0 place-items-center rounded-2xl bg-surface-2 text-2xl"
							>{step.emoji}</span
						>
						<div>
							<div class="font-bold">{i + 1}. {step.title}</div>
							<p class="text-sm text-muted">{step.text}</p>
						</div>
					</li>
				{/each}
			</ol>
		{:else if section === 'account'}
			<div class="space-y-4">
				<form
					class="space-y-3 card p-5"
					onsubmit={(e) => {
						e.preventDefault();
						app.updateContact(contact.trim());
					}}
				>
					<span class="label">{app.session?.method === 'phone' ? 'Номер телефона' : 'Email'}</span>
					<input class="input" required bind:value={contact} />
					<button class="btn btn-primary">Сохранить</button>
				</form>
				<form
					class="space-y-3 card p-5"
					onsubmit={(e) => {
						e.preventDefault();
						password = '';
						app.notify('Пароль обновлён (демо)');
					}}
				>
					<span class="label">Новый пароль</span>
					<input
						class="input"
						type="password"
						minlength="6"
						required
						autocomplete="new-password"
						bind:value={password}
					/>
					<button class="btn btn-ghost" disabled={password.length < 6}>Сменить пароль</button>
				</form>
				<div class="space-y-2 card p-5">
					<button class="btn w-full btn-ghost" onclick={() => app.resetDemo()}
						><RotateCcw class="size-4" /> Восстановить демо-данные</button
					>
					<button class="btn w-full btn-ghost text-pastel-peach-ink" onclick={logout}
						><LogOut class="size-4" /> Выйти из аккаунта</button
					>
				</div>
			</div>
		{:else if section === 'accounts'}
			<p class="mb-4 text-sm text-muted">
				Переключайтесь между личным аккаунтом и аккаунтом организации без повторного входа.
			</p>
			<ul class="space-y-3">
				{#each [{ role: 'volunteer' as Role, id: ME, label: 'Волонтёр' }, { role: 'org' as Role, id: app.myOrgId, label: 'Организация' }] as acc (acc.role)}
					{@const active = app.role === acc.role}
					<li
						class="flex items-center gap-3 card p-4 {active
							? 'border-accent ring-2 ring-accent/40'
							: ''}"
					>
						<Avatar id={acc.id} size="lg" />
						<div class="min-w-0 flex-1">
							<div class="truncate font-bold">{app.author(acc.id).name}</div>
							<div class="text-sm text-muted">{acc.label}</div>
						</div>
						{#if active}
							<span
								class="inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-ink"
								><Check class="size-3.5" /> Активен</span
							>
						{:else}
							<button class="btn btn-soft" onclick={() => switchTo(acc.role)}>Перейти</button>
						{/if}
					</li>
				{/each}
			</ul>
			<button class="mt-4 btn w-full btn-ghost" onclick={logout}
				><Plus class="size-4" /> Добавить аккаунт</button
			>
		{:else if section === 'style'}
			<section class="card p-5">
				<span class="label">Акцентный цвет</span>
				<div class="grid grid-cols-5 gap-2">
					{#each Object.entries(accents) as [id, a] (id)}
						<button
							class="grid aspect-square place-items-center rounded-2xl border-2 transition {app.accent ===
							id
								? 'border-ink'
								: 'border-line'}"
							style="background: {a.color}"
							onclick={() => app.setAccent(id as Accent)}
							aria-label={a.label}
							aria-pressed={app.accent === id}
							title={a.label}
						>
							{#if app.accent === id}<Check class="size-5 text-[#1f2633]" />{/if}
						</button>
					{/each}
				</div>
				<p class="mt-2 text-sm font-semibold">{accents[app.accent].label}</p>

				<span class="mt-5 label">Тема</span>
				<div class="grid grid-cols-2 rounded-2xl bg-surface-2 p-1 text-sm font-semibold">
					<button
						class="flex items-center justify-center gap-2 rounded-xl py-2.5 {app.mode === 'light'
							? 'bg-surface shadow-sm'
							: 'text-muted'}"
						onclick={() => app.setMode('light')}><Sun class="size-4" /> Светлая</button
					>
					<button
						class="flex items-center justify-center gap-2 rounded-xl py-2.5 {app.mode === 'dark'
							? 'bg-surface shadow-sm'
							: 'text-muted'}"
						onclick={() => app.setMode('dark')}><Moon class="size-4" /> Тёмная</button
					>
				</div>

				<div class="mt-5 rounded-3xl bg-surface-2 p-4">
					<p class="label">Предпросмотр</p>
					<div class="flex flex-wrap gap-2">
						<span class="btn btn-primary">Податься</span>
						<span class="btn btn-soft">Напомнить позже</span>
						<span class="chip border-accent bg-accent-soft text-accent-text">Тренинги</span>
					</div>
				</div>
			</section>
		{:else if section === 'archive'}
			<ul class="space-y-2">
				{#each app.archive as o (o.id)}
					{@const role = app.participation.find((p) => p.opportunity.id === o.id)?.application.role}
					<li>
						<a
							href="/o?id={o.id}"
							class="flex items-center gap-3 card p-3 transition hover:border-accent"
						>
							<span
								class="grid size-14 shrink-0 place-items-center rounded-2xl text-2xl grayscale-[30%] {toneClass[
									o.tone
								].bg}">{o.emoji}</span
							>
							<div class="min-w-0 flex-1">
								<div class="truncate font-bold">{o.title}</div>
								<div class="text-xs text-muted">
									{formatDate(o.date, { day: 'numeric', month: 'long', year: 'numeric' })} · {app.org(
										o.orgId
									)?.name}
								</div>
								<div class="mt-1 text-xs font-semibold">
									{app.isOrg
										? `${app.participants(o.id).length} участников · ${app.awards.filter((a) => a.opportunityId === o.id).length} наград`
										: `${role ?? 'Волонтёр'} · ${o.hours} ч`}
								</div>
							</div>
						</a>
					</li>
				{:else}
					<li class="card p-6 text-center text-sm text-muted">Архив пуст.</li>
				{/each}
			</ul>
		{:else if section === 'privacy'}
			<div class="divide-y divide-line card">
				{#each [{ key: 'publicProfile', label: 'Открытый профиль', hint: 'Профиль и публикации видны всем пользователям' }, { key: 'showHours', label: 'Показывать часы', hint: 'Счётчик часов и проекты видны в профиле' }, { key: 'searchable', label: 'Находить меня в поиске', hint: 'По имени и городу' }] as item (item.key)}
					{@const key = item.key as 'publicProfile' | 'showHours' | 'searchable'}
					<label class="flex cursor-pointer items-center gap-3 p-4">
						<span class="min-w-0 flex-1">
							<span class="block font-semibold">{item.label}</span>
							<span class="block text-xs text-muted">{item.hint}</span>
						</span>
						<input
							type="checkbox"
							class="peer sr-only"
							bind:checked={privacy[key]}
							onchange={savePrivacy}
						/>
						<span
							class="relative h-7 w-12 shrink-0 rounded-full bg-line transition peer-checked:bg-accent after:absolute after:top-1 after:left-1 after:size-5 after:rounded-full after:bg-surface after:shadow after:transition peer-checked:after:translate-x-5"
						></span>
					</label>
				{/each}
				<div class="p-4">
					<span class="block font-semibold">Кто может писать мне</span>
					<div class="mt-3 grid grid-cols-3 rounded-2xl bg-surface-2 p-1 text-sm font-semibold">
						{#each [{ id: 'all', label: 'Все' }, { id: 'orgs', label: 'Организации' }, { id: 'none', label: 'Никто' }] as opt (opt.id)}
							<button
								class="rounded-xl py-2 {privacy.messages === opt.id
									? 'bg-surface shadow-sm'
									: 'text-muted'}"
								onclick={() => {
									privacy.messages = opt.id as Privacy['messages'];
									savePrivacy();
								}}>{opt.label}</button
							>
						{/each}
					</div>
				</div>
			</div>
			<p class="mt-3 text-xs text-muted">
				Демо-режим: настройки сохраняются, но в прототипе нет других реальных пользователей.
			</p>
		{/if}
	</div>
{/if}
