<script lang="ts">
	import { tr } from '#lib/i18n.ts';
	import { Rocket } from '@lucide/svelte';
	import { app } from '#lib/app.svelte.ts';
	import { formatDate } from '#lib/format.ts';
	import Modal from './Modal.svelte';

	let { opportunityId = $bindable(null) }: { opportunityId: string | null } = $props();

	const o = $derived(opportunityId ? app.opportunity(opportunityId) : undefined);
	let days = $state(3);

	// Охват — демо-оценка для интерфейса, не реальная статистика
	const plans = [
		{ days: 1, reach: '≈ 600', label: tr('1 день') },
		{ days: 3, reach: '≈ 2 000', label: tr('3 дня') },
		{ days: 7, reach: '≈ 5 000', label: tr('Неделя') }
	];

	function promote() {
		if (!o) return;
		app.promote(o.id, days);
		opportunityId = null;
	}
</script>

<Modal
	title={tr('Продвижение публикации')}
	bind:open={() => !!o, (v) => !v && (opportunityId = null)}
>
	{#if o}
		<p class="text-sm text-muted">
			{tr(
				'«{0}» поднимется в начало ленты, первым появится в сторисах темы и получит значок «Продвигается».',
				o.title
			)}
		</p>
		{#if app.isPromoted(o)}
			<p class="mt-3 rounded-2xl bg-pastel-green p-3 text-sm text-pastel-green-ink">
				{tr('Уже продвигается до {0}. Можно продлить.', formatDate(o.promotedUntil!))}
			</p>
		{/if}
		<div class="mt-4 grid grid-cols-3 gap-2">
			{#each plans as p (p.days)}
				<button
					class="rounded-3xl border-2 p-3 text-center transition {days === p.days
						? 'border-accent bg-accent-soft'
						: 'border-line hover:border-accent/50'}"
					onclick={() => (days = p.days)}
					aria-pressed={days === p.days}
				>
					<div class="font-extrabold">{p.label}</div>
					<div class="mt-1 text-xs text-muted">{tr('{0} показов', p.reach)}</div>
				</button>
			{/each}
		</div>
		<p class="mt-3 flex items-center gap-1.5 text-xs text-muted">
			{tr('Показ волонтёрам, у которых совпадают интересы с темами мероприятия.')}
		</p>
		<button class="mt-5 btn w-full btn-primary py-3" onclick={promote}
			><Rocket class="size-4" />
			{tr('Продвигать {0}', plans.find((p) => p.days === days)?.label.toLowerCase())}</button
		>
		<p class="mt-2 text-center text-[11px] text-muted">
			{tr('Демо-режим: оплата не списывается, охват примерный.')}
		</p>
	{/if}
</Modal>
