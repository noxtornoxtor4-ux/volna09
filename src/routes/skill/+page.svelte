<script lang="ts">
	import { tr } from '#lib/i18n.ts';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import {
		BadgeCheck,
		Camera,
		ChevronLeft,
		Film,
		Pencil,
		Play,
		Plus,
		Trash,
		Trophy,
		Type
	} from '@lucide/svelte';
	import { app } from '#lib/app.svelte.ts';
	import CertificateCard from '#lib/components/CertificateCard.svelte';
	import CertificateForm from '#lib/components/CertificateForm.svelte';
	import CertificateViewer from '#lib/components/CertificateViewer.svelte';
	import MediaViewer from '#lib/components/MediaViewer.svelte';
	import Modal from '#lib/components/Modal.svelte';
	import SkillForm from '#lib/components/SkillForm.svelte';
	import { skillLevels } from '#lib/data.ts';
	import { compressImage, takeFile, videoPoster } from '#lib/files.ts';
	import { formatDate, plural } from '#lib/format.ts';
	import { blobUrl, saveBlob } from '#lib/media-db.ts';
	import type { Award, SkillMaterial } from '#lib/types.ts';

	const skill = $derived(app.skill(page.url.searchParams.get('id') ?? ''));
	const mine = $derived(!!skill && skill.personId === app.me && !app.isOrg);
	const materials = $derived(skill ? app.materialsOf(skill.id) : []);
	const works = $derived(materials.filter((m) => m.kind !== 'text'));
	const texts = $derived(materials.filter((m) => m.kind === 'text'));
	const certificates = $derived(skill ? app.certificatesForSkill(skill.id) : []);

	let editing = $state(false);
	let addingCertificate = $state(false);
	let menu = $state(false);
	let writing = $state(false);
	let text = $state('');
	let busy = $state(false);
	let viewing = $state<{ material: SkillMaterial; src?: string } | null>(null);
	let viewingCertificate = $state<Award | null>(null);

	async function addPhotos(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const files = [...(input.files ?? [])];
		input.value = '';
		if (!skill || !files.length) return;
		menu = false;
		busy = true;
		for (const file of files) {
			app.addMaterial({
				skillId: skill.id,
				kind: 'photo',
				src: await compressImage(file, 1400, 0.82)
			});
		}
		busy = false;
	}

	async function addVideo(e: Event) {
		const file = takeFile(e);
		if (!skill || !file) return;
		if (file.size > 200 * 1024 * 1024) {
			app.notify(tr('Видео больше 200 МБ — выберите ролик покороче'));
			return;
		}
		menu = false;
		busy = true;
		try {
			const videoId = `video-${crypto.randomUUID()}`;
			await saveBlob(videoId, file);
			const url = URL.createObjectURL(file);
			const poster = await videoPoster(url);
			URL.revokeObjectURL(url);
			app.addMaterial({ skillId: skill.id, kind: 'video', videoId, poster });
		} catch {
			app.notify(tr('Не хватило места на устройстве для видео'));
		} finally {
			busy = false;
		}
	}

	function saveText(e: SubmitEvent) {
		e.preventDefault();
		if (!skill || !text.trim()) return;
		app.addMaterial({ skillId: skill.id, kind: 'text', text: text.trim() });
		text = '';
		writing = false;
	}

	async function open(material: SkillMaterial) {
		viewing = { material, src: material.src };
		if (material.videoId) {
			const src = await blobUrl(material.videoId);
			if (viewing?.material.id === material.id) viewing = { material, src };
		}
	}

	function remove() {
		if (!skill || !confirm(tr('Удалить навык «{0}» вместе с материалами?', skill.title))) return;
		const personId = skill.personId;
		app.removeSkill(skill.id);
		goto(`/skills?u=${personId}`);
	}
</script>

<svelte:head><title>{tr('{0} — Волна', skill?.title ?? tr('Навык'))}</title></svelte:head>

