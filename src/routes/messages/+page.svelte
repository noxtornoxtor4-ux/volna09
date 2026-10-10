<script lang="ts">
	import { tr } from '#lib/i18n.ts';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { tick } from 'svelte';
	import {
		ChevronLeft,
		Info,
		LogOut,
		MessageCirclePlus,
		Search,
		Send,
		UserPlus,
		Users,
		Video
	} from '@lucide/svelte';
	import { app } from '#lib/app.svelte.ts';
	import Avatar from '#lib/components/Avatar.svelte';
	import ChatAvatar from '#lib/components/ChatAvatar.svelte';
	import Modal from '#lib/components/Modal.svelte';
	import PeoplePicker from '#lib/components/PeoplePicker.svelte';
	import { toneClass, tones } from '#lib/data.ts';
	import { formatTime, plural, timeAgo } from '#lib/format.ts';
	import type { Conversation, Tone } from '#lib/types.ts';

	type Tab = 'all' | 'dm' | 'group' | 'events';

	const conversationId = $derived(page.url.searchParams.get('c'));
	const current = $derived(conversationId ? app.conversation(conversationId) : undefined);
	const isMember = $derived(!!current && current.members.includes(app.actorId));

	let tab = $state<Tab>('all');
	let query = $state('');
	let draft = $state('');
	let newDm = $state(false);
	let newGroup = $state(false);
	let info = $state(false);
	let adding = $state(false);
	let toAdd = $state<string[]>([]);
	let group = $state<{
		title: string;
		emoji: string;
		tone: Tone;
		opportunityId: string;
		members: string[];
	}>({
		title: '',
		emoji: '💬',
		tone: 'blue',
		opportunityId: '',
		members: []
	});
	let feed: HTMLDivElement | undefined = $state();

	const emojis = ['💬', '🌳', '🐾', '📚', '🎬', '🤝', '🎨', '⚽', '💡', '🧣', '♻️', '🎉'];

	const title = (c: Conversation) =>
		c.kind === 'dm' ? app.author(app.partnerOf(c)).name : (c.title ?? tr('Группа'));

	const list = $derived.by(() => {
		const q = query.trim().toLowerCase();
		return app.myConversations.filter(
			(c) =>
				(c.kind === 'group' || c.messages.length > 0) &&
				(tab === 'all' || tab === c.kind) &&
				(!q || title(c).toLowerCase().includes(q))
		);
	});

	// Открытый чат сразу помечается прочитанным и прокручивается вниз
	$effect(() => {
		if (!current || !isMember) return;
		void current.messages.length;
		app.markConversationRead(current);
		tick().then(() => feed?.scrollTo({ top: feed.scrollHeight, behavior: 'smooth' }));
	});

	function open(id: string) {
		goto(`/messages?c=${id}`);
	}

	function send(e: SubmitEvent) {
		e.preventDefault();
		if (!current || !draft.trim()) return;
		app.sendToConversation(current, draft.trim());
		draft = '';
	}

	function createGroup(e: SubmitEvent) {
		e.preventDefault();
		if (!group.title.trim() || !group.members.length) return;
		const id = app.createGroup({
			...group,
			title: group.title.trim(),
			opportunityId: group.opportunityId || undefined
		});
		newGroup = false;
		group = { title: '', emoji: '💬', tone: 'blue', opportunityId: '', members: [] };
		open(id);
	}

	function leave() {
		if (!current) return;
		app.leaveConversation(current);
		info = false;
		goto('/messages');
	}

	function startCall() {
		if (!current) return;
		goto(`/call?room=${app.callConversation(current)}`);
	}

	const profileHref = (id: string) => (id === app.actorId ? '/profile' : `/u?id=${id}`);
</script>

<svelte:head><title>{tr('Сообщения — Волна')}</title></svelte:head>

