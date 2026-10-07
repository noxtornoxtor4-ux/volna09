<script lang="ts">
	import { tr } from '#lib/i18n.ts';
	import { untrack } from 'svelte';
	import { Check } from '@lucide/svelte';
	import { hexToHsl, hexToRgb, hslToHex, parseColor, type Hsl } from '#lib/color.ts';

	let {
		value = $bindable(),
		presets = [],
		label
	}: { value: string; presets?: string[]; label?: string } = $props();

	/** Тон/насыщенность/светлота хранятся отдельно, чтобы тон не терялся у серых оттенков */
	let hsl = $state<Hsl>(hexToHsl(value));
	let text = $state(value);
	let error = $state(false);

	// Цвет поменяли снаружи (пресет, сброс) — подтягиваем ползунки и поле ввода
	$effect.pre(() => {
		const next = value;
		untrack(() => {
			if (hslToHex(hsl) !== next) hsl = hexToHsl(next);
			if (parseColor(text) !== next) text = next;
		});
	});

	function setHsl(index: number, n: number) {
		const next = [...hsl] as Hsl;
		next[index] = n;
		hsl = next;
		value = hslToHex(next);
	}

	function typed(input: string) {
		text = input;
		const parsed = parseColor(input);
		error = !parsed;
		if (parsed) value = parsed;
	}

	const [h, s, l] = $derived(hsl);
	const rgb = $derived(hexToRgb(value).join(', '));
	const sliders = $derived([
		{
			label: tr('Тон'),
			max: 360,
			track: 'linear-gradient(90deg, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)'
		},
		{
			label: tr('Насыщенность'),
			max: 100,
			track: `linear-gradient(90deg, hsl(${h} 0% ${l}%), hsl(${h} 100% ${l}%))`
		},
		{
			label: tr('Светлота'),
			max: 100,
			track: `linear-gradient(90deg, #000, hsl(${h} ${s}% 50%), #fff)`
		}
	]);
</script>

<div class="space-y-4">
	<div class="flex items-center gap-3">
		<label
			class="relative size-14 shrink-0 cursor-pointer overflow-hidden rounded-2xl border border-line shadow-inner"
			style="background: {value}"
			title={tr('Открыть системную палитру')}
		>
			<input
				type="color"
				class="absolute inset-0 cursor-pointer opacity-0"
				{value}
				oninput={(e) => typed(e.currentTarget.value)}
				aria-label={label ?? tr('Цвет')}
			/>
		</label>
		<div class="min-w-0 flex-1">
			<input
				class="input font-mono uppercase {error ? 'border-pastel-peach-ink' : ''}"
				value={text}
				oninput={(e) => typed(e.currentTarget.value)}
				spellcheck="false"
				aria-label={tr('HEX или RGB')}
				aria-invalid={error}
			/>
			<p class="mt-1 text-xs text-muted">
				{error ? tr('Формат: #7692FF или rgb(118, 146, 255)') : `RGB ${rgb}`}
			</p>
		</div>
	</div>

	{#each sliders as slider, i (slider.label)}
		<label class="block">
			<span class="mb-1.5 flex justify-between text-xs font-semibold text-muted">
				{slider.label}<span class="font-mono">{hsl[i]}{i ? '%' : '°'}</span>
			</span>
			<input
				type="range"
				class="range-color"
				min="0"
				max={slider.max}
				value={hsl[i]}
				style="background: {slider.track}"
				oninput={(e) => setHsl(i, Number(e.currentTarget.value))}
			/>
		</label>
	{/each}

	{#if presets.length}
		<div>
			<span class="label">{tr('Палитра')}</span>
			<div class="flex flex-wrap gap-1.5">
				{#each presets as color (color)}
					<button
						type="button"
						class="grid size-8 place-items-center rounded-full border border-black/10 transition hover:scale-110"
						style="background: {color}"
						onclick={() => typed(color)}
						aria-label={color}
						aria-pressed={value === color.toLowerCase()}
						title={color}
					>
						{#if value === color.toLowerCase()}<Check
								class="size-4"
								style="color: {hsl[2] > 60 ? '#091540' : '#fff'}"
							/>{/if}
					</button>
				{/each}
			</div>
		</div>
	{/if}
</div>
