<script lang="ts">
	import { app } from '#lib/app.svelte.ts';
	import { day } from '#lib/data.ts';

	let { date = day(0), ondone }: { date?: string; ondone: () => void } = $props();

	// Форма открывается заново на каждый день, поэтому начальная дата берётся один раз
	// svelte-ignore state_referenced_locally
	let form = $state({
		orgId: app.allOrgs[0].id,
		opportunityId: '',
		title: '',
		date,
		hours: 2,
		note: ''
	});

	const events = $derived(
		app.opportunities.filter((o) => o.orgId === form.orgId && o.date <= day(0))
	);

	function pickEvent() {
		const o = app.opportunity(form.opportunityId);
		if (!o) return;
		form.title = o.title;
		form.date = o.date;
		form.hours = o.hours;
	}

	function submit(e: SubmitEvent) {
		e.preventDefault();
		app.logHours({
			orgId: form.orgId,
			opportunityId: form.opportunityId || undefined,
			title: form.title.trim(),
			date: form.date,
			hours: form.hours,
			note: form.note.trim()
		});
		ondone();
	}
</script>

<form class="space-y-4" onsubmit={submit}>
	<label class="block">
		<span class="label">Организация</span>
		<select class="input" bind:value={form.orgId} onchange={() => (form.opportunityId = '')}>
			{#each app.allOrgs as org (org.id)}
				<option value={org.id}>{org.emoji} {org.name}</option>
			{/each}
		</select>
	</label>
	{#if events.length}
		<label class="block">
			<span class="label">Мероприятие (необязательно)</span>
			<select class="input" bind:value={form.opportunityId} onchange={pickEvent}>
				<option value="">Другое / регулярная помощь</option>
				{#each events as o (o.id)}
					<option value={o.id}>{o.emoji} {o.title}</option>
				{/each}
			</select>
		</label>
	{/if}
	<label class="block">
		<span class="label">Что делали</span>
		<input class="input" required placeholder="Например: выгул собак" bind:value={form.title} />
	</label>
	<div class="grid grid-cols-2 gap-3">
		<label class="block">
			<span class="label">Дата</span>
			<input class="input" type="date" required max={day(0)} bind:value={form.date} />
		</label>
		<label class="block">
			<span class="label">Часов</span>
			<input class="input" type="number" required min="1" max="12" bind:value={form.hours} />
		</label>
	</div>
	<label class="block">
		<span class="label">Комментарий для куратора</span>
		<textarea
			class="min-h-20 input"
			placeholder="Кто может подтвердить, что вы делали"
			bind:value={form.note}></textarea>
	</label>
	<p class="rounded-2xl bg-pastel-yellow p-3 text-sm text-pastel-yellow-ink">
		Часы попадут в портфолио после подтверждения куратором организации.
	</p>
	<button class="btn w-full btn-primary">Отправить на подтверждение</button>
</form>
