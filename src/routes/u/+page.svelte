<script lang="ts">
	import { page } from '$app/state';
	import { ChevronLeft } from '@lucide/svelte';
	import { app } from '#lib/app.svelte.ts';
	import AwardShelves from '#lib/components/AwardShelves.svelte';
	import OpportunityCard from '#lib/components/OpportunityCard.svelte';
	import PostGrid from '#lib/components/PostGrid.svelte';
	import ProfileHeader from '#lib/components/ProfileHeader.svelte';
	import { ME, toneClass } from '#lib/data.ts';
	import { plural } from '#lib/format.ts';

	const id = $derived(page.url.searchParams.get('id') ?? '');
	const org = $derived(app.org(id));
	const person = $derived(org ? undefined : app.person(id));
	const isSelf = $derived(id === ME || id === app.myOrgId);
	let tab = $state<'posts' | 'awards' | 'events'>('posts');
</script>

<svelte:head><title>{org?.name ?? person?.name ?? 'Профиль'} — Волна</title></svelte:head>

<button class="mb-4 btn btn-ghost" onclick={() => history.back()}
	><ChevronLeft class="size-4" /> Назад</button
>

{#snippet follow()}
	{#if !isSelf && !app.isOrg}
		<button
			class="btn {app.isFollowing(id) ? 'btn-ghost' : 'btn-primary'}"
			onclick={() => app.toggleFollow(id)}
		>
			{app.isFollowing(id) ? 'Вы подписаны' : 'Подписаться'}
		</button>
	{:else if isSelf}
		<a href="/profile" class="btn btn-ghost">Мой профиль</a>
	{/if}
{/snippet}

{#if org}
	{@const events = app.upcoming.filter((o) => o.orgId === org.id)}
	<ProfileHeader
		id={org.id}
		name={org.name}
		subtitle="Организация · {org.city}"
		bio={org.about}
		cover={org.id === app.myOrgId ? app.orgProfile.cover : undefined}
		tone={org.tone}
		verified={org.verified}
		stats={[
			{ label: 'подписчиков', value: app.followersCount(org.id) },
			{ label: 'мероприятий', value: app.opportunities.filter((o) => o.orgId === org.id).length },
			{ label: 'скоро', value: events.length },
			{ label: 'наград выдано', value: app.awards.filter((a) => a.orgId === org.id).length }
		]}
		actions={follow}
	/>
	<div class="mt-5 mb-4 grid grid-cols-2 rounded-2xl bg-surface-2 p-1 text-sm font-bold">
		<button
			class="rounded-xl py-2.5 {tab !== 'events' ? 'bg-surface shadow-sm' : 'text-muted'}"
			onclick={() => (tab = 'posts')}>Публикации</button
		>
		<button
			class="rounded-xl py-2.5 {tab === 'events' ? 'bg-surface shadow-sm' : 'text-muted'}"
			onclick={() => (tab = 'events')}>Мероприятия · {events.length}</button
		>
	</div>
	{#if tab === 'events'}
		<div class="grid gap-4 md:grid-cols-2">
			{#each events as o (o.id)}<OpportunityCard opportunity={o} />{:else}<p
					class="text-sm text-muted"
				>
					Скоро здесь появятся мероприятия.
				</p>{/each}
		</div>
	{:else}
		<PostGrid posts={app.postsBy(org.id)} />
	{/if}
{:else if person}
	<ProfileHeader
		id={person.id}
		name={person.name}
		subtitle="{person.age} {plural(person.age, 'год', 'года', 'лет')} · {person.city}"
		bio={person.bio}
		cover={person.id === ME ? app.profile.cover : undefined}
		tone={person.tone}
		stats={[
			{ label: 'подписчиков', value: app.followersCount(person.id) },
			{ label: 'часов', value: app.verifiedHoursOf(person.id) },
			{ label: 'проектов', value: app.participationOf(person.id).length },
			{
				label: 'сертификатов',
				value: app.awardsOf(person.id).filter((a) => a.type === 'certificate').length
			}
		]}
		actions={follow}
	/>
	<div class="mt-3 flex flex-wrap gap-2">
		{#each person.interests as tid (tid)}
			{@const t = app.topic(tid)}
			{#if t}<span
					class="rounded-full px-3 py-1 text-xs font-semibold {toneClass[t.tone].bg} {toneClass[
						t.tone
					].text}">{t.emoji} {t.label}</span
				>{/if}
		{/each}
	</div>
	<div class="mt-5 mb-4 grid grid-cols-2 rounded-2xl bg-surface-2 p-1 text-sm font-bold">
		<button
			class="rounded-xl py-2.5 {tab !== 'awards' ? 'bg-surface shadow-sm' : 'text-muted'}"
			onclick={() => (tab = 'posts')}>Публикации</button
		>
		<button
			class="rounded-xl py-2.5 {tab === 'awards' ? 'bg-surface shadow-sm' : 'text-muted'}"
			onclick={() => (tab = 'awards')}>Награды · {app.awardsOf(person.id).length}</button
		>
	</div>
	{#if tab === 'awards'}
		<AwardShelves awards={app.awardsOf(person.id)} />
	{:else}
		<PostGrid posts={app.postsBy(person.id)} />
	{/if}
{:else}
	<div class="card p-10 text-center">
		<p class="text-lg font-bold">Профиль не найден</p>
		<a href="/search" class="mt-4 btn btn-primary">К поиску</a>
	</div>
{/if}
