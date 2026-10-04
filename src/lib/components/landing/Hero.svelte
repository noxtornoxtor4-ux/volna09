<script lang="ts">
	import { ArrowRight, Lightbulb, Sparkles, TrendingUp, Wallet } from '@lucide/svelte';
</script>

<section class="relative overflow-hidden">
	<div
		class="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgb(124_132_255/0.22),transparent_70%),radial-gradient(40%_40%_at_90%_30%,rgb(252_211_77/0.12),transparent_70%)]"
	></div>
	<div
		class="pointer-events-none absolute inset-0 [background-image:linear-gradient(rgb(255_255_255/0.03)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255/0.03)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)] [background-size:48px_48px]"
	></div>

	<div
		class="relative mx-auto grid max-w-6xl items-center gap-14 px-4 pt-20 pb-24 lg:grid-cols-[1.1fr_1fr] lg:pt-28"
	>
		<div>
			<span
				class="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1 text-xs font-medium text-brand-300"
			>
				<Sparkles class="size-3.5" /> ИИ-репетитор для ОРТ, ЕГЭ и SAT
			</span>
			<h1
				class="mt-6 font-display text-4xl leading-[1.08] font-extrabold text-white sm:text-5xl lg:text-6xl"
			>
				Не просто «неверно».<br />
				<span class="text-gradient">ИИ объяснит, почему.</span>
			</h1>
			<p class="mt-6 max-w-xl text-lg text-slate-400">
				Пробные тесты в формате экзамена, разбор каждой ошибки понятным языком и бесконечные похожие
				задачи на ваши слабые темы. Как личный репетитор 24/7, только в разы дешевле.
			</p>
			<div class="mt-8 flex flex-wrap gap-3">
				<a href="#demo" class="btn btn-primary px-6 py-3.5 text-base glow">
					Решить задачу сейчас <ArrowRight class="size-4" />
				</a>
				<a href="/app/test" class="btn btn-ghost px-6 py-3.5 text-base">Пробный ОРТ бесплатно</a>
			</div>
			<dl class="mt-12 grid max-w-md grid-cols-3 gap-6">
				<div>
					<dt class="text-xs text-slate-500">рост балла ОРТ</dt>
					<dd class="font-display text-2xl text-white">+48</dd>
				</div>
				<div>
					<dt class="text-xs text-slate-500">задач в тренажёре</dt>
					<dd class="font-display text-2xl text-white">∞</dd>
				</div>
				<div>
					<dt class="text-xs text-slate-500">в месяц</dt>
					<dd class="font-display text-2xl text-white">490 сом</dd>
				</div>
			</dl>
		</div>

		<div class="relative h-[440px]" aria-hidden="true">
			<div class="absolute top-0 right-4 left-0 animate-float card p-5 shadow-2xl sm:left-6">
				<div class="text-xs text-slate-500">Дроби · вы ответили</div>
				<div class="mt-2 font-display text-xl text-white">
					1/3 + 1/4 = <span class="text-rose-300 line-through">2/7</span>
				</div>
				<div class="mt-3 flex gap-2 rounded-xl bg-accent-400/10 p-3 text-sm text-slate-200">
					<Lightbulb class="mt-0.5 size-4 shrink-0 text-accent-400" />
					<span
						>Вы сложили числители и знаменатели отдельно. Разрежьте оба торта на 12 кусков: 4 + 3 = <b
							class="text-white">7/12</b
						></span
					>
				</div>
			</div>

			<div
				class="absolute top-[200px] right-0 w-60 animate-float card p-4 shadow-2xl [animation-delay:-2s]"
			>
				<div class="flex items-center gap-2 text-xs text-slate-400">
					<TrendingUp class="size-3.5 text-emerald-400" /> Прогноз ОРТ
				</div>
				<div class="mt-1 font-display text-3xl text-white">176</div>
				<svg viewBox="0 0 200 50" class="mt-2 w-full">
					<path
						d="M0 45 L40 38 L80 34 L120 24 L160 18 L200 6"
						fill="none"
						stroke="var(--color-brand-400)"
						stroke-width="3"
						stroke-linecap="round"
					/>
				</svg>
				<div class="text-xs text-emerald-300">+48 за 6 недель</div>
			</div>

			<div
				class="absolute bottom-0 left-0 w-64 animate-float card p-4 shadow-2xl [animation-delay:-4s] sm:left-10"
			>
				<div class="flex items-center gap-3">
					<div class="grid size-10 place-items-center rounded-xl bg-accent-400/15 text-accent-400">
						<Wallet class="size-5" />
					</div>
					<div>
						<div class="text-sm font-semibold text-white">Экономия на репетиторе</div>
						<div class="text-xs text-slate-500">математика + русский</div>
					</div>
				</div>
				<div class="mt-3 font-display text-xl text-accent-400">−11 500 сом/мес</div>
			</div>
		</div>
	</div>
</section>
