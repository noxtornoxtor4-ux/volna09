<script lang="ts">
	import { tr } from '#lib/i18n.ts';
	import { page } from '$app/state';
	import {
		Ban,
		BadgeCheck,
		Building,
		CalendarDays,
		Check,
		ClipboardList,
		FileText,
		Flag,
		Gavel,
		LayoutDashboard,
		Scale,
		Search,
		ShieldAlert,
		Undo2,
		Users,
		X
	} from '@lucide/svelte';
	import { app } from '#lib/app.svelte.ts';
	import Avatar from '#lib/components/Avatar.svelte';
	import MediaViewer from '#lib/components/MediaViewer.svelte';
	import Modal from '#lib/components/Modal.svelte';
	import { formatDate, timeAgo } from '#lib/format.ts';
	import { blobUrl } from '#lib/media-db.ts';

	type Tab =
		'overview' | 'orgs' | 'events' | 'reports' | 'appeals' | 'certificates' | 'users' | 'audit';

	const tab = $derived((page.url.searchParams.get('tab') as Tab | null) ?? 'overview');
	const openReports = $derived(app.reports.filter((r) => r.status === 'open'));
	const openAppeals = $derived(app.appeals.filter((a) => a.status === 'open'));

	const tabs = $derived([
		{ id: 'overview' as Tab, label: tr('Обзор'), icon: LayoutDashboard, count: 0 },
		{
			id: 'orgs' as Tab,
			label: tr('Организации'),
			icon: Building,
			count: app.verificationQueue.filter((o) => o.verification?.status === 'pending').length
		},
		{
			id: 'events' as Tab,
			label: tr('Мероприятия'),
			icon: CalendarDays,
			count: app.opportunities.filter((o) => !o.reviewedBy && !o.removed).length
		},
		{ id: 'reports' as Tab, label: tr('Жалобы'), icon: Flag, count: openReports.length },
		{ id: 'appeals' as Tab, label: tr('Апелляции'), icon: Scale, count: openAppeals.length },
		{ id: 'certificates' as Tab, label: tr('Сертификаты'), icon: BadgeCheck, count: 0 },
		{ id: 'users' as Tab, label: tr('Пользователи'), icon: Users, count: 0 },
		{ id: 'audit' as Tab, label: tr('Журнал'), icon: ClipboardList, count: 0 }
	]);

	// ───────── Окно с причиной: любое действие модератора объясняется ─────────

	let dialog = $state<{
		title: string;
		required: boolean;
		hours?: boolean;
		days?: boolean;
		resolve: (value: { text: string; hours: number; days: number } | null) => void;
	} | null>(null);
	let reason = $state('');
	let hours = $state(0);
	let days = $state(7);

	function ask(
		title: string,
		options: { required?: boolean; hours?: boolean; days?: boolean } = {}
	) {
		reason = '';
		hours = 0;
		days = 7;
		return new Promise<{ text: string; hours: number; days: number } | null>((resolve) => {
			dialog = {
				title,
				required: options.required ?? true,
				hours: options.hours,
				days: options.days,
				resolve
			};
		});
	}

	function closeDialog(confirmed: boolean) {
		dialog?.resolve(
			confirmed ? { text: reason.trim(), hours: Number(hours) || 0, days: Number(days) || 0 } : null
		);
		dialog = null;
	}

	// ───────── Просмотр документов организации ─────────

	let doc = $state<{ name: string; mime: string; src?: string } | null>(null);
	async function openDoc(d: { fileId: string; name: string; mime: string }) {
		doc = { name: d.name, mime: d.mime };
		const src = await blobUrl(d.fileId);
		if (doc?.name === d.name) doc = { ...doc, src };
	}

	// ───────── Аналитика ─────────

	const volunteers = $derived(app.people.filter((p) => p.name && !p.orgId).length);
	const verifiedOrgs = $derived(app.orgs.filter((o) => o.verified).length);
	const totalHours = $derived(
		app.hours.filter((h) => h.status === 'verified').reduce((s, h) => s + h.hours, 0)
	);
	const certificates = $derived(app.issuedCertificates);
	/** Рейтинг активности клубов и школ по городам: подтверждённые часы */
	const regions = $derived.by(() => {
		const rows: Record<string, { city: string; hours: number; orgs: Record<string, number> }> = {};
		for (const h of app.hours.filter((x) => x.status === 'verified' && x.orgId)) {
			const org = app.org(h.orgId);
			if (!org) continue;
			const city = org.city || tr('Без города');
			rows[city] ??= { city, hours: 0, orgs: {} };
			rows[city].hours += h.hours;
			rows[city].orgs[org.name] = (rows[city].orgs[org.name] ?? 0) + h.hours;
		}
		return Object.values(rows)
			.sort((a, b) => b.hours - a.hours)
			.map((r) => ({
				...r,
				top: Object.entries(r.orgs)
					.sort((a, b) => b[1] - a[1])
					.slice(0, 3)
			}));
	});

	// ───────── Поиск ─────────

	let query = $state('');
	const q = $derived(query.trim().toLowerCase());
	const foundCertificates = $derived(
		certificates.filter(
			(c) =>
				!q ||
				c.certificateId?.toLowerCase().includes(q) ||
				app.author(c.personId).name.toLowerCase().includes(q)
		)
	);
	const foundPeople = $derived(
		app.people.filter(
			(p) => p.name && (!q || p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q))
		)
	);

	/** Описание объекта жалобы */
	function target(r: (typeof app.reports)[number]) {
		if (r.targetType === 'post') {
			const p = app.posts.find((x) => x.id === r.targetId);
			return p
				? { text: p.text, author: p.authorId, poster: p.media?.poster ?? p.media?.src }
				: null;
		}
		if (r.targetType === 'comment') {
			const c = app.posts.find((x) => x.id === r.postId)?.comments.find((x) => x.id === r.targetId);
			return c ? { text: c.text, author: c.authorId } : null;
		}
		if (r.targetType === 'opportunity') {
			const o = app.opportunity(r.targetId);
			return o ? { text: o.title, author: o.orgId, href: `/o?id=${o.id}` } : null;
		}
		return { text: app.author(r.targetId).name, author: r.targetId, href: `/u?id=${r.targetId}` };
	}

	async function act(r: (typeof app.reports)[number]) {
		const answer = await ask(tr('Удалить контент и закрыть жалобу'));
		if (!answer) return;
		if (r.targetType === 'post') app.moderatePost(r.targetId, answer.text);
		else if (r.targetType === 'comment' && r.postId)
			app.moderateComment(r.postId, r.targetId, answer.text);
		else if (r.targetType === 'opportunity') app.removeOpportunity(r.targetId, answer.text);
		else app.warnUser(r.targetId, answer.text);
		app.resolveReport(r.id, 'resolved');
	}

	const tabHref = (id: Tab) => `/moderation?tab=${id}`;
	const statusLabel = (s?: string) =>
		s === 'pending'
			? tr('На проверке')
			: s === 'needs_info'
				? tr('Запрошены данные')
				: s === 'rejected'
					? tr('Отклонена')
					: tr('Одобрена');
