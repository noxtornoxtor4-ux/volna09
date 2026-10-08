<script lang="ts">
	import { tr } from '#lib/i18n.ts';
	import { Camera, Check, ImagePlus, Video, X } from '@lucide/svelte';
	import { app } from '#lib/app.svelte.ts';
	import { avatarEmojis, coverPresets, toneClass } from '#lib/data.ts';
	import { compressImage, takeFile } from '#lib/files.ts';
	import { MAX_VIDEO_BYTES, maxVideoMb, uploadVideo } from '#lib/video.ts';
	import type { ProfileLook, Tone } from '#lib/types.ts';
	import ProfileCover from './ProfileCover.svelte';

	/** Редактор оформления: шаблоны постера, своё фото или видео, аватар-фото или эмодзи */
	let {
		look = $bindable(),
		tone,
		round = true,
		fallback = '🙂'
	}: { look: ProfileLook; tone: Tone; round?: boolean; fallback?: string } = $props();

	let busy = $state(false);

	function usePreset(id: string) {
		look = {
			...look,
			coverPreset: id,
			cover: undefined,
			coverVideoId: undefined,
			coverVideoUrl: undefined
		};
	}

	async function coverPhoto(e: Event) {
		const file = takeFile(e);
		if (!file) return;
		busy = true;
		look = {
			...look,
			cover: await compressImage(file, 1400, 0.8),
			coverPreset: undefined,
			coverVideoId: undefined,
			coverVideoUrl: undefined
		};
		busy = false;
	}

	async function coverVideo(e: Event) {
		const file = takeFile(e);
		if (!file) return;
		if (file.size > MAX_VIDEO_BYTES) {
			app.notify(
				tr('Видео для постера — до {0} МБ. Лучше короткий ролик на 5–15 секунд', maxVideoMb)
			);
			return;
		}
		busy = true;
		try {
			// Постер-видео выкладывается на сервер, чтобы его видели все гости профиля
			const uploaded = await uploadVideo(file);
			look = {
				...look,
				coverVideoId: uploaded.videoId,
				coverVideoUrl: uploaded.url,
				cover: undefined,
				coverPreset: undefined
			};
		} catch {
			app.notify(tr('Не удалось загрузить видео. Проверьте интернет и попробуйте ещё раз'));
		} finally {
			busy = false;
		}
	}

	async function avatarPhoto(e: Event) {
		const file = takeFile(e);
		if (!file) return;
		look = { ...look, avatar: await compressImage(file, 400, 0.8), avatarEmoji: undefined };
	}
</script>

<div class="space-y-5">
	<!-- Предпросмотр -->
	<div class="relative">
		<ProfileCover {look} {tone} class="h-36 rounded-3xl sm:h-44" />
		<div class="absolute -bottom-8 left-5">
			<span
				class="grid size-20 place-items-center overflow-hidden text-3xl ring-4 ring-surface {round
					? 'rounded-full'
					: 'rounded-[30%]'} {toneClass[tone].bg}"
			>
				{#if look.avatar}
					<img src={look.avatar} alt="" class="size-full object-cover" />
				{:else}
					{look.avatarEmoji ?? fallback}
				{/if}
			</span>
		</div>
	</div>

	<div class="pt-6">
		<span class="label">{tr('Постер — шаблоны')}</span>
		<div class="grid grid-cols-5 gap-2 sm:grid-cols-9">
			{#each Object.entries(coverPresets) as [id, preset] (id)}
				<button
					type="button"
					class="relative aspect-square rounded-2xl border-2 transition {look.coverPreset === id
						? 'border-ink'
						: 'border-transparent hover:scale-105'}"
					style="background: {preset.css}"
					onclick={() => usePreset(id)}
					aria-label={tr('Шаблон «{0}»', preset.label)}
					title={preset.label}
				>
					{#if look.coverPreset === id}<Check
							class="absolute inset-0 m-auto size-5 text-white drop-shadow"
						/>{/if}
				</button>
			{/each}
		</div>
		<div class="mt-2 flex flex-wrap gap-2">
			<label class="btn cursor-pointer btn-ghost py-2 text-sm">
				<ImagePlus class="size-4" />
				{tr('Своё фото')}
				<input type="file" accept="image/*" class="sr-only" onchange={coverPhoto} disabled={busy} />
			</label>
			<label class="btn cursor-pointer btn-ghost py-2 text-sm">
				<Video class="size-4" />
				{busy ? tr('Загрузка…') : tr('Видео')}
				<input type="file" accept="video/*" class="sr-only" onchange={coverVideo} disabled={busy} />
			</label>
			{#if look.cover || look.coverPreset || look.coverVideoId || look.coverVideoUrl}
				<button
					type="button"
					class="btn btn-ghost py-2 text-sm"
					onclick={() =>
						(look = {
							...look,
							cover: undefined,
							coverPreset: undefined,
							coverVideoId: undefined,
							coverVideoUrl: undefined
						})}
				>
					<X class="size-4" />
					{tr('Без постера')}
				</button>
			{/if}
		</div>
	</div>

	<div>
		<span class="label">{tr('Аватар')}</span>
		<div class="flex flex-wrap gap-1.5">
			<label
				class="grid size-11 cursor-pointer place-items-center rounded-2xl bg-accent text-accent-ink"
				title={tr('Загрузить фото')}
			>
				<Camera class="size-5" />
				<input type="file" accept="image/*" class="sr-only" onchange={avatarPhoto} />
			</label>
			{#each avatarEmojis as emoji (emoji)}
				<button
					type="button"
					class="grid size-11 place-items-center rounded-2xl text-xl transition {look.avatarEmoji ===
						emoji && !look.avatar
						? 'bg-accent-soft ring-2 ring-accent'
						: 'bg-surface-2 hover:scale-105'}"
					onclick={() => (look = { ...look, avatarEmoji: emoji, avatar: undefined })}
					aria-label={tr('Аватар {0}', emoji)}>{emoji}</button
				>
			{/each}
			{#if look.avatar || look.avatarEmoji}
				<button
					type="button"
					class="grid size-11 place-items-center rounded-2xl bg-surface-2 text-muted"
					onclick={() => (look = { ...look, avatar: undefined, avatarEmoji: undefined })}
					aria-label={tr('Убрать аватар')}
				>
					<X class="size-4" />
				</button>
			{/if}
		</div>
	</div>
</div>
