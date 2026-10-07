<script lang="ts">
	import { tr } from '#lib/i18n.ts';
	import { Trash } from '@lucide/svelte';
	import { app } from '#lib/app.svelte.ts';
	import { awardTiers, awardTypes } from '#lib/data.ts';
	import { isImage, isPdf } from '#lib/files.ts';
	import { formatDate } from '#lib/format.ts';
	import type { Award, AwardType } from '#lib/types.ts';
	import AwardItem from './AwardItem.svelte';
	import Avatar from './Avatar.svelte';
	import CertificateViewer from './CertificateViewer.svelte';
	import Modal from './Modal.svelte';

	let {
		awards,
		showRecipient = false,
		removable = false
	}: { awards: Award[]; showRecipient?: boolean; removable?: boolean } = $props();

	let viewing = $state<Award | null>(null);
	const order: AwardType[] = ['medal', 'cup', 'certificate'];
</script>

<div class="space-y-6">
	{#each order as type (type)}
		{@const items = awards.filter((a) => a.type === type)}
		<section>
			<h3 class="mb-2 flex items-center gap-2 font-extrabold">
				{awardTypes[type].emoji}
				{awardTypes[type].plural}
				<span class="text-sm font-semibold text-muted">· {items.length}</span>
			</h3>
			<!-- Полка: предметы стоят на деревянной доске -->
			<div class="relative rounded-3xl bg-gradient-to-b from-surface-2 to-surface px-3 pt-4">
				<div class="no-scrollbar flex min-h-36 items-end gap-4 overflow-x-auto px-2 pb-0">
					{#each items as award (award.id)}
						<button
							class="group flex w-28 shrink-0 flex-col items-center gap-1 pb-3 transition hover:-translate-y-1"
							onclick={() => (viewing = award)}
						>
							<AwardItem {award} />
							<span class="line-clamp-2 text-center text-xs leading-tight font-semibold"
								>{award.title}</span
							>
						</button>
					{:else}
						<p class="w-full self-center pb-6 text-center text-sm text-muted">
							{tr('Пока пусто — всё впереди ✨')}
						</p>
					{/each}
				</div>
				<div
					class="-mx-3 h-3 rounded-b-3xl bg-gradient-to-b from-[#d9b98f] to-[#b8925f] shadow-[0_6px_12px_-6px_rgba(120,80,30,0.5)]"
				></div>
			</div>
		</section>
	{/each}
</div>

{#if viewing && viewing.type === 'certificate' && (viewing.fileId || viewing.src)}
	<!-- Сертификат открывается во весь экран: реальная фотография или исходный файл -->
	<CertificateViewer certificate={viewing} onclose={() => (viewing = null)} />
{:else if viewing}
	<Modal title={viewing.title} bind:open={() => true, (v) => !v && (viewing = null)}>
		<div class="flex flex-col items-center gap-3 text-center">
			{#if isImage(viewing.src)}
				<img
					src={viewing.src}
					alt={viewing.title}
					class="max-h-[50dvh] w-full rounded-2xl object-contain"
				/>
			{:else if isPdf(viewing.src)}
				<iframe src={viewing.src} title={viewing.title} class="h-[55dvh] w-full rounded-2xl"
				></iframe>
			{:else}
				<div class="grid w-full place-items-center rounded-3xl bg-surface-2 py-8">
					<AwardItem award={viewing} />
				</div>
			{/if}
			<span
				class="rounded-full px-3 py-1 text-xs font-bold"
				style="background: {awardTiers[viewing.tier].color}33"
			>
				{awardTypes[viewing.type].label} · {awardTiers[viewing.tier].label}
			</span>
			<p class="text-[15px]">{viewing.description}</p>
			<p class="text-sm text-muted">
				{viewing.orgId
					? tr('Выдал: {0}', app.org(viewing.orgId)?.name)
					: tr('Загружено волонтёром')} · {formatDate(viewing.date, {
					day: 'numeric',
					month: 'long',
					year: 'numeric'
				})}
			</p>
			{#if viewing.opportunityId}
				<a href="/o?id={viewing.opportunityId}" class="text-sm font-semibold text-accent-text"
					>{tr('За «{0}»', app.opportunity(viewing.opportunityId)?.title)}</a
				>
			{/if}
			{#if showRecipient}
				<div class="flex items-center gap-2 text-sm">
					<Avatar id={viewing.personId} size="sm" />{app.author(viewing.personId).name}
				</div>
			{/if}
			{#if removable && !viewing.orgId}
				<button
					class="btn btn-ghost text-pastel-peach-ink"
					onclick={() => {
						app.removeAward(viewing!.id);
						viewing = null;
					}}
				>
					<Trash class="size-4" />
					{tr('Убрать с полки')}
				</button>
			{/if}
		</div>
	</Modal>
{/if}
