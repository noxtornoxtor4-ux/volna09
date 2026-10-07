<script lang="ts">
	import { tr } from '#lib/i18n.ts';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import {
		Check,
		ChevronDown,
		ChevronLeft,
		CircleCheck,
		Folder,
		Hourglass,
		Plus,
		Rocket,
		Users,
		X
	} from '@lucide/svelte';
	import { app } from '#lib/app.svelte.ts';
	import Avatar from '#lib/components/Avatar.svelte';
	import Modal from '#lib/components/Modal.svelte';
	import PromoteSheet from '#lib/components/PromoteSheet.svelte';
	import { categories, day, toneClass } from '#lib/data.ts';
	import { formatDate, personMeta, plural, timeAgo } from '#lib/format.ts';
	import type { ApplicationStatus } from '#lib/types.ts';

	type FolderId = 'applications' | 'volunteers' | 'hours';

	const folder = $derived(page.url.searchParams.get('folder') as FolderId | null);
	let appFilter = $state<ApplicationStatus | 'all'>('pending');
	let expanded = $state<string | null>(null);
	let promoting = $state<string | null>(null);
	let choosingPromo = $state(false);

	const pendingApps = $derived(app.orgApplications.filter((a) => a.status === 'pending'));
	const pendingHours = $derived(app.orgHours.filter((h) => h.status === 'pending'));
	const shownApps = $derived(
		appFilter === 'all'
			? app.orgApplications
			: app.orgApplications.filter((a) => a.status === appFilter)
	);
	const today = day(0);

	const folders = $derived([
		{
			id: 'applications' as FolderId,
			label: tr('Заявки'),
			count: pendingApps.length,
			hint: tr('новых'),
			tone: 'blue' as const
		},
		{
			id: 'volunteers' as FolderId,
			label: tr('Волонтёры'),
			count: app.orgVolunteers.length,
			hint: tr('в команде'),
			tone: 'green' as const
		},
		{
			id: 'hours' as FolderId,
			label: tr('Подтверждение часов'),
			count: pendingHours.length,
			hint: tr('ждут'),
			tone: 'yellow' as const
		}
	]);
	const folderInfo = $derived(folders.find((f) => f.id === folder));

	const person = (id: string) => app.person(id);
	const answerText = (v: string | string[]) => (Array.isArray(v) ? v.join(', ') : v);
</script>

<svelte:head><title>{tr('Кабинет организации — Волна')}</title></svelte:head>

