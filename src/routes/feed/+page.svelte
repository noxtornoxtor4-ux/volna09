<script lang="ts">
	import { Image, Send, Video, X } from '@lucide/svelte';
	import { app } from '#lib/app.svelte.ts';
	import Avatar from '#lib/components/Avatar.svelte';
	import PostCard from '#lib/components/PostCard.svelte';
	import PostMedia from '#lib/components/PostMedia.svelte';
	import { ME, organizations } from '#lib/data.ts';
	import type { Media } from '#lib/types.ts';

	type Tab = 'all' | 'video' | 'reviews';

	const MAX_PHOTO_BYTES = 1_500_000;

	let tab = $state<Tab>('all');
	let text = $state('');
	let media = $state<Media | undefined>();
	let opportunityId = $state('');
	let orgId = $state('');

	const tabs: { id: Tab; label: string }[] = [
		{ id: 'all', label: 'Всё' },
		{ id: 'video', label: 'Видео' },
		{ id: 'reviews', label: 'Отзывы об организациях' }
	];

	const posts = $derived(
		app.posts.filter((p) =>
			tab === 'video'
				? p.media?.type === 'video'
				: tab === 'reviews'
					? !!p.orgId && p.authorId !== p.orgId
					: true
		)
	);

	function attach(e: Event, type: Media['type']) {
		const input = e.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		input.value = '';
		if (!file) return;
		if (type === 'video') {
			// Видео не кладём в localStorage: живёт до перезагрузки страницы
			media = { type, tone: 'blue', emoji: '🎬', src: URL.createObjectURL(file) };
			return;
		}
		if (file.size > MAX_PHOTO_BYTES) {
			app.notify('Фото больше 1,5 МБ: выберите файл поменьше');
			return;
		}
		const reader = new FileReader();
		reader.onload = () => (media = { type, tone: 'blue', emoji: '📷', src: String(reader.result) });
		reader.readAsDataURL(file);
	}

	function publish(e: SubmitEvent) {
		e.preventDefault();
		if (!text.trim()) return;
		const opportunity = opportunityId ? app.opportunity(opportunityId) : undefined;
		app.addPost({
			text: text.trim(),
			media,
			opportunityId: opportunityId || undefined,
			orgId: orgId || opportunity?.orgId || undefined
		});
		text = '';
		media = undefined;
		opportunityId = '';
		orgId = '';
	}
</script>

<svelte:head><title>Лента опыта — Волна</title></svelte:head>

<div class="mx-auto max-w-xl">
	<h1 class="mb-5 text-2xl font-extrabold tracking-tight sm:text-3xl">Лента опыта</h1>

	<form class="mb-5 card p-4" onsubmit={publish}>
		<div class="flex gap-3">
			<Avatar id={ME} />
			<textarea
				class="min-h-20 flex-1 resize-none bg-transparent py-2 text-[15px] outline-none placeholder:text-muted"
				placeholder="Как прошло ваше волонтёрство? Расскажите историю или оставьте отзыв"
				bind:value={text}></textarea>
		</div>

		{#if media}
			<div class="relative mt-3">
				<PostMedia {media} />
				<button
					type="button"
					class="absolute top-2 right-2 grid size-8 place-items-center rounded-full bg-black/50 text-white"
					onclick={() => (media = undefined)}
					aria-label="Убрать вложение"
				>
					<X class="size-4" />
				</button>
			</div>
		{/if}

		<div class="mt-3 grid gap-2 sm:grid-cols-2">
			<select class="input py-2.5" bind:value={opportunityId} aria-label="Отметить проект">
				<option value="">🏷️ Отметить проект</option>
				{#each app.opportunities as o (o.id)}
					<option value={o.id}>{o.emoji} {o.title}</option>
				{/each}
			</select>
			<select class="input py-2.5" bind:value={orgId} aria-label="Отметить организацию">
				<option value="">🏢 Отметить организацию</option>
				{#each organizations as org (org.id)}
					<option value={org.id}>{org.emoji} {org.name}</option>
				{/each}
			</select>
		</div>

		<div class="mt-3 flex items-center gap-2 border-t border-line pt-3">
			<label class="btn cursor-pointer btn-ghost py-2" title="Фото">
				<Image class="size-4" /> Фото
				<input type="file" accept="image/*" class="sr-only" onchange={(e) => attach(e, 'photo')} />
			</label>
			<label class="btn cursor-pointer btn-ghost py-2" title="Вертикальное видео">
				<Video class="size-4" /> Видео
				<input type="file" accept="video/*" class="sr-only" onchange={(e) => attach(e, 'video')} />
			</label>
			<button class="ml-auto btn btn-primary py-2" disabled={!text.trim()}
				><Send class="size-4" /> Опубликовать</button
			>
		</div>
	</form>

	<div class="-mx-4 mb-5 no-scrollbar flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
		{#each tabs as t (t.id)}
			<button
				class="chip {tab === t.id ? 'border-accent bg-accent-soft text-accent-text' : ''}"
				onclick={() => (tab = t.id)}
				aria-pressed={tab === t.id}
			>
				{t.label}
			</button>
		{/each}
	</div>

	<div class="space-y-4">
		{#each posts as post (post.id)}
			<PostCard {post} />
		{:else}
			<div class="card p-10 text-center text-muted">Здесь пока пусто.</div>
		{/each}
	</div>
</div>
