<script lang="ts">
	import { tr } from '#lib/i18n.ts';
	import { Flag } from '@lucide/svelte';
	import { app } from '#lib/app.svelte.ts';
	import type { Report } from '#lib/types.ts';
	import Modal from './Modal.svelte';

	/** Жалоба модератору на пост, комментарий, мероприятие или профиль */
	let {
		target,
		compact = false
	}: { target: Pick<Report, 'targetType' | 'targetId' | 'postId'>; compact?: boolean } = $props();

	const reasons = [
		tr('Спам или реклама'),
		tr('Оскорбления или травля'),
		tr('Неприемлемый контент'),
		tr('Фейк или мошенничество'),
		tr('Чужие личные данные'),
		tr('Накрутка часов')
	];

	let open = $state(false);
	let reason = $state('');
	let details = $state('');

	function submit(e: SubmitEvent) {
		e.preventDefault();
		if (!reason) return;
		app.report(target, details.trim() ? `${reason}: ${details.trim()}` : reason);
		open = false;
		reason = details = '';
	}
</script>

<button
	type="button"
	class={compact
		? 'grid size-8 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-ink'
		: 'flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-muted transition hover:bg-surface-2'}
	onclick={() => (open = true)}
	aria-label={tr('Пожаловаться')}
	title={tr('Пожаловаться')}
>
	<Flag class="size-4" />
	{#if !compact}<span class="hidden sm:inline">{tr('Пожаловаться')}</span>{/if}
</button>

<Modal bind:open title={tr('Пожаловаться')}>
	<form class="space-y-4" onsubmit={submit}>
		<div class="flex flex-wrap gap-2">
			{#each reasons as r (r)}
				<button
					type="button"
					class="chip {reason === r ? 'border-accent bg-accent-soft text-accent-text' : ''}"
					aria-pressed={reason === r}
					onclick={() => (reason = r)}>{r}</button
				>
			{/each}
		</div>
		<textarea
			class="min-h-20 input"
			maxlength="300"
			placeholder={tr('Подробности (необязательно)')}
			bind:value={details}></textarea>
		<p class="text-xs text-muted">
			{tr('Жалобу увидит только модератор. Автор не узнает, кто её отправил.')}
		</p>
		<button class="btn w-full btn-primary" disabled={!reason}>{tr('Отправить жалобу')}</button>
	</form>
</Modal>
