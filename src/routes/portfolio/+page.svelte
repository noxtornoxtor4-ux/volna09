<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { CircleCheck, CircleX, Hourglass, Plus } from '@lucide/svelte';
	import { app } from '#lib/app.svelte.ts';
	import AwardShelves from '#lib/components/AwardShelves.svelte';
	import Avatar from '#lib/components/Avatar.svelte';
	import LogHoursForm from '#lib/components/LogHoursForm.svelte';
	import Modal from '#lib/components/Modal.svelte';
	import { toneClass } from '#lib/data.ts';
	import { formatDate, hoursLabel } from '#lib/format.ts';
	import type { HoursStatus } from '#lib/types.ts';

	type Tab = 'hours' | 'projects' | 'orgs' | 'awards' | 'requests';

	const tabs: { id: Tab; label: string }[] = [
		{ id: 'hours', label: 'Часы' },
		{ id: 'projects', label: 'Проекты' },
		{ id: 'orgs', label: 'Организации' },
		{ id: 'awards', label: 'Награды' },
		{ id: 'requests', label: 'Подтверждение часов' }
	];

	const tab = $derived((page.url.searchParams.get('tab') as Tab) || 'hours');
	let requesting = $state(false);

	const statusView: Record<HoursStatus, { label: string; cls: string; icon: typeof CircleCheck }> =
		{
			verified: {
				label: 'Подтверждено',
				cls: 'bg-pastel-green text-pastel-green-ink',
				icon: CircleCheck
			},
			pending: {
				label: 'На проверке',
				cls: 'bg-pastel-yellow text-pastel-yellow-ink',
				icon: Hourglass
			},
			rejected: { label: 'Отклонено', cls: 'bg-surface-2 text-muted', icon: CircleX }
		};

	const verified = $derived(app.myHours.filter((h) => h.status === 'verified'));
	const byOrg = (orgId: string) =>
		verified.filter((h) => h.orgId === orgId).reduce((s, h) => s + h.hours, 0);
</script>

<svelte:head><title>Портфолио — Волна</title></svelte:head>

