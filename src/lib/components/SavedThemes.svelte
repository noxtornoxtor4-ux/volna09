<script lang="ts">
	import { tr } from '#lib/i18n.ts';
	import { Check, Folder, Pencil, Trash } from '@lucide/svelte';
	import { app } from '#lib/app.svelte.ts';
	import { formatDateValue } from '#lib/format.ts';
	import type { SavedTheme } from '#lib/types.ts';

	/** Папка «Мои темы»: применить ранее созданную тему, переименовать или удалить */
	let renaming = $state<string | null>(null);
	let name = $state('');

	const when = (iso: string) =>
		`${formatDateValue(new Date(iso), { day: 'numeric', month: 'short' })}, ${new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

	function startRename(theme: SavedTheme) {
		renaming = theme.id;
		name = theme.name;
	}

	function saveName(e: SubmitEvent) {
		e.preventDefault();
		if (renaming) app.renameSavedTheme(renaming, name);
		renaming = null;
	}

	function remove(theme: SavedTheme) {
		if (confirm(tr('Удалить тему «{0}» из «Моих тем»?', theme.name)))
			app.deleteSavedTheme(theme.id);
	}
</script>

{#if app.savedThemes.length}
	<div class="mt-5">
		<span class="label flex items-center gap-1.5"
			><Folder class="size-3.5" /> {tr('Мои темы')} · {app.savedThemes.length}</span
		>
		<ul class="space-y-2">
			{#each app.savedThemes as theme (theme.id)}
				{@const active = theme.id === app.activeThemeId && !!app.customTheme}
				<li
					class="flex items-center gap-3 rounded-2xl border p-2.5 {active
						? 'border-accent bg-accent-soft'
						: 'border-line'}"
				>
					<!-- Образец: фон, карточка, кнопка и акцент -->
					<span
						class="grid size-11 shrink-0 grid-cols-2 overflow-hidden rounded-xl border border-black/10"
						aria-hidden="true"
					>
						{#each [theme.theme.bg, theme.theme.surface, theme.theme.button, theme.theme.accent] as color, i (i)}
							<span style="background: {color}"></span>
						{/each}
					</span>
					<div class="min-w-0 flex-1">
						{#if renaming === theme.id}
							<form onsubmit={saveName}>
								<!-- svelte-ignore a11y_autofocus -->
								<input
									class="input py-1.5 text-sm"
									maxlength="40"
									bind:value={name}
									autofocus
									onblur={() => (renaming = null)}
									aria-label={tr('Название темы')}
								/>
							</form>
						{:else}
							<div class="truncate text-sm font-bold">{theme.name}</div>
							<div class="text-xs text-muted">
								{active ? tr('Применена · сохраняется автоматически') : when(theme.updatedAt)}
							</div>
						{/if}
					</div>
					{#if active}
						<span
							class="grid size-8 place-items-center text-accent-text"
							aria-label={tr('Применена')}><Check class="size-5" /></span
						>
					{:else}
						<button
							type="button"
							class="btn btn-soft px-3 py-1.5 text-xs"
							onclick={() => app.applySavedTheme(theme.id)}>{tr('Применить')}</button
						>
					{/if}
					<button
						type="button"
						class="grid size-8 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-ink"
						onclick={() => startRename(theme)}
						aria-label={tr('Переименовать')}><Pencil class="size-4" /></button
					>
					<button
						type="button"
						class="grid size-8 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-pastel-peach-ink"
						onclick={() => remove(theme)}
						aria-label={tr('Удалить')}><Trash class="size-4" /></button
					>
				</li>
			{/each}
		</ul>
	</div>
{/if}
