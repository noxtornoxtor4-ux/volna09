<script lang="ts">
	import { getLocale, locales, setLocale, type Locale } from '#lib/i18n.ts';

	let { compact = false }: { compact?: boolean } = $props();

	const current = getLocale();
</script>

<div
	class="grid grid-cols-3 rounded-2xl bg-surface-2 p-1 text-sm font-semibold"
	role="radiogroup"
	aria-label="Язык · Тил · Language"
>
	{#each Object.entries(locales) as [id, l] (id)}
		<button
			type="button"
			role="radio"
			class="rounded-xl {compact ? 'py-1.5' : 'py-2.5'} {current === id
				? 'bg-surface shadow-sm'
				: 'text-muted'}"
			aria-checked={current === id}
			onclick={() => setLocale(id as Locale)}>{compact ? l.short : l.label}</button
		>
	{/each}
</div>
