/**
 * Хранилище больших медиафайлов: видео и оригиналов сертификатов.
 *
 * На устройстве файлы лежат в IndexedDB (браузер даёт сотни мегабайт). Чтобы их видели
 * другие пользователи, файл до SHARED_LIMIT байт ещё и выкладывается в Firestore частями
 * по PART_SIZE (документ Firestore вмещает до 1 МБ). На другом устройстве файл
 * собирается из частей при первом просмотре и кэшируется в IndexedDB.
 */
import { firebaseEnabled, firestore } from './firebase.ts';

const DB_NAME = 'volna-media';
const STORE = 'blobs';
const PART_SIZE = 900_000;
export const SHARED_LIMIT = 25 * 1024 * 1024;

/** Готовые object URL, чтобы не создавать их повторно для одного файла */
const urls = new Map<string, string>();
const downloads = new Map<string, Promise<Blob | undefined>>();

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

/** Выкладывает файл на сервер частями; метаданные пишутся последними — признак готовности */
async function upload(id: string, blob: Blob) {
	const [db, s] = await Promise.all([firestore(), import('firebase/firestore')]);
	const bytes = new Uint8Array(await blob.arrayBuffer());
	const parts = Math.ceil(bytes.length / PART_SIZE);
	for (let i = 0; i < parts; i++) {
		const chunk = bytes.subarray(i * PART_SIZE, (i + 1) * PART_SIZE);
		await s.setDoc(s.doc(db, 'files', id, 'parts', String(i)), {
			index: i,
			data: s.Bytes.fromUint8Array(chunk)
		});
	}
	await s.setDoc(s.doc(db, 'files', id), { mime: blob.type, size: blob.size, parts });
}

async function download(id: string): Promise<Blob | undefined> {
	const [db, s] = await Promise.all([firestore(), import('firebase/firestore')]);
	const meta = await s.getDoc(s.doc(db, 'files', id));
	if (!meta.exists()) return undefined;
	const { mime, parts } = meta.data() as { mime: string; parts: number };
	const snap = await s.getDocs(s.collection(db, 'files', id, 'parts'));
	const chunks = snap.docs
		.map((d) => d.data() as { index: number; data: { toUint8Array(): Uint8Array } })
		.sort((a, b) => a.index - b.index);
	if (chunks.length !== parts) return undefined;
	return new Blob(
		chunks.map((c) => c.data.toUint8Array() as Uint8Array<ArrayBuffer>),
		{ type: mime }
	);
}

/** Сохраняет файл на устройстве и (если он не слишком большой) делится им через сервер */
export async function saveBlob(id: string, blob: Blob) {
	await run('readwrite', (store) => store.put(blob, id));
	if (firebaseEnabled && blob.size <= SHARED_LIMIT) {
		upload(id, blob).catch((e) => console.warn('media: upload failed', id, e));
	}
}

/** Возвращает ссылку на файл: с устройства или, если его здесь нет, с сервера */
export async function blobUrl(id: string) {
	const cached = urls.get(id);
	if (cached) return cached;
	try {
		let blob = await run<Blob | undefined>('readonly', (store) => store.get(id));
		if (!blob && firebaseEnabled) {
			if (!downloads.has(id)) downloads.set(id, download(id));
			blob = await downloads.get(id);
			downloads.delete(id);
			if (blob) await run('readwrite', (store) => store.put(blob!, id));
		}
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
	if (!firebaseEnabled) return;
	try {
		const [db, s] = await Promise.all([firestore(), import('firebase/firestore')]);
		const parts = await s.getDocs(s.collection(db, 'files', id, 'parts'));
		await Promise.all(parts.docs.map((d) => s.deleteDoc(d.ref)));
		await s.deleteDoc(s.doc(db, 'files', id));
	} catch {
		// файл мог и не попасть на сервер — тогда удалять там нечего
	}
}