{#if !app.isOrg}
	<div class="card p-10 text-center">
		<p class="text-lg font-bold">{tr('Кабинет доступен организациям')}</p>
		<a href="/settings?s=accounts" class="mt-4 btn btn-primary"
			>{tr('Переключиться на аккаунт организации')}</a
		>
	</div>
{:else}
	<header class="mb-5 flex items-center gap-3">
		<Avatar id={app.myOrgId} size="lg" />
		<div class="min-w-0 flex-1">
			<p class="text-sm font-semibold text-muted">{tr('Кабинет организации')}</p>
			<h1 class="truncate text-xl font-extrabold tracking-tight sm:text-2xl">
				{app.orgProfile.name}
			</h1>
		</div>
		<button class="btn hidden btn-ghost sm:inline-flex" onclick={() => (choosingPromo = true)}
			><Rocket class="size-4" /> {tr('Продвижение')}</button
		>
		<!-- Кнопка с плюсиком наверху — публикация мероприятия -->
		<a
			href="/cabinet/new"
			class="btn size-12 shrink-0 rounded-2xl btn-primary p-0 shadow-lg shadow-accent/40"
			aria-label={tr('Опубликовать мероприятие')}
			title={tr('Опубликовать мероприятие')}
		>
			<Plus class="size-6" />
		</a>
	</header>

	{#if !folder}
		<!-- Папки -->
		<div class="mb-6 grid grid-cols-3 gap-2 sm:gap-3">
			{#each folders as f (f.id)}
				<a href="?folder={f.id}" class="group relative block pt-3">
					<span
						class="absolute top-0 left-3 h-5 w-10 rounded-t-xl sm:left-4 sm:w-20 sm:rounded-t-2xl {toneClass[
							f.tone
						].bg}"
					></span>
					<span
						class="relative flex h-full flex-col rounded-2xl rounded-tl-none p-3 transition group-hover:-translate-y-0.5 group-hover:shadow-lg sm:rounded-3xl sm:p-5 {toneClass[
							f.tone
						].bg}"
					>
						<Folder class="size-5 sm:size-6 {toneClass[f.tone].text}" />
						<span class="mt-2 text-[13px] leading-tight font-extrabold sm:mt-3 sm:text-base"
							>{f.label}</span
						>
						<span class="text-sm text-muted"
							><b class="text-2xl text-ink">{f.count}</b> {f.hint}</span
						>
					</span>
				</a>
			{/each}
		</div>

		<div class="mb-3 flex items-center justify-between">
			<h2 class="text-lg font-extrabold">{tr('Мои публикации')}</h2>
			<button class="btn btn-ghost py-2 text-sm sm:hidden" onclick={() => (choosingPromo = true)}
				><Rocket class="size-4" /> {tr('Продвижение')}</button
			>
		</div>
		<div class="grid gap-3 md:grid-cols-2">
			{#each app.orgOpportunities as o (o.id)}
				{@const count = app.orgApplications.filter((a) => a.opportunityId === o.id).length}
				<div class="flex items-center gap-3 card p-3">
					<a href="/o?id={o.id}" class="flex min-w-0 flex-1 items-center gap-3">
						<span
							class="grid size-14 shrink-0 place-items-center overflow-hidden rounded-2xl text-3xl {toneClass[
								o.tone
							].bg}"
						>
							{#if o.poster}<img
									src={o.poster}
									alt=""
									class="size-full object-cover"
								/>{:else}{o.emoji}{/if}
						</span>
						<div class="min-w-0">
							<div class="truncate font-bold">{o.title}</div>
							<div class="text-xs text-muted">
								{categories[o.category].label} · {formatDate(o.date)} · {o.date < today
									? tr('прошло')
									: tr('скоро')}
							</div>
							<div class="mt-1 text-xs font-semibold">
								{tr(
									'{0} {1} · {2}/{3} мест',
									count,
									plural(count, 'заявка', 'заявки', 'заявок'),
									app.taken(o.id),
									o.spots
								)}
							</div>
						</div>
					</a>
					{#if o.date >= today}
						<button
							class="btn shrink-0 px-3 {app.isPromoted(o) ? 'btn-soft' : 'btn-ghost'}"
							onclick={() => (promoting = o.id)}
							aria-label={tr('Продвигать')}
							title={app.isPromoted(o) ? tr('Продвигается') : tr('Продвигать')}
						>
							<Rocket class="size-4" />
						</button>
					{/if}
				</div>
			{:else}
				<a
					href="/cabinet/new"
					class="flex items-center gap-3 card border-dashed p-5 text-muted transition hover:border-accent md:col-span-2"
				>
					<span class="grid size-12 place-items-center rounded-2xl bg-accent text-accent-ink"
						><Plus class="size-6" /></span
					>
					<span
						><b class="block text-ink">{tr('Пока нет публикаций')}</b>{tr(
							'Нажмите «+», чтобы опубликовать первое мероприятие'
						)}</span
					>
				</a>
			{/each}
		</div>
	{:else}
		<a href="/cabinet" class="mb-4 btn btn-ghost"
			><ChevronLeft class="size-4" /> {tr('Все папки')}</a
		>
		<h2 class="mb-4 flex items-center gap-2 text-xl font-extrabold">
			<Folder class="size-6 text-accent-text" />
			{folderInfo?.label}
		</h2>

		{#if folder === 'applications'}
			<div class="mb-4 no-scrollbar flex gap-2 overflow-x-auto text-sm">
				{#each [{ id: 'pending', label: tr('Новые') }, { id: 'approved', label: tr('Подтверждённые') }, { id: 'declined', label: tr('Отклонённые') }, { id: 'all', label: tr('Все') }] as f (f.id)}
					<button
						class="chip {appFilter === f.id ? 'border-accent bg-accent text-accent-ink' : ''}"
						onclick={() => (appFilter = f.id as typeof appFilter)}>{f.label}</button
					>
				{/each}
			</div>
			<ul class="space-y-3">
				{#each shownApps as a (a.id)}
					{@const p = person(a.personId)}
					{@const o = app.opportunity(a.opportunityId)}
					{@const answers = Object.entries(a.answers)}
					<li class="card p-4">
						<div class="flex flex-wrap items-center gap-3">
							<a href="/u?id={a.personId}"><Avatar id={a.personId} /></a>
							<div class="min-w-0 flex-1">
								<div class="font-bold">{p?.name}</div>
								<div class="text-xs text-muted">
									{[personMeta(p?.age ?? 0, p?.city ?? ''), timeAgo(a.createdAt)]
										.filter(Boolean)
										.join(' · ')}
								</div>
							</div>
							{#if o}<span
									class="rounded-full px-3 py-1 text-xs font-semibold {toneClass[o.tone]
										.bg} {toneClass[o.tone].text}">{o.emoji} {o.title}</span
								>{/if}
						</div>
						{#if answers.length}
							<button
								class="mt-3 flex items-center gap-1 text-sm font-semibold text-accent-text"
								onclick={() => (expanded = expanded === a.id ? null : a.id)}
							>
								{tr('Анкета')}
								<ChevronDown class="size-4 transition {expanded === a.id ? 'rotate-180' : ''}" />
							</button>
							{#if expanded === a.id}
								<dl class="mt-2 space-y-2 rounded-2xl bg-surface-2 p-3 text-sm">
									{#each answers as [qid, value] (qid)}
										{@const q = o?.questions.find((x) => x.id === qid)}
										<div>
											<dt class="text-xs text-muted">{q?.label ?? qid}</dt>
											<dd class="font-semibold">{answerText(value) || '—'}</dd>
										</div>
									{/each}
								</dl>
							{/if}
						{/if}
						<div class="mt-3 flex flex-wrap gap-2">
							{#if a.status === 'pending'}
								<button class="btn btn-primary" onclick={() => app.decide(a, 'approved')}
									><Check class="size-4" /> {tr('Подтвердить участие')}</button
								>
								<button class="btn btn-ghost" onclick={() => app.decide(a, 'declined')}
									><X class="size-4" /> {tr('Отклонить')}</button
								>
							{:else if a.status === 'approved'}
								<span class="btn bg-pastel-green text-pastel-green-ink"
									><CircleCheck class="size-4" /> {tr('Участвует')}</span
								>
								{#if o && app.isCredited(a)}
									<span class="btn btn-ghost text-muted">{tr('Часы начислены')}</span>
								{:else if o && o.date <= today}
									<button class="btn btn-soft" onclick={() => app.creditHours(a)}
										><Hourglass class="size-4" /> {tr('Начислить {0} ч', o.hours)}</button
									>
								{:else if o}
									<span class="btn btn-ghost text-muted"
										><Hourglass class="size-4" /> {tr('Часы — после {0}', formatDate(o.date))}</span
									>
								{/if}
							{:else}
								<span class="btn btn-ghost text-muted">{tr('Отклонена')}</span>
								<button class="btn btn-ghost" onclick={() => app.decide(a, 'pending')}
									>{tr('Вернуть')}</button
								>
							{/if}
						</div>
					</li>
				{:else}
					<li class="card p-10 text-center text-muted">{tr('Заявок в этом статусе нет.')}</li>
				{/each}
			</ul>
		{:else if folder === 'volunteers'}
			<ul class="divide-y divide-line card">
				{#each app.orgVolunteers as v (v.personId)}
					{@const p = person(v.personId)}
					<li>
						<a
							href="/u?id={v.personId}"
							class="flex items-center gap-3 p-4 transition hover:bg-surface-2"
						>
							<Avatar id={v.personId} size="lg" />
							<div class="min-w-0 flex-1">
								<div class="truncate font-bold">{p?.name}</div>
								<div class="text-xs text-muted">
									{personMeta(p?.age ?? 0, p?.city ?? '')}
								</div>
								<div class="mt-1.5 flex flex-wrap gap-1.5 text-xs font-semibold">
									<span class="rounded-full bg-pastel-green px-2.5 py-0.5 text-pastel-green-ink"
										>{tr(
											'{0} {1} посещено',
											v.attended,
											plural(v.attended, 'мероприятие', 'мероприятия', 'мероприятий')
										)}</span
									>
									{#if v.upcoming}<span
											class="rounded-full bg-pastel-blue px-2.5 py-0.5 text-pastel-blue-ink"
											>{tr('{0} впереди', v.upcoming)}</span
										>{/if}
									<span class="rounded-full bg-surface-2 px-2.5 py-0.5"
										>{tr('{0} ч подтверждено', v.hours)}</span
									>
								</div>
							</div>
						</a>
					</li>
				{:else}
					<li class="p-10 text-center text-muted">{tr('Пока нет волонтёров.')}</li>
				{/each}
			</ul>
		{:else}
			<p class="mb-4 text-sm text-muted">
				{tr(
					'Волонтёры отправляют заявки на подтверждение часов из портфолио. Подтверждённые часы сразу появятся у них в профиле.'
				)}
			</p>
			<ul class="space-y-3">
				{#each app.orgHours as h (h.id)}
					<li class="flex flex-wrap items-center gap-3 card p-4">
						<Avatar id={h.personId} />
						<div class="min-w-0 flex-1">
							<div class="font-bold">{person(h.personId)?.name}</div>
							<div class="text-sm">
								{h.title} · <b>{tr('{0} ч', h.hours)}</b> · {formatDate(h.date)}
							</div>
							{#if h.note}<div class="text-xs text-muted">«{h.note}»</div>{/if}
						</div>
						{#if h.status === 'pending'}
							<div class="flex gap-2">
								<button class="btn btn-primary" onclick={() => app.verifyHours(h, true)}
									><Check class="size-4" /> {tr('Подтвердить')}</button
								>
								<button
									class="btn btn-ghost"
									onclick={() => app.verifyHours(h, false)}
									aria-label={tr('Отклонить')}><X class="size-4" /></button
								>
							</div>
						{:else}
							<span
								class="rounded-full px-3 py-1 text-xs font-semibold {h.status === 'verified'
									? 'bg-pastel-green text-pastel-green-ink'
									: 'bg-surface-2 text-muted'}"
							>
								{h.status === 'verified' ? tr('Подтверждено') : tr('Отклонено')}
							</span>
						{/if}
					</li>
				{:else}
					<li class="card p-10 text-center text-muted">{tr('Нет заявок на подтверждение.')}</li>
				{/each}
			</ul>
		{/if}
	{/if}

	<Modal bind:open={choosingPromo} title={tr('Что продвигаем?')}>
		<ul class="space-y-2">
			{#each app.orgOpportunities.filter((o) => o.date >= today) as o (o.id)}
				<li>
					<button
						class="flex w-full items-center gap-3 rounded-2xl p-2 text-left transition hover:bg-surface-2"
						onclick={() => {
							choosingPromo = false;
							promoting = o.id;
						}}
					>
						<span class="grid size-11 place-items-center rounded-xl text-xl {toneClass[o.tone].bg}"
							>{o.emoji}</span
						>
						<span class="min-w-0 flex-1">
							<span class="block truncate font-semibold">{o.title}</span>
							<span class="text-xs text-muted"
								>{app.isPromoted(o)
									? tr('продвигается до {0}', formatDate(o.promotedUntil!))
									: formatDate(o.date)}</span
							>
						</span>
						<Users class="size-4 text-muted" /><span class="text-xs">{app.taken(o.id)}</span>
					</button>
				</li>
			{:else}
				<li class="text-sm text-muted">
					{tr('Нет предстоящих мероприятий.')}
					<button class="font-semibold text-accent-text" onclick={() => goto('/cabinet/new')}
						>{tr('Создать')}</button
					>
				</li>
			{/each}
		</ul>
	</Modal>
	<PromoteSheet bind:opportunityId={promoting} />
{/if}
