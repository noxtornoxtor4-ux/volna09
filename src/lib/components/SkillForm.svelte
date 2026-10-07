<script lang="ts">
	import { tr } from '#lib/i18n.ts';
	import { goto } from '$app/navigation';
	import { app } from '#lib/app.svelte.ts';
	import { skillEmojis, skillLevels, skillPresets } from '#lib/data.ts';
	import type { Skill, SkillLevel } from '#lib/types.ts';
	import Modal from './Modal.svelte';

	/** Добавление или редактирование навыка */
	let { open = $bindable(false), skill }: { open?: boolean; skill?: Skill } = $props();

	const empty = () => ({
		emoji: skill?.emoji ?? '🎨',
		title: skill?.title ?? '',
		description: skill?.description ?? '',
		level: skill?.level as SkillLevel | undefined,
		featured: skill?.featured ?? app.skillsOf(app.actorId).length < 6
	});
	let form = $state(empty());

	$effect(() => {
		if (open) form = empty();
	});

	const taken = $derived(new Set(app.skillsOf(app.actorId).map((s) => s.title.toLowerCase())));

	function submit(e: SubmitEvent) {
		e.preventDefault();
		const data = { ...form, title: form.title.trim(), description: form.description.trim() };
		if (!data.title) return;
		if (skill) app.updateSkill({ ...skill, ...data });
		else goto(`/skill?id=${app.addSkill(data)}`);
		open = false;
	}
</script>

<Modal bind:open title={skill ? tr('Редактировать навык') : tr('Новый навык')}>
	<form class="space-y-4" onsubmit={submit}>
		{#if !skill}
			<div>
				<span class="label">{tr('Быстрый выбор')}</span>
				<div class="flex flex-wrap gap-2">
					{#each skillPresets.filter((p) => !taken.has(p.title.toLowerCase())) as p (p.title)}
						<button
							type="button"
							class="chip {form.title === p.title
								? 'border-accent bg-accent-soft text-accent-text'
								: ''}"
							onclick={() => {
								form.emoji = p.emoji;
								form.title = p.title;
							}}>{p.emoji} {p.title}</button
						>
					{/each}
				</div>
			</div>
		{/if}

		<div>
			<span class="label">{tr('Иконка')}</span>
			<div class="flex flex-wrap gap-1.5">
				{#each skillEmojis as emoji (emoji)}
					<button
						type="button"
						class="grid size-10 place-items-center rounded-xl border-2 text-xl transition {form.emoji ===
						emoji
							? 'border-accent bg-accent-soft'
							: 'border-transparent bg-surface-2'}"
						aria-pressed={form.emoji === emoji}
						onclick={() => (form.emoji = emoji)}>{emoji}</button
					>
				{/each}
			</div>
		</div>

		<label class="block">
			<span class="label">{tr('Название')}</span>
			<input
				class="input"
				required
				maxlength="40"
				placeholder={tr('Например: Рисование')}
				bind:value={form.title}
			/>
		</label>
		<label class="block">
			<span class="label">{tr('Краткое описание')}</span>
			<textarea
				class="min-h-20 input"
				maxlength="280"
				placeholder={tr('Например: рисую в цифровом и традиционном формате')}
				bind:value={form.description}></textarea>
		</label>

		<div>
			<span class="label">{tr('Уровень')}</span>
			<div class="flex flex-wrap gap-2">
				{#each Object.entries(skillLevels) as [id, label] (id)}
					<button
						type="button"
						class="chip {form.level === id ? 'border-accent bg-accent-soft text-accent-text' : ''}"
						aria-pressed={form.level === id}
						onclick={() => (form.level = form.level === id ? undefined : (id as SkillLevel))}
						>{label}</button
					>
				{/each}
			</div>
		</div>

		<label class="flex items-center gap-3 rounded-2xl bg-surface-2 p-3 text-sm">
			<input
				type="checkbox"
				class="size-5 accent-[var(--accent-strong)]"
				bind:checked={form.featured}
			/>
			<span>
				<span class="block font-semibold">{tr('Основной навык')}</span>
				<span class="text-xs text-muted">{tr('Основные навыки показываются в профиле')}</span>
			</span>
		</label>

		<button class="btn w-full btn-primary" disabled={!form.title.trim()}
			>{skill ? tr('Сохранить') : tr('Добавить навык')}</button
		>
	</form>
</Modal>
