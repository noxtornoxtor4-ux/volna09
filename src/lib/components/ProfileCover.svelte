<script lang="ts">
	import { coverPresets, toneClass } from '#lib/data.ts';
	import { blobUrl } from '#lib/media-db.ts';
	import type { ProfileLook, Tone } from '#lib/types.ts';

	/** Постер профиля: видео → фото → шаблон → мягкий фон цвета профиля */
	let {
		look,
		tone,
		class: className = ''
	}: { look: ProfileLook; tone: Tone; class?: string } = $props();

	let videoUrl = $state<string | undefined>();
	$effect(() => {
		const id = look.coverVideoId;
		videoUrl = undefined;
		if (id) blobUrl(id).then((url) => look.coverVideoId === id && (videoUrl = url));
	});

	const preset = $derived(look.coverPreset ? coverPresets[look.coverPreset] : undefined);
</script>

<div
	class="relative overflow-hidden {toneClass[tone].bg} {className}"
	style={preset && !look.cover && !videoUrl ? `background: ${preset.css}` : undefined}
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
	{:else if !preset}
		<div class="absolute -top-10 left-1/4 size-60 rounded-full bg-surface/40 blur-3xl"></div>
		<div class="absolute -right-10 -bottom-16 size-60 rounded-full bg-accent/40 blur-3xl"></div>
	{/if}
</div>
