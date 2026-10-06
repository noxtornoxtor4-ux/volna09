<script lang="ts">
	import { X } from '@lucide/svelte';
	import type { Snippet } from 'svelte';

	let {
		open = $bindable(false),
		title,
		children
	}: { open?: boolean; title: string; children: Snippet } = $props();
</script>

<svelte:window onkeydown={(e) => open && e.key === 'Escape' && (open = false)} />

{#if open}
	<div class="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
		<button
			class="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
			aria-label="Закрыть"
			onclick={() => (open = false)}
		></button>
		<div
			role="dialog"
			aria-modal="true"
			aria-label={title}
			class="relative max-h-[90dvh] w-full overflow-y-auto rounded-t-3xl bg-surface p-5 shadow-2xl sm:max-w-lg sm:rounded-3xl sm:p-6"
		>
			<div class="mb-4 flex items-center justify-between gap-3">
				<h2 class="text-lg font-bold">{title}</h2>
				<button
					class="btn size-9 rounded-full btn-ghost p-0"
					onclick={() => (open = false)}
					aria-label="Закрыть"
				>
					<X class="size-4" />
				</button>
			</div>
			{@render children()}
		</div>
	</div>
{/if}
