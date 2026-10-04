export type Verdict = 'in_scope' | 'revision' | 'out_of_scope';

export interface ScopeBrief {
	title: string;
	items: string[];
	revisionsIncluded: number;
	hourlyRate: number;
	currency: string;
}

export interface ScopeAnalysis {
	verdict: Verdict;
	confidence: number;
	matchedItem: string | null;
	reason: string;
	estimateHours: number;
	estimateCost: number;
	suggestedReply: string;
	source: 'ai' | 'heuristic';
}

export const demoBrief: ScopeBrief = {
	title: 'Лендинг для кофейни «Зерно»',
	items: [
		'Дизайн и вёрстка лендинга из 5 секций',
		'Адаптив под мобильные и планшеты',
		'Форма заявки с отправкой в Telegram',
		'Галерея интерьера и меню',
		'Подключение Яндекс.Метрики'
	],
	revisionsIncluded: 2,
	hourlyRate: 25,
	currency: 'USD'
};

const NEW_WORK_MARKERS = [
	'добав',
	'ещё',
	'еще',
	'нов',
	'дополнительн',
	'заодно',
	'а можно',
	'а давай',
	'сделай также',
	'сделайте также',
	'кроме того',
	'приложени',
	'интернет-магазин',
	'оплат',
	'корзин',
	'личный кабинет',
	'регистрац',
	'админк',
	'блог',
	'английск',
	'мультиязычн',
	'перевод',
	'редизайн',
	'переделать полностью',
	'полностью переделать',
	'с нуля',
	'другой стиль',
	'логотип',
	'фирменный стиль',
	'анимац',
	'бот',
	'crm',
	'интеграц'
];

const REVISION_MARKERS = [
	'поправ',
	'исправ',
	'измени',
	'поменя',
	'замени',
	'сдвин',
	'подвин',
	'увелич',
	'уменьш',
	'цвет',
	'шрифт',
	'опечат',
	'текст',
	'отступ',
	'кнопк',
	'картинк',
	'фото',
	'размер'
];

const HEAVY_MARKERS: Record<string, number> = {
	приложени: 60,
	'интернет-магазин': 40,
	корзин: 24,
	оплат: 12,
	'личный кабинет': 30,
	регистрац: 14,
	админк: 30,
	блог: 12,
	мультиязычн: 10,
	английск: 8,
	перевод: 6,
	редизайн: 20,
	'с нуля': 24,
	логотип: 8,
	'фирменный стиль': 16,
	анимац: 6,
	бот: 16,
	crm: 10,
	интеграц: 8,
	страниц: 6
};

const STOP_WORDS = new Set([
	'и',
	'в',
	'на',
	'с',
	'под',
	'для',
	'из',
	'по',
	'а',
	'не',
	'то',
	'что',
	'это',
	'как',
	'мы',
	'вы',
	'мне',
	'нам',
	'нужно',
	'надо',
	'можно',
	'пожалуйста'
]);

function stems(text: string): string[] {
	return text
		.toLowerCase()
		.replace(/ё/g, 'е')
		.split(/[^a-zа-я0-9]+/i)
		.filter((word) => word.length > 2 && !STOP_WORDS.has(word))
		.map((word) => word.slice(0, 5));
}

function findMatchedItem(message: string, items: string[]) {
	const messageStems = new Set(stems(message));
	let best: { item: string; score: number } | null = null;

	for (const item of items) {
		const itemStems = stems(item);
		const score = itemStems.filter((stem) => messageStems.has(stem)).length / itemStems.length;
		if (!best || score > best.score) best = { item, score };
	}

	return best && best.score > 0 ? best : null;
}

export function formatMoney(value: number, currency: string) {
	return new Intl.NumberFormat('ru-RU', {
		style: 'currency',
		currency,
		maximumFractionDigits: 0
	}).format(value);
}

export function analyzeScopeHeuristic(
	message: string,
	brief: ScopeBrief,
	revisionsUsed = 0
): ScopeAnalysis {
	const text = message.toLowerCase().replace(/ё/g, 'е');
	const newWork = NEW_WORK_MARKERS.filter((marker) => text.includes(marker.replace(/ё/g, 'е')));
	const revision = REVISION_MARKERS.filter((marker) => text.includes(marker));
	const matched = findMatchedItem(message, brief.items);
	const heavyHours = Object.entries(HEAVY_MARKERS)
		.filter(([marker]) => text.includes(marker))
		.reduce((sum, [, hours]) => sum + hours, 0);

	const newWorkScore =
		newWork.length * 2 + (heavyHours > 0 && newWork.length > 0 ? 3 : 0) - (matched?.score ?? 0) * 2;

	if (newWorkScore >= 2) {
		const estimateHours = Math.max(heavyHours, 4);
		const estimateCost = estimateHours * brief.hourlyRate;
		const price = formatMoney(estimateCost, brief.currency);
		return {
			verdict: 'out_of_scope',
			confidence: Math.min(97, 70 + newWorkScore * 4),
			matchedItem: null,
			reason: `В согласованном ТЗ нет такой задачи. Сигналы новой работы: «${newWork.slice(0, 3).join('», «')}».`,
			estimateHours,
			estimateCost,
			suggestedReply: `Отличная идея! Этого пункта нет в текущем ТЗ «${brief.title}», поэтому предлагаю оформить его отдельным этапом: примерно ${estimateHours} ч, ${price}. Если подходит, добавлю этап в сделку, и начнём сразу после оплаты.`,
			source: 'heuristic'
		};
	}

	if (revision.length > 0) {
		const left = brief.revisionsIncluded - revisionsUsed;
		if (left <= 0) {
			const estimateHours = 2;
			const estimateCost = estimateHours * brief.hourlyRate;
			return {
				verdict: 'out_of_scope',
				confidence: 88,
				matchedItem: matched?.item ?? null,
				reason: `Это правка, но все ${brief.revisionsIncluded} включённых раунда правок уже использованы.`,
				estimateHours,
				estimateCost,
				suggestedReply: `Конечно, поправлю! Напомню, что ${brief.revisionsIncluded} раунда правок по договору уже использованы. Дополнительный раунд стоит ${formatMoney(estimateCost, brief.currency)}. Добавить его в сделку?`,
				source: 'heuristic'
			};
		}
		return {
			verdict: 'revision',
			confidence: 82,
			matchedItem: matched?.item ?? null,
			reason: `Правка в рамках ТЗ${matched ? ` (пункт «${matched.item}»)` : ''}. Осталось раундов правок: ${left - 1} из ${brief.revisionsIncluded}.`,
			estimateHours: 0,
			estimateCost: 0,
			suggestedReply: `Принято, внесу правку. Это раунд ${revisionsUsed + 1} из ${brief.revisionsIncluded}, включённых в договор.`,
			source: 'heuristic'
		};
	}

	return {
		verdict: 'in_scope',
		confidence: 76,
		matchedItem: matched?.item ?? null,
		reason: 'Сообщение не добавляет новых задач: обсуждение текущей работы.',
		estimateHours: 0,
		estimateCost: 0,
		suggestedReply: 'Спасибо, всё понятно! Продолжаю по плану.',
		source: 'heuristic'
	};
}
