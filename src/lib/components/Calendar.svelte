<script module lang="ts">
	export type Mark = 'event' | 'pending' | 'done' | 'photo';
</script>

<script lang="ts">
	import { ChevronLeft, ChevronRight } from '@lucide/svelte';
	import { day } from '#lib/data.ts';

	let {
		selected = $bindable(day(0)),
		marks
	}: { selected?: string; marks: Record<string, Mark[]> } = $props();

	const today = day(0);
	const now = new Date(`${today}T00:00:00`);
	let cursor = $state(new Date(now.getFullYear(), now.getMonth(), 1));

	const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
	const markClass: Record<Mark, string> = {
		event: 'bg-pastel-blue-ink',
		pending: 'bg-pastel-yellow-ink',
		done: 'bg-pastel-green-ink',
		photo: 'bg-pastel-peach-ink'
	};
	const legend: [Mark, string][] = [
		['event', 'участие подтверждено'],
		['pending', 'заявка на рассмотрении'],
		['done', 'часы подтверждены'],
		['photo', 'есть фото']
	];

	const title = $derived(cursor.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' }));
	const cells = $derived.by(() => {
		const year = cursor.getFullYear();
		const month = cursor.getMonth();
		const offset = (new Date(year, month, 1).getDay() + 6) % 7;
		const total = new Date(year, month + 1, 0).getDate();
		return [
			...Array.from({ length: offset }, () => null),
			...Array.from({ length: total }, (_, i) =>
				new Date(year, month, i + 1).toLocaleDateString('sv-SE')
			)
		];
	});

	function shift(months: number) {
		cursor = new Date(cursor.getFullYear(), cursor.getMonth() + months, 1);
	}
</script>

<div>
	<div class="mb-4 flex items-center justify-between">
		<button
			class="btn size-10 rounded-full btn-ghost p-0"
			onclick={() => shift(-1)}
			aria-label="Предыдущий месяц"><ChevronLeft class="size-5" /></button
		>
		<span class="text-lg font-extrabold capitalize">{title}</span>
		<button
			class="btn size-10 rounded-full btn-ghost p-0"
			onclick={() => shift(1)}
			aria-label="Следующий месяц"><ChevronRight class="size-5" /></button
		>
	</div>
	<div class="grid grid-cols-7 gap-1 text-center">
		{#each weekdays as w (w)}
			<span class="pb-1 text-xs font-semibold text-muted">{w}</span>
		{/each}
		{#each cells as date, i (date ?? `empty-${i}`)}
			{#if date}
				{@const dayMarks = [...new Set(marks[date] ?? [])]}
				{@const highlighted = dayMarks.includes('event')}
				<button
					class="relative flex aspect-square flex-col items-center justify-center rounded-2xl text-sm font-bold transition {selected ===
					date
						? 'bg-accent text-accent-ink shadow-md'
						: highlighted
							? 'bg-pastel-blue text-pastel-blue-ink'
							: date === today
								? 'bg-accent-soft text-accent-text'
								: 'hover:bg-surface-2'} {date < today && !dayMarks.length && selected !== date
						? 'text-muted'
						: ''}"
					onclick={() => (selected = date)}
					aria-pressed={selected === date}
					aria-label={new Date(`${date}T00:00:00`).toLocaleDateString('ru-RU', {
						day: 'numeric',
						month: 'long'
					})}
				>
					{Number(date.slice(-2))}
					{#if dayMarks.length}
						<span class="absolute bottom-1 flex gap-0.5">
							{#each dayMarks as m (m)}<span class="size-1.5 rounded-full {markClass[m]}"
								></span>{/each}
						</span>
					{/if}
				</button>
			{:else}
				<span></span>
			{/if}
		{/each}
	</div>
	<div class="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted">
		{#each legend as [mark, label] (mark)}
			<span class="flex items-center gap-1.5"
				><span class="size-2 rounded-full {markClass[mark]}"></span>{label}</span
			>
		{/each}
	</div>
</div>
