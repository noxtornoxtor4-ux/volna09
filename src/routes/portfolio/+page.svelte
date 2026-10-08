<script lang="ts">
	import { tr } from '#lib/i18n.ts';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { CircleCheck, CircleX, Hourglass, QrCode, Scale } from '@lucide/svelte';
	import { app } from '#lib/app.svelte.ts';
	import AwardShelves from '#lib/components/AwardShelves.svelte';
	import Avatar from '#lib/components/Avatar.svelte';
	import Modal from '#lib/components/Modal.svelte';
	import MyQrCode from '#lib/components/MyQrCode.svelte';
	import { toneClass } from '#lib/data.ts';
	import { formatDate, hoursLabel } from '#lib/format.ts';
	import type { HoursStatus } from '#lib/types.ts';

	type Tab = 'hours' | 'projects' | 'orgs' | 'awards' | 'requests';

	const tabs: { id: Tab; label: string }[] = [
		{ id: 'hours', label: tr('Часы') },
		{ id: 'projects', label: tr('Проекты') },
		{ id: 'orgs', label: tr('Организации') },
		{ id: 'awards', label: tr('Награды') },
		{ id: 'requests', label: tr('QR и обращения') }
	];

	const tab = $derived((page.url.searchParams.get('tab') as Tab) || 'hours');
	let appealing = $state(false);
	let appeal = $state({ opportunityId: '', text: '' });
	/** Мероприятия, по которым можно обжаловать часы: все свои заявки */
	const appealable = $derived(
		app.applications
			.filter((a) => a.personId === app.me)
			.map((a) => app.opportunity(a.opportunityId))
			.filter((o) => !!o)
	);

	function sendAppeal(e: SubmitEvent) {
		e.preventDefault();
		if (!appeal.text.trim()) return;
		const o = appeal.opportunityId ? app.opportunity(appeal.opportunityId) : undefined;
		app.createAppeal({
			opportunityId: o?.id,
			orgId: o?.orgId,
			text: appeal.text
		});
		appeal = { opportunityId: '', text: '' };
		appealing = false;
	}

	const statusView: Record<HoursStatus, { label: string; cls: string; icon: typeof CircleCheck }> =
		{
			verified: {
				label: tr('Подтверждено'),
				cls: 'bg-pastel-green text-pastel-green-ink',
				icon: CircleCheck
			},
			pending: {
				label: tr('На проверке'),
				cls: 'bg-pastel-yellow text-pastel-yellow-ink',
				icon: Hourglass
			},
			rejected: { label: tr('Отклонено'), cls: 'bg-surface-2 text-muted', icon: CircleX }
		};

	const verified = $derived(app.myHours.filter((h) => h.status === 'verified'));
	const byOrg = (orgId: string) =>
		verified.filter((h) => h.orgId === orgId).reduce((s, h) => s + h.hours, 0);
</script>

<svelte:head><title>{tr('Портфолио — Волна')}</title></svelte:head>

