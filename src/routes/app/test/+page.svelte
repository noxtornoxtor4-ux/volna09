<script lang="ts">
	import { goto } from '$app/navigation';
	import { onDestroy } from 'svelte';
	import {
		ChevronLeft,
		ChevronRight,
		CircleCheck,
		CircleX,
		Flag,
		RotateCcw,
		Timer,
		TrendingUp
	} from '@lucide/svelte';
	import PageHeader from '#lib/components/PageHeader.svelte';
	import ExplanationPanel from '#lib/components/exam/ExplanationPanel.svelte';
	import QuestionCard from '#lib/components/exam/QuestionCard.svelte';
	import { questionsFor } from '#lib/exam/bank.ts';
	import { exams, topics } from '#lib/exam/catalog.ts';
	import { progress, summarize } from '#lib/exam/progress.svelte.ts';
	import type { Attempt, ExamId, Question, TopicId } from '#lib/exam/types.ts';

	let phase = $state<'start' | 'running' | 'result'>('start');
	let exam = $state<ExamId>('ort');
	let questions = $state<Question[]>([]);
	let answers = $state<(number | null)[]>([]);
	let current = $state(0);
	let secondsLeft = $state(0);
	let result = $state<Attempt | null>(null);
	let previous = $state<Attempt | null>(null);
	let openReview = $state<number | null>(null);
	let timer: ReturnType<typeof setInterval> | undefined;

	const answered = $derived(answers.filter((a) => a !== null).length);
	const clock = $derived(
		`${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, '0')}`
	);

	function start(id: ExamId) {
		exam = id;
		questions = [...questionsFor(id)].sort(() => Math.random() - 0.5);
		answers = questions.map(() => null);
		current = 0;
		secondsLeft = exams[id].durationMinutes * 60;
		phase = 'running';
		clearInterval(timer);
		timer = setInterval(() => {
			secondsLeft -= 1;
			if (secondsLeft <= 0) finish();
		}, 1000);
	}

	function finish() {
		clearInterval(timer);
		previous = progress.history(exam).at(-1) ?? null;
		result = summarize(exam, $state.snapshot(questions), $state.snapshot(answers));
		progress.addAttempt(result);
		openReview = answers.findIndex((a, i) => a !== questions[i].correct);
		phase = 'result';
	}

	onDestroy(() => clearInterval(timer));
</script>

