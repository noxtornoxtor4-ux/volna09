<script lang="ts">
	import { goto } from '$app/navigation';
	import { ChevronLeft, ImagePlus, Plus, Trash, X } from '@lucide/svelte';
	import { app } from '#lib/app.svelte.ts';
	import OpportunityCard from '#lib/components/OpportunityCard.svelte';
	import QuestionnaireBuilder from '#lib/components/QuestionnaireBuilder.svelte';
	import { MY_ORG, categories, day, defaultQuestions, toneClass, tones } from '#lib/data.ts';
	import { compressImage, takeFile } from '#lib/files.ts';
	import type { Category, Opportunity } from '#lib/types.ts';

	let draft = $state<Omit<Opportunity, 'id' | 'orgId'>>({
		category: 'action',
		title: '',
		date: day(7),
		time: '10:00–13:00',
		place: '',
		spots: 20,
		hours: 3,
		tags: ['ecology'],
		description: '',
		tasks: ['', ''],
		requirements: ['Возраст от 14 лет'],
		emoji: '🌱',
		tone: 'green',
		deadline: day(5),
		questions: defaultQuestions()
	});
	let step = $state<'info' | 'form'>('info');

	const emojis = [
		'🌱',
		'🌳',
		'♻️',
		'🐾',
		'📚',
		'🎓',
		'🤝',
		'🎨',
		'🏃',
		'🍕',
		'🎬',
		'💚',
		'💡',
		'🧺'
	];

	function toggleTag(id: string) {
		draft.tags = draft.tags.includes(id) ? draft.tags.filter((t) => t !== id) : [...draft.tags, id];
	}

	async function pickPoster(e: Event) {
		const file = takeFile(e);
		if (file) draft.poster = await compressImage(file, 1200, 0.8);
	}

	function publish(e: SubmitEvent) {
		e.preventDefault();
		if (step === 'info') {
			step = 'form';
			scrollTo({ top: 0, behavior: 'smooth' });
			return;
		}
		const data = $state.snapshot(draft);
		const id = app.createOpportunity({
			...data,
			tasks: data.tasks.map((t) => t.trim()).filter(Boolean),
			requirements: data.requirements.map((r) => r.trim()).filter(Boolean),
			questions: data.questions.filter((q) => q.label.trim())
		});
		goto(`/o?id=${id}`);
	}
</script>

<svelte:head><title>Новое мероприятие — Волна</title></svelte:head>

