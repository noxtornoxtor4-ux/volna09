<script lang="ts">
	import { ArrowDown, ArrowUp, Plus, RotateCcw, Trash, X } from '@lucide/svelte';
	import { defaultQuestions } from '#lib/data.ts';
	import type { FormQuestion, QuestionType } from '#lib/types.ts';

	let { questions = $bindable() }: { questions: FormQuestion[] } = $props();

	const types: Record<QuestionType, string> = {
		text: 'Короткий ответ',
		textarea: 'Развёрнутый ответ',
		choice: 'Один вариант',
		multi: 'Несколько вариантов'
	};

	function add() {
		questions.push({
			id: `q-${crypto.randomUUID().slice(0, 6)}`,
			label: '',
			type: 'text',
			required: false
		});
	}

	function move(index: number, delta: number) {
		const [q] = questions.splice(index, 1);
		questions.splice(index + delta, 0, q);
	}

	function setType(q: FormQuestion, type: QuestionType) {
		q.type = type;
		if ((type === 'choice' || type === 'multi') && !q.options?.length)
			q.options = ['Вариант 1', 'Вариант 2'];
	}
</script>

<div class="space-y-3">
	{#each questions as q, i (q.id)}
		<div class="rounded-3xl border border-line bg-surface-2 p-4">
			<div class="flex items-start gap-2">
				<span
					class="mt-2.5 grid size-6 shrink-0 place-items-center rounded-full bg-accent text-xs font-bold text-accent-ink"
					>{i + 1}</span
				>
				<input class="input bg-surface" placeholder="Текст вопроса" required bind:value={q.label} />
				<div class="flex shrink-0 flex-col">
					<button
						type="button"
						class="grid size-6 place-items-center text-muted hover:text-ink disabled:opacity-30"
						disabled={i === 0}
						onclick={() => move(i, -1)}
						aria-label="Выше"><ArrowUp class="size-4" /></button
					>
					<button
						type="button"
						class="grid size-6 place-items-center text-muted hover:text-ink disabled:opacity-30"
						disabled={i === questions.length - 1}
						onclick={() => move(i, 1)}
						aria-label="Ниже"><ArrowDown class="size-4" /></button
					>
				</div>
			</div>
			<div class="mt-3 flex flex-wrap items-center gap-2 pl-8">
				<select
					class="input w-auto bg-surface py-2"
					value={q.type}
					onchange={(e) => setType(q, e.currentTarget.value as QuestionType)}
					aria-label="Тип ответа"
				>
					{#each Object.entries(types) as [value, label] (value)}
						<option {value}>{label}</option>
					{/each}
				</select>
				<label class="flex items-center gap-2 text-sm font-semibold">
					<input
						type="checkbox"
						class="size-4 accent-[var(--accent-strong)]"
						bind:checked={q.required}
					/> Обязательный
				</label>
				<button
					type="button"
					class="ml-auto grid size-9 place-items-center rounded-xl text-muted hover:bg-surface hover:text-pastel-peach-ink"
					onclick={() => questions.splice(i, 1)}
					aria-label="Удалить вопрос"
				>
					<Trash class="size-4" />
				</button>
			</div>
			{#if q.type === 'choice' || q.type === 'multi'}
				<div class="mt-3 flex flex-wrap gap-2 pl-8">
					{#each { length: q.options?.length ?? 0 }, j (j)}
						<span
							class="flex items-center gap-1 rounded-full border border-line bg-surface pr-1 pl-3"
						>
							<input
								class="w-28 bg-transparent py-1.5 text-sm outline-none"
								bind:value={q.options![j]}
								aria-label="Вариант {j + 1}"
							/>
							<button
								type="button"
								class="grid size-6 place-items-center rounded-full text-muted hover:bg-surface-2"
								onclick={() => q.options!.splice(j, 1)}
								aria-label="Удалить вариант"><X class="size-3" /></button
							>
						</span>
					{/each}
					<button
						type="button"
						class="chip py-1.5"
						onclick={() => q.options!.push(`Вариант ${q.options!.length + 1}`)}
						><Plus class="size-3.5" /> вариант</button
					>
				</div>
			{/if}
		</div>
	{/each}
	<div class="flex flex-wrap gap-2">
		<button type="button" class="btn btn-soft" onclick={add}
			><Plus class="size-4" /> Добавить вопрос</button
		>
		<button type="button" class="btn btn-ghost" onclick={() => (questions = defaultQuestions())}
			><RotateCcw class="size-4" /> Шаблон</button
		>
	</div>
</div>
