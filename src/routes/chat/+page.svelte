<script lang="ts">
	import { tr } from '#lib/i18n.ts';
	import { page } from '$app/state';
	import { tick } from 'svelte';
	import { ChevronLeft, Megaphone, Send } from '@lucide/svelte';
	import { app } from '#lib/app.svelte.ts';
	import Avatar from '#lib/components/Avatar.svelte';
	import { ME, toneClass } from '#lib/data.ts';
	import { formatDate, formatTime } from '#lib/format.ts';

	const id = $derived(page.url.searchParams.get('id') ?? '');
	const [opportunityId, personId] = $derived(id.split('__'));
	const o = $derived(app.opportunity(opportunityId ?? ''));
	const thread = $derived(app.thread(id));
	/** Волонтёр видит только свои переписки, организация — по своим мероприятиям */
	const allowed = $derived(!!o && (app.isOrg ? o.orgId === app.myOrgId : personId === ME));
	const partnerId = $derived(app.isOrg ? personId : (o?.orgId ?? ''));

	type Item =
		| { kind: 'message'; id: string; from: string; text: string; at: string }
		| { kind: 'announcement'; id: string; title: string; text: string; at: string };

	const items = $derived<Item[]>(
		[
			...(thread?.messages ?? []).map((m) => ({ kind: 'message' as const, ...m })),
			...(o ? app.announcementsFor(o.id) : []).map((a) => ({ kind: 'announcement' as const, ...a }))
		].sort((a, b) => a.at.localeCompare(b.at))
	);

	let draft = $state('');
	let feed: HTMLDivElement | undefined = $state();

	$effect(() => {
		void items.length;
		tick().then(() => feed?.scrollTo({ top: feed.scrollHeight, behavior: 'smooth' }));
	});

	function send(e: SubmitEvent) {
		e.preventDefault();
		if (!o || !draft.trim()) return;
		app.sendMessage(o.id, personId, draft.trim());
		draft = '';
	}

	const quick = [tr('Что взять с собой?'), tr('Можно прийти с другом?'), tr('Во сколько сбор?')];
</script>

<svelte:head><title>{tr('Чат — Волна')}</title></svelte:head>

{#if !allowed || !o}
	<div class="card p-10 text-center">
		<p class="text-lg font-bold">{tr('Чат недоступен')}</p>
		<a href="/notifications" class="mt-4 btn btn-primary">{tr('К уведомлениям')}</a>
	</div>
{:else}
	<div
		class="mx-auto flex h-[calc(100dvh-11rem)] max-w-2xl flex-col overflow-hidden card lg:h-[calc(100dvh-5rem)]"
	>
		<header class="flex items-center gap-3 border-b border-line p-3">
			<button
				class="btn size-10 rounded-full btn-ghost p-0"
				onclick={() => history.back()}
				aria-label={tr('Назад')}><ChevronLeft class="size-5" /></button
			>
			<Avatar id={partnerId} />
			<div class="min-w-0 flex-1">
				<div class="truncate font-bold">{app.author(partnerId).name}</div>
				<a
					href="/o?id={o.id}"
					class="flex items-center gap-1 truncate text-xs text-muted hover:underline"
					>{o.emoji} {o.title}</a
				>
			</div>
		</header>

		<div bind:this={feed} class="flex-1 space-y-3 overflow-y-auto bg-surface-2/50 p-4">
			<div
				class="mx-auto w-fit rounded-full px-3 py-1 text-xs font-semibold {toneClass[o.tone]
					.bg} {toneClass[o.tone].text}"
			>
				{formatDate(o.date)} · {o.time}
			</div>
			{#each items as item (item.id)}
				{#if item.kind === 'announcement'}
					<div
						class="mx-auto max-w-sm rounded-3xl border border-accent/40 bg-surface p-3 text-center text-sm shadow-sm"
					>
						<div
							class="flex items-center justify-center gap-1.5 text-xs font-bold text-accent-text"
						>
							<Megaphone class="size-3.5" />
							{tr('Уведомление для всех участников')}
						</div>
						<div class="mt-1 font-bold">{item.title}</div>
						<p>{item.text}</p>
					</div>
				{:else}
					{@const mineMsg = item.from === app.actorId}
					<div class="flex items-end gap-2 {mineMsg ? 'justify-end' : ''}">
						{#if !mineMsg}<Avatar id={item.from} size="sm" />{/if}
						<div
							class="max-w-[78%] rounded-3xl px-4 py-2.5 text-[15px] {mineMsg
								? 'rounded-br-md bg-accent text-accent-ink'
								: 'rounded-bl-md bg-surface shadow-sm'}"
						>
							{item.text}
							<div class="mt-0.5 text-right text-[10px] opacity-60">{formatTime(item.at)}</div>
						</div>
					</div>
				{/if}
			{:else}
				<p class="pt-10 text-center text-sm text-muted">
					{tr('Задайте вопрос — организатор ответит здесь.')}
				</p>
			{/each}
		</div>

		<div class="border-t border-line p-3">
			{#if !app.isOrg && !thread?.messages.length}
				<div class="mb-2 no-scrollbar flex gap-2 overflow-x-auto">
					{#each quick as q (q)}
						<button class="chip py-1.5 text-xs" onclick={() => (draft = q)}>{q}</button>
					{/each}
				</div>
			{/if}
			<form class="flex gap-2" onsubmit={send}>
				<input
					class="input"
					placeholder={app.isOrg ? tr('Ответ волонтёру…') : tr('Ваш вопрос организатору…')}
					bind:value={draft}
				/>
				<button class="btn btn-primary px-4" disabled={!draft.trim()} aria-label={tr('Отправить')}
					><Send class="size-4" /></button
				>
			</form>
		</div>
	</div>
{/if}