{#snippet listEditor(items: string[], placeholder: string)}
	<div class="space-y-2">
		{#each { length: items.length }, i (i)}
			<div class="flex gap-2">
				<span
					class="mt-3 grid size-6 shrink-0 place-items-center rounded-full bg-surface-2 text-xs font-bold"
					>{i + 1}</span
				>
				<input class="input" {placeholder} bind:value={items[i]} />
				<button
					type="button"
					class="grid size-11 shrink-0 place-items-center rounded-2xl text-muted hover:bg-surface-2"
					onclick={() => items.splice(i, 1)}
					aria-label="Удалить"><X class="size-4" /></button
				>
			</div>
		{/each}
		<button type="button" class="chip" onclick={() => items.push('')}
			><Plus class="size-4" /> Добавить</button
		>
	</div>
{/snippet}

<a href="/cabinet" class="mb-4 btn btn-ghost"><ChevronLeft class="size-4" /> Кабинет</a>

<div class="mb-5 flex flex-wrap items-center justify-between gap-3">
	<h1 class="text-2xl font-extrabold tracking-tight sm:text-3xl">Новое мероприятие</h1>
	<div class="grid grid-cols-2 rounded-2xl bg-surface-2 p-1 text-sm font-bold">
		<button
			type="button"
			class="rounded-xl px-4 py-2 {step === 'info' ? 'bg-surface shadow-sm' : 'text-muted'}"
			onclick={() => (step = 'info')}>1. Описание</button
		>
		<button
			type="button"
			class="rounded-xl px-4 py-2 {step === 'form' ? 'bg-surface shadow-sm' : 'text-muted'}"
			onclick={() => (step = 'form')}>2. Анкета</button
		>
	</div>
</div>

<div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)]">
	<form class="space-y-5" onsubmit={publish}>
		{#if step === 'info'}
			<section class="space-y-4 card p-5">
				<div>
					<span class="label">Формат</span>
					<div class="flex flex-wrap gap-2">
						{#each Object.entries(categories) as [id, c] (id)}
							<button
								type="button"
								class="chip {draft.category === id
									? 'border-accent bg-accent-soft text-accent-text'
									: ''}"
								onclick={() => (draft.category = id as Category)}
							>
								<c.icon class="size-4" />
								{c.label}
							</button>
						{/each}
					</div>
				</div>
				<label class="block"
					><span class="label">Название</span><input
						class="input"
						required
						placeholder="Например: Субботник в сквере"
						bind:value={draft.title}
					/></label
				>
				<label class="block"
					><span class="label">Короткое описание</span><textarea
						class="min-h-20 input"
						required
						placeholder="Что будем делать и зачем"
						bind:value={draft.description}></textarea></label
				>
			</section>

			<section class="space-y-4 card p-5">
				<div class="grid gap-3 sm:grid-cols-2">
					<label class="block"
						><span class="label">Дата</span><input
							class="input"
							type="date"
							required
							min={day(0)}
							bind:value={draft.date}
						/></label
					>
					<label class="block"
						><span class="label">Время</span><input
							class="input"
							required
							bind:value={draft.time}
						/></label
					>
					<label class="block sm:col-span-2"
						><span class="label">Место</span><input
							class="input"
							required
							placeholder="Адрес или «Онлайн»"
							bind:value={draft.place}
						/></label
					>
					<label class="block"
						><span class="label">Количество людей</span><input
							class="input"
							type="number"
							min="1"
							required
							bind:value={draft.spots}
						/></label
					>
					<label class="block"
						><span class="label">Волонтёрских часов</span><input
							class="input"
							type="number"
							min="1"
							max="100"
							required
							bind:value={draft.hours}
						/></label
					>
					<label class="block sm:col-span-2"
						><span class="label">Приём заявок до</span><input
							class="input"
							type="date"
							min={day(0)}
							max={draft.date}
							bind:value={draft.deadline}
						/></label
					>
				</div>
			</section>

			<section class="space-y-3 card p-5">
				<h2 class="font-extrabold">Точные задачи</h2>
				{@render listEditor(draft.tasks, 'Например: собрать мусор на аллеях')}
				<h2 class="pt-2 font-extrabold">Требования</h2>
				{@render listEditor(draft.requirements, 'Например: удобная обувь')}
			</section>

			<section class="space-y-4 card p-5">
				<div>
					<span class="label">Темы — по ним мероприятие попадёт в сторисы «Для вас»</span>
					<div class="flex flex-wrap gap-2">
						{#each app.topics as t (t.id)}
							{@const on = draft.tags.includes(t.id)}
							<button
								type="button"
								class="chip {on ? 'border-accent bg-accent-soft text-accent-text' : ''}"
								onclick={() => toggleTag(t.id)}
								aria-pressed={on}>{t.emoji} {t.label}</button
							>
						{/each}
					</div>
				</div>
				<div>
					<span class="label">Постер</span>
					{#if draft.poster}
						<div class="relative overflow-hidden rounded-3xl">
							<img src={draft.poster} alt="" class="aspect-[16/10] w-full object-cover" />
							<button
								type="button"
								class="absolute top-2 right-2 btn bg-surface/90 py-2"
								onclick={() => (draft.poster = undefined)}><Trash class="size-4" /> Убрать</button
							>
						</div>
					{:else}
						<label
							class="flex cursor-pointer flex-col items-center gap-2 rounded-3xl border-2 border-dashed border-line p-6 text-sm text-muted transition hover:border-accent"
						>
							<ImagePlus class="size-7" /> Загрузить постер
							<input type="file" accept="image/*" class="sr-only" onchange={pickPoster} />
						</label>
						<p class="my-3 text-center text-xs text-muted">или соберите обложку</p>
						<div class="flex flex-wrap gap-1.5">
							{#each emojis as e (e)}
								<button
									type="button"
									class="grid size-10 place-items-center rounded-xl text-xl {draft.emoji === e
										? 'bg-accent-soft ring-2 ring-accent'
										: 'bg-surface-2'}"
									onclick={() => (draft.emoji = e)}>{e}</button
								>
							{/each}
						</div>
						<div class="mt-3 flex gap-2">
							{#each tones as t (t)}
								<button
									type="button"
									class="size-9 rounded-full border-2 {toneClass[t].bg} {draft.tone === t
										? 'border-ink'
										: 'border-transparent'}"
									onclick={() => (draft.tone = t)}
									aria-label="Цвет {t}"
								></button>
							{/each}
						</div>
					{/if}
				</div>
			</section>

			<button class="btn w-full btn-primary py-3" disabled={!draft.tags.length}
				>Дальше: анкета для волонтёров</button
			>
		{:else}
			<section class="space-y-3 card p-5">
				<h2 class="font-extrabold">Анкета участника</h2>
				<p class="text-sm text-muted">
					Её заполнят волонтёры, когда нажмут «Податься». Имя и возраст подставятся из профиля.
				</p>
				<QuestionnaireBuilder bind:questions={draft.questions} />
			</section>
			<button
				class="btn w-full btn-primary py-3"
				disabled={!draft.title.trim() || !draft.place.trim()}>Опубликовать мероприятие</button
			>
			{#if !draft.title.trim() || !draft.place.trim()}
				<p class="text-center text-xs text-muted">Заполните название и место на шаге «Описание».</p>
			{/if}
		{/if}
	</form>

	<div class="lg:sticky lg:top-10 lg:self-start">
		<p class="label">Так карточку увидят волонтёры</p>
		<OpportunityCard opportunity={{ ...draft, id: 'preview', orgId: MY_ORG }} preview />
	</div>
</div>
