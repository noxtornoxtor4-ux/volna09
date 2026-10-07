<script lang="ts">
	import { Image, ImagePlus, Send, Star, Video, X } from '@lucide/svelte';
	import { app } from '#lib/app.svelte.ts';
	import { compressImage, isVerticalVideo, takeFile, videoPoster } from '#lib/files.ts';
	import { saveBlob } from '#lib/media-db.ts';
	import type { Media, Post } from '#lib/types.ts';
	import Avatar from './Avatar.svelte';
	import Modal from './Modal.svelte';
	import PostMedia from './PostMedia.svelte';

	let {
		open = $bindable(false),
		kind = $bindable<Post['kind']>('post')
	}: { open?: boolean; kind?: Post['kind'] } = $props();

	let text = $state('');
	let media = $state<Media | undefined>();
	let opportunityId = $state('');
	let orgId = $state('');
	let busy = $state(false);
	/** Выбранный видеофайл: сохраняется в IndexedDB только при публикации */
	let videoFile: File | undefined;

	const MAX_VIDEO_BYTES = 300 * 1024 * 1024;

	async function attachPhoto(e: Event) {
		const file = takeFile(e);
		if (!file) return;
		busy = true;
		media = { type: 'photo', tone: 'blue', emoji: '📷', src: await compressImage(file) };
		busy = false;
	}

	async function attachVideo(e: Event) {
		const file = takeFile(e);
		if (!file) return;
		if (file.size > MAX_VIDEO_BYTES) {
			app.notify('Видео больше 300 МБ — выберите ролик покороче');
			return;
		}
		busy = true;
		videoFile = file;
		const src = URL.createObjectURL(file);
		const [vertical, poster] = await Promise.all([isVerticalVideo(src), videoPoster(src)]);
		media = { type: vertical ? 'short' : 'video', tone: 'blue', emoji: '🎬', src, poster };
		busy = false;
	}

	/** Своя обложка для видео вместо кадра из ролика */
	async function attachPoster(e: Event) {
		const file = takeFile(e);
		if (!file || !media) return;
		media = { ...media, poster: await compressImage(file, 720, 0.8) };
	}

	function clearMedia() {
		if (media?.src?.startsWith('blob:')) URL.revokeObjectURL(media.src);
		media = undefined;
		videoFile = undefined;
	}

	async function publish(e: SubmitEvent) {
		e.preventDefault();
		if (!text.trim() || busy) return;
		const opportunity = opportunityId ? app.opportunity(opportunityId) : undefined;
		let saved = media;
		if (media && videoFile) {
			// Видео — в IndexedDB, в посте остаются только ключ и превью
			busy = true;
			const videoId = `video-${crypto.randomUUID()}`;
			try {
				await saveBlob(videoId, videoFile);
				saved = { ...media, src: undefined, videoId };
			} catch {
				app.notify('Не хватило места на устройстве для видео');
				busy = false;
				return;
			}
			busy = false;
		}
		app.addPost({
			kind,
			text: text.trim(),
			media: saved,
			opportunityId: opportunityId || undefined,
			orgId: orgId || opportunity?.orgId || undefined
		});
		text = '';
		media = undefined;
		videoFile = undefined;
		opportunityId = '';
		orgId = '';
		open = false;
	}
</script>

<Modal bind:open title={kind === 'review' ? 'Новый отзыв' : 'Новая публикация'}>
	<form class="space-y-4" onsubmit={publish}>
		{#if !app.isOrg}
			<div class="grid grid-cols-2 rounded-2xl bg-surface-2 p-1 text-sm font-semibold">
				<button
					type="button"
					class="rounded-xl py-2 {kind === 'post' ? 'bg-surface shadow-sm' : 'text-muted'}"
					onclick={() => (kind = 'post')}>Публикация</button
				>
				<button
					type="button"
					class="flex items-center justify-center gap-1.5 rounded-xl py-2 {kind === 'review'
						? 'bg-surface shadow-sm'
						: 'text-muted'}"
					onclick={() => (kind = 'review')}
				>
					<Star class="size-4" /> Отзыв об опыте
				</button>
			</div>
		{/if}

		<div class="flex gap-3">
			<Avatar id={app.actorId} />
			<textarea
				class="min-h-28 flex-1 resize-none bg-transparent py-2 text-[15px] outline-none placeholder:text-muted"
				placeholder={kind === 'review'
					? 'Как прошло мероприятие? Что понравилось, что можно улучшить?'
					: 'Поделитесь историей, фото или видео'}
				bind:value={text}></textarea>
		</div>

		{#if media}
			<div class="relative">
				<PostMedia {media} />
				<button
					type="button"
					class="absolute top-2 right-2 grid size-8 place-items-center rounded-full bg-black/50 text-white"
					onclick={clearMedia}
					aria-label="Убрать вложение"
				>
					<X class="size-4" />
				</button>
			</div>
			{#if media.type !== 'photo'}
				<label class="btn w-full cursor-pointer btn-ghost py-2">
					<ImagePlus class="size-4" /> Сменить обложку видео
					<input type="file" accept="image/*" class="sr-only" onchange={attachPoster} />
				</label>
			{/if}
		{/if}

		<div class="grid gap-2 sm:grid-cols-2">
			<select class="input py-2.5" bind:value={opportunityId} aria-label="Отметить мероприятие">
				<option value="">🏷️ Отметить мероприятие</option>
				{#each app.opportunities as o (o.id)}
					<option value={o.id}>{o.emoji} {o.title}</option>
				{/each}
			</select>
			<select class="input py-2.5" bind:value={orgId} aria-label="Отметить организацию">
				<option value="">🏢 Отметить организацию</option>
				{#each app.allOrgs as org (org.id)}
					<option value={org.id}>{org.emoji} {app.org(org.id)?.name}</option>
				{/each}
			</select>
		</div>

		<div class="flex flex-wrap items-center gap-2 border-t border-line pt-4">
			<label class="btn cursor-pointer btn-ghost py-2">
				<Image class="size-4" /> Фото
				<input type="file" accept="image/*" class="sr-only" onchange={attachPhoto} />
			</label>
			<label
				class="btn cursor-pointer btn-ghost py-2"
				title="Вертикальное видео станет Shorts, горизонтальное — длинным видео"
			>
				<Video class="size-4" />
				{busy ? 'Обработка…' : 'Видео'}
				<input
					type="file"
					accept="video/*"
					class="sr-only"
					onchange={attachVideo}
					disabled={busy}
				/>
			</label>
			<button class="ml-auto btn btn-primary py-2" disabled={!text.trim() || busy}
				><Send class="size-4" /> Опубликовать</button
			>
		</div>
	</form>
</Modal>
