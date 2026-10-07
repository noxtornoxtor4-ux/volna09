<script lang="ts">
	import { tr } from '#lib/i18n.ts';
	import { BadgeCheck } from '@lucide/svelte';
	import type { Snippet } from 'svelte';
	import { app } from '#lib/app.svelte.ts';
	import { accentVars } from '#lib/color.ts';
	import type { ProfileLook, Tone } from '#lib/types.ts';
	import Avatar from './Avatar.svelte';
	import ProfileCover from './ProfileCover.svelte';

	let {
		id,
		name,
		subtitle,
		bio,
		look = {},
		tone,
		verified = false,
		stats,
		actions
	}: {
		id: string;
		name: string;
		subtitle: string;
		bio?: string;
		look?: ProfileLook;
		tone: Tone;
		verified?: boolean;
		stats: { label: string; value: number | string; href?: string }[];
		actions?: Snippet;
	} = $props();
</script>

<!-- Оттенок профиля перекрашивает шапку, обводку аватара, кнопки и значки -->
<section
	class="overflow-hidden card"
	style={look.tint ? accentVars(look.tint, app.isDark ? 'dark' : 'light') : undefined}
>
	<!-- Постер профиля: шаблон, фото или видео -->
	<ProfileCover {look} {tone} class="h-36 sm:h-52" />

	<div class="px-4 pb-5 sm:px-6">
		<div class="relative z-10 -mt-14 flex items-end justify-between gap-3 sm:-mt-16">
			<Avatar {id} size="2xl" ring={look.tint ? 'accent' : true} />
			<div class="flex gap-2 pb-1">{@render actions?.()}</div>
		</div>
		<h1 class="mt-3 flex items-center gap-1.5 text-2xl font-extrabold tracking-tight">
			{name}
			{#if verified}<BadgeCheck
					class="size-5 text-accent-text"
					aria-label={tr('Проверенная организация')}
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
