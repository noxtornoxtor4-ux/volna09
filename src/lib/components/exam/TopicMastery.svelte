<script lang="ts">
	import { Repeat } from '@lucide/svelte';
	import { topics } from '#lib/exam/catalog.ts';
	import { canGenerate } from '#lib/exam/generators.ts';
	import type { TopicId } from '#lib/exam/types.ts';

	let { items }: { items: { topic: TopicId; correct: number; total: number; accuracy: number }[] } =
		$props();

	const color = (accuracy: number) =>
		accuracy < 0.4
			? 'bg-rose-400'
			: accuracy < 0.6
				? 'bg-amber-400'
				: accuracy < 0.8
					? 'bg-brand-400'
					: 'bg-emerald-400';
</script>

<ul class="space-y-3">
	{#each items as item (item.topic)}
		<li class="flex items-center gap-3">
			<div class="w-40 shrink-0 text-sm">
				<div class="text-slate-200">{topics[item.topic].name}</div>
				<div class="text-[11px] text-slate-500">{item.correct} из {item.total} верно</div>
			</div>
			<div class="h-2.5 flex-1 overflow-hidden rounded-full bg-white/8">
				<div
					class="h-full rounded-full transition-all duration-700 {color(item.accuracy)}"
					style="width: {Math.max(item.accuracy * 100, 4)}%"
				></div>
			</div>
			<span class="w-10 text-right text-sm font-semibold text-white"
				>{Math.round(item.accuracy * 100)}%</span
			>
			{#if canGenerate(item.topic)}
				<a
					href="/app/practice?topic={item.topic}"
					class="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-white/8 hover:text-brand-300"
					aria-label="Тренировать тему {topics[item.topic].name}"
					title="Тренировать"
				>
					<Repeat class="size-4" />
				</a>
			{/if}
		</li>
	{/each}
</ul>
