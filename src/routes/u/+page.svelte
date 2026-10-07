<script lang="ts">
	import { tr } from '#lib/i18n.ts';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { ChevronLeft, MessageCircle } from '@lucide/svelte';
	import { app } from '#lib/app.svelte.ts';
	import AwardShelves from '#lib/components/AwardShelves.svelte';
	import CertificatesBlock from '#lib/components/CertificatesBlock.svelte';
	import OpportunityCard from '#lib/components/OpportunityCard.svelte';
	import OrgShowcase from '#lib/components/OrgShowcase.svelte';
	import PostGrid from '#lib/components/PostGrid.svelte';
	import ProfileHeader from '#lib/components/ProfileHeader.svelte';
	import SkillsBlock from '#lib/components/SkillsBlock.svelte';
	import { personMeta } from '#lib/format.ts';

	const id = $derived(page.url.searchParams.get('id') ?? '');
	const org = $derived(app.org(id));
	const person = $derived(org ? undefined : app.person(id));
	const isSelf = $derived(id === app.me || id === app.myOrgId);
	let tab = $state<'posts' | 'awards' | 'events'>('posts');
</script>

<svelte:head
	><title>{tr('{0} — Волна', org?.name ?? person?.name ?? tr('Профиль'))}</title></svelte:head
>

<button class="mb-4 btn btn-ghost" onclick={() => history.back()}
	><ChevronLeft class="size-4" /> {tr('Назад')}</button
>

{#snippet follow()}
	{#if !isSelf}
		<button class="btn btn-ghost" onclick={() => goto(`/messages?c=${app.startDm(id)}`)}>
			<MessageCircle class="size-4" /> <span class="hidden sm:inline">{tr('Написать')}</span>
		</button>
	{/if}
	{#if !isSelf && !app.isOrg}
		<button
			class="btn {app.isFollowing(id) ? 'btn-ghost' : 'btn-primary'}"
			onclick={() => app.toggleFollow(id)}
		>
			{app.isFollowing(id) ? tr('Вы подписаны') : tr('Подписаться')}
		</button>
	{:else if isSelf}
		<a href="/profile" class="btn btn-ghost">{tr('Мой профиль')}</a>
	{/if}
{/snippet}

{#if org}
	{@const events = app.upcoming.filter((o) => o.orgId === org.id)}
	<ProfileHeader
		id={org.id}
		name={org.name}
		subtitle={tr('Организация · {0}', tr(org.city))}
		bio={org.about}
		look={org}
		tone={org.tone}
		verified={org.verified}
		stats={[
			{ label: tr('подписчиков'), value: app.followersCount(org.id) },
			{
				label: tr('мероприятий'),
				value: app.opportunities.filter((o) => o.orgId === org.id).length
			},
			{ label: tr('скоро'), value: events.length },
			{ label: tr('наград выдано'), value: app.awards.filter((a) => a.orgId === org.id).length }
		]}
		actions={follow}
	/>
	<OrgShowcase orgId={org.id} />
	<div class="mt-5 mb-4 grid grid-cols-2 rounded-2xl bg-surface-2 p-1 text-sm font-bold">
		<button
			class="rounded-xl py-2.5 {tab !== 'events' ? 'bg-surface shadow-sm' : 'text-muted'}"
			onclick={() => (tab = 'posts')}>{tr('Публикации')}</button
		>
		<button
			class="rounded-xl py-2.5 {tab === 'events' ? 'bg-surface shadow-sm' : 'text-muted'}"
			onclick={() => (tab = 'events')}>{tr('Мероприятия · {0}', events.length)}</button
		>
	</div>
	{#if tab === 'events'}
		<div class="grid gap-4 md:grid-cols-2">
			{#each events as o (o.id)}<OpportunityCard opportunity={o} />{:else}<p
					class="text-sm text-muted"
				>
					{tr('Скоро здесь появятся мероприятия.')}
				</p>{/each}
		</div>
	{:else}
		<PostGrid posts={app.postsBy(org.id)} />
	{/if}
{:else if person}
	<ProfileHeader
		id={person.id}
		name={person.name}
		subtitle={personMeta(person.age, person.city)}
		bio={person.bio}
		look={person}
		tone={person.tone}
		stats={[
			{ label: tr('подписчиков'), value: app.followersCount(person.id) },
			{ label: tr('часов'), value: app.verifiedHoursOf(person.id) },
			{ label: tr('проектов'), value: app.participationOf(person.id).length },
			{
				label: tr('сертификатов'),
				value: app.awardsOf(person.id).filter((a) => a.type === 'certificate').length
			}
		]}
		actions={follow}
	/>
	<SkillsBlock personId={person.id} editable={person.id === app.me} />
	<CertificatesBlock personId={person.id} editable={person.id === app.me} />
	<div class="mt-5 mb-4 grid grid-cols-2 rounded-2xl bg-surface-2 p-1 text-sm font-bold">
		<button
			class="rounded-xl py-2.5 {tab !== 'awards' ? 'bg-surface shadow-sm' : 'text-muted'}"
			onclick={() => (tab = 'posts')}>{tr('Публикации')}</button
		>
		<button
			class="rounded-xl py-2.5 {tab === 'awards' ? 'bg-surface shadow-sm' : 'text-muted'}"
			onclick={() => (tab = 'awards')}>{tr('Награды · {0}', app.awardsOf(person.id).length)}</button
		>
	</div>
	{#if tab === 'awards'}
		<AwardShelves awards={app.awardsOf(person.id)} />
	{:else}
		<PostGrid posts={app.postsBy(person.id)} />
	{/if}
{:else}
	<div class="card p-10 text-center">
		<p class="text-lg font-bold">{tr('Профиль не найден')}</p>
		<a href="/search" class="mt-4 btn btn-primary">{tr('К поиску')}</a>
	</div>
{/if}
