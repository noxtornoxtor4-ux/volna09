<script lang="ts" module>
	export interface HiddenVideo {
		id: string;
		title: string;
		poster?: string;
		videoId?: string;
	}
</script>

<script lang="ts">
	import { tr } from '#lib/i18n.ts';
	import { ChevronDown, Eye, EyeOff, Play, Trash } from '@lucide/svelte';
	import { blobUrl } from '#lib/media-db.ts';
	import MediaViewer from './MediaViewer.svelte';

	/** Свёрнутый список скрытых видео: посмотреть, вернуть обратно или удалить окончательно */
	let {
		items,
		onrestore,
		ondelete
	}: {
		items: HiddenVideo[];
		onrestore: (id: string) => void;
		ondelete: (id: string) => void;
	} = $props();

	let open = $state(false);
	let viewing = $state<{ title: string; src?: string } | null>(null);

	async function view(item: HiddenVideo) {
		viewing = { title: item.title };
		const src = item.videoId ? await blobUrl(item.videoId) : undefined;
		if (viewing?.title === item.title) viewing = { title: item.title, src };
	}

	function remove(item: HiddenVideo) {
		if (confirm(tr('Удалить видео навсегда? Вернуть его будет нельзя.'))) ondelete(item.id);
	}
</script>

{#if items.length}
	<section class="mt-4 rounded-3xl border border-dashed border-line">
		<button
			type="button"
			class="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-muted hover:text-ink"
			onclick={() => (open = !open)}
			aria-expanded={open}
		>
			<EyeOff class="size-4" />
			<span class="flex-1">{tr('Скрытые видео · {0}', items.length)}</span>
			<ChevronDown class="size-4 transition {open ? 'rotate-180' : ''}" />
		</button>
		{#if open}
			<ul class="space-y-2 px-3 pb-3">
				{#each items as item (item.id)}
					<li class="flex items-center gap-3 rounded-2xl bg-surface-2 p-2">
						<button
							type="button"
							class="relative grid size-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-surface"
							onclick={() => view(item)}
							aria-label={tr('Смотреть видео')}
						>
							{#if item.poster}<img
									src={item.poster}
									alt=""
									class="size-full object-cover opacity-70"
								/>{/if}
							<Play class="absolute size-5 fill-current text-ink" />
						</button>
						<span class="min-w-0 flex-1 truncate text-sm">{item.title}</span>
						<button
							type="button"
							class="btn btn-soft px-3 py-1.5 text-xs"
							onclick={() => onrestore(item.id)}><Eye class="size-4" /> {tr('Вернуть')}</button
						>
						<button
							type="button"
							class="grid size-8 place-items-center rounded-full text-muted hover:bg-surface hover:text-pastel-peach-ink"
							onclick={() => remove(item)}
							aria-label={tr('Удалить навсегда')}><Trash class="size-4" /></button
						>
					</li>
				{/each}
			</ul>
		{/if}
	</section>
{/if}

{#if viewing}
	<MediaViewer
		src={viewing.src}
		kind="video"
		title={viewing.title}
		onclose={() => (viewing = null)}
	/>
{/if}
