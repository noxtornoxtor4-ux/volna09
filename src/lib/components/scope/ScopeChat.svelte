<script lang="ts">
	import { tick } from 'svelte';
	import { Bot, LoaderCircle, Plus, Send, ShieldCheck, Sparkles, Trash2, X } from '@lucide/svelte';
	import {
		demoBrief,
		formatMoney,
		type ScopeAnalysis,
		type ScopeBrief
	} from '#lib/scope/analyzer.ts';
	import { requestScopeAnalysis } from '#lib/scope/client.ts';
	import VerdictBadge from './VerdictBadge.svelte';

	let { editable = false }: { editable?: boolean } = $props();

	interface ChatMessage {
		id: number;
		author: 'client' | 'freelancer';
		text: string;
		analysis?: ScopeAnalysis;
		resolved?: boolean;
	}

	const presets = [
		'Сделайте кнопку «Забронировать» поярче, пожалуйста',
		'Когда будет готов макет мобильной версии?',
		'А можно ещё добавить личный кабинет и онлайн-оплату?',
		'Поменяйте шрифт в заголовках на более строгий',
		'И заодно сделайте английскую версию сайта'
	];

	let brief = $state<ScopeBrief>(structuredClone(demoBrief));
	let messages = $state<ChatMessage[]>([
		{ id: 1, author: 'client', text: 'Привет! Как продвигается главная страница?' },
		{
			id: 2,
			author: 'freelancer',
			text: 'Привет! Десктоп-макет готов, сегодня доделаю мобильную версию 🙌'
		}
	]);
	let draft = $state('');
	let newItem = $state('');
	let loading = $state(false);
	let revisionsUsed = $state(0);
	let protectedAmount = $state(0);
	let feed: HTMLDivElement | undefined = $state();

	const latest = $derived(
		[...messages].reverse().find((m) => m.author === 'client' && m.analysis && !m.resolved)
	);

	async function scrollDown() {
		await tick();
		feed?.scrollTo({ top: feed.scrollHeight, behavior: 'smooth' });
	}

	async function send(text = draft) {
		const message = text.trim();
		if (!message || loading) return;
		draft = '';
		const entry: ChatMessage = { id: Date.now(), author: 'client', text: message };
		messages.push(entry);
		loading = true;
		scrollDown();

		const analysis = await requestScopeAnalysis(message, $state.snapshot(brief), revisionsUsed);
		const target = messages.find((m) => m.id === entry.id);
		if (target) target.analysis = analysis;
		if (analysis.verdict === 'revision') revisionsUsed += 1;
		loading = false;
		scrollDown();
	}

	function reply(target: ChatMessage, addMilestone: boolean) {
		if (!target.analysis) return;
		target.resolved = true;
		messages.push({ id: Date.now(), author: 'freelancer', text: target.analysis.suggestedReply });
		if (addMilestone) protectedAmount += target.analysis.estimateCost;
		scrollDown();
	}

	function addItem() {
		if (!newItem.trim()) return;
		brief.items.push(newItem.trim());
		newItem = '';
	}

	function reset() {
		brief = structuredClone(demoBrief);
		messages = messages.slice(0, 2);
		revisionsUsed = 0;
		protectedAmount = 0;
	}
</script>

