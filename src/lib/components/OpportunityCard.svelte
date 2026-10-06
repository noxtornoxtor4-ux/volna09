<script lang="ts">
	import {
		BadgeCheck,
		Bell,
		BellRing,
		CalendarDays,
		Check,
		Clock,
		Hourglass,
		MapPin,
		Users
	} from '@lucide/svelte';
	import { app } from '#lib/app.svelte.ts';
	import { categories, toneClass } from '#lib/data.ts';
	import { formatDate, hoursLabel, relativeDay } from '#lib/format.ts';
	import type { Opportunity } from '#lib/types.ts';

	let { opportunity, preview = false }: { opportunity: Opportunity; preview?: boolean } = $props();

	const o = $derived(opportunity);
	const category = $derived(categories[o.category]);
	const org = $derived(app.org(o.orgId));
	const taken = $derived(preview ? 0 : app.taken(o.id));
	const mine = $derived(preview ? undefined : app.myApplication(o.id));
	const reminded = $derived(!preview && app.isReminded(o.id));
	const full = $derived(taken >= o.spots);
</script>

<article class="flex flex-col overflow-hidden card">
	<div class="relative flex h-32 items-center justify-center {toneClass[o.tone].bg}">
		<span class="text-6xl drop-shadow-sm" aria-hidden="true">{o.emoji}</span>
		<span
			class="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-surface/90 px-3 py-1 text-xs font-bold {toneClass[
				category.tone
			].text}"
		>
			<category.icon class="size-3.5" />
			{category.label}
		</span>
		{#if o.deadline}
			<span
				class="absolute top-3 right-3 rounded-full bg-surface/90 px-3 py-1 text-xs font-semibold text-muted"
			>
				заявки до {formatDate(o.deadline, { day: 'numeric', month: 'short' })}
			</span>
		{/if}
	</div>

	<div class="flex flex-1 flex-col gap-3 p-5">
		<div>
			<h3 class="text-lg leading-snug font-bold">{o.title || 'Название мероприятия'}</h3>
			{#if org}
				<p class="mt-1 flex items-center gap-1 text-sm text-muted">
					{org.emoji}
					{org.name}
					{#if org.verified}<BadgeCheck
							class="size-4 text-accent-text"
							aria-label="Проверенная организация"
						/>{/if}
				</p>
			{/if}
		</div>

		<p class="text-sm text-muted">{o.description}</p>

		<ul class="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
			<li class="flex items-center gap-2">
				<CalendarDays class="size-4 shrink-0 text-muted" />{formatDate(o.date)} · {relativeDay(
					o.date
				)}
			</li>
			<li class="flex items-center gap-2"><Clock class="size-4 shrink-0 text-muted" />{o.time}</li>
			<li class="col-span-2 flex items-center gap-2">
				<MapPin class="size-4 shrink-0 text-muted" />{o.place}
			</li>
			<li class="flex items-center gap-2">
				<Hourglass class="size-4 shrink-0 text-muted" />+{hoursLabel(o.hours)}
			</li>
			<li class="flex items-center gap-2">
				<Users class="size-4 shrink-0 text-muted" />{taken} из {o.spots} мест
			</li>
		</ul>

		<div class="h-1.5 overflow-hidden rounded-full bg-surface-2">
			<div
				class="h-full rounded-full bg-accent transition-all"
				style="width: {Math.min((taken / o.spots) * 100, 100)}%"
			></div>
		</div>

		<div class="mt-auto flex gap-2 pt-1">
			{#if mine}
				<span
					class="btn flex-1 {mine.status === 'approved'
						? 'bg-pastel-green text-pastel-green-ink'
						: mine.status === 'declined'
							? 'bg-surface-2 text-muted'
							: 'btn-soft'}"
				>
					<Check class="size-4" />
					{mine.status === 'approved'
						? 'Вы участвуете'
						: mine.status === 'declined'
							? 'Заявка отклонена'
							: 'Заявка отправлена'}
				</span>
			{:else}
				<button
					class="btn flex-1 btn-primary"
					disabled={preview || full}
					onclick={() => app.apply(o.id)}
				>
					{full ? 'Мест нет' : 'Податься сейчас'}
				</button>
			{/if}
			<button
				class="btn {reminded ? 'btn-soft' : 'btn-ghost'}"
				disabled={preview}
				onclick={() => app.toggleReminder(o.id)}
				aria-pressed={reminded}
			>
				{#if reminded}<BellRing class="size-4" />{:else}<Bell class="size-4" />{/if}
				<span class="hidden sm:inline">{reminded ? 'Напомним' : 'Напомнить позже'}</span>
			</button>
		</div>
	</div>
</article>
