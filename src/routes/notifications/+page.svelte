<script lang="ts">
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import {
		ChevronLeft,
		ChevronRight,
		Megaphone,
		MessageCircle,
		Send,
		Sparkles
	} from '@lucide/svelte';
	import { app } from '#lib/app.svelte.ts';
	import Avatar from '#lib/components/Avatar.svelte';
	import { ME, day, toneClass } from '#lib/data.ts';
	import { formatDate, relativeDay, timeAgo } from '#lib/format.ts';

	const eventId = $derived(page.url.searchParams.get('event'));
	const o = $derived(eventId ? app.opportunity(eventId) : undefined);
	const announcements = $derived(o ? app.announcementsFor(o.id) : []);
	const threads = $derived(o ? app.threadsFor(o.id) : []);

	let title = $state('');
	let text = $state('');

	// Отмечаем личные уведомления прочитанными, когда пользователь их увидел
	onMount(() => {
		const timer = setTimeout(() => app.markAlertsRead(), 1500);
		return () => clearTimeout(timer);
	});

	function announce(e: SubmitEvent) {
		e.preventDefault();
		if (!o || !title.trim() || !text.trim()) return;
		app.announce(o.id, title.trim(), text.trim());
		title = '';
		text = '';
	}

	const chatHref = (id: string) => `/chat?id=${app.threadId(id, ME)}`;
</script>

<svelte:head><title>Уведомления — Волна</title></svelte:head>

