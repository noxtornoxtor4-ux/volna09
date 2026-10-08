<script lang="ts">
	import { tr } from '#lib/i18n.ts';
	import { Camera, FileText, X } from '@lucide/svelte';
	import { app } from '#lib/app.svelte.ts';
	import { day } from '#lib/data.ts';
	import { compressImage, takeFile } from '#lib/files.ts';
	import { saveBlob } from '#lib/media-db.ts';
	import type { Award } from '#lib/types.ts';
	import Modal from './Modal.svelte';

	/** Оригиналы хранятся целиком, поэтому ограничиваем только совсем большие файлы */
	const MAX_BYTES = 20 * 1024 * 1024;

	let {
		open = $bindable(false),
		skillId
	}: {
		open?: boolean;
		/** Навык, к которому сертификат привязывается сразу */
		skillId?: string;
	} = $props();

	const empty = () => ({
		title: '',
		issuer: '',
		date: day(0),
		description: '',
		skillIds: skillId ? [skillId] : [],
		format: 'photo' as NonNullable<Award['format']>,
		file: undefined as File | undefined,
		preview: undefined as string | undefined
	});
	let form = $state(empty());
	let saving = $state(false);

	$effect(() => {
		if (open) form = empty();
	});

	const skills = $derived(app.skillsOf(app.actorId));

	function choose(e: Event, format: NonNullable<Award['format']>) {
		const file = takeFile(e);
		if (!file) return;
		if (file.size > MAX_BYTES) {
			app.notify(tr('Файл больше 20 МБ — выберите поменьше'));
			return;
		}
		if (form.preview) URL.revokeObjectURL(form.preview);
		form.format = format;
		form.file = file;
		form.preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined;
		if (!form.title) form.title = file.name.replace(/\.[^.]+$/, '');
	}

	function toggleSkill(id: string) {
		form.skillIds = form.skillIds.includes(id)
			? form.skillIds.filter((s) => s !== id)
			: [...form.skillIds, id];
	}

	async function submit(e: SubmitEvent) {
		e.preventDefault();
		const file = form.file;
		if (!file || !form.title.trim()) return;
		saving = true;
		try {
			const fileId = `file-${crypto.randomUUID()}`;
			// Ждём, пока оригинал целиком окажется на сервере — иначе другие его не откроют
			await saveBlob(fileId, file, () => {});
			app.addCertificate({
				title: form.title.trim(),
				issuer: form.issuer.trim() || undefined,
				date: form.date || day(0),
				description: form.description.trim(),
				skillIds: form.skillIds,
				format: form.format,
				fileId,
				fileName: file.name,
				mime: file.type,
				// Превью — уменьшенная копия той же фотографии; оригинал хранится отдельно
				src: file.type.startsWith('image/') ? await compressImage(file, 900, 0.82) : undefined
			});
			open = false;
		} catch {
			app.notify(tr('Не хватило места на устройстве для файла'));
		} finally {
			saving = false;
		}
	}
</script>

<Modal bind:open title={tr('Добавить сертификат')}>
	<form class="space-y-4" onsubmit={submit}>
		<label class="block">
			<span class="label">{tr('Название')}</span>
			<input
				class="input"
				required
				maxlength="80"
				placeholder={tr('Название сертификата')}
				bind:value={form.title}
			/>
		</label>
		<div class="grid gap-3 sm:grid-cols-[1fr_auto]">
			<label class="block">
				<span class="label">{tr('Организация')}</span>
				<input
					class="input"
					maxlength="80"
					placeholder={tr('Кто выдал сертификат')}
					bind:value={form.issuer}
				/>
			</label>
			<label class="block">
				<span class="label">{tr('Дата получения')}</span>
				<input class="input" type="date" max={day(0)} required bind:value={form.date} />
			</label>
		</div>

		<div>
			<span class="label">{tr('Навык — к какому навыку относится сертификат')}</span>
			{#if skills.length}
				<div class="flex flex-wrap gap-2">
					{#each skills as s (s.id)}
						{@const on = form.skillIds.includes(s.id)}
						<button
							type="button"
							class="chip {on ? 'border-accent bg-accent-soft text-accent-text' : ''}"
							aria-pressed={on}
							onclick={() => toggleSkill(s.id)}>{s.emoji} {s.title}</button
						>
					{/each}
				</div>
			{:else}
				<p class="text-sm text-muted">
					{tr('Навыков пока нет — сертификат можно привязать позже.')}
					<a
						href="/skills?add=1"
						class="font-semibold text-accent-text"
						onclick={() => (open = false)}>{tr('Добавить навык')}</a
					>
				</p>
			{/if}
		</div>

		<div>
			<span class="label">{tr('Подтверждение сертификата')}</span>
			{#if form.file}
				<div class="flex items-center gap-3 rounded-2xl border border-line p-2.5">
					{#if form.preview}
						<img src={form.preview} alt="" class="size-16 shrink-0 rounded-xl object-cover" />
					{:else}
						<span
							class="grid size-16 shrink-0 place-items-center rounded-xl bg-surface-2 text-accent-text"
							><FileText class="size-7" /></span
						>
					{/if}
					<div class="min-w-0 flex-1 text-sm">
						<div class="truncate font-semibold">{form.file.name}</div>
						<div class="text-xs text-muted">
							{form.format === 'photo' ? tr('📷 Фотография') : tr('📄 Цифровая версия')} ·
							{(form.file.size / 1024 / 1024).toFixed(1)}
							{tr('МБ')}
						</div>
					</div>
					<button
						type="button"
						class="btn size-9 rounded-full btn-ghost p-0"
						aria-label={tr('Убрать вложение')}
						onclick={() => (form.file = form.preview = undefined)}><X class="size-4" /></button
					>
				</div>
			{:else}
				<div class="grid grid-cols-2 gap-2">
					<label class="btn cursor-pointer flex-col btn-ghost py-4">
						<Camera class="size-6" />
						{tr('📷 Загрузить фотографию')}
						<input
							type="file"
							accept="image/*"
							capture="environment"
							class="sr-only"
							onchange={(e) => choose(e, 'photo')}
						/>
					</label>
					<label class="btn cursor-pointer flex-col btn-ghost py-4">
						<FileText class="size-6" />
						{tr('📄 Загрузить цифровую версию')}
						<input
							type="file"
							accept="image/*,application/pdf"
							class="sr-only"
							onchange={(e) => choose(e, 'digital')}
						/>
					</label>
				</div>
				<p class="mt-1.5 text-xs text-muted">
					{tr('Сохраняется оригинал файла: фото, изображение или PDF до 20 МБ.')}
				</p>
			{/if}
		</div>

		<label class="block">
			<span class="label">{tr('Описание')}</span>
			<textarea
				class="min-h-20 input"
				maxlength="300"
				placeholder={tr('Дополнительная информация')}
				bind:value={form.description}></textarea>
		</label>

		<button class="btn w-full btn-primary" disabled={!form.file || !form.title.trim() || saving}
			>{saving ? tr('Сохраняем…') : tr('Добавить')}</button
		>
	</form>
</Modal>
