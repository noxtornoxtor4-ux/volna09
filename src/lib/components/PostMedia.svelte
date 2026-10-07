<script lang="ts">
	import { tr } from '#lib/i18n.ts';
	import { onDestroy } from 'svelte';
	import { Heart, Pause, Play, Volume2, VolumeX } from '@lucide/svelte';
	import { toneClass } from '#lib/data.ts';
	import { blobUrl } from '#lib/media-db.ts';
	import type { Media } from '#lib/types.ts';

	/** onlike — лайк по двойному тапу; без него медиа просто показывается */
	let { media, onlike }: { media: Media; onlike?: () => void } = $props();

	const vertical = $derived(media.type === 'short');
	const isVideo = $derived(media.type !== 'photo');
	/** Демо-ролик без файла: воспроизведение имитируется полоской прогресса */
	const isDemo = $derived(isVideo && !media.src && !media.videoId);

	// Настоящее видео: файл из IndexedDB или временная ссылка до публикации
	let url = $state<string | undefined>();
	let missing = $state(false);
	$effect(() => {
		missing = false;
		if (media.src) url = media.src;
		else if (media.videoId) {
			const id = media.videoId;
			blobUrl(id).then((found) => {
				if (media.videoId !== id) return;
				url = found;
				missing = !found;
			});
		} else url = undefined;
	});

	let video: HTMLVideoElement | undefined = $state();
	let paused = $state(true);
	let muted = $state(true);
	let time = $state(0);
	let length = $state(0);

	// Имитация для демо-роликов
	let demoPlaying = $state(false);
	let demoElapsed = $state(0);
	let demoTimer: ReturnType<typeof setInterval> | undefined;
	const demoDuration = $derived(media.duration ?? 15);

	const playing = $derived(isDemo ? demoPlaying : !paused);
	const progress = $derived(isDemo ? demoElapsed / demoDuration : length ? time / length : 0);
	const clock = (s: number) =>
		`${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

	function togglePlay() {
		if (!isVideo) return;
		if (!isDemo) {
			if (video?.paused) video.play();
			else video?.pause();
			return;
		}
		demoPlaying = !demoPlaying;
		clearInterval(demoTimer);
		if (!demoPlaying) return;
		if (demoElapsed >= demoDuration) demoElapsed = 0;
		demoTimer = setInterval(() => {
			demoElapsed = Math.min(demoElapsed + 0.1 * (vertical ? 1 : 4), demoDuration);
			if (demoElapsed >= demoDuration) {
				demoPlaying = false;
				clearInterval(demoTimer);
			}
		}, 100);
	}

	// Двойной тап — лайк, одиночный — пауза/воспроизведение (с небольшой задержкой)
	let heart = $state(0);
	let lastTap = 0;
	let tapTimer: ReturnType<typeof setTimeout> | undefined;

	function tap(event: PointerEvent) {
		if ((event.target as HTMLElement).closest('[data-control]')) return;
		const now = Date.now();
		if (onlike && now - lastTap < 300) {
			clearTimeout(tapTimer);
			lastTap = 0;
			heart = now;
			onlike();
			return;
		}
		lastTap = now;
		clearTimeout(tapTimer);
		tapTimer = setTimeout(togglePlay, onlike ? 260 : 0);
	}

	function keydown(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			if (isVideo) togglePlay();
			else if (onlike) {
				heart = Date.now();
				onlike();
			}
		}
	}

	onDestroy(() => {
		clearInterval(demoTimer);
		clearTimeout(tapTimer);
	});
</script>

<div
	class="relative touch-manipulation overflow-hidden rounded-3xl select-none {toneClass[media.tone]
		.bg} {isVideo
		? vertical
			? 'mx-auto aspect-[9/16] max-h-[560px] w-full max-w-[300px]'
			: 'aspect-video w-full'
		: ''}"
	role="button"
	tabindex="0"
	aria-label={isVideo
		? `${playing ? tr('Пауза') : tr('Смотреть видео')}${onlike ? tr('. Двойной тап — нравится') : ''}`
		: tr('Фото. Двойной тап — нравится')}
	onpointerup={tap}
	onkeydown={keydown}
>
	{#if media.type === 'photo'}
		{#if media.src}
			<img src={media.src} alt="" class="max-h-[520px] w-full object-cover" draggable="false" />
		{:else}
			<div class="relative grid aspect-[4/3] place-items-center">
				<div class="absolute -top-16 -left-10 size-56 rounded-full bg-surface/40 blur-3xl"></div>
				<span class="text-8xl drop-shadow-md" aria-hidden="true">{media.emoji}</span>
			</div>
		{/if}
	{:else}
		{#if isDemo}
			<div class="absolute -right-10 -bottom-10 size-56 rounded-full bg-surface/40 blur-3xl"></div>
			<span
				class="absolute inset-0 grid place-items-center transition-transform duration-700 {vertical
					? 'text-8xl'
					: 'text-7xl'} {playing ? 'scale-125' : ''}"
				aria-hidden="true">{media.emoji}</span
			>
		{:else if url}
			<!-- svelte-ignore a11y_media_has_caption -->
			<video
				bind:this={video}
				src={url}
				poster={media.poster}
				playsinline
				loop={vertical}
				preload="metadata"
				class="absolute inset-0 size-full bg-black object-cover"
				bind:paused
				bind:muted
				bind:currentTime={time}
				bind:duration={length}
			></video>
		{:else if media.poster}
			<img
				src={media.poster}
				alt=""
				class="absolute inset-0 size-full object-cover"
				draggable="false"
			/>
		{/if}

		{#if missing}
			<span
				class="absolute inset-x-3 top-12 rounded-2xl bg-black/50 p-2 text-center text-xs text-white"
			>
				{tr('Видео хранится на устройстве автора — здесь видна только обложка')}
			</span>
		{/if}

		<span
			class="absolute top-3 left-3 rounded-full bg-black/35 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur"
		>
			{vertical ? 'Shorts' : tr('Видео')}
		</span>
		{#if !isDemo && url}
			<button
				type="button"
				data-control
				class="absolute top-3 right-3 grid size-9 place-items-center rounded-full bg-black/35 text-white"
				onclick={() => (muted = !muted)}
				aria-label={muted ? tr('Включить звук') : tr('Выключить звук')}
			>
				{#if muted}<VolumeX class="size-4" />{:else}<Volume2 class="size-4" />{/if}
			</button>
		{/if}

		<span
			class="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent p-3 pt-12 text-left text-white"
		>
			{#if media.caption}<span class="mb-2 block text-sm font-bold drop-shadow"
					>{media.caption}</span
				>{/if}
			<span class="mb-2 block h-1 overflow-hidden rounded-full bg-white/40">
				<span class="block h-full bg-white" style="width: {progress * 100}%"></span>
			</span>
			<span class="text-xs font-semibold">
				{isDemo
					? `${clock(demoElapsed)} / ${clock(demoDuration)}`
					: `${clock(time)} / ${clock(length)}`}
			</span>
		</span>

		{#if !playing && (isDemo || url)}
			<span
				class="pointer-events-none absolute top-1/2 left-1/2 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-[#1f2633] shadow-lg"
			>
				<Play class="size-7 translate-x-0.5" />
			</span>
		{:else if playing && isDemo}
			<span
				class="pointer-events-none absolute top-3 right-3 grid size-9 place-items-center rounded-full bg-black/35 text-white"
			>
				<Pause class="size-4" />
			</span>
		{/if}
	{/if}

	<!-- Сердце после двойного тапа -->
	{#key heart}
		{#if heart}
			<span class="pointer-events-none absolute inset-0 grid place-items-center">
				<Heart class="size-24 animate-like fill-white text-white drop-shadow-xl" />
			</span>
		{/if}
	{/key}
</div>
