<script lang="ts">
	import { BadgeCheck, Check, CircleCheck, Hourglass, Inbox, Plus, Users, X } from '@lucide/svelte';
	import { app } from '#lib/app.svelte.ts';
	import Avatar from '#lib/components/Avatar.svelte';
	import OpportunityCard from '#lib/components/OpportunityCard.svelte';
	import { MY_ORG, categories, day, interests, people, toneClass } from '#lib/data.ts';
	import { formatDate, plural, timeAgo } from '#lib/format.ts';
	import type { ApplicationStatus, Category, Interest, Opportunity, Tone } from '#lib/types.ts';

	type Tab = 'applications' | 'hours' | 'events' | 'create';

	let tab = $state<Tab>('applications');
	let appFilter = $state<ApplicationStatus | 'all'>('pending');

	const emptyDraft = (): Omit<Opportunity, 'id' | 'orgId'> => ({
		category: 'action',
		title: '',
		date: day(7),
		time: '10:00–13:00',
		place: '',
		spots: 20,
		hours: 3,
		tags: ['ecology'],
		description: '',
		emoji: '🌱',
		tone: 'green',
		deadline: day(5)
	});
	let draft = $state(emptyDraft());

	const emojis = ['🌱', '🌳', '♻️', '🐾', '📚', '🎓', '🤝', '🎨', '🏃', '🍕', '🎬', '💚'];
	const tones: Tone[] = ['blue', 'yellow', 'green', 'lilac', 'peach'];

	const person = (id: string) =>
		id === 'me'
			? { name: app.profile.name, age: app.profile.age, city: app.profile.city }
			: people.find((p) => p.id === id);
	const pendingApps = $derived(app.orgApplications.filter((a) => a.status === 'pending'));
	const pendingHours = $derived(app.orgHours.filter((h) => h.status === 'pending'));
	const volunteers = $derived(
		new Set(app.orgApplications.filter((a) => a.status === 'approved').map((a) => a.personId)).size
	);
	const verified = $derived(
		app.orgHours.filter((h) => h.status === 'verified').reduce((s, h) => s + h.hours, 0)
	);
	const shownApps = $derived(
		appFilter === 'all'
			? app.orgApplications
			: app.orgApplications.filter((a) => a.status === appFilter)
	);

	const tabs = $derived([
		{ id: 'applications' as Tab, label: 'Заявки', count: pendingApps.length },
		{ id: 'hours' as Tab, label: 'Часы', count: pendingHours.length },
		{ id: 'events' as Tab, label: 'Мероприятия', count: 0 },
		{ id: 'create' as Tab, label: 'Создать', count: 0 }
	]);

	function toggleTag(tag: Interest) {
		draft.tags = draft.tags.includes(tag)
			? draft.tags.filter((t) => t !== tag)
			: [...draft.tags, tag];
	}

	function publish(e: SubmitEvent) {
		e.preventDefault();
		app.createOpportunity($state.snapshot(draft));
		draft = emptyDraft();
		tab = 'events';
	}
</script>

<svelte:head><title>Кабинет куратора — Волна</title></svelte:head>