{#if app.isOrg}
	<div class="card p-10 text-center">
		<p class="text-lg font-bold">{tr('Портфолио ведут волонтёры')}</p>
		<p class="mt-1 text-sm text-muted">{tr('Часы волонтёров вашей организации — в кабинете.')}</p>
		<a href="/cabinet?folder=hours" class="mt-4 btn btn-primary">{tr('Открыть кабинет')}</a>
	</div>
{:else}
	<div class="mb-5 flex flex-wrap items-end justify-between gap-3">
		<div>
			<h1 class="text-2xl font-extrabold tracking-tight sm:text-3xl">{tr('Портфолио')}</h1>
			<p class="text-sm text-muted">
				{tr('Подтверждённая история волонтёрства для вуза, работы и грантов')}
			</p>
		</div>
		<a href="?tab=requests" class="btn btn-primary"><QrCode class="size-4" /> {tr('Мой QR-код')}</a>
	</div>

	<section class="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
		<div class="col-span-2 card bg-accent-soft p-5 sm:col-span-1">
			<div class="text-sm font-semibold text-accent-text">{tr('Подтверждено')}</div>
			<div class="text-4xl font-extrabold">{tr('{0} ч', app.verifiedHours)}</div>
		</div>
		<div class="card p-5">
			<div class="text-sm text-muted">{tr('На проверке')}</div>
			<div class="text-2xl font-extrabold">{tr('{0} ч', app.pendingHours)}</div>
		</div>
		<div class="card p-5">
			<div class="text-sm text-muted">{tr('Проектов')}</div>
			<div class="text-2xl font-extrabold">{app.participation.length}</div>
		</div>
		<div class="col-span-2 card p-5 sm:col-span-1">
			<div class="text-sm text-muted">{tr('Наград')}</div>
			<div class="text-2xl font-extrabold">{app.myAwards.length}</div>
		</div>
	</section>

	<div class="-mx-4 mb-5 no-scrollbar flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
		{#each tabs as t (t.id)}
			<button
				class="chip {tab === t.id ? 'border-accent bg-accent text-accent-ink' : ''}"
				onclick={() => goto(`?tab=${t.id}`, { replace: true, reset: false })}
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
					<span class="font-extrabold">{tr('+{0} ч', h.hours)}</span>
				</li>
			{:else}
				<li class="p-6 text-center text-sm text-muted">{tr('Подтверждённых часов пока нет.')}</li>
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
								>{a.role ?? tr('Волонтёр')}</span
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
				<p class="text-sm text-muted">{tr('Проекты появятся после подтверждения заявок.')}</p>
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
									{tr(
										'{0} · с {1}',
										m.role,
										formatDate(m.since, { month: 'long', year: 'numeric' })
									)}
								</div>
							</div>
						</div>
						<p class="mt-3 text-sm text-muted">{org.about}</p>
						<div class="mt-3 flex gap-2 text-xs font-semibold">
							<span class="rounded-full bg-surface-2 px-3 py-1"
								>{tr('{0} ч подтверждено', byOrg(org.id))}</span
							>
							<span class="rounded-full bg-surface-2 px-3 py-1"
								>{tr(
									'{0} мероприятий',
									app.participation.filter((p) => p.opportunity.orgId === org.id).length
								)}</span
							>
						</div>
					</a>
				{/if}
			{/each}
		</div>
	{:else if tab === 'awards'}
		<AwardShelves awards={app.myAwards} removable />
	{:else}
		<MyQrCode />

		<section class="mt-5">
			<div class="mb-3 flex items-center justify-between gap-3">
				<h2 class="font-extrabold">{tr('Обращения к модератору')}</h2>
				<button class="btn btn-soft py-2 text-sm" onclick={() => (appealing = true)}
					><Scale class="size-4" /> {tr('Обжаловать')}</button
				>
			</div>
			<p class="mb-3 text-sm text-muted">
				{tr(
					'Часы начисляет только проверенная организация — по QR-коду или в ведомости участников. Если часы не начислили или начислили неверно, напишите модератору.'
				)}
			</p>
			<ul class="space-y-2">
				{#each app.myAppeals as a (a.id)}
					<li class="card p-4">
						<div class="flex items-center justify-between gap-2 text-xs text-muted">
							<span
								>{a.opportunityId
									? app.opportunity(a.opportunityId)?.title
									: tr('Без мероприятия')}</span
							>
							<span class="font-bold"
								>{a.status === 'open'
									? tr('На рассмотрении')
									: a.status === 'resolved'
										? tr('Удовлетворено')
										: tr('Отклонено')}</span
							>
						</div>
						<p class="mt-1 text-sm">{a.text}</p>
						{#if a.response}<p class="mt-2 rounded-xl bg-surface-2 p-2.5 text-sm">
								{tr('Ответ модератора: {0}', a.response)}
							</p>{/if}
					</li>
				{/each}
			</ul>
		</section>

		<h2 class="mt-6 mb-3 font-extrabold">{tr('История начислений')}</h2>
		<ul class="space-y-2">
			{#each app.myHours as h (h.id)}
				{@const s = statusView[h.status]}
				<li class="flex items-center gap-3 card p-4">
					<Avatar id={h.orgId} />
					<div class="min-w-0 flex-1">
						<div class="truncate font-semibold">{tr('{0} · {1} ч', h.title, h.hours)}</div>
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

	<Modal bind:open={appealing} title={tr('Обращение к модератору')}>
		<form class="space-y-3" onsubmit={sendAppeal}>
			<label class="block">
				<span class="label">{tr('Мероприятие')}</span>
				<select class="input" bind:value={appeal.opportunityId}>
					<option value="">{tr('Без мероприятия')}</option>
					{#each appealable as o (o.id)}<option value={o.id}>{o.title}</option>{/each}
				</select>
			</label>
			<textarea
				class="min-h-28 input"
				maxlength="1000"
				placeholder={tr('Что произошло: например, был на мероприятии, но часы не начислили')}
				bind:value={appeal.text}></textarea>
			<button class="btn w-full btn-primary" disabled={!appeal.text.trim()}
				>{tr('Отправить')}</button
			>
		</form>
	</Modal>
{/if}
