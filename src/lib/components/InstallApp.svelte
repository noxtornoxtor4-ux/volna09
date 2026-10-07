<script lang="ts">
	import { tr } from '#lib/i18n.ts';
	import {
		CircleCheck,
		Download,
		EllipsisVertical,
		MonitorDown,
		Share,
		SquarePlus,
		X
	} from '@lucide/svelte';
	import { installer } from '#lib/install.svelte.ts';

	/** banner — компактное предложение на главной; full — подробная инструкция в настройках */
	let { variant = 'full' }: { variant?: 'banner' | 'full' } = $props();
</script>

{#if variant === 'banner'}
	{#if installer.suggest}
		<div
			class="relative mb-6 flex items-center gap-3 overflow-hidden rounded-3xl bg-ink p-3 text-bg"
		>
			<img src="/icon-192.png" alt="" class="size-11 shrink-0 rounded-2xl" />
			<div class="min-w-0 flex-1">
				<div class="truncate text-sm font-bold">{tr('Приложение «Волна»')}</div>
				{#if installer.ios}
					<div class="truncate text-xs opacity-75">{tr('Поделиться → «На экран „Домой“»')}</div>
				{/if}
			</div>
			{#if installer.canPrompt}
				<button
					class="btn shrink-0 bg-accent px-3 py-2 text-xs text-accent-ink"
					onclick={() => installer.install()}
				>
					<Download class="size-4" />
					{tr('Установить')}
				</button>
			{:else}
				<a
					href="/settings?s=install"
					class="btn shrink-0 bg-accent px-3 py-2 text-xs text-accent-ink">{tr('Как?')}</a
				>
			{/if}
			<button
				class="grid size-8 shrink-0 place-items-center rounded-full opacity-60 hover:opacity-100"
				onclick={() => installer.dismiss()}
				aria-label={tr('Скрыть')}
			>
				<X class="size-4" />
			</button>
		</div>
	{/if}
{:else}
	<div class="space-y-4">
		<section class="flex flex-col items-center gap-4 card p-6 text-center">
			<img src="/icon-192.png" alt="" class="size-24 rounded-[1.75rem] shadow-lg" />
			<div>
				<h2 class="text-xl font-extrabold">{tr('Волна на вашем устройстве')}</h2>
				<p class="mt-1 text-sm text-muted">
					{tr(
						'Иконка на главном экране, отдельное окно без адресной строки и работа без интернета.'
					)}
				</p>
			</div>
			{#if installer.installed}
				<span class="btn bg-pastel-green text-pastel-green-ink"
					><CircleCheck class="size-4" /> {tr('Приложение установлено')}</span
				>
			{:else if installer.canPrompt}
				<button class="btn w-full max-w-xs btn-primary py-3" onclick={() => installer.install()}>
					<Download class="size-4" />
					{tr('Установить приложение')}
				</button>
			{:else}
				<p class="rounded-2xl bg-surface-2 px-4 py-3 text-sm">
					{tr('Установите вручную — инструкции ниже.')}
				</p>
			{/if}
		</section>

		<section class="card p-5">
			<h3 class="font-extrabold">{tr('📱 iPhone и iPad (Safari)')}</h3>
			<ol class="mt-3 space-y-2.5 text-sm">
				<li class="flex items-center gap-3">
					<span class="grid size-8 shrink-0 place-items-center rounded-xl bg-surface-2"
						><Share class="size-4" /></span
					>{tr('Нажмите «Поделиться» внизу экрана')}
				</li>
				<li class="flex items-center gap-3">
					<span class="grid size-8 shrink-0 place-items-center rounded-xl bg-surface-2"
						><SquarePlus class="size-4" /></span
					>{tr('Выберите «На экран „Домой“»')}
				</li>
				<li class="flex items-center gap-3">
					<span class="grid size-8 shrink-0 place-items-center rounded-xl bg-surface-2"
						><CircleCheck class="size-4" /></span
					>{tr('Нажмите «Добавить» — иконка появится на экране')}
				</li>
			</ol>
		</section>

		<section class="card p-5">
			<h3 class="font-extrabold">🤖 Android (Chrome)</h3>
			<ol class="mt-3 space-y-2.5 text-sm">
				<li class="flex items-center gap-3">
					<span class="grid size-8 shrink-0 place-items-center rounded-xl bg-surface-2"
						><EllipsisVertical class="size-4" /></span
					>{tr('Откройте меню браузера ⋮ в правом верхнем углу')}
				</li>
				<li class="flex items-center gap-3">
					<span class="grid size-8 shrink-0 place-items-center rounded-xl bg-surface-2"
						><Download class="size-4" /></span
					>{tr('Выберите «Установить приложение»')}
				</li>
			</ol>
		</section>

		<section class="card p-5">
			<h3 class="font-extrabold">{tr('💻 Компьютер (Chrome, Edge)')}</h3>
			<ol class="mt-3 space-y-2.5 text-sm">
				<li class="flex items-center gap-3">
					<span class="grid size-8 shrink-0 place-items-center rounded-xl bg-surface-2"
						><MonitorDown class="size-4" /></span
					>{tr('Нажмите значок установки справа в адресной строке')}
				</li>
				<li class="flex items-center gap-3">
					<span class="grid size-8 shrink-0 place-items-center rounded-xl bg-surface-2"
						><CircleCheck class="size-4" /></span
					>{tr('Подтвердите «Установить» — «Волна» откроется в своём окне')}
				</li>
			</ol>
		</section>
	</div>
{/if}
