<script lang="ts">
	import { tr } from '#lib/i18n.ts';
	import { Trash } from '@lucide/svelte';
	import { app } from '#lib/app.svelte.ts';
	import { formatDate } from '#lib/format.ts';
	import { blobUrl } from '#lib/media-db.ts';
	import type { Award } from '#lib/types.ts';
	import MediaViewer from './MediaViewer.svelte';

	/** Сертификат во весь экран: реальная фотография или исходный цифровой файл */
	let { certificate, onclose }: { certificate: Award; onclose: () => void } = $props();

	let original = $state<string | undefined>();
	$effect(() => {
		const id = certificate.fileId;
		original = undefined;
		if (id) blobUrl(id).then((url) => certificate.fileId === id && (original = url));
	});

	const src = $derived(original ?? certificate.src);
	const mime = $derived(
		certificate.mime ?? (certificate.src?.startsWith('data:image') ? 'image/' : '')
	);
	const kind = $derived(
		mime.startsWith('image/') || certificate.format === 'photo'
			? 'image'
			: mime === 'application/pdf'
				? 'pdf'
				: mime.startsWith('video/')
					? 'video'
					: 'file'
	);
	const issuer = $derived(
		certificate.orgId ? app.org(certificate.orgId)?.name : certificate.issuer
	);
	const mine = $derived(certificate.personId === app.actorId && !certificate.orgId);
</script>

<MediaViewer {src} {kind} title={certificate.title} fileName={certificate.fileName} {onclose}>
	{#snippet details()}
		<div class="flex flex-wrap items-start gap-x-6 gap-y-2">
			<div class="min-w-0 flex-1">
				<p class="text-white/70">
					{[
						issuer,
						formatDate(certificate.date, { day: 'numeric', month: 'long', year: 'numeric' })
					]
						.filter(Boolean)
						.join(' · ')}
					{#if certificate.format}
						· {certificate.format === 'photo' ? tr('📷 Фото документа') : tr('📄 Цифровая версия')}
					{/if}
				</p>
				{#if certificate.description}<p class="mt-1">{certificate.description}</p>{/if}
				{#if certificate.skillIds?.length}
					<div class="mt-2 flex flex-wrap gap-1.5">
						{#each certificate.skillIds as id (id)}
							{@const skill = app.skill(id)}
							{#if skill}
								<a
									href="/skill?id={skill.id}"
									onclick={onclose}
									class="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold hover:bg-white/25"
									>{skill.emoji} {skill.title}</a
								>
							{/if}
						{/each}
					</div>
				{/if}
			</div>
			{#if mine}
				<button
					class="btn bg-white/10 py-2 text-white hover:bg-white/20"
					onclick={() => {
						app.removeAward(certificate.id);
						onclose();
					}}><Trash class="size-4" /> {tr('Удалить')}</button
				>
			{/if}
		</div>
	{/snippet}
</MediaViewer>
