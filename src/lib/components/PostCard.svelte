<script lang="ts">
	import { BadgeCheck, Heart, MessageCircle, Send, Share2 } from '@lucide/svelte';
	import { app } from '#lib/app.svelte.ts';
	import { toneClass } from '#lib/data.ts';
	import { timeAgo } from '#lib/format.ts';
	import type { Post } from '#lib/types.ts';
	import Avatar from './Avatar.svelte';
	import PostMedia from './PostMedia.svelte';

	let { post }: { post: Post } = $props();

	let showComments = $state(false);
	let draft = $state('');

	const author = $derived(app.author(post.authorId));
	const opportunity = $derived(
		post.opportunityId ? app.opportunity(post.opportunityId) : undefined
	);
	const org = $derived(post.orgId ? app.org(post.orgId) : undefined);

	function comment(e: SubmitEvent) {
		e.preventDefault();
		if (!draft.trim()) return;
		app.addComment(post, draft.trim());
		draft = '';
	}
</script>

<article id={post.id} class="scroll-mt-24 card p-4 sm:p-5">
	<header class="flex items-center gap-3">
		<Avatar id={post.authorId} />
		<div class="min-w-0 flex-1">
			<div class="flex items-center gap-1 truncate font-bold">
				{author.name}
				{#if author.verified}<BadgeCheck
						class="size-4 shrink-0 text-accent-text"
						aria-label="Проверенная организация"
					/>{/if}
			</div>
			<div class="text-xs text-muted">
				{author.isOrg ? 'Организация' : 'Волонтёр'} · {timeAgo(post.createdAt)}
			</div>
		</div>
	</header>

	<p class="mt-3 text-[15px] leading-relaxed whitespace-pre-line">{post.text}</p>

	{#if opportunity || org}
		<div class="mt-3 flex flex-wrap gap-2">
			{#if opportunity}
				<a
					href="/#{opportunity.id}"
					class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold {toneClass[
						opportunity.tone
					].bg} {toneClass[opportunity.tone].text}"
				>
					{opportunity.emoji}
					{opportunity.title}
				</a>
			{/if}
			{#if org && org.id !== post.authorId}
				<span
					class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold {toneClass[
						org.tone
					].bg} {toneClass[org.tone].text}"
				>
					{org.emoji}
					{org.name}
				</span>
			{/if}
		</div>
	{/if}

	{#if post.media}
		<div class="mt-3"><PostMedia media={post.media} /></div>
	{/if}

	<footer
		class="mt-3 flex items-center gap-1 border-t border-line pt-2 text-sm font-semibold text-muted"
	>
		<button
			class="flex items-center gap-1.5 rounded-xl px-3 py-2 transition hover:bg-surface-2 {post.liked
				? 'text-pastel-peach-ink'
				: ''}"
			onclick={() => app.toggleLike(post)}
			aria-pressed={post.liked}
			aria-label="Нравится"
		>
			<Heart class="size-5 {post.liked ? 'fill-current' : ''}" />
			{post.likes}
		</button>
		<button
			class="flex items-center gap-1.5 rounded-xl px-3 py-2 transition hover:bg-surface-2 {showComments
				? 'text-accent-text'
				: ''}"
			onclick={() => (showComments = !showComments)}
			aria-expanded={showComments}
			aria-label="Комментарии"
		>
			<MessageCircle class="size-5" />
			{post.comments.length}
		</button>
		<button
			class="flex items-center gap-1.5 rounded-xl px-3 py-2 transition hover:bg-surface-2"
			onclick={() => app.share(post)}
			aria-label="Поделиться"
		>
			<Share2 class="size-5" />
			{post.shares}
		</button>
	</footer>

	{#if showComments}
		<div class="mt-2 space-y-3">
			{#each post.comments as c (c.id)}
				<div class="flex gap-2.5">
					<Avatar id={c.authorId} size="sm" />
					<div class="rounded-2xl bg-surface-2 px-3 py-2 text-sm">
						<div class="text-xs font-bold">
							{app.author(c.authorId).name}
							<span class="font-medium text-muted">· {timeAgo(c.createdAt)}</span>
						</div>
						{c.text}
					</div>
				</div>
			{:else}
				<p class="text-sm text-muted">Будьте первым, кто оставит комментарий.</p>
			{/each}
			<form class="flex gap-2" onsubmit={comment}>
				<input class="input py-2.5" placeholder="Написать комментарий…" bind:value={draft} />
				<button
					class="btn btn-primary px-3"
					disabled={!draft.trim()}
					aria-label="Отправить комментарий"><Send class="size-4" /></button
				>
			</form>
		</div>
	{/if}
</article>
