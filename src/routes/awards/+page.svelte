<script lang="ts">
	import { tr } from '#lib/i18n.ts';
	import { Check, Plus, Upload } from '@lucide/svelte';
	import { app } from '#lib/app.svelte.ts';
	import AwardItem from '#lib/components/AwardItem.svelte';
	import AwardShelves from '#lib/components/AwardShelves.svelte';
	import Avatar from '#lib/components/Avatar.svelte';
	import Modal from '#lib/components/Modal.svelte';
	import { awardTiers, awardTypes } from '#lib/data.ts';
	import { MAX_FILE_BYTES, compressImage, readDataUrl, takeFile } from '#lib/files.ts';
	import type { Award, AwardTier, AwardType } from '#lib/types.ts';

	const awards = $derived(app.isOrg ? app.issuedAwards : app.myAwards);

	// Загрузка своего сертификата волонтёром
	let upload = $state({
		open: false,
		title: '',
		description: '',
		fileName: '',
		src: undefined as string | undefined
	});

	async function chooseFile(e: Event) {
		const file = takeFile(e);
		if (!file) return;
		const src = file.type.startsWith('image/')
			? await compressImage(file, 1400, 0.85)
			: file.size <= MAX_FILE_BYTES
				? await readDataUrl(file)
				: undefined;
		if (!src) app.notify(tr('Файл больше 1,5 МБ: сохраним только название'));
		upload = {
			open: true,
			title: file.name.replace(/\.[^.]+$/, ''),
			description: '',
			fileName: file.name,
			src
		};
	}

	function saveUpload(e: SubmitEvent) {
		e.preventDefault();
		app.uploadCertificate({
			title: upload.title.trim(),
			description: upload.description.trim() || tr('Загружено волонтёром'),
			fileName: upload.fileName,
			src: upload.src
		});
		upload.open = false;
	}

	// Создание и вручение награды организацией
	let creating = $state(false);
	let draft = $state<{
		type: AwardType;
		tier: AwardTier;
		title: string;
		description: string;
		opportunityId: string;
	}>({
		type: 'medal',
		tier: 'gold',
		title: '',
		description: '',
		opportunityId: ''
	});
	let recipients = $state<string[]>([]);

	const candidates = $derived(
		draft.opportunityId
			? app.participants(draft.opportunityId).map((a) => a.personId)
			: app.orgVolunteers.map((v) => v.personId)
	);
	const preview = $derived<Award>({ id: 'preview', personId: '', date: '', ...draft });

	function toggleRecipient(id: string) {
		recipients = recipients.includes(id) ? recipients.filter((r) => r !== id) : [...recipients, id];
	}

	function grant(e: SubmitEvent) {
		e.preventDefault();
		if (!recipients.length || !draft.title.trim()) return;
		app.grantAward(
			{
				...draft,
				title: draft.title.trim(),
				description: draft.description.trim(),
				opportunityId: draft.opportunityId || undefined
			},
			recipients
		);
		creating = false;
		recipients = [];
		draft = { type: 'medal', tier: 'gold', title: '', description: '', opportunityId: '' };
	}
</script>

<svelte:head><title>{tr('Кабинет наград — Волна')}</title></svelte:head>

