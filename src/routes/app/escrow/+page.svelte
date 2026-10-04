<script lang="ts">
	import { CircleCheck, FastForward, Lock, LockOpen, Play, RotateCcw, Send } from '@lucide/svelte';
	import PageHeader from '#lib/components/PageHeader.svelte';
	import {
		AUTO_RELEASE_HOURS,
		createDemoMilestones,
		statusLabels,
		type Milestone
	} from '#lib/escrow/milestones.ts';

	let milestones = $state(createDemoMilestones());
	let log = $state<{ id: number; text: string }[]>([
		{ id: 1, text: 'Этап 1 «Прототип и структура» принят, $300 выплачено' },
		{ id: 0, text: 'Заказчик зарезервировал $1 500 на 4 этапа' }
	]);
	let flash = $state<number | null>(null);

	const total = $derived(milestones.reduce((sum, m) => sum + m.amount, 0));
	const released = $derived(
		milestones.filter((m) => m.status === 'released').reduce((sum, m) => sum + m.amount, 0)
	);
	const inEscrow = $derived(total - released);
	const activeId = $derived(milestones.find((m) => m.status !== 'released')?.id);

	const usd = (value: number) => '$' + value.toLocaleString('ru-RU');

	function record(text: string) {
		log.unshift({ id: Date.now() + Math.random(), text });
	}

	function release(m: Milestone, auto: boolean) {
		m.status = 'released';
		m.reviewHoursLeft = 0;
		flash = m.id;
		setTimeout(() => (flash = null), 1600);
		record(
			auto
				? `72 часа без замечаний: этап «${m.title}» выплачен автоматически, ${usd(m.amount)}`
				: `Заказчик принял этап «${m.title}», ${usd(m.amount)} выплачено`
		);
	}

	function fastForward(m: Milestone) {
		m.reviewHoursLeft = Math.max(m.reviewHoursLeft - 24, 0);
		if (m.reviewHoursLeft === 0) release(m, true);
	}

	const statusStyle = {
		funded: 'bg-white/8 text-slate-300',
		in_progress: 'bg-sky-500/15 text-sky-300',
		review: 'bg-amber-500/15 text-amber-300',
		released: 'bg-brand-500/15 text-brand-300'
	};
</script>

<PageHeader
	title="Smart Milestone Escrow"
	subtitle="Лендинг для кофейни «Зерно»: бюджет разбит на этапы с критериями приёмки."
