<script lang="ts">
	import { tr } from '#lib/i18n.ts';
	import { page } from '$app/state';
	import { ChevronLeft, ChevronRight, Plus } from '@lucide/svelte';
	import { app } from '#lib/app.svelte.ts';
	import SkillForm from '#lib/components/SkillForm.svelte';
	import { ME, skillLevels } from '#lib/data.ts';

	const personId = $derived(page.url.searchParams.get('u') ?? ME);
	const mine = $derived(personId === ME && !app.isOrg);
	const skills = $derived(app.skillsOf(personId));
	const backHref = $derived(personId === ME ? '/profile' : `/u?id=${personId}`);

	let adding = $state(page.url.searchParams.has('add'));
</script>

<svelte:head><title>{tr('Навыки — Волна')}</title></svelte:head>

<a href={backHref} class="mb-4 btn btn-ghost"
	><ChevronLeft class="size-4" /> {mine ? tr('Профиль') : app.author(personId).name}</a
>

<div class="mx-auto max-w-2xl">
	<div class="mb-5 flex items-center justify-between gap-3">
		<div>
			<h1 class="text-2xl font-extrabold tracking-tight sm:text-3xl">{tr('Навыки')}</h1>
			{#if !mine}<p class="text-sm text-muted">{app.author(personId).name}</p>{/if}
		</div>
		{#if mine}
			<button class="btn btn-primary" onclick={() => (adding = true)}
				><Plus class="size-4" /> {tr('Добавить навык')}</button
			>
		{/if}
	</div>

	<ol class="space-y-2">
		{#each skills as skill, i (skill.id)}
			{@const materials = app.materialsOf(skill.id).length}
			{@const certificates = app.certificatesForSkill(skill.id).length}
			<li>
				<a
					href="/skill?id={skill.id}"
					class="flex items-center gap-3 card p-3 pr-4 transition hover:border-accent"
				>
					<span class="w-6 text-center text-sm font-bold text-muted">{i + 1}.</span>
					<span class="grid size-12 shrink-0 place-items-center rounded-2xl bg-accent-soft text-2xl"
						>{skill.emoji}</span
					>
					<span class="min-w-0 flex-1">
						<span class="block truncate font-bold">{skill.title}</span>
						<span class="block truncate text-xs text-muted">
							{[
								skill.level ? skillLevels[skill.level] : '',
								materials ? tr('{0} материалов', materials) : '',
								certificates ? tr('🏆 {0}', certificates) : ''
							]
								.filter(Boolean)
								.join(' · ') || tr('Пока без материалов')}
						</span>
					</span>
					<ChevronRight class="size-5 text-muted" />
				</a>
			</li>
		{:else}
			<li class="card p-8 text-center">
				<div class="text-4xl">🧩</div>
				<p class="mt-2 font-bold">{tr('Навыков пока нет')}</p>
				{#if mine}
					<p class="text-sm text-muted">
						{tr(
							'Добавьте то, что умеете: рисование, языки, фото… Внутри навыка можно хранить работы и сертификаты.'
						)}
					</p>
					<button class="mt-3 btn btn-soft" onclick={() => (adding = true)}
						><Plus class="size-4" /> {tr('Добавить навык')}</button
					>
				{/if}
			</li>
		{/each}
	</ol>
</div>

<SkillForm bind:open={adding} />
