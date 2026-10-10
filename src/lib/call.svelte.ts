/**
 * Видеозвонки как в Zoom на WebRTC: каждый участник соединяется с каждым напрямую.
 *
 * Firebase служит только «почтальоном» для установки соединения:
 * calls/{room}/peers — кто сейчас в комнате (обновляется раз в 20 секунд),
 * calls/{room}/signals — предложения, ответы и сетевые адреса (ICE) для каждой пары.
 * Само видео и звук идут между браузерами и через сервер не проходят.
 * Пары договариваются по схеме «perfect negotiation», поэтому одновременный вход
 * и включение демонстрации экрана не ломают соединение.
 */
import type { CollectionReference, DocumentData, Unsubscribe } from 'firebase/firestore';
import { firestore } from './firebase.ts';

/** Публичные STUN-серверы Google помогают браузерам найти друг друга за роутером */
const ICE: RTCConfiguration = {
	iceServers: [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }]
};
const HEARTBEAT = 20_000;
const STALE = 60_000;
/** Каждый соединяется с каждым — больше 6 человек тяжело для телефона */
export const MAX_PEOPLE = 6;

type Sdk = typeof import('firebase/firestore');

interface PeerDoc {
	uid: string;
	actorId: string;
	name: string;
	mic: boolean;
	cam: boolean;
	screen: boolean;
	seen: number;
}

export interface Participant extends PeerDoc {
	id: string;
	stream: MediaStream | null;
	connected: boolean;
}

interface Signal {
	from: string;
	to: string;
	n: number;
	type: 'description' | 'candidate';
	description?: RTCSessionDescriptionInit;
	candidate?: RTCIceCandidateInit;
}

interface Link {
	pc: RTCPeerConnection;
	/** «Вежливая» сторона уступает, если оба прислали предложение одновременно */
	polite: boolean;
	makingOffer: boolean;
	ignoreOffer: boolean;
	pending: RTCIceCandidateInit[];
	queue: Promise<void>;
	stream: MediaStream | null;
}

export interface Me {
	uid: string;
	actorId: string;
	name: string;
}

/** Код комнаты из ссылки: только буквы, цифры, «-» и «_» */
export const roomCode = (value: string) =>
	value
		.trim()
		.replace(/^.*[?&]room=/, '')
		.replace(/[^\w-]/g, '')
		.slice(0, 80);

export const newRoom = () => crypto.randomUUID().replace(/-/g, '').slice(0, 10);

export const canShareScreen = () =>
	typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getDisplayMedia;

export class Call {
	readonly room: string;
	/** Своя метка в комнате: у одного человека может быть открыто несколько вкладок */
	readonly id = newRoom();

	local = $state<MediaStream | null>(null);
	screen = $state<MediaStream | null>(null);
	mic = $state(true);
	cam = $state(true);
	/** Камера и микрофон уже запрошены — можно входить */
	ready = $state(false);
	joined = $state(false);
	full = $state(false);
	/** Камера или микрофон недоступны */
	mediaError = $state('');
	participants = $state<Participant[]>([]);

	#me: Me | null = null;
	#s: Sdk | null = null;
	#peers: CollectionReference<DocumentData> | null = null;
	#signals: CollectionReference<DocumentData> | null = null;
	// Служебные таблицы не реактивные: интерфейс обновляется через participants в #sync
	// eslint-disable-next-line svelte/prefer-svelte-reactivity
	#docs = new Map<string, PeerDoc>();
	/** Когда мы последний раз слышали об участнике — по своим часам, а не по чужим */
	// eslint-disable-next-line svelte/prefer-svelte-reactivity
	#heard = new Map<string, number>();
	// eslint-disable-next-line svelte/prefer-svelte-reactivity
	#links = new Map<string, Link>();
	#unsubs: Unsubscribe[] = [];
	#timer: ReturnType<typeof setInterval> | undefined;
	#n = 0;
	#left = false;

	constructor(room: string) {
		this.room = room;
	}

	get hasAudio() {
		return !!this.local?.getAudioTracks().length;
	}

	get hasVideo() {
		return !!this.local?.getVideoTracks().length;
	}

	/** Камера и микрофон для предпросмотра; без камеры — только звук, без всего — только смотреть */
	async preview() {
		if (this.local || !navigator.mediaDevices?.getUserMedia) {
			this.ready = true;
			return;
		}
		const audio = { echoCancellation: true, noiseSuppression: true };
		const video = { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } };
		for (const constraints of [{ audio, video }, { audio }, { video }]) {
			try {
				this.local = await navigator.mediaDevices.getUserMedia(constraints);
				break;
			} catch (error) {
				this.mediaError = (error as Error).name;
			}
		}
		if (this.local) this.mediaError = '';
		if (this.#left) this.local?.getTracks().forEach((t) => t.stop());
		this.mic = this.hasAudio && this.mic;
		this.cam = this.hasVideo && this.cam;
		this.#applyToggles();
		this.ready = true;
	}

