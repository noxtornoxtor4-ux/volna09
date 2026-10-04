export type ExamId = 'ort' | 'ege' | 'sat';

export type TopicId =
	| 'percent'
	| 'equations'
	| 'comparison'
	| 'fractions'
	| 'geometry'
	| 'powers'
	| 'probability'
	| 'analogies'
	| 'sentence'
	| 'reading'
	| 'grammar';

export interface Question {
	id: string;
	exam: ExamId;
	topic: TopicId;
	/** Короткий текст-контекст, например абзац для раздела «Чтение и понимание» */
	passage?: string;
	text: string;
	options: string[];
	correct: number;
	/** Почему именно этот вариант неверный: ключ — индекс варианта */
	mistakes: Record<number, string>;
	/** Пошаговое правильное решение */
	solution: string[];
	/** Объяснение «на пальцах» для кнопки «Объясни проще» */
	simple: string;
}

export interface TopicStat {
	correct: number;
	total: number;
}

export interface Attempt {
	id: string;
	date: string;
	exam: ExamId;
	score: number;
	accuracy: number;
	topics: Partial<Record<TopicId, TopicStat>>;
}
