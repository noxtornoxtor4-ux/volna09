<script lang="ts">
	import { getLocale, tr } from '#lib/i18n.ts';
	import './layout.css';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import favicon from '#lib/assets/favicon.svg';
	import { app } from '#lib/app.svelte.ts';
	import AppShell from '#lib/components/AppShell.svelte';
	import Logo from '#lib/components/Logo.svelte';
	import { themeVarNames, themeVars } from '#lib/theme.ts';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	const isAuthPage = $derived(page.url.pathname === '/login');

	// Режим «Системная» следует за настройкой устройства
	$effect(() => {
		const query = matchMedia('(prefers-color-scheme: dark)');
		const sync = () => (app.systemDark = query.matches);
		sync();
		query.addEventListener('change', sync);
		return () => query.removeEventListener('change', sync);
	});

	$effect(() => {
		const root = document.documentElement;
		root.dataset.accent = app.accent;
		root.dataset.mode = app.isDark ? 'dark' : 'light';
		root.lang = getLocale();
		// Своя палитра переопределяет дизайн-токены сразу на всех экранах
		const vars = app.customTheme ? themeVars(app.customTheme) : {};
		for (const name of themeVarNames) root.style.removeProperty(name);
		for (const [name, value] of Object.entries(vars)) root.style.setProperty(name, value);
		document
			.querySelector('meta[name="theme-color"]')
			?.setAttribute('content', app.customTheme?.bg ?? (app.isDark ? '#111319' : '#f6f8fc'));
	});

	$effect(() => {
		// Ждём ответа Firebase: вошедший пользователь не должен мелькнуть на экране входа
		if (app.ready && !app.session && !isAuthPage) goto('/login', { replace: true });
		if (app.ready && app.session && isAuthPage)
			goto(app.isOrg ? '/cabinet' : '/', { replace: true });
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>{tr('Волна — платформа для подростков-волонтёров')}</title>
	<meta
		name="description"
		content={tr(
			'Находи волонтёрские проекты, делись опытом, считай часы и собирай подтверждённое диджитал-портфолио.'
		)}
	/>
</svelte:head>

{#if !app.ready}
	<!-- Заставка, пока Firebase проверяет вход -->
	<div class="grid min-h-dvh place-items-center">
		<div class="animate-pulse"><Logo size={56} name={false} /></div>
	</div>
{:else if isAuthPage}
	{@render children()}
{:else if app.session}
	<AppShell>{@render children()}</AppShell>
{/if}
