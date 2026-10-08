<script lang="ts">
	import { tr } from '#lib/i18n.ts';
	import { onDestroy, onMount } from 'svelte';
	import jsQR from 'jsqr';

	/** Сканер QR-кодов камерой телефона или ноутбука; работает во всех браузерах */
	let { onresult }: { onresult: (text: string) => void } = $props();

	let video = $state<HTMLVideoElement>();
	let problem = $state('');
	let stream: MediaStream | undefined;
	let frame = 0;
	const canvas = document.createElement('canvas');
	const context = canvas.getContext('2d', { willReadFrequently: true })!;

	function scan() {
		if (video && video.readyState === video.HAVE_ENOUGH_DATA) {
			canvas.width = video.videoWidth;
			canvas.height = video.videoHeight;
			context.drawImage(video, 0, 0);
			const image = context.getImageData(0, 0, canvas.width, canvas.height);
			const code = jsQR(image.data, image.width, image.height, { inversionAttempts: 'dontInvert' });
			if (code?.data) {
				onresult(code.data);
				return;
			}
		}
		frame = requestAnimationFrame(scan);
	}

	onMount(async () => {
		try {
			stream = await navigator.mediaDevices.getUserMedia({
				video: { facingMode: 'environment' },
				audio: false
			});
			if (!video) return;
			video.srcObject = stream;
			await video.play();
			frame = requestAnimationFrame(scan);
		} catch {
			problem = tr(
				'Нет доступа к камере. Разрешите камеру в настройках браузера или введите ID вручную.'
			);
		}
	});

	onDestroy(() => {
		cancelAnimationFrame(frame);
		stream?.getTracks().forEach((t) => t.stop());
	});
</script>

<div class="relative aspect-square w-full overflow-hidden rounded-3xl bg-black">
	<video bind:this={video} playsinline muted class="size-full object-cover"></video>
	<!-- Рамка-прицел -->
	<div class="pointer-events-none absolute inset-[18%] rounded-3xl border-4 border-white/80"></div>
	{#if problem}
		<p
			class="absolute inset-x-4 bottom-4 rounded-2xl bg-black/70 p-3 text-center text-sm text-white"
		>
			{problem}
		</p>
	{/if}
</div>