<header class="mb-5 flex flex-wrap items-center gap-4">
	<Avatar id={MY_ORG} size="lg" />
	<div class="min-w-0 flex-1">
		<p class="text-sm font-semibold text-muted">Кабинет куратора</p>
		<h1 class="flex items-center gap-1.5 text-2xl font-extrabold tracking-tight">
			{app.myOrg.name}
			{#if app.myOrg.verified}<BadgeCheck class="size-5 text-accent-text" />{/if}
		</h1>
	</div>
	<button class="btn btn-primary" onclick={() => (tab = 'create')}
		><Plus class="size-4" /> Новое мероприятие</button
	>
</header>

<section class="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
	<div class="card p-4">
		<div class="flex items-center gap-1.5 text-sm text-muted">
			<Inbox class="size-4" /> Новых заявок
		</div>
		<div class="mt-1 text-3xl font-extrabold">{pendingApps.length}</div>
	</div>
	<div class="card p-4">
		<div class="flex items-center gap-1.5 text-sm text-muted">
			<Hourglass class="size-4" /> Часов ждут
		</div>
		<div class="mt-1 text-3xl font-extrabold">{pendingHours.reduce((s, h) => s + h.hours, 0)}</div>
	</div>
	<div class="card p-4">
		<div class="flex items-center gap-1.5 text-sm text-muted">
			<Users class="size-4" /> Волонтёров
		</div>
		<div class="mt-1 text-3xl font-extrabold">{volunteers}</div>
	</div>
	<div class="card p-4">
		<div class="flex items-center gap-1.5 text-sm text-muted">
			<CircleCheck class="size-4" /> Подтверждено
		</div>
		<div class="mt-1 text-3xl font-extrabold">{verified} ч</div>
	</div>
</section>

<div class="-mx-4 mb-5 no-scrollbar flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
	{#each tabs as t (t.id)}
		<button
			class="chip {tab === t.id ? 'border-accent bg-accent-soft text-accent-text' : ''}"
			onclick={() => (tab = t.id)}
			aria-pressed={tab === t.id}
		>
			{t.label}
			{#if t.count}<span class="rounded-full bg-accent px-1.5 text-xs text-accent-ink"
					>{t.count}</span
				>{/if}
		</button>
	{/each}
</div>

{#if tab === 'applications'}
	<div class="mb-4 flex flex-wrap gap-2 text-sm">
		{#each [{ id: 'pending', label: 'Новые' }, { id: 'approved', label: 'Подтверждённые' }, { id: 'declined', label: 'Отклонённые' }, { id: 'all', label: 'Все' }] as f (f.id)}
			<button
				class="rounded-full px-3 py-1.5 font-semibold {appFilter === f.id
					? 'bg-ink text-bg'
					: 'text-muted hover:text-ink'}"
				onclick={() => (appFilter = f.id as typeof appFilter)}
			>
				{f.label}
			</button>
		{/each}
	</div>
	<ul class="space-y-3">
		{#each shownApps as a (a.id)}
			{@const p = person(a.personId)}
			{@const o = app.opportunity(a.opportunityId)}
			<li class="card p-4 sm:p-5">
				<div class="flex flex-wrap items-start gap-3">
					<Avatar id={a.personId} />
					<div class="min-w-0 flex-1">
						<div class="font-bold">{p?.name}{a.personId === 'me' ? ' (вы)' : ''}</div>
						<div class="text-xs text-muted">
							{p?.age}
							{plural(p?.age ?? 0, 'год', 'года', 'лет')} · {p?.city} · заявка: {timeAgo(
								a.createdAt
							)}
						</div>
					</div>
					{#if o}
						<span
							class="rounded-full px-3 py-1 text-xs font-semibold {toneClass[o.tone].bg} {toneClass[
								o.tone
							].text}">{o.emoji} {o.title}</span
						>
					{/if}
				</div>
				{#if a.motivation}<p class="mt-3 rounded-2xl bg-surface-2 p-3 text-sm">
						«{a.motivation}»
					</p>{/if}
				<div class="mt-3 flex flex-wrap gap-2">
					{#if a.status === 'pending'}
						<button class="btn btn-primary" onclick={() => app.decide(a, 'approved')}
							><Check class="size-4" /> Подтвердить участие</button
						>
						<button class="btn btn-ghost" onclick={() => app.decide(a, 'declined')}
							><X class="size-4" /> Отклонить</button
						>
					{:else if a.status === 'approved'}
						<span class="btn bg-pastel-green text-pastel-green-ink"
							><CircleCheck class="size-4" /> Участвует</span
						>
						{#if o && app.isCredited(a)}
							<span class="btn btn-ghost text-muted">Часы начислены</span>
						{:else if o && o.date <= day(0)}
							<button class="btn btn-soft" onclick={() => app.creditHours(a)}
								><Hourglass class="size-4" /> Начислить {o.hours} ч</button
							>
						{:else if o}
							<span class="btn btn-ghost text-muted">
								<Hourglass class="size-4" /> Часы — после {formatDate(o.date)}
							</span>
						{/if}
					{:else}
						<span class="btn btn-ghost text-muted">Отклонена</span>
						<button class="btn btn-ghost" onclick={() => app.decide(a, 'pending')}>Вернуть</button>
					{/if}
				</div>
			</li>
		{:else}
			<li class="card p-10 text-center text-muted">Заявок в этом статусе нет.</li>
		{/each}
	</ul>
{:else if tab === 'hours'}
	<p class="mb-4 text-sm text-muted">
		Волонтёры отправляют часы из своего трекера. Подтверждённые часы попадают в их портфолио.
	</p>
	<ul class="space-y-3">
		{#each app.orgHours as h (h.id)}
			{@const p = person(h.personId)}
			<li class="flex flex-wrap items-center gap-3 card p-4">
				<Avatar id={h.personId} />
				<div class="min-w-0 flex-1">
					<div class="font-bold">{p?.name}{h.personId === 'me' ? ' (вы)' : ''}</div>
					<div class="text-sm">{h.title} · <b>{h.hours} ч</b> · {formatDate(h.date)}</div>
					{#if h.note}<div class="text-xs text-muted">«{h.note}»</div>{/if}
				</div>
				{#if h.status === 'pending'}
					<div class="flex gap-2">
						<button class="btn btn-primary" onclick={() => app.verifyHours(h, true)}
							><Check class="size-4" /> Подтвердить</button
						>
						<button
							class="btn btn-ghost"
							onclick={() => app.verifyHours(h, false)}
							aria-label="Отклонить"><X class="size-4" /></button
						>
					</div>
				{:else}
					<span
						class="rounded-full px-3 py-1 text-xs font-semibold {h.status === 'verified'
							? 'bg-pastel-green text-pastel-green-ink'
							: 'bg-surface-2 text-muted'}"
					>
						{h.status === 'verified' ? 'Подтверждено' : 'Отклонено'}
					</span>
				{/if}
			</li>
		{:else}
			<li class="card p-10 text-center text-muted">Нет часов на проверке.</li>
		{/each}
	</ul>
{:else if tab === 'events'}
	<div class="grid gap-4 md:grid-cols-2">
		{#each app.orgOpportunities as o (o.id)}
			{@const count = app.orgApplications.filter((a) => a.opportunityId === o.id).length}
			<div class="flex items-center gap-4 card p-4">
				<span
					class="grid size-14 shrink-0 place-items-center rounded-2xl text-3xl {toneClass[o.tone]
						.bg}">{o.emoji}</span
				>
				<div class="min-w-0 flex-1">
					<div class="truncate font-bold">{o.title}</div>
					<div class="text-xs text-muted">
						{categories[o.category].label} · {formatDate(o.date)} · {o.date < day(0)
							? 'прошло'
							: 'скоро'}
					</div>
					<div class="mt-1 text-xs font-semibold">
						{count}
						{plural(count, 'заявка', 'заявки', 'заявок')} · {app.taken(o.id)}/{o.spots} мест
					</div>
				</div>
			</div>
		{/each}
	</div>
{:else}
	<div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
		<form class="space-y-4 card p-5 sm:p-6" onsubmit={publish}>
			<h2 class="text-lg font-bold">Конструктор мероприятия</h2>
			<div>
				<span class="label">Формат</span>
				<div class="flex flex-wrap gap-2">
					{#each Object.entries(categories) as [id, c] (id)}
						<button
							type="button"
							class="chip {draft.category === id
								? 'border-accent bg-accent-soft text-accent-text'
								: ''}"
							onclick={() => (draft.category = id as Category)}
						>
							<c.icon class="size-4" />
							{c.label}
						</button>
					{/each}
				</div>
			</div>
			<label class="block"
				><span class="label">Название</span><input
					class="input"
					required
					placeholder="Например: Субботник в сквере"
					bind:value={draft.title}
				/></label
			>
			<label class="block"
				><span class="label">Описание</span><textarea
					class="min-h-24 input"
					required
					placeholder="Что будем делать, что взять с собой"
					bind:value={draft.description}></textarea></label
			>
			<div class="grid gap-3 sm:grid-cols-2">
				<label class="block"
					><span class="label">Дата</span><input
						class="input"
						type="date"
						required
						min={day(0)}
						bind:value={draft.date}
					/></label
				>
				<label class="block"
					><span class="label">Время</span><input
						class="input"
						required
						bind:value={draft.time}
					/></label
				>
				<label class="block sm:col-span-2"
					><span class="label">Место</span><input
						class="input"
						required
						placeholder="Адрес или «Онлайн»"
						bind:value={draft.place}
					/></label
				>
				<label class="block"
					><span class="label">Мест</span><input
						class="input"
						type="number"
						min="1"
						required
						bind:value={draft.spots}
					/></label
				>
				<label class="block"
					><span class="label">Часов волонтёрам</span><input
						class="input"
						type="number"
						min="1"
						max="100"
						required
						bind:value={draft.hours}
					/></label
				>
				<label class="block sm:col-span-2"
					><span class="label">Приём заявок до</span><input
						class="input"
						type="date"
						min={day(0)}
						max={draft.date}
						bind:value={draft.deadline}
					/></label
				>
			</div>
			<div>
				<span class="label">Темы (для рекомендаций)</span>
				<div class="flex flex-wrap gap-2">
					{#each Object.entries(interests) as [id, i] (id)}
						<button
							type="button"
							class="chip {draft.tags.includes(id as Interest)
								? 'border-accent bg-accent-soft text-accent-text'
								: ''}"
							onclick={() => toggleTag(id as Interest)}
						>
							{i.emoji}
							{i.label}
						</button>
					{/each}
				</div>
			</div>
			<div class="grid gap-4 sm:grid-cols-2">
				<div>
					<span class="label">Обложка</span>
					<div class="flex flex-wrap gap-1.5">
						{#each emojis as e (e)}
							<button
								type="button"
								class="grid size-10 place-items-center rounded-xl text-xl {draft.emoji === e
									? 'bg-accent-soft ring-2 ring-accent'
									: 'bg-surface-2'}"
								onclick={() => (draft.emoji = e)}>{e}</button
							>
						{/each}
					</div>
				</div>
				<div>
					<span class="label">Цвет</span>
					<div class="flex gap-2">
						{#each tones as t (t)}
							<button
								type="button"
								class="size-10 rounded-full border-2 {toneClass[t].bg} {draft.tone === t
									? 'border-ink'
									: 'border-transparent'}"
								onclick={() => (draft.tone = t)}
								aria-label="Цвет {t}"
							></button>
						{/each}
					</div>
				</div>
			</div>
			<button class="btn w-full btn-primary" disabled={!draft.tags.length}
				>Опубликовать в ленте возможностей</button
			>
		</form>
		<div class="lg:sticky lg:top-10 lg:self-start">
			<p class="label">Так карточку увидят волонтёры</p>
			<OpportunityCard opportunity={{ ...draft, id: 'preview', orgId: MY_ORG }} preview />
		</div>
	</div>
{/if}
