/** Документы крупнее этого размера не сохраняем в браузере, а показываем до перезагрузки */
export const MAX_FILE_BYTES = 1_500_000;

/**
 * Уменьшает картинку до заданной стороны и пережимает в JPEG.
 * Аватары, постеры и фото хранятся в localStorage, поэтому важен размер.
 */
export async function compressImage(file: File, maxSide = 1080, quality = 0.8): Promise<string> {
	const url = URL.createObjectURL(file);
	try {
		const image = await new Promise<HTMLImageElement>((resolve, reject) => {
			const img = new Image();
			img.onload = () => resolve(img);
			img.onerror = reject;
			img.src = url;
		});
		const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
		const canvas = document.createElement('canvas');
		canvas.width = Math.round(image.width * scale);
		canvas.height = Math.round(image.height * scale);
		canvas.getContext('2d')!.drawImage(image, 0, 0, canvas.width, canvas.height);
		return canvas.toDataURL('image/jpeg', quality);
	} finally {
		URL.revokeObjectURL(url);
	}
}

export function readDataUrl(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(String(reader.result));
		reader.onerror = reject;
		reader.readAsDataURL(file);
	});
}

/** Берёт выбранный файл из input и сразу очищает его, чтобы можно было выбрать тот же файл снова */
export function takeFile(event: Event) {
	const input = event.currentTarget as HTMLInputElement;
	const file = input.files?.[0];
	input.value = '';
	return file;
}

/** Определяет, вертикальное ли видео (короткий формат) */
export function isVerticalVideo(src: string): Promise<boolean> {
	return new Promise((resolve) => {
		const video = document.createElement('video');
		video.preload = 'metadata';
		video.onloadedmetadata = () => resolve(video.videoHeight > video.videoWidth);
		video.onerror = () => resolve(true);
		video.src = src;
	});
}

export const isImage = (src?: string) => !!src && src.startsWith('data:image');
export const isPdf = (src?: string) => !!src && src.startsWith('data:application/pdf');
