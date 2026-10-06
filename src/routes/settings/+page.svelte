<script lang="ts">
	import { goto } from '$app/navigation';
	import { Check, LogOut, Moon, Palette, RotateCcw, Sun } from '@lucide/svelte';
	import { app } from '#lib/app.svelte.ts';
	import Avatar from '#lib/components/Avatar.svelte';
	import { ME, accents, interests, toneClass } from '#lib/data.ts';
	import type { Accent, Interest, Tone } from '#lib/types.ts';

	let form = $state($state.snapshot(app.profile));

	const tones: Tone[] = ['blue', 'yellow', 'green', 'lilac', 'peach'];

	function toggleInterest(i: Interest) {
		form.interests = form.interests.includes(i)
			? form.interests.filter((x) => x !== i)
			: [...form.interests, i];
	}

	function save(e: SubmitEvent) {
		e.preventDefault();
		app.updateProfile($state.snapshot(form));
	}

	function resetDemo() {
		app.resetDemo();
		form = $state.snapshot(app.profile);
	}

	function logout() {
		app.logout();
		goto('/login', { replaceState: true });
	}
</script>

<svelte:head><title>Настройки — Волна</title></svelte:head>

<h1 class="mb-5 text-2xl font-extrabold tracking-tight sm:text-3xl">Настройки</h1>

<div class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)]">
	<form class="space-y-5 card p-5 sm:p-6" onsubmit={save}>
		<h2 class="text-lg font-bold">Профиль</h2>
		<div class="flex items-center gap-4">
			<Avatar id={ME} size="lg" />
			<div>
				<span class="label">Цвет аватара</span>
				<div class="flex gap-2">
					{#each tones as t (t)}
						<button
							type="button"
							class="size-8 rounded-full border-2 {toneClass[t].bg} {form.tone === t
								? 'border-ink'
								: 'border-transparent'}"
							onclick={() => (form.tone = t)}
							aria-label="Цвет аватара {t}"
						></button>
					{/each}
				</div>
			</div>
		</div>
		<div class="grid gap-4 sm:grid-cols-[2fr_1fr]">
			<label class="block"
				><span class="label">Имя и фамилия</span><input
					class="input"
					required
					bind:value={form.name}
				/></label
			>
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
		</div>
		<label class="block"
			><span class="label">Город</span><input
				class="input"
				required
				bind:value={form.city}
			/></label
		>
		<label class="block"
			><span class="label">О себе</span><textarea
				class="min-h-20 input"
				maxlength="160"
				bind:value={form.bio}></textarea></label
		>
		<div>
			<span class="label">Интересы — по ним подбираем рекомендации</span>
			<div class="flex flex-wrap gap-2">
				{#each Object.entries(interests) as [id, i] (id)}
					{@const on = form.interests.includes(id as Interest)}
					<button
						type="button"
						class="chip {on ? 'border-accent bg-accent-soft text-accent-text' : ''}"
						onclick={() => toggleInterest(id as Interest)}
						aria-pressed={on}
					>
						{i.emoji}
						{i.label}
					</button>
				{/each}
			</div>
		</div>
		<button class="btn w-full btn-primary sm:w-auto">Сохранить профиль</button>
	</form>

	<div class="space-y-5">
		<section class="card p-5 sm:p-6">
			<h2 class="flex items-center gap-2 text-lg font-bold">
				<Palette class="size-5 text-accent-text" /> Оформление
			</h2>
			<p class="mt-1 text-sm text-muted">
				Выберите свой акцентный цвет — он применится ко всему приложению.
			</p>
			<div class="mt-4 grid grid-cols-5 gap-2">
				{#each Object.entries(accents) as [id, a] (id)}
					<button
						class="grid aspect-square place-items-center rounded-2xl border-2 transition {app.accent ===
						id
							? 'border-ink'
							: 'border-transparent'}"
						style="background: {a.color}"
						onclick={() => app.setAccent(id as Accent)}
						aria-label={a.label}
						aria-pressed={app.accent === id}
						title={a.label}
					>
						{#if app.accent === id}<Check class="size-5 text-[#1f2633]" />{/if}
					</button>
				{/each}
			</div>
			<p class="mt-2 text-sm font-semibold">{accents[app.accent].label}</p>

			<span class="mt-5 label">Тема</span>
			<div class="grid grid-cols-2 rounded-2xl bg-surface-2 p-1 text-sm font-semibold">
				<button
					class="flex items-center justify-center gap-2 rounded-xl py-2.5 {app.mode === 'light'
						? 'bg-surface shadow-sm'
						: 'text-muted'}"
					onclick={() => app.setMode('light')}
				>
					<Sun class="size-4" /> Светлая
				</button>
				<button
					class="flex items-center justify-center gap-2 rounded-xl py-2.5 {app.mode === 'dark'
						? 'bg-surface shadow-sm'
						: 'text-muted'}"
					onclick={() => app.setMode('dark')}
				>
					<Moon class="size-4" /> Тёмная
				</button>
			</div>
		</section>

		<section class="card p-5 sm:p-6">
			<h2 class="text-lg font-bold">Аккаунт</h2>
			<p class="mt-1 text-sm text-muted">
				Вход {app.session?.method === 'phone' ? 'по телефону' : 'по email'}:
				<b class="text-ink">{app.session?.contact}</b>
			</p>
			<div class="mt-4 flex flex-col gap-2">
				<button class="btn btn-ghost" onclick={resetDemo}
					><RotateCcw class="size-4" /> Восстановить демо-данные</button
				>
				<button class="btn btn-ghost text-pastel-peach-ink" onclick={logout}
					><LogOut class="size-4" /> Выйти</button
				>
			</div>
		</section>
	</div>
</div>