<div class="mb-5 flex flex-wrap items-center justify-between gap-3">
	<div>
		<h1 class="text-2xl font-extrabold tracking-tight sm:text-3xl">{tr('Кабинет наград')}</h1>
		<p class="text-sm text-muted">
			{app.isOrg
				? tr('Награды, которые ваша организация вручила волонтёрам')
				: tr('Медали, кубки и сертификаты за добрые дела')}
		</p>
	</div>
	{#if app.isOrg}
		<button class="btn btn-primary" onclick={() => (creating = true)}
			><Plus class="size-4" /> {tr('Создать награду')}</button
		>
	{:else}
		<label class="btn cursor-pointer btn-soft">
			<Upload class="size-4" />
			{tr('Загрузить сертификат')}
			<input type="file" accept="image/*,application/pdf" class="sr-only" onchange={chooseFile} />
		</label>
	{/if}
</div>

<div class="mb-6 grid grid-cols-3 gap-3">
	{#each Object.entries(awardTypes) as [type, info] (type)}
		<div class="flex flex-col items-center card p-4 text-center">
			<span class="text-3xl">{info.emoji}</span>
			<span class="mt-1 text-2xl font-extrabold"
				>{awards.filter((a) => a.type === type).length}</span
			>
			<span class="text-xs text-muted">{info.plural}</span>
		</div>
	{/each}
</div>

<AwardShelves {awards} showRecipient={app.isOrg} removable={!app.isOrg} />

<Modal bind:open={upload.open} title={tr('Новый сертификат')}>
	<form class="space-y-4" onsubmit={saveUpload}>
		{#if upload.src?.startsWith('data:image')}
			<img src={upload.src} alt="" class="max-h-48 w-full rounded-2xl object-contain" />
		{/if}
		<p class="text-sm text-muted">{tr('Файл: {0}', upload.fileName)}</p>
		<label class="block"
			><span class="label">{tr('Название')}</span><input
				class="input"
				required
				bind:value={upload.title}
			/></label
		>
		<label class="block"
			><span class="label">{tr('За что и кто выдал')}</span><input
				class="input"
				placeholder={tr('Например: Фонд «Тёплые руки», за помощь пожилым')}
				bind:value={upload.description}
			/></label
		>
		<button class="btn w-full btn-primary">{tr('Поставить на полку')}</button>
	</form>
</Modal>

<Modal bind:open={creating} title={tr('Создать награду')} wide>
	<form class="grid gap-5 sm:grid-cols-[180px_1fr]" onsubmit={grant}>
		<div class="flex flex-col items-center gap-2 rounded-3xl bg-surface-2 p-4">
			<AwardItem award={preview} />
			<span class="text-center text-sm font-bold">{draft.title || tr('Название')}</span>
			<span class="text-xs text-muted"
				>{awardTypes[draft.type].label} · {awardTiers[draft.tier].label}</span
			>
		</div>
		<div class="space-y-4">
			<div>
				<span class="label">{tr('Тип')}</span>
				<div class="flex flex-wrap gap-2">
					{#each Object.entries(awardTypes) as [type, info] (type)}
						<button
							type="button"
							class="chip {draft.type === type
								? 'border-accent bg-accent-soft text-accent-text'
								: ''}"
							onclick={() => (draft.type = type as AwardType)}>{info.emoji} {info.label}</button
						>
					{/each}
				</div>
			</div>
			<div>
				<span class="label">{tr('Уровень')}</span>
				<div class="flex gap-2">
					{#each Object.entries(awardTiers) as [tier, info] (tier)}
						<button
							type="button"
							class="chip {draft.tier === tier
								? 'border-accent bg-accent-soft text-accent-text'
								: ''}"
							onclick={() => (draft.tier = tier as AwardTier)}
						>
							<span class="size-3 rounded-full" style="background: {info.color}"></span>{info.label}
						</button>
					{/each}
				</div>
			</div>
			<label class="block"
				><span class="label">{tr('Название')}</span><input
					class="input"
					required
					placeholder={tr('Например: Герой субботника')}
					bind:value={draft.title}
				/></label
			>
			<label class="block"
				><span class="label">{tr('За что')}</span><textarea
					class="min-h-16 input"
					placeholder={tr('Короткое описание заслуги')}
					bind:value={draft.description}></textarea></label
			>
			<label class="block">
				<span class="label">{tr('Мероприятие')}</span>
				<select class="input" bind:value={draft.opportunityId} onchange={() => (recipients = [])}>
					<option value="">{tr('Все волонтёры организации')}</option>
					{#each app.orgOpportunities as o (o.id)}
						<option value={o.id}>{o.emoji} {o.title}</option>
					{/each}
				</select>
			</label>
			<div>
				<div class="mb-1.5 flex items-center justify-between">
					<span class="label mb-0">{tr('Кого наградить · {0}', recipients.length)}</span>
					{#if candidates.length}
						<button
							type="button"
							class="text-xs font-semibold text-accent-text"
							onclick={() =>
								(recipients = recipients.length === candidates.length ? [] : [...candidates])}
						>
							{recipients.length === candidates.length ? tr('Снять всех') : tr('Выбрать всех')}
						</button>
					{/if}
				</div>
				<ul class="max-h-48 space-y-1 overflow-y-auto">
					{#each candidates as id (id)}
						{@const on = recipients.includes(id)}
						<li>
							<button
								type="button"
								class="flex w-full items-center gap-3 rounded-2xl p-2 text-left transition {on
									? 'bg-accent-soft'
									: 'hover:bg-surface-2'}"
								onclick={() => toggleRecipient(id)}
							>
								<Avatar {id} size="sm" />
								<span class="flex-1 text-sm font-semibold">{app.author(id).name}</span>
								<span
									class="grid size-6 place-items-center rounded-full border-2 {on
										? 'border-accent bg-accent text-accent-ink'
										: 'border-line'}"
									>{#if on}<Check class="size-3.5" />{/if}</span
								>
							</button>
						</li>
					{:else}
						<li class="text-sm text-muted">
							{tr('У мероприятия пока нет подтверждённых участников.')}
						</li>
					{/each}
				</ul>
			</div>
			<button
				class="btn w-full btn-primary py-3"
				disabled={!recipients.length || !draft.title.trim()}>{tr('Вручить награду')}</button
			>
		</div>
	</form>
</Modal>