<svelte:head>
	{#if phase === 'running'}
		<title>{exams[exam].name}: задание {current + 1} — TestBoost AI</title>
	{/if}
</svelte:head>

{#if phase === 'start'}
	<PageHeader
		title="Пробный тест"
		subtitle="Формат и таймер как на настоящем экзамене. После теста ИИ разберёт каждую ошибку."
	/>
	<div class="grid gap-4 md:grid-cols-3">
		{#each Object.values(exams) as e (e.id)}
			<button
				class="group card p-6 text-left transition hover:-translate-y-1 hover:border-brand-500/50"
				onclick={() => start(e.id)}
			>
				<div class="text-3xl">{e.flag}</div>
				<h2 class="mt-3 font-display text-2xl text-white">{e.name}</h2>
				<p class="text-sm text-slate-400">{e.full}</p>
				<ul class="mt-4 space-y-1 text-sm text-slate-300">
					<li>{questionsFor(e.id).length} заданий · {e.durationMinutes} мин</li>
					<li>Шкала {e.minScore}–{e.maxScore}</li>
				</ul>
				<span class="mt-5 btn w-full btn-primary">Начать</span>
			</button>
		{/each}
	</div>
	<p class="mt-6 text-sm text-slate-500">
		Демо-версия: сокращённые варианты. В полной версии ОРТ — 5 разделов и 150+ заданий.
	</p>
{:else if phase === 'running'}
	{@const q = questions[current]}
	<div class="mb-6 flex flex-wrap items-center justify-between gap-3">
		<div>
			<h1 class="font-display text-xl text-white">{exams[exam].full}</h1>
			<p class="text-sm text-slate-400">Отвечено {answered} из {questions.length}</p>
		</div>
		<div class="flex items-center gap-3">
			<span
				class="flex items-center gap-2 rounded-xl px-4 py-2 font-display text-lg {secondsLeft < 60
					? 'bg-rose-500/15 text-rose-300'
					: 'bg-white/6 text-white'}"
			>
				<Timer class="size-4" />
				{clock}
			</span>
			<button class="btn btn-primary" onclick={finish}><Flag class="size-4" /> Завершить</button>
		</div>
	</div>

	<div class="grid gap-6 xl:grid-cols-[1fr_260px]">
		<section class="card p-6">
			<QuestionCard question={q} number={current + 1} bind:selected={answers[current]} />
			<div class="mt-8 flex justify-between">
				<button class="btn btn-ghost" disabled={current === 0} onclick={() => (current -= 1)}>
					<ChevronLeft class="size-4" /> Назад
				</button>
				{#if current < questions.length - 1}
					<button class="btn btn-primary" onclick={() => (current += 1)}>
						Далее <ChevronRight class="size-4" />
					</button>
				{:else}
					<button class="btn btn-primary" onclick={finish}>Завершить тест</button>
				{/if}
			</div>
		</section>
		<aside class="h-fit card p-5">
			<h2 class="text-sm font-semibold text-white">Навигация</h2>
			<div class="mt-4 grid grid-cols-5 gap-2">
				{#each { length: questions.length }, i (i)}
					<button
						class="aspect-square rounded-lg text-sm font-semibold transition {i === current
							? 'ring-2 ring-brand-400'
							: ''} {answers[i] !== null
							? 'bg-brand-500 text-ink-950'
							: 'bg-white/6 text-slate-400 hover:bg-white/10'}"
						onclick={() => (current = i)}
						aria-label="Задание {i + 1}">{i + 1}</button
					>
				{/each}
			</div>
		</aside>
	</div>
{:else if result}
	{@const info = exams[exam]}
	{@const delta = previous ? result.score - previous.score : null}
	<PageHeader
		title="Результат: {info.name}"
		subtitle="Разберите ошибки, пока решение свежо в памяти."
	>
		{#snippet actions()}
			<button class="btn btn-ghost" onclick={() => (phase = 'start')}
				><RotateCcw class="size-4" /> Ещё раз</button
			>
			<a href="/app" class="btn btn-primary"><TrendingUp class="size-4" /> К графику</a>
		{/snippet}
	</PageHeader>

	<div class="grid gap-4 md:grid-cols-[1fr_2fr]">
		<div class="card p-6 text-center glow">
			<div class="text-sm text-slate-400">Ваш балл</div>
			<div class="mt-2 font-display text-6xl font-extrabold text-white">{result.score}</div>
			<div class="text-sm text-slate-500">из {info.maxScore}</div>
			{#if delta !== null}
				<div
					class="mt-3 inline-block rounded-full px-3 py-1 text-sm font-semibold {delta >= 0
						? 'bg-emerald-400/15 text-emerald-300'
						: 'bg-rose-400/15 text-rose-300'}"
				>
					{delta >= 0 ? '+' : ''}{delta} к прошлому тесту
				</div>
			{/if}
			<div class="mt-4 text-sm text-slate-400">
				Верно {Math.round(result.accuracy * 100)}% заданий
			</div>
		</div>
		<div class="card p-6">
			<h2 class="font-semibold text-white">По темам</h2>
			<ul class="mt-4 grid gap-2 sm:grid-cols-2">
				{#each Object.entries(result.topics) as [topic, stat] (topic)}
					<li class="flex items-center justify-between rounded-xl bg-white/4 px-4 py-2.5 text-sm">
						<span class="text-slate-200">{topics[topic as TopicId].name}</span>
						<span class={stat!.correct === stat!.total ? 'text-emerald-300' : 'text-rose-300'}
							>{stat!.correct}/{stat!.total}</span
						>
					</li>
				{/each}
			</ul>
		</div>
	</div>

	<h2 class="mt-10 mb-4 font-display text-xl text-white">Разбор заданий</h2>
	<ol class="space-y-3">
		{#each questions as q, i (q.id)}
			{@const ok = answers[i] === q.correct}
			<li class="overflow-hidden card">
				<button
					class="flex w-full items-center gap-3 px-5 py-4 text-left"
					onclick={() => (openReview = openReview === i ? null : i)}
				>
					{#if ok}<CircleCheck class="size-5 shrink-0 text-emerald-400" />{:else}<CircleX
							class="size-5 shrink-0 text-rose-400"
						/>{/if}
					<span class="font-display text-sm text-slate-500">№ {i + 1}</span>
					<span class="flex-1 truncate text-sm text-slate-200">{q.text}</span>
					<span class="text-xs text-slate-500">{topics[q.topic].name}</span>
				</button>
				{#if openReview === i}
					<div class="space-y-5 border-t border-white/6 p-5">
						<QuestionCard question={q} selected={answers[i]} revealed />
						<ExplanationPanel
							question={q}
							selected={answers[i]}
							onsimilar={() => goto(`/app/practice?topic=${q.topic}&exam=${exam}`)}
						/>
					</div>
				{/if}
			</li>
		{/each}
	</ol>
{/if}
