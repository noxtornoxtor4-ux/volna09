<script lang="ts">
	import { tr } from '#lib/i18n.ts';
	import { Plus } from '@lucide/svelte';
	import { app } from '#lib/app.svelte.ts';
	import type { Award } from '#lib/types.ts';
	import CertificateCard from './CertificateCard.svelte';
	import CertificateForm from './CertificateForm.svelte';
	import CertificateViewer from './CertificateViewer.svelte';

	/** Сертификаты в профиле: превью и название, по нажатию — оригинал документа */
	let { personId, editable = false }: { personId: string; editable?: boolean } = $props();

	const certificates = $derived(app.certificatesOf(personId));
	let adding = $state(false);
	let viewing = $state<Award | null>(null);
</script>

{#if certificates.length || editable}
	<section class="mt-4 card p-4 sm:p-5">
		<div class="mb-3 flex items-center justify-between gap-2">
			<h2 class="text-lg font-extrabold">
				{tr('Сертификаты')}
				{#if certificates.length}<span class="text-sm font-semibold text-muted"
						>· {certificates.length}</span
					>{/if}
			</h2>
			{#if editable}
				<button class="btn btn-soft px-3 py-1.5 text-sm" onclick={() => (adding = true)}
					><Plus class="size-4" /> {tr('Добавить сертификат')}</button
				>
			{/if}
		</div>
		{#if certificates.length}
			<div class="-mx-1 no-scrollbar flex gap-3 overflow-x-auto px-1 pb-1">
				{#each certificates as c (c.id)}
					<div class="w-40 shrink-0 sm:w-44">
						<CertificateCard certificate={c} onopen={() => (viewing = c)} />
					</div>
				{/each}
			</div>
		{:else}
			<p class="text-sm text-muted">
				{tr('Загрузите фото бумажного сертификата или его цифровую версию — их увидят в профиле.')}
			</p>
		{/if}
	</section>
{/if}

{#if editable}<CertificateForm bind:open={adding} />{/if}
{#if viewing}
	<CertificateViewer certificate={viewing} onclose={() => (viewing = null)} />
{/if}
