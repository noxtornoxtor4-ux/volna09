<script lang="ts">
	import { FileText } from '@lucide/svelte';
	import { app } from '#lib/app.svelte.ts';
	import type { Award } from '#lib/types.ts';

	/** Превью сертификата: реальная фотография документа или значок файла, название и год */
	let { certificate, onopen }: { certificate: Award; onopen: () => void } = $props();

	const issuer = $derived(
		certificate.orgId ? app.org(certificate.orgId)?.name : certificate.issuer
	);
</script>

<button
	type="button"
	class="group flex w-full flex-col overflow-hidden rounded-2xl border border-line bg-surface text-left transition hover:-translate-y-0.5 hover:border-accent"
	onclick={onopen}
>
	<span class="relative grid aspect-[4/3] w-full place-items-center overflow-hidden bg-surface-2">
		{#if certificate.src}
			<img
				src={certificate.src}
				alt=""
				class="size-full object-cover transition group-hover:scale-105"
			/>
		{:else if certificate.fileId}
			<span class="flex flex-col items-center gap-1 text-accent-text">
				<FileText class="size-9" />
				<span class="text-[10px] font-bold uppercase"
					>{certificate.fileName?.split('.').pop() ?? 'file'}</span
				>
			</span>
		{:else}
			<span class="text-4xl">🏆</span>
		{/if}
	</span>
	<span class="block p-2.5">
		<span class="line-clamp-2 text-sm leading-tight font-bold">🏆 {certificate.title}</span>
		<span class="mt-0.5 block truncate text-xs text-muted"
			>{[issuer, certificate.date.slice(0, 4)].filter(Boolean).join(' · ')}</span
		>
	</span>
</button>
