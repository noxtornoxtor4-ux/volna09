<script lang="ts">
	import { Check, Copy, LoaderCircle, Printer, Sparkles } from '@lucide/svelte';
	import PageHeader from '#lib/components/PageHeader.svelte';
	import {
		contractToText,
		generateContract,
		getJurisdiction,
		jurisdictions,
		money,
		splitMilestones,
		type ContractInput
	} from '#lib/contracts/generator.ts';

	const inDays = (days: number) => new Date(Date.now() + days * 864e5).toISOString().slice(0, 10);

	const initial: ContractInput = {
		jurisdiction: 'RU',
		freelancer: 'Алекс Иванов',
		freelancerTaxId: '7701234567',
		client: 'ООО «Зерно»',
		clientTaxId: '7709876543',
		service: 'дизайн и вёрстка лендинга кофейни из 5 секций с адаптивом и формой заявки',
		amount: 120000,
		deadline: inDays(21),
		revisions: 2,
		milestones: 3,
		killFee: 30
	};

	let input = $state<ContractInput>(structuredClone(initial));

	let tab = $state<'contract' | 'invoice'>('contract');
	let generating = $state(false);
	let elapsed = $state<number | null>(null);
	let copied = $state(false);
	let snapshot = $state<ContractInput>(initial);

	const j = $derived(getJurisdiction(snapshot.jurisdiction));
	const sections = $derived(generateContract(snapshot));
	const parts = $derived(splitMilestones(snapshot.amount, snapshot.milestones));
	const invoiceNo = `INV-${new Date().getFullYear()}-0042`;
	const today = new Date().toLocaleDateString('ru-RU');

	async function generate() {
		generating = true;
		const started = performance.now();
		await new Promise((resolve) => setTimeout(resolve, 900));
		snapshot = $state.snapshot(input);
		elapsed = (performance.now() - started) / 1000;
		generating = false;
	}

	async function copy() {
		await navigator.clipboard.writeText(contractToText(snapshot, sections));
		copied = true;
		setTimeout(() => (copied = false), 1500);
	}
</script>

<PageHeader
	title="Instant Contract & Invoice"
	subtitle="Договор и инвойс под законы выбранной страны. Этапы оплаты совпадают с эскроу."
/>

