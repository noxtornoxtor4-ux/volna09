<script lang="ts">
	import { Menu, X } from '@lucide/svelte';
	import { navLinks } from '#lib/content.ts';
	import Logo from './Logo.svelte';

	let open = $state(false);
</script>

<header class="sticky top-0 z-50 border-b border-white/6 bg-ink-950/75 backdrop-blur-xl">
	<div class="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
		<Logo />
		<nav class="hidden items-center gap-7 text-sm text-slate-400 md:flex">
			{#each navLinks as link (link.href)}
				<a href={link.href} class="transition hover:text-white">{link.label}</a>
			{/each}
		</nav>
		<div class="hidden items-center gap-2 md:flex">
			<a href="/app" class="btn btn-primary py-2">Открыть кабинет</a>
		</div>
		<button class="text-white md:hidden" onclick={() => (open = !open)} aria-label="Меню">
			{#if open}<X />{:else}<Menu />{/if}
		</button>
	</div>
	{#if open}
		<nav class="flex flex-col gap-1 border-t border-white/6 px-4 py-3 md:hidden">
			{#each navLinks as link (link.href)}
				<a
					href={link.href}
					class="rounded-lg px-3 py-2 text-slate-300 hover:bg-white/5"
					onclick={() => (open = false)}>{link.label}</a
				>
			{/each}
			<a href="/app" class="mt-2 btn btn-primary">Открыть кабинет</a>
		</nav>
	{/if}
</header>
