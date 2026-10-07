<script lang="ts">
	import { tr } from '#lib/i18n.ts';
	import { BellRing, Camera, Hourglass, Trash, Users } from '@lucide/svelte';
	import { app } from '#lib/app.svelte.ts';
	import Calendar, { type Mark } from '#lib/components/Calendar.svelte';
	import { day, toneClass } from '#lib/data.ts';
	import { compressImage, takeFile } from '#lib/files.ts';
	import { formatDate, relativeDay } from '#lib/format.ts';
	import type { Opportunity } from '#lib/types.ts';

	let selected = $state(day(0));
	let uploading = $state(false);
	const today = day(0);

	/** События, которые относятся к текущему аккаунту, со статусом */
	const events = $derived.by<{ o: Opportunity; status: 'approved' | 'pending' }[]>(() => {
		if (app.isOrg) return app.orgOpportunities.map((o) => ({ o, status: 'approved' as const }));
		return app.applications
			.filter((a) => a.personId === 'me' && a.status !== 'declined')
			.map((a) => ({
				o: app.opportunity(a.opportunityId)!,
				status: a.status as 'approved' | 'pending'
			}))
			.filter((e) => e.o);
	});

	const marks = $derived.by(() => {
		const result: Record<string, Mark[]> = {};
		const add = (date: string, mark: Mark) => (result[date] ??= []).push(mark);
		for (const e of events) add(e.o.date, e.status === 'approved' ? 'event' : 'pending');
		if (!app.isOrg) for (const h of app.myHours) if (h.status === 'verified') add(h.date, 'done');
		for (const p of app.dayPhotos.filter((p) => p.ownerId === app.actorId)) add(p.date, 'photo');
		return result;
	});

	const dayEvents = $derived(events.filter((e) => e.o.date === selected));
	const dayHours = $derived(app.isOrg ? [] : app.myHours.filter((h) => h.date === selected));
	const photos = $derived(app.photosFor(selected));
	const isMarked = $derived(dayEvents.length > 0 || dayHours.length > 0 || photos.length > 0);
	const upcoming = $derived(
		events.filter((e) => e.o.date >= today).sort((a, b) => a.o.date.localeCompare(b.o.date))
	);

	function dayBefore(date: string) {
		return new Date(Date.parse(`${date}T00:00:00`) - 864e5).toLocaleDateString('sv-SE');
	}

	async function addPhoto(e: Event) {
		const file = takeFile(e);
		if (!file) return;
		uploading = true;
		app.addDayPhoto(selected, await compressImage(file, 900, 0.75));
		uploading = false;
	}
</script>

<svelte:head><title>{tr('Календарь — Волна')}</title></svelte:head>

<h1 class="mb-5 text-2xl font-extrabold tracking-tight sm:text-3xl">{tr('Календарь')}</h1>

