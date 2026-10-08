/**
 * Загрузка видео так, чтобы его видели все пользователи.
 *
 * Если подключён Cloudinary (бесплатное хранилище видео), ролик уходит туда: до 100 МБ,
 * Cloudinary сам сжимает его и отдаёт в формате, который играет на любом телефоне.
 * Без Cloudinary видео хранится частями в Firestore — до 25 МБ.
 * В обоих случаях функция ждёт конца загрузки: пост не появится без видео.
 */
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from '$app/env/public';
import { SHARED_LIMIT, saveBlob } from './media-db.ts';

export const cloudinaryEnabled = !!(CLOUDINARY_CLOUD_NAME && CLOUDINARY_UPLOAD_PRESET);

/** Самое большое видео, которое увидят другие */
export const MAX_VIDEO_BYTES = cloudinaryEnabled ? 100 * 1024 * 1024 : SHARED_LIMIT;
export const maxVideoMb = Math.round(MAX_VIDEO_BYTES / 1024 / 1024);

/** Где лежит загруженное видео: ссылка Cloudinary или ключ файла в Firestore */
export interface UploadedVideo {
	url?: string;
	videoId?: string;
}

function toCloudinary(file: File, onProgress: (share: number) => void) {
	return new Promise<UploadedVideo>((resolve, reject) => {
		const form = new FormData();
		form.append('file', file);
		form.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
		form.append('folder', 'volna');
		const xhr = new XMLHttpRequest();
		xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`);
		xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
		xhr.onload = () => {
			const response = JSON.parse(xhr.responseText || '{}');
			if (xhr.status < 300 && response.secure_url) resolve({ url: response.secure_url });
			else reject(new Error(response.error?.message ?? `cloudinary/${xhr.status}`));
		};
		xhr.onerror = () => reject(new Error('media/network'));
		xhr.send(form);
	});
}

export async function uploadVideo(
	file: File,
	onProgress: (share: number) => void = () => {}
): Promise<UploadedVideo> {
	if (file.size > MAX_VIDEO_BYTES) throw new Error('media/too-large');
	if (cloudinaryEnabled) return toCloudinary(file, onProgress);
	const videoId = `video-${crypto.randomUUID()}`;
	await saveBlob(videoId, file, onProgress);
	return { videoId };
}

/**
 * Ссылка для воспроизведения: Cloudinary перекодирует ролик в MP4 (H.264) с автоматическим
 * качеством — так видео с iPhone играет на Android и наоборот.
 */
export function playableUrl(url: string) {
	if (!url.includes('res.cloudinary.com')) return url;
	return url.replace('/upload/', '/upload/q_auto/').replace(/\.[a-z0-9]+$/i, '.mp4');
}
