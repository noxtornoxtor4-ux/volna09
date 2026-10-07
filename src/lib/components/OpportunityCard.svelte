<script lang="ts">
	import { tr } from '#lib/i18n.ts';
	import {
		BadgeCheck,
		Bell,
		BellRing,
		CalendarDays,
		Check,
		Hourglass,
		MapPin,
		MessageCircleQuestion,
		Users
	} from '@lucide/svelte';
	import { app } from '#lib/app.svelte.ts';
	import { ME, categories, toneClass } from '#lib/data.ts';
	import { formatDate, hoursLabel, relativeDay } from '#lib/format.ts';
	import type { Opportunity } from '#lib/types.ts';
	import Avatar from './Avatar.svelte';

	let { opportunity, preview = false }: { opportunity: Opportunity; preview?: boolean } = $props();

	const o = $derived(opportunity);
	const category = $derived(categories[o.category]);
	const org = $derived(app.org(o.orgId));
	const taken = $derived(preview ? 0 : app.taken(o.id));
	const mine = $derived(preview ? undefined : app.myApplication(o.id));
	const reminded = $derived(!preview && app.isReminded(o.id));
	const full = $derived(taken >= o.spots);
	const href = $derived(preview ? undefined : `/o?id=${o.id}`);
</script>

<article
	class="group relative flex flex-col overflow-hidden card transition {preview
		? ''
		: 'cursor-pointer hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/5'}"
>
	<!-- Вся карточка — ссылка на мероприятие; кнопки действий лежат поверх неё (z-10) -->
	{#if href}
		<a {href} class="absolute inset-0 z-[1] rounded-[inherit]" aria-label={o.title}></a>
	{/if}
	<div class="relative block aspect-[16/10] overflow-hidden {toneClass[o.tone].bg}">
		{#if o.poster}
			<img
				src={o.poster}
				alt=""
				class="size-full object-cover transition duration-500 group-hover:scale-105"
			/>
		{:else}
			<div class="absolute -top-10 -right-10 size-48 rounded-full bg-surface/40 blur-2xl"></div>
			<span
				class="absolute inset-0 grid place-items-center text-7xl drop-shadow-md transition duration-500 group-hover:scale-110"
				aria-hidden="true"
			>
				{o.emoji}
			</span>
		{/if}
		<span
			class="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-surface/90 px-3 py-1 text-xs font-bold backdrop-blur {toneClass[
				category.tone
			].text}"
		>
			<category.icon class="size-3.5" />
			{category.label}
		</span>
		{#if !preview && app.isPromoted(o)}
			<span
				class="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-ink/80 px-2.5 py-1 text-[11px] font-bold text-bg backdrop-blur"
			>
				{tr('Продвигается')}
			</span>
		{/if}
		{#if o.deadline}
			<span
				class="absolute bottom-3 left-3 rounded-full bg-surface/90 px-3 py-1 text-xs font-semibold backdrop-blur"
			>
				{tr('⏳ заявки до {0}', formatDate(o.deadline, { day: 'numeric', month: 'short' }))}
			</span>
		{/if}
	</div>

	<div class="flex flex-1 flex-col gap-3 p-4 sm:p-5">
		<div>
			<h3 class="text-lg leading-snug font-extrabold tracking-tight group-hover:underline">
				{o.title || tr('Название мероприятия')}
			</h3>
			{#if org}
				<div class="mt-1.5 flex items-center gap-1.5 text-sm text-muted">
					<Avatar id={o.orgId} size="xs" />
					<span class="truncate">{org.name}</span>
					{#if org.verified}<BadgeCheck
							class="size-4 shrink-0 text-accent-text"
							aria-label={tr('Проверенная организация')}
						/>{/if}
				</div>
			{/if}
		</div>

		<p class="line-clamp-2 text-sm text-muted">
			{o.description || tr('Короткое описание мероприятия')}
		</p>

		<ul class="grid grid-cols-2 gap-2 text-[13px]">
			<li class="flex items-center gap-2 rounded-xl bg-surface-2 px-2.5 py-2">
				<CalendarDays class="size-4 shrink-0 text-muted" />
				<span class="truncate"
					>{formatDate(o.date, { day: 'numeric', month: 'short' })} · {o.time}</span
				>
			</li>
			<li class="flex items-center gap-2 rounded-xl bg-surface-2 px-2.5 py-2">
				<MapPin class="size-4 shrink-0 text-muted" />
				<span class="truncate">{o.place || tr('Место')}</span>
			</li>
			<li class="flex items-center gap-2 rounded-xl bg-surface-2 px-2.5 py-2">
				<Hourglass class="size-4 shrink-0 text-muted" />
				<span>+{hoursLabel(o.hours)}</span>
			</li>
			<li class="flex items-center gap-2 rounded-xl bg-surface-2 px-2.5 py-2">
				<Users class="size-4 shrink-0 text-muted" />
				<span>{tr('{0}/{1} человек', taken, o.spots)}</span>
			</li>
		</ul>

		<div class="relative z-10 mt-auto flex gap-2 pt-1">
			{#if mine}
				<a
					{href}
					class="btn flex-1 {mine.status === 'approved'
						? 'bg-pastel-green text-pastel-green-ink'
						: mine.status === 'declined'
							? 'bg-surface-2 text-muted'
							: 'btn-soft'}"
				>
					<Check class="size-4" />
					{mine.status === 'approved'
						? tr('Вы участвуете')
						: mine.status === 'declined'
							? tr('Отклонено')
							: tr('Анкета отправлена')}
				</a>
			{:else}
				<button
					class="btn flex-1 btn-primary"
					disabled={preview || full}
					onclick={() => app.openApply(o.id)}
				>
					{full ? tr('Мест нет') : tr('Податься')}
				</button>
			{/if}
			<button
				class="btn {reminded ? 'btn-soft' : 'btn-ghost'} px-3 sm:px-4"
				disabled={preview}
				onclick={() => app.toggleReminder(o.id)}
				aria-pressed={reminded}
				aria-label={tr('Напомнить позже')}
				title={tr('Напомнить позже')}
			>
				{#if reminded}<BellRing class="size-4" />{:else}<Bell class="size-4" />{/if}
				<span class="hidden text-xs sm:inline"
					>{reminded ? tr('Напомним') : tr('Напомнить позже')}</span
				>
			</button>
			<a
				href={preview ? undefined : `/chat?id=${app.threadId(o.id, ME)}`}
				class="btn btn-ghost px-3"
				aria-label={tr('Задать вопрос организатору')}
				title={tr('Задать вопрос организатору')}
			>
				<MessageCircleQuestion class="size-4" />
			</a>
		</div>
		{#if !preview}
			<p class="-mt-1 text-center text-[11px] text-muted">{relativeDay(o.date)}</p>
		{/if}
	</div>
</article>
