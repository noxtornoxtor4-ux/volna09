<script lang="ts">
	import { Film, Image, LayoutGrid, Plus, Smartphone, Star, Type } from '@lucide/svelte';
	import { app } from '#lib/app.svelte.ts';
	import Avatar from '#lib/components/Avatar.svelte';
	import PostCard from '#lib/components/PostCard.svelte';
	import PostComposer from '#lib/components/PostComposer.svelte';
	import type { Post } from '#lib/types.ts';

	type Section = 'recommended' | 'experience';
	type Format = 'all' | 'short' | 'photo' | 'video' | 'text';

	let section = $state<Section>('recommended');
	let format = $state<Format>('all');
	let composing = $state(false);
	let composeKind = $state<Post['kind']>('post');

	const formats = [
		{ id: 'all' as Format, label: 'Всё', icon: LayoutGrid },
		{ id: 'short' as Format, label: 'Короткие видео', icon: Smartphone },
		{ id: 'photo' as Format, label: 'Фото', icon: Image },
		{ id: 'video' as Format, label: 'Видео', icon: Film },
		{ id: 'text' as Format, label: 'Текст', icon: Type }
	];

	const posts = $derived(
		section === 'experience'
			? app.posts.filter((p) => p.kind === 'review')
			: app.posts.filter((p) =>
					format === 'all' ? true : format === 'text' ? !p.media : p.media?.type === format
				)
	);

	function compose(kind: Post['kind']) {
		composeKind = kind;
		composing = true;
	}
</script>

<svelte:head><title>Лента — Волна</title></svelte:head>

<div class="mx-auto max-w-xl">
	<div class="mb-5 flex items-center justify-between gap-3">
		<h1 class="text-2xl font-extrabold tracking-tight sm:text-3xl">Лента</h1>
		<button
			class="btn btn-primary"
			onclick={() => compose(section === 'experience' ? 'review' : 'post')}
		>
			<Plus class="size-4" /> Создать
		</button>
	</div>

	<div class="mb-4 grid grid-cols-2 rounded-2xl bg-surface-2 p-1 text-sm font-bold">
		<button
			class="rounded-xl py-2.5 transition {section === 'recommended'
				? 'bg-surface shadow-sm'
				: 'text-muted'}"
			onclick={() => (section = 'recommended')}
		>
			Рекомендации
		</button>
		<button
			class="flex items-center justify-center gap-1.5 rounded-xl py-2.5 transition {section ===
			'experience'
				? 'bg-surface shadow-sm'
				: 'text-muted'}"
			onclick={() => (section = 'experience')}
		>
			<Star class="size-4" /> Опыт и отзывы
		</button>
	</div>

	{#if section === 'recommended'}
		<div class="-mx-4 mb-5 no-scrollbar flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
			{#each formats as f (f.id)}
				<button
					class="chip {format === f.id ? 'border-accent bg-accent text-accent-ink' : ''}"
					onclick={() => (format = f.id)}
					aria-pressed={format === f.id}
				>
					<f.icon class="size-4" />
					{f.label}
				</button>
			{/each}
		</div>
	{:else}
		<button
			class="mb-5 flex w-full items-center gap-3 card p-3 text-left transition hover:border-accent"
			onclick={() => compose('review')}
		>
			<Avatar id={app.actorId} />
			<span class="flex-1 text-sm text-muted"
				>Расскажите, как прошло волонтёрство: текст, фото или видео…</span
			>
			<span class="btn btn-soft py-2">Отзыв</span>
		</button>
	{/if}

	<div class="space-y-4">
		{#each posts as post (post.id)}
			<PostCard {post} />
		{:else}
			<div class="card p-10 text-center text-muted">Здесь пока пусто.</div>
		{/each}
	</div>
</div>

<PostComposer bind:open={composing} bind:kind={composeKind} />
