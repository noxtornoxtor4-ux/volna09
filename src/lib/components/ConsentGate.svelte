<script lang="ts">
	import { tr } from '#lib/i18n.ts';
	import { app } from '#lib/app.svelte.ts';
	import Logo from './Logo.svelte';

	/**
	 * Согласие при первом входе: условия использования для всех и разрешение родителей
	 * для волонтёров младше 18 лет. Без него приложение не открывается.
	 */
	let adult = $state<boolean | null>(null);
	let terms = $state(false);
	let parental = $state(false);

	const ready = $derived(terms && adult !== null && (adult || parental));

	function submit(e: SubmitEvent) {
		e.preventDefault();
		if (!ready) return;
		app.saveConsent({ terms: true, adult: !!adult, parental: !adult && parental });
	}
</script>

<div class="fixed inset-0 z-[80] overflow-y-auto bg-bg">
	<form
		class="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-5 px-5 py-10"
		onsubmit={submit}
	>
		<Logo />
		<div>
			<h1 class="text-2xl font-extrabold tracking-tight">{tr('Пара формальностей')}</h1>
			<p class="mt-1 text-sm text-muted">
				{tr('Это нужно один раз, чтобы безопасно участвовать в проектах.')}
			</p>
		</div>

		<div>
			<span class="label">{tr('Сколько вам лет?')}</span>
			<div class="grid grid-cols-2 gap-2">
				{#each [{ value: false, label: tr('Мне меньше 18') }, { value: true, label: tr('Мне 18 или больше') }] as option (option.label)}
					<button
						type="button"
						class="rounded-2xl border-2 px-3 py-3 text-sm font-bold transition {adult ===
						option.value
							? 'border-accent bg-accent-soft text-accent-text'
							: 'border-line text-muted hover:border-accent/50'}"
						aria-pressed={adult === option.value}
						onclick={() => (adult = option.value)}>{option.label}</button
					>
				{/each}
			</div>
		</div>

		<label class="flex items-start gap-3 rounded-2xl bg-surface p-4 text-sm">
			<input
				type="checkbox"
				class="mt-0.5 size-5 shrink-0 accent-[var(--accent-strong)]"
				bind:checked={terms}
				required
			/>
			<span>
				{tr('Мне исполнилось 14 лет, я согласен с')}
				<a href="/terms" target="_blank" class="font-semibold text-accent-text underline"
					>{tr('Условиями использования')}</a
				>
				{tr('и')}
				<a href="/privacy" target="_blank" class="font-semibold text-accent-text underline"
					>{tr('Политикой конфиденциальности')}</a
				>
			</span>
		</label>

		{#if adult === false}
			<label class="flex items-start gap-3 rounded-2xl bg-surface p-4 text-sm">
				<input
					type="checkbox"
					class="mt-0.5 size-5 shrink-0 accent-[var(--accent-strong)]"
					bind:checked={parental}
					required
				/>
				<span>
					{tr(
						'Я подтверждаю, что получил разрешение родителей или опекунов на участие в волонтёрских проектах'
					)}
				</span>
			</label>
		{/if}

		<button class="btn w-full btn-primary py-3" disabled={!ready}>{tr('Продолжить')}</button>
		<button
			type="button"
			class="text-sm font-semibold text-muted hover:text-ink"
			onclick={() => app.logout()}>{tr('Выйти')}</button
		>
	</form>
</div>
