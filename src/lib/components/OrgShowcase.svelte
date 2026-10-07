<script lang="ts">
	import { tr } from '#lib/i18n.ts';
	import { ArrowRight, Globe, Megaphone, Plus, Send } from '@lucide/svelte';
	import { app } from '#lib/app.svelte.ts';
	import { toneClass } from '#lib/data.ts';
	import { formatDate } from '#lib/format.ts';

	/** Витрина организации: баннер, ссылки, анонсы и открытые наборы волонтёров */
	let { orgId }: { orgId: string } = $props();

	const own = $derived(orgId === app.myOrgId);
	const profile = $derived(own ? app.orgProfile : undefined);
	const canEdit = $derived(own && app.isOrg);
	const recruitments = $derived(
		app.upcoming.filter((o) => o.orgId === orgId && o.category === 'recruitment')
	);
	const telegramHref = (handle: string) => `https://t.me/${handle.replace(/^@/, '')}`;
	const websiteHref = (site: string) => (site.startsWith('http') ? site : `https://${site}`);
</script>

{#if profile?.website || profile?.telegram}
	<div class="mt-3 flex flex-wrap gap-2">
		{#if profile.website}
			<a href={websiteHref(profile.website)} target="_blank" rel="noreferrer" class="chip py-1.5"
				><Globe class="size-4" />{profile.website}</a
			>
		{/if}
		{#if profile.telegram}
			<a href={telegramHref(profile.telegram)} target="_blank" rel="noreferrer" class="chip py-1.5"
				><Send class="size-4" />{profile.telegram}</a
			>
		{/if}
	</div>
{/if}

{#if profile?.banner}
	{@const banner = profile.banner}
	<section
		class="relative mt-4 overflow-hidden rounded-[2rem] p-5 sm:p-6 {toneClass[banner.tone].bg}"
	>
		<div
			class="pointer-events-none absolute -top-12 -right-10 size-48 rounded-full bg-surface/50 blur-2xl"
		></div>
		<div class="relative">
			<span
				class="inline-flex items-center gap-1.5 rounded-full bg-surface/80 px-3 py-1 text-xs font-bold {toneClass[
					banner.tone
				].text}"
			>
				<Megaphone class="size-3.5" />
				{tr('Важно')}
			</span>
			<h2 class="mt-3 text-xl leading-tight font-extrabold sm:text-2xl">{banner.title}</h2>
			<p class="mt-1 max-w-xl text-[15px]">{banner.text}</p>
			{#if banner.ctaLabel && banner.ctaHref}
				<a href={banner.ctaHref} class="mt-4 btn bg-ink text-bg"
					>{banner.ctaLabel} <ArrowRight class="size-4" /></a
				>
			{/if}
		</div>
	</section>
{/if}

{#if recruitments.length || canEdit}
	<section class="mt-5">
		<div class="mb-3 flex items-center justify-between">
			<h2 class="text-lg font-extrabold">{tr('Наборы волонтёров')}</h2>
			{#if canEdit}
				<a href="/cabinet/new?category=recruitment" class="btn btn-soft py-2 text-sm"
					><Plus class="size-4" /> {tr('Опубликовать набор')}</a
				>
			{/if}
		</div>
		<div class="-mx-4 no-scrollbar flex gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
			{#each recruitments as o (o.id)}
				<a href="/o?id={o.id}" class="w-64 shrink-0 card p-4 transition hover:border-accent">
					<span class="grid size-12 place-items-center rounded-2xl text-2xl {toneClass[o.tone].bg}"
						>{o.emoji}</span
					>
					<div class="mt-2 line-clamp-2 font-bold">{o.title}</div>
					<div class="mt-1 text-xs text-muted">
						{tr(
							'{0} · до {1} · {2}/{3}',
							tr(o.city),
							formatDate(o.deadline ?? o.date),
							app.taken(o.id),
							o.spots
						)}
					</div>
				</a>
			{:else}
				<p class="text-sm text-muted">{tr('Открытых наборов пока нет.')}</p>
			{/each}
		</div>
	</section>
{/if}

{#if profile?.announcements?.length}
	<section class="mt-5">
		<h2 class="mb-3 text-lg font-extrabold">{tr('Анонсы')}</h2>
		<ul class="space-y-2">
			{#each profile.announcements as news (news.id)}
				<li class="card p-4">
					<div class="flex items-baseline justify-between gap-3">
						<span class="font-bold">{news.title}</span>
						<span class="shrink-0 text-xs text-muted">{formatDate(news.date)}</span>
					</div>
					<p class="mt-1 text-sm">{news.text}</p>
				</li>
			{/each}
		</ul>
	</section>
{/if}
