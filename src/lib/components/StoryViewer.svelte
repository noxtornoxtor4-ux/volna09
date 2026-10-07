<script lang="ts">
	import { tr } from '#lib/i18n.ts';
	import { onDestroy } from 'svelte';
	import { fade, scale } from 'svelte/transition';
	import {
		Bell,
		BellRing,
		CalendarDays,
		Check,
		ChevronLeft,
		ChevronRight,
		Hourglass,
		MapPin,
		Users,
		X
	} from '@lucide/svelte';
	import { app } from '#lib/app.svelte.ts';
	import { categories, toneClass } from '#lib/data.ts';
	import { formatDate, hoursLabel } from '#lib/format.ts';
	import type { Topic } from '#lib/types.ts';

	const SLIDE_MS = 6000;

	let {
		topics,
		start,
		onclose,
		onseen
	}: { topics: Topic[]; start: number; onclose: () => void; onseen: (id: string) => void } =
		$props();

	// svelte-ignore state_referenced_locally
	let topicIndex = $state(start);
	let slide = $state(0);
	let progress = $state(0);

	const topic = $derived(topics[topicIndex]);
	const slides = $derived(app.byTopic(topic.id));
	const o = $derived(slides[slide]);
	const paused = $derived(!!app.applyingId);

	$effect(() => onseen(topic.id));

	const timer = setInterval(() => {
		if (paused) return;
		progress += 100 / (SLIDE_MS / 100);
		if (progress >= 100) next();
	}, 100);

	function next() {
		progress = 0;
		if (slide < slides.length - 1) slide += 1;
		else if (topicIndex < topics.length - 1) {
			topicIndex += 1;
			slide = 0;
		} else onclose();
	}

	function prev() {
		progress = 0;
		if (slide > 0) slide -= 1;
		else if (topicIndex > 0) {
			topicIndex -= 1;
			slide = 0;
		}
	}

	function keydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && !app.applyingId) onclose();
		if (e.key === 'ArrowRight') next();
		if (e.key === 'ArrowLeft') prev();
	}

	onDestroy(() => clearInterval(timer));
</script>

<svelte:window onkeydown={keydown} />

<div
	class="fixed inset-0 z-50 flex items-center justify-center bg-black/90 sm:p-6"
	transition:fade={{ duration: 150 }}
