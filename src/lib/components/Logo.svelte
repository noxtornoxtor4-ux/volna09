<script lang="ts">
	import { ShieldCheck } from '@lucide/svelte';
	import { brand } from '#lib/content.ts';
</script>

<a href="/" class="flex items-center gap-2 font-display text-[15px] font-bold text-white">
	<span class="grid size-8 place-items-center rounded-lg bg-brand-500 text-ink-950">
		<ShieldCheck class="size-5" strokeWidth={2.5} />
	</span>
	{brand.name}<span class="text-brand-400">{brand.suffix}</span>
</a>