{#if app.isOrg}
	<div class="card p-10 text-center">
		<p class="text-lg font-bold">Портфолио ведут волонтёры</p>
		<p class="mt-1 text-sm text-muted">Часы волонтёров вашей организации — в кабинете.</p>
		<a href="/cabinet?folder=hours" class="mt-4 btn btn-primary">Открыть кабинет</a>
	</div>
{:else}
	<div class="mb-5 flex flex-wrap items-end justify-between gap-3">
		<div>
			<h1 class="text-2xl font-extrabold tracking-tight sm:text-3xl">Портфолио</h1>
			<p class="text-sm text-muted">
				Подтверждённая история волонтёрства для вуза, работы и грантов
			</p>
		</div>
		<button class="btn btn-primary" onclick={() => (requesting = true)}
			><Plus class="size-4" /> Заявка на часы</button
		>
	</div>

	<section class="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
		<div class="col-span-2 card bg-accent-soft p-5 sm:col-span-1">
			<div class="text-sm font-semibold text-accent-text">Подтверждено</div>
			<div class="text-4xl font-extrabold">{app.verifiedHours} ч</div>
		</div>
		<div class="card p-5">
			<div class="text-sm text-muted">На проверке</div>
			<div class="text-2xl font-extrabold">{app.pendingHours} ч</div>
		</div>
		<div class="card p-5">
			<div class="text-sm text-muted">Проектов</div>
			<div class="text-2xl font-extrabold">{app.participation.length}</div>
		</div>
		<div class="col-span-2 card p-5 sm:col-span-1">
			<div class="text-sm text-muted">Наград</div>
			<div class="text-2xl font-extrabold">{app.myAwards.length}</div>
		</div>
	</section>

	<div class="-mx-4 mb-5 no-scrollbar flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
		{#each tabs as t (t.id)}
			<button
				class="chip {tab === t.id ? 'border-accent bg-accent text-accent-ink' : ''}"
				onclick={() => goto(`?tab=${t.id}`, { replaceState: true, reset: false })}
			>
				{t.label}
			</button>
		{/each}
	</div>

	{#if tab === 'hours'}
		<ul class="divide-y divide-line card">
			{#each verified as h (h.id)}
				{@const org = app.org(h.orgId)}
				<li class="flex items-center gap-3 p-4">
					<span
						class="grid size-11 shrink-0 place-items-center rounded-2xl text-xl {org
							? toneClass[org.tone].bg
							: ''}">{org?.emoji}</span
					>
					<div class="min-w-0 flex-1">
						<div class="truncate font-semibold">{h.title}</div>
						<div class="truncate text-xs text-muted">
							{formatDate(h.date, { day: 'numeric', month: 'long', year: 'numeric' })} · {org?.name}
						</div>
					</div>
					<span class="font-extrabold">+{h.hours} ч</span>
				</li>
			{:else}
				<li class="p-6 text-center text-sm text-muted">Подтверждённых часов пока нет.</li>
			{/each}
		</ul>
	{:else if tab === 'projects'}
		<div class="grid gap-3 md:grid-cols-2">
			{#each app.participation as { opportunity: o, application: a } (a.id)}
				<a href="/o?id={o.id}" class="flex gap-4 card p-4 transition hover:border-accent">
					<span
						class="grid size-16 shrink-0 place-items-center rounded-3xl text-3xl {toneClass[o.tone]
							.bg}">{o.emoji}</span
					>
					<div class="min-w-0 flex-1">
						<div class="font-bold">{o.title}</div>
						<div class="text-xs text-muted">{app.org(o.orgId)?.name}</div>
						<div class="mt-2 flex flex-wrap gap-1.5 text-xs">
							<span class="rounded-full bg-surface-2 px-2.5 py-1 font-semibold"
								>{a.role ?? 'Волонтёр'}</span
							>
							<span class="rounded-full bg-surface-2 px-2.5 py-1"
								>{formatDate(o.date, { day: 'numeric', month: 'short', year: 'numeric' })}</span
							>
							<span class="rounded-full bg-surface-2 px-2.5 py-1">{hoursLabel(o.hours)}</span>
						</div>
						<p class="mt-2 line-clamp-2 text-sm text-muted">{o.description}</p>
					</div>
				</a>
			{:else}
				<p class="text-sm text-muted">Проекты появятся после подтверждения заявок.</p>
			{/each}
		</div>
	{:else if tab === 'orgs'}
		<div class="grid gap-3 md:grid-cols-2">
			{#each app.memberships as m (m.orgId)}
				{@const org = app.org(m.orgId)}
				{#if org}
					<a href="/u?id={org.id}" class="card p-4 transition hover:border-accent">
						<div class="flex items-center gap-3">
							<Avatar id={org.id} size="lg" />
							<div class="min-w-0">
								<div class="font-bold">{org.name}</div>
								<div class="text-xs text-muted">
									{m.role} · с {formatDate(m.since, { month: 'long', year: 'numeric' })}
								</div>
							</div>
						</div>
						<p class="mt-3 text-sm text-muted">{org.about}</p>
						<div class="mt-3 flex gap-2 text-xs font-semibold">
							<span class="rounded-full bg-surface-2 px-3 py-1">{byOrg(org.id)} ч подтверждено</span
							>
							<span class="rounded-full bg-surface-2 px-3 py-1"
								>{app.participation.filter((p) => p.opportunity.orgId === org.id).length} мероприятий</span
							>
						</div>
					</a>
				{/if}
			{/each}
		</div>
	{:else if tab === 'awards'}
		<AwardShelves awards={app.myAwards} removable />
	{:else}
		<p class="mb-4 text-sm text-muted">
			Отправьте организации заявку на подтверждение часов. После проверки куратором часы попадут в
			портфолио.
		</p>
		<ul class="space-y-2">
			{#each app.myHours as h (h.id)}
				{@const s = statusView[h.status]}
				<li class="flex items-center gap-3 card p-4">
					<Avatar id={h.orgId} />
					<div class="min-w-0 flex-1">
						<div class="truncate font-semibold">{h.title} · {h.hours} ч</div>
						<div class="truncate text-xs text-muted">
							{app.org(h.orgId)?.name} · {formatDate(h.date)}
						</div>
					</div>
					<span
						class="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold {s.cls}"
						><s.icon class="size-3.5" /><span class="hidden sm:inline">{s.label}</span></span
					>
				</li>
			{/each}
		</ul>
	{/if}

	<Modal bind:open={requesting} title="Заявка на подтверждение часов">
		<LogHoursForm ondone={() => (requesting = false)} />
	</Modal>
{/if}
