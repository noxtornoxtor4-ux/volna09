import { error, json } from '@sveltejs/kit';
import { OPENAI_API_KEY, OPENAI_MODEL } from '$app/env/private';
import { builtinTutor, type TutorReply, type TutorRequest } from '#lib/exam/tutor.ts';
import type { RequestHandler } from './$types';

async function askOpenAI(
	{ question, chosen, message }: TutorRequest,
	apiKey: string
): Promise<TutorReply> {
	const response = await fetch('https://api.openai.com/v1/chat/completions', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
		body: JSON.stringify({
			model: OPENAI_MODEL,
			temperature: 0.4,
			max_tokens: 400,
			messages: [
				{
					role: 'system',
					content:
						'Ты — дружелюбный репетитор для школьников 9–11 классов, готовящихся к ОРТ, ЕГЭ и SAT. ' +
						'Объясняй по-русски простыми словами, коротко (до 6 предложений), с бытовой аналогией. ' +
						'Если ученик ошибся, сначала объясни, почему его вариант неверный, затем покажи верный ход мысли. ' +
						'Не используй LaTeX и markdown-заголовки.'
				},
				{
					role: 'user',
					content: JSON.stringify({
						задача: [question.passage, question.text].filter(Boolean).join('\n'),
						варианты: question.options,
						правильный: question.options[question.correct],
						ответ_ученика: chosen !== null ? question.options[chosen] : 'не отвечал',
						разбор: question.solution,
						вопрос_ученика: message || 'Объясни проще, почему так'
					})
				}
			]
		})
	});

	if (!response.ok) throw new Error(`OpenAI ${response.status}`);
	const payload = await response.json();
	return { text: String(payload.choices[0].message.content).trim(), source: 'ai' };
}

export const POST: RequestHandler = async ({ request }) => {
	const body = (await request.json()) as TutorRequest;
	if (!body?.question?.options?.length) error(400, 'Нужна задача');

	if (OPENAI_API_KEY) {
		try {
			return json(await askOpenAI(body, OPENAI_API_KEY));
		} catch (err) {
			console.warn('OpenAI недоступен, отвечаем встроенным разбором:', err);
		}
	}

	return json(builtinTutor(body));
};
