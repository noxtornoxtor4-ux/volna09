<script lang="ts">
	import { Clock, PiggyBank, Wallet } from '@lucide/svelte';

	const PRO_PRICE = 490;

	const fields = [
		{ key: 'lessonPrice', label: 'Стоимость занятия', unit: 'сом', min: 300, max: 2500, step: 50 },
		{ key: 'lessonsPerWeek', label: 'Занятий в неделю', unit: '', min: 1, max: 6, step: 1 },
		{ key: 'subjects', label: 'Предметов', unit: '', min: 1, max: 4, step: 1 },
		{ key: 'months', label: 'Месяцев до экзамена', unit: '', min: 1, max: 12, step: 1 },
		{ key: 'commute', label: 'Дорога на одно занятие', unit: 'мин', min: 0, max: 90, step: 5 }
	] as const;

	let v = $state({ lessonPrice: 800, lessonsPerWeek: 2, subjects: 2, months: 8, commute: 30 });

	// В месяце считаем 4,3 недели
	const lessonsPerMonth = $derived(v.lessonsPerWeek * v.subjects * 4.3);
	const tutorMonthly = $derived(lessonsPerMonth * v.lessonPrice);
	const tutorTotal = $derived(tutorMonthly * v.months);
	const boostTotal = $derived(PRO_PRICE * v.months);
	const saved = $derived(Math.max(tutorTotal - boostTotal, 0));
	const hoursSaved = $derived(Math.round((lessonsPerMonth * v.months * v.commute * 2) / 60));
	const times = $derived(Math.round(tutorMonthly / PRO_PRICE));

	const fmt = (value: number) =>
		new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(value);
</script>

<div class="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
	<div class="grid gap-6 card p-6 sm:grid-cols-2">
		{#each fields as f (f.key)}
			<label class="block">
				<span class="flex items-baseline justify-between text-sm">
					<span class="text-slate-400">{f.label}</span>
					<span class="font-semibold text-white">{fmt(v[f.key])} {f.unit}</span>
				</span>
				<input
					type="range"
					min={f.min}
					max={f.max}
					step={f.step}
					bind:value={v[f.key]}
					class="mt-3 w-full accent-brand-500"
				/>
			</label>
		{/each}
		<div class="rounded-xl bg-white/4 p-4 text-sm text-slate-400 sm:col-span-2">
			Репетиторы обойдутся в <b class="text-white">{fmt(tutorMonthly)} сом</b> в месяц, а TestBoost
			Pro — в
			<b class="text-white">{PRO_PRICE} сом</b>, то есть в {times} раз дешевле.
		</div>
	</div>

	<div class="relative overflow-hidden card p-6 glow">
		<div
			class="pointer-events-none absolute -top-20 -right-20 size-60 rounded-full bg-accent-400/15 blur-3xl"
		></div>
		<p class="text-sm text-slate-400">До экзамена вы сэкономите</p>
		<p class="mt-1 font-display text-4xl font-extrabold text-white sm:text-5xl">{fmt(saved)} сом</p>
		<p class="text-sm text-slate-400">за {v.months} мес. подготовки</p>

		<div class="mt-6 space-y-3">
			<div class="flex items-center justify-between rounded-xl bg-white/4 px-4 py-3">
				<span class="flex items-center gap-2 text-sm text-slate-300"
					><Wallet class="size-4 text-rose-300" /> Репетиторы</span
				>
				<span class="font-semibold text-white">{fmt(tutorTotal)} сом</span>
			</div>
			<div class="flex items-center justify-between rounded-xl bg-white/4 px-4 py-3">
				<span class="flex items-center gap-2 text-sm text-slate-300"
					><PiggyBank class="size-4 text-brand-400" /> TestBoost Pro</span
				>
				<span class="font-semibold text-white">{fmt(boostTotal)} сом</span>
			</div>
			<div class="flex items-center justify-between rounded-xl bg-white/4 px-4 py-3">
				<span class="flex items-center gap-2 text-sm text-slate-300"
					><Clock class="size-4 text-brand-400" /> Без дороги</span
				>
				<span class="font-semibold text-white">{fmt(hoursSaved)} ч</span>
			</div>
		</div>
		<a href="/app/test" class="mt-6 btn w-full btn-primary">Начать бесплатно</a>
	</div>
</div>
