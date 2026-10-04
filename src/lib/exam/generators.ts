import type { ExamId, Question, TopicId } from './types.ts';

type Draft = Omit<Question, 'id' | 'exam' | 'options' | 'correct' | 'mistakes'> & {
	answer: string;
	traps: { value: string; why: string }[];
};

const rand = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1));
const pick = <T>(items: T[]) => items[Math.floor(Math.random() * items.length)];
const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b));

function fraction(num: number, den: number) {
	const d = gcd(num, den);
	return den / d === 1 ? String(num / d) : `${num / d}/${den / d}`;
}

/** Запасная ловушка: то же число в ответе, сдвинутое на шаг (арифметическая ошибка) */
function nudge(answer: string, step: number) {
	return answer.replace(/\d+/, (n) => String(Number(n) + step));
}

/** Перемешивает варианты, отбрасывая ловушки, совпавшие с ответом или друг с другом */
function assemble(exam: ExamId, draft: Draft): Question {
	const seen = new Set([draft.answer]);
	const traps = draft.traps.filter((t) => !seen.has(t.value) && seen.add(t.value)).slice(0, 3);
	for (let step = 1; traps.length < 3; step++) {
		const value = nudge(draft.answer, step);
		if (value === draft.answer) break;
		if (seen.has(value)) continue;
		seen.add(value);
		traps.push({
			value,
			why: 'Похоже на арифметическую ошибку. Пройдите решение по шагам и сверьте каждое действие.'
		});
	}
	const options = [{ value: draft.answer, why: '' }, ...traps].sort(() => Math.random() - 0.5);
	const mistakes: Record<number, string> = {};
	options.forEach((o, i) => o.why && (mistakes[i] = o.why));

	return {
		id: `${draft.topic}-${Date.now().toString(36)}-${rand(0, 9999)}`,
		exam,
		topic: draft.topic,
		passage: draft.passage,
		text: draft.text,
		options: options.map((o) => o.value),
		correct: options.findIndex((o) => o.value === draft.answer),
		mistakes,
		solution: draft.solution,
		simple: draft.simple
	};
}

const COMPARE = {
	a: 'Величина А больше',
	b: 'Величина Б больше',
	eq: 'Величины равны',
	none: 'Недостаточно данных'
};

