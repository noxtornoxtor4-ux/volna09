<script lang="ts">
	import { tr } from '#lib/i18n.ts';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { Link, Mic, MicOff, MonitorUp, PhoneOff, Users, Video, VideoOff } from '@lucide/svelte';
	import { app } from '#lib/app.svelte.ts';
	import Avatar from '#lib/components/Avatar.svelte';
	import { firebaseEnabled } from '#lib/firebase.ts';
	import { plural } from '#lib/format.ts';
	import { Call, MAX_PEOPLE, canShareScreen, newRoom, roomCode } from '#lib/call.svelte.ts';

	const room = $derived(roomCode(page.url.searchParams.get('room') ?? ''));

	let call = $state<Call | null>(null);
	let code = $state('');
	let joining = $state(false);

	// Своя комната — свой звонок; уходя со страницы, выходим из звонка и выключаем камеру
	$effect(() => {
		if (!room) return;
		const current = new Call(room);
		call = current;
		current.preview();
		return () => {
			current.leave();
			call = null;
		};
	});

	const me = $derived(app.author(app.actorId));

	async function join() {
		if (!call || !app.uid) return;
		joining = true;
		try {
			await call.join({ uid: app.uid, actorId: app.actorId, name: me.name });
		} catch (error) {
			console.warn('call: join', error);
			app.notify(tr('Не получилось подключиться к звонку'));
		} finally {
			joining = false;
		}
	}

	function leave() {
		call?.leave();
		if (history.length > 1) history.back();
		else goto('/call', { replace: true });
	}

	async function copyLink() {
		const link = `${location.origin}/call?room=${room}`;
		try {
			await navigator.clipboard.writeText(link);
			app.notify(tr('Ссылка на звонок скопирована'));
		} catch {
			prompt(tr('Ссылка на звонок'), link);
		}
	}

	function openCode(e: SubmitEvent) {
		e.preventDefault();
		const value = roomCode(code);
		if (value) goto(`/call?room=${value}`);
	}

	/** Видео в плитке: поток подставляется и меняется без пересоздания элемента */
	const media = (stream: MediaStream | null) => (node: HTMLVideoElement) => {
		if (node.srcObject !== stream) node.srcObject = stream;
	};

	const tiles = $derived(1 + (call?.participants.length ?? 0));
	const grid = $derived(
		tiles === 1
			? 'grid-cols-1'
			: tiles === 2
				? 'grid-cols-1 sm:grid-cols-2'
				: tiles <= 4
					? 'grid-cols-2'
					: 'grid-cols-2 lg:grid-cols-3'
	);
	const mediaHint = $derived(
		call?.mediaError === 'NotAllowedError'
			? tr('Доступ к камере и микрофону запрещён — разрешите его в настройках браузера.')
			: call?.mediaError
				? tr('Камера и микрофон не найдены — можно смотреть и слушать других.')
				: ''
	);
</script>

<svelte:head><title>{tr('Видеозвонок — Волна')}</title></svelte:head>

