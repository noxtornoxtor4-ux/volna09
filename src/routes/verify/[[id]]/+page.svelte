<script lang="ts">
	import { tr } from '#lib/i18n.ts';
	import { page } from '$app/state';
	import { BadgeCheck, CircleX, Search } from '@lucide/svelte';
	import Logo from '#lib/components/Logo.svelte';
	import { formatDate } from '#lib/format.ts';
	import { getOne } from '#lib/sync.ts';
	import type { Award, Opportunity, Organization, Person } from '#lib/types.ts';

	/**
	 * Публичная проверка подлинности сертификата: /verify/VLN-XXXX-XXXX.
	 * Доступна без входа — вуз, работодатель или грантовый комитет видят статус документа,
	 * имя волонтёра, организацию и подтверждённые часы.
	 */
	const id = $derived(
		(page.params.id ?? page.url.searchParams.get('id') ?? '').trim().toUpperCase()
	);

	let status = $state<'idle' | 'loading' | 'found' | 'missing'>('idle');
	let data = $state<{
		award: Award;
		person?: Person;
		org?: Organization;
		opportunity?: Opportunity;
	} | null>(null);
	let query = $state('');

	$effect(() => {
		const current = id;
		if (!current) {
			status = 'idle';
			return;
		}
		status = 'loading';
		(async () => {
			try {
				const award = await getOne<Award>('awards', current);
				if (current !== id) return;
				if (!award?.certificateId) {
					status = 'missing';
					return;
				}
				const [person, org, opportunity] = await Promise.all([
					getOne<Person>('people', award.personId).catch(() => undefined),
					award.orgId
						? getOne<Organization>('orgs', award.orgId).catch(() => undefined)
						: undefined,
					award.opportunityId
						? getOne<Opportunity>('opportunities', award.opportunityId).catch(() => undefined)
						: undefined
				]);
				data = { award, person, org, opportunity };
				status = 'found';
			} catch {
				status = 'missing';
			}
		})();
	});

	const valid = $derived(data?.award.status !== 'revoked');
</script>

<svelte:head><title>{tr('Проверка сертификата — Волна')}</title></svelte:head>

<main class="mx-auto flex min-h-dvh max-w-lg flex-col gap-6 px-5 py-10">
	<Logo />
	<div>
		<h1 class="text-2xl font-extrabold tracking-tight">{tr('Проверка сертификата')}</h1>
		<p class="mt-1 text-sm text-muted">
			{tr('Сертификаты, выданные через «Волну», имеют уникальный ID и проверяются здесь.')}
		</p>
	</div>

	<form
		class="flex gap-2"
		onsubmit={(e) => {
			e.preventDefault();
			if (query.trim()) location.href = `/verify/${encodeURIComponent(query.trim().toUpperCase())}`;
		}}
	>
		<input class="input font-mono uppercase" placeholder="VLN-XXXX-XXXX" bind:value={query} />
		<button class="btn btn-primary" aria-label={tr('Проверить')}><Search class="size-4" /></button>
	</form>

	{#if status === 'loading'}
		<p class="card p-6 text-center text-sm text-muted">{tr('Проверяем…')}</p>
	{:else if status === 'missing'}
		<div class="card p-6 text-center">
			<CircleX class="mx-auto size-10 text-pastel-peach-ink" />
			<p class="mt-2 font-bold">{tr('Сертификат с ID {0} не найден', id)}</p>
			<p class="mt-1 text-sm text-muted">{tr('Проверьте, правильно ли введён номер.')}</p>
		</div>
	{:else if status === 'found' && data}
		<article class="overflow-hidden card">
			<div
				class="flex items-center gap-3 p-5 {valid
					? 'bg-pastel-green text-pastel-green-ink'
					: 'bg-pastel-peach text-pastel-peach-ink'}"
			>
				{#if valid}<BadgeCheck class="size-8 shrink-0" />{:else}<CircleX
						class="size-8 shrink-0"
					/>{/if}
				<div>
					<div class="text-lg font-extrabold">{valid ? tr('Действителен') : tr('Отозван')}</div>
					{#if !valid && data.award.revokedReason}<div class="text-sm">
							{data.award.revokedReason}
						</div>{/if}
				</div>
			</div>
			<dl class="divide-y divide-line">
				{#each [{ label: tr('Волонтёр'), value: data.person?.name }, { label: tr('Сертификат'), value: data.award.title }, { label: tr('Выдала организация'), value: data.org ? `${data.org.name}${data.org.verified ? ' ✓' : ''}` : '' }, { label: tr('Мероприятие'), value: data.opportunity?.title }, { label: tr('Подтверждённые часы'), value: data.award.hours ? tr('{0} ч', data.award.hours) : '' }, { label: tr('Дата выдачи'), value: formatDate( data.award.date, { day: 'numeric', month: 'long', year: 'numeric' } ) }, { label: tr('ID сертификата'), value: data.award.certificateId }].filter((r) => r.value) as row (row.label)}
					<div class="flex justify-between gap-4 px-5 py-3 text-sm">
						<dt class="text-muted">{row.label}</dt>
						<dd class="text-right font-semibold">{row.value}</dd>
					</div>
				{/each}
			</dl>
		</article>
	{/if}
</main>
