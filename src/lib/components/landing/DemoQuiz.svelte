<script lang="ts">
	import { questionBank } from '#lib/exam/bank.ts';
	import { exams } from '#lib/exam/catalog.ts';
	import { generateSimilar } from '#lib/exam/generators.ts';
	import type { ExamId, Question } from '#lib/exam/types.ts';
	import ExplanationPanel from '#lib/components/exam/ExplanationPanel.svelte';
	import QuestionCard from '#lib/components/exam/QuestionCard.svelte';

	const samples: Record<ExamId, string> = {
		ort: 'ort-fractions-1',
		ege: 'ege-percent-1',
		sat: 'sat-percent-1'
	};
	const sample = (exam: ExamId) => questionBank.find((q) => q.id === samples[exam])!;

	let exam = $state<ExamId>('ort');
	let question = $state<Question>(sample('ort'));
	let selected = $state<number | null>(null);
	let revealed = $state(false);

	function show(next: Question) {
		question = next;
		selected = null;
		revealed = false;
	}
</script>

<div class="mx-auto max-w-3xl card p-6 glow sm:p-8">
	<div class="mb-6 flex flex-wrap items-center justify-between gap-3">
		<div class="flex rounded-xl bg-white/5 p-1">
			{#each Object.values(exams) as e (e.id)}
				<button
					class="rounded-lg px-4 py-1.5 text-sm {exam === e.id
						? 'bg-brand-500 text-ink-950'
						: 'text-slate-400'}"
					onclick={() => {
						exam = e.id;
						show(sample(e.id));
					}}>{e.flag} {e.name}</button
				>
			{/each}
		</div>
		<span class="text-xs text-slate-500">Выберите ответ, даже неверный 😉</span>
	</div>

	<QuestionCard {question} bind:selected {revealed} onselect={() => (revealed = true)} />

	{#if revealed}
		<div class="mt-6 border-t border-white/6 pt-6">
			<ExplanationPanel
				{question}
				{selected}
				onsimilar={() => show(generateSimilar(question.topic, exam, question.text) ?? question)}
			/>
		</div>
	{/if}
</div>
