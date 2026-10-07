<script lang="ts">
	import { tr } from '#lib/i18n.ts';
	import { Award, BadgeCheck, MessageCircle, X } from '@lucide/svelte';
	import { app } from '#lib/app.svelte.ts';
	import { accentVars } from '#lib/color.ts';
	import { brandPalette } from '#lib/data.ts';
	import type { ProfileLook, Tone } from '#lib/types.ts';
	import Avatar from './Avatar.svelte';
	import ColorPicker from './ColorPicker.svelte';
	import ProfileCover from './ProfileCover.svelte';

	/** Оттенок профиля: выбор цвета и предпросмотр карточки до сохранения */
	let {
		tint = $bindable(),
		look,
		tone,
		name,
		id
	}: { tint?: string; look: ProfileLook; tone: Tone; name: string; id: string } = $props();

	const preview = $derived(tint ?? '#7692ff');
</script>

<div class="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
	<div>
		{#if tint}
			<ColorPicker bind:value={tint} presets={brandPalette} label={tr('Оттенок профиля')} />
			<button
				type="button"
				class="mt-3 btn btn-ghost py-2 text-sm"
				onclick={() => (tint = undefined)}
			>
				<X class="size-4" />
				{tr('Без оттенка')}
			</button>
		{:else}
			<p class="text-sm text-muted">
				{tr(
					'Оттенок видят все, кто открывает ваш профиль: шапка, обводка аватара, кнопки и значки.'
				)}
			</p>
			<button type="button" class="mt-3 btn btn-soft" onclick={() => (tint = '#7692ff')}
				>{tr('Выбрать оттенок')}</button
			>
		{/if}
	</div>

	<!-- Предпросмотр карточки профиля -->
	<div>
		<span class="label">{tr('Предпросмотр')}</span>
		<div
			class="overflow-hidden rounded-3xl border border-line bg-surface"
			style={tint ? accentVars(preview, app.isDark ? 'dark' : 'light') : undefined}
		>
			<ProfileCover look={{ ...look, tint }} {tone} class="h-24" />
			<div class="px-4 pb-4">
				<div class="relative z-10 -mt-8 flex items-end justify-between gap-2">
					<Avatar {id} size="lg" ring={tint ? 'accent' : true} />
					<div class="flex gap-1.5">
						<span class="btn btn-primary px-3 py-1.5 text-xs">{tr('Подписаться')}</span>
						<span class="btn btn-soft px-2.5 py-1.5" aria-label={tr('Написать')}
							><MessageCircle class="size-3.5" /></span
						>
					</div>
				</div>
				<div class="mt-2 flex items-center gap-1 font-extrabold">
					<span class="truncate">{name || tr('Ваше имя')}</span>
					<BadgeCheck class="size-4 shrink-0 text-accent-text" />
				</div>
				<span
					class="mt-2 inline-flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 text-xs font-bold text-accent-text"
					><Award class="size-3.5" /> {tr('Достижения')}</span
				>
			</div>
		</div>
	</div>
</div>