const math: Partial<Record<TopicId, () => Draft>> = {
	percent() {
		const price = rand(10, 50) * 100;
		const pct = pick([10, 15, 20, 25, 30, 40, 50]);
		const off = (price * pct) / 100;
		return {
			topic: 'percent',
			text: `Телефон стоил ${price} сом. Цену снизили на ${pct}%. Сколько стоит телефон теперь?`,
			answer: `${price - off} сом`,
			traps: [
				{
					value: `${off} сом`,
					why: `${off} сом — это размер скидки. Его нужно вычесть из ${price}.`
				},
				{
					value: `${price - pct} сом`,
					why: `Вы вычли ${pct} сом, а не ${pct}%. Процент берётся от цены.`
				},
				{ value: `${price + off} сом`, why: 'Скидка уменьшает цену, а вы прибавили её.' },
				{
					value: `${Math.round(price / (1 + pct / 100))} сом`,
					why: `Вы разделили на ${1 + pct / 100}, как будто ищете цену до наценки. Скидку считают умножением на ${(100 - pct) / 100}.`
				}
			],
			solution: [
				`${pct}% от ${price}: ${price} · ${pct / 100} = ${off} сом.`,
				`Новая цена: ${price} − ${off} = ${price - off} сом.`
			],
			simple: `Остаётся ${100 - pct}% цены: ${price} · ${(100 - pct) / 100} = ${price - off}. Процент — это «сколько сотых частей».`
		};
	},
	equations() {
		const a = rand(2, 9);
		const x = rand(2, 12);
		const b = rand(1, 15);
		const c = a * x - b;
		return {
			topic: 'equations',
			text: `Решите уравнение: ${a}x − ${b} = ${c}`,
			answer: `x = ${x}`,
			traps: [
				{
					value: `x = ${c + b}`,
					why: `${a}x = ${c + b} найдено верно, но нужно ещё разделить на ${a}.`
				},
				{
					value: `x = ${fraction(c - b, a)}`,
					why: `При переносе −${b} вправо знак меняется на «+», а вы вычли.`
				},
				{ value: `x = ${-x}`, why: 'Ошибка в знаке: все числа после переноса положительные.' },
				{ value: `x = ${x + 1}`, why: `Проверьте подстановкой: ${a} · ${x + 1} − ${b} ≠ ${c}.` }
			],
			solution: [
				`${a}x = ${c} + ${b} = ${c + b}.`,
				`x = ${c + b} : ${a} = ${x}.`,
				`Проверка: ${a} · ${x} − ${b} = ${c} ✓`
			],
			simple: `Весы: убираем «−${b}», добавив ${b} на обе чаши. ${a} одинаковых коробок весят ${c + b}, одна весит ${x}.`
		};
	},
	comparison() {
		if (Math.random() < 0.5) return compareFractions();
		const [p, q] = pick([
			[2, 3],
			[2, 5],
			[3, 4],
			[2, 4],
			[3, 5]
		]);
		const A = p ** q;
		const B = q ** p;
		const answer = A > B ? COMPARE.a : A < B ? COMPARE.b : COMPARE.eq;
		const all = [COMPARE.a, COMPARE.b, COMPARE.eq, COMPARE.none];
		const whys: Record<string, string> = {
			[COMPARE.a]: `Посчитайте обе степени: ${p}${sup(q)} = ${A}, ${q}${sup(p)} = ${B}.`,
			[COMPARE.b]: `Посчитайте обе степени: ${p}${sup(q)} = ${A}, ${q}${sup(p)} = ${B}.`,
			[COMPARE.eq]: `Степень — не умножение: ${p}·${q} = ${q}·${p}, но ${p}${sup(q)} = ${A}, а ${q}${sup(p)} = ${B}.`,
			[COMPARE.none]: 'Обе величины — конкретные числа, их всегда можно сравнить.'
		};
		return {
			topic: 'comparison',
			text: `Сравните: А = ${p}${sup(q)}, Б = ${q}${sup(p)}`,
			answer,
			traps: all.filter((o) => o !== answer).map((value) => ({ value, why: whys[value] })),
			solution: [
				`А = ${p}${sup(q)} = ${A}.`,
				`Б = ${q}${sup(p)} = ${B}.`,
				`Ответ: ${answer.toLowerCase()}.`
			],
			simple: `${p}${sup(q)} значит «${p} умножить само на себя ${q} раз». Посчитай обе стороны и сравни числа.`
		};
	},
	fractions() {
		const a = rand(2, 7);
		let b = rand(2, 9);
		if (b === a) b += 1;
		return {
			topic: 'fractions',
			text: `Вычислите: 1/${a} + 1/${b}`,
			answer: fraction(a + b, a * b),
			traps: [
				{
					value: fraction(2, a + b),
					why: 'Числители и знаменатели не складывают отдельно. Нужен общий знаменатель.'
				},
				{ value: fraction(1, a * b), why: 'Вы перемножили дроби, а нужно сложить.' },
				{
					value: fraction(2, a * b),
					why: `Знаменатель ${a * b} верный, но числители тоже домножаются: 1/${a} = ${b}/${a * b}.`
				}
			],
			solution: [
				`Общий знаменатель: ${a * b}.`,
				`1/${a} = ${b}/${a * b}, 1/${b} = ${a}/${a * b}.`,
				`Сумма: ${a + b}/${a * b} = ${fraction(a + b, a * b)}.`
			],
			simple: `Разрежь оба торта на ${a * b} кусков: 1/${a} — это ${b} кусков, 1/${b} — ${a} куска. Вместе ${a + b}.`
		};
	},
	geometry() {
		const s = rand(3, 9);
		let t = rand(4, 12);
		if (t === s) t += 1;
		return {
			topic: 'geometry',
			text: `Площадь прямоугольника ${s * t} см², одна сторона ${s} см. Найдите периметр.`,
			answer: `${2 * (s + t)} см`,
			traps: [
				{ value: `${t} см`, why: `${t} см — это вторая сторона, а нужен периметр.` },
				{ value: `${s + t} см`, why: 'Это сумма двух сторон, то есть половина периметра.' },
				{ value: `${s + s * t} см`, why: 'Площадь и длину складывать нельзя: это см² и см.' }
			],
			solution: [
				`Вторая сторона: ${s * t} : ${s} = ${t} см.`,
				`Периметр: 2 · (${s} + ${t}) = ${2 * (s + t)} см.`
			],
			simple: `Площадь = плитки внутри, периметр = забор вокруг. Забор: ${s} + ${t} + ${s} + ${t}.`
		};
	},
	powers() {
		const m = rand(4, 7);
		const n = rand(1, 3);
		return {
			topic: 'powers',
			text: `Найдите значение выражения: log₂ ${2 ** m} − log₂ ${2 ** n}`,
			answer: String(m - n),
			traps: [
				{
					value: String(2 ** (m - n)),
					why: `${2 ** m} : ${2 ** n} = ${2 ** (m - n)} — это аргумент. От него ещё нужно взять log₂.`
				},
				{
					value: String(m),
					why: `Вы посчитали только log₂ ${2 ** m} и забыли вычесть log₂ ${2 ** n} = ${n}.`
				},
				{
					value: String(2 ** m - 2 ** n),
					why: 'Разность логарифмов — логарифм частного, а не разность аргументов.'
				},
				{ value: String(m + n), why: 'Логарифмы нужно было вычесть, а вы сложили.' }
			],
			solution: [`log₂ ${2 ** m} = ${m}, log₂ ${2 ** n} = ${n}.`, `${m} − ${n} = ${m - n}.`],
			simple: `log₂ ${2 ** m} спрашивает: «сколько двоек перемножить, чтобы получить ${2 ** m}?» Ответ ${m}.`
		};
	},
	probability() {
		const r = rand(2, 8);
		const b = rand(2, 9);
		const t = r + b;
		return {
			topic: 'probability',
			text: `В коробке ${r} красных и ${b} синих шаров. Какова вероятность наугад достать красный?`,
			answer: fraction(r, t),
			traps: [
				{ value: fraction(b, t), why: 'Это вероятность достать синий шар.' },
				{ value: fraction(r, b), why: 'Делить нужно на общее число шаров, а не на синие.' },
				{ value: fraction(1, t), why: `Подходящих исходов ${r}, а не один.` },
				{ value: fraction(1, r), why: 'Делить нужно на число всех шаров, а не красных.' }
			],
			solution: [`Всего шаров: ${t}.`, `Красных: ${r}.`, `P = ${r}/${t} = ${fraction(r, t)}.`],
			simple: `Вероятность = подходящие : все. Красных ${r} из ${t}.`
		};
	}
};

