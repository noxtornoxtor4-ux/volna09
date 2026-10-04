<script lang="ts">
	import { Lightbulb, LoaderCircle, Repeat, Send, Sparkles, TriangleAlert } from '@lucide/svelte';
	import { letters } from '#lib/exam/catalog.ts';
	import { askTutor, type TutorReply } from '#lib/exam/tutor.ts';
	import type { Question } from '#lib/exam/types.ts';

	let {
		question,
		selected,
		onsimilar
	}: { question: Question; selected: number | null; onsimilar?: () => void } = $props();

	let replies = $state<{ id: number; ask: string; reply: TutorReply }[]>([]);
	let draft = $state('');
	let loading = $state(false);

	const isCorrect = $derived(selected === question.correct);
	const mistake = $derived(selected !== null ? question.mistakes[selected] : undefined);

	// Новая задача — новый диалог с репетитором
	$effect(() => {
		void question.id;
		replies = [];
	});

	async function ask(message?: string) {
		if (loading) return;
		loading = true;
		const reply = await askTutor({
			question: $state.snapshot(question),
			chosen: selected,
			message
		});
		replies.push({ id: Date.now(), ask: message || 'Объясни проще', reply });
		draft = '';
		loading = false;
	}
</script>

<div class="space-y-3">
	{#if isCorrect}
		<div class="flex items-start gap-3 rounded-xl bg-emerald-400/10 p-4 text-sm text-emerald-200">
			<Sparkles class="mt-0.5 size-4 shrink-0" />
			<div>
				<b class="text-white">Верно!</b> Закрепим ход решения, чтобы на экзамене не сомневаться.
			</div>
		</div>
	{:else}
		<div class="flex items-start gap-3 rounded-xl bg-rose-400/10 p-4 text-sm text-rose-100">
			<TriangleAlert class="mt-0.5 size-4 shrink-0 text-rose-300" />
			<div>
				{#if selected === null}
					<b class="text-white">Нет ответа.</b> Правильный ответ: {letters[question.correct]}.
				{:else}
					<b class="text-white">Почему «{question.options[selected]}» — неверно:</b>
					{mistake}
				{/if}
			</div>
		</div>
	{/if}

	<div class="rounded-xl bg-white/4 p-4">
		<div class="mb-2 text-xs font-semibold tracking-wide text-brand-300 uppercase">
			Правильное решение
		</div>
		<ol class="space-y-1.5 text-sm text-slate-200">
			{#each question.solution as step, i (i)}
				<li class="flex gap-2"><span class="font-display text-brand-400">{i + 1}.</span>{step}</li>
			{/each}
		</ol>
	</div>

	{#each replies as r (r.id)}
		<div class="space-y-2">
			<div
				class="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-brand-500 px-3 py-2 text-sm text-ink-950"
			>
				{r.ask}
			</div>
			<div
				class="rounded-2xl rounded-bl-sm border border-accent-400/20 bg-accent-400/5 p-3 text-sm whitespace-pre-line text-slate-200"
			>
				<div class="mb-1 flex items-center gap-1.5 text-[11px] text-accent-400 uppercase">
					<Lightbulb class="size-3" /> ИИ-репетитор · {r.reply.source === 'ai'
						? 'OpenAI'
						: 'встроенный разбор'}
				</div>
				{r.reply.text}
			</div>
		</div>
	{/each}

	<div class="flex flex-wrap gap-2">
		<button class="btn btn-ghost py-2" disabled={loading} onclick={() => ask()}>
			<Lightbulb class="size-4 text-accent-400" /> Объясни проще
		</button>
		{#if onsimilar}
			<button class="btn btn-primary py-2" onclick={onsimilar}>
				<Repeat class="size-4" /> Похожее задание
			</button>
		{/if}
	</div>

	<form
		class="flex gap-2"
		onsubmit={(e) => {
			e.preventDefault();
			if (draft.trim()) ask(draft.trim());
		}}
	>
		<input
			class="input"
			placeholder="Спросите репетитора: «а почему нельзя просто…?»"
			bind:value={draft}
			disabled={loading}
		/>
		<button class="btn btn-ghost px-3" disabled={loading || !draft.trim()} aria-label="Спросить">
			{#if loading}<LoaderCircle class="size-4 animate-spin" />{:else}<Send class="size-4" />{/if}
		</button>
	</form>
</div>
