/// <reference types="@sveltejs/kit" />
import { version } from '$app/env';
import { assets, immutable, prerendered } from '$app/manifest';
import { self } from '$app/service-worker';

const CACHE = `volna-${version}`;
const FONTS = 'volna-fonts';

/** Пути в манифесте относительные — превращаем их в абсолютные внутри области приложения */
const toPath = (path: string) => new URL(path, self.registration.scope).pathname;

/** Сборка, статические файлы и все заранее собранные страницы — для работы офлайн */
const PRECACHE = [...immutable, ...assets, ...prerendered].map((file) => toPath(file.path));
const STATIC = new Set([...immutable, ...assets].map((file) => toPath(file.path)));
const SHELL = toPath('');

self.addEventListener('install', (event) => {
	event.waitUntil(
		(async () => {
			const cache = await caches.open(CACHE);
			// Добавляем по одному: если один файл недоступен, установка не должна сорваться
			await Promise.all(PRECACHE.map((path) => cache.add(path).catch(() => undefined)));
			await self.skipWaiting();
		})()
	);
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		(async () => {
			for (const key of await caches.keys()) {
				if (key !== CACHE && key !== FONTS) await caches.delete(key);
			}
			await self.clients.claim();
		})()
	);
});

self.addEventListener('fetch', (event) => {
	const request = event.request;
	if (request.method !== 'GET') return;
	const url = new URL(request.url);

	// Шрифты Google: сначала кэш, чтобы оформление не ломалось без сети
	if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
		event.respondWith(cacheFirst(request, FONTS));
		return;
	}
	if (url.origin !== self.location.origin) return;
	// Служебные страницы входа Firebase (проксируются через vercel.json) — всегда напрямую в сеть
	if (url.pathname.startsWith('/__/')) return;

	// Файлы сборки неизменяемы — отдаём из кэша
	if (STATIC.has(url.pathname)) {
		event.respondWith(cacheFirst(request, CACHE));
		return;
	}

	// Страницы и остальное: сначала сеть, без сети — кэш или главная страница
	event.respondWith(
		(async () => {
			const cache = await caches.open(CACHE);
			try {
				const response = await fetch(request);
				if (response.ok) cache.put(request, response.clone());
				return response;
			} catch {
				const cached = (await cache.match(request)) ?? (await cache.match(url.pathname));
				if (cached) return cached;
				if (request.mode === 'navigate') {
					const shell = await cache.match(SHELL);
					if (shell) return shell;
				}
				return Response.error();
			}
		})()
	);
});

async function cacheFirst(request: Request, name: string) {
	const cache = await caches.open(name);
	const cached = await cache.match(request);
	if (cached) return cached;
	const response = await fetch(request);
	if (response.ok || response.type === 'opaque') cache.put(request, response.clone());
	return response;
}