>
	<button
		class="absolute top-4 right-4 hidden size-11 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:grid"
		onclick={onclose}
		aria-label={tr('Закрыть')}
	>
		<X class="size-5" />
	</button>
	<button
		class="absolute left-[calc(50%-15rem)] hidden size-11 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 lg:grid"
		onclick={prev}
		aria-label={tr('Назад')}
	>
		<ChevronLeft class="size-5" />
	</button>
	<button
		class="absolute right-[calc(50%-15rem)] hidden size-11 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 lg:grid"
		onclick={next}
		aria-label={tr('Дальше')}
	>
		<ChevronRight class="size-5" />
	</button>

	<div
		class="relative flex h-dvh w-full flex-col overflow-hidden sm:h-[min(92dvh,800px)] sm:max-w-sm sm:rounded-[2rem] {toneClass[
			o?.tone ?? topic.tone
		].bg}"
		transition:scale={{ start: 0.95, duration: 200 }}
	>
		<!-- Полоски прогресса -->
		<div class="absolute inset-x-3 top-3 z-20 flex gap-1">
			{#each { length: Math.max(slides.length, 1) }, i (i)}
				<span class="h-1 flex-1 overflow-hidden rounded-full bg-black/15">
					<span
						class="block h-full rounded-full bg-ink/80"
						style="width: {i < slide ? 100 : i === slide ? progress : 0}%"
					></span>
				</span>
			{/each}
		</div>

		<header class="absolute inset-x-3 top-7 z-20 flex items-center gap-2">
			<span class="grid size-10 place-items-center rounded-full bg-surface text-xl shadow"
				>{topic.emoji}</span
			>
			<div class="min-w-0 flex-1 leading-tight">
				<div class="font-extrabold">{tr(topic.label)}</div>
				<div class="text-xs text-ink/70">
					{slides.length ? tr('{0} из {1}', slide + 1, slides.length) : tr('пока пусто')}
				</div>
			</div>
			<button
				class="grid size-10 place-items-center rounded-full bg-surface/80 sm:hidden"
				onclick={onclose}
				aria-label={tr('Закрыть')}
			>
				<X class="size-5" />
			</button>
		</header>

		{#key `${topic.id}-${slide}`}
			{#if o}
				<div class="relative flex flex-1 flex-col" in:fade={{ duration: 200 }}>
					<div class="relative flex-1">
						{#if o.poster}
							<img src={o.poster} alt="" class="absolute inset-0 size-full object-cover" />
						{:else}
							<div
								class="absolute top-1/4 left-1/2 size-72 -translate-x-1/2 rounded-full bg-surface/40 blur-3xl"
							></div>
							<span
								class="absolute inset-0 grid place-items-center pb-16 text-[9rem] drop-shadow-lg"
								aria-hidden="true">{o.emoji}</span
							>
						{/if}
						<!-- Тап по левой и правой половине: назад и вперёд -->
						<button
							class="absolute inset-y-0 left-0 z-10 w-1/3"
							onclick={prev}
							aria-label={tr('Предыдущий постер')}
						></button>
						<button
							class="absolute inset-y-0 right-0 z-10 w-2/3"
							onclick={next}
							aria-label={tr('Следующий постер')}
						></button>
					</div>

					<div
						class="relative z-20 space-y-3 rounded-t-[2rem] bg-surface p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
					>
						<span
							class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold {toneClass[
								categories[o.category].tone
							].bg} {toneClass[categories[o.category].tone].text}"
						>
							{categories[o.category].label}
						</span>
						<a
							href="/o?id={o.id}"
							class="block text-xl leading-tight font-extrabold tracking-tight hover:underline"
							>{o.title}</a
						>
						<p class="text-sm text-muted">{app.org(o.orgId)?.name}</p>
						<div class="grid grid-cols-2 gap-1.5 text-[13px]">
							<span class="flex items-center gap-1.5"
								><CalendarDays class="size-4 text-muted" />{formatDate(o.date)} · {o.time}</span
							>
							<span class="flex items-center gap-1.5"
								><MapPin class="size-4 text-muted" /><span class="truncate">{o.place}</span></span
							>
							<span class="flex items-center gap-1.5"
								><Hourglass class="size-4 text-muted" />+{hoursLabel(o.hours)}</span
							>
							<span class="flex items-center gap-1.5"
								><Users class="size-4 text-muted" />{tr(
									'{0}/{1} человек',
									app.taken(o.id),
									o.spots
								)}</span
							>
						</div>
						<div class="flex gap-2 pt-1">
							{#if app.myApplication(o.id)}
								<span class="btn flex-1 btn-soft"
									><Check class="size-4" /> {tr('Анкета отправлена')}</span
								>
							{:else}
								<button class="btn flex-1 btn-primary py-3" onclick={() => app.openApply(o.id)}
									>{tr('Податься')}</button
								>
							{/if}
							<button
								class="btn flex-1 {app.isReminded(o.id) ? 'btn-soft' : 'btn-ghost'} py-3"
								onclick={() => app.toggleReminder(o.id)}
							>
								{#if app.isReminded(o.id)}<BellRing class="size-4" /> {tr('Напомним')}{:else}<Bell
										class="size-4"
									/>
									{tr('Напомнить позже')}{/if}
							</button>
						</div>
					</div>
				</div>
			{:else}
				<div class="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center" in:fade>
					<span class="text-7xl">{topic.emoji}</span>
					<p class="text-lg font-extrabold">
						{tr('По теме «{0}» пока нет мероприятий', tr(topic.label))}
					</p>
					<p class="text-sm text-ink/70">
						{tr('Организаторы увидят тему и смогут отметить ею свои события.')}
					</p>
					<button class="mt-2 btn bg-surface" onclick={next}>{tr('Следующая тема')}</button>
				</div>
			{/if}
		{/key}
	</div>
</div>
