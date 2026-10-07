<script lang="ts">
	import { app } from '#lib/app.svelte.ts';
	import { toneClass } from '#lib/data.ts';
	import type { Conversation } from '#lib/types.ts';
	import Avatar from './Avatar.svelte';

	let { conversation, size = 'md' }: { conversation: Conversation; size?: 'md' | 'lg' } = $props();
</script>

{#if conversation.kind === 'dm'}
	<Avatar id={app.partnerOf(conversation)} {size} />
{:else}
	<span
		class="grid shrink-0 place-items-center rounded-2xl {size === 'lg'
			? 'size-14 text-2xl'
			: 'size-10 text-lg'} {toneClass[conversation.tone ?? 'blue'].bg}"
		aria-hidden="true">{conversation.emoji ?? '💬'}</span
	>
{/if}
