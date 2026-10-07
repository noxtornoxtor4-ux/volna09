<script lang="ts">
	import { tr } from '#lib/i18n.ts';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import {
		BadgeCheck,
		Bell,
		BellRing,
		CalendarDays,
		Check,
		ChevronLeft,
		CircleCheck,
		Clock,
		Hourglass,
		MapPin,
		Megaphone,
		MessageCircleQuestion,
		Rocket,
		Share2,
		Users
	} from '@lucide/svelte';
	import { app } from '#lib/app.svelte.ts';
	import Avatar from '#lib/components/Avatar.svelte';
	import PromoteSheet from '#lib/components/PromoteSheet.svelte';
	import { ME, categories, toneClass } from '#lib/data.ts';
	import { formatDate, hoursLabel, relativeDay } from '#lib/format.ts';

	const id = $derived(page.url.searchParams.get('id') ?? '');
	const o = $derived(app.opportunity(id));
	const org = $derived(o ? app.org(o.orgId) : undefined);
	const mine = $derived(o ? app.myApplication(o.id) : undefined);
	const owner = $derived(app.isOrg && o?.orgId === app.myOrgId);
	const participants = $derived(o ? app.participants(o.id) : []);
	const questions = $derived(o ? app.threadsFor(o.id) : []);
	let promoting = $state<string | null>(null);

	onMount(() => {
		if (page.url.searchParams.get('apply') && o && !mine) app.openApply(o.id);
	});

	async function share() {
		const url = location.href.split('&')[0];
		try {
			if (navigator.share) await navigator.share({ title: o?.title, url });
			else {
				await navigator.clipboard.writeText(url);
				app.notify(tr('Ссылка скопирована'));
			}
		} catch {
			// окно «Поделиться» закрыто
		}
	}
</script>

<svelte:head><title>{tr('{0} — Волна', o?.title ?? tr('Мероприятие'))}</title></svelte:head>

