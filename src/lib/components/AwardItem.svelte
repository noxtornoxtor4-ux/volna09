<script lang="ts">
	import { awardTiers } from '#lib/data.ts';
	import type { Award } from '#lib/types.ts';

	let { award, size = 'md' }: { award: Award; size?: 'sm' | 'md' } = $props();

	const color = $derived(awardTiers[award.tier].color);
	const px = $derived(size === 'sm' ? 56 : 84);
</script>

<!-- Награды нарисованы в SVG, цвет металла зависит от уровня -->
{#if award.type === 'medal'}
	<svg viewBox="0 0 64 80" width={px} height={px * 1.25} aria-hidden="true" class="drop-shadow-md">
		<path d="M18 0h12l6 22H24z" fill="#a9d4ff" />
		<path d="M34 0h12l-6 22H28z" fill="#f4adef" />
		<circle cx="32" cy="50" r="22" fill={color} />
		<circle
			cx="32"
			cy="50"
			r="16"
			fill="none"
			stroke="#fff"
			stroke-opacity=".55"
			stroke-width="2"
		/>
		<path
			d="m32 40 3.2 6.6 7.2 1-5.2 5 1.2 7.2-6.4-3.4-6.4 3.4 1.2-7.2-5.2-5 7.2-1z"
			fill="#fff"
			fill-opacity=".85"
		/>
	</svg>
{:else if award.type === 'cup'}
	<svg viewBox="0 0 64 80" width={px} height={px * 1.25} aria-hidden="true" class="drop-shadow-md">
		<path d="M14 10h36v14c0 12-8 22-18 22S14 36 14 24z" fill={color} />
		<path
			d="M14 14H6c0 10 4 16 10 17M50 14h8c0 10-4 16-10 17"
			fill="none"
			stroke={color}
			stroke-width="4"
			stroke-linecap="round"
		/>
		<rect x="28" y="45" width="8" height="12" fill={color} />
		<rect x="18" y="57" width="28" height="9" rx="3" fill="#8b6b4a" />
		<rect x="14" y="66" width="36" height="8" rx="3" fill="#6f553a" />
		<path
			d="M22 16c0 8 3 14 8 17"
			fill="none"
			stroke="#fff"
			stroke-opacity=".5"
			stroke-width="3"
			stroke-linecap="round"
		/>
	</svg>
{:else}
	<svg
		viewBox="0 0 80 64"
		width={px * 1.15}
		height={px * 0.92}
		aria-hidden="true"
		class="drop-shadow-md"
	>
		<rect
			x="4"
			y="4"
			width="72"
			height="52"
			rx="4"
			fill="#fffdf5"
			stroke={color}
			stroke-width="3"
		/>
		<rect
			x="10"
			y="10"
			width="60"
			height="40"
			rx="2"
			fill="none"
			stroke={color}
			stroke-opacity=".5"
		/>
		<rect x="22" y="18" width="36" height="4" rx="2" fill="#c9ced9" />
		<rect x="18" y="27" width="44" height="3" rx="1.5" fill="#e1e5ec" />
		<rect x="24" y="33" width="32" height="3" rx="1.5" fill="#e1e5ec" />
		<circle cx="60" cy="48" r="9" fill={color} />
		<path d="M55 55l-3 9 6-3 2 3 1-9M65 55l3 9-6-3-2 3-1-9" fill={color} />
	</svg>
{/if}
