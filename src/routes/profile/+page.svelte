<script lang="ts">
	import {
		Award,
		CalendarPlus,
		CircleCheck,
		CircleX,
		Eye,
		FileText,
		Hourglass,
		Pencil,
		Plus,
		Trash,
		Upload
	} from '@lucide/svelte';
	import { app } from '#lib/app.svelte.ts';
	import Avatar from '#lib/components/Avatar.svelte';
	import Calendar, { type Mark } from '#lib/components/Calendar.svelte';
	import LogHoursForm from '#lib/components/LogHoursForm.svelte';
	import Modal from '#lib/components/Modal.svelte';
	import { ME, day, interests, toneClass } from '#lib/data.ts';
	import { formatDate, hoursLabel, plural } from '#lib/format.ts';
	import type { Certificate, HoursStatus, Tone } from '#lib/types.ts';

	const MAX_FILE_BYTES = 1_500_000;

	let selected = $state(day(0));
	let logOpen = $state(false);
	let planTitle = $state('');
	let viewing = $state<Certificate | null>(null);
	let upload = $state<{
		open: boolean;
		title: string;
		issuer: string;
		fileName: string;
		src?: string;
	}>({
		open: false,
		title: '',
		issuer: '',
		fileName: ''
	});

	const today = day(0);

	const marks = $derived.by(() => {
		const result: Record<string, Mark[]> = {};
		const add = (date: string, mark: Mark) => (result[date] ??= []).push(mark);
		for (const h of app.myHours)
			if (h.status !== 'rejected') add(h.date, h.status === 'verified' ? 'done' : 'pending');
		for (const p of app.plans) add(p.date, 'plan');
		for (const { opportunity } of app.participation)
			if (opportunity.date >= today) add(opportunity.date, 'plan');
		return result;
	});

	const dayHours = $derived(app.myHours.filter((h) => h.date === selected));
	const dayPlans = $derived(app.plans.filter((p) => p.date === selected));
	const dayEvents = $derived(app.participation.filter((p) => p.opportunity.date === selected));
	const projects = $derived(new Set(app.participation.map((p) => p.opportunity.id)).size);

	const statusView: Record<HoursStatus, { label: string; cls: string }> = {
		verified: { label: 'Подтверждено', cls: 'bg-pastel-green text-pastel-green-ink' },
		pending: { label: 'На проверке', cls: 'bg-pastel-yellow text-pastel-yellow-ink' },
		rejected: { label: 'Отклонено', cls: 'bg-surface-2 text-muted' }
	};

	function addPlan(e: SubmitEvent) {
		e.preventDefault();
		if (!planTitle.trim()) return;
		app.addPlan(selected, planTitle.trim());
		planTitle = '';
	}

	function chooseFile(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		input.value = '';
		if (!file) return;
		const base = {
			open: true,
			title: file.name.replace(/\.[^.]+$/, ''),
			issuer: '',
			fileName: file.name
		};
		if (file.size > MAX_FILE_BYTES) {
			// Большой файл показываем до перезагрузки страницы, в хранилище кладём только название
			upload = { ...base, src: URL.createObjectURL(file) };
			return;
		}
		const reader = new FileReader();
		reader.onload = () => (upload = { ...base, src: String(reader.result) });
		reader.readAsDataURL(file);
	}

	function saveCertificate(e: SubmitEvent) {
		e.preventDefault();
		const tones: Tone[] = ['blue', 'yellow', 'green', 'lilac', 'peach'];
		app.addCertificate({
			title: upload.title.trim(),
			issuer: upload.issuer.trim() || 'Без организации',
			date: today,
			fileName: upload.fileName,
			src: upload.src?.startsWith('blob:') ? undefined : upload.src,
			tone: tones[app.certificates.length % tones.length]
		});
		upload.open = false;
	}

	const isImage = (src?: string) => !!src && src.startsWith('data:image');
	const isPdf = (src?: string) => !!src && src.startsWith('data:application/pdf');
