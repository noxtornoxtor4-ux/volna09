<script lang="ts">
	import { app } from '#lib/app.svelte.ts';
	import { toneClass } from '#lib/data.ts';

	let {
		id,
		size = 'md',
		ring = false
	}: {
		id: string;
		size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
		/** Обводка: цвет карточки или оттенок профиля (accent) */
		ring?: boolean | 'accent';
	} = $props();

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
		xs: 'size-6 text-[10px]',
		sm: 'size-8 text-xs',
		md: 'size-10 text-sm',
		lg: 'size-14 text-lg',
		xl: 'size-24 text-3xl',
		'2xl': 'size-28 text-4xl sm:size-32'
	};
</script>

<span
	class="grid shrink-0 place-items-center overflow-hidden font-bold {author.isOrg
		? 'rounded-[30%]'
		: 'rounded-full'} {sizes[size]} {toneClass[author.tone].bg} {toneClass[author.tone]
		.text} {ring === 'accent' ? 'ring-4 ring-accent' : ring ? 'ring-4 ring-surface' : ''}"
	aria-hidden="true"
>
	{#if author.avatar}
		<img src={author.avatar} alt="" class="size-full object-cover" />
	{:else if author.avatarEmoji}
		<span class="text-[1.6em] leading-none">{author.avatarEmoji}</span>
	{:else}
		{author.emoji ?? initials}
	{/if}
</span>
