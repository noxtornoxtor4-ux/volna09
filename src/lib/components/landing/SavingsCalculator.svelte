<script lang="ts">
	import { Clock, PiggyBank, ShieldCheck } from '@lucide/svelte';

	const fields = [
		{ key: 'rate', label: 'Ваша ставка', unit: '₽/ч', min: 300, max: 6000, step: 100 },
		{ key: 'projects', label: 'Проектов в месяц', unit: '', min: 1, max: 20, step: 1 },
		{
			key: 'scopeHours',
			label: 'Бесплатных правок на проект',
			unit: 'ч',
			min: 0,
			max: 30,
			step: 1
		},
		{ key: 'docsHours', label: 'Договоры и инвойсы в месяц', unit: 'ч', min: 0, max: 20, step: 1 },
		{ key: 'income', label: 'Доход в месяц', unit: '₽', min: 20000, max: 1000000, step: 10000 },
		{
			key: 'unpaidPercent',
			label: 'Задерживают или не платят',
			unit: '%',
			min: 0,
			max: 40,
			step: 1
		}
	] as const;

	let v = $state({
		rate: 1500,
		projects: 4,
		scopeHours: 6,
		docsHours: 5,
		income: 150000,
		unpaidPercent: 8
	});
	const { rate, projects, scopeHours, docsHours, income, unpaidPercent } = $derived(v);

	// Доли, которые закрывает платформа: 80% правок вне ТЗ превращаются в оплачиваемые допы,
	// 90% времени на документы экономит генератор, 90% невыплат предотвращает эскроу.
	const hoursSaved = $derived(Math.round(projects * scopeHours * 0.8 + docsHours * 0.9));
	const scopeMoney = $derived(projects * scopeHours * 0.8 * rate);
	const docsMoney = $derived(docsHours * 0.9 * rate);
	const protectedMoney = $derived((income * unpaidPercent * 0.9) / 100);
	const monthly = $derived(scopeMoney + docsMoney + protectedMoney);
	const yearly = $derived(monthly * 12);
	const roi = $derived(Math.round(monthly / 790));

	const rub = (value: number) =>
		new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(value) + ' ₽';
	const fmt = (value: number) => new Intl.NumberFormat('ru-RU').format(value);
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
	</div>

	<div class="relative overflow-hidden card p-6 glow">
		<div
			class="pointer-events-none absolute -top-20 -right-20 size-60 rounded-full bg-brand-500/20 blur-3xl"
		></div>
		<p class="text-sm text-slate-400">FreelanceShield вернёт вам</p>
		<p class="mt-1 font-display text-4xl font-extrabold text-white sm:text-5xl">{rub(yearly)}</p>
		<p class="text-sm text-slate-400">в год · {rub(monthly)} в месяц</p>

		<div class="mt-6 space-y-3">
			<div class="flex items-center justify-between rounded-xl bg-white/4 px-4 py-3">
				<span class="flex items-center gap-2 text-sm text-slate-300">
					<Clock class="size-4 text-brand-400" /> Свободное время
				</span>
				<span class="font-semibold text-white">{hoursSaved} ч/мес</span>
			</div>
			<div class="flex items-center justify-between rounded-xl bg-white/4 px-4 py-3">
				<span class="flex items-center gap-2 text-sm text-slate-300">
					<PiggyBank class="size-4 text-brand-400" /> Оплаченные допы
				</span>
				<span class="font-semibold text-white">{rub(scopeMoney)}</span>
			</div>
			<div class="flex items-center justify-between rounded-xl bg-white/4 px-4 py-3">
				<span class="flex items-center gap-2 text-sm text-slate-300">
					<ShieldCheck class="size-4 text-brand-400" /> Спасено от невыплат
				</span>
				<span class="font-semibold text-white">{rub(protectedMoney)}</span>
			</div>
		</div>

		<p class="mt-6 text-sm text-slate-400">
			Тариф Pro окупается в <b class="text-brand-300">{fmt(roi)}×</b>
		</p>
		<a href="/app" class="mt-4 btn w-full btn-primary">Начать экономить</a>
	</div>
</div>
