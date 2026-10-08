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
	/**
	 * Встроенный браузер приложения (Telegram, Instagram, WhatsApp…). На iPhone из него
	 * нельзя добавить сайт на экран «Домой» — сначала нужно открыть Safari
	 */
	readonly inApp: boolean;
	/** Окно-подсказка установки для iPhone */
	guide = $state(false);

	constructor() {
		const nav = navigator as Navigator & { standalone?: boolean };
		this.ios =
			/iphone|ipad|ipod/i.test(nav.userAgent) ||
			(nav.platform === 'MacIntel' && nav.maxTouchPoints > 1);
		const ua = nav.userAgent;
		// Safari и браузеры на его движке пишут «Safari/», встроенные окна приложений — нет
		this.inApp =
			/Telegram|Instagram|FBAN|FBAV|FB_IAB|Line\/|WhatsApp|VKClient|MicroMessenger|; wv\)/i.test(
				ua
			) ||
			(this.ios && !/Safari\//.test(ua));
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
		return !this.installed && !this.dismissed && (this.canPrompt || this.ios || this.inApp);
	}

	async install() {
		if (!this.deferred) return false;
		await this.deferred.prompt();
		const { outcome } = await this.deferred.userChoice;
		this.deferred = null;
		if (outcome === 'accepted') this.installed = true;
		return outcome === 'accepted';
	}

	/** Открывает текущую страницу в Safari (iOS 17+ понимает схему x-safari-https) */
	openInSafari() {
		location.href = `x-safari-${location.href}`;
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
