<script lang="ts">
	import { tr } from '#lib/i18n.ts';
	import { BadgeCheck, ChevronRight, Search, X } from '@lucide/svelte';
	import { app } from '#lib/app.svelte.ts';
	import Avatar from '#lib/components/Avatar.svelte';
	import { ME, categories, toneClass } from '#lib/data.ts';
	import { formatDate } from '#lib/format.ts';

	type Tab = 'all' | 'people' | 'orgs' | 'events';

	let query = $state('');
	let tab = $state<Tab>('all');
	const results = $derived(app.search(query));

	const tabs = $derived<{ id: Tab; label: string; count: number }[]>([
		{
			id: 'all',
			label: tr('Всё'),
			count: results.people.length + results.orgs.length + results.opportunities.length
		},
		{ id: 'people', label: tr('Волонтёры'), count: results.people.length },
		{ id: 'orgs', label: tr('Организации'), count: results.orgs.length },
		{ id: 'events', label: tr('Мероприятия'), count: results.opportunities.length }
	]);
	const show = (section: Tab) => tab === 'all' || tab === section;
</script>

<svelte:head><title>{tr('Поиск — Волна')}</title></svelte:head>

<div class="mx-auto max-w-2xl">
	<label class="relative mb-4 block">
		<Search
			class="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted"
		/>
		<!-- svelte-ignore a11y_autofocus -->
		<input
			class="input rounded-3xl py-4 pr-12 pl-12 text-base"
			type="search"
			autofocus
			placeholder={tr('Волонтёры, организации, мероприятия…')}
			bind:value={query}
		/>
		{#if query}
			<button
				class="absolute top-1/2 right-3 grid size-8 -translate-y-1/2 place-items-center rounded-full text-muted hover:bg-surface-2"
				onclick={() => (query = '')}
				aria-label={tr('Очистить')}><X class="size-4" /></button
			>
		{/if}
	</label>

	<div class="-mx-4 mb-5 no-scrollbar flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
		{#each tabs as t (t.id)}
			<button
				class="chip {tab === t.id ? 'border-accent bg-accent text-accent-ink' : ''}"
				onclick={() => (tab = t.id)}
			>
				{t.label} <span class="opacity-60">{t.count}</span>
			</button>
		{/each}
	</div>

	{#if show('people') && results.people.length}
		<section class="mb-6">
			<h2 class="mb-2 text-sm font-bold text-muted">{tr('Волонтёры')}</h2>
			<ul class="divide-y divide-line card">
				{#each results.people as p (p.id)}
					<li class="flex items-center gap-3 p-3">
						<a href="/u?id={p.id}" class="flex min-w-0 flex-1 items-center gap-3">
							<Avatar id={p.id} />
							<div class="min-w-0">
								<div class="truncate font-bold">{p.name}</div>
								<div class="truncate text-xs text-muted">
									{tr(
										'{0} лет · {1} · {2} ч · {3}',
										p.age,
										tr(p.city),
										app.verifiedHoursOf(p.id),
										p.bio
									)}
								</div>
							</div>
						</a>
						{#if !app.isOrg && p.id !== ME}
							<button
								class="btn py-2 text-xs {app.isFollowing(p.id) ? 'btn-ghost' : 'btn-soft'}"
								onclick={() => app.toggleFollow(p.id)}
							>
								{app.isFollowing(p.id) ? tr('Вы подписаны') : tr('Подписаться')}
							</button>
						{/if}
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	{#if show('orgs') && results.orgs.length}
		<section class="mb-6">
			<h2 class="mb-2 text-sm font-bold text-muted">{tr('Организации')}</h2>
			<ul class="divide-y divide-line card">
				{#each results.orgs as org (org.id)}
					<li>
						<a
							href="/u?id={org.id}"
							class="flex items-center gap-3 p-3 transition hover:bg-surface-2"
						>
							<Avatar id={org.id} />
							<div class="min-w-0 flex-1">
								<div class="flex items-center gap-1 truncate font-bold">
									{org.name}{#if org.verified}<BadgeCheck
											class="size-4 shrink-0 text-accent-text"
										/>{/if}
								</div>
								<div class="truncate text-xs text-muted">
									{tr('{0} подписчиков · {1}', app.followersCount(org.id), org.about)}
								</div>
							</div>
							<ChevronRight class="size-5 text-muted" />
						</a>
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	{#if show('events') && results.opportunities.length}
		<section class="mb-6">
			<h2 class="mb-2 text-sm font-bold text-muted">{tr('Мероприятия и проекты')}</h2>
			<ul class="space-y-2">
				{#each results.opportunities as o (o.id)}
					<li>
						<a
							href="/o?id={o.id}"
							class="flex items-center gap-3 card p-3 transition hover:border-accent"
						>
							<span
								class="grid size-12 shrink-0 place-items-center rounded-2xl text-2xl {toneClass[
									o.tone
								].bg}">{o.emoji}</span
							>
							<div class="min-w-0 flex-1">
								<div class="truncate font-bold">{o.title}</div>
								<div class="truncate text-xs text-muted">
									{categories[o.category].label} · {formatDate(o.date)} · {app.org(o.orgId)?.name}
								</div>
							</div>
						</a>
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	{#if tabs[0].count === 0}
		<div class="card p-10 text-center text-muted">
			{tr('По запросу «{0}» ничего не нашлось.', query)}
		</div>
	{/if}
</div>
