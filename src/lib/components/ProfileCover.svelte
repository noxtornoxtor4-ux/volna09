<script lang="ts">
	import { coverPresets, toneClass } from '#lib/data.ts';
	import { blobUrl } from '#lib/media-db.ts';
	import { playableUrl } from '#lib/video.ts';
	import type { ProfileLook, Tone } from '#lib/types.ts';

	/** Постер профиля: видео → фото → шаблон → оттенок профиля → мягкий фон цвета профиля */
	let {
		look,
		tone,
		class: className = ''
	}: { look: ProfileLook; tone: Tone; class?: string } = $props();

	let videoUrl = $state<string | undefined>();
	$effect(() => {
		const id = look.coverVideoId;
		videoUrl = look.coverVideoUrl ? playableUrl(look.coverVideoUrl) : undefined;
		if (look.coverVideoUrl) return;
		if (id) blobUrl(id).then((url) => look.coverVideoId === id && (videoUrl = url));
	});

	const preset = $derived(look.coverPreset ? coverPresets[look.coverPreset] : undefined);
	/** Без своего постера шапка окрашивается в оттенок профиля */
	const background = $derived(
		look.cover || videoUrl
			? undefined
			: preset
				? preset.css
				: look.tint
					? `linear-gradient(135deg, color-mix(in srgb, ${look.tint} 45%, var(--surface)), ${look.tint})`
					: undefined
	);
</script>

<div
	class="relative overflow-hidden {toneClass[tone].bg} {className}"
	style={background ? `background: ${background}` : undefined}
>
	{#if videoUrl}
		<video
			src={videoUrl}
			autoplay
			muted
			loop
			playsinline
			class="absolute inset-0 size-full object-cover"
		></video>
	{:else if look.cover}
		<img src={look.cover} alt="" class="absolute inset-0 size-full object-cover" />
	{:else if !preset && !look.tint}
		<div class="absolute -top-10 left-1/4 size-60 rounded-full bg-surface/40 blur-3xl"></div>
		<div class="absolute -right-10 -bottom-16 size-60 rounded-full bg-accent/40 blur-3xl"></div>
	{/if}
</div>
