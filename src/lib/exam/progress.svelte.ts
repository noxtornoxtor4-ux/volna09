import { browser } from '$app/env';
import { toScore } from './catalog.ts';
import type { Attempt, ExamId, Question, TopicId, TopicStat } from './types.ts';

const STORAGE_KEY = 'testboost:progress:v1';

interface PracticeLog {
	date: string;
	topic: TopicId;
	correct: boolean;
}

interface Saved {
	attempts: Attempt[];
	practice: PracticeLog[];
}

const daysAgo = (days: number) => new Date(Date.now() - days * 864e5).toISOString();

function seedAttempt(days: number, accuracy: number, topics: Attempt['topics']): Attempt {
	return {
		id: `seed-${days}`,
		date: daysAgo(days),
		exam: 'ort',
		score: toScore('ort', accuracy),
		accuracy,
		topics
	};
}

/** Демо-история: ученик готовится полтора месяца, слабые места — сравнение величин и грамматика */
const seed: Saved = {
	attempts: [
		seedAttempt(42, 0.36, {
			percent: { correct: 1, total: 3 },
			comparison: { correct: 0, total: 3 },
			analogies: { correct: 2, total: 3 },
			grammar: { correct: 0, total: 2 }
		}),
		seedAttempt(35, 0.42, {
			percent: { correct: 2, total: 3 },
			comparison: { correct: 0, total: 3 },
			reading: { correct: 2, total: 3 },
			grammar: { correct: 1, total: 3 }
		}),
		seedAttempt(28, 0.47, {
			equations: { correct: 2, total: 3 },
			comparison: { correct: 1, total: 3 },
			sentence: { correct: 2, total: 3 }
		}),
		seedAttempt(21, 0.55, {
			fractions: { correct: 2, total: 3 },
			comparison: { correct: 1, total: 3 },
			analogies: { correct: 3, total: 3 },
			grammar: { correct: 1, total: 3 }
		}),
		seedAttempt(12, 0.58, {
			geometry: { correct: 2, total: 3 },
			comparison: { correct: 1, total: 3 },
			reading: { correct: 3, total: 3 }
		}),
		seedAttempt(5, 0.64, {
			percent: { correct: 3, total: 3 },
			equations: { correct: 3, total: 3 },
			comparison: { correct: 1, total: 3 },
			grammar: { correct: 1, total: 3 }
		})
	],
	practice: []
};

function load(): Saved {
	if (!browser) return structuredClone(seed);
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		return raw ? JSON.parse(raw) : structuredClone(seed);
	} catch {
		return structuredClone(seed);
	}
}

export function summarize(
	exam: ExamId,
	questions: Question[],
	answers: (number | null)[]
): Attempt {
	const topics: Partial<Record<TopicId, TopicStat>> = {};
	let correct = 0;
	questions.forEach((q, i) => {
		const stat = (topics[q.topic] ??= { correct: 0, total: 0 });
		stat.total += 1;
		if (answers[i] === q.correct) {
			stat.correct += 1;
			correct += 1;
		}
	});
	const accuracy = questions.length ? correct / questions.length : 0;
	return {
		id: crypto.randomUUID(),
		date: daysAgo(0),
		exam,
		score: toScore(exam, accuracy),
		accuracy,
		topics
	};
}

class Progress {
	attempts = $state<Attempt[]>([]);
	practice = $state<PracticeLog[]>([]);

	constructor() {
		const saved = load();
		this.attempts = saved.attempts;
		this.practice = saved.practice;
	}

	private persist() {
		if (!browser) return;
		try {
			localStorage.setItem(
				STORAGE_KEY,
				JSON.stringify({ attempts: this.attempts, practice: this.practice })
			);
		} catch {
			// приватный режим или переполненное хранилище: прогресс живёт до перезагрузки
		}
	}

	addAttempt(attempt: Attempt) {
		this.attempts.push(attempt);
		this.persist();
	}

	logPractice(topic: TopicId, correct: boolean) {
		this.practice.push({ date: daysAgo(0), topic, correct });
		this.persist();
	}

	reset() {
		const fresh = structuredClone(seed);
		this.attempts = fresh.attempts;
		this.practice = fresh.practice;
		this.persist();
	}

	/** Точность по темам: пробные тесты + тренажёр */
	get mastery() {
		const stats: Partial<Record<TopicId, TopicStat>> = {};
		for (const attempt of this.attempts) {
			for (const [topic, stat] of Object.entries(attempt.topics) as [TopicId, TopicStat][]) {
				const s = (stats[topic] ??= { correct: 0, total: 0 });
				s.correct += stat.correct;
				s.total += stat.total;
			}
		}
		for (const log of this.practice) {
			const s = (stats[log.topic] ??= { correct: 0, total: 0 });
			s.total += 1;
			if (log.correct) s.correct += 1;
		}
		return (Object.entries(stats) as [TopicId, TopicStat][])
			.map(([topic, s]) => ({ topic, ...s, accuracy: s.correct / s.total }))
			.sort((a, b) => a.accuracy - b.accuracy);
	}

	get weakTopics() {
		return this.mastery.filter((m) => m.accuracy < 0.6).map((m) => m.topic);
	}

	history(exam: ExamId) {
		return this.attempts.filter((a) => a.exam === exam);
	}

	/** Прогноз: средняя точность трёх последних попыток плюс бонус за тренажёр */
	forecast(exam: ExamId) {
		const recent = this.history(exam).slice(-3);
		if (!recent.length) return null;
		const avg = recent.reduce((sum, a) => sum + a.accuracy, 0) / recent.length;
		const practiceBonus = Math.min(this.practice.filter((p) => p.correct).length * 0.004, 0.08);
		return toScore(exam, Math.min(avg + practiceBonus, 1));
	}

	get solvedCount() {
		const fromTests = this.attempts.reduce(
			(sum, a) => sum + Object.values(a.topics).reduce((s, t) => s + (t?.total ?? 0), 0),
			0
		);
		return fromTests + this.practice.length;
	}
}

export const progress = new Progress();
