<script lang="ts">
	import { ArrowRight, Calculator, FileText, Lock, Sparkles, TriangleAlert } from '@lucide/svelte';
</script>

<section class="relative overflow-hidden">
	<div
		class="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgb(31_209_137/0.18),transparent_70%),radial-gradient(40%_40%_at_90%_30%,rgb(139_92_246/0.15),transparent_70%)]"
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
				<Sparkles class="size-3.5" /> 4 ИИ-модуля в одной экосистеме
			</span>
			<h1
				class="mt-6 font-display text-4xl leading-[1.08] font-extrabold text-white sm:text-5xl lg:text-6xl"
			>
				Делайте работу.<br />
				<span class="text-gradient">Деньги и нервы защитит ИИ.</span>
			</h1>
			<p class="mt-6 max-w-xl text-lg text-slate-400">
				FreelanceShield ловит правки вне ТЗ прямо в чате, держит оплату в безопасной сделке по
				этапам и собирает договор под законы вашей страны за 10 секунд. Без невыплат, без бесплатной
				работы, без юристов.
			</p>
			<div class="mt-8 flex flex-wrap gap-3">
				<a href="#demo" class="btn btn-primary px-6 py-3.5 text-base glow">
					Попробовать демо <ArrowRight class="size-4" />
				</a>
				<a href="#calculator" class="btn btn-ghost px-6 py-3.5 text-base">
					<Calculator class="size-4" /> Сколько я теряю?
				</a>
			</div>
			<dl class="mt-12 grid max-w-md grid-cols-3 gap-6">
				<div>
					<dt class="text-xs text-slate-500">правок ловит ИИ</dt>
					<dd class="font-display text-2xl text-white">94%</dd>
				</div>
				<div>
					<dt class="text-xs text-slate-500">на договор</dt>
					<dd class="font-display text-2xl text-white">10 сек</dd>
				</div>
				<div>
					<dt class="text-xs text-slate-500">невыплат</dt>
					<dd class="font-display text-2xl text-white">0</dd>
				</div>
			</dl>
		</div>

		<div class="relative h-[420px]" aria-hidden="true">
			<div class="absolute top-0 right-4 left-0 animate-float card p-4 shadow-2xl sm:left-6">
				<div class="mb-2 text-xs text-slate-500">Клиент · Кофейня «Зерно»</div>
				<div
					class="rounded-2xl rounded-bl-sm bg-ink-700 px-4 py-2.5 text-sm text-white ring-2 ring-rose-500/70"
				>
					А можно ещё добавить личный кабинет и онлайн-оплату? Это же быстро 🙂
				</div>
				<div
					class="mt-3 flex items-center gap-2 rounded-xl bg-rose-500/10 px-3 py-2 text-xs text-rose-200"
				>
					<TriangleAlert class="size-4 shrink-0" /> Вне ТЗ · 94% · ~42 ч ·
					<b class="text-white">$1 050</b>
				</div>
			</div>

			<div
				class="absolute top-[170px] right-0 w-64 animate-float card p-4 shadow-2xl [animation-delay:-2s]"
			>
				<div class="flex items-center gap-2 text-xs text-slate-400">
					<Lock class="size-3.5 text-brand-400" /> Этап 2 · Дизайн главной
				</div>
				<div class="mt-2 font-display text-2xl text-white">$450</div>
				<div class="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
					<div class="h-full w-2/3 rounded-full bg-brand-500"></div>
				</div>
				<div class="mt-2 text-xs text-brand-300">Авто-выплата через 47 ч</div>
			</div>

			<div
				class="absolute bottom-0 left-0 w-72 animate-float card p-4 shadow-2xl [animation-delay:-4s] sm:left-10"
			>
				<div class="flex items-center gap-3">
					<div class="grid size-10 place-items-center rounded-xl bg-accent-500/20 text-accent-400">
						<FileText class="size-5" />
					</div>
					<div>
						<div class="text-sm font-semibold text-white">Договор · Германия 🇩🇪</div>
						<div class="text-xs text-slate-500">BGB · § 19 UStG · 3 этапа</div>
					</div>
				</div>
				<div class="mt-3 text-xs text-brand-300">Сгенерирован за 8,4 сек</div>
			</div>
		</div>
	</div>
</section>
