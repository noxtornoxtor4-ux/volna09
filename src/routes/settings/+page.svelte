<script lang="ts">
	import { getLocale, locales, tr } from '#lib/i18n.ts';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import {
		Archive,
		BookOpen,
		Check,
		ChevronLeft,
		ChevronRight,
		Languages,
		Lock,
		LogOut,
		MonitorSmartphone,
		Moon,
		Palette,
		Plus,
		Smartphone,
		Sun,
		UserCog,
		Users
	} from '@lucide/svelte';
	import { app } from '#lib/app.svelte.ts';
	import Avatar from '#lib/components/Avatar.svelte';
	import InstallApp from '#lib/components/InstallApp.svelte';
	import LanguagePicker from '#lib/components/LanguagePicker.svelte';
	import LogoColorEditor from '#lib/components/LogoColorEditor.svelte';
	import ThemeEditor from '#lib/components/ThemeEditor.svelte';
	import Modal from '#lib/components/Modal.svelte';
	import OrgPicker from '#lib/components/OrgPicker.svelte';
	import { authError, changePassword } from '#lib/auth.ts';
	import { accents, toneClass } from '#lib/data.ts';
	import { formatDate } from '#lib/format.ts';
	import type { Accent, Privacy, Role, ThemeMode } from '#lib/types.ts';

	type Section =
		'language' | 'install' | 'guide' | 'account' | 'accounts' | 'style' | 'archive' | 'privacy';

	const sections: { id: Section; label: string; hint: string; icon: typeof BookOpen }[] = [
		{ id: 'language', label: tr('Язык'), hint: locales[getLocale()].label, icon: Languages },
		{
			id: 'install',
			label: tr('Установить приложение'),
			hint: tr('Иконка на телефоне и компьютере'),
			icon: Smartphone
		},
		{
			id: 'guide',
			label: tr('Руководство по использованию'),
			hint: tr('Как всё устроено'),
			icon: BookOpen
		},
		{
			id: 'account',
			label: tr('Учётная запись'),
			hint: tr('Телефон, email, пароль'),
			icon: UserCog
		},
		{ id: 'accounts', label: tr('Аккаунты'), hint: tr('Волонтёр и организация'), icon: Users },
		{ id: 'style', label: tr('Стиль приложения'), hint: tr('Цвет и тема'), icon: Palette },
		{ id: 'archive', label: tr('Архив мероприятий'), hint: tr('Прошедшие события'), icon: Archive },
		{ id: 'privacy', label: tr('Конфиденциальность'), hint: tr('Кто что видит'), icon: Lock }
	];

	const section = $derived(page.url.searchParams.get('s') as Section | null);
	const current = $derived(sections.find((s) => s.id === section));

	let password = $state('');
	let passwordBusy = $state(false);
	let passwordProblem = $state('');
	let addingOrg = $state(false);
	let orgChoice = $state('');
	let newOrg = $state({ name: '', city: '', about: '' });

	async function savePassword(e: SubmitEvent) {
		e.preventDefault();
		passwordProblem = '';
		passwordBusy = true;
		try {
			await changePassword(password);
			password = '';
			app.notify(tr('Пароль обновлён'));
		} catch (error) {
			passwordProblem = authError(error);
		} finally {
			passwordBusy = false;
		}
	}

	function addOrg(e: SubmitEvent) {
		e.preventDefault();
		if (!orgChoice) return;
		app.addOrgAccount(
			orgChoice === 'new'
				? {
						newOrg: {
							name: newOrg.name.trim(),
							city: newOrg.city.trim(),
							about: newOrg.about.trim()
						}
					}
				: { orgId: orgChoice }
		);
		addingOrg = false;
		goto('/cabinet');
	}
	let privacy = $state<Privacy>($state.snapshot(app.privacy));

	const guide = $derived(
		app.isOrg
			? [
					{
						emoji: '➕',
						title: tr('Публикуйте мероприятия'),
						text: tr(
							'Кнопка «+» в кабинете открывает конструктор: описание, задачи, постер и своя анкета для волонтёров.'
						)
					},
					{
						emoji: '📁',
						title: tr('Работайте с папками'),
						text: tr('В кабинете три папки: заявки, волонтёры и подтверждение часов.')
					},
					{
						emoji: '📣',
						title: tr('Отправляйте уведомления'),
						text: tr(
							'Откройте мероприятие в «Уведомлениях» — можно написать всем участникам и ответить на вопросы в чате.'
						)
					},
					{
						emoji: '🏆',
						title: tr('Награждайте'),
						text: tr(
							'В «Кабинете наград» создайте медаль, кубок или сертификат и вручите участникам.'
						)
					},
					{
						emoji: '🚀',
						title: tr('Продвигайте'),
						text: tr('Продвижение поднимает мероприятие в начало ленты и сторисов.')
					}
				]
			: [
					{
						emoji: '✨',
						title: tr('Смотрите «Для вас»'),
						text: tr('Сторисы по темам на главной — листайте постеры и сразу подавайтесь.')
					},
					{
						emoji: '📝',
						title: tr('Подавайте анкету'),
						text: tr('Кнопка «Податься» открывает анкету организатора. Ответ придёт в уведомления.')
					},
					{
						emoji: '🗓️',
						title: tr('Следите за календарём'),
						text: tr('После подтверждения день отмечается сам, а накануне придёт напоминание.')
					},
					{
						emoji: '⏱️',
						title: tr('Подтверждайте часы'),
						text: tr('В портфолио отправьте организации заявку — подтверждённые часы видны всем.')
					},
					{
						emoji: '🏅',
						title: tr('Собирайте награды'),
						text: tr('Медали, кубки и сертификаты стоят на полках в «Кабинете наград».')
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
		goto('/login', { replace: true });
	}

	function savePrivacy() {
		app.setPrivacy($state.snapshot(privacy));
	}
</script>

<svelte:head><title>{tr('Настройки — Волна')}</title></svelte:head>

{#if !current}
	<h1 class="mb-5 text-2xl font-extrabold tracking-tight sm:text-3xl">{tr('Настройки')}</h1>
	<div class="mx-auto max-w-2xl space-y-4">
		<a href="/profile" class="flex items-center gap-3 card p-4 transition hover:border-accent">
			<Avatar id={app.actorId} size="lg" />
			<div class="min-w-0 flex-1">
				<div class="truncate font-bold">{app.author(app.actorId).name}</div>
				<div class="text-sm text-muted">
					{app.isOrg ? tr('Аккаунт организации') : tr('Аккаунт волонтёра')} · {app.session?.contact}
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
			><LogOut class="size-4" /> {tr('Выйти')}</button
		>
	</div>
{:else}
	<a href="/settings" class="mb-4 btn btn-ghost"><ChevronLeft class="size-4" /> {tr('Настройки')}</a
	>
	<div class="mx-auto max-w-2xl">
		<h1 class="mb-5 flex items-center gap-2 text-2xl font-extrabold tracking-tight">
			<current.icon class="size-6 text-accent-text" />
			{current.label}
		</h1>

		{#if section === 'language'}
			<section class="card p-5">
				<LanguagePicker />
				<p class="mt-3 text-sm text-muted">{tr('Приложение перезапустится на выбранном языке.')}</p>
			</section>
		{:else if section === 'install'}
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
				<div class="card p-5">
					<span class="label">{app.session?.method === 'google' ? 'Google' : 'Email'}</span>
					<p class="font-semibold">{app.session?.contact}</p>
					<p class="mt-1 text-xs text-muted">
						{tr('Вход подтверждён через Firebase. Другие пользователи этот контакт не видят.')}
					</p>
				</div>
				{#if app.session?.method === 'email'}
					<form class="space-y-3 card p-5" onsubmit={savePassword}>
						<span class="label">{tr('Новый пароль')}</span>
						<input
							class="input"
							type="password"
							minlength="6"
							required
							autocomplete="new-password"
							bind:value={password}
						/>
						{#if passwordProblem}<p
								class="rounded-2xl bg-pastel-peach p-3 text-sm text-pastel-peach-ink"
							>
								{passwordProblem}
							</p>{/if}
						<button class="btn btn-ghost" disabled={password.length < 6 || passwordBusy}
							>{tr('Сменить пароль')}</button
						>
					</form>
				{/if}
				<div class="space-y-2 card p-5">
					<button class="btn w-full btn-ghost text-pastel-peach-ink" onclick={logout}
						><LogOut class="size-4" /> {tr('Выйти из аккаунта')}</button
					>
				</div>
			</div>
		{:else if section === 'accounts'}
			<p class="mb-4 text-sm text-muted">
				{tr('Переключайтесь между личным аккаунтом и аккаунтом организации без повторного входа.')}
			</p>
			<ul class="space-y-3">
				{#each [{ role: 'volunteer' as Role, id: app.me, label: tr('Волонтёр') }, ...(app.myOrgId ? [{ role: 'org' as Role, id: app.myOrgId, label: tr('Организация') }] : [])] as acc (acc.role)}
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
								><Check class="size-3.5" /> {tr('Активен')}</span
							>
						{:else}
							<button class="btn btn-soft" onclick={() => switchTo(acc.role)}
								>{tr('Перейти')}</button
							>
						{/if}
					</li>
				{/each}
			</ul>
			{#if !app.myOrgId}
				<button class="mt-4 btn w-full btn-ghost" onclick={() => (addingOrg = true)}
					><Plus class="size-4" /> {tr('Добавить аккаунт организации')}</button
				>
			{/if}
			<Modal bind:open={addingOrg} title={tr('Аккаунт организации')}>
				<form onsubmit={addOrg}>
					<OrgPicker bind:selected={orgChoice} bind:draft={newOrg} />
					<button
						class="mt-4 btn w-full btn-primary"
						disabled={!orgChoice ||
							(orgChoice === 'new' && (newOrg.name.trim().length < 2 || !newOrg.city.trim()))}
						>{tr('Готово')}</button
					>
				</form>
			</Modal>
		{:else if section === 'style'}
			<section class="card p-5">
				<span class="label">{tr('Акцентный цвет')}</span>
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

				<span class="mt-5 label">{tr('Тема')}</span>
				<div class="grid grid-cols-3 rounded-2xl bg-surface-2 p-1 text-sm font-semibold">
					{#each [{ id: 'light' as ThemeMode, label: tr('Светлая'), icon: Sun }, { id: 'dark' as ThemeMode, label: tr('Тёмная'), icon: Moon }, { id: 'system' as ThemeMode, label: tr('Системная'), icon: MonitorSmartphone }] as m (m.id)}
						<button
							class="flex items-center justify-center gap-1.5 rounded-xl py-2.5 {app.mode === m.id
								? 'bg-surface shadow-sm'
								: 'text-muted'}"
							aria-pressed={app.mode === m.id}
							onclick={() => app.setMode(m.id)}><m.icon class="size-4" /> {m.label}</button
						>
					{/each}
				</div>

				<div class="mt-5 rounded-3xl bg-surface-2 p-4">
					<p class="label">{tr('Предпросмотр')}</p>
					<div class="flex flex-wrap gap-2">
						<span class="btn btn-primary">{tr('Податься')}</span>
						<span class="btn btn-soft">{tr('Напомнить позже')}</span>
						<span class="chip border-accent bg-accent-soft text-accent-text">{tr('Тренинги')}</span>
					</div>
				</div>
			</section>
			<div class="mt-4"><LogoColorEditor /></div>
			<div class="mt-4"><ThemeEditor /></div>
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
										? tr(
												'{0} участников · {1} наград',
												app.participants(o.id).length,
												app.awards.filter((a) => a.opportunityId === o.id).length
											)
										: tr('{0} · {1} ч', role ?? tr('Волонтёр'), o.hours)}
								</div>
							</div>
						</a>
					</li>
				{:else}
					<li class="card p-6 text-center text-sm text-muted">{tr('Архив пуст.')}</li>
				{/each}
			</ul>
		{:else if section === 'privacy'}
			<div class="divide-y divide-line card">
				{#each [{ key: 'publicProfile', label: tr('Открытый профиль'), hint: tr('Профиль и публикации видны всем пользователям') }, { key: 'showHours', label: tr('Показывать часы'), hint: tr('Счётчик часов и проекты видны в профиле') }, { key: 'searchable', label: tr('Находить меня в поиске'), hint: tr('По имени и городу') }] as item (item.key)}
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
					<span class="block font-semibold">{tr('Кто может писать мне')}</span>
					<div class="mt-3 grid grid-cols-3 rounded-2xl bg-surface-2 p-1 text-sm font-semibold">
						{#each [{ id: 'all', label: tr('Все') }, { id: 'orgs', label: tr('Организации') }, { id: 'none', label: tr('Никто') }] as opt (opt.id)}
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
				{tr('Демо-режим: настройки сохраняются, но в прототипе нет других реальных пользователей.')}
			</p>
		{/if}
	</div>
{/if}
