<script lang="ts">
	import { tr } from '#lib/i18n.ts';
	import { app } from '#lib/app.svelte.ts';
	import { checkinPayload } from '#lib/checkin.ts';
	import QrCode from './QrCode.svelte';

	/** Код обновляется каждые 30 секунд — скриншот быстро устаревает */
	let value = $state(checkinPayload(app.me));
	$effect(() => {
		value = checkinPayload(app.me);
		const timer = setInterval(() => (value = checkinPayload(app.me)), 30_000);
		return () => clearInterval(timer);
	});
</script>

<section class="flex flex-col items-center gap-3 card p-5 text-center sm:flex-row sm:text-left">
	<div class="w-44 shrink-0 rounded-2xl bg-white p-2 shadow-sm">
		<QrCode {value} class="size-full" />
	</div>
	<div>
		<h2 class="text-lg font-extrabold">{tr('Мой QR-код')}</h2>
		<p class="mt-1 text-sm text-muted">
			{tr(
				'Покажите его куратору на мероприятии: он отсканирует код в кабинете организации, и часы сразу попадут в портфолио.'
			)}
		</p>
		<p class="mt-2 text-xs text-muted">
			{tr('Код обновляется каждые 30 секунд, поэтому скриншот не подойдёт.')}
		</p>
	</div>
</section>
