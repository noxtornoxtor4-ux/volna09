<script lang="ts">
	import { page } from '$app/state';
	import { Flame, Target } from '@lucide/svelte';
	import PageHeader from '#lib/components/PageHeader.svelte';
	import ExplanationPanel from '#lib/components/exam/ExplanationPanel.svelte';
	import QuestionCard from '#lib/components/exam/QuestionCard.svelte';
	import { exams, topics } from '#lib/exam/catalog.ts';
	import { canGenerate, generateSimilar } from '#lib/exam/generators.ts';
	import { progress } from '#lib/exam/progress.svelte.ts';
	import type { ExamId, Question, TopicId } from '#lib/exam/types.ts';

	const allTopics = (Object.keys(topics) as TopicId[]).filter(canGenerate);
	const param = page.url.searchParams.get('topic') as TopicId | null;
	const examParam = page.url.searchParams.get('exam') as ExamId | null;

	const initialTopic: TopicId =
		param && canGenerate(param) ? param : (progress.weakTopics.find(canGenerate) ?? 'percent');
	let topic = $state<TopicId>(initialTopic);
	const exam: ExamId = examParam && examParam in exams ? examParam : 'ort';

	let question = $state<Question>(generateSimilar(initialTopic, exam)!);
	let selected = $state<number | null>(null);
	let revealed = $state(false);
	let session = $state({ correct: 0, total: 0, streak: 0 });

	const stat = $derived(progress.mastery.find((m) => m.topic === topic));
	const weak = $derived(new Set(progress.weakTopics));

	function next() {
		question = generateSimilar(topic, exam, question.text)!;
		selected = null;
		revealed = false;
	}

	function switchTopic(t: TopicId) {
		topic = t;
		next();
	}

	function answer(index: number) {
		const correct = index === question.correct;
		revealed = true;
		progress.logPractice(topic, correct);
		session.total += 1;
		if (correct) {
			session.correct += 1;
			session.streak += 1;
		} else {
			session.streak = 0;
		}
	}
</script>

<PageHeader
	title="Тренажёр слабых тем"
	subtitle="Каждая задача генерируется заново: новые числа, те же ловушки. Решайте, пока тема не станет зелёной."
/>

<div class="mb-6 flex flex-wrap gap-2">
	{#each allTopics as t (t)}
		<button
			class="rounded-full border px-3 py-1.5 text-sm transition {topic === t
				? 'border-brand-400 bg-brand-500/15 text-white'
				: 'border-white/10 text-slate-400 hover:text-white'}"
			onclick={() => switchTopic(t)}
		>
			{#if weak.has(t)}<span
					class="mr-1 inline-block size-1.5 rounded-full bg-rose-400 align-middle"
				></span>{/if}
			{topics[t].name}
		</button>
	{/each}
</div>

<div class="grid gap-6 xl:grid-cols-[1fr_280px]">
	<section class="space-y-6 card p-6">
		<QuestionCard {question} bind:selected {revealed} onselect={answer} />
		{#if revealed}
			<div class="border-t border-white/6 pt-6">
				<ExplanationPanel {question} {selected} onsimilar={next} />
			</div>
		{/if}
	</section>

	<aside class="space-y-4">
		<div class="card p-5">
			<div class="flex items-center gap-2 text-sm text-slate-400">
				<Target class="size-4 text-brand-400" />
				{topics[topic].name}
			</div>
			<div class="mt-2 font-display text-4xl text-white">
				{stat ? Math.round(stat.accuracy * 100) : 0}%
			</div>
			<div class="text-xs text-slate-500">точность по теме за всё время</div>
			<div class="mt-3 h-2 overflow-hidden rounded-full bg-white/8">
				<div
					class="h-full rounded-full transition-all duration-700 {stat && stat.accuracy >= 0.6
						? 'bg-emerald-400'
						: 'bg-rose-400'}"
					style="width: {(stat?.accuracy ?? 0) * 100}%"
				></div>
			</div>
			<div class="mt-1 text-[11px] text-slate-500">зелёная зона — от 60%</div>
		</div>
		<div class="grid grid-cols-2 gap-3 card p-5 text-center">
			<div>
				<div class="font-display text-2xl text-white">{session.correct}/{session.total}</div>
				<div class="text-xs text-slate-500">за сессию</div>
			</div>
			<div>
				<div class="flex items-center justify-center gap-1 font-display text-2xl text-accent-400">
					<Flame class="size-5" />{session.streak}
				</div>
				<div class="text-xs text-slate-500">подряд верно</div>
			</div>
		</div>
	</aside>
</div>
