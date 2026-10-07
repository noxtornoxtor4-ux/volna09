<script lang="ts">
	import { BadgeCheck, Check, Plus, Search } from '@lucide/svelte';
	import { app } from '#lib/app.svelte.ts';
	import { toneClass } from '#lib/data.ts';
	import type { Organization } from '#lib/types.ts';

	/** selected: id выбранной организации, 'new' — добавить свою, '' — ещё не выбрано */
	let {
		selected = $bindable(''),
		draft = $bindable({ name: '', city: '', about: '' })
	}: {
		selected?: string;
		draft?: Pick<Organization, 'name' | 'city' | 'about'>;
	} = $props();

	let query = $state('');

	const list = $derived.by(() => {
		const q = query.trim().toLowerCase();
		return app.allOrgs.filter(
			(o) => !q || o.name.toLowerCase().includes(q) || o.city.toLowerCase().includes(q)
		);
	});
</script>

<div class="mt-5">
	<span class="label">Ваша организация</span>
	<label class="relative mb-2 block">
		<Search
			class="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted"
		/>
		<input
			class="input py-2.5 pl-10"
			type="search"
			placeholder="Найти по названию или городу"
			bind:value={query}
		/>
	</label>

	<ul class="max-h-64 space-y-1.5 overflow-y-auto pr-1" role="radiogroup" aria-label="Организация">
		{#each list as org (org.id)}
			{@const on = selected === org.id}
			<li>
				<button
					type="button"
					role="radio"
					aria-checked={on}
					class="flex w-full items-center gap-3 rounded-2xl border-2 p-2.5 text-left transition {on
						? 'border-accent bg-accent-soft'
						: 'border-transparent bg-surface-2 hover:border-accent/40'}"
					onclick={() => (selected = org.id)}
				>
					<span
						class="grid size-10 shrink-0 place-items-center rounded-xl text-xl {toneClass[org.tone]
							.bg}">{org.emoji}</span
					>
					<span class="min-w-0 flex-1">
						<span class="flex items-center gap-1 truncate text-sm font-bold">
							{org.name}
							{#if org.verified}<BadgeCheck
									class="size-4 shrink-0 text-accent-text"
									aria-label="Проверена"
								/>{/if}
						</span>
						<span class="block truncate text-xs text-muted"
							>{org.city}{org.verified ? '' : ' · на проверке'}</span
						>
					</span>
					<span
						class="grid size-6 shrink-0 place-items-center rounded-full border-2 {on
							? 'border-accent bg-accent text-accent-ink'
							: 'border-line'}"
					>
						{#if on}<Check class="size-3.5" />{/if}
					</span>
				</button>
			</li>
		{:else}
			<li class="rounded-2xl bg-surface-2 p-3 text-center text-sm text-muted">
				Не нашли «{query}» — добавьте организацию ниже.
			</li>
		{/each}
	</ul>

	<button
		type="button"
		role="radio"
		aria-checked={selected === 'new'}
		class="mt-1.5 flex w-full items-center gap-3 rounded-2xl border-2 border-dashed p-2.5 text-left text-sm font-bold transition {selected ===
		'new'
			? 'border-accent bg-accent-soft text-accent-text'
			: 'border-line text-muted hover:border-accent/50'}"
		onclick={() => {
			selected = 'new';
			if (!draft.name && query.trim()) draft.name = query.trim();
		}}
	>
		<span class="grid size-10 place-items-center rounded-xl bg-surface"
			><Plus class="size-5" /></span
		>
		Моей организации нет в списке
	</button>

	{#if selected === 'new'}
		<div class="mt-3 space-y-3 rounded-3xl bg-surface-2 p-4">
			<label class="block">
				<span class="label">Название организации</span>
				<input
					class="input bg-surface"
					placeholder="Например: Клуб «Добрые дела»"
					bind:value={draft.name}
				/>
			</label>
			<label class="block">
				<span class="label">Город</span>
				<input class="input bg-surface" placeholder="Бишкек" bind:value={draft.city} />
			</label>
			<label class="block">
				<span class="label">Чем занимается (необязательно)</span>
				<textarea class="min-h-16 input bg-surface" maxlength="240" bind:value={draft.about}
				></textarea>
			</label>
			<p class="text-xs text-muted">
				Новая организация получит отметку «проверена» после проверки документов платформой.
			</p>
		</div>
	{/if}
</div>
