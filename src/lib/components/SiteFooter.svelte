<script lang="ts">
	import Logo from './Logo.svelte';
</script>

<footer class="border-t border-white/6 py-10">
	<div
		class="mx-auto flex max-w-6xl flex-col gap-6 px-4 text-sm text-slate-500 md:flex-row md:items-center md:justify-between"
	>
		<div class="space-y-2">
			<Logo />
			<p>Защищаем деньги, время и нервы фрилансеров и заказчиков.</p>
		</div>
		<nav class="flex flex-wrap gap-5">
			<a href="/app" class="hover:text-white">Кабинет</a>
			<a href="/app/contracts" class="hover:text-white">Договоры</a>
			<a href="/app/escrow" class="hover:text-white">Эскроу</a>
			<a href="/pitch" class="hover:text-white">Для жюри</a>
		</nav>
	</div>
	<p class="mx-auto mt-6 max-w-6xl px-4 text-xs text-slate-600">
		Хакатон-MVP. Статистика, отзывы и сделки на сайте — демонстрационные данные. Шаблоны договоров
		не являются юридической консультацией.
	</p>
</footer>
