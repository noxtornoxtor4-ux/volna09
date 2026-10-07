<script lang="ts">
	import { Check, Search } from '@lucide/svelte';
	import { app } from '#lib/app.svelte.ts';
	import { people } from '#lib/data.ts';
	import Avatar from './Avatar.svelte';

	/** multiple — выбор нескольких участников (группа); иначе один собеседник */
	let {
		selected = $bindable([]),
		multiple = true,
		exclude = [],
		onpick
	}: {
		selected?: string[];
		multiple?: boolean;
		exclude?: string[];
		onpick?: (id: string) => void;
	} = $props();

	let query = $state('');

	const candidates = $derived.by(() => {
		const q = query.trim().toLowerCase();
		const ids = [...people.map((p) => p.id), ...app.allOrgs.map((o) => o.id)].filter(
			(id) => id !== app.actorId && !exclude.includes(id)
		);
		return ids.filter((id) => !q || app.author(id).name.toLowerCase().includes(q));
	});

	function toggle(id: string) {
		if (!multiple) {
			onpick?.(id);
			return;
		}
		selected = selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id];
	}
</script>

<label class="relative mb-2 block">
	<Search
		class="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted"
	/>
	<input
		class="input py-2.5 pl-10"
		type="search"
		placeholder="Найти волонтёра или организацию"
		bind:value={query}
	/>
</label>
<ul class="max-h-72 space-y-1 overflow-y-auto">
	{#each candidates as id (id)}
		{@const a = app.author(id)}
		{@const on = selected.includes(id)}
		<li>
			<button
				type="button"
				class="flex w-full items-center gap-3 rounded-2xl p-2 text-left transition {on
					? 'bg-accent-soft'
					: 'hover:bg-surface-2'}"
				onclick={() => toggle(id)}
				aria-pressed={multiple ? on : undefined}
			>
				<Avatar {id} size="sm" />
				<span class="min-w-0 flex-1">
					<span class="block truncate text-sm font-semibold">{a.name}</span>
					<span class="block text-xs text-muted">{a.isOrg ? 'Организация' : 'Волонтёр'}</span>
				</span>
				{#if multiple}
					<span
						class="grid size-6 place-items-center rounded-full border-2 {on
							? 'border-accent bg-accent text-accent-ink'
							: 'border-line'}"
					>
						{#if on}<Check class="size-3.5" />{/if}
					</span>
				{/if}
			</button>
		</li>
	{:else}
		<li class="p-4 text-center text-sm text-muted">Никого не нашли</li>
	{/each}
</ul>
