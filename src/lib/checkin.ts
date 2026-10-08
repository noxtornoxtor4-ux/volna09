/**
 * Личный QR-код волонтёра для подтверждения участия на мероприятии.
 * В коде — ссылка на профиль и время создания: код обновляется каждые 30 секунд,
 * а куратор принимает только свежий (не старше 5 минут), поэтому старый скриншот не сработает.
 */
const MAX_AGE = 5 * 60_000;

export function checkinPayload(personId: string, origin = location.origin) {
	return `${origin}/u?id=${encodeURIComponent(personId)}&checkin=${Date.now()}`;
}

export type CheckinResult = { personId: string } | { error: 'invalid' | 'expired' };

export function parseCheckin(text: string): CheckinResult {
	try {
		const url = new URL(text.trim());
		const personId = url.searchParams.get('id');
		const at = Number(url.searchParams.get('checkin'));
		if (!personId || !at) return { error: 'invalid' };
		if (Math.abs(Date.now() - at) > MAX_AGE) return { error: 'expired' };
		return { personId };
	} catch {
		return { error: 'invalid' };
	}
}
