<script lang="ts">
	import { tr } from '#lib/i18n.ts';
	import { ChevronLeft } from '@lucide/svelte';
	import { app } from '#lib/app.svelte.ts';
	import Avatar from '#lib/components/Avatar.svelte';

	let tab = $state<'followers' | 'following'>('followers');
	const ids = $derived(tab === 'followers' ? app.myFollowers : app.following);
</script>

<svelte:head><title>{tr('Подписчики — Волна')}</title></svelte:head>

<a href="/profile" class="mb-4 btn btn-ghost"><ChevronLeft class="size-4" /> {tr('Профиль')}</a>

<div class="mx-auto max-w-xl">
	<div class="mb-4 grid grid-cols-2 rounded-2xl bg-surface-2 p-1 text-sm font-bold">
		<button
			class="rounded-xl py-2.5 {tab === 'followers' ? 'bg-surface shadow-sm' : 'text-muted'}"
			onclick={() => (tab = 'followers')}
		>
			{tr('Подписчики · {0}', app.myFollowers.length)}
		</button>
		<button
			class="rounded-xl py-2.5 {tab === 'following' ? 'bg-surface shadow-sm' : 'text-muted'}"
			onclick={() => (tab = 'following')}
			disabled={app.isOrg}
		>
			{tr('Подписки · {0}', app.isOrg ? 0 : app.following.length)}
		</button>
	</div>

	<ul class="divide-y divide-line card">
		{#each ids as id (id)}
			{@const a = app.author(id)}
			<li class="flex items-center gap-3 p-3">
				<a href="/u?id={id}" class="flex min-w-0 flex-1 items-center gap-3">
					<Avatar {id} />
					<div class="min-w-0">
						<div class="truncate font-bold">{a.name}</div>
						<div class="text-xs text-muted">
							{a.isOrg
								? tr('Организация')
								: tr(
										'{0} · {1} ч волонтёрства',
										tr(app.person(id)?.city ?? ''),
										app.verifiedHoursOf(id)
									)}
						</div>
					</div>
				</a>
				{#if !app.isOrg}
					<button
						class="btn py-2 text-xs {app.isFollowing(id) ? 'btn-ghost' : 'btn-soft'}"
						onclick={() => app.toggleFollow(id)}
					>
						{app.isFollowing(id) ? tr('Вы подписаны') : tr('Подписаться')}
					</button>
				{/if}
			</li>
		{:else}
			<li class="p-6 text-center text-sm text-muted">{tr('Здесь пока никого нет.')}</li>
		{/each}
	</ul>
</div>
