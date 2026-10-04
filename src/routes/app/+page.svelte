<script lang="ts">
	import { Flame, Lock, MessageSquareWarning, TrendingUp, Wallet } from '@lucide/svelte';
	import PageHeader from '#lib/components/PageHeader.svelte';
	import { burnoutIndex } from '#lib/dashboard/burnout.ts';

	const income = [
		{ month: 'Май', value: 1450 },
		{ month: 'Июн', value: 1820 },
		{ month: 'Июл', value: 1610 },
		{ month: 'Авг', value: 2240 },
		{ month: 'Сен', value: 2580 },
		{ month: 'Окт', value: 2950 }
	];
	const maxIncome = Math.max(...income.map((i) => i.value));

	const kpis = [
		{ label: 'Доход в октябре', value: '$2 950', delta: '+14%', icon: TrendingUp },
		{ label: 'В эскроу', value: '$1 200', delta: '3 этапа', icon: Lock },
		{ label: 'Допы от Defender', value: '$1 340', delta: '9 правок', icon: MessageSquareWarning },
		{ label: 'Активных проектов', value: '4', delta: '1 на приёмке', icon: Wallet }
	];

	let tasks = $state([
		{
			id: 1,
			title: 'Мобильный макет: Кофейня «Зерно»',
			due: 'Сегодня',
			done: false,
			tag: 'Дизайн'
		},
		{ id: 2, title: 'Отправить инвойс: Студия Kim', due: 'Завтра', done: false, tag: 'Финансы' },
		{ id: 3, title: 'Созвон по ТЗ: FitApp', due: 'Ср, 11:00', done: false, tag: 'Клиент' },
		{ id: 4, title: 'Правки по UI-киту: «Зерно»', due: 'Чт', done: true, tag: 'Дизайн' },
		{ id: 5, title: 'Подписать договор: ЕвроТур (DE)', due: 'Пт', done: false, tag: 'Документы' }
	]);

	let burnout = $state({
		hoursPerWeek: 58,
		weekendsWorked: 5,
		lateNightPercent: 34,
		daysSinceVacation: 140
	});
	const result = $derived(burnoutIndex(burnout));
	const gaugeColor = $derived({ low: '#1fd189', medium: '#fbbf24', high: '#fb7185' }[result.level]);

	const burnoutFields = [
		{ key: 'hoursPerWeek', label: 'Часов в неделю', min: 20, max: 80, unit: 'ч' },
		{ key: 'weekendsWorked', label: 'Рабочих выходных за месяц', min: 0, max: 8, unit: '' },
		{ key: 'lateNightPercent', label: 'Сообщений после 22:00', min: 0, max: 60, unit: '%' },
		{ key: 'daysSinceVacation', label: 'Дней без отпуска', min: 0, max: 365, unit: '' }
	] as const;

	const ARC = Math.PI * 80;
</script>

<PageHeader
	title="Привет, Алекс 👋"
	subtitle="Ваш Freelancer OS: деньги, задачи и самочувствие в одном окне."
/>

<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
	{#each kpis as k (k.label)}
		<div class="card p-5">
			<div class="flex items-center justify-between text-sm text-slate-400">
				{k.label}
				<k.icon class="size-4 text-brand-400" />
			</div>
			<div class="mt-2 font-display text-2xl text-white">{k.value}</div>
			<div class="mt-1 text-xs text-brand-300">{k.delta}</div>
		</div>
	{/each}
</div>

<div class="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
	<section class="card p-6">
		<div class="flex items-center justify-between">
			<h2 class="font-semibold text-white">Доход за 6 месяцев</h2>
			<span class="text-sm text-brand-300">+103% с мая</span>
		</div>
		<div class="mt-8 flex h-56 items-end gap-3 sm:gap-5">
			{#each income as bar, i (bar.month)}
				<div class="flex h-full flex-1 flex-col items-center justify-end gap-2">
					<span class="text-xs text-slate-400">${(bar.value / 1000).toFixed(1)}k</span>
					<div
						class="w-full rounded-t-lg transition-all {i === income.length - 1
							? 'bg-linear-to-t from-brand-600 to-brand-400'
							: 'bg-white/10 hover:bg-white/20'}"
						style="height: {(bar.value / maxIncome) * 100}%"
					></div>
					<span class="text-xs text-slate-500">{bar.month}</span>
				</div>
			{/each}
		</div>
	</section>

	<section class="card p-6">
		<h2 class="flex items-center gap-2 font-semibold text-white">
			<Flame class="size-4 text-rose-400" /> Индекс выгорания
		</h2>
		<div class="relative mx-auto mt-4 w-56">
			<svg viewBox="0 0 200 110" class="w-full">
				<path
					d="M20 100 A80 80 0 0 1 180 100"
					fill="none"
					stroke="rgb(255 255 255 / 0.08)"
					stroke-width="16"
					stroke-linecap="round"
				/>
				<path
					d="M20 100 A80 80 0 0 1 180 100"
					fill="none"
					stroke={gaugeColor}
					stroke-width="16"
					stroke-linecap="round"
					stroke-dasharray={ARC}
					stroke-dashoffset={ARC * (1 - result.score / 100)}
					style="transition: stroke-dashoffset 0.5s, stroke 0.5s"
				/>
			</svg>
			<div class="absolute inset-x-0 bottom-0 text-center">
				<div class="font-display text-4xl text-white">{result.score}</div>
				<div class="text-xs" style="color: {gaugeColor}">{result.label}</div>
			</div>
		</div>
		<p class="mt-4 rounded-xl bg-white/4 p-3 text-sm text-slate-300">{result.advice}</p>
		<div class="mt-4 space-y-3">
			{#each burnoutFields as f (f.key)}
				<label class="block text-sm">
					<span class="flex justify-between">
						<span class="text-slate-400">{f.label}</span>
						<span class="text-white">{burnout[f.key]}{f.unit}</span>
					</span>
					<input
						type="range"
						min={f.min}
						max={f.max}
						bind:value={burnout[f.key]}
						class="mt-1 w-full accent-brand-500"
					/>
				</label>
			{/each}
		</div>
	</section>
</div>

<section class="mt-6 card p-6">
	<div class="flex items-center justify-between">
		<h2 class="font-semibold text-white">Задачи на неделю</h2>
		<span class="text-sm text-slate-400">
			{tasks.filter((t) => t.done).length}/{tasks.length} готово
		</span>
	</div>
	<ul class="mt-4 divide-y divide-white/6">
		{#each tasks as task (task.id)}
			<li>
				<label class="flex cursor-pointer items-center gap-3 py-3">
					<input type="checkbox" class="size-4 accent-brand-500" bind:checked={task.done} />
					<span
						class="flex-1 text-sm {task.done ? 'text-slate-500 line-through' : 'text-slate-200'}"
					>
						{task.title}
					</span>
					<span class="hidden rounded-full bg-white/6 px-2 py-0.5 text-xs text-slate-400 sm:inline"
						>{task.tag}</span
					>
					<span
						class="w-20 text-right text-xs {task.due === 'Сегодня'
							? 'text-amber-300'
							: 'text-slate-500'}"
					>
						{task.due}
					</span>
				</label>
			</li>
		{/each}
	</ul>
</section>
