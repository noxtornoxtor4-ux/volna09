<script lang="ts">
	import { tr } from '#lib/i18n.ts';
	import { app } from '#lib/app.svelte.ts';
	import { loadLogoFont, logoFontWeight } from '#lib/logo-fonts.ts';

	/** font — показать название этим шрифтом (предпросмотр в настройках) */
	let {
		size = 32,
		name = true,
		font
	}: { size?: number; name?: boolean; font?: string | null } = $props();

	/** Свой шрифт названия из настроек; без него — шрифт приложения */
	const family = $derived(font === undefined ? app.logoFont : font);
	$effect(() => {
		if (family) loadLogoFont(family);
	});
</script>

<a
	href="/"
	class="flex shrink-0 items-center gap-2.5 font-display text-[20px] leading-none font-black tracking-tight"
	aria-label={tr('Волна')}
>
	<svg
		viewBox="212 226 600 572"
		width={size}
		height={size}
		class="shrink-0 text-brand-blue"
		aria-hidden="true"
	>
		<rect
			x="238"
			y="252"
			width="548"
			height="520"
			rx="92"
			fill="none"
			stroke="currentColor"
			stroke-width="48"
		/>
		<path
			d="M262 562c78-36 118-198 286-202 112-3 177 78 177 166 0 92-74 154-156 154-76 0-122-52-120-110 2-56 50-84 92-72 34 10 42 50 18 64"
			fill="none"
			stroke="currentColor"
			stroke-width="78"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>
	</svg>
	{#if name}<span
			class="text-brand-navy"
			style={family
				? `font-family: '${family}', var(--font-display); font-weight: ${logoFontWeight(family)}; letter-spacing: 0`
				: undefined}>{tr('Волна')}</span
		>{/if}
</a>