{#snippet controls(c: Call)}
	<button
		class="btn size-12 rounded-full p-0 {c.mic ? 'bg-white/15 text-white' : 'bg-white text-black'}"
		onclick={() => c.toggleMic()}
		disabled={!c.hasAudio}
		aria-label={c.mic ? tr('Выключить микрофон') : tr('Включить микрофон')}
		aria-pressed={!c.mic}
	>
		{#if c.mic}<Mic class="size-5" />{:else}<MicOff class="size-5" />{/if}
	</button>
	<button
		class="btn size-12 rounded-full p-0 {c.cam ? 'bg-white/15 text-white' : 'bg-white text-black'}"
		onclick={() => c.toggleCam()}
		disabled={!c.hasVideo}
		aria-label={c.cam ? tr('Выключить камеру') : tr('Включить камеру')}
		aria-pressed={!c.cam}
	>
		{#if c.cam}<Video class="size-5" />{:else}<VideoOff class="size-5" />{/if}
	</button>
{/snippet}

{#if !room}
	<!-- Без комнаты: начать новую встречу или войти по коду -->
	<div class="mx-auto max-w-lg card p-6 sm:p-8">
		<div
			class="grid size-14 place-items-center rounded-3xl bg-accent-soft text-accent-text"
			aria-hidden="true"
		>
			<Video class="size-7" />
		</div>
		<h1 class="mt-4 text-2xl font-extrabold tracking-tight">{tr('Видеозвонки')}</h1>
		<p class="mt-1 text-sm text-muted">
			{tr(
				'Встречи с камерой, микрофоном и демонстрацией экрана прямо на сайте — до {0} человек. Позвонить можно и из любого чата.',
				MAX_PEOPLE
			)}
		</p>
		<button class="mt-5 btn w-full btn-primary py-3" onclick={() => goto(`/call?room=${newRoom()}`)}
			><Video class="size-5" /> {tr('Начать встречу')}</button
		>
		<form class="mt-3 flex gap-2" onsubmit={openCode}>
			<input class="input" placeholder={tr('Код или ссылка встречи')} bind:value={code} />
			<button class="btn border border-line btn-ghost px-4" disabled={!roomCode(code)}
				>{tr('Войти')}</button
			>
		</form>
	</div>
{:else if call && !call.joined}
	<!-- Перед входом: проверить камеру и микрофон -->
	<div class="mx-auto max-w-2xl card p-4 sm:p-6">
		<h1 class="text-xl font-extrabold tracking-tight">{tr('Видеозвонок')}</h1>
		<div class="relative mt-4 aspect-video overflow-hidden rounded-3xl bg-neutral-900">
			{#if call.local && call.cam}
				<video
					class="size-full -scale-x-100 object-cover"
					autoplay
					playsinline
					muted
					{@attach media(call.local)}
				></video>
			{:else}
				<div class="grid size-full place-items-center"><Avatar id={app.actorId} size="lg" /></div>
			{/if}
			<div class="absolute inset-x-0 bottom-3 flex justify-center gap-3">
				{@render controls(call)}
			</div>
		</div>
		{#if mediaHint}<p class="mt-3 rounded-2xl bg-pastel-yellow p-3 text-sm text-pastel-yellow-ink">
				{mediaHint}
			</p>{/if}
		{#if call.full}
			<p class="mt-3 rounded-2xl bg-pastel-peach p-3 text-sm text-pastel-peach-ink">
				{tr('В звонке уже {0} человек — это максимум.', MAX_PEOPLE)}
			</p>
		{/if}
		{#if !firebaseEnabled}
			<p class="mt-3 rounded-2xl bg-pastel-yellow p-3 text-sm text-pastel-yellow-ink">
				{tr('В демо-версии можно проверить камеру, а сами звонки работают на настоящем сайте.')}
			</p>
		{/if}
		<div class="mt-4 flex flex-wrap gap-2">
			<button
				class="btn flex-1 btn-primary py-3"
				onclick={join}
				disabled={!call.ready || joining || call.full || !firebaseEnabled}
			>
				{joining ? tr('Подключаемся…') : tr('Присоединиться')}
			</button>
			<button class="btn border border-line btn-ghost px-4" onclick={copyLink}
				><Link class="size-4" /> {tr('Пригласить')}</button
			>
		</div>
	</div>
{:else if call}
	<!-- Сам звонок: на весь экран поверх меню -->
	<div class="fixed inset-0 z-[60] flex flex-col bg-neutral-950 text-white">
		<header class="flex items-center gap-3 px-4 pt-[max(env(safe-area-inset-top),1rem)] pb-2">
			<Users class="size-5 opacity-70" />
			<span class="flex-1 text-sm font-semibold">
				{tiles}
				{plural(tiles, 'участник', 'участника', 'участников')}
			</span>
			<button class="btn rounded-full bg-white/15 px-3 py-2 text-sm text-white" onclick={copyLink}
				><Link class="size-4" /> {tr('Пригласить')}</button
			>
		</header>

		<div class="grid min-h-0 flex-1 auto-rows-fr gap-2 overflow-y-auto p-2 {grid}">
			<!-- Своя плитка -->
			<div class="relative min-h-40 overflow-hidden rounded-3xl bg-neutral-800">
				{#if call.screen}
					<video
						class="size-full object-contain"
						autoplay
						playsinline
						muted
						{@attach media(call.screen)}
					></video>
				{:else if call.local && call.cam}
					<video
						class="size-full -scale-x-100 object-cover"
						autoplay
						playsinline
						muted
						{@attach media(call.local)}
					></video>
				{:else}
					<div class="grid size-full place-items-center">
						<Avatar id={app.actorId} size="lg" />
					</div>
				{/if}
				<span
					class="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-1 text-xs font-semibold"
				>
					{#if !call.mic}<MicOff class="size-3.5" />{/if}
					{tr('Вы')}{call.screen ? ` · ${tr('экран')}` : ''}
				</span>
			</div>

			{#each call.participants as p (p.id)}
				<div class="relative min-h-40 overflow-hidden rounded-3xl bg-neutral-800">
					<!-- Видео остаётся на месте и при выключенной камере: через него идёт звук -->
					<video
						class="size-full {p.screen ? 'object-contain' : 'object-cover'} {p.cam || p.screen
							? ''
							: 'opacity-0'}"
						autoplay
						playsinline
						{@attach media(p.stream)}
					></video>
					{#if !p.cam && !p.screen}
						<div class="absolute inset-0 grid place-items-center">
							<Avatar id={p.actorId} size="lg" />
						</div>
					{/if}
					{#if !p.connected}
						<span
							class="absolute top-2 right-2 rounded-full bg-black/50 px-2.5 py-1 text-xs font-semibold"
							>{tr('Подключение…')}</span
						>
					{/if}
					<span
						class="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-1 text-xs font-semibold"
					>
						{#if !p.mic}<MicOff class="size-3.5" />{/if}
						{p.name}{p.screen ? ` · ${tr('экран')}` : ''}
					</span>
				</div>
			{/each}
		</div>

		{#if !call.participants.length}
			<p class="px-4 pb-1 text-center text-sm opacity-70">
				{tr('Пока здесь только вы — отправьте ссылку, чтобы пригласить остальных.')}
			</p>
		{/if}

		<nav
			class="flex items-center justify-center gap-3 px-4 pt-2 pb-[max(env(safe-area-inset-bottom),1rem)]"
		>
			{@render controls(call)}
			{#if canShareScreen()}
				<button
					class="btn size-12 rounded-full p-0 {call.screen
						? 'bg-white text-black'
						: 'bg-white/15 text-white'}"
					onclick={() => call?.toggleScreen()}
					aria-label={call.screen ? tr('Остановить показ экрана') : tr('Показать экран')}
					aria-pressed={!!call.screen}><MonitorUp class="size-5" /></button
				>
			{/if}
			<button
				class="btn size-12 rounded-full bg-red-600 p-0 text-white hover:bg-red-700"
				onclick={leave}
				aria-label={tr('Выйти из звонка')}><PhoneOff class="size-5" /></button
			>
		</nav>
	</div>
{/if}
