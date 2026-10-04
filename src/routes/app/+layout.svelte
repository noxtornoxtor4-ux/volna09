<script lang="ts">
	import { page } from '$app/state';
	import { ChartLine, ClipboardCheck, Repeat } from '@lucide/svelte';
	import Logo from '#lib/components/Logo.svelte';
	import { progress } from '#lib/exam/progress.svelte.ts';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	const links = [
		{ href: '/app', label: 'Прогресс', icon: ChartLine },
		{ href: '/app/test', label: 'Пробный тест', icon: ClipboardCheck },
		{ href: '/app/practice', label: 'Тренажёр', icon: Repeat }
	];
</script>

<div class="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
	<aside
		class="sticky top-0 z-40 flex items-center gap-4 border-b border-white/6 bg-ink-950/90 px-4 py-3 backdrop-blur lg:h-screen lg:flex-col lg:items-stretch lg:border-r lg:border-b-0 lg:px-4 lg:py-6"
	>
		<div class="hidden lg:block lg:px-2"><Logo /></div>
		<nav class="flex flex-1 gap-1 overflow-x-auto lg:mt-8 lg:flex-col">
			{#each links as link (link.href)}
				{@const active = page.url.pathname === link.href}
				<a
					href={link.href}
					class="flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition {active
						? 'bg-brand-500/15 text-brand-300'
						: 'text-slate-400 hover:bg-white/5 hover:text-white'}"
				>
					<link.icon class="size-4" />
					{link.label}
				</a>
			{/each}
		</nav>
		<div class="hidden rounded-xl bg-white/4 p-3 lg:block">
			<div class="flex items-center gap-3">
				<div
					class="grid size-9 place-items-center rounded-full bg-linear-to-br from-brand-500 to-accent-500 font-semibold text-ink-950"
				>
					А
				</div>
				<div class="text-sm">
					<div class="font-semibold text-white">Айгерим</div>
					<div class="text-xs text-slate-500">11 класс · цель: грант</div>
				</div>
			</div>
			<button
				class="mt-3 text-xs text-slate-500 hover:text-slate-300"
				onclick={() => progress.reset()}
			>
				Сбросить демо-прогресс
			</button>
		</div>
	</aside>
	<main class="px-4 py-8 lg:px-10">
		{@render children()}
	</main>
</div>
