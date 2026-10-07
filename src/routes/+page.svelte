<script lang="ts">
	import { Bell, ChevronDown, MapPin, Search } from '@lucide/svelte';
	import { app } from '#lib/app.svelte.ts';
	import OpportunityCard from '#lib/components/OpportunityCard.svelte';
	import InstallApp from '#lib/components/InstallApp.svelte';
	import StoriesBar from '#lib/components/StoriesBar.svelte';
	import { categories, cities } from '#lib/data.ts';
	import type { Category } from '#lib/types.ts';

	type Filter = Category | 'all' | 'saved';

	let filter = $state<Filter>('all');

	const filters: { id: Filter; label: string }[] = [
		{ id: 'all', label: 'Все' },
		...(['project', 'training', 'action', 'meeting', 'recruitment'] as Category[]).map((id) => ({
			id,
			label: categories[id].plural
		})),
		{ id: 'saved', label: 'Напомнить позже' }
	];

	const list = $derived(
		app.localUpcoming.filter((o) =>
			filter === 'saved' ? app.isReminded(o.id) : filter === 'all' || o.category === filter
		)
	);
	const firstName = $derived(app.profile.name.split(' ')[0]);
	const tip = $derived(app.aiTips[0]);
</script>

<svelte:head><title>Возможности — Волна</title></svelte:head>

<header class="mb-5 flex items-start gap-3">
	<div class="min-w-0 flex-1">
		<p class="text-sm font-semibold text-muted">Привет, {firstName} 👋</p>
		<h1 class="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">
			Чем поможем миру сегодня?
		</h1>
		<!-- Город: лента показывает мероприятия выбранного города и онлайн -->
		<label
			class="relative mt-3 inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-accent-soft py-1.5 pr-8 pl-3 text-sm font-bold text-accent-text"
		>
			<MapPin class="size-4" />
			{app.viewCity === 'all' ? 'Все города' : app.viewCity}
			<ChevronDown class="pointer-events-none absolute right-2.5 size-4" />
			<select
				class="absolute inset-0 cursor-pointer opacity-0"
				value={app.viewCity}
				onchange={(e) => app.setViewCity(e.currentTarget.value)}
				aria-label="Город"
			>
				<option value="all">Все города</option>
				{#each [...new Set([...cities, app.profile.city])] as c (c)}<option value={c}>{c}</option
					>{/each}
			</select>
		</label>
	</div>
	<!-- Поиск — иконкой в углу -->
	<a
		href="/search"
		class="btn hidden size-12 shrink-0 rounded-2xl btn-ghost p-0 lg:grid"
		aria-label="Поиск"
		title="Поиск"
	>
		<Search class="size-5" />
	</a>
</header>

<InstallApp variant="banner" />

{#if tip}
	<a
		href={tip.action?.href ?? '/notifications'}
		class="mb-6 flex items-center gap-3 rounded-3xl bg-accent-soft p-3 pr-4 transition hover:brightness-95"
	>
		<span class="grid size-10 shrink-0 place-items-center rounded-2xl bg-surface text-lg"
			>{tip.emoji}</span
		>
		<span class="min-w-0 flex-1 text-sm">
			<span class="flex items-center gap-1 text-xs font-bold text-accent-text">ИИ-помощник</span>
			<span class="line-clamp-2">{tip.text}</span>
		</span>
	</a>
{/if}

<section class="mb-6">
	<h2 class="mb-3 flex items-center gap-2 text-lg font-extrabold">Для вас</h2>
	<StoriesBar />
</section>

<div
	class="sticky top-[61px] z-20 -mx-4 mb-5 no-scrollbar flex gap-2 overflow-x-auto bg-bg/90 px-4 py-2 backdrop-blur sm:mx-0 sm:flex-wrap sm:px-0 lg:top-0"
>
	{#each filters as f (f.id)}
		<button
			class="chip {filter === f.id ? 'border-accent bg-accent text-accent-ink' : ''}"
			onclick={() => (filter = f.id)}
			aria-pressed={filter === f.id}
		>
			{#if f.id === 'saved'}<Bell class="size-4" />{/if}
			{f.label}
		</button>
	{/each}
</div>

{#if list.length}
	<div class="grid gap-4 md:grid-cols-2">
		{#each list as o (o.id)}
			<OpportunityCard opportunity={o} />
		{/each}
	</div>
{:else}
	<div class="card p-10 text-center text-muted">
		{filter === 'saved'
			? 'Нажмите «Напомнить позже» на карточке, и она появится здесь.'
			: app.viewCity !== 'all'
				? `В городе ${app.viewCity} пока нет таких мероприятий.`
				: 'Пока ничего нет в этой категории.'}
		{#if app.viewCity !== 'all'}
			<button class="mt-4 btn btn-soft" onclick={() => app.setViewCity('all')}
				>Показать все города</button
			>
		{/if}
	</div>
{/if}