{#if !o}
	<h1 class="mb-5 text-2xl font-extrabold tracking-tight sm:text-3xl">Уведомления</h1>

	<div class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
		<div class="space-y-5">
			<!-- ИИ-помощник -->
			<section class="relative overflow-hidden rounded-[2rem] bg-accent-soft p-5">
				<div
					class="pointer-events-none absolute -top-12 -right-12 size-40 rounded-full bg-accent/50 blur-2xl"
				></div>
				<h2 class="relative flex items-center gap-2 font-extrabold">
					<Sparkles class="size-5 text-accent-text" /> ИИ-помощник
				</h2>
				<ul class="relative mt-3 space-y-2">
					{#each app.aiTips as tip (tip.id)}
						<li class="flex items-start gap-3 rounded-3xl bg-surface p-3">
							<span class="grid size-9 shrink-0 place-items-center rounded-2xl bg-surface-2 text-lg"
								>{tip.emoji}</span
							>
							<div class="min-w-0 flex-1 text-sm">
								<p>{tip.text}</p>
								{#if tip.action}
									<a
										href={tip.action.href}
										class="mt-2 inline-flex items-center gap-1 text-xs font-bold text-accent-text"
										>{tip.action.label} <ChevronRight class="size-3.5" /></a
									>
								{/if}
							</div>
						</li>
					{:else}
						<li class="rounded-3xl bg-surface p-4 text-sm text-muted">
							Всё сделано! Новых напоминаний нет ✨
						</li>
					{/each}
				</ul>
			</section>

			<section>
				<h2 class="mb-3 font-extrabold">Новое</h2>
				<ul class="divide-y divide-line card">
					{#each app.myAlerts as alert (alert.id)}
						<li>
							<a
								href={alert.href ?? '#'}
								class="flex items-start gap-3 p-4 transition hover:bg-surface-2"
							>
								<span
									class="grid size-10 shrink-0 place-items-center rounded-2xl bg-surface-2 text-lg"
									>{alert.emoji}</span
								>
								<span class="min-w-0 flex-1 text-sm">
									<span class={alert.read ? '' : 'font-bold'}>{alert.text}</span>
									<span class="mt-0.5 block text-xs text-muted">{timeAgo(alert.at)}</span>
								</span>
								{#if !alert.read}<span class="mt-2 size-2.5 shrink-0 rounded-full bg-accent-text"
									></span>{/if}
							</a>
						</li>
					{:else}
						<li class="p-6 text-center text-sm text-muted">Пока ничего нового.</li>
					{/each}
				</ul>
			</section>
		</div>

		<section>
			<h2 class="mb-3 font-extrabold">
				{app.isOrg ? 'Ваши мероприятия' : 'Предстоящие мероприятия'}
			</h2>
			<ul class="space-y-2">
				{#each app.notificationEvents as event (event.id)}
					{@const count = app.announcementsFor(event.id).length}
					{@const open = app.threadsFor(event.id).filter((t) => app.isUnanswered(t)).length}
					<li>
						<a
							href="/notifications?event={event.id}"
							class="flex items-center gap-3 card p-3 transition hover:border-accent"
						>
							<span
								class="grid size-14 shrink-0 place-items-center rounded-2xl text-2xl {toneClass[
									event.tone
								].bg}">{event.emoji}</span
							>
							<div class="min-w-0 flex-1">
								<div class="truncate font-bold">{event.title}</div>
								<div class="text-xs text-muted">
									{formatDate(event.date)} · {relativeDay(event.date)}
								</div>
								<div class="mt-1 flex gap-3 text-xs font-semibold text-muted">
									<span class="flex items-center gap-1"><Megaphone class="size-3.5" />{count}</span>
									{#if app.isOrg && open}<span class="flex items-center gap-1 text-pastel-peach-ink"
											><MessageCircle class="size-3.5" />{open} без ответа</span
										>{/if}
								</div>
							</div>
							<ChevronRight class="size-5 text-muted" />
						</a>
					</li>
				{:else}
					<li class="card p-6 text-center text-sm text-muted">
						{app.isOrg
							? 'Опубликуйте мероприятие в кабинете.'
							: 'Подайте заявку или нажмите «Напомнить позже» — мероприятие появится здесь.'}
					</li>
				{/each}
			</ul>
		</section>
	</div>
{:else}
	<a href="/notifications" class="mb-4 btn btn-ghost"
		><ChevronLeft class="size-4" /> Все уведомления</a
	>

	<a
		href="/o?id={o.id}"
		class="mb-5 flex items-center gap-3 rounded-[2rem] p-4 {toneClass[o.tone].bg}"
	>
		<span class="grid size-16 shrink-0 place-items-center rounded-3xl bg-surface/70 text-3xl"
			>{o.emoji}</span
		>
		<div class="min-w-0">
			<h1 class="text-xl leading-tight font-extrabold">{o.title}</h1>
			<p class="text-sm text-muted">{formatDate(o.date)} · {o.time} · {o.place}</p>
		</div>
	</a>

	<div class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
		<section>
			<h2 class="mb-3 font-extrabold">Уведомления мероприятия</h2>
			<ul class="space-y-2">
				{#if o.date >= day(0)}
					<li class="flex gap-3 rounded-3xl bg-accent-soft p-4 text-sm">
						<Sparkles class="size-5 shrink-0 text-accent-text" />
						<span
							>ИИ-напоминание придёт {relativeDay(o.date) === 'завтра'
								? 'сегодня вечером'
								: 'за день до начала'}: время, место и что взять с собой.</span
						>
					</li>
				{/if}
				{#each announcements as n (n.id)}
					<li>
						<svelte:element
							this={app.isOrg ? 'div' : 'a'}
							href={app.isOrg ? undefined : chatHref(o.id)}
							class="flex gap-3 card p-4 {app.isOrg ? '' : 'transition hover:border-accent'}"
						>
							<Avatar id={o.orgId} size="sm" />
							<div class="min-w-0 flex-1">
								<div class="font-bold">{n.title}</div>
								<p class="text-sm">{n.text}</p>
								<div class="mt-1 text-xs text-muted">
									{timeAgo(n.at)}{app.isOrg ? '' : ' · нажмите, чтобы задать вопрос'}
								</div>
							</div>
						</svelte:element>
					</li>
				{:else}
					<li class="card p-6 text-center text-sm text-muted">
						Организатор ещё не отправлял уведомлений.
					</li>
				{/each}
			</ul>

			{#if app.isOrg}
				<form class="mt-4 space-y-3 card p-4" onsubmit={announce}>
					<h3 class="flex items-center gap-2 font-extrabold">
						<Megaphone class="size-5 text-accent-text" /> Создать уведомление
					</h3>
					<input class="input" placeholder="Заголовок, например: Место сбора" bind:value={title} />
					<textarea class="min-h-20 input" placeholder="Текст для всех участников" bind:value={text}
					></textarea>
					<button class="btn w-full btn-primary" disabled={!title.trim() || !text.trim()}>
						<Send class="size-4" /> Отправить всем участникам · {app.participants(o.id).length}
					</button>
				</form>
			{:else}
				<a href={chatHref(o.id)} class="mt-4 btn w-full btn-primary py-3"
					><MessageCircle class="size-4" /> Задать вопрос организатору</a
				>
			{/if}
		</section>

		{#if app.isOrg}
			<section>
				<h2 class="mb-3 font-extrabold">Вопросы волонтёров</h2>
				<ul class="space-y-2">
					{#each threads as t (t.id)}
						{@const last = t.messages.at(-1)}
						<li>
							<a
								href="/chat?id={t.id}"
								class="flex items-center gap-3 card p-3 transition hover:border-accent"
							>
								<Avatar id={t.personId} />
								<div class="min-w-0 flex-1">
									<div class="truncate font-bold">{app.author(t.personId).name}</div>
									<div class="truncate text-sm text-muted">{last?.text}</div>
								</div>
								{#if app.isUnanswered(t)}
									<span
										class="rounded-full bg-pastel-peach px-2.5 py-1 text-xs font-bold text-pastel-peach-ink"
										>ждёт ответа</span
									>
								{/if}
							</a>
						</li>
					{:else}
						<li class="card p-6 text-center text-sm text-muted">Вопросов пока нет.</li>
					{/each}
				</ul>
			</section>
		{/if}
	</div>
{/if}
