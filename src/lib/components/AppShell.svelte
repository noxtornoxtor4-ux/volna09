<script lang="ts">
	import { page } from '$app/state';
	import {
		Briefcase,
		CircleCheck,
		Compass,
		MessagesSquare,
		Settings,
		UserRound
	} from '@lucide/svelte';
	import type { Snippet } from 'svelte';
	import { app } from '#lib/app.svelte.ts';
	import { ME } from '#lib/data.ts';
	import Avatar from './Avatar.svelte';
	import Logo from './Logo.svelte';

	let { children }: { children: Snippet } = $props();

	const links = [
		{ href: '/', label: 'Возможности', short: 'Главная', icon: Compass },
		{ href: '/feed', label: 'Лента опыта', short: 'Лента', icon: MessagesSquare },
		{ href: '/profile', label: 'Мой профиль', short: 'Профиль', icon: UserRound },
		{ href: '/organizer', label: 'Кабинет куратора', short: 'Кабинет', icon: Briefcase },
		{ href: '/settings', label: 'Настройки', short: 'Аккаунт', icon: Settings }
	];

	const isActive = (href: string) =>
		href === '/' ? page.url.pathname === '/' : page.url.pathname.startsWith(href);
	const newApplications = $derived(
		app.orgApplications.filter((a) => a.status === 'pending').length
	);
</script>

<div class="min-h-dvh lg:grid lg:grid-cols-[260px_1fr]">
	<!-- Десктоп: боковое меню -->
	<aside
		class="sticky top-0 hidden h-dvh flex-col gap-8 border-r border-line bg-surface px-5 py-6 lg:flex"
	>
		<Logo />
		<nav class="flex flex-col gap-1">
			{#each links as link (link.href)}
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
					{#if link.href === '/organizer' && newApplications}
						<span class="rounded-full bg-accent px-2 py-0.5 text-xs text-accent-ink"
							>{newApplications}</span
						>
					{/if}
				</a>
			{/each}
		</nav>
		<a href="/profile" class="mt-auto flex items-center gap-3 rounded-2xl bg-surface-2 p-3">
			<Avatar id={ME} />
			<div class="min-w-0 text-sm">
				<div class="truncate font-bold">{app.profile.name}</div>
				<div class="flex items-center gap-1 text-xs text-muted">
					<CircleCheck class="size-3.5 text-pastel-green-ink" />
					{app.verifiedHours} ч подтверждено
				</div>
			</div>
		</a>
	</aside>

	<div class="min-w-0">
		<!-- Мобильная шапка -->
		<header
			class="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-bg/85 px-4 py-3 backdrop-blur-lg lg:hidden"
		>
			<Logo />
			<a href="/profile" aria-label="Мой профиль"><Avatar id={ME} size="sm" /></a>
		</header>

		<main class="mx-auto w-full max-w-5xl px-4 pt-5 pb-28 sm:px-6 lg:px-10 lg:pt-10 lg:pb-12">
			{@render children()}
		</main>
	</div>

	<!-- Мобильная навигация: обычные кнопки-вкладки внизу экрана -->
	<nav
		class="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-line bg-surface/95 px-1 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-lg lg:hidden"
	>
		{#each links as link (link.href)}
			<a
				href={link.href}
				class="relative flex flex-col items-center gap-1 rounded-2xl py-1.5 text-[11px] font-semibold {isActive(
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
				{link.short}
				{#if link.href === '/organizer' && newApplications}
					<span class="absolute top-1 right-[22%] size-2 rounded-full bg-pastel-peach-ink"></span>
				{/if}
			</a>
		{/each}
	</nav>

	{#if app.toast}
		{#key app.toast.id}
			<div
				class="fixed inset-x-4 bottom-24 z-50 mx-auto w-fit max-w-sm rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-bg shadow-xl lg:bottom-8"
				role="status"
			>
				{app.toast.text}
			</div>
		{/key}
	{/if}
</div>
