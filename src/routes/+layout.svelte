<script lang="ts">
	import './layout.css';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import favicon from '#lib/assets/favicon.svg';
	import { app } from '#lib/app.svelte.ts';
	import AppShell from '#lib/components/AppShell.svelte';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	const isAuthPage = $derived(page.url.pathname === '/login');

	$effect(() => {
		document.documentElement.dataset.accent = app.accent;
		document.documentElement.dataset.mode = app.mode;
		document
			.querySelector('meta[name="theme-color"]')
			?.setAttribute('content', app.mode === 'dark' ? '#111319' : '#f6f8fc');
	});

	$effect(() => {
		if (!app.session && !isAuthPage) goto('/login', { replaceState: true });
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Волна — платформа для подростков-волонтёров</title>
	<meta
		name="description"
		content="Находи волонтёрские проекты, делись опытом, считай часы и собирай подтверждённое диджитал-портфолио."
	/>
</svelte:head>

{#if isAuthPage}
	{@render children()}
{:else if app.session}
	<AppShell>{@render children()}</AppShell>
{/if}
