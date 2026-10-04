export interface Jurisdiction {
	code: string;
	name: string;
	flag: string;
	currency: string;
	taxIdLabel: string;
	law: string;
	courts: string;
	taxNote: string;
}

export const jurisdictions: Jurisdiction[] = [
	{
		code: 'RU',
		name: 'Россия',
		flag: '🇷🇺',
		currency: 'RUB',
		taxIdLabel: 'ИНН',
		law: 'Гражданского кодекса Российской Федерации (гл. 37, 39)',
		courts: 'суде по месту нахождения Исполнителя',
		taxNote: 'Исполнитель применяет НПД (самозанятый), НДС не облагается.'
	},
	{
		code: 'KZ',
		name: 'Казахстан',
		flag: '🇰🇿',
		currency: 'KZT',
		taxIdLabel: 'ИИН/БИН',
		law: 'Гражданского кодекса Республики Казахстан',
		courts: 'суде по месту нахождения Исполнителя',
		taxNote: 'Исполнитель — ИП на упрощённом режиме, без НДС.'
	},
	{
		code: 'UZ',
		name: 'Узбекистан',
		flag: '🇺🇿',
		currency: 'UZS',
		taxIdLabel: 'ИНН',
		law: 'Гражданского кодекса Республики Узбекистан',
		courts: 'экономическом суде по месту нахождения Исполнителя',
		taxNote: 'Исполнитель — самозанятое лицо, НДС не облагается.'
	},
	{
		code: 'US',
		name: 'США',
		flag: '🇺🇸',
		currency: 'USD',
		taxIdLabel: 'EIN / SSN (W-9)',
		law: 'законодательства штата Делавэр, США',
		courts: 'судах штата Делавэр',
		taxNote: 'Исполнитель — независимый подрядчик (1099), налоги уплачивает самостоятельно.'
	},
	{
		code: 'DE',
		name: 'Германия',
		flag: '🇩🇪',
		currency: 'EUR',
		taxIdLabel: 'USt-IdNr.',
		law: 'законодательства Федеративной Республики Германия (BGB)',
		courts: 'суде по месту нахождения Исполнителя',
		taxNote: 'Kleinunternehmer по § 19 UStG: НДС не начисляется.'
	},
	{
		code: 'AE',
		name: 'ОАЭ',
		flag: '🇦🇪',
		currency: 'AED',
		taxIdLabel: 'TRN',
		law: 'законодательства Объединённых Арабских Эмиратов',
		courts: 'судах DIFC (Дубай)',
		taxNote: 'НДС 5% начисляется, если оборот Исполнителя превышает порог регистрации.'
	}
];

export interface ContractInput {
	jurisdiction: string;
	freelancer: string;
	freelancerTaxId: string;
	client: string;
	clientTaxId: string;
	service: string;
	amount: number;
	deadline: string;
	revisions: number;
	milestones: number;
	killFee: number;
}

export interface ContractSection {
	title: string;
	paragraphs: string[];
}

export function getJurisdiction(code: string) {
	return jurisdictions.find((item) => item.code === code) ?? jurisdictions[0];
}

export function money(value: number, currency: string) {
	return new Intl.NumberFormat('ru-RU', {
		style: 'currency',
		currency,
		maximumFractionDigits: 0
	}).format(value);
}

function formatDate(value: string) {
	if (!value) return '—';
	return new Date(value).toLocaleDateString('ru-RU', {
		day: 'numeric',
		month: 'long',
		year: 'numeric'
	});
}

export function splitMilestones(amount: number, count: number) {
	const base = Math.floor(amount / count);
	return Array.from({ length: count }, (_, index) =>
		index === count - 1 ? amount - base * (count - 1) : base
	);
}

export function generateContract(input: ContractInput): ContractSection[] {
	const j = getJurisdiction(input.jurisdiction);
	const total = money(input.amount, j.currency);
	const parts = splitMilestones(input.amount, input.milestones);

	return [
		{
			title: '1. Предмет договора',
			paragraphs: [
				`Исполнитель ${input.freelancer} (${j.taxIdLabel}: ${input.freelancerTaxId || '—'}) обязуется оказать Заказчику ${input.client} (${j.taxIdLabel}: ${input.clientTaxId || '—'}) следующие услуги: ${input.service}.`,
				'Полный перечень работ фиксируется в Приложении №1 (Техническое задание). Любые задачи вне ТЗ оформляются дополнительным соглашением и оплачиваются отдельно.'
			]
		},
		{
			title: '2. Стоимость и порядок оплаты',
			paragraphs: [
				`Общая стоимость услуг — ${total}. ${j.taxNote}`,
				`Оплата производится через безопасную сделку FreelanceShield в ${input.milestones} этап(а): ${parts.map((part, index) => `этап ${index + 1} — ${money(part, j.currency)}`).join('; ')}.`,
				'Средства каждого этапа резервируются до начала работ и перечисляются Исполнителю после приёмки этапа. Если Заказчик не направил мотивированных замечаний в течение 72 часов, этап считается принятым.'
			]
		},
		{
			title: '3. Сроки и правки',
			paragraphs: [
				`Срок оказания услуг — до ${formatDate(input.deadline)}.`,
				`В стоимость включено ${input.revisions} раунд(а) правок в рамках ТЗ. Каждый дополнительный раунд оплачивается по ставке Исполнителя.`,
				'Задержка обратной связи от Заказчика сдвигает срок на соответствующее количество дней.'
			]
		},
		{
			title: '4. Интеллектуальная собственность',
			paragraphs: [
				'Исключительные права на результат переходят к Заказчику в момент полной оплаты соответствующего этапа.',
				'Исполнитель вправе использовать результат в портфолио, если стороны не согласовали иное в письменной форме.'
			]
		},
		{
			title: '5. Расторжение',
			paragraphs: [
				`При одностороннем отказе Заказчика от договора после начала работ он оплачивает фактически выполненные этапы и компенсацию (kill fee) в размере ${input.killFee}% от стоимости текущего этапа.`,
				'Исполнитель вправе приостановить работы при просрочке оплаты этапа более чем на 5 рабочих дней.'
			]
		},
		{
			title: '6. Применимое право и споры',
			paragraphs: [
				`Договор регулируется нормами ${j.law}.`,
				`Споры решаются переговорами и через арбитраж FreelanceShield, а при недостижении согласия — в ${j.courts}.`
			]
		}
	];
}

export function contractToText(input: ContractInput, sections: ContractSection[]) {
	const header = `ДОГОВОР ОКАЗАНИЯ УСЛУГ\n${input.freelancer} — ${input.client}\n`;
	const body = sections.map((s) => `${s.title}\n${s.paragraphs.join('\n')}`).join('\n\n');
	return `${header}\n${body}\n\nПодписи сторон:\nИсполнитель ________  Заказчик ________`;
}
