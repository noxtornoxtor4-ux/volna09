<script lang="ts">
	import { tr } from '#lib/i18n.ts';
	import { ChevronDown, RotateCcw, TriangleAlert } from '@lucide/svelte';
	import { app } from '#lib/app.svelte.ts';
	import { contrast } from '#lib/color.ts';
	import { brandPalette } from '#lib/data.ts';
	import { loadLogoFont, logoFontWeight, logoFonts } from '#lib/logo-fonts.ts';
	import type { LogoColors } from '#lib/types.ts';
	import ColorPicker from './ColorPicker.svelte';
	import Logo from './Logo.svelte';
	import Wordmark from './Wordmark.svelte';

	/** Фирменные цвета — с них начинается настройка и к ним возвращает сброс */
	const BRAND: Record<'light' | 'dark', LogoColors> = {
		light: { icon: '#7692ff', text: '#091540' },
		dark: { icon: '#7692ff', text: '#dfe6ff' }
	};

	const rows: { key: keyof LogoColors; label: string; hint: string }[] = [
		{ key: 'icon', label: tr('Значок'), hint: tr('Волна в квадрате и волна в надписи WAVE') },
		{ key: 'text', label: tr('Надпись'), hint: tr('Название «Волна» и буквы WAVE') }
	];

	let open = $state<keyof LogoColors | null>(null);

	const colors = $derived(app.logoColors ?? BRAND[app.isDark ? 'dark' : 'light']);
	const background = $derived(app.customTheme?.bg ?? (app.isDark ? '#111319' : '#f6f8fc'));
	/** Логотип должен оставаться заметным на фоне приложения */
	const weak = $derived(rows.filter((r) => contrast(colors[r.key], background) < 2));

	// Для предпросмотра на кнопках подгружаем все шрифты (только буквы названия)
	$effect(() => {
		for (const f of logoFonts) loadLogoFont(f.family);
	});

	function set(key: keyof LogoColors, value: string) {
		if (colors[key] === value) return;
		app.setLogoColors({ ...colors, [key]: value });
	}
</script>

<section class="card p-5">
	<div class="flex items-center justify-between gap-3">
		<h2 class="font-extrabold">{tr('Логотип')}</h2>
		{#if app.logoColors || app.logoFont}
			<button
				type="button"
				class="btn btn-ghost px-3 py-1.5 text-sm"
				onclick={() => {
					app.setLogoColors(null);
					app.setLogoFont(null);
				}}><RotateCcw class="size-4" /> {tr('Фирменные')}</button
			>
		{/if}
	</div>

	<!-- Предпросмотр: так логотип выглядит в меню и на главной -->
	<div class="mt-4 flex flex-wrap items-center gap-4 rounded-3xl bg-bg p-4">
		<Logo />
		<div class="flex items-center gap-2">
			<Logo size={36} name={false} />
			<Wordmark class="h-8 w-auto" />
		</div>
	</div>

	{#if weak.length}
		<p
			class="mt-3 flex items-center gap-2 rounded-2xl bg-pastel-peach p-3 text-sm text-pastel-peach-ink"
			role="alert"
		>
			<TriangleAlert class="size-4 shrink-0" />
			{tr('{0}: почти сливается с фоном', weak.map((r) => r.label).join(', '))}
		</p>
	{/if}

	<ul class="mt-4 divide-y divide-line overflow-hidden rounded-2xl border border-line">
		{#each rows as row (row.key)}
			<li>
				<button
					type="button"
					class="flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-surface-2"
					onclick={() => (open = open === row.key ? null : row.key)}
					aria-expanded={open === row.key}
				>
					<span
						class="size-8 shrink-0 rounded-xl border border-black/10"
						style="background: {colors[row.key]}"
					></span>
					<span class="min-w-0 flex-1">
						<span class="block text-sm font-semibold">{row.label}</span>
						<span class="block truncate text-xs text-muted">{row.hint}</span>
					</span>
					<span class="font-mono text-xs text-muted uppercase">{colors[row.key]}</span>
					<ChevronDown
						class="size-4 text-muted transition {open === row.key ? 'rotate-180' : ''}"
					/>
				</button>
				{#if open === row.key}
					<div class="border-t border-line p-3">
						<ColorPicker
							bind:value={() => colors[row.key], (v) => set(row.key, v)}
							presets={brandPalette}
							label={row.label}
						/>
					</div>
				{/if}
			</li>
		{/each}
	</ul>

	<span class="mt-5 label">{tr('Шрифт надписи')}</span>
	<div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
		{#each [null, ...logoFonts.map((f) => f.family)] as family (family ?? 'app')}
			{@const on = app.logoFont === family}
			<button
				type="button"
				class="flex flex-col items-center gap-1 rounded-2xl border-2 px-2 py-3 transition {on
					? 'border-accent bg-accent-soft'
					: 'border-line hover:border-accent/50'}"
				aria-pressed={on}
				onclick={() => app.setLogoFont(family)}
			>
				<span
					class="truncate text-xl leading-tight text-brand-navy"
					style={family
						? `font-family: '${family}', var(--font-display); font-weight: ${logoFontWeight(family)}`
						: 'font-family: var(--font-display); font-weight: 900'}>{tr('Волна')}</span
				>
				<span class="truncate text-[11px] text-muted">{family ?? tr('Как в приложении')}</span>
			</button>
		{/each}
	</div>
</section>