</script>

<svelte:head><title>{tr('Модерация — Волна')}</title></svelte:head>

{#if !app.isModerator}
	<div class="card p-10 text-center">
		<ShieldAlert class="mx-auto size-10 text-muted" />
		<p class="mt-3 text-lg font-bold">{tr('Раздел только для модераторов')}</p>
		<p class="mt-1 text-sm text-muted">
			{tr('Роль модератора выдаёт администратор платформы в Firebase.')}
		</p>
	</div>
{:else}
	<h1 class="mb-4 flex items-center gap-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
		<Gavel class="size-7 text-accent-text" />
		{tr('Модерация')}
	</h1>

	<nav class="-mx-4 mb-5 no-scrollbar flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
		{#each tabs as t (t.id)}
			<a
				href={tabHref(t.id)}
				class="chip {tab === t.id ? 'border-accent bg-accent-soft text-accent-text' : ''}"
				><t.icon class="size-4" />
				{t.label}{#if t.count}<span
						class="rounded-full bg-pastel-peach px-1.5 text-xs font-bold text-pastel-peach-ink"
						>{t.count}</span
					>{/if}</a
			>
		{/each}
	</nav>

	{#if tab === 'overview'}
		<div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
			{#each [{ label: tr('Волонтёров'), value: volunteers }, { label: tr('Проверенных организаций'), value: verifiedOrgs }, { label: tr('Подтверждённых часов'), value: totalHours }, { label: tr('Сертификатов: действует / выдано'), value: `${certificates.filter((c) => c.status !== 'revoked').length} / ${certificates.length}` }] as m (m.label)}
				<div class="card p-4">
					<div class="text-2xl font-extrabold sm:text-3xl">{m.value}</div>
					<div class="mt-1 text-xs text-muted">{m.label}</div>
				</div>
			{/each}
		</div>
		<div class="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-3">
			{#each [{ label: tr('Заявок организаций'), value: tabs[1].count, href: tabHref('orgs') }, { label: tr('Открытых жалоб'), value: openReports.length, href: tabHref('reports') }, { label: tr('Апелляций'), value: openAppeals.length, href: tabHref('appeals') }] as m (m.label)}
				<a href={m.href} class="card p-4 transition hover:border-accent">
					<div class="text-xl font-extrabold">{m.value}</div>
					<div class="text-xs text-muted">{m.label}</div>
				</a>
			{/each}
		</div>
		<section class="mt-5 card p-5">
			<h2 class="mb-3 font-extrabold">{tr('Активность клубов и школ по регионам')}</h2>
			{#each regions as r, i (r.city)}
				<div class="flex items-start gap-3 border-t border-line py-3 first:border-t-0 first:pt-0">
					<span class="w-6 font-bold text-muted">{i + 1}.</span>
					<div class="min-w-0 flex-1">
						<div class="font-bold">{tr(r.city)} · {tr('{0} ч', r.hours)}</div>
						<div class="truncate text-xs text-muted">
							{r.top.map(([name, h]) => `${name} (${h})`).join(' · ')}
						</div>
					</div>
				</div>
			{:else}
				<p class="text-sm text-muted">{tr('Подтверждённых часов пока нет.')}</p>
			{/each}
		</section>
	{:else if tab === 'orgs'}
		<div class="space-y-3">
			{#each app.verificationQueue as org (org.id)}
				{@const v = org.verification!}
				<article class="card p-4">
					<div class="flex items-center gap-3">
						<Avatar id={org.id} size="lg" />
						<div class="min-w-0 flex-1">
							<a href="/u?id={org.id}" class="font-bold hover:underline">{org.name}</a>
							<div class="text-xs text-muted">
								{tr(org.city)} · {statusLabel(v.status)} · {formatDate(v.requestedAt.slice(0, 10))}
							</div>
						</div>
					</div>
					{#if v.note}<p class="mt-3 text-sm">{v.note}</p>{/if}
					{#if v.links}<p class="mt-1 text-sm break-words text-accent-text">{v.links}</p>{/if}
					<div class="mt-3 flex flex-wrap gap-2">
						{#each v.docs as d (d.fileId)}
							<button class="chip" onclick={() => openDoc(d)}
								><FileText class="size-4" /> {d.name}</button
							>
						{/each}
					</div>
					{#if v.message}<p class="mt-2 text-xs text-muted">
							{tr('Сообщение модератора: {0}', v.message)}
						</p>{/if}
					<div class="mt-4 flex flex-wrap gap-2">
						<button
							class="btn btn-primary"
							onclick={() => app.reviewVerification(org.id, 'approved')}
							><Check class="size-4" /> {tr('Принять')}</button
						>
						<button
							class="btn btn-ghost"
							onclick={async () => {
								const a = await ask(tr('Какие данные нужны?'));
								if (a) app.reviewVerification(org.id, 'needs_info', a.text);
							}}>{tr('Запросить данные')}</button
						>
						<button
							class="btn btn-ghost text-pastel-peach-ink"
							onclick={async () => {
								const a = await ask(tr('Причина отказа'));
								if (a) app.reviewVerification(org.id, 'rejected', a.text);
							}}><X class="size-4" /> {tr('Отклонить')}</button
						>
					</div>
				</article>
			{:else}
				<p class="card p-8 text-center text-sm text-muted">{tr('Новых заявок нет.')}</p>
			{/each}
			<h2 class="pt-3 font-extrabold">{tr('Проверенные организации')}</h2>
			{#each app.orgs.filter((o) => o.verified) as org (org.id)}
				<div class="flex items-center gap-3 card p-3">
					<Avatar id={org.id} />
					<a href="/u?id={org.id}" class="min-w-0 flex-1 truncate font-semibold hover:underline"
						>{org.name}</a
					>
					<button
						class="btn btn-ghost py-2 text-sm"
						onclick={async () => {
							const a = await ask(tr('Почему снять бейдж?'));
							if (a) app.revokeVerification(org.id, a.text);
						}}>{tr('Снять бейдж')}</button
					>
				</div>
			{/each}
		</div>
	{:else if tab === 'events'}
		<div class="space-y-2">
			{#each [...app.opportunities].sort((a, b) => Number(!!a.reviewedBy) - Number(!!b.reviewedBy) || b.date.localeCompare(a.date)) as o (o.id)}
				<div class="flex flex-wrap items-center gap-3 card p-3 {o.removed ? 'opacity-60' : ''}">
					<span class="text-2xl">{o.emoji}</span>
					<div class="min-w-0 flex-1">
						<a href="/o?id={o.id}" class="font-semibold hover:underline">{o.title}</a>
						<div class="text-xs text-muted">
							{app.org(o.orgId)?.name} · {formatDate(o.date)}
							{#if o.removed}· {tr('снято: {0}', o.removed.reason)}{:else if o.reviewedBy}· {tr(
									'проверено'
								)}{/if}
						</div>
					</div>
					{#if o.removed}
						<button class="btn btn-ghost py-2 text-sm" onclick={() => app.restoreOpportunity(o.id)}
							><Undo2 class="size-4" /> {tr('Вернуть')}</button
						>
					{:else}
						{#if !o.reviewedBy}
							<button class="btn btn-soft py-2 text-sm" onclick={() => app.markReviewed(o.id)}
								><Check class="size-4" /> {tr('Проверено')}</button
							>
						{/if}
						<button
							class="btn btn-ghost py-2 text-sm text-pastel-peach-ink"
							onclick={async () => {
								const a = await ask(tr('Почему снять мероприятие?'));
								if (a) app.removeOpportunity(o.id, a.text);
							}}>{tr('Снять')}</button
						>
					{/if}
				</div>
			{:else}
				<p class="card p-8 text-center text-sm text-muted">{tr('Мероприятий пока нет.')}</p>
			{/each}
		</div>
	{:else if tab === 'reports'}
		<div class="space-y-3">
			{#each [...openReports, ...app.reports.filter((r) => r.status !== 'open')] as r (r.id)}
				{@const t = target(r)}
				<article class="card p-4 {r.status !== 'open' ? 'opacity-60' : ''}">
					<div class="flex items-center gap-2 text-xs text-muted">
						<Flag class="size-3.5" />
						{r.targetType} · {timeAgo(r.createdAt)} · {tr('от {0}', app.author(r.reporterId).name)}
						{#if r.status !== 'open'}· {r.status === 'resolved'
								? tr('решена')
								: tr('отклонена')}{/if}
					</div>
					<p class="mt-1 font-semibold">{r.reason}</p>
					{#if t}
						<div class="mt-2 flex gap-3 rounded-2xl bg-surface-2 p-3 text-sm">
							{#if t.poster}<img
									src={t.poster}
									alt=""
									class="size-14 rounded-xl object-cover"
								/>{/if}
							<div class="min-w-0">
								<div class="text-xs font-bold">{app.author(t.author).name}</div>
								<p class="line-clamp-3">{t.text}</p>
								{#if t.href}<a href={t.href} class="text-xs font-semibold text-accent-text"
										>{tr('Открыть')}</a
									>{/if}
							</div>
						</div>
					{:else}
						<p class="mt-2 text-sm text-muted">{tr('Контент уже удалён')}</p>
					{/if}
					{#if r.status === 'open'}
						<div class="mt-3 flex flex-wrap gap-2">
							{#if t}
								<button class="btn btn-primary py-2 text-sm" onclick={() => act(r)}>
									{r.targetType === 'person' ? tr('Предупредить') : tr('Удалить контент')}
								</button>
							{/if}
							<button
								class="btn btn-ghost py-2 text-sm"
								onclick={() => app.resolveReport(r.id, 'dismissed')}
								>{tr('Отклонить жалобу')}</button
							>
						</div>
					{/if}
				</article>
			{:else}
				<p class="card p-8 text-center text-sm text-muted">{tr('Жалоб нет.')}</p>
			{/each}
		</div>
	{:else if tab === 'appeals'}
		<div class="space-y-3">
			{#each [...openAppeals, ...app.appeals.filter((a) => a.status !== 'open')] as a (a.id)}
				<article class="card p-4 {a.status !== 'open' ? 'opacity-60' : ''}">
					<div class="flex items-center gap-2">
						<Avatar id={a.personId} size="sm" />
						<a href="/u?id={a.personId}" class="font-bold hover:underline"
							>{app.author(a.personId).name}</a
						>
						<span class="text-xs text-muted">· {timeAgo(a.createdAt)}</span>
					</div>
					<div class="mt-1 text-xs text-muted">
						{[
							a.orgId && app.org(a.orgId)?.name,
							a.opportunityId && app.opportunity(a.opportunityId)?.title
						]
							.filter(Boolean)
							.join(' · ')}
					</div>
					<p class="mt-2 text-sm">{a.text}</p>
					{#if a.response}<p class="mt-2 text-xs text-muted">{tr('Ответ: {0}', a.response)}</p>{/if}
					{#if a.status === 'open'}
						<div class="mt-3 flex flex-wrap gap-2">
							<button
								class="btn btn-primary py-2 text-sm"
								onclick={async () => {
									const r = await ask(tr('Удовлетворить апелляцию'), { hours: true });
									if (r) app.resolveAppeal(a.id, 'resolved', r.text, r.hours);
								}}><Check class="size-4" /> {tr('Удовлетворить')}</button
							>
							<button
								class="btn btn-ghost py-2 text-sm"
								onclick={async () => {
									const r = await ask(tr('Причина отказа'));
									if (r) app.resolveAppeal(a.id, 'rejected', r.text);
								}}>{tr('Отклонить')}</button
							>
						</div>
					{/if}
				</article>
			{:else}
				<p class="card p-8 text-center text-sm text-muted">{tr('Апелляций нет.')}</p>
			{/each}
		</div>
	{:else if tab === 'certificates' || tab === 'users'}
		<label class="relative mb-4 block">
			<Search
				class="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted"
			/>
			<input
				class="input pl-10"
				type="search"
				placeholder={tab === 'certificates'
					? tr('ID сертификата или имя волонтёра')
					: tr('Имя или ID пользователя')}
				bind:value={query}
			/>
		</label>
		{#if tab === 'certificates'}
			<div class="space-y-2">
				{#each foundCertificates as c (c.id)}
					<div class="flex flex-wrap items-center gap-3 card p-3">
						<div class="min-w-0 flex-1">
							<div class="font-semibold">{c.title}</div>
							<div class="text-xs text-muted">
								<span class="font-mono">{c.certificateId}</span> · {app.author(c.personId).name} ·
								{app.org(c.orgId ?? '')?.name}
								{#if c.status === 'revoked'}· <b class="text-pastel-peach-ink">{tr('отозван')}</b
									>{/if}
							</div>
						</div>
						<a href="/verify/{c.certificateId}" target="_blank" class="btn btn-ghost py-2 text-sm"
							>{tr('Проверка')}</a
						>
						{#if c.status === 'revoked'}
							<button
								class="btn btn-soft py-2 text-sm"
								onclick={() => app.setCertificateStatus(c.id, 'valid')}>{tr('Восстановить')}</button
							>
						{:else}
							<button
								class="btn btn-ghost py-2 text-sm text-pastel-peach-ink"
								onclick={async () => {
									const a = await ask(tr('Причина отзыва сертификата'));
									if (a) app.setCertificateStatus(c.id, 'revoked', a.text);
								}}>{tr('Отозвать')}</button
							>
						{/if}
					</div>
				{:else}
					<p class="card p-8 text-center text-sm text-muted">{tr('Сертификатов не найдено.')}</p>
				{/each}
			</div>
		{:else}
			<div class="space-y-2">
				{#each foundPeople.filter((p) => p.id !== app.me).slice(0, 60) as p (p.id)}
					{@const ban = app.activeBan(p)}
					<div class="flex flex-wrap items-center gap-3 card p-3">
						<Avatar id={p.id} />
						<div class="min-w-0 flex-1">
							<a href="/u?id={p.id}" class="font-semibold hover:underline">{p.name}</a>
							<div class="truncate text-xs text-muted">
								<span class="font-mono">{p.id}</span> · {tr('{0} ч', app.verifiedHoursOf(p.id))}
								{#if p.warnings?.length}· ⚠️ {p.warnings.length}{/if}
								{#if ban}· <b class="text-pastel-peach-ink"
										>{ban.until
											? tr('заморожен до {0}', formatDate(ban.until.slice(0, 10)))
											: tr('заблокирован')}</b
									>{/if}
							</div>
						</div>
						<button
							class="btn btn-ghost py-2 text-sm"
							onclick={async () => {
								const a = await ask(tr('Корректировка часов'), { hours: true });
								if (a && a.hours) app.adjustHours(p.id, a.hours, a.text);
							}}>{tr('Часы')}</button
						>
						<button
							class="btn btn-ghost py-2 text-sm"
							onclick={async () => {
								const a = await ask(tr('Предупреждение'));
								if (a) app.warnUser(p.id, a.text);
							}}>{tr('Предупредить')}</button
						>
						{#if ban}
							<button class="btn btn-soft py-2 text-sm" onclick={() => app.unbanUser(p.id)}
								>{tr('Разблокировать')}</button
							>
						{:else}
							<button
								class="btn btn-ghost py-2 text-sm text-pastel-peach-ink"
								onclick={async () => {
									const a = await ask(tr('Блокировка аккаунта'), { days: true });
									if (a) app.banUser(p.id, a.text, a.days || undefined);
								}}><Ban class="size-4" /> {tr('Заблокировать')}</button
							>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	{:else if tab === 'audit'}
		<div class="overflow-hidden card">
			{#each app.auditLog as e (e.id)}
				<div
					class="flex flex-wrap gap-x-3 gap-y-0.5 border-t border-line px-4 py-2.5 text-sm first:border-t-0"
				>
					<span class="text-xs text-muted tabular-nums">{new Date(e.at).toLocaleString()}</span>
					<span class="font-semibold">{app.author(e.moderatorId).name}</span>
					<span class="font-mono text-xs text-accent-text">{e.action}</span>
					<span class="text-muted">{e.targetType}: {e.targetId}</span>
					{#if e.details}<span class="w-full text-xs text-muted">{e.details}</span>{/if}
				</div>
			{:else}
				<p class="p-8 text-center text-sm text-muted">{tr('Действий пока нет.')}</p>
			{/each}
		</div>
	{/if}
{/if}

<Modal bind:open={() => !!dialog, (v) => !v && closeDialog(false)} title={dialog?.title ?? ''}>
	<form
		class="space-y-3"
		onsubmit={(e) => {
			e.preventDefault();
			if (dialog?.required && !reason.trim()) return;
			closeDialog(true);
		}}
	>
		{#if dialog?.hours}
			<label class="block">
				<span class="label">{tr('Часы (минус — списать)')}</span>
				<input class="input" type="number" step="1" bind:value={hours} />
			</label>
		{/if}
		{#if dialog?.days}
			<label class="block">
				<span class="label">{tr('Срок блокировки в днях (0 — навсегда)')}</span>
				<input class="input" type="number" min="0" step="1" bind:value={days} />
			</label>
		{/if}
		<textarea
			class="min-h-24 input"
			maxlength="500"
			placeholder={tr('Причина — её увидит пользователь')}
			bind:value={reason}></textarea>
		<button class="btn w-full btn-primary" disabled={dialog?.required && !reason.trim()}
			>{tr('Подтвердить')}</button
		>
	</form>
</Modal>

{#if doc}
	<MediaViewer
		src={doc.src}
		kind={doc.mime.startsWith('image/') ? 'image' : doc.mime === 'application/pdf' ? 'pdf' : 'file'}
		title={doc.name}
		fileName={doc.name}
		onclose={() => (doc = null)}
	/>
{/if}
