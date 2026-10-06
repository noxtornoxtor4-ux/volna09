<script lang="ts">
	import { BadgeCheck } from '@lucide/svelte';
	import type { Snippet } from 'svelte';
	import { toneClass } from '#lib/data.ts';
	import type { Tone } from '#lib/types.ts';
	import Avatar from './Avatar.svelte';

	let {
		id,
		name,
		subtitle,
		bio,
		cover,
		tone,
		verified = false,
		stats,
		actions
	}: {
		id: string;
		name: string;
		subtitle: string;
		bio?: string;
		cover?: string;
		tone: Tone;
		verified?: boolean;
		stats: { label: string; value: number | string; href?: string }[];
		actions?: Snippet;
	} = $props();
</script>

<section class="overflow-hidden card">
	<!-- Постер профиля -->
	<div class="relative h-36 sm:h-52 {toneClass[tone].bg}">
		{#if cover}
			<img src={cover} alt="" class="size-full object-cover" />
		{:else}
			<div class="absolute -top-10 left-1/4 size-60 rounded-full bg-surface/40 blur-3xl"></div>
			<div class="absolute -right-10 -bottom-16 size-60 rounded-full bg-accent/40 blur-3xl"></div>
		{/if}
	</div>

	<div class="px-4 pb-5 sm:px-6">
		<div class="relative z-10 -mt-14 flex items-end justify-between gap-3 sm:-mt-16">
			<Avatar {id} size="2xl" ring />
			<div class="flex gap-2 pb-1">{@render actions?.()}</div>
		</div>
		<h1 class="mt-3 flex items-center gap-1.5 text-2xl font-extrabold tracking-tight">
			{name}
			{#if verified}<BadgeCheck
					class="size-5 text-accent-text"
					aria-label="Проверенная организация"
				/>{/if}
		</h1>
		<p class="text-sm text-muted">{subtitle}</p>
		{#if bio}<p class="mt-2 max-w-xl text-[15px]">{bio}</p>{/if}

		<div class="mt-4 grid grid-cols-4 gap-1 rounded-3xl bg-surface-2 p-1.5">
			{#each stats as s (s.label)}
				<svelte:element
					this={s.href ? 'a' : 'div'}
					href={s.href}
					class="flex flex-col items-center rounded-2xl px-1 py-2.5 text-center transition {s.href
						? 'hover:bg-surface'
						: ''}"
				>
					<span class="text-lg font-extrabold sm:text-xl">{s.value}</span>
					<span class="text-[11px] leading-tight text-muted sm:text-xs">{s.label}</span>
				</svelte:element>
			{/each}
		</div>
	</div>
</section>
