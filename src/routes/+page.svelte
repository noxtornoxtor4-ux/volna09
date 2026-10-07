<script lang="ts">
	import { tr } from '#lib/i18n.ts';
	import { Bell, ChevronDown, MapPin, Search } from '@lucide/svelte';
	import { app } from '#lib/app.svelte.ts';
	import OpportunityCard from '#lib/components/OpportunityCard.svelte';
	import InstallApp from '#lib/components/InstallApp.svelte';
	import Logo from '#lib/components/Logo.svelte';
	import StoriesBar from '#lib/components/StoriesBar.svelte';
	import Wordmark from '#lib/components/Wordmark.svelte';
	import { categories, cities } from '#lib/data.ts';
	import type { Category } from '#lib/types.ts';

	type Filter = Category | 'all' | 'saved';

	let filter = $state<Filter>('all');

	const filters: { id: Filter; label: string }[] = [
		{ id: 'all', label: tr('Все') },
		...(['project', 'training', 'action', 'meeting', 'recruitment'] as Category[]).map((id) => ({
			id,
			label: categories[id].plural
		})),
		{ id: 'saved', label: tr('Напомнить позже') }
	];

	const list = $derived(
		app.localUpcoming.filter((o) =>
			filter === 'saved' ? app.isReminded(o.id) : filter === 'all' || o.category === filter
		)
	);
	const firstName = $derived(app.profile.name.split(' ')[0]);
</script>

<svelte:head><title>{tr('Возможности — Волна')}</title></svelte:head>

<!-- Фирменный логотип в самом верху раздела «Возможности» -->
<div class="mb-5 flex items-center gap-3">
	<Logo size={44} name={false} />
	<Wordmark class="h-9 w-auto sm:h-11" />
</div>

<header class="mb-5 flex items-start gap-3">
	<div class="min-w-0 flex-1">
		<p class="text-sm font-semibold text-muted">{tr('Привет, {0} 👋', firstName)}</p>
		<h1 class="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">
			{tr('Чем поможем миру сегодня?')}
		</h1>
		<!-- Город: лента показывает мероприятия выбранного города и онлайн -->
		<label
			class="relative mt-3 inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-accent-soft py-1.5 pr-8 pl-3 text-sm font-bold text-accent-text"
		>
			<MapPin class="size-4" />
			{app.viewCity === 'all' ? tr('Все города') : tr(app.viewCity)}
			<ChevronDown class="pointer-events-none absolute right-2.5 size-4" />
			<select
				class="absolute inset-0 cursor-pointer opacity-0"
				value={app.viewCity}
				onchange={(e) => app.setViewCity(e.currentTarget.value)}
				aria-label={tr('Город')}
			>
				<option value="all">{tr('Все города')}</option>
				{#each [...new Set([...cities, app.profile.city])] as c (c)}<option value={c}
						>{tr(c)}</option
					>{/each}
			</select>
		</label>
	</div>
	<!-- Поиск — иконкой в углу -->
	<a
		href="/search"
		class="btn hidden size-12 shrink-0 rounded-2xl btn-ghost p-0 lg:grid"
		aria-label={tr('Поиск')}
		title={tr('Поиск')}
	>
		<Search class="size-5" />
	</a>
</header>

<InstallApp variant="banner" />

<section class="mb-6">
	<h2 class="mb-3 flex items-center gap-2 text-lg font-extrabold">{tr('Для вас')}</h2>
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
			? tr('Нажмите «Напомнить позже» на карточке, и она появится здесь.')
			: app.viewCity !== 'all'
				? tr('В городе {0} пока нет таких мероприятий.', tr(app.viewCity))
				: tr('Пока ничего нет в этой категории.')}
		{#if app.viewCity !== 'all'}
			<button class="mt-4 btn btn-soft" onclick={() => app.setViewCity('all')}
				>{tr('Показать все города')}</button
			>
		{/if}
	</div>
{/if}
