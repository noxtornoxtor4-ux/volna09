<script lang="ts">
	import { tr } from '#lib/i18n.ts';
	import { BadgeCheck, FileText, ShieldAlert, ShieldCheck, Upload, X } from '@lucide/svelte';
	import { app } from '#lib/app.svelte.ts';
	import { takeFile } from '#lib/files.ts';
	import { saveBlob } from '#lib/media-db.ts';
	import type { OrgVerification } from '#lib/types.ts';
	import Modal from './Modal.svelte';

	/**
	 * Статус проверки организации в кабинете. Пока модератор не поставил синий бейдж,
	 * публикация мероприятий, начисление часов и выдача сертификатов закрыты.
	 */
	const org = $derived(app.myOrg);
	const status = $derived(org.verified ? 'approved' : org.verification?.status);

	let open = $state(false);
	let docs = $state<OrgVerification['docs']>([]);
	let links = $state('');
	let note = $state('');
	let uploading = $state(false);

	function start() {
		docs = [...(org.verification?.docs ?? [])];
		links = org.verification?.links ?? org.website ?? '';
		note = org.verification?.note ?? '';
		open = true;
	}

	async function addDoc(e: Event) {
		const file = takeFile(e);
		if (!file) return;
		uploading = true;
		try {
			const fileId = `doc-${crypto.randomUUID()}`;
			// Документ должен оказаться на сервере — его откроет модератор с другого устройства
			await saveBlob(fileId, file, () => {});
			docs = [...docs, { fileId, name: file.name, mime: file.type }];
		} catch {
			app.notify(tr('Не удалось загрузить документ (до 25 МБ). Попробуйте ещё раз'));
		} finally {
			uploading = false;
		}
	}

	function submit(e: SubmitEvent) {
		e.preventDefault();
		if (!docs.length) return;
		app.requestVerification({ docs, links: links.trim(), note: note.trim() });
		open = false;
	}
</script>

{#if status === 'approved'}
	<p
		class="mb-5 flex items-center gap-2 rounded-2xl bg-pastel-blue px-4 py-2.5 text-sm font-semibold text-pastel-blue-ink"
	>
		<BadgeCheck class="size-4" />
		{tr('Верифицированная организация — все функции открыты')}
	</p>
{:else}
	<div
		class="mb-5 rounded-3xl p-4 {status === 'pending'
			? 'bg-pastel-blue text-pastel-blue-ink'
			: 'bg-pastel-yellow text-pastel-yellow-ink'}"
	>
		<div class="flex items-start gap-3">
			{#if status === 'pending'}<ShieldCheck class="mt-0.5 size-5 shrink-0" />{:else}<ShieldAlert
					class="mt-0.5 size-5 shrink-0"
				/>{/if}
			<div class="min-w-0 flex-1 text-sm">
				<p class="font-bold">
					{status === 'pending'
						? tr('Заявка на проверке у модератора')
						: status === 'needs_info'
							? tr('Модератор просит уточнить данные')
							: status === 'rejected'
								? tr('Заявка отклонена')
								: tr('Организация ещё не проверена')}
				</p>
				<p class="mt-0.5">
					{#if org.verification?.message && status !== 'pending'}
						{org.verification.message}
					{:else}
						{tr(
							'Публикация мероприятий, начисление часов и выдача сертификатов откроются после проверки документов.'
						)}
					{/if}
				</p>
			</div>
		</div>
		{#if status !== 'pending'}
			<button class="mt-3 btn bg-ink py-2 text-bg" onclick={start}>
				{status ? tr('Отправить заново') : tr('Получить синий бейдж')}
			</button>
		{/if}
	</div>
{/if}

<Modal bind:open title={tr('Проверка организации')}>
	<form class="space-y-4" onsubmit={submit}>
		<p class="text-sm text-muted">
			{tr(
				'Приложите устав, официальное письмо или подтверждение от администрации учебного заведения или НКО.'
			)}
		</p>
		<div>
			<span class="label">{tr('Документы')}</span>
			<ul class="space-y-1.5">
				{#each docs as doc (doc.fileId)}
					<li class="flex items-center gap-2 rounded-xl bg-surface-2 px-3 py-2 text-sm">
						<FileText class="size-4 shrink-0 text-accent-text" />
						<span class="min-w-0 flex-1 truncate">{doc.name}</span>
						<button
							type="button"
							class="text-muted hover:text-ink"
							aria-label={tr('Убрать')}
							onclick={() => (docs = docs.filter((d) => d.fileId !== doc.fileId))}
							><X class="size-4" /></button
						>
					</li>
				{/each}
			</ul>
			<label class="mt-2 btn cursor-pointer btn-ghost {uploading ? 'opacity-60' : ''}">
				<Upload class="size-4" />
				{uploading ? tr('Загрузка…') : tr('Добавить документ')}
				<input
					type="file"
					accept="image/*,application/pdf"
					class="sr-only"
					disabled={uploading}
					onchange={addDoc}
				/>
			</label>
		</div>
		<label class="block">
			<span class="label">{tr('Сайт и соцсети')}</span>
			<input class="input" placeholder="instagram.com/club, t.me/club" bind:value={links} />
		</label>
		<label class="block">
			<span class="label">{tr('Комментарий для модератора')}</span>
			<textarea class="min-h-20 input" maxlength="500" bind:value={note}></textarea>
		</label>
		<button class="btn w-full btn-primary" disabled={!docs.length || uploading}
			>{tr('Отправить на проверку')}</button
		>
	</form>
</Modal>
