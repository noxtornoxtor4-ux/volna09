<script lang="ts">
	import Logo from './Logo.svelte';
</script>

<footer class="border-t border-white/6 py-10">
	<div
		class="mx-auto flex max-w-6xl flex-col gap-6 px-4 text-sm text-slate-500 md:flex-row md:items-center md:justify-between"
	>
		<div class="space-y-2">
			<Logo />
			<p>Готовим к ОРТ, ЕГЭ и SAT без стресса и дорогих репетиторов.</p>
		</div>
		<nav class="flex flex-wrap gap-5">
			<a href="/app" class="hover:text-white">Прогресс</a>
			<a href="/app/test" class="hover:text-white">Пробный тест</a>
			<a href="/app/practice" class="hover:text-white">Тренажёр</a>
			<a href="/pitch" class="hover:text-white">Для жюри</a>
		</nav>
	</div>
	<p class="mx-auto mt-6 max-w-6xl px-4 text-xs text-slate-600">
		Хакатон-MVP. Отзывы, статистика и история прогресса — демонстрационные данные. Задания
		составлены в формате экзаменов и не являются официальными материалами ЦООМО, ФИПИ или College
		Board.
	</p>
</footer>