<div class="grid gap-6 xl:grid-cols-[380px_1fr]">
	<form
		class="h-fit space-y-4 card p-5 print:hidden"
		onsubmit={(e) => {
			e.preventDefault();
			generate();
		}}
	>
		<div>
			<span class="label">Юрисдикция</span>
			<div class="grid grid-cols-3 gap-2">
				{#each jurisdictions as item (item.code)}
					<button
						type="button"
						class="rounded-xl border px-2 py-2 text-sm transition {input.jurisdiction === item.code
							? 'border-brand-500 bg-brand-500/15 text-white'
							: 'border-white/10 text-slate-400 hover:border-white/30'}"
						onclick={() => (input.jurisdiction = item.code)}
					>
						{item.flag}
						{item.name}
					</button>
				{/each}
			</div>
		</div>
		<div class="grid grid-cols-2 gap-3">
			<label
				><span class="label">Исполнитель</span><input
					class="input"
					bind:value={input.freelancer}
				/></label
			>
			<label>
				<span class="label">{getJurisdiction(input.jurisdiction).taxIdLabel}</span>
				<input class="input" bind:value={input.freelancerTaxId} />
			</label>
			<label
				><span class="label">Заказчик</span><input class="input" bind:value={input.client} /></label
			>
			<label>
				<span class="label">{getJurisdiction(input.jurisdiction).taxIdLabel}</span>
				<input class="input" bind:value={input.clientTaxId} />
			</label>
		</div>
		<label>
			<span class="label">Услуги</span>
			<textarea class="min-h-20 input" bind:value={input.service}></textarea>
		</label>
		<div class="grid grid-cols-2 gap-3">
			<label>
				<span class="label">Сумма, {getJurisdiction(input.jurisdiction).currency}</span>
				<input class="input" type="number" min="1" bind:value={input.amount} />
			</label>
			<label
				><span class="label">Срок</span><input
					class="input"
					type="date"
					bind:value={input.deadline}
				/></label
			>
			<label>
				<span class="label">Этапов оплаты</span>
				<input class="input" type="number" min="1" max="6" bind:value={input.milestones} />
			</label>
			<label>
				<span class="label">Раундов правок</span>
				<input class="input" type="number" min="0" max="10" bind:value={input.revisions} />
			</label>
		</div>
		<label class="block">
			<span class="flex justify-between text-sm">
				<span class="text-slate-400">Kill fee при отмене</span>
				<span class="font-semibold text-white">{input.killFee}%</span>
			</span>
			<input
				type="range"
				min="0"
				max="100"
				step="5"
				bind:value={input.killFee}
				class="mt-2 w-full accent-brand-500"
			/>
		</label>
		<button class="btn w-full btn-primary glow" disabled={generating}>
			{#if generating}
				<LoaderCircle class="size-4 animate-spin" /> ИИ собирает договор…
			{:else}
				<Sparkles class="size-4" /> Сгенерировать
			{/if}
		</button>
		{#if elapsed}
			<p class="text-center text-xs text-brand-300">Готово за {elapsed.toFixed(1)} сек</p>
		{/if}
	</form>

	<section>
		<div class="mb-3 flex flex-wrap items-center justify-between gap-3 print:hidden">
			<div class="flex rounded-xl bg-white/5 p-1">
				{#each [{ id: 'contract', label: 'Договор' }, { id: 'invoice', label: 'Инвойс' }] as t (t.id)}
					<button
						class="rounded-lg px-4 py-1.5 text-sm {tab === t.id
							? 'bg-brand-500 text-ink-950'
							: 'text-slate-400'}"
						onclick={() => (tab = t.id as typeof tab)}>{t.label}</button
					>
				{/each}
			</div>
			<div class="flex gap-2">
				<button class="btn btn-ghost py-2" onclick={copy}>
					{#if copied}<Check class="size-4" /> Скопировано{:else}<Copy class="size-4" /> Копировать{/if}
				</button>
				<button class="btn btn-ghost py-2" onclick={() => window.print()}>
					<Printer class="size-4" /> PDF
				</button>
			</div>
		</div>

		<article
			class="rounded-2xl bg-white p-8 text-[13px] leading-relaxed text-slate-800 shadow-2xl transition sm:p-10 {generating
				? 'opacity-40 blur-[1px]'
				: ''} print:p-0 print:shadow-none"
		>
			{#if tab === 'contract'}
				<header class="mb-6 text-center">
					<h2 class="text-lg font-bold tracking-wide text-slate-900">ДОГОВОР ОКАЗАНИЯ УСЛУГ</h2>
					<p class="mt-1 text-slate-500">{j.flag} Применимое право: {j.name} · {today}</p>
				</header>
				{#each sections as section (section.title)}
					<h3 class="mt-5 font-bold text-slate-900">{section.title}</h3>
					{#each section.paragraphs as paragraph, i (i)}
						<p class="mt-1.5">{paragraph}</p>
					{/each}
				{/each}
				<div class="mt-10 grid grid-cols-2 gap-8 text-slate-600">
					<div>
						<div class="font-semibold text-slate-900">Исполнитель</div>
						{snapshot.freelancer}
						<div class="mt-8 border-t border-slate-300 pt-1 text-xs">подпись</div>
					</div>
					<div>
						<div class="font-semibold text-slate-900">Заказчик</div>
						{snapshot.client}
						<div class="mt-8 border-t border-slate-300 pt-1 text-xs">подпись</div>
					</div>
				</div>
			{:else}
				<header class="flex items-start justify-between">
					<div>
						<h2 class="text-2xl font-bold text-slate-900">Инвойс</h2>
						<p class="text-slate-500">№ {invoiceNo} от {today}</p>
					</div>
					<span
						class="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700"
					>
						Оплата через эскроу
					</span>
				</header>
				<div class="mt-8 grid grid-cols-2 gap-6">
					<div>
						<div class="text-xs text-slate-500 uppercase">От</div>
						<div class="font-semibold text-slate-900">{snapshot.freelancer}</div>
						<div>{j.taxIdLabel}: {snapshot.freelancerTaxId}</div>
					</div>
					<div>
						<div class="text-xs text-slate-500 uppercase">Кому</div>
						<div class="font-semibold text-slate-900">{snapshot.client}</div>
						<div>{j.taxIdLabel}: {snapshot.clientTaxId}</div>
					</div>
				</div>
				<table class="mt-8 w-full text-left">
					<thead>
						<tr class="border-b border-slate-200 text-xs text-slate-500 uppercase">
							<th class="py-2">Позиция</th>
							<th class="py-2 text-right">Сумма</th>
						</tr>
					</thead>
					<tbody>
						{#each parts as part, i (i)}
							<tr class="border-b border-slate-100">
								<td class="py-2">Этап {i + 1}: {snapshot.service}</td>
								<td class="py-2 text-right whitespace-nowrap">{money(part, j.currency)}</td>
							</tr>
						{/each}
					</tbody>
					<tfoot>
						<tr>
							<td class="pt-4 font-bold text-slate-900">Итого</td>
							<td class="pt-4 text-right text-lg font-bold text-slate-900">
								{money(snapshot.amount, j.currency)}
							</td>
						</tr>
					</tfoot>
				</table>
				<p class="mt-6 text-xs text-slate-500">{j.taxNote}</p>
			{/if}
			<p class="mt-8 border-t border-slate-200 pt-3 text-[11px] text-slate-400">
				Сгенерировано FreelanceShield AI. Шаблон не является юридической консультацией.
			</p>
		</article>
	</section>
</div>
