<script lang="ts">
	import {
		Calendar,
		ClipboardCheck,
		Flame,
		GraduationCap,
		ListChecks,
		Repeat,
		Target
	} from '@lucide/svelte';
	import PageHeader from '#lib/components/PageHeader.svelte';
	import ScoreChart from '#lib/components/exam/ScoreChart.svelte';
	import TopicMastery from '#lib/components/exam/TopicMastery.svelte';
	import { exams, topics } from '#lib/exam/catalog.ts';
	import { canGenerate } from '#lib/exam/generators.ts';
	import { progress } from '#lib/exam/progress.svelte.ts';
	import type { ExamId } from '#lib/exam/types.ts';

	let exam = $state<ExamId>('ort');

	const info = $derived(exams[exam]);
	const history = $derived(progress.history(exam));
	const forecast = $derived(progress.forecast(exam));
	const first = $derived(history[0]?.score);
	const plan = $derived(progress.weakTopics.filter(canGenerate).slice(0, 3));

	// ОРТ проходит в мае: считаем дни до ближайшего 20 мая
	const daysToOrt = $derived.by(() => {
		const now = new Date();
		let exam = new Date(now.getFullYear(), 4, 20);
		if (exam < now) exam = new Date(now.getFullYear() + 1, 4, 20);
		return Math.ceil((exam.getTime() - now.getTime()) / 864e5);
	});
</script>

<PageHeader
	title="Привет, Айгерим 👋"
	subtitle="Вот как продвигается подготовка. Каждый тест и задача тренажёра обновляют прогноз."
>
	{#snippet actions()}
		<a href="/app/test" class="btn btn-primary"
			><ClipboardCheck class="size-4" /> Пройти пробный тест</a
		>
	{/snippet}
</PageHeader>

<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
	<div class="card p-5 glow">
		<div class="flex items-center justify-between text-sm text-slate-400">
			Прогноз {info.name}
			<GraduationCap class="size-4 text-brand-400" />
		</div>
		<div class="mt-2 font-display text-3xl text-white">{forecast ?? '—'}</div>
		{#if forecast && first}
			<div class="mt-1 text-xs text-emerald-300">+{forecast - first} с первого теста</div>
		{/if}
	</div>
	<div class="card p-5">
		<div class="flex items-center justify-between text-sm text-slate-400">
			До цели <Target class="size-4 text-accent-400" />
		</div>
		<div class="mt-2 font-display text-3xl text-white">
			{forecast ? Math.max(info.target - forecast, 0) : '—'}
		</div>
		<div class="mt-1 text-xs text-slate-500">баллов до {info.target}</div>
	</div>
	<div class="card p-5">
		<div class="flex items-center justify-between text-sm text-slate-400">
			Решено задач <ListChecks class="size-4 text-brand-400" />
		</div>
		<div class="mt-2 font-display text-3xl text-white">{progress.solvedCount}</div>
		<div class="mt-1 text-xs text-slate-500">в тестах и тренажёре</div>
	</div>
	<div class="card p-5">
		<div class="flex items-center justify-between text-sm text-slate-400">
			До ОРТ <Calendar class="size-4 text-brand-400" />
		</div>
		<div class="mt-2 font-display text-3xl text-white">{daysToOrt}</div>
		<div class="mt-1 text-xs text-slate-500">дней</div>
	</div>
</div>

<div class="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
	<section class="card p-6">
		<div class="flex flex-wrap items-center justify-between gap-3">
			<h2 class="font-semibold text-white">График прогресса</h2>
			<div class="flex rounded-xl bg-white/5 p-1">
				{#each Object.values(exams) as e (e.id)}
					<button
						class="rounded-lg px-3 py-1 text-sm {exam === e.id
							? 'bg-brand-500 text-ink-950'
							: 'text-slate-400'}"
						onclick={() => (exam = e.id)}>{e.name}</button
					>
				{/each}
			</div>
		</div>
		<div class="mt-4">
			<ScoreChart attempts={history} {exam} />
		</div>
	</section>

	<section class="card p-6">
		<h2 class="flex items-center gap-2 font-semibold text-white">
			<Flame class="size-4 text-accent-400" /> План на сегодня
		</h2>
		{#if plan.length}
			<p class="mt-1 text-sm text-slate-400">
				ИИ выбрал темы, которые быстрее всего поднимут балл.
			</p>
			<ol class="mt-4 space-y-2">
				{#each plan as topic, i (topic)}
					<li>
						<a
							href="/app/practice?topic={topic}"
							class="flex items-center gap-3 rounded-xl bg-white/4 px-4 py-3 transition hover:bg-white/8"
						>
							<span class="font-display text-sm text-accent-400">{i + 1}</span>
							<span class="flex-1 text-sm text-white">{topics[topic].name}</span>
							<span class="text-xs text-slate-500">10 задач</span>
							<Repeat class="size-4 text-brand-300" />
						</a>
					</li>
				{/each}
			</ol>
		{:else}
			<p class="mt-3 text-sm text-slate-400">
				Слабых тем не осталось. Пройдите полный пробный тест, чтобы проверить себя.
			</p>
		{/if}
	</section>
</div>

<section class="mt-6 card p-6">
	<div class="flex items-center justify-between">
		<h2 class="font-semibold text-white">Карта знаний</h2>
		<span class="text-xs text-slate-500">сначала самые слабые темы</span>
	</div>
	<div class="mt-5">
		<TopicMastery items={progress.mastery} />
	</div>
</section>
