<script lang="ts">
	import { getLocale, tr } from '#lib/i18n.ts';
	import './layout.css';
	import { beforeNavigate, goto } from '$app/navigation';
	import { page, updated } from '$app/state';
	import favicon from '#lib/assets/favicon.svg';
	import { app } from '#lib/app.svelte.ts';
	import AppShell from '#lib/components/AppShell.svelte';
	import ConsentGate from '#lib/components/ConsentGate.svelte';
	import Logo from '#lib/components/Logo.svelte';
	import { themeVarNames, themeVars } from '#lib/theme.ts';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	const isAuthPage = $derived(page.url.pathname === '/login');
	/** Страницы без входа: условия, конфиденциальность и проверка сертификатов */
	const isPublicPage = $derived(
		['/terms', '/privacy'].includes(page.url.pathname) || page.url.pathname.startsWith('/verify')
	);

	// Вышла новая версия — следующий переход загружает страницу заново, а не старый код из памяти
	beforeNavigate(({ willUnload, to }) => {
		if (updated.current && !willUnload && to?.url) location.href = to.url.href;
	});

	// Новый service worker взял управление — перезагружаемся на свежие файлы
	$effect(() => {
		if (!('serviceWorker' in navigator)) return;
		const hadController = !!navigator.serviceWorker.controller;
		const reload = () => hadController && location.reload();
		navigator.serviceWorker.addEventListener('controllerchange', reload);
		return () => navigator.serviceWorker.removeEventListener('controllerchange', reload);
	});

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
		// Свои цвета логотипа: значок и надпись
		for (const [name, value] of [
			['--brand-blue', app.logoColors?.icon],
			['--brand-navy', app.logoColors?.text]
		] as const) {
			if (value) root.style.setProperty(name, value);
			else root.style.removeProperty(name);
		}
		document
			.querySelector('meta[name="theme-color"]')
			?.setAttribute('content', app.customTheme?.bg ?? (app.isDark ? '#111319' : '#f6f8fc'));
	});

	$effect(() => {
		// Ждём ответа Firebase: вошедший пользователь не должен мелькнуть на экране входа
		if (app.ready && !app.session && !isAuthPage && !isPublicPage)
			goto('/login', { replace: true });
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

{#if isPublicPage}
	{@render children()}
{:else if !app.ready}
	<!-- Заставка, пока Firebase проверяет вход -->
	<div class="grid min-h-dvh place-items-center">
		<div class="animate-pulse"><Logo size={56} name={false} /></div>
	</div>
{:else if isAuthPage}
	{@render children()}
{:else if app.session}
	<AppShell>{@render children()}</AppShell>
	<!-- Согласие с условиями — один раз после первого входа -->
	{#if app.myPerson && !app.myPerson.consent}<ConsentGate />{/if}
{/if}