<div class="grid gap-4 lg:grid-cols-[320px_1fr]">
	<aside class="flex flex-col gap-4 card p-5">
		<div class="flex items-center gap-2 text-sm font-semibold text-white">
			<ShieldCheck class="size-4 text-brand-400" /> Согласованное ТЗ
		</div>
		{#if editable}
			<input class="input" bind:value={brief.title} aria-label="Название проекта" />
		{:else}
			<p class="font-display text-sm text-white">{brief.title}</p>
		{/if}

		<ul class="space-y-2 text-sm">
			{#each brief.items as item, index (item + index)}
				<li class="flex items-start gap-2 rounded-lg bg-white/4 px-3 py-2">
					<span class="mt-0.5 text-brand-400">✓</span>
					<span class="flex-1 text-slate-300">{item}</span>
					{#if editable}
						<button
							class="text-slate-500 hover:text-rose-400"
							onclick={() => brief.items.splice(index, 1)}
							aria-label="Удалить пункт"
						>
							<Trash2 class="size-3.5" />
						</button>
					{/if}
				</li>
			{/each}
		</ul>

		{#if editable}
			<form
				class="flex gap-2"
				onsubmit={(e) => {
					e.preventDefault();
					addItem();
				}}
			>
				<input class="input" placeholder="Новый пункт ТЗ" bind:value={newItem} />
				<button class="btn btn-ghost px-3" aria-label="Добавить пункт"
					><Plus class="size-4" /></button
				>
			</form>
			<div class="grid grid-cols-2 gap-2">
				<label>
					<span class="label">Ставка, $/ч</span>
					<input class="input" type="number" min="1" bind:value={brief.hourlyRate} />
				</label>
				<label>
					<span class="label">Раундов правок</span>
					<input class="input" type="number" min="0" bind:value={brief.revisionsIncluded} />
				</label>
			</div>
		{/if}

		<div class="mt-auto grid grid-cols-2 gap-2 text-center">
			<div class="rounded-xl bg-white/4 p-3">
				<div class="font-display text-lg text-white">
					{Math.max(brief.revisionsIncluded - revisionsUsed, 0)}/{brief.revisionsIncluded}
				</div>
				<div class="text-[11px] text-slate-400">правок осталось</div>
			</div>
			<div class="rounded-xl bg-brand-500/10 p-3">
				<div class="font-display text-lg text-brand-300">
					{formatMoney(protectedAmount, brief.currency)}
				</div>
				<div class="text-[11px] text-slate-400">защищено допами</div>
			</div>
		</div>
		<button class="text-xs text-slate-500 hover:text-slate-300" onclick={reset}
			>Сбросить демо</button
		>
	</aside>

	<section class="flex min-h-[520px] flex-col overflow-hidden card">
		<header class="flex items-center justify-between border-b border-white/8 px-5 py-3">
			<div class="flex items-center gap-3">
				<div
					class="grid size-9 place-items-center rounded-full bg-linear-to-br from-amber-400 to-orange-600 text-sm font-bold text-white"
				>
					З
				</div>
				<div>
					<div class="text-sm font-semibold text-white">Кофейня «Зерно»</div>
					<div class="text-xs text-slate-500">клиент · онлайн</div>
				</div>
			</div>
			<span
				class="flex items-center gap-1.5 rounded-full bg-brand-500/10 px-3 py-1 text-xs text-brand-300"
			>
				<span class="size-1.5 animate-pulse rounded-full bg-brand-400"></span> Defender активен
			</span>
		</header>

		<div bind:this={feed} class="flex-1 space-y-3 overflow-y-auto p-5" style="max-height: 440px">
			{#each messages as message (message.id)}
				<div class="flex {message.author === 'freelancer' ? 'justify-end' : 'justify-start'}">
					<div class="max-w-[85%] space-y-2">
						<div
							class="rounded-2xl px-4 py-2.5 text-sm {message.author === 'freelancer'
								? 'rounded-br-sm bg-brand-500 text-ink-950'
								: 'rounded-bl-sm bg-ink-700 text-slate-100'} {message.analysis?.verdict ===
								'out_of_scope' && !message.resolved
								? 'ring-2 ring-rose-500/70'
								: ''}"
						>
							{message.text}
						</div>
						{#if message.analysis}
							<VerdictBadge
								verdict={message.analysis.verdict}
								confidence={message.analysis.confidence}
							/>
						{/if}
					</div>
				</div>
			{/each}
			{#if loading}
				<div class="flex items-center gap-2 text-xs text-slate-400">
					<LoaderCircle class="size-4 animate-spin text-brand-400" /> ИИ сверяет сообщение с ТЗ…
				</div>
			{/if}
		</div>

		{#if latest?.analysis}
			{@const a = latest.analysis}
			<div
				class="mx-4 mb-3 rounded-2xl border p-4 {a.verdict === 'out_of_scope'
					? 'border-rose-500/40 bg-rose-500/8'
					: 'border-white/10 bg-white/4'}"
			>
				<div class="mb-2 flex items-center justify-between gap-2">
					<div class="flex items-center gap-2 text-sm font-semibold text-white">
						<Bot class="size-4 text-brand-400" /> Scope Defender
						<span class="text-[10px] font-normal text-slate-500 uppercase">
							{a.source === 'ai' ? 'OpenAI' : 'локальная модель'}
						</span>
					</div>
					<button
						class="text-slate-500 hover:text-white"
						onclick={() => (latest.resolved = true)}
						aria-label="Скрыть"
					>
						<X class="size-4" />
					</button>
				</div>
				<p class="text-sm text-slate-300">{a.reason}</p>
				{#if a.verdict === 'out_of_scope'}
					<p class="mt-2 text-sm text-rose-200">
						Оценка: ~{a.estimateHours} ч ·
						<b>{formatMoney(a.estimateCost, brief.currency)}</b>
					</p>
				{/if}
				<div class="mt-3 rounded-xl bg-ink-950/60 p-3 text-sm text-slate-200">
					<div class="mb-1 flex items-center gap-1 text-[11px] text-brand-300 uppercase">
						<Sparkles class="size-3" /> Предложенный ответ
					</div>
					{a.suggestedReply}
				</div>
				<div class="mt-3 flex flex-wrap gap-2">
					{#if a.verdict === 'out_of_scope'}
						<button class="btn btn-primary py-2" onclick={() => reply(latest, true)}>
							Отправить и добавить этап в сделку
						</button>
					{:else}
						<button class="btn btn-primary py-2" onclick={() => reply(latest, false)}>
							Отправить ответ
						</button>
					{/if}
				</div>
			</div>
		{/if}

		<div class="border-t border-white/8 p-4">
			<div class="mb-3 flex flex-wrap gap-2">
				{#each presets as preset (preset)}
					<button
						class="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300 transition hover:border-brand-500/60 hover:text-white disabled:opacity-40"
						disabled={loading}
						onclick={() => send(preset)}
					>
						{preset}
					</button>
				{/each}
			</div>
			<form
				class="flex gap-2"
				onsubmit={(e) => {
					e.preventDefault();
					send();
				}}
			>
				<input
					class="input"
					placeholder="Напишите сообщение от лица клиента…"
					bind:value={draft}
					disabled={loading}
				/>
				<button
					class="btn btn-primary px-4"
					disabled={loading || !draft.trim()}
					aria-label="Отправить"
				>
					<Send class="size-4" />
				</button>
			</form>
		</div>
	</section>
</div>
