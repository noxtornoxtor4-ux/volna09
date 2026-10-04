import type { ExamId, TopicId } from './types.ts';

export interface ExamInfo {
	id: ExamId;
	name: string;
	full: string;
	flag: string;
	minScore: number;
	maxScore: number;
	durationMinutes: number;
	/** Порог, который стоит показывать как цель (грант / хороший вуз) */
	target: number;
}

export const exams: Record<ExamId, ExamInfo> = {
	ort: {
		id: 'ort',
		name: 'ОРТ',
		full: 'Общереспубликанское тестирование',
		flag: '🇰🇬',
		minScore: 55,
		maxScore: 245,
		durationMinutes: 20,
		target: 170
	},
	ege: {
		id: 'ege',
		name: 'ЕГЭ',
		full: 'ЕГЭ, профильная математика',
		flag: '🇷🇺',
		minScore: 0,
		maxScore: 100,
		durationMinutes: 10,
		target: 80
	},
	sat: {
		id: 'sat',
		name: 'SAT',
		full: 'SAT Math',
		flag: '🇺🇸',
		minScore: 400,
		maxScore: 1600,
		durationMinutes: 10,
		target: 1400
	}
};

export const topics: Record<TopicId, { name: string; section: string }> = {
	percent: { name: 'Проценты', section: 'Математика' },
	equations: { name: 'Уравнения', section: 'Математика' },
	comparison: { name: 'Сравнение величин', section: 'Математика' },
	fractions: { name: 'Дроби', section: 'Математика' },
	geometry: { name: 'Геометрия', section: 'Математика' },
	powers: { name: 'Степени и логарифмы', section: 'Математика' },
	probability: { name: 'Вероятность', section: 'Математика' },
	analogies: { name: 'Аналогии', section: 'Вербальный' },
	sentence: { name: 'Дополнение предложений', section: 'Вербальный' },
	reading: { name: 'Чтение и понимание', section: 'Вербальный' },
	grammar: { name: 'Грамматика', section: 'Вербальный' }
};

export function toScore(exam: ExamId, accuracy: number) {
	const { minScore, maxScore } = exams[exam];
	const raw = minScore + (maxScore - minScore) * accuracy;
	return exam === 'sat' ? Math.round(raw / 10) * 10 : Math.round(raw);
}

export const letters = ['А', 'Б', 'В', 'Г'];