{#if !o}
	<div class="card p-10 text-center">
		<p class="text-lg font-bold">{tr('Мероприятие не найдено')}</p>
		<a href="/" class="mt-4 btn btn-primary">{tr('К возможностям')}</a>
	</div>
{:else}
	{@const category = categories[o.category]}
	<div class="mb-4 flex items-center justify-between">
		<button class="btn btn-ghost" onclick={() => history.back()}
			><ChevronLeft class="size-4" /> {tr('Назад')}</button
		>
		<button
			class="btn size-10 rounded-full btn-ghost p-0"
			onclick={share}
			aria-label={tr('Поделиться')}><Share2 class="size-4" /></button
		>
	</div>

	<div class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
		<div class="space-y-5">
			<!-- Постер -->
			<div class="relative aspect-[16/10] overflow-hidden rounded-[2rem] {toneClass[o.tone].bg}">
				{#if o.poster}
					<img src={o.poster} alt="" class="size-full object-cover" />
				{:else}
					<div class="absolute -top-16 -left-10 size-72 rounded-full bg-surface/40 blur-3xl"></div>
					<span
						class="absolute inset-0 grid place-items-center text-[8rem] drop-shadow-lg"
						aria-hidden="true">{o.emoji}</span
					>
				{/if}
				<div class="absolute top-4 left-4 flex flex-wrap gap-2">
					<span
						class="inline-flex items-center gap-1.5 rounded-full bg-surface/90 px-3 py-1.5 text-xs font-bold backdrop-blur {toneClass[
							category.tone
						].text}"
					>
						<category.icon class="size-3.5" />
						{category.label}
					</span>
					{#if app.isPromoted(o)}
						<span
							class="inline-flex items-center gap-1 rounded-full bg-ink/80 px-3 py-1.5 text-xs font-bold text-bg"
							>{tr('Продвигается')}</span
						>
					{/if}
				</div>
			</div>

			<div>
				<h1 class="text-2xl leading-tight font-extrabold tracking-tight sm:text-3xl">{o.title}</h1>
				<div class="mt-2 flex flex-wrap gap-2">
					{#each o.tags as tag (tag)}
						{@const t = app.topic(tag)}
						{#if t}<span
								class="rounded-full px-3 py-1 text-xs font-semibold {toneClass[t.tone]
									.bg} {toneClass[t.tone].text}">{t.emoji} {tr(t.label)}</span
							>{/if}
					{/each}
				</div>
			</div>

			<section class="grid grid-cols-2 gap-2 sm:grid-cols-3">
				{#each [{ icon: CalendarDays, label: tr('Дата'), value: `${formatDate(o.date)}, ${relativeDay(o.date)}` }, { icon: Clock, label: tr('Время'), value: o.time }, { icon: MapPin, label: tr('Место'), value: o.place }, { icon: Hourglass, label: tr('Волонтёрские часы'), value: `+${hoursLabel(o.hours)}` }, { icon: Users, label: tr('Участники'), value: tr('{0} из {1}', app.taken(o.id), o.spots) }, { icon: Bell, label: tr('Заявки до'), value: o.deadline ? formatDate(o.deadline) : tr('без дедлайна') }] as item (item.label)}
					<div class="rounded-3xl bg-surface p-3.5 ring-1 ring-line">
						<item.icon class="size-5 text-accent-text" />
						<div class="mt-2 text-xs text-muted">{item.label}</div>
						<div class="text-sm font-bold">{item.value}</div>
					</div>
				{/each}
			</section>

			<section class="card p-5">
				<h2 class="mb-2 text-lg font-extrabold">{tr('О мероприятии')}</h2>
				<p class="text-[15px] leading-relaxed">{o.description}</p>
			</section>

			{#if o.tasks.length}
				<section class="card p-5">
					<h2 class="mb-3 text-lg font-extrabold">{tr('Что нужно делать')}</h2>
					<ol class="space-y-2.5">
						{#each o.tasks as task, i (i)}
							<li class="flex gap-3">
								<span
									class="grid size-7 shrink-0 place-items-center rounded-full bg-accent text-sm font-bold text-accent-ink"
									>{i + 1}</span
								>
								<span class="pt-0.5 text-[15px]">{task}</span>
							</li>
						{/each}
					</ol>
				</section>
			{/if}

			{#if o.requirements.length}
				<section class="card p-5">
					<h2 class="mb-3 text-lg font-extrabold">{tr('Требования')}</h2>
					<ul class="space-y-2">
						{#each o.requirements as r (r)}
							<li class="flex items-center gap-2 text-[15px]">
								<CircleCheck class="size-5 shrink-0 text-pastel-green-ink" />{r}
							</li>
						{/each}
					</ul>
				</section>
			{/if}
		</div>

		<aside class="space-y-4 lg:sticky lg:top-10 lg:self-start">
			{#if org}
				<div class="card p-4">
					<a href={owner ? '/profile' : `/u?id=${org.id}`} class="flex items-center gap-3">
						<Avatar id={org.id} size="lg" />
						<div class="min-w-0">
							<div class="flex items-center gap-1 font-bold">
								{org.name}{#if org.verified}<BadgeCheck
										class="size-4 shrink-0 text-accent-text"
									/>{/if}
							</div>
							<div class="text-xs text-muted">
								{tr('{0} подписчиков', app.followersCount(org.id))}
							</div>
						</div>
					</a>
					{#if !app.isOrg}
						<button
							class="mt-3 btn w-full {app.isFollowing(org.id) ? 'btn-ghost' : 'btn-soft'}"
							onclick={() => app.toggleFollow(org.id)}
						>
							{app.isFollowing(org.id) ? tr('Вы подписаны') : tr('Подписаться')}
						</button>
					{/if}
				</div>
			{/if}

			<div class="card p-4">
				<div class="mb-2 text-sm font-bold">{tr('Идут · {0}', participants.length)}</div>
				<div class="flex -space-x-2">
					{#each participants.slice(0, 8) as a (a.id)}
						<Avatar id={a.personId} size="sm" ring />
					{:else}
						<span class="text-sm text-muted">{tr('Станьте первым участником')}</span>
					{/each}
				</div>
			</div>

			<!-- Действия -->
			<div
				class="fixed inset-x-0 bottom-[68px] z-30 border-t border-line bg-surface/95 p-3 backdrop-blur-lg lg:static lg:rounded-3xl lg:border lg:p-4"
			>
				{#if owner}
					<div class="grid grid-cols-2 gap-2">
						<a href="/notifications?event={o.id}" class="btn btn-primary"
							><Megaphone class="size-4" /> {tr('Уведомление')}</a
						>
						<a href="/notifications?event={o.id}" class="btn btn-soft"
							><MessageCircleQuestion class="size-4" /> {tr('Вопросы · {0}', questions.length)}</a
						>
						<button class="btn btn-ghost" onclick={() => (promoting = o.id)}
							><Rocket class="size-4" /> {tr('Продвигать')}</button
						>
						<a href="/cabinet?folder=applications" class="btn btn-ghost"
							><Users class="size-4" /> {tr('Заявки')}</a
						>
					</div>
				{:else if !app.isOrg}
					<div class="flex gap-2">
						{#if mine}
							<span
								class="btn flex-1 {mine.status === 'approved'
									? 'bg-pastel-green text-pastel-green-ink'
									: 'btn-soft'}"
							>
								<Check class="size-4" />
								{mine.status === 'approved'
									? tr('Вы участвуете')
									: mine.status === 'declined'
										? tr('Отклонено')
										: tr('На рассмотрении')}
							</span>
						{:else}
							<button class="btn flex-1 btn-primary py-3" onclick={() => app.openApply(o.id)}
								>{tr('Податься')}</button
							>
						{/if}
						<button
							class="btn {app.isReminded(o.id) ? 'btn-soft' : 'btn-ghost'} px-3"
							onclick={() => app.toggleReminder(o.id)}
							aria-label={tr('Напомнить позже')}
							title={tr('Напомнить позже')}
						>
							{#if app.isReminded(o.id)}<BellRing class="size-5" />{:else}<Bell
									class="size-5"
								/>{/if}
						</button>
						<a
							href="/chat?id={app.threadId(o.id, ME)}"
							class="btn btn-ghost px-3"
							aria-label={tr('Задать вопрос организатору')}
							title={tr('Задать вопрос организатору')}
						>
							<MessageCircleQuestion class="size-5" />
						</a>
					</div>
				{:else}
					<p class="text-center text-sm text-muted">
						{tr('Вы смотрите мероприятие другой организации.')}
					</p>
				{/if}
			</div>
			<div class="h-20 lg:hidden"></div>
		</aside>
	</div>
	<PromoteSheet bind:opportunityId={promoting} />
{/if}
