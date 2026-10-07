<script lang="ts">
	import { tr } from '#lib/i18n.ts';
	import { goto } from '$app/navigation';
	import { ChevronLeft, Megaphone, Plus, Trash } from '@lucide/svelte';
	import { app } from '#lib/app.svelte.ts';
	import LookPicker from '#lib/components/LookPicker.svelte';
	import TintEditor from '#lib/components/TintEditor.svelte';
	import { cities, day, toneClass, tones } from '#lib/data.ts';
	import { formatDate } from '#lib/format.ts';
	import type { OrgBanner, Profile, OrgProfile } from '#lib/types.ts';

	let form = $state<Profile>($state.snapshot(app.profile));
	let orgForm = $state<OrgProfile>($state.snapshot(app.orgProfile));
	let news = $state({ title: '', text: '' });

	/** Город может быть не из списка (старые данные) — тогда он тоже доступен в выборе */
	const cityOptions = $derived([...new Set([...cities, form.city, orgForm.city])].filter(Boolean));
	const initials = (name: string) =>
		name
			.replace(/[«»"]/g, '')
			.split(' ')
			.slice(0, 2)
			.map((w) => w[0])
			.join('');

	const orgEvents = $derived(app.orgOpportunities.filter((o) => o.date >= day(0)));

	function toggleInterest(id: string) {
		form.interests = form.interests.includes(id)
			? form.interests.filter((x) => x !== id)
			: [...form.interests, id];
	}

	function enableBanner() {
		const banner: OrgBanner = {
			title: '',
			text: '',
			ctaLabel: tr('Подробнее'),
			ctaHref: '',
			tone: orgForm.tone ?? app.myOrg.tone
		};
		orgForm.banner = banner;
	}

	function addNews() {
		if (!news.title.trim() || !news.text.trim()) return;
		orgForm.announcements = [
			{
				id: crypto.randomUUID().slice(0, 8),
				title: news.title.trim(),
				text: news.text.trim(),
				date: day(0)
			},
			...(orgForm.announcements ?? [])
		];
		news = { title: '', text: '' };
	}

	function save(e: SubmitEvent) {
		e.preventDefault();
		if (app.isOrg) app.updateOrgProfile($state.snapshot(orgForm));
		else app.updateProfile($state.snapshot(form));
		goto('/profile');
	}
</script>

<svelte:head><title>{tr('Редактировать профиль — Волна')}</title></svelte:head>

<a href="/profile" class="mb-4 btn btn-ghost"><ChevronLeft class="size-4" /> {tr('Профиль')}</a>

<form class="mx-auto max-w-2xl space-y-5" onsubmit={save}>
	{#if app.isOrg}
		<section class="card p-5">
			<h2 class="mb-4 text-lg font-extrabold">{tr('Оформление страницы')}</h2>
			<LookPicker
				bind:look={orgForm}
				tone={orgForm.tone ?? app.myOrg.tone}
				round={false}
				fallback={app.myOrg.emoji}
			/>
			<div class="mt-5">
				<span class="label">{tr('Цвет страницы')}</span>
				<div class="flex gap-2">
					{#each tones as t (t)}
						<button
							type="button"
							class="size-9 rounded-full border-2 {toneClass[t].bg} {(orgForm.tone ??
								app.myOrg.tone) === t
								? 'border-ink'
								: 'border-transparent'}"
							onclick={() => (orgForm.tone = t)}
							aria-label={tr('Цвет {0}', t)}
						></button>
					{/each}
				</div>
			</div>
		</section>

		<section class="card p-5">
			<h2 class="mb-4 text-lg font-extrabold">{tr('Оттенок профиля')}</h2>
			<TintEditor
				bind:tint={orgForm.tint}
				look={orgForm}
				tone={orgForm.tone ?? app.myOrg.tone}
				name={orgForm.name}
				id={app.myOrgId}
			/>
		</section>

		<section class="space-y-4 card p-5">
			<h2 class="text-lg font-extrabold">{tr('Информация')}</h2>
			<label class="block"
				><span class="label">{tr('Название организации')}</span><input
					class="input"
					required
					bind:value={orgForm.name}
				/></label
			>
			<label class="block">
				<span class="label">{tr('Город')}</span>
				<select class="input" bind:value={orgForm.city}>
					{#each cityOptions as c (c)}<option value={c}>{tr(c)}</option>{/each}
				</select>
			</label>
			<label class="block"
				><span class="label">{tr('О нас')}</span><textarea
					class="min-h-24 input"
					maxlength="240"
					bind:value={orgForm.about}></textarea></label
			>
			<div class="grid gap-3 sm:grid-cols-2">
				<label class="block"
					><span class="label">{tr('Сайт')}</span><input
						class="input"
						placeholder="example.kg"
						bind:value={orgForm.website}
					/></label
				>
				<label class="block"
					><span class="label">Telegram</span><input
						class="input"
						placeholder="@club"
						bind:value={orgForm.telegram}
					/></label
				>
			</div>
			{#if app.myOrg.verified}<p class="text-xs text-muted">
					{tr('✓ Организация проверена платформой')}
				</p>{/if}
		</section>

		<section class="space-y-4 card p-5">
			<div class="flex items-center justify-between">
				<h2 class="flex items-center gap-2 text-lg font-extrabold">
					<Megaphone class="size-5 text-accent-text" />
					{tr('Баннер')}
				</h2>
				{#if orgForm.banner}
					<button
						type="button"
						class="text-sm font-semibold text-muted hover:text-ink"
						onclick={() => (orgForm.banner = undefined)}>{tr('Убрать')}</button
					>
				{/if}
			</div>
			{#if orgForm.banner}
				<div class="rounded-3xl p-4 {toneClass[orgForm.banner.tone].bg}">
					<div class="font-extrabold">{orgForm.banner.title || tr('Заголовок баннера')}</div>
					<p class="text-sm">
						{orgForm.banner.text || tr('Текст: набор волонтёров, акция или важное объявление')}
					</p>
					{#if orgForm.banner.ctaLabel}<span class="mt-3 btn bg-ink py-2 text-sm text-bg"
							>{orgForm.banner.ctaLabel}</span
						>{/if}
				</div>
				<label class="block"
					><span class="label">{tr('Заголовок')}</span><input
						class="input"
						maxlength="60"
						bind:value={orgForm.banner.title}
					/></label
				>
				<label class="block"
					><span class="label">{tr('Текст')}</span><textarea
						class="min-h-16 input"
						maxlength="160"
						bind:value={orgForm.banner.text}></textarea></label
				>
				<div class="grid gap-3 sm:grid-cols-2">
					<label class="block"
						><span class="label">{tr('Текст кнопки')}</span><input
							class="input"
							maxlength="24"
							bind:value={orgForm.banner.ctaLabel}
						/></label
					>
					<label class="block">
						<span class="label">{tr('Куда ведёт кнопка')}</span>
						<select class="input" bind:value={orgForm.banner.ctaHref}>
							<option value="">{tr('Без кнопки')}</option>
							{#each orgEvents as o (o.id)}<option value="/o?id={o.id}">{o.emoji} {o.title}</option
								>{/each}
							<option value="/cabinet/new?category=recruitment">{tr('Форма нового набора')}</option>
						</select>
					</label>
				</div>
				<div class="flex gap-2">
					{#each tones as t (t)}
						<button
							type="button"
							class="size-8 rounded-full border-2 {toneClass[t].bg} {orgForm.banner.tone === t
								? 'border-ink'
								: 'border-transparent'}"
							onclick={() => orgForm.banner && (orgForm.banner.tone = t)}
							aria-label={tr('Цвет баннера {0}', t)}
						></button>
					{/each}
				</div>
			{:else}
				<p class="text-sm text-muted">
					{tr('Большой баннер вверху страницы: набор волонтёров, акция или важное объявление.')}
				</p>
				<button type="button" class="btn btn-soft" onclick={enableBanner}
					><Plus class="size-4" /> {tr('Добавить баннер')}</button
				>
			{/if}
		</section>

		<section class="space-y-3 card p-5">
			<h2 class="text-lg font-extrabold">{tr('Анонсы')}</h2>
			<div class="space-y-2 rounded-3xl bg-surface-2 p-3">
				<input
					class="input bg-surface"
					placeholder={tr('Заголовок анонса')}
					maxlength="60"
					bind:value={news.title}
				/>
				<textarea
					class="min-h-16 input bg-surface"
					placeholder={tr('Что важно знать волонтёрам')}
					maxlength="240"
					bind:value={news.text}></textarea>
				<button
					type="button"
					class="btn btn-soft"
					disabled={!news.title.trim() || !news.text.trim()}
					onclick={addNews}><Plus class="size-4" /> {tr('Добавить анонс')}</button
				>
			</div>
			{#each orgForm.announcements ?? [] as item (item.id)}
				<div class="flex items-start gap-3 rounded-2xl border border-line p-3">
					<div class="min-w-0 flex-1">
						<div class="font-semibold">
							{item.title}
							<span class="text-xs font-normal text-muted">· {formatDate(item.date)}</span>
						</div>
						<p class="text-sm text-muted">{item.text}</p>
					</div>
					<button
						type="button"
						class="text-muted hover:text-pastel-peach-ink"
						onclick={() =>
							(orgForm.announcements = orgForm.announcements?.filter((a) => a.id !== item.id))}
						aria-label={tr('Удалить анонс')}
					>
						<Trash class="size-4" />
					</button>
				</div>
			{/each}
		</section>

		<section class="flex flex-wrap items-center justify-between gap-3 card p-5">
			<div>
				<h2 class="text-lg font-extrabold">{tr('Наборы волонтёров')}</h2>
				<p class="text-sm text-muted">
					{tr('Открытые наборы показываются на странице организации.')}
				</p>
			</div>
			<a href="/cabinet/new?category=recruitment" class="btn btn-soft"
				><Plus class="size-4" /> {tr('Опубликовать набор')}</a
			>
		</section>
	{:else}
		<section class="card p-5">
			<h2 class="mb-4 text-lg font-extrabold">{tr('Постер и аватар')}</h2>
			<LookPicker bind:look={form} tone={form.tone} fallback={initials(form.name)} />
		</section>

		<section class="card p-5">
			<h2 class="mb-4 text-lg font-extrabold">{tr('Оттенок профиля')}</h2>
			<TintEditor
				bind:tint={form.tint}
				look={form}
				tone={form.tone}
				name={form.name}
				id={app.actorId}
			/>
		</section>

		<section class="space-y-4 card p-5">
			<label class="block"
				><span class="label">{tr('ФИО')}</span><input
					class="input"
					required
					bind:value={form.name}
				/></label
			>
			<div class="grid grid-cols-2 gap-3">
				<label class="block"
					><span class="label">{tr('Возраст')}</span><input
						class="input"
						type="number"
						min="12"
						max="25"
						required
						bind:value={form.age}
					/></label
				>
				<label class="block">
					<span class="label">{tr('Город')}</span>
					<select class="input" bind:value={form.city}>
						{#each cityOptions as c (c)}<option value={c}>{tr(c)}</option>{/each}
					</select>
				</label>
			</div>
			<p class="-mt-2 text-xs text-muted">
				{tr('По городу подбираются мероприятия, наборы и активности на главной.')}
			</p>
			<label class="block"
				><span class="label">{tr('О себе')}</span><textarea
					class="min-h-20 input"
					maxlength="160"
					bind:value={form.bio}></textarea></label
			>
			<div>
				<span class="label">{tr('Цвет профиля')}</span>
				<div class="flex gap-2">
					{#each tones as t (t)}
						<button
							type="button"
							class="size-9 rounded-full border-2 {toneClass[t].bg} {form.tone === t
								? 'border-ink'
								: 'border-transparent'}"
							onclick={() => (form.tone = t)}
							aria-label={tr('Цвет {0}', t)}
						></button>
					{/each}
				</div>
			</div>
			<div>
				<span class="label">{tr('Интересы — по ним собираются сторисы «Для вас»')}</span>
				<div class="flex flex-wrap gap-2">
					{#each app.topics as t (t.id)}
						{@const on = form.interests.includes(t.id)}
						<button
							type="button"
							class="chip {on ? 'border-accent bg-accent-soft text-accent-text' : ''}"
							onclick={() => toggleInterest(t.id)}
							aria-pressed={on}>{t.emoji} {tr(t.label)}</button
						>
					{/each}
				</div>
			</div>
		</section>
	{/if}

	<button class="btn w-full btn-primary py-3">{tr('Сохранить')}</button>
</form>
