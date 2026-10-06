<script lang="ts">
	import { CalendarDays, Hourglass, MapPin, Send } from '@lucide/svelte';
	import { app } from '#lib/app.svelte.ts';
	import { toneClass } from '#lib/data.ts';
	import { formatDate } from '#lib/format.ts';
	import type { Answers, FormQuestion } from '#lib/types.ts';
	import Modal from './Modal.svelte';

	const o = $derived(app.applyingId ? app.opportunity(app.applyingId) : undefined);
	let answers = $state<Answers>({});

	// Новая анкета — новые ответы, с подстановкой данных из профиля
	$effect(() => {
		if (!o) return;
		const prefill = {
			name: app.profile.name,
			age: String(app.profile.age),
			city: app.profile.city
		};
		answers = Object.fromEntries(
			o.questions.map((q) => [q.id, q.prefill ? prefill[q.prefill] : q.type === 'multi' ? [] : ''])
		);
	});

	const missing = $derived(
		o?.questions.filter((q) => {
			const v = answers[q.id];
			return q.required && (Array.isArray(v) ? !v.length : !String(v ?? '').trim());
		}) ?? []
	);

	function toggleMulti(q: FormQuestion, option: string) {
		const current = (answers[q.id] as string[]) ?? [];
		answers[q.id] = current.includes(option)
			? current.filter((x) => x !== option)
			: [...current, option];
	}

	function submit(e: SubmitEvent) {
		e.preventDefault();
		if (!o || missing.length) return;
		app.apply(o.id, $state.snapshot(answers));
		app.applyingId = null;
	}
</script>

<Modal title="Анкета участника" bind:open={() => !!o, (v) => !v && (app.applyingId = null)}>
	{#if o}
		<div class="mb-5 flex items-center gap-3 rounded-3xl p-3 {toneClass[o.tone].bg}">
			<span class="grid size-14 shrink-0 place-items-center rounded-2xl bg-surface/70 text-3xl"
				>{o.emoji}</span
			>
			<div class="min-w-0 text-sm">
				<div class="font-bold">{o.title}</div>
				<div class="mt-0.5 flex flex-wrap gap-x-3 text-muted">
					<span class="flex items-center gap-1"
						><CalendarDays class="size-3.5" />{formatDate(o.date)}</span
					>
					<span class="flex items-center gap-1"><MapPin class="size-3.5" />{o.place}</span>
					<span class="flex items-center gap-1"><Hourglass class="size-3.5" />+{o.hours} ч</span>
				</div>
			</div>
		</div>

		<form class="space-y-4" onsubmit={submit}>
			{#each o.questions as q (q.id)}
				<div>
					<span class="label">{q.label}{q.required ? ' *' : ''}</span>
					{#if q.type === 'text'}
						<input class="input" bind:value={answers[q.id]} />
					{:else if q.type === 'textarea'}
						<textarea class="min-h-24 input" bind:value={answers[q.id]}></textarea>
					{:else if q.type === 'choice'}
						<div class="flex flex-wrap gap-2">
							{#each q.options ?? [] as option (option)}
								<button
									type="button"
									class="chip {answers[q.id] === option
										? 'border-accent bg-accent-soft text-accent-text'
										: ''}"
									onclick={() => (answers[q.id] = option)}
									aria-pressed={answers[q.id] === option}>{option}</button
								>
							{/each}
						</div>
					{:else}
						<div class="flex flex-wrap gap-2">
							{#each q.options ?? [] as option (option)}
								{@const on = ((answers[q.id] as string[]) ?? []).includes(option)}
								<button
									type="button"
									class="chip {on ? 'border-accent bg-accent-soft text-accent-text' : ''}"
									onclick={() => toggleMulti(q, option)}
									aria-pressed={on}>{option}</button
								>
							{/each}
						</div>
					{/if}
				</div>
			{/each}
			<p class="text-xs text-muted">
				Анкету увидит только организатор. Ответ придёт в уведомления.
			</p>
			<button class="btn w-full btn-primary py-3" disabled={missing.length > 0}>
				<Send class="size-4" />
				{missing.length ? `Заполните обязательные поля (${missing.length})` : 'Отправить анкету'}
			</button>
		</form>
	{/if}
</Modal>
