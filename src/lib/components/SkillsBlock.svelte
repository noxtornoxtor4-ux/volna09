<script lang="ts">
	import { tr } from '#lib/i18n.ts';
	import { ChevronRight, Plus } from '@lucide/svelte';
	import { app } from '#lib/app.svelte.ts';

	/** В профиле видны только основные навыки, полный список — на отдельной странице */
	const LIMIT = 6;

	let { personId, editable = false }: { personId: string; editable?: boolean } = $props();

	const skills = $derived(app.skillsOf(personId));
</script>

{#if skills.length || editable}
	<section class="mt-4 card p-4 sm:p-5">
		<div class="mb-3 flex items-center justify-between gap-2">
			<h2 class="text-lg font-extrabold">{tr('Навыки')}</h2>
			{#if editable}
				<a href="/skills?add=1" class="btn btn-soft px-3 py-1.5 text-sm"
					><Plus class="size-4" /> {tr('Добавить')}</a
				>
			{/if}
		</div>
		{#if skills.length}
			<div class="flex flex-wrap gap-2">
				{#each skills.slice(0, LIMIT) as skill (skill.id)}
					<a
						href="/skill?id={skill.id}"
						class="inline-flex items-center gap-1.5 rounded-2xl border border-line bg-surface-2 px-3 py-2 text-sm font-semibold transition hover:border-accent hover:bg-accent-soft"
						><span class="text-base leading-none">{skill.emoji}</span>{skill.title}</a
					>
				{/each}
			</div>
		{:else}
			<p class="text-sm text-muted">
				{tr('Расскажите, что вы умеете: к каждому навыку можно приложить работы и сертификаты.')}
			</p>
		{/if}
		{#if skills.length}
			<a
				href="/skills?u={personId}"
				class="mt-3 flex items-center justify-center gap-1 rounded-2xl py-2 text-sm font-bold text-accent-text transition hover:bg-accent-soft"
				>{tr('Все навыки')}{skills.length > LIMIT ? ` · ${skills.length}` : ''}
				<ChevronRight class="size-4" /></a
			>
		{/if}
	</section>
{/if}
