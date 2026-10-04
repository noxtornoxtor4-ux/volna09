import { error, json } from '@sveltejs/kit';
import { OPENAI_API_KEY, OPENAI_MODEL } from '$app/env/private';
import {
	analyzeScopeHeuristic,
	formatMoney,
	type ScopeAnalysis,
	type ScopeBrief,
	type Verdict
} from '#lib/scope/analyzer.ts';
import type { RequestHandler } from './$types';

interface ScopeRequest {
	message: string;
	brief: ScopeBrief;
	revisionsUsed?: number;
}

const VERDICTS: Verdict[] = ['in_scope', 'revision', 'out_of_scope'];

async function analyzeWithOpenAI(
	{ message, brief, revisionsUsed = 0 }: ScopeRequest,
	apiKey: string
): Promise<ScopeAnalysis> {
	const response = await fetch('https://api.openai.com/v1/chat/completions', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
		body: JSON.stringify({
			model: OPENAI_MODEL,
			temperature: 0.2,
			response_format: { type: 'json_object' },
			messages: [
				{
					role: 'system',
					content:
						'Ты — AI Scope Creep Defender. Сравни сообщение клиента с ТЗ фрилансера. ' +
						'Верни JSON: {"verdict":"in_scope|revision|out_of_scope","confidence":0-100,' +
						'"matchedItem":string|null,"reason":string,"estimateHours":number,"suggestedReply":string}. ' +
						'revision — мелкая правка в рамках ТЗ; если включённые раунды правок исчерпаны, это out_of_scope. ' +
						'suggestedReply — вежливый ответ фрилансера клиенту на русском, с ценой для out_of_scope.'
				},
				{
					role: 'user',
					content: JSON.stringify({
						brief,
						revisionsUsed,
						clientMessage: message
					})
				}
			]
		})
	});

	if (!response.ok) throw new Error(`OpenAI ${response.status}`);

	const payload = await response.json();
	const result = JSON.parse(payload.choices[0].message.content);
	const verdict: Verdict = VERDICTS.includes(result.verdict) ? result.verdict : 'in_scope';
	const estimateHours = Number(result.estimateHours) || 0;

	return {
		verdict,
		confidence: Math.round(Number(result.confidence) || 80),
		matchedItem: result.matchedItem ?? null,
		reason: String(result.reason ?? ''),
		estimateHours,
		estimateCost: estimateHours * brief.hourlyRate,
		suggestedReply: String(result.suggestedReply ?? '').replace(
			/\{price\}/g,
			formatMoney(estimateHours * brief.hourlyRate, brief.currency)
		),
		source: 'ai'
	};
}

export const POST: RequestHandler = async ({ request }) => {
	const body = (await request.json()) as ScopeRequest;

	if (!body?.message?.trim() || !body.brief?.items?.length) {
		error(400, 'Нужны сообщение клиента и ТЗ');
	}

	if (OPENAI_API_KEY) {
		try {
			return json(await analyzeWithOpenAI(body, OPENAI_API_KEY));
		} catch (err) {
			console.warn('OpenAI недоступен, используем эвристику:', err);
		}
	}

	return json(analyzeScopeHeuristic(body.message, body.brief, body.revisionsUsed));
};
