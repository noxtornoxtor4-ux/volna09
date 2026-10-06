<script lang="ts">
	import { Bell, Search, Sparkles } from '@lucide/svelte';
	import { app } from '#lib/app.svelte.ts';
	import OpportunityCard from '#lib/components/OpportunityCard.svelte';
	import { categories, interests, toneClass } from '#lib/data.ts';
	import { formatDate } from '#lib/format.ts';
	import type { Category } from '#lib/types.ts';

	type Filter = Category | 'all' | 'saved';

	let filter = $state<Filter>('all');
	let query = $state('');

	const filters: { id: Filter; label: string }[] = [
		{ id: 'all', label: 'Все' },
		...(['project', 'training', 'action', 'meeting', 'recruitment'] as Category[]).map((id) => ({
			id,
			label: categories[id].plural
		})),
		{ id: 'saved', label: 'Напомнить позже' }
	];

	const list = $derived.by(() => {
		const q = query.trim().toLowerCase();
		return app.upcoming.filter((o) => {
			if (filter === 'saved' && !app.isReminded(o.id)) return false;
			if (filter !== 'all' && filter !== 'saved' && o.category !== filter) return false;
			if (!q) return true;
			const org = app.org(o.orgId)?.name ?? '';
			return [o.title, o.description, o.place, org].some((s) => s.toLowerCase().includes(q));
		});
	});

	const firstName = $derived(app.profile.name.split(' ')[0]);
</script>

<svelte:head><title>Возможности — Волна</title></svelte:head>

<header class="mb-6">
	<p class="text-sm font-semibold text-muted">Привет, {firstName} 👋</p>
	<h1 class="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">
		Чем поможем миру на этой неделе?
	</h1>
</header>

<label class="relative mb-4 block">
	<Search class="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted" />
	<input
		class="input py-3.5 pl-12"
		type="search"
		placeholder="Поиск: субботник, собаки, тренинг…"
		bind:value={query}
	/>
</label>

<div class="-mx-4 mb-8 no-scrollbar flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
	{#each filters as f (f.id)}
		<button
			class="chip {filter === f.id ? 'border-accent bg-accent-soft text-accent-text' : ''}"
			onclick={() => (filter = f.id)}
			aria-pressed={filter === f.id}
		>
			{#if f.id === 'saved'}<Bell class="size-4" />{/if}
			{f.label}
		</button>
	{/each}
</div>

{#if filter === 'all' && !query && app.recommendations.length}
	<section class="mb-10">
		<div class="mb-3 flex items-end justify-between gap-3">
			<h2 class="flex items-center gap-2 text-lg font-bold">
				<Sparkles class="size-5 text-accent-text" /> Для вас
			</h2>
			<a href="/settings" class="text-sm font-semibold text-muted hover:text-ink">
				по интересам: {app.profile.interests.map((i) => interests[i].emoji).join(' ')}
			</a>
		</div>
		<div class="-mx-4 no-scrollbar flex snap-x gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
			{#each app.recommendations as o (o.id)}
				<a
					href="#{o.id}"
					class="flex w-64 shrink-0 snap-start items-center gap-3 card p-3 transition hover:border-accent"
				>
					<span
						class="grid size-14 shrink-0 place-items-center rounded-2xl text-3xl {toneClass[o.tone]
							.bg}">{o.emoji}</span
					>
					<span class="min-w-0">
						<span class="line-clamp-2 text-sm leading-snug font-bold">{o.title}</span>
						<span class="mt-0.5 block text-xs text-muted"
							>{formatDate(o.date)} · {categories[o.category].label}</span
						>
					</span>
				</a>
			{/each}
		</div>
	</section>
{/if}

<section>
	<h2 class="mb-3 text-lg font-bold">
		{filter === 'saved'
			? 'Отложенные'
			: filter === 'all'
				? 'Все возможности'
				: categories[filter].plural}
		<span class="text-muted">· {list.length}</span>
	</h2>
	{#if list.length}
		<div class="grid gap-4 md:grid-cols-2">
			{#each list as o (o.id)}
				<div id={o.id} class="scroll-mt-24"><OpportunityCard opportunity={o} /></div>
			{/each}
		</div>
	{:else}
		<div class="card p-10 text-center text-muted">
			{filter === 'saved'
				? 'Нажмите «Напомнить позже» на карточке, и она появится здесь.'
				: 'Ничего не нашлось. Попробуйте другой запрос.'}
		</div>
	{/if}
</section>
