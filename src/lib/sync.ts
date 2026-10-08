/**
 * Синхронизация коллекций приложения с Firestore.
 *
 * Хранилище держит обычные массивы. После каждого изменения `push` сравнивает их
 * с последним известным состоянием сервера и отправляет только разницу:
 * новые документы, изменённые поля и удаления. Добавление в массивы (сообщения,
 * комментарии, лайки) уходит через arrayUnion, поэтому одновременные правки
 * разных пользователей не затирают друг друга. `listen` получает изменения
 * с сервера (и из офлайн-кэша) и отдаёт свежий список документов.
 */
import type { FieldPath, Firestore, QueryConstraint } from 'firebase/firestore';
import { demoMode, firestore } from './firebase.ts';

export interface Doc {
	id: string;
}

type Sdk = typeof import('firebase/firestore');
let sdkPromise: Promise<Sdk> | undefined;
const sdk = () => (sdkPromise ??= import('firebase/firestore'));

/** Последнее известное серверу состояние документов: коллекция → id → JSON */
export type Remote = Map<string, string>;

/** Firestore не хранит undefined — убираем такие поля, порядок ключей делаем стабильным */
function clean(value: unknown): unknown {
	if (Array.isArray(value)) return value.map(clean);
	if (value && typeof value === 'object') {
		return Object.fromEntries(
			Object.keys(value)
				.sort()
				.filter((k) => (value as Record<string, unknown>)[k] !== undefined)
				.map((k) => [k, clean((value as Record<string, unknown>)[k])])
		);
	}
	return value;
}

const json = (value: unknown) => JSON.stringify(clean(value));
const isObject = (v: unknown): v is Record<string, unknown> =>
	!!v && typeof v === 'object' && !Array.isArray(v);

/** Разница двух версий документа в виде пар «поле → значение» для updateDoc */
function diff(
	s: Sdk,
	prev: Record<string, unknown>,
	next: Record<string, unknown>,
	path: string[] = []
): [FieldPath, unknown][] {
	const out: [FieldPath, unknown][] = [];
	for (const key of new Set([...Object.keys(prev), ...Object.keys(next)])) {
		if (key === 'id' && !path.length) continue;
		const a = prev[key];
		const b = next[key];
		if (json(a) === json(b)) continue;
		const field = new s.FieldPath(...path, key);
		if (b === undefined) {
			out.push([field, s.deleteField()]);
		} else if (Array.isArray(a) && Array.isArray(b)) {
			const aj = a.map(json);
			const bj = b.map(json);
			const added = b.filter((_, i) => !aj.includes(bj[i]));
			const removed = a.filter((_, i) => !bj.includes(aj[i]));
			if (added.length && !removed.length) out.push([field, s.arrayUnion(...added.map(clean))]);
			else if (removed.length && !added.length)
				out.push([field, s.arrayRemove(...removed.map(clean))]);
			else out.push([field, clean(b)]);
		} else if (isObject(a) && isObject(b) && path.length < 1) {
			// Вложенные объекты (lastRead, privacy) обновляем по полям
			out.push(...diff(s, a, b, [...path, key]));
		} else {
			out.push([field, clean(b)]);
		}
	}
	return out;
}

/** Отправляет на сервер изменения коллекции относительно remote и обновляет remote */
export async function push(name: string, items: Doc[], remote: Remote) {
	const [db, s] = await Promise.all([firestore(), sdk()]);
	const seen = new Set<string>();
	for (const item of items) {
		seen.add(item.id);
		const next = json(item);
		const prev = remote.get(item.id);
		if (prev === next) continue;
		remote.set(item.id, next);
		const ref = s.doc(db, name, item.id);
		const data = clean(item) as Record<string, unknown>;
		delete data.id;
		if (prev === undefined) {
			s.setDoc(ref, data).catch((e) => console.warn(`sync: create ${name}/${item.id}`, e));
		} else {
			const changes = diff(s, JSON.parse(prev), data);
			if (!changes.length) continue;
			const [[field, value], ...rest] = changes;
			s.updateDoc(ref, field, value, ...rest.flat()).catch((e) =>
				console.warn(`sync: update ${name}/${item.id}`, e)
			);
		}
	}
	for (const id of [...remote.keys()]) {
		if (seen.has(id)) continue;
		remote.delete(id);
		s.deleteDoc(s.doc(db, name, id)).catch((e) => console.warn(`sync: delete ${name}/${id}`, e));
	}
}

export interface Filter {
	field: string;
	op: 'in' | 'array-contains-any' | '==';
	value: unknown;
}

/**
 * Подписка на коллекцию. onData получает все документы (с id) и сразу обновлённый remote.
 * Возвращает функцию отписки.
 */
export async function listen<T extends Doc>(
	name: string,
	filter: Filter | null,
	remote: Remote,
	onData: (docs: T[]) => void,
	onError: (error: unknown) => void
) {
	const [db, s] = await Promise.all([firestore(), sdk()]);
	const constraints: QueryConstraint[] = filter
		? [s.where(filter.field, filter.op, filter.value)]
		: [];
	const ref = s.query(s.collection(db as Firestore, name), ...constraints);
	return s.onSnapshot(
		ref,
		(snap) => {
			const docs = snap.docs.map((d) => ({ ...(d.data() as object), id: d.id }) as T);
			remote.clear();
			for (const d of docs) remote.set(d.id, json(d));
			onData(docs);
		},
		onError
	);
}

/** Один документ по id (например, проверить, есть ли уже профиль) */
export async function getOne<T extends Doc>(name: string, id: string) {
	if (demoMode) {
		// Демо-версия: ищем среди выдуманных данных этого браузера
		let saved: Record<string, Doc[]>;
		try {
			saved = JSON.parse(localStorage.getItem('volna:demo:v1') ?? '{}');
		} catch {
			saved = {};
		}
		const seed = (await import('./demo/index.ts')).demoState() as unknown as Record<string, Doc[]>;
		return (saved[name] ?? seed[name])?.find((d) => d.id === id) as T | undefined;
	}
	const [db, s] = await Promise.all([firestore(), sdk()]);
	const snap = await s.getDoc(s.doc(db, name, id));
	return snap.exists() ? ({ ...(snap.data() as object), id } as T) : undefined;
}
