<script lang="ts">
	import { tr } from '#lib/i18n.ts';
	import { Award, Briefcase, FolderOpen, Pencil, Plus, Settings } from '@lucide/svelte';
	import { app } from '#lib/app.svelte.ts';
	import PostComposer from '#lib/components/PostComposer.svelte';
	import OrgShowcase from '#lib/components/OrgShowcase.svelte';
	import PostGrid from '#lib/components/PostGrid.svelte';
	import ProfileHeader from '#lib/components/ProfileHeader.svelte';
	import { ME, toneClass } from '#lib/data.ts';
	import { plural } from '#lib/format.ts';

	const certificates = $derived(app.myAwards.filter((a) => a.type === 'certificate').length);
	const issuedHours = $derived(
		app.orgHours.filter((h) => h.status === 'verified').reduce((s, h) => s + h.hours, 0)
	);

	let composing = $state(false);
</script>

<svelte:head><title>{tr('Профиль — Волна')}</title></svelte:head>

{#if app.isOrg}
	<ProfileHeader
		id={app.myOrgId}
		name={app.orgProfile.name}
		subtitle={tr('Организация · {0}', tr(app.orgProfile.city))}
		bio={app.orgProfile.about}
		look={app.orgProfile}
		tone={app.myOrg.tone}
		verified={app.myOrg.verified}
		stats={[
			{
				label: tr('подписчиков'),
				value: app.followersCount(app.myOrgId),
				href: '/profile/followers'
			},
			{ label: tr('мероприятий'), value: app.orgOpportunities.length, href: '/cabinet' },
			{
				label: tr('волонтёров'),
				value: app.orgVolunteers.length,
				href: '/cabinet?folder=volunteers'
			},
			{ label: tr('часов выдано'), value: issuedHours, href: '/cabinet?folder=hours' }
		]}
	>
		{#snippet actions()}
			<button class="btn btn-primary" onclick={() => (composing = true)}
				><Plus class="size-4" /> <span class="hidden sm:inline">{tr('Создать')}</span></button
			>
			<a href="/profile/edit" class="btn btn-ghost"
				><Pencil class="size-4" /> <span class="hidden sm:inline">{tr('Редактировать')}</span></a
			>
			<a href="/settings" class="btn size-11 btn-ghost p-0 lg:hidden" aria-label={tr('Настройки')}
				><Settings class="size-4" /></a
			>
		{/snippet}
	</ProfileHeader>

	<OrgShowcase orgId={app.myOrgId} />

	<div class="mt-4 grid grid-cols-2 gap-3">
		<a href="/cabinet" class="flex items-center gap-3 card p-4 transition hover:border-accent">
			<span class="grid size-11 place-items-center rounded-2xl bg-pastel-blue text-pastel-blue-ink"
				><Briefcase class="size-5" /></span
			>
			<span class="font-bold">{tr('Кабинет')}</span>
		</a>
		<a href="/awards" class="flex items-center gap-3 card p-4 transition hover:border-accent">
			<span
				class="grid size-11 place-items-center rounded-2xl bg-pastel-yellow text-pastel-yellow-ink"
				><Award class="size-5" /></span
			>
			<span class="font-bold">{tr('Награды')}</span>
		</a>
	</div>

	<div class="mt-6 mb-3 flex items-center justify-between">
		<h2 class="text-lg font-extrabold">{tr('Публикации')}</h2>
		<button class="btn btn-soft py-2 text-sm" onclick={() => (composing = true)}
			><Plus class="size-4" /> {tr('Фото или видео')}</button
		>
	</div>
	<PostGrid posts={app.postsBy(app.myOrgId)} />
{:else}
	<ProfileHeader
		id={ME}
		name={app.profile.name}
		subtitle="{app.profile.age} {plural(app.profile.age, 'год', 'года', 'лет')} · {tr(
			app.profile.city
		)}"
		bio={app.profile.bio}
		look={app.profile}
		tone={app.profile.tone}
		stats={[
			{ label: tr('подписчиков'), value: app.followersCount(ME), href: '/profile/followers' },
			{ label: tr('часов'), value: app.verifiedHours, href: '/portfolio?tab=hours' },
			{ label: tr('проектов'), value: app.participation.length, href: '/portfolio?tab=projects' },
			{ label: tr('сертификатов'), value: certificates, href: '/awards' }
		]}
	>
		{#snippet actions()}
			<button class="btn btn-primary" onclick={() => (composing = true)}
				><Plus class="size-4" /> <span class="hidden sm:inline">{tr('Создать')}</span></button
			>
			<a href="/profile/edit" class="btn btn-ghost"
				><Pencil class="size-4" /> <span class="hidden sm:inline">{tr('Редактировать')}</span></a
			>
			<a href="/settings" class="btn size-11 btn-ghost p-0 lg:hidden" aria-label={tr('Настройки')}
				><Settings class="size-4" /></a
			>
		{/snippet}
	</ProfileHeader>

	<div class="mt-3 flex flex-wrap gap-2">
		{#each app.profile.interests as id (id)}
			{@const t = app.topic(id)}
			{#if t}<span
					class="rounded-full px-3 py-1 text-xs font-semibold {toneClass[t.tone].bg} {toneClass[
						t.tone
					].text}">{t.emoji} {tr(t.label)}</span
				>{/if}
		{/each}
	</div>

	<div class="mt-4 grid grid-cols-2 gap-3">
		<a href="/portfolio" class="flex items-center gap-3 card p-4 transition hover:border-accent">
			<span class="grid size-11 place-items-center rounded-2xl bg-pastel-blue text-pastel-blue-ink"
				><FolderOpen class="size-5" /></span
			>
			<div>
				<div class="font-bold">{tr('Портфолио')}</div>
				<div class="text-xs text-muted">{tr('проекты, часы, организации')}</div>
			</div>
		</a>
		<a href="/awards" class="flex items-center gap-3 card p-4 transition hover:border-accent">
			<span
				class="grid size-11 place-items-center rounded-2xl bg-pastel-yellow text-pastel-yellow-ink"
				><Award class="size-5" /></span
			>
			<div>
				<div class="font-bold">{tr('Кабинет наград')}</div>
				<div class="text-xs text-muted">{tr('{0} наград', app.myAwards.length)}</div>
			</div>
		</a>
	</div>

	<div class="mt-6 mb-3 flex items-center justify-between">
		<h2 class="text-lg font-extrabold">{tr('Публикации')}</h2>
		<button class="btn btn-soft py-2 text-sm" onclick={() => (composing = true)}
			><Plus class="size-4" /> {tr('Фото или видео')}</button
		>
	</div>
	<PostGrid posts={app.postsBy(ME)} />
{/if}

<PostComposer bind:open={composing} />