function compareFractions(): Draft {
	const a = rand(1, 8);
	const b = rand(a + 1, 12);
	const c = rand(1, 8);
	const d = rand(c + 1, 12);
	const left = a * d;
	const right = c * b;
	const answer = left > right ? COMPARE.a : left < right ? COMPARE.b : COMPARE.eq;
	const cross = `Сравните «крест-накрест»: ${a}·${d} = ${left} и ${c}·${b} = ${right}.`;
	const whys: Record<string, string> = {
		[COMPARE.a]: cross,
		[COMPARE.b]: cross,
		[COMPARE.eq]: `Дроби равны, только если ${a}·${d} = ${c}·${b}, а здесь ${left} и ${right}.`,
		[COMPARE.none]: 'Обе дроби — конкретные числа, их всегда можно сравнить.'
	};
	return {
		topic: 'comparison',
		text: `Сравните: А = ${a}/${b}, Б = ${c}/${d}`,
		answer,
		traps: [COMPARE.a, COMPARE.b, COMPARE.eq, COMPARE.none]
			.filter((o) => o !== answer)
			.map((value) => ({ value, why: whys[value] })),
		solution: [
			`Приведём к общему знаменателю ${b * d}: А = ${left}/${b * d}, Б = ${right}/${b * d}.`,
			`Сравниваем числители: ${left} и ${right}.`,
			`Ответ: ${answer.toLowerCase()}.`
		],
		simple: `Больше знаменатель — мельче кусочки. Чтобы сравнить честно, разрежьте обе пиццы на ${b * d} кусков и посчитайте свои.`
	};
}

