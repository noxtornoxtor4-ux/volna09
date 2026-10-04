<script lang="ts">
	import './layout.css';
	import favicon from '#lib/assets/favicon.svg';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>TestBoost AI — подготовка к ОРТ, ЕГЭ и SAT с ИИ</title>
	<meta
		name="description"
		content="Пробные тесты ОРТ, ЕГЭ и SAT, ИИ объясняет каждую ошибку и подбирает похожие задачи на слабые темы."
	/>
</svelte:head>

{@render children()}
