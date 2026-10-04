<script lang="ts">
	import type { Snippet } from 'svelte';

	let { title, subtitle, actions }: { title: string; subtitle?: string; actions?: Snippet } =
		$props();
</script>

<svelte:head>
	<title>{title} — TestBoost AI</title>
</svelte:head>

<header class="mb-8 flex flex-wrap items-end justify-between gap-4 print:hidden">
	<div>
		<h1 class="font-display text-2xl font-bold text-white sm:text-3xl">{title}</h1>
		{#if subtitle}<p class="mt-1 text-slate-400">{subtitle}</p>{/if}
	</div>
	{@render actions?.()}
</header>
