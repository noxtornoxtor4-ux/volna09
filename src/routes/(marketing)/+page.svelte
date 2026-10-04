<script lang="ts">
	import { ArrowRight, Check, Quote } from '@lucide/svelte';
	import DemoQuiz from '#lib/components/landing/DemoQuiz.svelte';
	import Hero from '#lib/components/landing/Hero.svelte';
	import SavingsCalculator from '#lib/components/landing/SavingsCalculator.svelte';
	import { features, pricing, problems, steps, testimonials } from '#lib/content.ts';
</script>

<Hero />

<!-- Проблема -->
<section class="mx-auto max-w-6xl px-4 py-20">
	<div class="mx-auto max-w-2xl text-center">
		<p class="text-sm font-semibold tracking-wider text-brand-400 uppercase">Проблема</p>
		<h2 class="mt-3 font-display text-3xl font-bold text-white sm:text-4xl">
			Готовиться к экзамену дорого. А готовиться самому — непонятно
		</h2>
	</div>
	<div class="mt-12 grid gap-5 md:grid-cols-3">
		{#each problems as item (item.text)}
			<div class="card p-6">
				<div class="font-display text-3xl text-rose-300">{item.stat}</div>
				<p class="mt-3 text-slate-400">{item.text}</p>
			</div>
		{/each}
	</div>
</section>

<!-- Решение -->
<section id="how" class="scroll-mt-20 border-y border-white/6 bg-ink-900/40 py-20">
	<div class="mx-auto max-w-6xl px-4">
		<div class="mx-auto max-w-2xl text-center">
			<p class="text-sm font-semibold tracking-wider text-brand-400 uppercase">Решение</p>
			<h2 class="mt-3 font-display text-3xl font-bold text-white sm:text-4xl">
				Репетитор, который знает, где именно вы ошибаетесь
			</h2>
		</div>
		<div class="mt-12 grid gap-5 md:grid-cols-2">
			{#each features as f (f.title)}
				<a
					href={f.href}
					class="group card p-6 transition hover:-translate-y-1 hover:border-brand-500/40"
				>
					<div class="grid size-12 place-items-center rounded-xl bg-brand-500/15 text-brand-400">
						<f.icon class="size-6" />
					</div>
					<h3 class="mt-5 font-display text-xl text-white">{f.title}</h3>
					<p class="mt-2 text-slate-400">{f.text}</p>
					<span
						class="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-400 group-hover:gap-2"
					>
						Попробовать <ArrowRight class="size-4 transition-all" />
					</span>
				</a>
			{/each}
		</div>

		<div class="mt-16 grid gap-4 md:grid-cols-4">
			{#each steps as step (step.n)}
				<div class="rounded-2xl border border-dashed border-white/10 p-5">
					<span class="font-display text-sm text-accent-400">{step.n}</span>
					<h4 class="mt-2 font-semibold text-white">{step.title}</h4>
					<p class="mt-1 text-sm text-slate-400">{step.text}</p>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- Демо -->
<section id="demo" class="mx-auto max-w-6xl scroll-mt-20 px-4 py-20">
	<div class="mx-auto mb-10 max-w-2xl text-center">
		<p class="text-sm font-semibold tracking-wider text-brand-400 uppercase">Интерактивное демо</p>
		<h2 class="mt-3 font-display text-3xl font-bold text-white sm:text-4xl">
			Ошибитесь специально
		</h2>
		<p class="mt-4 text-slate-400">
			Выберите любой ответ: ИИ объяснит, почему именно ваш вариант неверный, и даст похожую задачу с
			новыми числами.
		</p>
	</div>
	<DemoQuiz />
</section>

<!-- Калькулятор -->
<section id="calculator" class="scroll-mt-20 border-y border-white/6 bg-ink-900/40 py-20">
	<div class="mx-auto max-w-6xl px-4">
		<div class="mx-auto mb-10 max-w-2xl text-center">
			<p class="text-sm font-semibold tracking-wider text-brand-400 uppercase">Калькулятор</p>
			<h2 class="mt-3 font-display text-3xl font-bold text-white sm:text-4xl">
				Сколько стоят репетиторы до экзамена?
			</h2>
			<p class="mt-4 text-slate-400">Подвигайте ползунки: посчитаем и деньги, и время на дорогу.</p>
		</div>
		<SavingsCalculator />
	</div>
</section>

<!-- Отзывы -->
<section id="reviews" class="mx-auto max-w-6xl scroll-mt-20 px-4 py-20">
	<div class="mx-auto mb-10 max-w-2xl text-center">
		<p class="text-sm font-semibold tracking-wider text-brand-400 uppercase">
			Отзывы бета-тестеров
		</p>
		<h2 class="mt-3 font-display text-3xl font-bold text-white sm:text-4xl">
			Наконец-то понятно, почему
		</h2>
	</div>
	<div class="grid gap-5 md:grid-cols-2">
		{#each testimonials as t (t.name)}
			<figure class="flex flex-col card p-6">
				<Quote class="size-6 text-brand-500/60" />
				<blockquote class="mt-3 flex-1 text-slate-300">{t.text}</blockquote>
				<figcaption class="mt-5 flex items-center justify-between gap-3">
					<div class="flex items-center gap-3">
						<div
							class="grid size-10 place-items-center rounded-full bg-linear-to-br from-brand-500 to-accent-500 font-semibold text-ink-950"
						>
							{t.name[0]}
						</div>
						<div>
							<div class="text-sm font-semibold text-white">{t.name}</div>
							<div class="text-xs text-slate-500">{t.role}</div>
						</div>
					</div>
					<span class="rounded-full bg-brand-500/10 px-3 py-1 text-xs font-semibold text-brand-300"
						>{t.metric}</span
					>
				</figcaption>
			</figure>
		{/each}
	</div>
</section>

<!-- Тарифы -->
<section class="border-t border-white/6 bg-ink-900/40 py-20">
	<div class="mx-auto max-w-6xl px-4">
		<h2 class="text-center font-display text-3xl font-bold text-white sm:text-4xl">
			Дешевле одного занятия с репетитором
		</h2>
		<div class="mt-12 grid gap-5 md:grid-cols-3">
			{#each pricing as plan (plan.name)}
				<div class="flex flex-col card p-6 {plan.highlight ? 'border-brand-500/50 glow' : ''}">
					{#if plan.highlight}
						<span
							class="mb-3 self-start rounded-full bg-brand-500 px-3 py-1 text-xs font-semibold text-ink-950"
							>Популярный</span
						>
					{/if}
					<h3 class="font-display text-lg text-white">{plan.name}</h3>
					<p class="mt-2">
						<span class="font-display text-3xl font-bold text-white">{plan.price}</span>
						<span class="text-sm text-slate-500">{plan.note}</span>
					</p>
					<ul class="mt-5 flex-1 space-y-2 text-sm text-slate-300">
						{#each plan.features as item (item)}
							<li class="flex gap-2"><Check class="size-4 shrink-0 text-brand-400" />{item}</li>
						{/each}
					</ul>
					<a href="/app/test" class="mt-6 btn {plan.highlight ? 'btn-primary' : 'btn-ghost'}"
						>{plan.cta}</a
					>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- CTA -->
<section class="mx-auto max-w-6xl px-4 py-24">
	<div
		class="relative overflow-hidden rounded-3xl border border-brand-500/30 bg-linear-to-br from-brand-500/20 via-ink-900 to-accent-500/15 p-10 text-center sm:p-16"
	>
		<h2 class="mx-auto max-w-3xl font-display text-3xl font-extrabold text-white sm:text-5xl">
			Узнайте свой балл ОРТ за 20 минут
		</h2>
		<p class="mx-auto mt-5 max-w-xl text-lg text-slate-300">
			Бесплатный пробный тест с разбором каждой ошибки. Без регистрации.
		</p>
		<div class="mt-8 flex flex-wrap justify-center gap-3">
			<a href="/app/test" class="btn btn-primary px-7 py-4 text-base glow"
				>Пройти пробный тест <ArrowRight class="size-4" /></a
			>
			<a href="/app" class="btn btn-ghost px-7 py-4 text-base">Посмотреть демо-прогресс</a>
		</div>
	</div>
</section>
