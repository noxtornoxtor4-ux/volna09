<script lang="ts">
	import { ArrowRight, Ban, Layers, Sparkles, Timer, Trophy } from '@lucide/svelte';
	import { brand, killerFeatures, mvpPlan, outOfScope, stack } from '#lib/content.ts';

	const toc = [
		{ href: '#mvp', label: 'MVP за 48 часов' },
		{ href: '#killer', label: '3 Killer Features' },
		{ href: '#stack', label: 'Стек' },
		{ href: '#names', label: 'Названия' }
	];
</script>

<svelte:head>
	<title>Для жюри — TestBoost AI</title>
</svelte:head>

<section class="mx-auto max-w-5xl px-4 pt-16 pb-10">
	<span
		class="inline-flex items-center gap-2 rounded-full border border-accent-500/30 bg-accent-500/10 px-3 py-1 text-xs font-medium text-accent-400"
	>
		<Trophy class="size-3.5" /> Материалы для питча
	</span>
	<h1 class="mt-5 font-display text-4xl font-extrabold text-white sm:text-5xl">
		Концепция MVP и сценарий демо
	</h1>
	<p class="mt-4 max-w-2xl text-lg text-slate-400">
		Что собираем за 24–48 часов, что показываем жюри за 3 минуты и на каком стеке.
	</p>
	<nav class="mt-6 flex flex-wrap gap-2">
		{#each toc as item (item.href)}
			<a href={item.href} class="btn btn-ghost py-2">{item.label}</a>
		{/each}
	</nav>
</section>

<section id="mvp" class="mx-auto max-w-5xl scroll-mt-20 px-4 py-10">
	<h2 class="flex items-center gap-2 font-display text-2xl text-white">
		<Timer class="size-6 text-brand-400" /> MVP за 48 часов
	</h2>
	<p class="mt-3 text-slate-400">
		Принцип: <b class="text-white">одна сквозная история ученика</b>. Пробный тест → разбор ошибок с
		ИИ → тренажёр слабой темы → рост на графике. Всё, что не попадает в эту историю, вырезаем.
	</p>
	<div class="mt-8 grid gap-4 md:grid-cols-4">
		{#each mvpPlan as phase (phase.phase)}
			<div class="card p-5">
				<span class="font-display text-sm text-brand-400">{phase.phase}</span>
				<h3 class="mt-1 font-semibold text-white">{phase.title}</h3>
				<ul class="mt-3 space-y-2 text-sm text-slate-400">
					{#each phase.items as item (item)}
						<li class="flex gap-2"><span class="text-brand-500">•</span>{item}</li>
					{/each}
				</ul>
			</div>
		{/each}
	</div>
	<div class="mt-4 card p-5">
		<h3 class="flex items-center gap-2 font-semibold text-white">
			<Ban class="size-4 text-rose-400" /> Сознательно не делаем в MVP
		</h3>
		<ul class="mt-3 grid gap-2 text-sm text-slate-400 md:grid-cols-3">
			{#each outOfScope as item (item)}
				<li>{item}</li>
			{/each}
		</ul>
	</div>
</section>

<section id="killer" class="mx-auto max-w-5xl scroll-mt-20 px-4 py-10">
	<h2 class="flex items-center gap-2 font-display text-2xl text-white">
		<Sparkles class="size-6 text-brand-400" /> 3 Killer Features: сценарий на 3 минуты
	</h2>
	<div class="mt-8 space-y-4">
		{#each killerFeatures as k, i (k.title)}
			<article class="grid gap-5 card p-6 md:grid-cols-[180px_1fr]">
				<div>
					<div class="grid size-12 place-items-center rounded-xl bg-brand-500/15 text-brand-400">
						<k.icon class="size-6" />
					</div>
					<div class="mt-3 font-display text-sm text-brand-300">{k.time}</div>
					<div class="text-xs text-slate-500">Фича #{i + 1}</div>
				</div>
				<div>
					<h3 class="font-display text-xl text-white">{k.title}</h3>
					<p class="mt-2 text-slate-300"><b class="text-white">Хук:</b> {k.hook}</p>
					<ul class="mt-3 space-y-1.5 text-sm text-slate-400">
						{#each k.show as s (s)}
							<li class="flex gap-2">
								<ArrowRight class="mt-0.5 size-4 shrink-0 text-brand-500" />{s}
							</li>
						{/each}
					</ul>
					<p class="text-brand-200 mt-4 rounded-xl bg-brand-500/10 px-4 py-3 text-sm">
						<b>Вау-момент:</b>
						{k.wow}
					</p>
				</div>
			</article>
		{/each}
	</div>
	<div class="mt-6 flex flex-wrap gap-3">
		<a href="/app/test" class="btn btn-primary">Пробный тест</a>
		<a href="/app/practice" class="btn btn-ghost">Тренажёр</a>
		<a href="/app" class="btn btn-ghost">График прогресса</a>
	</div>
</section>

<section id="stack" class="mx-auto max-w-5xl scroll-mt-20 px-4 py-10">
	<h2 class="flex items-center gap-2 font-display text-2xl text-white">
		<Layers class="size-6 text-brand-400" /> Технологический стек
	</h2>
	<div class="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
		{#each stack as layer (layer.layer)}
			<div class="card p-5">
				<h3 class="text-xs font-semibold tracking-wider text-brand-400 uppercase">{layer.layer}</h3>
				<div class="mt-3 flex flex-wrap gap-1.5">
					{#each layer.items as item (item)}
						<span class="rounded-lg bg-white/6 px-2.5 py-1 text-sm text-white">{item}</span>
					{/each}
				</div>
				<p class="mt-3 text-sm text-slate-400">{layer.why}</p>
			</div>
		{/each}
	</div>
</section>

<section id="names" class="mx-auto max-w-5xl scroll-mt-20 px-4 pt-10 pb-24">
	<h2 class="font-display text-2xl text-white">Альтернативные названия</h2>
	<div class="mt-6 grid gap-4 md:grid-cols-3">
		{#each brand.alternatives as alt (alt.name)}
			<div class="card p-5">
				<div class="text-gradient font-display text-2xl">{alt.name}</div>
				<p class="mt-2 text-sm text-slate-400">{alt.why}</p>
			</div>
		{/each}
	</div>
</section>
