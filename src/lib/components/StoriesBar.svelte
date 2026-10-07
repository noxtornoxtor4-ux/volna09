<script lang="ts">
	import { tr } from '#lib/i18n.ts';
	import { Plus } from '@lucide/svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import { app } from '#lib/app.svelte.ts';
	import { toneClass, tones } from '#lib/data.ts';
	import type { Tone } from '#lib/types.ts';
	import Modal from './Modal.svelte';
	import StoryViewer from './StoryViewer.svelte';

	let viewing = $state<number | null>(null);
	let creating = $state(false);
	let draft = $state<{ label: string; emoji: string; tone: Tone }>({
		label: '',
		emoji: '🌍',
		tone: 'blue'
	});
	const seen = new SvelteSet<string>();

	const emojis = ['🌍', '🎨', '🧩', '🎵', '🏥', '🧓', '👶', '🚲', '🌊', '🔬', '🍲', '🏠'];
	const topics = $derived(app.storyTopics);

	function create(e: SubmitEvent) {
		e.preventDefault();
		if (!draft.label.trim()) return;
		app.addTopic({ ...draft, label: draft.label.trim() });
		draft = { label: '', emoji: '🌍', tone: 'blue' };
		creating = false;
	}
</script>

<div class="-mx-4 no-scrollbar flex gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
	<button
		class="flex w-[72px] shrink-0 flex-col items-center gap-1.5"
		onclick={() => (creating = true)}
	>
		<span
			class="grid size-[68px] place-items-center rounded-full border-2 border-dashed border-line bg-surface text-muted transition hover:border-accent hover:text-accent-text"
		>
			<Plus class="size-6" />
		</span>
		<span class="w-full truncate text-center text-xs font-semibold text-muted"
			>{tr('Своя тема')}</span
		>
	</button>

	{#each topics as topic, i (topic.id)}
		{@const count = app.byTopic(topic.id).length}
		{@const fresh = count > 0 && !seen.has(topic.id)}
		<button
			class="flex w-[72px] shrink-0 flex-col items-center gap-1.5"
			onclick={() => (viewing = i)}
		>
			<span
				class="grid size-[68px] place-items-center rounded-full p-[3px] {fresh
					? 'story-ring'
					: 'bg-line'}"
			>
				<span
					class="grid size-full place-items-center rounded-full border-[3px] border-bg text-[28px] {toneClass[
						topic.tone
					].bg}"
				>
					{topic.emoji}
				</span>
			</span>
			<span class="w-full truncate text-center text-xs font-semibold {fresh ? '' : 'text-muted'}"
				>{tr(topic.label)}</span
			>
		</button>
	{/each}
</div>

{#if viewing !== null}
	<StoryViewer
		{topics}
		start={viewing}
		onclose={() => (viewing = null)}
		onseen={(id) => seen.add(id)}
	/>
{/if}

<Modal bind:open={creating} title={tr('Новая тема')}>
	<form class="space-y-4" onsubmit={create}>
		<p class="text-sm text-muted">
			{tr('Тему увидят все волонтёры, а организаторы смогут отмечать ею свои мероприятия.')}
		</p>
		<label class="block">
			<span class="label">{tr('Название')}</span>
			<input
				class="input"
				required
				maxlength="24"
				placeholder={tr('Например: Помощь детям')}
				bind:value={draft.label}
			/>
		</label>
		<div>
			<span class="label">{tr('Иконка')}</span>
			<div class="flex flex-wrap gap-1.5">
				{#each emojis as e (e)}
					<button
						type="button"
						class="grid size-11 place-items-center rounded-2xl text-xl {draft.emoji === e
							? 'bg-accent-soft ring-2 ring-accent'
							: 'bg-surface-2'}"
						onclick={() => (draft.emoji = e)}>{e}</button
					>
				{/each}
			</div>
		</div>
		<div>
			<span class="label">{tr('Цвет')}</span>
			<div class="flex gap-2">
				{#each tones as t (t)}
					<button
						type="button"
						class="size-10 rounded-full border-2 {toneClass[t].bg} {draft.tone === t
							? 'border-ink'
							: 'border-transparent'}"
						onclick={() => (draft.tone = t)}
						aria-label={tr('Цвет {0}', t)}
					></button>
				{/each}
			</div>
		</div>
		<div class="flex items-center gap-3 rounded-2xl bg-surface-2 p-3">
			<span class="grid size-14 place-items-center rounded-full text-2xl {toneClass[draft.tone].bg}"
				>{draft.emoji}</span
			>
			<span class="font-bold">{draft.label || tr('Название темы')}</span>
		</div>
		<button class="btn w-full btn-primary">{tr('Создать тему')}</button>
	</form>
</Modal>
