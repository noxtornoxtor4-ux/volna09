/** Событие браузера, позволяющее показать системное окно установки PWA (Chrome, Edge, Android) */
interface BeforeInstallPromptEvent extends Event {
	prompt(): Promise<void>;
	userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'volna:install-dismissed';

class Installer {
	/** Отложенное событие установки: есть — можно показать кнопку «Установить» */
	deferred = $state<BeforeInstallPromptEvent | null>(null);
	installed = $state(false);
	dismissed = $state(false);

	readonly ios: boolean;

	constructor() {
		const nav = navigator as Navigator & { standalone?: boolean };
		this.ios =
			/iphone|ipad|ipod/i.test(nav.userAgent) ||
			(nav.platform === 'MacIntel' && nav.maxTouchPoints > 1);
		this.installed = matchMedia('(display-mode: standalone)').matches || nav.standalone === true;
		try {
			this.dismissed = localStorage.getItem(DISMISS_KEY) === '1';
		} catch {
			// хранилище недоступно — просто показываем подсказку
		}

		addEventListener('beforeinstallprompt', (event) => {
			event.preventDefault();
			this.deferred = event as BeforeInstallPromptEvent;
		});
		addEventListener('appinstalled', () => {
			this.installed = true;
			this.deferred = null;
		});
	}

	/** Можно ли установить приложение одной кнопкой */
	get canPrompt() {
		return !!this.deferred;
	}

	/** Показывать ли баннер с предложением установки */
	get suggest() {
		return !this.installed && !this.dismissed && (this.canPrompt || this.ios);
	}

	async install() {
		if (!this.deferred) return false;
		await this.deferred.prompt();
		const { outcome } = await this.deferred.userChoice;
		this.deferred = null;
		if (outcome === 'accepted') this.installed = true;
		return outcome === 'accepted';
	}

	dismiss() {
		this.dismissed = true;
		try {
			localStorage.setItem(DISMISS_KEY, '1');
		} catch {
			// не страшно: баннер снова появится после перезагрузки
		}
	}
}

export const installer = new Installer();