</script>

<svelte:head><title>Мой профиль — Волна</title></svelte:head>

<!-- Шапка профиля -->
<section class="mb-5 flex flex-col gap-5 card p-5 sm:flex-row sm:items-center sm:p-6">
	<Avatar id={ME} size="xl" />
	<div class="min-w-0 flex-1">
		<h1 class="text-2xl font-extrabold tracking-tight">{app.profile.name}</h1>
		<p class="text-sm text-muted">
			{app.profile.age}
			{plural(app.profile.age, 'год', 'года', 'лет')} · {app.profile.city}
		</p>
		<p class="mt-2 text-[15px]">{app.profile.bio}</p>
		<div class="mt-3 flex flex-wrap gap-2">
			{#each app.profile.interests as i (i)}
				<span class="rounded-full bg-surface-2 px-3 py-1 text-xs font-semibold"
					>{interests[i].emoji} {interests[i].label}</span
				>
			{/each}
		</div>
	</div>
	<a href="/settings" class="btn self-start btn-ghost"><Pencil class="size-4" /> Редактировать</a>
</section>

<!-- Метрики -->
<section class="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
	<div class="col-span-2 card bg-accent-soft p-5 lg:col-span-1">
		<div class="text-sm font-semibold text-accent-text">Волонтёрских часов</div>
		<div class="mt-1 text-5xl font-extrabold tracking-tight">{app.verifiedHours}</div>
		<div class="mt-1 flex items-center gap-1 text-xs text-muted">
			<CircleCheck class="size-3.5" /> подтверждены организациями
		</div>
	</div>
	<div class="card p-5">
		<div class="text-sm text-muted">На проверке</div>
		<div class="mt-1 text-3xl font-extrabold">{app.pendingHours} ч</div>
	</div>
	<div class="card p-5">
		<div class="text-sm text-muted">Проектов</div>
		<div class="mt-1 text-3xl font-extrabold">{projects}</div>
	</div>
	<div class="col-span-2 card p-5 sm:col-span-1">
		<div class="text-sm text-muted">Сертификатов</div>
		<div class="mt-1 text-3xl font-extrabold">{app.certificates.length}</div>
	</div>
</section>

<!-- Трекер -->
<section class="mb-5 card p-5 sm:p-6">
	<div class="mb-5 flex flex-wrap items-center justify-between gap-3">
		<h2 class="text-lg font-bold">Трекер волонтёрства</h2>
		<button class="btn btn-primary" onclick={() => (logOpen = true)}
			><Plus class="size-4" /> Добавить часы</button
		>
	</div>
	<div class="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
		<Calendar bind:selected {marks} />
		<div class="rounded-3xl bg-surface-2 p-4">
			<h3 class="font-bold">
				{formatDate(selected, { weekday: 'long', day: 'numeric', month: 'long' })}
			</h3>
			<ul class="mt-3 space-y-2 text-sm">
				{#each dayHours as h (h.id)}
					<li class="flex items-center gap-2 rounded-2xl bg-surface p-3">
						<span class="flex-1">{h.title} · {hoursLabel(h.hours)}</span>
						<span class="rounded-full px-2 py-0.5 text-xs font-semibold {statusView[h.status].cls}"
							>{statusView[h.status].label}</span
						>
					</li>
				{/each}
				{#each dayEvents as { opportunity: o } (o.id)}
					<li class="flex items-center gap-2 rounded-2xl bg-surface p-3">
						<span class="flex-1">{o.emoji} {o.title} · {o.time}</span>
						<span
							class="rounded-full bg-pastel-blue px-2 py-0.5 text-xs font-semibold text-pastel-blue-ink"
							>Вы участвуете</span
						>
					</li>
				{/each}
				{#each dayPlans as p (p.id)}
					<li class="flex items-center gap-2 rounded-2xl bg-surface p-3">
						<span class="flex-1">🗓️ {p.title}</span>
						<button
							class="text-muted hover:text-ink"
							onclick={() => app.removePlan(p.id)}
							aria-label="Удалить план"><Trash class="size-4" /></button
						>
					</li>
				{/each}
				{#if !dayHours.length && !dayEvents.length && !dayPlans.length}
					<li class="text-muted">В этот день ничего не отмечено.</li>
				{/if}
			</ul>

			{#if selected <= today}
				<button class="mt-4 btn w-full btn-soft" onclick={() => (logOpen = true)}
					><Hourglass class="size-4" /> Отметить часы за этот день</button
				>
			{/if}
			{#if selected >= today}
				<form class="mt-4 flex gap-2" onsubmit={addPlan}>
					<input
						class="input bg-surface py-2.5"
						placeholder="Запланировать: например, выгул собак"
						bind:value={planTitle}
					/>
					<button class="btn btn-soft px-3" disabled={!planTitle.trim()} aria-label="Запланировать"
						><CalendarPlus class="size-4" /></button
					>
				</form>
			{/if}
		</div>
	</div>

	<h3 class="mt-8 mb-3 font-bold">Журнал часов</h3>
	<ul class="divide-y divide-line">
		{#each app.myHours as h (h.id)}
			{@const org = app.org(h.orgId)}
			<li class="flex items-center gap-3 py-3 text-sm">
				<span
					class="grid size-10 shrink-0 place-items-center rounded-2xl text-lg {org
						? toneClass[org.tone].bg
						: ''}">{org?.emoji}</span
				>
				<div class="min-w-0 flex-1">
					<div class="truncate font-semibold">{h.title}</div>
					<div class="truncate text-xs text-muted">{formatDate(h.date)} · {org?.name}</div>
				</div>
				<span class="font-bold">{h.hours} ч</span>
				<span
					class="hidden rounded-full px-2 py-0.5 text-xs font-semibold sm:inline {statusView[
						h.status
					].cls}">{statusView[h.status].label}</span
				>
				{#if h.status === 'verified'}<CircleCheck
						class="size-4 text-pastel-green-ink sm:hidden"
					/>{:else if h.status === 'rejected'}<CircleX
						class="size-4 text-muted sm:hidden"
					/>{:else}<Hourglass class="size-4 text-pastel-yellow-ink sm:hidden" />{/if}
			</li>
		{/each}
	</ul>
</section>

<div class="grid gap-5 lg:grid-cols-2">
	<!-- История участия -->
	<section class="card p-5 sm:p-6">
		<h2 class="mb-4 text-lg font-bold">История участия</h2>
		<ul class="space-y-3">
			{#each app.participation as { opportunity: o, application: a } (a.id)}
				<li class="flex items-center gap-3">
					<span
						class="grid size-12 shrink-0 place-items-center rounded-2xl text-2xl {toneClass[o.tone]
							.bg}">{o.emoji}</span
					>
					<div class="min-w-0 flex-1">
						<div class="truncate font-semibold">{o.title}</div>
						<div class="truncate text-xs text-muted">
							{app.org(o.orgId)?.name} · {formatDate(o.date, {
								day: 'numeric',
								month: 'short',
								year: 'numeric'
							})}
						</div>
					</div>
					<span class="rounded-full bg-surface-2 px-3 py-1 text-xs font-semibold"
						>{a.role ?? 'Волонтёр'}</span
					>
				</li>
			{:else}
				<li class="text-sm text-muted">
					Подайте заявку в ленте возможностей: после подтверждения проект появится здесь.
				</li>
			{/each}
		</ul>
	</section>

	<!-- Клубы и организации -->
	<section class="card p-5 sm:p-6">
		<h2 class="mb-4 text-lg font-bold">Клубы и организации</h2>
		<ul class="space-y-3">
			{#each app.memberships as m (m.orgId)}
				{@const org = app.org(m.orgId)}
				{#if org}
					<li class="flex items-center gap-3">
						<span
							class="grid size-12 shrink-0 place-items-center rounded-2xl text-2xl {toneClass[
								org.tone
							].bg}">{org.emoji}</span
						>
						<div class="min-w-0 flex-1">
							<div class="truncate font-semibold">{org.name}</div>
							<div class="text-xs text-muted">
								{m.role} · с {formatDate(m.since, { month: 'long', year: 'numeric' })}
							</div>
						</div>
					</li>
				{/if}
			{/each}
		</ul>
	</section>
</div>

<!-- Сертификаты -->
<section class="mt-5 card p-5 sm:p-6">
	<div class="mb-4 flex flex-wrap items-center justify-between gap-3">
		<h2 class="flex items-center gap-2 text-lg font-bold">
			<Award class="size-5 text-accent-text" /> Сертификаты и грамоты
		</h2>
		<label class="btn cursor-pointer btn-soft">
			<Upload class="size-4" /> Загрузить
			<input type="file" accept="image/*,application/pdf" class="sr-only" onchange={chooseFile} />
		</label>
	</div>
	<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
		{#each app.certificates as c (c.id)}
			<div class="flex flex-col rounded-3xl p-4 {toneClass[c.tone].bg}">
				<div class="flex items-start justify-between gap-2">
					<span
						class="grid size-11 place-items-center rounded-2xl bg-surface/80 {toneClass[c.tone]
							.text}"><FileText class="size-5" /></span
					>
					<button
						class="text-muted hover:text-ink"
						onclick={() => app.removeCertificate(c.id)}
						aria-label="Удалить документ"><Trash class="size-4" /></button
					>
				</div>
				<div class="mt-3 font-bold">{c.title}</div>
				<div class="text-xs text-muted">
					{c.issuer} · {formatDate(c.date, { day: 'numeric', month: 'short', year: 'numeric' })}
				</div>
				<button class="mt-4 btn self-start bg-surface/80 py-2" onclick={() => (viewing = c)}
					><Eye class="size-4" /> Открыть</button
				>
			</div>
		{/each}
	</div>
</section>

<Modal bind:open={logOpen} title="Добавить волонтёрские часы">
	{#key selected}
		<LogHoursForm date={selected <= today ? selected : today} ondone={() => (logOpen = false)} />
	{/key}
</Modal>

<Modal bind:open={upload.open} title="Новый документ">
	<form class="space-y-4" onsubmit={saveCertificate}>
		{#if isImage(upload.src)}
			<img src={upload.src} alt="" class="max-h-48 w-full rounded-2xl object-contain" />
		{/if}
		<p class="text-sm text-muted">Файл: {upload.fileName}</p>
		<label class="block"
			><span class="label">Название</span><input
				class="input"
				required
				bind:value={upload.title}
			/></label
		>
		<label class="block"
			><span class="label">Кто выдал</span><input
				class="input"
				placeholder="Организация"
				bind:value={upload.issuer}
			/></label
		>
		<button class="btn w-full btn-primary">Добавить в портфолио</button>
	</form>
</Modal>

{#if viewing}
	<Modal title={viewing.title} bind:open={() => true, (v) => !v && (viewing = null)}>
		{#if isImage(viewing.src)}
			<img src={viewing.src} alt={viewing.title} class="w-full rounded-2xl" />
		{:else if isPdf(viewing.src)}
			<iframe src={viewing.src} title={viewing.title} class="h-[60dvh] w-full rounded-2xl"></iframe>
		{:else}
			<div
				class="grid aspect-[4/3] place-items-center rounded-2xl p-6 text-center {toneClass[
					viewing.tone
				].bg}"
			>
				<div>
					<Award class="mx-auto size-12 {toneClass[viewing.tone].text}" />
					<div class="mt-3 text-lg font-bold">{viewing.title}</div>
					<div class="text-sm text-muted">{viewing.issuer}</div>
					<div class="mt-4 text-xs text-muted">Демо-документ «{viewing.fileName}»</div>
				</div>
			</div>
		{/if}
	</Modal>
{/if}