>
	{#snippet actions()}
		<button
			class="btn btn-ghost"
			onclick={() => {
				milestones = createDemoMilestones();
				log = log.slice(-2);
			}}
		>
			<RotateCcw class="size-4" /> Сбросить
		</button>
	{/snippet}
</PageHeader>

<div class="grid gap-4 sm:grid-cols-3">
	<div class="card p-5">
		<div class="text-sm text-slate-400">Бюджет сделки</div>
		<div class="mt-1 font-display text-3xl text-white">{usd(total)}</div>
	</div>
	<div class="card p-5">
		<div class="flex items-center gap-1.5 text-sm text-slate-400">
			<Lock class="size-3.5" /> В эскроу
		</div>
		<div class="mt-1 font-display text-3xl text-amber-300">{usd(inEscrow)}</div>
	</div>
	<div class="card p-5 {flash ? 'glow' : ''} transition-shadow">
		<div class="flex items-center gap-1.5 text-sm text-slate-400">
			<LockOpen class="size-3.5" /> Выплачено фрилансеру
		</div>
		<div class="mt-1 font-display text-3xl text-brand-300">{usd(released)}</div>
	</div>
</div>

<div class="mt-4 h-3 overflow-hidden rounded-full bg-white/8">
	<div
		class="h-full rounded-full bg-linear-to-r from-brand-600 to-brand-400 transition-all duration-700"
		style="width: {(released / total) * 100}%"
	></div>
</div>

<div class="mt-8 grid gap-6 xl:grid-cols-[1fr_320px]">
	<ol class="space-y-4">
		{#each milestones as m, index (m.id)}
			{@const allDone = m.criteria.every((c) => c.done)}
			{@const isActive = m.id === activeId}
			<li
				class="card p-5 transition {isActive ? 'border-brand-500/40' : ''} {flash === m.id
					? 'glow'
					: ''} {m.status === 'released' ? 'opacity-70' : ''}"
			>
				<div class="flex flex-wrap items-center justify-between gap-3">
					<div class="flex items-center gap-3">
						<span
							class="grid size-9 place-items-center rounded-full font-display text-sm {m.status ===
							'released'
								? 'bg-brand-500 text-ink-950'
								: 'bg-white/8 text-white'}"
						>
							{#if m.status === 'released'}<CircleCheck class="size-5" />{:else}{index + 1}{/if}
						</span>
						<div>
							<div class="font-semibold text-white">{m.title}</div>
							<span class="rounded-full px-2 py-0.5 text-xs {statusStyle[m.status]}">
								{statusLabels[m.status]}
							</span>
						</div>
					</div>
					<div class="font-display text-xl text-white">{usd(m.amount)}</div>
				</div>

				<ul class="mt-4 space-y-2">
					{#each m.criteria as c (c.label)}
						<li>
							<label
								class="flex items-center gap-3 rounded-lg bg-white/4 px-3 py-2 text-sm {m.status ===
								'in_progress'
									? 'cursor-pointer hover:bg-white/8'
									: ''}"
							>
								<input
									type="checkbox"
									class="size-4 accent-brand-500"
									bind:checked={c.done}
									disabled={m.status !== 'in_progress'}
								/>
								<span class={c.done ? 'text-slate-300' : 'text-slate-400'}>{c.label}</span>
							</label>
						</li>
					{/each}
				</ul>

				{#if isActive}
					<div class="mt-4 flex flex-wrap items-center gap-2">
						{#if m.status === 'funded'}
							<button
								class="btn btn-primary py-2"
								onclick={() => {
									m.status = 'in_progress';
									record(`Фрилансер начал этап «${m.title}»`);
								}}
							>
								<Play class="size-4" /> Начать этап
							</button>
						{:else if m.status === 'in_progress'}
							<button
								class="btn btn-primary py-2"
								disabled={!allDone}
								onclick={() => {
									m.status = 'review';
									m.reviewHoursLeft = AUTO_RELEASE_HOURS;
									record(`Этап «${m.title}» отправлен на приёмку`);
								}}
							>
								<Send class="size-4" /> Отправить на приёмку
							</button>
							{#if !allDone}
								<span class="text-xs text-slate-500">Отметьте все критерии приёмки</span>
							{/if}
						{:else if m.status === 'review'}
							<button class="btn btn-primary py-2" onclick={() => release(m, false)}>
								<CircleCheck class="size-4" /> Принять (заказчик)
							</button>
							<button
								class="btn btn-ghost py-2"
								onclick={() => {
									m.status = 'in_progress';
									record(`Заказчик вернул этап «${m.title}» на доработку`);
								}}
							>
								Вернуть на доработку
							</button>
							<button class="btn btn-ghost py-2" onclick={() => fastForward(m)}>
								<FastForward class="size-4" /> +24 ч
							</button>
							<span class="text-sm text-amber-300">
								Авто-выплата через {m.reviewHoursLeft} ч
							</span>
						{/if}
					</div>
				{/if}
			</li>
		{/each}
	</ol>

	<aside class="h-fit card p-5">
		<h2 class="font-semibold text-white">Журнал сделки</h2>
		<ul class="mt-4 space-y-3 text-sm">
			{#each log as entry (entry.id)}
				<li class="border-l-2 border-brand-500/40 pl-3 text-slate-400">{entry.text}</li>
			{/each}
		</ul>
		<p class="mt-6 text-xs text-slate-600">
			В MVP деньги симулируются. В проде используется Stripe Connect или ЮKassa «Безопасная сделка».
		</p>
	</aside>
</div>
