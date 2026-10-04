<script lang="ts">
	import { exams } from '#lib/exam/catalog.ts';
	import type { Attempt, ExamId } from '#lib/exam/types.ts';

	let { attempts, exam }: { attempts: Attempt[]; exam: ExamId } = $props();

	const W = 600;
	const H = 220;
	const PAD = { top: 20, right: 20, bottom: 30, left: 40 };

	const info = $derived(exams[exam]);
	const range = $derived(info.maxScore - info.minScore);
	const points = $derived(
		attempts.map((a, i) => ({
			x:
				PAD.left +
				(attempts.length === 1 ? 0.5 : i / (attempts.length - 1)) * (W - PAD.left - PAD.right),
			y: PAD.top + (1 - (a.score - info.minScore) / range) * (H - PAD.top - PAD.bottom),
			score: a.score,
			label: new Date(a.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
		}))
	);
	const line = $derived(points.map((p, i) => `${i ? 'L' : 'M'}${p.x},${p.y}`).join(' '));
	const area = $derived(
		points.length
			? `${line} L${points.at(-1)!.x},${H - PAD.bottom} L${points[0].x},${H - PAD.bottom} Z`
			: ''
	);
	const targetY = $derived(
		PAD.top + (1 - (info.target - info.minScore) / range) * (H - PAD.top - PAD.bottom)
	);
	const grid = $derived([0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(info.minScore + range * t)));
	const yOf = (score: number) =>
		PAD.top + (1 - (score - info.minScore) / range) * (H - PAD.top - PAD.bottom);
</script>

{#if points.length}
	<svg viewBox="0 0 {W} {H}" class="w-full" role="img" aria-label="График баллов {info.name}">
		<defs>
			<linearGradient id="score-fill" x1="0" x2="0" y1="0" y2="1">
				<stop offset="0%" stop-color="var(--color-brand-500)" stop-opacity="0.35" />
				<stop offset="100%" stop-color="var(--color-brand-500)" stop-opacity="0" />
			</linearGradient>
		</defs>
		{#each grid as value (value)}
			<line
				x1={PAD.left}
				x2={W - PAD.right}
				y1={yOf(value)}
				y2={yOf(value)}
				stroke="rgb(255 255 255 / 0.06)"
			/>
			<text x={PAD.left - 8} y={yOf(value) + 4} text-anchor="end" class="fill-slate-500 text-[10px]"
				>{value}</text
			>
		{/each}
		<line
			x1={PAD.left}
			x2={W - PAD.right}
			y1={targetY}
			y2={targetY}
			stroke="var(--color-accent-400)"
			stroke-dasharray="5 5"
			stroke-opacity="0.7"
		/>
		<text x={W - PAD.right} y={targetY - 6} text-anchor="end" class="fill-accent-400 text-[10px]"
			>цель {info.target}</text
		>
		<path d={area} fill="url(#score-fill)" />
		<path
			d={line}
			fill="none"
			stroke="var(--color-brand-400)"
			stroke-width="3"
			stroke-linejoin="round"
			stroke-linecap="round"
		/>
		{#each points as p, i (i)}
			<circle
				cx={p.x}
				cy={p.y}
				r={i === points.length - 1 ? 6 : 4}
				fill="var(--color-ink-950)"
				stroke="var(--color-brand-400)"
				stroke-width="2.5"
			/>
			<text x={p.x} y={p.y - 12} text-anchor="middle" class="fill-white text-[11px] font-semibold"
				>{p.score}</text
			>
			<text x={p.x} y={H - 10} text-anchor="middle" class="fill-slate-500 text-[10px]"
				>{p.label}</text
			>
		{/each}
	</svg>
{:else}
	<p class="py-16 text-center text-sm text-slate-500">
		Пройдите первый пробный тест {info.name}, и здесь появится график.
	</p>
{/if}
