/**
 * Хранилище больших медиафайлов (видео) в IndexedDB.
 * В localStorage видео не помещаются, а здесь браузер даёт сотни мегабайт.
 */
const DB_NAME = 'volna-media';
const STORE = 'blobs';

/** Готовые object URL, чтобы не создавать их повторно для одного файла */
const urls = new Map<string, string>();

function open(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, 1);
		request.onupgradeneeded = () => request.result.createObjectStore(STORE);
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
}

async function run<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>) {
	const db = await open();
	return new Promise<T>((resolve, reject) => {
		const request = action(db.transaction(STORE, mode).objectStore(STORE));
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
}

export async function saveBlob(id: string, blob: Blob) {
	await run('readwrite', (store) => store.put(blob, id));
}

/** Возвращает ссылку на сохранённый файл или undefined, если его нет на этом устройстве */
export async function blobUrl(id: string) {
	const cached = urls.get(id);
	if (cached) return cached;
	try {
		const blob = await run<Blob | undefined>('readonly', (store) => store.get(id));
		if (!blob) return undefined;
		const url = URL.createObjectURL(blob);
		urls.set(id, url);
		return url;
	} catch {
		return undefined;
	}
}

export async function deleteBlob(id: string) {
	const url = urls.get(id);
	if (url) URL.revokeObjectURL(url);
	urls.delete(id);
	await run('readwrite', (store) => store.delete(id));
}
