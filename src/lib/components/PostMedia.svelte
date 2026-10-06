<script lang="ts">
	import { onDestroy } from 'svelte';
	import { Pause, Play } from '@lucide/svelte';
	import { toneClass } from '#lib/data.ts';
	import type { Media } from '#lib/types.ts';

	let { media }: { media: Media } = $props();

	// Демо-ролики без файла: проигрывание симулируется полоской прогресса
	let playing = $state(false);
	let elapsed = $state(0);
	let timer: ReturnType<typeof setInterval> | undefined;

	const duration = $derived(media.duration ?? 15);
	const vertical = $derived(media.type === 'short');
	const clock = (s: number) =>
		`${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

	function toggle() {
		playing = !playing;
		clearInterval(timer);
		if (!playing) return;
		if (elapsed >= duration) elapsed = 0;
		timer = setInterval(() => {
			elapsed = Math.min(elapsed + 0.1 * (vertical ? 1 : 4), duration);
			if (elapsed >= duration) {
				playing = false;
				clearInterval(timer);
			}
		}, 100);
	}

	onDestroy(() => clearInterval(timer));
</script>

{#if media.type === 'photo'}
	{#if media.src}
		<img src={media.src} alt="" class="max-h-[520px] w-full rounded-3xl object-cover" />
	{:else}
		<div
			class="relative grid aspect-[4/3] place-items-center overflow-hidden rounded-3xl {toneClass[
				media.tone
			].bg}"
		>
			<div class="absolute -top-16 -left-10 size-56 rounded-full bg-surface/40 blur-3xl"></div>
			<span class="text-8xl drop-shadow-md" aria-hidden="true">{media.emoji}</span>
		</div>
	{/if}
{:else if media.src}
	<!-- svelte-ignore a11y_media_has_caption -->
	<video
		src={media.src}
		controls
		playsinline
		class="mx-auto rounded-3xl bg-black {vertical
			? 'aspect-[9/16] max-h-[560px]'
			: 'aspect-video w-full'} object-cover"
	></video>
{:else}
	<button
		class="relative block overflow-hidden rounded-3xl {toneClass[media.tone].bg} {vertical
			? 'mx-auto aspect-[9/16] max-h-[560px] w-full max-w-[300px]'
			: 'aspect-video w-full'}"
		onclick={toggle}
		aria-label={playing ? 'Пауза' : 'Смотреть видео'}
	>
		<div class="absolute -right-10 -bottom-10 size-56 rounded-full bg-surface/40 blur-3xl"></div>
		<span
			class="absolute inset-0 grid place-items-center transition-transform duration-700 {vertical
				? 'text-8xl'
				: 'text-7xl'} {playing ? 'scale-125' : ''}"
			aria-hidden="true"
		>
			{media.emoji}
		</span>
		<span
			class="absolute top-3 left-3 rounded-full bg-black/35 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur"
		>
			{vertical ? 'Shorts' : 'Видео'}
		</span>
		<span
			class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent p-3 pt-12 text-left text-white"
		>
			{#if media.caption}<span class="mb-2 block text-sm font-bold drop-shadow"
					>{media.caption}</span
				>{/if}
			<span class="mb-2 block h-1 overflow-hidden rounded-full bg-white/40">
				<span class="block h-full bg-white" style="width: {(elapsed / duration) * 100}%"></span>
			</span>
			<span class="text-xs font-semibold">{clock(elapsed)} / {clock(duration)}</span>
		</span>
		{#if !playing}
			<span
				class="absolute top-1/2 left-1/2 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-[#1f2633] shadow-lg"
			>
				<Play class="size-7 translate-x-0.5" />
			</span>
		{:else}
			<span
				class="absolute top-3 right-3 grid size-9 place-items-center rounded-full bg-black/35 text-white"
				><Pause class="size-4" /></span
			>
		{/if}
	</button>
{/if}