	async join(me: Me) {
		if (this.joined) return;
		this.#me = me;
		const [db, s] = await Promise.all([firestore(), import('firebase/firestore')]);
		this.#s = s;
		this.#peers = s.collection(db, 'calls', this.room, 'peers');
		this.#signals = s.collection(db, 'calls', this.room, 'signals');

		const now = Date.now();
		const present = (await s.getDocs(this.#peers)).docs.filter(
			(d) => now - (d.data() as PeerDoc).seen < STALE
		);
		if (present.length >= MAX_PEOPLE) {
			this.full = true;
			return;
		}

		await s.setDoc(s.doc(this.#peers, this.id), this.#doc());
		this.joined = true;

		this.#unsubs.push(
			s.onSnapshot(this.#peers, (snap) => {
				const at = Date.now();
				for (const change of snap.docChanges()) {
					const id = change.doc.id;
					if (id === this.id) continue;
					const data = change.doc.data() as PeerDoc;
					if (change.type === 'removed') {
						this.#docs.delete(id);
						this.#heard.delete(id);
						continue;
					}
					this.#docs.set(id, data);
					// Из кэша могли прийти давно ушедшие участники — их не ждём
					if (change.type === 'modified' || Math.abs(at - data.seen) < STALE * 3)
						this.#heard.set(id, at);
				}
				this.#sync();
			}),
			s.onSnapshot(s.query(this.#signals, s.where('to', '==', this.id)), (snap) => {
				const added = snap
					.docChanges()
					.filter((c) => c.type === 'added')
					.map((c) => ({ ref: c.doc.ref, data: c.doc.data() as Signal }))
					.sort((a, b) => a.data.n - b.data.n);
				for (const { ref, data } of added) {
					s.deleteDoc(ref).catch(() => {});
					this.#receive(data);
				}
			})
		);

		this.#timer = setInterval(() => {
			this.#update({ seen: Date.now() });
			this.#sync();
		}, HEARTBEAT);
		addEventListener('pagehide', this.leave);
	}

	toggleMic() {
		if (!this.hasAudio) return;
		this.mic = !this.mic;
		this.#applyToggles();
		this.#update({ mic: this.mic });
	}

	toggleCam() {
		if (!this.hasVideo) return;
		this.cam = !this.cam;
		this.#applyToggles();
		this.#update({ cam: this.cam });
	}

	async toggleScreen() {
		if (this.screen) return this.#stopScreen();
		let stream: MediaStream;
		try {
			stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
		} catch {
			return; // пользователь передумал
		}
		const track = stream.getVideoTracks()[0];
		track.addEventListener('ended', () => this.#stopScreen());
		this.screen = stream;
		await this.#sendVideo(track);
		this.#update({ screen: true });
	}

	leave = () => {
		if (this.#left) return;
		this.#left = true;
		removeEventListener('pagehide', this.leave);
		clearInterval(this.#timer);
		this.#unsubs.forEach((stop) => stop());
		for (const link of this.#links.values()) link.pc.close();
		this.#links.clear();
		this.local?.getTracks().forEach((t) => t.stop());
		this.screen?.getTracks().forEach((t) => t.stop());
		if (this.joined && this.#s && this.#peers)
			this.#s.deleteDoc(this.#s.doc(this.#peers, this.id)).catch(() => {});
		this.joined = false;
	};

	// ───────── Внутреннее ─────────

	#doc(): PeerDoc {
		return {
			...this.#me!,
			mic: this.mic,
			cam: this.cam,
			screen: !!this.screen,
			seen: Date.now()
		};
	}

	#update(fields: Partial<PeerDoc>) {
		if (!this.joined || !this.#s || !this.#peers) return;
		this.#s.updateDoc(this.#s.doc(this.#peers, this.id), fields).catch(() => {});
	}

	#applyToggles() {
		this.local?.getAudioTracks().forEach((t) => (t.enabled = this.mic));
		this.local?.getVideoTracks().forEach((t) => (t.enabled = this.cam));
	}

	/** Соединяемся с новыми участниками, закрываем соединения с ушедшими, обновляем плитки */
	#sync() {
		if (this.#left) return;
		const now = Date.now();
		// Участник мог прислать предложение раньше, чем пришла его запись в комнате, — не рвём связь
		const alive = [...this.#heard.keys()].filter((id) => now - this.#heard.get(id)! < STALE);
		for (const id of alive) if (!this.#links.has(id)) this.#link(id);
		for (const [id, link] of this.#links)
			if (!alive.includes(id)) {
				link.pc.close();
				this.#links.delete(id);
			}
		this.participants = alive
			.filter((id) => this.#docs.has(id))
			.map((id) => {
				const link = this.#links.get(id);
				return {
					...this.#docs.get(id)!,
					id,
					stream: link?.stream ?? null,
					connected: link?.pc.connectionState === 'connected'
				};
			});
	}

	#link(peerId: string) {
		const pc = new RTCPeerConnection(ICE);
		const link: Link = {
			pc,
			polite: this.id > peerId,
			makingOffer: false,
			ignoreOffer: false,
			pending: [],
			queue: Promise.resolve(),
			stream: null
		};
		this.#links.set(peerId, link);

		const audio = this.local?.getAudioTracks()[0];
		const video = this.screen?.getVideoTracks()[0] ?? this.local?.getVideoTracks()[0];
		const outgoing = new MediaStream([audio, video].filter((t) => !!t));
		// Без своей камеры или микрофона всё равно принимаем чужие
		if (audio) pc.addTrack(audio, outgoing);
		else pc.addTransceiver('audio', { direction: 'recvonly' });
		if (video) pc.addTrack(video, outgoing);
		else pc.addTransceiver('video', { direction: 'recvonly' });

		pc.ontrack = ({ track, streams }) => {
			const stream = streams[0] ?? link.stream ?? new MediaStream();
			if (!stream.getTracks().includes(track)) stream.addTrack(track);
			link.stream = stream;
			this.#sync();
		};
		pc.onicecandidate = ({ candidate }) => {
			if (candidate) this.#send(peerId, { type: 'candidate', candidate: candidate.toJSON() });
		};
		pc.onnegotiationneeded = async () => {
			try {
				link.makingOffer = true;
				await pc.setLocalDescription();
				this.#send(peerId, { type: 'description', description: pc.localDescription!.toJSON() });
			} catch (error) {
				console.warn('call: offer', error);
			} finally {
				link.makingOffer = false;
			}
		};
		pc.onconnectionstatechange = () => {
			if (pc.connectionState === 'failed') pc.restartIce();
			this.#sync();
		};
		return link;
	}

	#send(to: string, signal: Pick<Signal, 'type' | 'description' | 'candidate'>) {
		if (!this.#s || !this.#signals) return;
		this.#s
			.addDoc(this.#signals, { ...signal, from: this.id, to, uid: this.#me!.uid, n: ++this.#n })
			.catch((error) => console.warn('call: signal', error));
	}

	#receive(signal: Signal) {
		if (this.#left) return;
		if (!this.#heard.has(signal.from)) this.#heard.set(signal.from, Date.now());
		const link = this.#links.get(signal.from) ?? this.#link(signal.from);
		link.queue = link.queue
			.then(() => this.#handle(link, signal))
			.catch((error) => console.warn('call: signal', error));
	}

	async #handle(link: Link, signal: Signal) {
		const { pc } = link;
		if (signal.type === 'description' && signal.description) {
			const description = signal.description;
			const collision =
				description.type === 'offer' && (link.makingOffer || pc.signalingState !== 'stable');
			link.ignoreOffer = !link.polite && collision;
			if (link.ignoreOffer) return;
			await pc.setRemoteDescription(description);
			for (const candidate of link.pending.splice(0))
				await pc.addIceCandidate(candidate).catch(() => {});
			if (description.type === 'offer') {
				await pc.setLocalDescription();
				this.#send(signal.from, {
					type: 'description',
					description: pc.localDescription!.toJSON()
				});
			}
		} else if (signal.type === 'candidate' && signal.candidate) {
			if (!pc.remoteDescription) link.pending.push(signal.candidate);
			else
				await pc.addIceCandidate(signal.candidate).catch((error) => {
					if (!link.ignoreOffer) throw error;
				});
		}
	}

	/** Меняем исходящее видео (камера ↔ экран) во всех соединениях без переподключения */
	async #sendVideo(track: MediaStreamTrack | null) {
		for (const { pc } of this.#links.values()) {
			const transceiver = pc
				.getTransceivers()
				.find((t) => t.receiver.track.kind === 'video' && t.direction !== 'stopped');
			if (!transceiver) continue;
			if (track && !transceiver.direction.includes('send')) transceiver.direction = 'sendrecv';
			await transceiver.sender.replaceTrack(track).catch(() => {});
		}
	}

	async #stopScreen() {
		if (!this.screen) return;
		this.screen.getTracks().forEach((t) => t.stop());
		this.screen = null;
		await this.#sendVideo(this.local?.getVideoTracks()[0] ?? null);
		this.#update({ screen: false });
	}
}
