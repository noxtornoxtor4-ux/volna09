<script lang="ts">
	import { app } from '#lib/app.svelte.ts';
	import { toneClass } from '#lib/data.ts';

	let { id, size = 'md' }: { id: string; size?: 'sm' | 'md' | 'lg' | 'xl' } = $props();

	const author = $derived(app.author(id));
	const initials = $derived(
		author.name
			.replace(/[«»"]/g, '')
			.split(' ')
			.slice(0, 2)
			.map((w) => w[0])
			.join('')
	);
	const sizes = {
		sm: 'size-8 text-xs',
		md: 'size-10 text-sm',
		lg: 'size-14 text-lg',
		xl: 'size-24 text-3xl'
	};
</script>

<span
	class="grid shrink-0 place-items-center font-bold {author.isOrg
		? 'rounded-2xl'
		: 'rounded-full'} {sizes[size]} {toneClass[author.tone].bg} {toneClass[author.tone].text}"
	aria-hidden="true"
>
	{author.emoji ?? initials}
</span>
