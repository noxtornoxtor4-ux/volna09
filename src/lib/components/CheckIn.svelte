<script lang="ts">
	import { tr } from '#lib/i18n.ts';
	import { Check, QrCode } from '@lucide/svelte';
	import { app } from '#lib/app.svelte.ts';
	import { parseCheckin } from '#lib/checkin.ts';
	import { day } from '#lib/data.ts';
	import { formatDate } from '#lib/format.ts';
	import Avatar from './Avatar.svelte';
	import Modal from './Modal.svelte';
	import QrScanner from './QrScanner.svelte';

	/**
	 * Подтверждение участия на месте: куратор сканирует личный QR-код волонтёра
	 * и одним нажатием подтверждает участие и начисляет часы.
	 */
	let open = $state(false);
	let personId = $state<string | null>(null);
	let problem = $state('');
	let manual = $state('');

	/** Заявки волонтёра на прошедшие и сегодняшние мероприятия организации без начисленных часов */
	const eligible = $derived(
		personId
			? app.orgApplications.filter((a) => {
					const o = app.opportunity(a.opportunityId);
					return (
						a.personId === personId &&
						a.status !== 'declined' &&
						!!o &&
						o.date <= day(0) &&
						!app.isCredited(a)
					);
				})
			: []
	);

	function start() {
		personId = null;
		problem = manual = '';
		open = true;
	}

	function scanned(text: string) {
		const result = parseCheckin(text);
		if ('error' in result) {
			problem =
				result.error === 'expired'
					? tr('QR-код устарел — попросите волонтёра открыть его заново')
					: tr('Это не QR-код волонтёра «Волны»');
			return;
		}
		problem = '';
		personId = result.personId;
	}
</script>

<button class="btn btn-ghost" onclick={start} disabled={!app.canManage}>
	<QrCode class="size-4" />
	<span class="hidden sm:inline">{tr('Сканировать QR')}</span>
</button>

<Modal bind:open title={tr('Подтверждение участия')}>
	{#if !personId}
		{#if open}<QrScanner onresult={scanned} />{/if}
		{#if problem}<p class="mt-3 rounded-2xl bg-pastel-peach p-3 text-sm text-pastel-peach-ink">
				{problem}
			</p>{/if}
		<p class="mt-3 text-sm text-muted">
			{tr('Наведите камеру на QR-код из портфолио волонтёра.')}
		</p>
		<form
			class="mt-3 flex gap-2"
			onsubmit={(e) => {
				e.preventDefault();
				if (manual.trim()) personId = manual.trim();
			}}
		>
			<input
				class="input py-2.5 font-mono text-xs"
				placeholder={tr('или ID волонтёра')}
				bind:value={manual}
			/>
			<button class="btn btn-ghost" disabled={!manual.trim()}>{tr('Найти')}</button>
		</form>
	{:else}
		<div class="flex items-center gap-3">
			<Avatar id={personId} size="lg" />
			<div class="min-w-0">
				<div class="truncate text-lg font-bold">{app.author(personId).name}</div>
				<div class="text-xs text-muted">
					{tr('{0} ч подтверждено', app.verifiedHoursOf(personId))}
				</div>
			</div>
		</div>
		<ul class="mt-4 space-y-2">
			{#each eligible as a (a.id)}
				{@const o = app.opportunity(a.opportunityId)!}
				<li class="flex items-center gap-3 rounded-2xl bg-surface-2 p-3">
					<span class="text-2xl">{o.emoji}</span>
					<div class="min-w-0 flex-1">
						<div class="truncate font-semibold">{o.title}</div>
						<div class="text-xs text-muted">{formatDate(o.date)} · {tr('+{0} ч', o.hours)}</div>
					</div>
					<button class="btn btn-primary py-2 text-sm" onclick={() => app.checkIn(a, 'qr')}
						><Check class="size-4" /> {tr('Подтвердить')}</button
					>
				</li>
			{:else}
				<li class="rounded-2xl bg-surface-2 p-4 text-sm text-muted">
					{tr(
						'У волонтёра нет заявок на сегодняшние или прошедшие мероприятия вашей организации, где часы ещё не начислены.'
					)}
				</li>
			{/each}
		</ul>
		<button class="mt-4 btn w-full btn-ghost" onclick={() => (personId = null)}
			>{tr('Сканировать следующего')}</button
		>
	{/if}
</Modal>
