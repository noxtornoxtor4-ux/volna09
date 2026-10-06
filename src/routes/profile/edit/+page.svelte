<script lang="ts">
	import { goto } from '$app/navigation';
	import { Camera, ChevronLeft, ImagePlus, Trash } from '@lucide/svelte';
	import { app } from '#lib/app.svelte.ts';
	import Avatar from '#lib/components/Avatar.svelte';
	import { toneClass, tones } from '#lib/data.ts';
	import { compressImage, takeFile } from '#lib/files.ts';

	let form = $state($state.snapshot(app.profile));
	let orgForm = $state($state.snapshot(app.orgProfile));

	const cover = $derived(app.isOrg ? orgForm.cover : form.cover);
	const avatar = $derived(app.isOrg ? orgForm.avatar : form.avatar);
	const tone = $derived(app.isOrg ? app.myOrg.tone : form.tone);

	async function pick(e: Event, field: 'avatar' | 'cover') {
		const file = takeFile(e);
		if (!file) return;
		const src = await compressImage(file, field === 'avatar' ? 400 : 1400, 0.8);
		if (app.isOrg) orgForm[field] = src;
		else form[field] = src;
	}

	function clear(field: 'avatar' | 'cover') {
		if (app.isOrg) orgForm[field] = undefined;
		else form[field] = undefined;
	}

	function toggleInterest(id: string) {
		form.interests = form.interests.includes(id)
			? form.interests.filter((x) => x !== id)
			: [...form.interests, id];
	}

	function save(e: SubmitEvent) {
		e.preventDefault();
		if (app.isOrg) app.updateOrgProfile($state.snapshot(orgForm));
		else app.updateProfile($state.snapshot(form));
		goto('/profile');
	}
</script>

<svelte:head><title>Редактировать профиль — Волна</title></svelte:head>

<a href="/profile" class="mb-4 btn btn-ghost"><ChevronLeft class="size-4" /> Профиль</a>

<form class="mx-auto max-w-2xl space-y-5" onsubmit={save}>
	<section class="overflow-hidden card">
		<!-- Постер -->
		<div class="relative h-40 sm:h-52 {toneClass[tone].bg}">
			{#if cover}<img src={cover} alt="" class="size-full object-cover" />{/if}
			<div class="absolute right-3 bottom-3 flex gap-2">
				{#if cover}
					<button type="button" class="btn bg-surface/90 py-2" onclick={() => clear('cover')}
						><Trash class="size-4" /></button
					>
				{/if}
				<label class="btn cursor-pointer bg-surface/90 py-2">
					<ImagePlus class="size-4" /> Постер
					<input type="file" accept="image/*" class="sr-only" onchange={(e) => pick(e, 'cover')} />
				</label>
			</div>
		</div>
		<div class="flex items-end gap-4 px-5 pb-5">
			<div class="relative -mt-12">
				{#if avatar}
					<img
						src={avatar}
						alt=""
						class="size-24 object-cover ring-4 ring-surface {app.isOrg
							? 'rounded-[30%]'
							: 'rounded-full'}"
					/>
				{:else}
					<Avatar id={app.actorId} size="xl" ring />
				{/if}
				<label
					class="absolute -right-1 -bottom-1 grid size-9 cursor-pointer place-items-center rounded-full bg-accent text-accent-ink shadow"
					title="Загрузить аватар"
				>
					<Camera class="size-4" />
					<input type="file" accept="image/*" class="sr-only" onchange={(e) => pick(e, 'avatar')} />
				</label>
			</div>
			{#if avatar}
				<button
					type="button"
					class="text-sm font-semibold text-muted hover:text-ink"
					onclick={() => clear('avatar')}>Убрать фото</button
				>
			{/if}
		</div>
	</section>

	<section class="space-y-4 card p-5">
		{#if app.isOrg}
			<label class="block"
				><span class="label">Название организации</span><input
					class="input"
					required
					bind:value={orgForm.name}
				/></label
			>
			<label class="block"
				><span class="label">Город</span><input
					class="input"
					required
					bind:value={orgForm.city}
				/></label
			>
			<label class="block"
				><span class="label">О нас</span><textarea
					class="min-h-24 input"
					maxlength="240"
					bind:value={orgForm.about}></textarea></label
			>
			{#if app.myOrg.verified}<p class="text-xs text-muted">
					✓ Организация проверена платформой
				</p>{/if}
		{:else}
			<label class="block"
				><span class="label">ФИО</span><input
					class="input"
					required
					bind:value={form.name}
				/></label
			>
			<div class="grid grid-cols-2 gap-3">
				<label class="block"
					><span class="label">Возраст</span><input
						class="input"
						type="number"
						min="12"
						max="25"
						required
						bind:value={form.age}
					/></label
				>
				<label class="block"
					><span class="label">Город</span><input
						class="input"
						required
						bind:value={form.city}
					/></label
				>
			</div>
			<label class="block"
				><span class="label">О себе</span><textarea
					class="min-h-20 input"
					maxlength="160"
					bind:value={form.bio}></textarea></label
			>
			<div>
				<span class="label">Цвет профиля</span>
				<div class="flex gap-2">
					{#each tones as t (t)}
						<button
							type="button"
							class="size-9 rounded-full border-2 {toneClass[t].bg} {form.tone === t
								? 'border-ink'
								: 'border-transparent'}"
							onclick={() => (form.tone = t)}
							aria-label="Цвет {t}"
						></button>
					{/each}
				</div>
			</div>
			<div>
				<span class="label">Интересы — по ним собираются сторисы «Для вас»</span>
				<div class="flex flex-wrap gap-2">
					{#each app.topics as t (t.id)}
						{@const on = form.interests.includes(t.id)}
						<button
							type="button"
							class="chip {on ? 'border-accent bg-accent-soft text-accent-text' : ''}"
							onclick={() => toggleInterest(t.id)}
							aria-pressed={on}>{t.emoji} {t.label}</button
						>
					{/each}
				</div>
			</div>
		{/if}
	</section>

	<button class="btn w-full btn-primary py-3">Сохранить</button>
</form>
