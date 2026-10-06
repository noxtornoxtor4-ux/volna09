<script lang="ts">
	import { X } from '@lucide/svelte';
	import type { Snippet } from 'svelte';
	import { cubicOut } from 'svelte/easing';
	import { fade, fly } from 'svelte/transition';

	let {
		open = $bindable(false),
		title,
		wide = false,
		children
	}: { open?: boolean; title: string; wide?: boolean; children: Snippet } = $props();
</script>

<svelte:window onkeydown={(e) => open && e.key === 'Escape' && (open = false)} />

{#if open}
	<div class="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
		<button
			class="absolute inset-0 bg-black/35 backdrop-blur-[3px]"
			aria-label="Закрыть"
			onclick={() => (open = false)}
			transition:fade={{ duration: 150 }}
		></button>
		<div
			role="dialog"
			aria-modal="true"
			aria-label={title}
			class="relative max-h-[92dvh] w-full overflow-y-auto rounded-t-[2rem] bg-surface p-5 shadow-2xl sm:rounded-[2rem] sm:p-6 {wide
				? 'sm:max-w-2xl'
				: 'sm:max-w-lg'}"
			transition:fly={{ y: 40, duration: 220, easing: cubicOut }}
		>
			<div class="mx-auto mb-3 h-1.5 w-10 rounded-full bg-line sm:hidden"></div>
			<div class="mb-4 flex items-center justify-between gap-3">
				<h2 class="text-lg font-extrabold tracking-tight">{title}</h2>
				<button
					class="btn size-9 shrink-0 rounded-full btn-ghost p-0"
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