<div class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
	<section class="card p-4 sm:p-6">
		<Calendar bind:selected {marks} />
	</section>

	<section class="card p-4 sm:p-6">
		<h2 class="text-lg font-extrabold first-letter:uppercase">
			{formatDate(selected, { weekday: 'long', day: 'numeric', month: 'long' })}
		</h2>
		<p class="text-sm text-muted">{relativeDay(selected)}</p>

		<ul class="mt-4 space-y-2">
			{#each dayEvents as { o, status } (o.id)}
				<li>
					<a
						href="/o?id={o.id}"
						class="flex items-center gap-3 rounded-3xl p-3 transition hover:brightness-95 {toneClass[
							o.tone
						].bg}"
					>
						<span
							class="grid size-12 shrink-0 place-items-center rounded-2xl bg-surface/70 text-2xl"
							>{o.emoji}</span
						>
						<div class="min-w-0 flex-1">
							<div class="truncate font-bold">{o.title}</div>
							<div class="text-xs text-muted">{o.time} · {o.place}</div>
							{#if app.isOrg}
								<div class="mt-1 flex items-center gap-1 text-xs font-semibold">
									<Users class="size-3.5" />{tr('{0} участников', app.participants(o.id).length)}
								</div>
							{:else if status === 'approved'}
								<div class="mt-1 text-xs font-semibold text-pastel-blue-ink">
									{tr('Вы участвуете')}
								</div>
							{:else}
								<div class="mt-1 text-xs font-semibold text-pastel-yellow-ink">
									{tr('Заявка на рассмотрении')}
								</div>
							{/if}
						</div>
					</a>
					{#if status === 'approved' && o.date > today}
						<p class="mt-1.5 flex items-center gap-1.5 px-2 text-xs text-muted">
							<BellRing class="size-3.5" />
							{tr('Напомним {0} — за день до начала', formatDate(dayBefore(o.date)))}
						</p>
					{/if}
				</li>
			{/each}
			{#each dayHours as h (h.id)}
				<li class="flex items-center gap-3 rounded-3xl bg-surface-2 p-3 text-sm">
					<Hourglass class="size-5 text-pastel-green-ink" />
					<span class="flex-1">{h.title}</span>
					<b>{tr('{0} ч', h.hours)}</b>
				</li>
			{/each}
			{#if !dayEvents.length && !dayHours.length}
				<li class="rounded-3xl bg-surface-2 p-4 text-sm text-muted">
					{tr(
						'В этот день ничего не запланировано. {0}',
						app.isOrg
							? tr('Опубликуйте мероприятие в кабинете.')
							: tr('Подайте заявку — после подтверждения день отметится сам.')
					)}
				</li>
			{/if}
		</ul>

		<div class="mt-5">
			<div class="mb-2 flex items-center justify-between">
				<h3 class="font-bold">{tr('Фото дня')}</h3>
				{#if isMarked}
					<label class="btn cursor-pointer btn-soft py-2 text-xs">
						<Camera class="size-4" />
						{uploading ? tr('Загрузка…') : tr('Добавить')}
						<input
							type="file"
							accept="image/*"
							class="sr-only"
							onchange={addPhoto}
							disabled={uploading}
						/>
					</label>
				{/if}
			</div>
			{#if photos.length}
				<div class="grid grid-cols-3 gap-2">
					{#each photos as p (p.id)}
						<div class="group relative aspect-square overflow-hidden rounded-2xl">
							<img src={p.src} alt="" class="size-full object-cover" />
							<button
								class="absolute top-1 right-1 grid size-7 place-items-center rounded-full bg-black/50 text-white opacity-0 transition group-hover:opacity-100 focus:opacity-100"
								onclick={() => app.removeDayPhoto(p.id)}
								aria-label={tr('Удалить фото')}
							>
								<Trash class="size-3.5" />
							</button>
						</div>
					{/each}
				</div>
			{:else}
				<p class="text-sm text-muted">
					{isMarked
						? tr('Сохраните воспоминания об этом дне.')
						: tr('Фото можно добавить в отмеченные дни.')}
				</p>
			{/if}
		</div>
	</section>
</div>

<section class="mt-5">
	<h2 class="mb-3 text-lg font-extrabold">{tr('Ближайшие')}</h2>
	<div class="-mx-4 no-scrollbar flex gap-3 overflow-x-auto px-4 sm:mx-0 sm:px-0">
		{#each upcoming as { o, status } (o.id)}
			<button
				class="w-60 shrink-0 card p-3 text-left transition hover:border-accent"
				onclick={() => (selected = o.date)}
			>
				<div class="flex items-center gap-2">
					<span class="grid size-10 place-items-center rounded-xl text-xl {toneClass[o.tone].bg}"
						>{o.emoji}</span
					>
					<div class="min-w-0">
						<div class="text-xs font-bold text-accent-text">
							{formatDate(o.date)} · {relativeDay(o.date)}
						</div>
						<div class="truncate text-sm font-bold">{o.title}</div>
					</div>
				</div>
				<div
					class="mt-2 text-xs {status === 'approved'
						? 'text-pastel-green-ink'
						: 'text-pastel-yellow-ink'}"
				>
					{app.isOrg
						? tr('{0} участников', app.participants(o.id).length)
						: status === 'approved'
							? tr('✓ участие подтверждено')
							: tr('⏳ ждёт подтверждения')}
				</div>
			</button>
		{:else}
			<p class="text-sm text-muted">{tr('Пока нет предстоящих мероприятий.')}</p>
		{/each}
	</div>
</section>
