<script lang="ts">
	import { Award, Briefcase, FolderOpen, Pencil, Settings } from '@lucide/svelte';
	import { app } from '#lib/app.svelte.ts';
	import PostGrid from '#lib/components/PostGrid.svelte';
	import ProfileHeader from '#lib/components/ProfileHeader.svelte';
	import { ME, MY_ORG, toneClass } from '#lib/data.ts';
	import { plural } from '#lib/format.ts';

	const certificates = $derived(app.myAwards.filter((a) => a.type === 'certificate').length);
	const issuedHours = $derived(
		app.orgHours.filter((h) => h.status === 'verified').reduce((s, h) => s + h.hours, 0)
	);
</script>

<svelte:head><title>Профиль — Волна</title></svelte:head>

{#if app.isOrg}
	<ProfileHeader
		id={MY_ORG}
		name={app.orgProfile.name}
		subtitle="Организация · {app.orgProfile.city}"
		bio={app.orgProfile.about}
		cover={app.orgProfile.cover}
		tone={app.myOrg.tone}
		verified={app.myOrg.verified}
		stats={[
			{ label: 'подписчиков', value: app.followersCount(MY_ORG), href: '/profile/followers' },
			{ label: 'мероприятий', value: app.orgOpportunities.length, href: '/cabinet' },
			{ label: 'волонтёров', value: app.orgVolunteers.length, href: '/cabinet?folder=volunteers' },
			{ label: 'часов выдано', value: issuedHours, href: '/cabinet?folder=hours' }
		]}
	>
		{#snippet actions()}
			<a href="/profile/edit" class="btn btn-ghost"
				><Pencil class="size-4" /> <span class="hidden sm:inline">Редактировать</span></a
			>
			<a href="/settings" class="btn size-11 btn-ghost p-0 lg:hidden" aria-label="Настройки"
				><Settings class="size-4" /></a
			>
		{/snippet}
	</ProfileHeader>

	<div class="mt-4 grid grid-cols-2 gap-3">
		<a href="/cabinet" class="flex items-center gap-3 card p-4 transition hover:border-accent">
			<span class="grid size-11 place-items-center rounded-2xl bg-pastel-blue text-pastel-blue-ink"
				><Briefcase class="size-5" /></span
			>
			<span class="font-bold">Кабинет</span>
		</a>
		<a href="/awards" class="flex items-center gap-3 card p-4 transition hover:border-accent">
			<span
				class="grid size-11 place-items-center rounded-2xl bg-pastel-yellow text-pastel-yellow-ink"
				><Award class="size-5" /></span
			>
			<span class="font-bold">Награды</span>
		</a>
	</div>

	<h2 class="mt-6 mb-3 text-lg font-extrabold">Публикации</h2>
	<PostGrid posts={app.postsBy(MY_ORG)} />
{:else}
	<ProfileHeader
		id={ME}
		name={app.profile.name}
		subtitle="{app.profile.age} {plural(app.profile.age, 'год', 'года', 'лет')} · {app.profile
			.city}"
		bio={app.profile.bio}
		cover={app.profile.cover}
		tone={app.profile.tone}
		stats={[
			{ label: 'подписчиков', value: app.followersCount(ME), href: '/profile/followers' },
			{ label: 'часов', value: app.verifiedHours, href: '/portfolio?tab=hours' },
			{ label: 'проектов', value: app.participation.length, href: '/portfolio?tab=projects' },
			{ label: 'сертификатов', value: certificates, href: '/awards' }
		]}
	>
		{#snippet actions()}
			<a href="/profile/edit" class="btn btn-ghost"
				><Pencil class="size-4" /> <span class="hidden sm:inline">Редактировать</span></a
			>
			<a href="/settings" class="btn size-11 btn-ghost p-0 lg:hidden" aria-label="Настройки"
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
					].text}">{t.emoji} {t.label}</span
				>{/if}
		{/each}
	</div>

	<div class="mt-4 grid grid-cols-2 gap-3">
		<a href="/portfolio" class="flex items-center gap-3 card p-4 transition hover:border-accent">
			<span class="grid size-11 place-items-center rounded-2xl bg-pastel-blue text-pastel-blue-ink"
				><FolderOpen class="size-5" /></span
			>
			<div>
				<div class="font-bold">Портфолио</div>
				<div class="text-xs text-muted">проекты, часы, организации</div>
			</div>
		</a>
		<a href="/awards" class="flex items-center gap-3 card p-4 transition hover:border-accent">
			<span
				class="grid size-11 place-items-center rounded-2xl bg-pastel-yellow text-pastel-yellow-ink"
				><Award class="size-5" /></span
			>
			<div>
				<div class="font-bold">Кабинет наград</div>
				<div class="text-xs text-muted">{app.myAwards.length} наград</div>
			</div>
		</a>
	</div>

	<h2 class="mt-6 mb-3 text-lg font-extrabold">Публикации</h2>
	<PostGrid posts={app.postsBy(ME)} />
{/if}
