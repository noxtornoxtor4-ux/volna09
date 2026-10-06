<script lang="ts">
	import { page } from '$app/state';
	import {
		Award,
		Bell,
		Briefcase,
		CalendarDays,
		Compass,
		FolderOpen,
		MessagesSquare,
		Search,
		Settings,
		UserRound
	} from '@lucide/svelte';
	import type { Snippet } from 'svelte';
	import { fly } from 'svelte/transition';
	import { app } from '#lib/app.svelte.ts';
	import ApplySheet from './ApplySheet.svelte';
	import Avatar from './Avatar.svelte';
	import Logo from './Logo.svelte';

	let { children }: { children: Snippet } = $props();

	const main = $derived([
		app.isOrg
			? { href: '/cabinet', label: 'Кабинет', icon: Briefcase }
			: { href: '/', label: 'Главная', icon: Compass },
		{ href: '/feed', label: 'Лента', icon: MessagesSquare },
		{ href: '/calendar', label: 'Календарь', icon: CalendarDays },
		{ href: '/notifications', label: 'Уведомления', icon: Bell },
		{ href: '/profile', label: 'Профиль', icon: UserRound }
	]);

	const extra = $derived([
		{ href: '/search', label: 'Поиск', icon: Search },
		{ href: '/awards', label: 'Кабинет наград', icon: Award },
		...(app.isOrg ? [] : [{ href: '/portfolio', label: 'Портфолио', icon: FolderOpen }]),
		{ href: '/settings', label: 'Настройки', icon: Settings }
	]);

	const isActive = (href: string) =>
		href === '/' ? page.url.pathname === '/' : page.url.pathname.startsWith(href);
	const badge = $derived(app.unread);
</script>

<div class="min-h-dvh lg:grid lg:grid-cols-[264px_1fr]">
	<!-- Десктоп: боковое меню -->
	<aside
		class="sticky top-0 hidden h-dvh flex-col gap-6 overflow-y-auto border-r border-line bg-surface px-4 py-6 lg:flex"
	>
		<div class="px-2"><Logo /></div>
		<nav class="flex flex-col gap-1">
			{#each main as link (link.href)}
				<a
					href={link.href}
					class="flex items-center gap-3 rounded-2xl px-4 py-3 text-[15px] font-semibold transition {isActive(
						link.href
					)
						? 'bg-accent-soft text-accent-text'
						: 'text-muted hover:bg-surface-2 hover:text-ink'}"
				>
					<link.icon class="size-5" />
					<span class="flex-1">{link.label}</span>
					{#if link.href === '/notifications' && badge}
						<span class="rounded-full bg-accent px-2 py-0.5 text-xs text-accent-ink">{badge}</span>
					{/if}
				</a>
			{/each}
		</nav>
		<div class="h-px bg-line"></div>
		<nav class="flex flex-col gap-1">
			{#each extra as link (link.href)}
				<a
					href={link.href}
					class="flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-semibold transition {isActive(
						link.href
					)
						? 'bg-accent-soft text-accent-text'
						: 'text-muted hover:bg-surface-2 hover:text-ink'}"
				>
					<link.icon class="size-[18px]" />
					{link.label}
				</a>
			{/each}
		</nav>
		<a
			href="/settings?s=accounts"
			class="mt-auto flex items-center gap-3 rounded-2xl bg-surface-2 p-3 transition hover:brightness-95"
		>
			<Avatar id={app.actorId} />
			<div class="min-w-0 text-sm">
				<div class="truncate font-bold">{app.author(app.actorId).name}</div>
				<div class="text-xs text-muted">
					{app.isOrg ? 'Организация · сменить' : 'Волонтёр · сменить'}
				</div>
			</div>
		</a>
	</aside>

	<div class="min-w-0">
		<!-- Мобильная шапка: поиск и настройки в углу -->
		<header
			class="sticky top-0 z-30 flex items-center gap-2 border-b border-line bg-bg/85 px-4 py-2.5 backdrop-blur-lg lg:hidden"
		>
			<Logo />
			<a href="/search" class="ml-auto btn size-10 rounded-full btn-ghost p-0" aria-label="Поиск"
				><Search class="size-5" /></a
			>
			<a href="/settings" class="btn size-10 rounded-full btn-ghost p-0" aria-label="Настройки"
				><Settings class="size-5" /></a
			>
		</header>

		<main class="mx-auto w-full max-w-5xl px-4 pt-5 pb-28 sm:px-6 lg:px-10 lg:pt-10 lg:pb-12">
			{@render children()}
		</main>
	</div>

	<!-- Мобильная навигация: обычные кнопки-вкладки внизу экрана -->
	<nav
		class="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-line bg-surface/95 px-1 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-lg lg:hidden"
	>
		{#each main as link (link.href)}
			<a
				href={link.href}
				class="relative flex flex-col items-center gap-1 rounded-2xl py-1.5 text-[10.5px] font-semibold {isActive(
					link.href
				)
					? 'text-accent-text'
					: 'text-muted'}"
			>
				<span
					class="grid h-8 w-12 place-items-center rounded-full transition {isActive(link.href)
						? 'bg-accent-soft'
						: ''}"
				>
					<link.icon class="size-5" />
				</span>
				{link.label}
				{#if link.href === '/notifications' && badge}
					<span
						class="absolute top-0.5 right-[18%] grid min-w-4 place-items-center rounded-full bg-pastel-peach-ink px-1 text-[10px] leading-4 text-white"
						>{badge}</span
					>
				{/if}
			</a>
		{/each}
	</nav>

	<ApplySheet />

	{#if app.toast}
		{#key app.toast.id}
			<div
				class="fixed inset-x-4 bottom-24 z-[60] mx-auto w-fit max-w-sm rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-bg shadow-xl lg:bottom-8"
				role="status"
				in:fly={{ y: 16, duration: 200 }}
			>
				{app.toast.text}
			</div>
		{/key}
	{/if}
</div>