{#if !current}
	<div class="mx-auto max-w-2xl">
		<div class="mb-5 flex items-center justify-between gap-3">
			<h1 class="text-2xl font-extrabold tracking-tight sm:text-3xl">{tr('Сообщения')}</h1>
			<div class="flex gap-2">
				<button class="btn btn-ghost" onclick={() => (newGroup = true)}
					><Users class="size-4" /> <span class="hidden sm:inline">{tr('Группа')}</span></button
				>
				<button class="btn btn-primary" onclick={() => (newDm = true)}
					><MessageCirclePlus class="size-4" />
					<span class="hidden sm:inline">{tr('Написать')}</span></button
				>
			</div>
		</div>

		<label class="relative mb-3 block">
			<Search
				class="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted"
			/>
			<input
				class="input py-3 pl-12"
				type="search"
				placeholder={tr('Поиск по чатам')}
				bind:value={query}
			/>
		</label>

		<div class="-mx-4 mb-4 no-scrollbar flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
			{#each [{ id: 'all', label: tr('Все') }, { id: 'dm', label: tr('Личные') }, { id: 'group', label: tr('Группы') }, { id: 'events', label: tr('Вопросы по мероприятиям') }] as t (t.id)}
				<button
					class="chip {tab === t.id ? 'border-accent bg-accent text-accent-ink' : ''}"
					onclick={() => (tab = t.id as Tab)}>{t.label}</button
				>
			{/each}
		</div>

		{#if tab === 'events'}
			<ul class="divide-y divide-line card">
				{#each app.myEventThreads as t (t.id)}
					{@const o = app.opportunity(t.opportunityId)}
					{@const last = t.messages.at(-1)}
					<li>
						<a
							href="/chat?id={t.id}"
							class="flex items-center gap-3 p-3 transition hover:bg-surface-2"
						>
							<Avatar id={app.isOrg ? t.personId : (o?.orgId ?? '')} />
							<div class="min-w-0 flex-1">
								<div class="truncate font-bold">
									{app.isOrg ? app.author(t.personId).name : app.org(o?.orgId ?? '')?.name}
								</div>
								<div class="truncate text-xs text-muted">{o?.emoji} {o?.title}</div>
								<div class="truncate text-sm text-muted">{last?.text}</div>
							</div>
							{#if app.isOrg && app.isUnanswered(t)}<span
									class="rounded-full bg-pastel-peach px-2 py-0.5 text-xs font-bold text-pastel-peach-ink"
									>{tr('ждёт ответа')}</span
								>{/if}
						</a>
					</li>
				{:else}
					<li class="p-8 text-center text-sm text-muted">
						{tr('Вопросов по мероприятиям пока нет.')}
					</li>
				{/each}
			</ul>
		{:else}
			<ul class="divide-y divide-line card">
				{#each list as c (c.id)}
					{@const last = c.messages.at(-1)}
					{@const unread = app.unreadIn(c)}
					<li>
						<a
							href="/messages?c={c.id}"
							class="flex items-center gap-3 p-3 transition hover:bg-surface-2"
						>
							<ChatAvatar conversation={c} />
							<div class="min-w-0 flex-1">
								<div class="flex items-center gap-2">
									<span class="truncate font-bold">{title(c)}</span>
									{#if c.kind === 'group'}<span class="shrink-0 text-xs text-muted"
											>· {c.members.length}</span
										>{/if}
								</div>
								<div class="truncate text-sm {unread ? 'font-semibold text-ink' : 'text-muted'}">
									{#if last}
										{last.from === app.actorId
											? tr('Вы: ')
											: c.kind === 'group'
												? `${app.author(last.from).name.split(' ')[0]}: `
												: ''}{last.text}
									{:else}
										{tr('Нет сообщений')}
									{/if}
								</div>
							</div>
							<div class="flex shrink-0 flex-col items-end gap-1">
								{#if last}<span class="text-xs text-muted">{timeAgo(last.at)}</span>{/if}
								{#if unread}<span
										class="grid min-w-5 place-items-center rounded-full bg-accent px-1.5 text-xs font-bold text-accent-ink"
										>{unread}</span
									>{/if}
							</div>
						</a>
					</li>
				{:else}
					<li class="p-8 text-center text-sm text-muted">
						{query
							? tr('Ничего не нашли')
							: tr('Чатов пока нет. Напишите волонтёру или создайте группу проекта.')}
					</li>
				{/each}
			</ul>
		{/if}
	</div>
{:else if !isMember}
	<div class="card p-10 text-center">
		<p class="text-lg font-bold">{tr('Вы не участник этого чата')}</p>
		<a href="/messages" class="mt-4 btn btn-primary">{tr('К сообщениям')}</a>
	</div>
{:else}
	{@const o = current.opportunityId ? app.opportunity(current.opportunityId) : undefined}
	<div
		class="mx-auto flex h-[calc(100dvh-11rem)] max-w-2xl flex-col overflow-hidden card lg:h-[calc(100dvh-5rem)]"
	>
		<header class="flex items-center gap-3 border-b border-line p-3">
			<a href="/messages" class="btn size-10 rounded-full btn-ghost p-0" aria-label={tr('Назад')}
				><ChevronLeft class="size-5" /></a
			>
			<a
				href={current.kind === 'dm' ? profileHref(app.partnerOf(current)) : undefined}
				class="flex min-w-0 flex-1 items-center gap-3"
			>
				<ChatAvatar conversation={current} />
				<div class="min-w-0">
					<div class="truncate font-bold">{title(current)}</div>
					<div class="truncate text-xs text-muted">
						{#if current.kind === 'group'}
							{current.members.length}
							{plural(current.members.length, 'участник', 'участника', 'участников')}{o
								? ` · ${o.emoji} ${o.title}`
								: ''}
						{:else}
							{app.author(app.partnerOf(current)).isOrg
								? tr('Организация')
								: tr('Личные сообщения')}
						{/if}
					</div>
				</div>
			</a>
			{#if isMember}
				<button
					class="btn size-10 rounded-full btn-ghost p-0"
					onclick={startCall}
					aria-label={tr('Видеозвонок')}><Video class="size-5" /></button
				>
			{/if}
			{#if current.kind === 'group'}
				<button
					class="btn size-10 rounded-full btn-ghost p-0"
					onclick={() => (info = true)}
					aria-label={tr('О группе')}><Info class="size-5" /></button
				>
			{/if}
		</header>

		<div bind:this={feed} class="flex-1 space-y-2 overflow-y-auto bg-surface-2/50 p-4">
			{#each current.messages as m, i (m.id)}
				{@const mine = m.from === app.actorId}
				{@const showName =
					current.kind === 'group' && !mine && current.messages[i - 1]?.from !== m.from}
				<div class="flex items-end gap-2 {mine ? 'justify-end' : ''}">
					{#if !mine}
						<a
							href={profileHref(m.from)}
							class={showName || current.kind === 'dm' ? '' : 'invisible'}
							><Avatar id={m.from} size="sm" /></a
						>
					{/if}
					<div
						class="max-w-[78%] rounded-3xl px-4 py-2.5 text-[15px] {mine
							? 'rounded-br-md bg-accent text-accent-ink'
							: 'rounded-bl-md bg-surface shadow-sm'}"
					>
						{#if showName}<div class="mb-0.5 text-xs font-bold text-accent-text">
								{app.author(m.from).name}
							</div>{/if}
						{#if m.call}<a
								href="/call?room={m.call}"
								class="flex items-center gap-2 font-bold underline-offset-2 hover:underline"
								><Video class="size-4" /> {tr('Видеозвонок')} · {tr('Присоединиться')}</a
							>{:else}{m.text}{/if}
						<div class="mt-0.5 text-right text-[10px] opacity-60">{formatTime(m.at)}</div>
					</div>
				</div>
			{:else}
				<p class="pt-10 text-center text-sm text-muted">
					{tr('Начните разговор — напишите первое сообщение.')}
				</p>
			{/each}
		</div>

		<form class="flex gap-2 border-t border-line p-3" onsubmit={send}>
			<input class="input" placeholder={tr('Сообщение…')} bind:value={draft} />
			<button class="btn btn-primary px-4" disabled={!draft.trim()} aria-label={tr('Отправить')}
				><Send class="size-4" /></button
			>
		</form>
	</div>

	{#if current.kind === 'group'}
		<Modal bind:open={info} title={title(current)}>
			<div class="mb-4 flex items-center gap-3">
				<ChatAvatar conversation={current} size="lg" />
				<div class="text-sm text-muted">
					{tr('Создал(а): {0}', app.author(current.createdBy).name)}
					{#if o}<br /><a href="/o?id={o.id}" class="font-semibold text-accent-text"
							>{o.emoji} {o.title}</a
						>{/if}
				</div>
			</div>
			<div class="mb-2 flex items-center justify-between">
				<span class="label mb-0">{tr('Участники · {0}', current.members.length)}</span>
				<button
					class="text-sm font-semibold text-accent-text"
					onclick={() => {
						toAdd = [];
						adding = true;
					}}><UserPlus class="mr-1 inline size-4" />{tr('Добавить')}</button
				>
			</div>
			<ul class="mb-4 max-h-64 space-y-1 overflow-y-auto">
				{#each current.members as id (id)}
					<li>
						<a
							href={profileHref(id)}
							class="flex items-center gap-3 rounded-2xl p-2 hover:bg-surface-2"
						>
							<Avatar {id} size="sm" />
							<span class="flex-1 text-sm font-semibold"
								>{app.author(id).name}{id === app.actorId ? tr(' (вы)') : ''}</span
							>
							{#if id === current.createdBy}<span class="text-xs text-muted">{tr('создатель')}</span
								>{/if}
						</a>
					</li>
				{/each}
			</ul>
			<button class="btn w-full btn-ghost text-pastel-peach-ink" onclick={leave}
				><LogOut class="size-4" /> {tr('Выйти из группы')}</button
			>
		</Modal>

		<Modal bind:open={adding} title={tr('Добавить участников')}>
			<PeoplePicker bind:selected={toAdd} exclude={current.members} />
			<button
				class="mt-4 btn w-full btn-primary"
				disabled={!toAdd.length}
				onclick={() => {
					app.addMembers(current, toAdd);
					adding = false;
				}}
			>
				{tr('Добавить · {0}', toAdd.length)}
			</button>
		</Modal>
	{/if}
{/if}

<Modal bind:open={newDm} title={tr('Новое сообщение')}>
	<PeoplePicker
		multiple={false}
		onpick={(id) => {
			newDm = false;
			open(app.startDm(id));
		}}
	/>
</Modal>

<Modal bind:open={newGroup} title={tr('Новый групповой чат')}>
	<form class="space-y-4" onsubmit={createGroup}>
		<div class="flex items-center gap-3">
			<span
				class="grid size-14 shrink-0 place-items-center rounded-2xl text-2xl {toneClass[group.tone]
					.bg}">{group.emoji}</span
			>
			<input
				class="input"
				required
				maxlength="40"
				placeholder={tr('Название: например, Команда эко-марафона')}
				bind:value={group.title}
			/>
		</div>
		<div class="flex flex-wrap gap-1.5">
			{#each emojis as e (e)}
				<button
					type="button"
					class="grid size-10 place-items-center rounded-xl text-lg {group.emoji === e
						? 'bg-accent-soft ring-2 ring-accent'
						: 'bg-surface-2'}"
					onclick={() => (group.emoji = e)}>{e}</button
				>
			{/each}
		</div>
		<div class="flex gap-2">
			{#each tones as t (t)}
				<button
					type="button"
					class="size-8 rounded-full border-2 {toneClass[t].bg} {group.tone === t
						? 'border-ink'
						: 'border-transparent'}"
					onclick={() => (group.tone = t)}
					aria-label={tr('Цвет {0}', t)}
				></button>
			{/each}
		</div>
		<label class="block">
			<span class="label">{tr('Проект (необязательно)')}</span>
			<select class="input" bind:value={group.opportunityId}>
				<option value="">{tr('Без проекта')}</option>
				{#each app.opportunities as op (op.id)}
					<option value={op.id}>{op.emoji} {op.title}</option>
				{/each}
			</select>
		</label>
		<div>
			<span class="label">{tr('Участники · {0}', group.members.length)}</span>
			<PeoplePicker bind:selected={group.members} />
		</div>
		<button class="btn w-full btn-primary" disabled={!group.title.trim() || !group.members.length}
			>{tr('Создать группу')}</button
		>
	</form>
</Modal>
