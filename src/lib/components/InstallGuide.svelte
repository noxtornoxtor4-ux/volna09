<script lang="ts">
	import { tr } from '#lib/i18n.ts';
	import {
		ArrowDown,
		CircleCheck,
		Compass,
		EllipsisVertical,
		Share,
		SquarePlus
	} from '@lucide/svelte';
	import { installer } from '#lib/install.svelte.ts';
	import Modal from './Modal.svelte';

	/**
	 * Пошаговая установка там, где браузер не умеет ставить сайт одной кнопкой:
	 * iPhone (только через Safari) и встроенные браузеры Telegram, Instagram и т. п.
	 */
	const steps = [
		{ icon: Share, text: tr('Нажмите «Поделиться» внизу экрана. На iOS 26 она в меню «•••»') },
		{ icon: SquarePlus, text: tr('Пролистайте и выберите «На экран „Домой“»') },
		{ icon: CircleCheck, text: tr('Нажмите «Добавить» — иконка «Волны» появится на экране') }
	];
</script>

<Modal bind:open={installer.guide} title={tr('Установить «Волну»')}>
	<div class="space-y-4">
		{#if installer.inApp}
			<!-- Встроенный браузер: установка возможна только из Safari / Chrome -->
			<div class="rounded-3xl bg-pastel-yellow p-4 text-pastel-yellow-ink">
				<p class="text-sm font-semibold">
					{installer.ios
						? tr(
								'Сайт открыт внутри другого приложения — отсюда iPhone не даёт установить его. Сначала откройте Safari.'
							)
						: tr('Сайт открыт внутри другого приложения. Откройте его в Chrome, чтобы установить.')}
				</p>
				{#if installer.ios}
					<button
						class="mt-3 btn w-full bg-ink py-3 text-bg"
						onclick={() => installer.openInSafari()}
					>
						<Compass class="size-5" />
						{tr('Открыть в Safari')}
					</button>
				{/if}
				<p class="mt-2 flex items-center gap-1.5 text-xs">
					<EllipsisVertical class="size-4 shrink-0" />
					{installer.ios
						? tr('Не открылось? Нажмите ••• вверху справа → «Открыть в Safari»')
						: tr('Нажмите ⋮ вверху справа → «Открыть в браузере»')}
				</p>
			</div>
		{/if}

		{#if installer.ios}
			<ol class="space-y-2.5">
				{#each steps as step, i (i)}
					<li class="flex items-center gap-3 rounded-2xl bg-surface-2 p-3">
						<span
							class="grid size-10 shrink-0 place-items-center rounded-xl bg-surface text-accent-text shadow-sm"
							><step.icon class="size-5" /></span
						>
						<span class="text-sm"><b>{i + 1}.</b> {step.text}</span>
					</li>
				{/each}
			</ol>
			<p class="text-center text-xs text-muted">
				{tr('Apple не разрешает сайтам устанавливаться одной кнопкой — только так, через Safari.')}
			</p>
		{/if}
	</div>
</Modal>

{#if installer.guide && installer.ios && !installer.inApp}
	<!-- Стрелка к панели Safari, где находится кнопка «Поделиться» -->
	<div
		class="pointer-events-none fixed inset-x-0 bottom-2 z-[60] flex justify-center text-accent-text"
		aria-hidden="true"
	>
		<ArrowDown class="size-10 animate-bounce drop-shadow" />
	</div>
{/if}
