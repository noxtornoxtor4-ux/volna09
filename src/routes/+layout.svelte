<script lang="ts">
	import './layout.css';
	import favicon from '#lib/assets/favicon.svg';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>FreelanceShield AI — защита фрилансеров и заказчиков</title>
	<meta
		name="description"
		content="ИИ ловит правки вне ТЗ, эскроу по этапам выплачивает сам, договор под любую страну за 10 секунд."
	/>
</svelte:head>

{@render children()}