{#if !skill}
	<div class="card p-10 text-center">
		<p class="font-bold">{tr('Навык не найден')}</p>
		<a href="/skills" class="mt-3 btn btn-soft">{tr('Все навыки')}</a>
	</div>
{:else}
	<a href="/skills?u={skill.personId}" class="mb-4 btn btn-ghost"
		><ChevronLeft class="size-4" /> {tr('Все навыки')}</a
	>

	<div class="mx-auto max-w-3xl space-y-6">
		<header class="card p-5 sm:p-6">
			<div class="flex items-start gap-4">
				<span
					class="grid size-16 shrink-0 place-items-center rounded-3xl bg-accent-soft text-4xl sm:size-20 sm:text-5xl"
					>{skill.emoji}</span
				>
				<div class="min-w-0 flex-1">
					<h1 class="text-2xl font-extrabold tracking-tight sm:text-3xl">{skill.title}</h1>
					<a
						href={skill.personId === app.me ? '/profile' : `/u?id=${skill.personId}`}
						class="text-sm text-muted hover:text-ink">{app.author(skill.personId).name}</a
					>
					<div class="mt-2 flex flex-wrap gap-1.5">
						{#if skill.level}
							<span class="rounded-full bg-surface-2 px-3 py-1 text-xs font-bold"
								>{skillLevels[skill.level]}</span
							>
						{/if}
						{#if certificates.length}
							<span
								class="inline-flex items-center gap-1 rounded-full bg-accent-soft px-3 py-1 text-xs font-bold text-accent-text"
								><BadgeCheck class="size-3.5" />
								{tr(
									'Подтверждён: {0} {1}',
									certificates.length,
									plural(certificates.length, 'сертификат', 'сертификата', 'сертификатов')
								)}</span
							>
						{/if}
					</div>
				</div>
				{#if mine}
					<div class="flex gap-1.5">
						<button
							class="btn size-10 rounded-full btn-ghost p-0"
							onclick={() => (editing = true)}
							aria-label={tr('Редактировать')}><Pencil class="size-4" /></button
						>
						<button
							class="btn size-10 rounded-full btn-ghost p-0 text-pastel-peach-ink"
							onclick={remove}
							aria-label={tr('Удалить')}><Trash class="size-4" /></button
						>
					</div>
				{/if}
			</div>
			{#if skill.description}<p class="mt-4 text-[15px] whitespace-pre-line">
					{skill.description}
				</p>{/if}

			{#if mine}
				<div class="relative mt-5">
					<button class="btn btn-primary" onclick={() => (menu = !menu)} disabled={busy}
						><Plus class="size-4" /> {busy ? tr('Загрузка…') : tr('Добавить материал')}</button
					>
					{#if menu}
						<div
							class="absolute top-full left-0 z-20 mt-2 grid w-64 gap-1 rounded-2xl border border-line bg-surface p-1.5 shadow-xl"
						>
							<label
								class="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-surface-2"
							>
								<Camera class="size-4 text-accent-text" />
								{tr('📷 Фотография')}
								<input type="file" accept="image/*" multiple class="sr-only" onchange={addPhotos} />
							</label>
							<button
								class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-surface-2"
								onclick={() => {
									menu = false;
									writing = true;
								}}><Type class="size-4 text-accent-text" /> {tr('📝 Текст')}</button
							>
							<label
								class="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-surface-2"
							>
								<Film class="size-4 text-accent-text" />
								{tr('🎥 Видео')}
								<input type="file" accept="video/*" class="sr-only" onchange={addVideo} />
							</label>
							<button
								class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-surface-2"
								onclick={() => {
									menu = false;
									addingCertificate = true;
								}}
								><Trophy class="size-4 text-accent-text" /> {tr('🏆 Сертификат или диплом')}</button
							>
						</div>
					{/if}
				</div>
			{/if}
		</header>

		<section>
			<h2 class="mb-3 text-lg font-extrabold">{tr('Работы')}</h2>
			{#if works.length}
				<div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
					{#each works as m (m.id)}
						<div class="group relative aspect-square overflow-hidden rounded-2xl bg-surface-2">
							<button class="size-full" onclick={() => open(m)} aria-label={tr('Открыть')}>
								{#if m.src || m.poster}
									<img src={m.src ?? m.poster} alt="" class="size-full object-cover" />
								{:else}
									<span class="grid size-full place-items-center text-3xl">🎥</span>
								{/if}
								{#if m.kind === 'video'}
									<span class="absolute inset-0 grid place-items-center bg-black/20 text-white"
										><Play class="size-9 fill-current" /></span
									>
								{/if}
							</button>
							{#if mine}
								<button
									class="absolute top-1.5 right-1.5 grid size-8 place-items-center rounded-full bg-black/50 text-white opacity-0 transition group-hover:opacity-100 focus:opacity-100"
									onclick={() => app.removeMaterial(m.id)}
									aria-label={tr('Удалить')}><Trash class="size-4" /></button
								>
							{/if}
						</div>
					{/each}
				</div>
			{:else}
				<p class="card p-6 text-center text-sm text-muted">
					{mine ? tr('Добавьте фото или видео своих работ.') : tr('Работ пока нет.')}
				</p>
			{/if}
		</section>

		{#if texts.length}
			<section>
				<h2 class="mb-3 text-lg font-extrabold">{tr('Тексты')}</h2>
				<div class="space-y-2">
					{#each texts as m (m.id)}
						<article class="group relative card p-4">
							<p class="text-[15px] whitespace-pre-line">{m.text}</p>
							<p class="mt-2 text-xs text-muted">{formatDate(m.createdAt.slice(0, 10))}</p>
							{#if mine}
								<button
									class="absolute top-3 right-3 text-muted opacity-0 transition group-hover:opacity-100 hover:text-pastel-peach-ink focus:opacity-100"
									onclick={() => app.removeMaterial(m.id)}
									aria-label={tr('Удалить')}><Trash class="size-4" /></button
								>
							{/if}
						</article>
					{/each}
				</div>
			</section>
		{/if}

		<section>
			<h2 class="mb-3 text-lg font-extrabold">{tr('Достижения')}</h2>
			{#if certificates.length}
				<div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
					{#each certificates as c (c.id)}
						<CertificateCard certificate={c} onopen={() => (viewingCertificate = c)} />
					{/each}
				</div>
			{:else}
				<p class="card p-6 text-center text-sm text-muted">
					{mine
						? tr('Привяжите сертификаты и дипломы, которые подтверждают этот навык.')
						: tr('Сертификатов пока нет.')}
				</p>
			{/if}
		</section>
	</div>

	<SkillForm bind:open={editing} {skill} />
	<CertificateForm bind:open={addingCertificate} skillId={skill.id} />

	<Modal bind:open={writing} title={tr('Текст')}>
		<form class="space-y-3" onsubmit={saveText}>
			<textarea
				class="min-h-40 input"
				maxlength="2000"
				placeholder={tr('Расскажите о своём опыте, проекте или работе')}
				bind:value={text}></textarea>
			<button class="btn w-full btn-primary" disabled={!text.trim()}>{tr('Добавить')}</button>
		</form>
	</Modal>
{/if}

{#if viewing}
	<MediaViewer
		src={viewing.src}
		kind={viewing.material.kind === 'video' ? 'video' : 'image'}
		title={skill?.title ?? ''}
		onclose={() => (viewing = null)}
	/>
{/if}

{#if viewingCertificate}
	<CertificateViewer certificate={viewingCertificate} onclose={() => (viewingCertificate = null)} />
{/if}
