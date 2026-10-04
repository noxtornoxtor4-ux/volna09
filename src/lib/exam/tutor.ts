import type { Question } from './types.ts';

export interface TutorRequest {
	question: Question;
	chosen: number | null;
	message?: string;
}

export interface TutorReply {
	text: string;
	source: 'ai' | 'builtin';
}

/** Ответ без внешнего ИИ: собирается из заранее подготовленных разборов задачи */
export function builtinTutor({ question, chosen, message }: TutorRequest): TutorReply {
	const mistake = chosen !== null ? question.mistakes[chosen] : undefined;
	const parts = message
		? [
				`Хороший вопрос! Давай разберём по шагам:`,
				...question.solution.map((s, i) => `${i + 1}. ${s}`),
				question.simple
			]
		: [question.simple, mistake ? `Где была ловушка: ${mistake}` : ''];
	return { text: parts.filter(Boolean).join('\n'), source: 'builtin' };
}

export async function askTutor(request: TutorRequest): Promise<TutorReply> {
	try {
		const response = await fetch('/api/tutor', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(request)
		});
		if (!response.ok) throw new Error(String(response.status));
		return await response.json();
	} catch {
		return builtinTutor(request);
	}
}
