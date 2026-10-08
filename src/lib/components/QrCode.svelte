<script lang="ts">
	import qrcode from 'qrcode-generator';

	/** QR-код в виде SVG: чёткий на любом экране и перекрашивается темой */
	let { value, class: className = '' }: { value: string; class?: string } = $props();

	const qr = $derived.by(() => {
		const code = qrcode(0, 'M');
		code.addData(value);
		code.make();
		const count = code.getModuleCount();
		let path = '';
		for (let r = 0; r < count; r++) {
			for (let c = 0; c < count; c++) if (code.isDark(r, c)) path += `M${c} ${r}h1v1h-1z`;
		}
		return { count, path };
	});
</script>

<svg
	viewBox="-2 -2 {qr.count + 4} {qr.count + 4}"
	class={className}
	shape-rendering="crispEdges"
	role="img"
	aria-label="QR"
>
	<rect x="-2" y="-2" width={qr.count + 4} height={qr.count + 4} fill="#fff" />
	<path d={qr.path} fill="#091540" />
</svg>
