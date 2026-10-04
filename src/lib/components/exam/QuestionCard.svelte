<script lang="ts">
	import { CircleCheck, CircleX } from '@lucide/svelte';
	import { letters, topics } from '#lib/exam/catalog.ts';
	import type { Question } from '#lib/exam/types.ts';

	let {
		question,
		selected = $bindable(null),
		revealed = false,
		number,
		onselect
	}: {
		question: Question;
		selected?: number | null;
		revealed?: boolean;
		number?: number;
		onselect?: (index: number) => void;
	} = $props();

	function choose(index: number) {
		if (revealed) return;
		selected = index;
		onselect?.(index);
	}

	function optionClass(index: number) {
		if (revealed) {
			if (index === question.correct) return 'border-emerald-400/70 bg-emerald-400/10 text-white';
			if (index === selected) return 'border-rose-400/70 bg-rose-400/10 text-white';
			return 'border-white/8 text-slate-500';
		}
		return index === selected
			? 'border-brand-400 bg-brand-500/15 text-white'
			: 'border-white/10 text-slate-200 hover:border-brand-400/60 hover:bg-white/4';
	}
</script>

<div class="space-y-4">
	<div class="flex items-center gap-2 text-xs text-slate-400">
		{#if number}<span class="font-display text-brand-300">№ {number}</span> ·{/if}
		<span>{topics[question.topic].section}</span> ·
		<span class="rounded-full bg-white/6 px-2 py-0.5">{topics[question.topic].name}</span>
	</div>

	{#if question.passage}
		<blockquote
			class="rounded-xl border-l-4 border-brand-500/60 bg-white/4 p-4 text-sm leading-relaxed text-slate-300"
		>
			{question.passage}
		</blockquote>
	{/if}

	<p class="font-display text-lg leading-snug text-white sm:text-xl">{question.text}</p>

	<div class="grid gap-2 sm:grid-cols-2">
		{#each question.options as option, index (index)}
			<button
				class="flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition {optionClass(
					index
				)}"
				disabled={revealed}
				onclick={() => choose(index)}
			>
				<span
					class="grid size-7 shrink-0 place-items-center rounded-lg bg-white/6 font-display text-xs {index ===
						selected && !revealed
						? 'bg-brand-500 text-ink-950'
						: ''}"
				>
					{letters[index]}
				</span>
				<span class="flex-1">{option}</span>
				{#if revealed && index === question.correct}
					<CircleCheck class="size-5 text-emerald-400" />
				{:else if revealed && index === selected}
					<CircleX class="size-5 text-rose-400" />
				{/if}
			</button>
		{/each}
	</div>
</div>