function sup(n: number) {
	return String(n)
		.split('')
		.map((d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[Number(d)])
		.join('');
}

const verbal: Partial<Record<TopicId, Draft[]>> = {
	analogies: [
		{
			topic: 'analogies',
			text: 'ПЧЕЛА : УЛЕЙ',
			answer: 'птица : гнездо',
			traps: [
				{
					value: 'рыба : вода',
					why: 'Вода — среда обитания, а не жилище, которое строит животное.'
				},
				{ value: 'собака : кость', why: 'Это «животное — еда», а не «животное — жилище».' },
				{ value: 'мёд : пчела', why: 'Обратный порядок и другая связь: продукт — производитель.' }
			],
			solution: [
				'Связь: «пчела живёт в улье, который строит сама».',
				'Так же птица живёт в гнезде, которое строит.'
			],
			simple:
				'Скажи вслух: «пчела живёт в улье». Подставь варианты: «птица живёт в гнезде». Подходит!'
		},
		{
			topic: 'analogies',
			text: 'КАРАНДАШ : РИСУНОК',
			answer: 'ручка : письмо',
			traps: [
				{
					value: 'бумага : тетрадь',
					why: 'Бумага — материал тетради, а не инструмент для её создания.'
				},
				{ value: 'художник : картина', why: 'Художник — человек, а карандаш — инструмент.' },
				{
					value: 'ластик : карандаш',
					why: 'Это два предмета одного набора, нет связи «инструмент — результат».'
				}
			],
			solution: ['Связь: «инструмент — результат работы им».', 'Ручкой пишут письмо: та же связь.'],
			simple: 'Карандашом делают рисунок. Чем делают письмо? Ручкой.'
		},
		{
			topic: 'analogies',
			text: 'ЩЕДРЫЙ : ЖАДНЫЙ',
			answer: 'смелый : трусливый',
			traps: [
				{ value: 'добрый : милый', why: 'Это близкие по смыслу слова, а нужны противоположные.' },
				{ value: 'жадный : скупой', why: 'Синонимы, а не антонимы.' },
				{ value: 'смелый : герой', why: 'Это «признак — носитель признака».' }
			],
			solution: [
				'Щедрый и жадный — антонимы.',
				'Из вариантов антонимы только «смелый : трусливый».'
			],
			simple: 'Ищи пару, где слова — противоположности, как день и ночь.'
		}
	],
	sentence: [
		{
			topic: 'sentence',
			text: 'Его доводы были настолько ______, что даже скептики согласились.',
			answer: 'убедительными',
			traps: [
				{
					value: 'сомнительными',
					why: 'Сомнительные доводы не заставили бы скептиков согласиться.'
				},
				{ value: 'длинными', why: 'Длина не связана с тем, что люди согласились.' },
				{ value: 'тихими', why: 'Громкость не объясняет согласия скептиков.' }
			],
			solution: [
				'«Настолько …, что даже скептики согласились» — нужна причина согласия.',
				'Причина — сила доводов: «убедительными».'
			],
			simple:
				'Спроси себя: «почему даже те, кто сомневался, согласились?» Потому что доводы убеждали.'
		},
		{
			topic: 'sentence',
			text: 'Задача казалась ______, но решение оказалось ______.',
			answer: 'сложной … простым',
			traps: [
				{
					value: 'простой … простым',
					why: 'Союз «но» требует противопоставления, а здесь его нет.'
				},
				{ value: 'сложной … трудным', why: 'Обе части говорят одно и то же, контраста нет.' },
				{ value: 'интересной … длинным', why: 'Эти слова не противопоставлены друг другу.' }
			],
			solution: ['Союз «но» сигнализирует о контрасте.', 'Казалась сложной → оказалась простой.'],
			simple: '«Но» — это поворот сюжета. Если в начале «трудно», в конце будет «легко».'
		}
	],
	reading: [
		{
			topic: 'reading',
			passage:
				'Иссык-Куль — одно из крупнейших высокогорных озёр мира. Несмотря на суровые зимы, озеро практически никогда не замерзает, поэтому его называют «тёплым морем».',
			text: 'Почему Иссык-Куль называют «тёплым морем»?',
			answer: 'Оно почти никогда не замерзает',
			traps: [
				{
					value: 'В нём всегда тёплая вода летом',
					why: 'Про летнюю температуру воды в тексте ничего не сказано.'
				},
				{
					value: 'Оно самое большое озеро в мире',
					why: 'Текст говорит «одно из крупнейших высокогорных», а не «самое большое».'
				},
				{ value: 'Вокруг него нет зимы', why: 'В тексте прямо упомянуты суровые зимы.' }
			],
			solution: [
				'Найдите в тексте слово «поэтому»: оно указывает на причину.',
				'Перед ним: «практически никогда не замерзает».'
			],
			simple: 'Слово «поэтому» — подсказка: то, что стоит перед ним, и есть причина.'
		}
	],
	grammar: [
		{
			topic: 'grammar',
			text: 'В каком варианте нет ошибки?',
			answer: 'вследствие болезни',
			traps: [
				{
					value: 'в продолжении часа',
					why: 'Предлог времени: «в продолжение часа», на конце «е».'
				},
				{ value: 'на счёт этого вопроса', why: 'Предлог пишется слитно: «насчёт».' },
				{ value: 'в виду плохой погоды', why: 'Предлог причины пишется слитно: «ввиду».' }
			],
			solution: ['«Вследствие» — производный предлог причины, пишется слитно, на конце «е».'],
			simple: 'Если можно заменить на «из-за» — пиши слитно: вследствие, ввиду, насчёт.'
		},
		{
			topic: 'grammar',
			text: 'Укажите слово, в котором пишется Ъ:',
			answer: 'под…езд',
			traps: [
				{ value: 'в…юга', why: 'Ь пишется в корне перед е, ё, ю, я: «вьюга».' },
				{ value: 'солов…и', why: 'Здесь разделительный Ь: «соловьи».' },
				{ value: 'руж…ё', why: 'В корне пишется Ь: «ружьё».' }
			],
			solution: [
				'Ъ пишется после приставки на согласный перед е, ё, ю, я.',
				'«Под-» — приставка, значит «подъезд».'
			],
			simple: 'Ъ — «стенка» между приставкой и корнем. Есть приставка перед «е, ё, ю, я» — ставь Ъ.'
		}
	]
};

export function canGenerate(topic: TopicId) {
	return topic in math || topic in verbal;
}

export function generateSimilar(
	topic: TopicId,
	exam: ExamId = 'ort',
	exceptText?: string
): Question | null {
	const make = math[topic];
	if (make) {
		let draft = make();
		for (let i = 0; i < 5 && draft.text === exceptText; i++) draft = make();
		return assemble(exam, draft);
	}
	const pool = verbal[topic]?.filter((d) => d.text !== exceptText || d.passage);
	return pool?.length ? assemble(exam, pick(pool)) : null;
}
