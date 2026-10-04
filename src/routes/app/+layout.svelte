<script lang="ts">
	import { page } from '$app/state';
	import { FileText, LayoutDashboard, MessageSquareWarning, Wallet } from '@lucide/svelte';
	import Logo from '#lib/components/Logo.svelte';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	const links = [
		{ href: '/app', label: 'Freelancer OS', icon: LayoutDashboard },
		{ href: '/app/scope', label: 'Scope Defender', icon: MessageSquareWarning },
		{ href: '/app/escrow', label: 'Эскроу', icon: Wallet },
		{ href: '/app/contracts', label: 'Договоры', icon: FileText }
	];
</script>

<div class="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
	<aside
		class="sticky top-0 z-40 flex items-center gap-4 border-b border-white/6 bg-ink-950/90 px-4 py-3 backdrop-blur lg:h-screen lg:flex-col lg:items-stretch lg:border-r lg:border-b-0 lg:px-4 lg:py-6 print:hidden"
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
		<div class="hidden rounded-xl bg-white/4 p-3 lg:flex lg:items-center lg:gap-3">
			<div
				class="grid size-9 place-items-center rounded-full bg-linear-to-br from-brand-500 to-accent-500 font-semibold text-ink-950"
			>
				А
			</div>
			<div class="text-sm">
				<div class="font-semibold text-white">Алекс Фрилансер</div>
				<div class="text-xs text-slate-500">Pro · демо-аккаунт</div>
			</div>
		</div>
	</aside>
	<main class="px-4 py-8 lg:px-10">
		{@render children()}
	</main>
</div>
