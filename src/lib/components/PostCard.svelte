<script lang="ts">
	import { tr } from '#lib/i18n.ts';
	import { BadgeCheck, Heart, MessageCircle, Send, Share2, Star } from '@lucide/svelte';
	import { app } from '#lib/app.svelte.ts';
	import { ME, toneClass } from '#lib/data.ts';
	import { timeAgo } from '#lib/format.ts';
	import type { Post } from '#lib/types.ts';
	import Avatar from './Avatar.svelte';
	import PostMedia from './PostMedia.svelte';

	let { post, openComments = false }: { post: Post; openComments?: boolean } = $props();

	// svelte-ignore state_referenced_locally
	let showComments = $state(openComments);
	let draft = $state('');

	const author = $derived(app.author(post.authorId));
	const opportunity = $derived(
		post.opportunityId ? app.opportunity(post.opportunityId) : undefined
	);
	const org = $derived(post.orgId ? app.org(post.orgId) : undefined);
	const profileHref = (id: string) =>
		id === ME || id === app.myOrgId ? '/profile' : `/u?id=${id}`;

	function comment(e: SubmitEvent) {
		e.preventDefault();
		if (!draft.trim()) return;
		app.addComment(post, draft.trim());
		draft = '';
	}
</script>

<article id={post.id} class="scroll-mt-24 card p-4 sm:p-5">
	<header class="flex items-center gap-3">
		<a href={profileHref(post.authorId)}><Avatar id={post.authorId} /></a>
		<div class="min-w-0 flex-1">
			<a
				href={profileHref(post.authorId)}
				class="flex items-center gap-1 truncate font-bold hover:underline"
			>
				{author.name}
				{#if author.verified}<BadgeCheck
						class="size-4 shrink-0 text-accent-text"
						aria-label={tr('Проверенная организация')}
					/>{/if}
			</a>
			<div class="text-xs text-muted">
				{author.isOrg ? tr('Организация') : tr('Волонтёр')} · {timeAgo(post.createdAt)}
			</div>
		</div>
		{#if post.kind === 'review'}
			<span
				class="inline-flex items-center gap-1 rounded-full bg-pastel-yellow px-2.5 py-1 text-[11px] font-bold text-pastel-yellow-ink"
			>
				<Star class="size-3 fill-current" />
				{tr('Отзыв')}
			</span>
		{/if}
	</header>

	<p class="mt-3 text-[15px] leading-relaxed whitespace-pre-line">{post.text}</p>

	{#if opportunity || (org && org.id !== post.authorId)}
		<div class="mt-3 flex flex-wrap gap-2">
			{#if opportunity}
				<a
					href="/o?id={opportunity.id}"
					class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold {toneClass[
						opportunity.tone
					].bg} {toneClass[opportunity.tone].text}"
				>
					{opportunity.emoji}
					{opportunity.title}
				</a>
			{/if}
			{#if org && org.id !== post.authorId}
				<a
					href={profileHref(org.id)}
					class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold {toneClass[
						org.tone
					].bg} {toneClass[org.tone].text}"
				>
					{org.emoji}
					{org.name}
				</a>
			{/if}
		</div>
	{/if}

	{#if post.media}
		<div class="mt-3"><PostMedia media={post.media} onlike={() => app.likePost(post)} /></div>
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
			aria-label={tr('Нравится')}
		>
			<Heart class="size-5 transition {post.liked ? 'scale-110 fill-current' : ''}" />
			{post.likes}
		</button>
		<button
			class="flex items-center gap-1.5 rounded-xl px-3 py-2 transition hover:bg-surface-2 {showComments
				? 'text-accent-text'
				: ''}"
			onclick={() => (showComments = !showComments)}
			aria-expanded={showComments}
			aria-label={tr('Комментарии')}
		>
			<MessageCircle class="size-5" />
			{post.comments.length}
		</button>
		<button
			class="flex items-center gap-1.5 rounded-xl px-3 py-2 transition hover:bg-surface-2"
			onclick={() => app.share(post)}
			aria-label={tr('Поделиться')}
		>
			<Share2 class="size-5" />
			{post.shares}
		</button>
	</footer>

	{#if showComments}
		<div class="mt-2 space-y-3">
			{#each post.comments as c (c.id)}
				<div class="flex gap-2.5">
					<a href={profileHref(c.authorId)}><Avatar id={c.authorId} size="sm" /></a>
					<div class="rounded-2xl bg-surface-2 px-3 py-2 text-sm">
						<div class="text-xs font-bold">
							{app.author(c.authorId).name}
							<span class="font-medium text-muted">· {timeAgo(c.createdAt)}</span>
						</div>
						{c.text}
					</div>
				</div>
			{:else}
				<p class="text-sm text-muted">{tr('Будьте первым, кто оставит комментарий.')}</p>
			{/each}
			<form class="flex gap-2" onsubmit={comment}>
				<input class="input py-2.5" placeholder={tr('Написать комментарий…')} bind:value={draft} />
				<button
					class="btn btn-primary px-3"
					disabled={!draft.trim()}
					aria-label={tr('Отправить комментарий')}><Send class="size-4" /></button
				>
			</form>
		</div>
	{/if}
</article>
