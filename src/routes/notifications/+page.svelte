<script lang="ts">
	import { tr } from '#lib/i18n.ts';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { ChevronLeft, ChevronRight, Megaphone, MessageCircle, Send } from '@lucide/svelte';
	import { app } from '#lib/app.svelte.ts';
	import Avatar from '#lib/components/Avatar.svelte';
	import { day, toneClass } from '#lib/data.ts';
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

	const chatHref = (id: string) => `/chat?id=${app.threadId(id, app.me)}`;
</script>

<svelte:head><title>{tr('Уведомления — Волна')}</title></svelte:head>

{#if !o}
	<h1 class="mb-5 text-2xl font-extrabold tracking-tight sm:text-3xl">{tr('Уведомления')}</h1>

	<div class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
		<div class="space-y-5">
			<section>
				<h2 class="mb-3 font-extrabold">{tr('Новое')}</h2>
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
						<li class="p-6 text-center text-sm text-muted">{tr('Пока ничего нового.')}</li>
					{/each}
				</ul>
			</section>
		</div>

		<section>
			<h2 class="mb-3 font-extrabold">
				{app.isOrg ? tr('Ваши мероприятия') : tr('Предстоящие мероприятия')}
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
											><MessageCircle class="size-3.5" />{tr('{0} без ответа', open)}</span
										>{/if}
								</div>
							</div>
							<ChevronRight class="size-5 text-muted" />
						</a>
					</li>
				{:else}
					<li class="card p-6 text-center text-sm text-muted">
						{app.isOrg
							? tr('Опубликуйте мероприятие в кабинете.')
							: tr('Подайте заявку или нажмите «Напомнить позже» — мероприятие появится здесь.')}
					</li>
				{/each}
			</ul>
		</section>
	</div>
{:else}
	<a href="/notifications" class="mb-4 btn btn-ghost"
		><ChevronLeft class="size-4" /> {tr('Все уведомления')}</a
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
			<h2 class="mb-3 font-extrabold">{tr('Уведомления мероприятия')}</h2>
			<ul class="space-y-2">
				{#if o.date >= day(0)}
					<li class="flex gap-3 rounded-3xl bg-accent-soft p-4 text-sm">
						<span
							>{tr(
								'Напоминание придёт {0}: время, место и что взять с собой.',
								relativeDay(o.date) === tr('завтра')
									? tr('сегодня вечером')
									: tr('за день до начала')
							)}</span
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
									{timeAgo(n.at)}{app.isOrg ? '' : tr(' · нажмите, чтобы задать вопрос')}
								</div>
							</div>
						</svelte:element>
					</li>
				{:else}
					<li class="card p-6 text-center text-sm text-muted">
						{tr('Организатор ещё не отправлял уведомлений.')}
					</li>
				{/each}
			</ul>

			{#if app.isOrg}
				<form class="mt-4 space-y-3 card p-4" onsubmit={announce}>
					<h3 class="flex items-center gap-2 font-extrabold">
						<Megaphone class="size-5 text-accent-text" />
						{tr('Создать уведомление')}
					</h3>
					<input
						class="input"
						placeholder={tr('Заголовок, например: Место сбора')}
						bind:value={title}
					/>
					<textarea
						class="min-h-20 input"
						placeholder={tr('Текст для всех участников')}
						bind:value={text}></textarea>
					<button class="btn w-full btn-primary" disabled={!title.trim() || !text.trim()}>
						<Send class="size-4" />
						{tr('Отправить всем участникам · {0}', app.participants(o.id).length)}
					</button>
				</form>
			{:else}
				<a href={chatHref(o.id)} class="mt-4 btn w-full btn-primary py-3"
					><MessageCircle class="size-4" /> {tr('Задать вопрос организатору')}</a
				>
			{/if}
		</section>

		{#if app.isOrg}
			<section>
				<h2 class="mb-3 font-extrabold">{tr('Вопросы волонтёров')}</h2>
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
										>{tr('ждёт ответа')}</span
									>
								{/if}
							</a>
						</li>
					{:else}
						<li class="card p-6 text-center text-sm text-muted">{tr('Вопросов пока нет.')}</li>
					{/each}
				</ul>
			</section>
		{/if}
	</div>
{/if}
