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
	const clock = (s: number) => `0:${String(Math.floor(s)).padStart(2, '0')}`;

	function toggle() {
		playing = !playing;
		clearInterval(timer);
		if (!playing) return;
		if (elapsed >= duration) elapsed = 0;
		timer = setInterval(() => {
			elapsed = Math.min(elapsed + 0.1, duration);
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
		<img src={media.src} alt="" class="max-h-[480px] w-full rounded-2xl object-cover" />
	{:else}
		<div class="grid aspect-[4/3] place-items-center rounded-2xl {toneClass[media.tone].bg}">
			<span class="text-7xl" aria-hidden="true">{media.emoji}</span>
		</div>
	{/if}
{:else if media.src}
	<!-- svelte-ignore a11y_media_has_caption -->
	<video
		src={media.src}
		controls
		playsinline
		class="mx-auto aspect-[9/16] max-h-[520px] rounded-2xl bg-black object-cover"
	></video>
{:else}
	<button
		class="relative mx-auto block aspect-[9/16] max-h-[520px] w-full max-w-[290px] overflow-hidden rounded-2xl {toneClass[
			media.tone
		].bg}"
		onclick={toggle}
		aria-label={playing ? 'Пауза' : 'Смотреть видео'}
	>
		<span
			class="absolute inset-0 grid place-items-center text-8xl transition-transform duration-700 {playing
				? 'scale-125'
				: ''}"
			aria-hidden="true"
		>
			{media.emoji}
		</span>
		<span
			class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/40 to-transparent p-3 pt-10 text-left text-white"
		>
			<span class="mb-2 block h-1 overflow-hidden rounded-full bg-white/40">
				<span class="block h-full bg-white" style="width: {(elapsed / duration) * 100}%"></span>
			</span>
			<span class="text-xs font-semibold">{clock(elapsed)} / {clock(duration)}</span>
		</span>
		{#if !playing}
			<span
				class="absolute top-1/2 left-1/2 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-ink shadow-lg"
			>
				<Play class="size-7 translate-x-0.5" />
			</span>
		{:else}
			<span
				class="absolute top-3 right-3 grid size-9 place-items-center rounded-full bg-black/30 text-white"
				><Pause class="size-4" /></span
			>
		{/if}
	</button>
{/if}
