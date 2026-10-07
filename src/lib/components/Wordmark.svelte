<script lang="ts">
	let { class: className = '' }: { class?: string } = $props();

	/** Уникальные id масок, чтобы несколько логотипов на странице не мешали друг другу */
	const id = $props.id();
</script>

<!-- Фирменная надпись WAVE: тёмные блоки букв, волна и круги фирменного голубого -->
<svg viewBox="0 0 1280 276" class={className} role="img" aria-label="WAVE">
	<defs>
		<clipPath id="{id}-blocks">
			<path
				d="M4.8 15.3Q0 0 16 0L430 0Q446 0 442.1 15.5L379.9 260.5Q376 276 360 276L102 276Q86 276 81.2 260.7ZM488.1 14.9Q494 0 510 0L606 0Q622 0 627.9 14.9L726.1 261.1Q732 276 716 276L400 276Q384 276 389.9 261.1ZM669.1 15.2Q664 0 680 0L972 0Q988 0 982.7 15.1L897.3 260.9Q892 276 876 276L772 276Q756 276 750.9 260.8ZM1006 16Q1006 0 1022 0L1264 0Q1280 0 1280 16L1280 260Q1280 276 1264 276L1022 276Q1006 276 1006 260Z"
			/>
		</clipPath>
		<mask id="{id}-holes">
			<rect width="1280" height="276" fill="#fff" />
			<circle cx="228" cy="277" r="52" />
			<circle cx="828" cy="-2" r="45" />
			<circle cx="1242" cy="277" r="46" />
		</mask>
	</defs>
	<g mask="url(#{id}-holes)">
		<g clip-path="url(#{id}-blocks)">
			<rect width="1280" height="276" class="fill-brand-navy" />
			<g class="fill-none stroke-brand-blue">
				<circle cx="228" cy="277" r="72" stroke-width="40" />
				<circle cx="828" cy="-2" r="65" stroke-width="40" />
				<circle cx="1242" cy="277" r="61" stroke-width="30" />
			</g>
			<g class="fill-brand-blue">
				<circle cx="560" cy="110" r="30" />
				<circle cx="1226" cy="147" r="28" />
			</g>
		</g>
	</g>
	<path
		d="M65 207C150 125 200 87 250 93C330 103 380 230 500 233C600 235 640 110 720 108C800 106 860 225 960 228C1060 231 1120 87 1210 83C1240 82 1265 87 1280 95"
		class="fill-none stroke-brand-blue"
		stroke-width="22"
		stroke-linecap="round"
	/>
</svg>
