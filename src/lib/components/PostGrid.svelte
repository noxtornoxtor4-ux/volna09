<script lang="ts">
	import { Film, Heart, Play } from '@lucide/svelte';
	import { toneClass } from '#lib/data.ts';
	import type { Post } from '#lib/types.ts';
	import Modal from './Modal.svelte';
	import PostCard from './PostCard.svelte';

	let { posts }: { posts: Post[] } = $props();
	let viewing = $state<Post | null>(null);
</script>

{#if posts.length}
	<div class="grid grid-cols-3 gap-1 sm:gap-2">
		{#each posts as post (post.id)}
			{@const tone = post.media?.tone ?? 'blue'}
			<button
				class="group relative aspect-square overflow-hidden rounded-xl sm:rounded-2xl {toneClass[
					tone
				].bg}"
				onclick={() => (viewing = post)}
			>
				{#if post.media?.src && post.media.type === 'photo'}
					<img src={post.media.src} alt="" class="size-full object-cover" />
				{:else if post.media?.poster}
					<img src={post.media.poster} alt="" class="size-full object-cover" />
				{:else if post.media}
					<span class="grid size-full place-items-center text-4xl sm:text-5xl" aria-hidden="true"
						>{post.media.emoji}</span
					>
				{:else}
					<span
						class="line-clamp-5 p-2 text-left text-[11px] leading-snug font-semibold sm:p-3 sm:text-xs"
						>{post.text}</span
					>
				{/if}
				{#if post.media?.type === 'short'}
					<Play class="absolute top-2 right-2 size-4 fill-white text-white drop-shadow" />
				{:else if post.media?.type === 'video'}
					<Film class="absolute top-2 right-2 size-4 text-white drop-shadow" />
				{/if}
				<span
					class="absolute inset-0 flex items-center justify-center gap-1 bg-black/40 text-sm font-bold text-white opacity-0 transition group-hover:opacity-100"
				>
					<Heart class="size-4 fill-white" />{post.likes}
				</span>
			</button>
		{/each}
	</div>
{:else}
	<p class="py-10 text-center text-sm text-muted">Публикаций пока нет.</p>
{/if}

{#if viewing}
	<Modal title="Публикация" bind:open={() => true, (v) => !v && (viewing = null)}>
		<PostCard post={viewing} />
	</Modal>
{/if}
