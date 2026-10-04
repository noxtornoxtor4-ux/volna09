<script lang="ts">
	import { CircleCheck, Pencil, TriangleAlert } from '@lucide/svelte';
	import type { Verdict } from '#lib/scope/analyzer.ts';

	let { verdict, confidence }: { verdict: Verdict; confidence?: number } = $props();

	const config = {
		in_scope: { label: 'В рамках ТЗ', icon: CircleCheck, cls: 'bg-brand-500/15 text-brand-300' },
		revision: { label: 'Правка по ТЗ', icon: Pencil, cls: 'bg-sky-500/15 text-sky-300' },
		out_of_scope: { label: 'Вне ТЗ', icon: TriangleAlert, cls: 'bg-rose-500/15 text-rose-300' }
	};

	const current = $derived(config[verdict]);
</script>

<span
	class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold {current.cls}"
>
	<current.icon class="size-3.5" />
	{current.label}
	{#if confidence !== undefined}
		<span class="opacity-70">· {confidence}%</span>
	{/if}
</span>
