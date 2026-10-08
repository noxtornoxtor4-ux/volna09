<script lang="ts">
	import { tr } from '#lib/i18n.ts';
	import { ChevronDown, Copy, CopyPlus, RotateCcw, TriangleAlert, Wand } from '@lucide/svelte';
	import { app } from '#lib/app.svelte.ts';
	import { brandPalette } from '#lib/data.ts';
	import {
		contrastIssues,
		fixContrast,
		parseTheme,
		themeGroups,
		themePresets
	} from '#lib/theme.ts';
	import type { CustomTheme } from '#lib/types.ts';
	import ColorPicker from './ColorPicker.svelte';
	import SavedThemes from './SavedThemes.svelte';

	let open = $state<keyof CustomTheme | null>(null);
	let json = $state('');
	let jsonError = $state(false);

	const theme = $derived(app.customTheme);
	const issues = $derived(theme ? contrastIssues(theme) : []);
	const weak = $derived(new Set(issues.flatMap((i) => [i.fg, i.bg])));

	/** Включение возвращает последнюю тему из «Моих тем», а если их нет — начинает с стандартной */
	function enable() {
		const last = app.savedThemes.find((t) => t.id === app.activeThemeId) ?? app.savedThemes[0];
		if (last) app.applySavedTheme(last.id);
		else app.setCustomTheme({ ...themePresets[app.isDark ? 'dark' : 'light'] });
	}

	/** Изменения применяются сразу ко всем экранам */
	function set(key: keyof CustomTheme, value: string) {
		if (!theme || theme[key] === value) return;
		app.setCustomTheme({ ...theme, [key]: value });
	}

	async function copyJson() {
		if (!theme) return;
		const code = JSON.stringify(theme, null, 2);
		json = code;
		try {
			await navigator.clipboard.writeText(code);
			app.notify(tr('Код темы скопирован'));
		} catch {
			// буфер недоступен — код остаётся в поле, его можно скопировать вручную
		}
	}

	function importJson() {
		const parsed = parseTheme(json);
		jsonError = !parsed;
		if (parsed) {
			// Импортированная тема ложится в «Мои темы» отдельной записью
			app.saveThemeAsNew(parsed);
		}
	}
</script>

<section class="card p-5">
	<div class="flex items-center justify-between gap-3">
		<div>
			<h2 class="font-extrabold">{tr('Кастомная тема')}</h2>
			<p class="text-sm text-muted">
				{tr(
					'Свои цвета фона, текста, кнопок и карточек. Каждая тема сама сохраняется в «Мои темы».'
				)}
			</p>
		</div>
		<button
			type="button"
			role="switch"
			aria-checked={!!theme}
			aria-label={tr('Кастомная тема')}
			class="relative h-7 w-12 shrink-0 rounded-full transition {theme
				? 'bg-accent-text'
				: 'bg-line'}"
			onclick={() => (theme ? app.setCustomTheme(null) : enable())}
		>
			<span
				class="absolute top-1 left-1 size-5 rounded-full bg-white shadow transition {theme
					? 'translate-x-5'
					: ''}"
			></span>
		</button>
	</div>

	{#if theme}
		{#if issues.length}
			<div class="mt-4 rounded-2xl bg-pastel-peach p-3 text-sm text-pastel-peach-ink" role="alert">
				<div class="flex items-center gap-2 font-bold">
					<TriangleAlert class="size-4 shrink-0" />
					{tr('Низкий контраст — часть текста будет плохо видна')}
				</div>
				<ul class="mt-1.5 space-y-0.5">
					{#each issues as issue (issue.label)}
						<li>
							{tr('{0}: {1}:1 (нужно от {2}:1)', issue.label, issue.ratio.toFixed(1), issue.min)}
						</li>
					{/each}
				</ul>
				<button
					type="button"
					class="mt-2 btn bg-surface py-2 text-ink"
					onclick={() => app.setCustomTheme(fixContrast(theme))}
				>
					<Wand class="size-4" />
					{tr('Исправить автоматически')}
				</button>
			</div>
		{/if}

		<div class="mt-4 space-y-4">
			{#each themeGroups as group (group.title)}
				<div>
					<span class="label">{group.title}</span>
					<ul class="divide-y divide-line overflow-hidden rounded-2xl border border-line">
						{#each group.keys as item (item.key)}
							<li>
								<button
									type="button"
									class="flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-surface-2"
									onclick={() => (open = open === item.key ? null : item.key)}
									aria-expanded={open === item.key}
								>
									<span
										class="size-8 shrink-0 rounded-xl border border-black/10"
										style="background: {theme[item.key]}"
									></span>
									<span class="min-w-0 flex-1 text-sm font-semibold">{item.label}</span>
									{#if weak.has(item.key)}<TriangleAlert
											class="size-4 text-pastel-peach-ink"
											aria-label={tr('Низкий контраст')}
										/>{/if}
									<span class="font-mono text-xs text-muted uppercase">{theme[item.key]}</span>
									<ChevronDown
										class="size-4 text-muted transition {open === item.key ? 'rotate-180' : ''}"
									/>
								</button>
								{#if open === item.key}
									<div class="border-t border-line p-3">
										<ColorPicker
											bind:value={() => theme[item.key], (v) => set(item.key, v)}
											presets={brandPalette}
											label={item.label}
										/>
									</div>
								{/if}
							</li>
						{/each}
					</ul>
				</div>
			{/each}
		</div>

		<div class="mt-5 flex flex-wrap gap-2">
			<button type="button" class="btn btn-ghost" onclick={() => app.saveThemeAsNew()}>
				<CopyPlus class="size-4" />
				{tr('Сохранить как новую')}
			</button>
			<button type="button" class="btn btn-ghost" onclick={() => app.setCustomTheme(null)}>
				<RotateCcw class="size-4" />
				{tr('Сбросить к стандартным')}
			</button>
			<button type="button" class="btn btn-ghost" onclick={copyJson}>
				<Copy class="size-4" />
				{tr('Экспорт JSON')}
			</button>
		</div>
	{/if}

	<SavedThemes />

	<details class="mt-4">
		<summary class="cursor-pointer text-sm font-semibold text-muted"
			>{tr('Импорт темы из JSON')}</summary
		>
		<textarea
			class="mt-2 min-h-28 input font-mono text-xs {jsonError ? 'border-pastel-peach-ink' : ''}"
			placeholder={'{ "bg": "#f6f8fc", "surface": "#ffffff", … }'}
			bind:value={json}
			spellcheck="false"></textarea>
		{#if jsonError}<p class="mt-1 text-xs text-pastel-peach-ink">
				{tr('Код не похож на тему: нужны все 8 цветов в формате #rrggbb')}
			</p>{/if}
		<button type="button" class="mt-2 btn btn-soft" disabled={!json.trim()} onclick={importJson}
			>{tr('Применить')}</button
		>
	</details>
</section>
