<script lang="ts">
	import { tr } from '#lib/i18n.ts';
	import { Download, ExternalLink, Minus, Plus, X } from '@lucide/svelte';
	import type { Snippet } from 'svelte';
	import { fade } from 'svelte/transition';

	/**
	 * Полноэкранный просмотр оригинала: фото с масштабированием (колесо, щипок, двойной тап, кнопки)
	 * и перемещением, PDF и другие документы — во встроенном просмотрщике браузера.
	 */
	let {
		src,
		kind,
		title,
		fileName,
		onclose,
		details
	}: {
		src?: string;
		kind: 'image' | 'pdf' | 'video' | 'file';
		title: string;
		fileName?: string;
		onclose: () => void;
		details?: Snippet;
	} = $props();

	const MIN = 1;
	const MAX = 6;
	let scale = $state(1);
	let x = $state(0);
	let y = $state(0);
	let stage = $state<HTMLDivElement>();
	// Координаты пальцев нужны только обработчикам, не разметке
	// eslint-disable-next-line svelte/prefer-svelte-reactivity
	const pointers = new Map<number, { x: number; y: number }>();
	let pinchDistance = 0;
	let dragging = $state(false);

	const clampScale = (n: number) => Math.min(MAX, Math.max(MIN, n));

	/** Масштаб вокруг точки (cx, cy) относительно центра сцены */
	function zoomAt(next: number, cx = 0, cy = 0) {
		const target = clampScale(next);
		const ratio = target / scale;
		x = cx - (cx - x) * ratio;
		y = cy - (cy - y) * ratio;
		scale = target;
		if (scale === 1) x = y = 0;
	}

	function fromCenter(e: { clientX: number; clientY: number }) {
		const rect = stage!.getBoundingClientRect();
		return [e.clientX - rect.left - rect.width / 2, e.clientY - rect.top - rect.height / 2];
	}

	function wheel(e: WheelEvent) {
		e.preventDefault();
		const [cx, cy] = fromCenter(e);
		zoomAt(scale * (e.deltaY < 0 ? 1.15 : 1 / 1.15), cx, cy);
	}

	function down(e: PointerEvent) {
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
		dragging = true;
		pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
		if (pointers.size === 2) {
			const [a, b] = [...pointers.values()];
			pinchDistance = Math.hypot(a.x - b.x, a.y - b.y);
		}
	}

	function move(e: PointerEvent) {
		const prev = pointers.get(e.pointerId);
		if (!prev) return;
		pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
		if (pointers.size === 2) {
			const [a, b] = [...pointers.values()];
			const distance = Math.hypot(a.x - b.x, a.y - b.y);
			const [cx, cy] = fromCenter({ clientX: (a.x + b.x) / 2, clientY: (a.y + b.y) / 2 });
			if (pinchDistance) zoomAt(scale * (distance / pinchDistance), cx, cy);
			pinchDistance = distance;
		} else if (scale > 1) {
			x += e.clientX - prev.x;
			y += e.clientY - prev.y;
		}
	}

	function up(e: PointerEvent) {
		pointers.delete(e.pointerId);
		dragging = pointers.size > 0;
		if (pointers.size < 2) pinchDistance = 0;
	}

	function doubleClick(e: MouseEvent) {
		const [cx, cy] = fromCenter(e);
		zoomAt(scale > 1 ? 1 : 2.5, cx, cy);
	}
</script>

<svelte:window onkeydown={(e) => e.key === 'Escape' && onclose()} />

<div
	class="fixed inset-0 z-[70] flex flex-col bg-[#05080f]/95 text-white"
	role="dialog"
	aria-modal="true"
	aria-label={title}
	transition:fade={{ duration: 150 }}
>
	<header
		class="flex items-center gap-2 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 sm:px-5"
	>
		<h2 class="min-w-0 flex-1 truncate font-bold">{title}</h2>
		{#if kind === 'image'}
			<div class="flex items-center gap-1 rounded-full bg-white/10 p-1">
				<button
					class="grid size-8 place-items-center rounded-full hover:bg-white/15 disabled:opacity-40"
					onclick={() => zoomAt(scale / 1.5)}
					disabled={scale <= MIN}
					aria-label={tr('Уменьшить')}><Minus class="size-4" /></button
				>
				<span class="w-12 text-center text-xs font-semibold tabular-nums"
					>{Math.round(scale * 100)}%</span
				>
				<button
					class="grid size-8 place-items-center rounded-full hover:bg-white/15 disabled:opacity-40"
					onclick={() => zoomAt(scale * 1.5)}
					disabled={scale >= MAX}
					aria-label={tr('Увеличить')}><Plus class="size-4" /></button
				>
			</div>
		{/if}
		{#if src}
			<a
				href={src}
				target="_blank"
				rel="noopener"
				class="grid size-10 place-items-center rounded-full bg-white/10 hover:bg-white/20"
				aria-label={tr('Открыть оригинал')}
				title={tr('Открыть оригинал')}><ExternalLink class="size-4" /></a
			>
			<a
				href={src}
				download={fileName ?? title}
				class="grid size-10 place-items-center rounded-full bg-white/10 hover:bg-white/20"
				aria-label={tr('Скачать')}
				title={tr('Скачать')}><Download class="size-4" /></a
			>
		{/if}
		<button
			class="grid size-10 place-items-center rounded-full bg-white/10 hover:bg-white/20"
			onclick={onclose}
			aria-label={tr('Закрыть')}><X class="size-5" /></button
		>
	</header>

	<div
		bind:this={stage}
		class="relative min-h-0 flex-1 overflow-hidden {kind === 'image' ? 'touch-none' : ''}"
	>
		{#if !src}
			<p class="grid h-full place-items-center px-6 text-center text-sm text-white/70">
				{tr('Оригинал загружается…')}
			</p>
		{:else if kind === 'image'}
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="grid h-full place-items-center {scale > 1
					? 'cursor-grab active:cursor-grabbing'
					: ''}"
				onwheel={wheel}
				onpointerdown={down}
				onpointermove={move}
				onpointerup={up}
				onpointercancel={up}
				ondblclick={doubleClick}
			>
				<img
					{src}
					alt={title}
					draggable="false"
					class="max-h-full max-w-full object-contain select-none"
					style="transform: translate({x}px, {y}px) scale({scale}); transition: {dragging
						? 'none'
						: 'transform 0.15s ease-out'}"
				/>
			</div>
		{:else if kind === 'pdf'}
			<iframe {src} {title} class="size-full bg-white"></iframe>
		{:else if kind === 'video'}
			<!-- svelte-ignore a11y_media_has_caption -->
			<video {src} controls autoplay playsinline class="size-full object-contain"></video>
		{:else}
			<div class="grid h-full place-items-center px-6 text-center">
				<div>
					<p class="text-sm text-white/70">{tr('Этот формат браузер не показывает сам.')}</p>
					<a href={src} download={fileName ?? title} class="mt-3 btn bg-white text-[#091540]"
						><Download class="size-4" /> {tr('Скачать оригинал')}</a
					>
				</div>
			</div>
		{/if}
	</div>

	{#if details}
		<div class="max-h-[35dvh] overflow-y-auto bg-black/40 px-4 py-3 text-sm sm:px-6">
			{@render details()}
		</div>
	{/if}
</div>
