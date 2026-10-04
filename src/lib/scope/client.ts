import { analyzeScopeHeuristic, type ScopeAnalysis, type ScopeBrief } from './analyzer';

export async function requestScopeAnalysis(
	message: string,
	brief: ScopeBrief,
	revisionsUsed: number
): Promise<ScopeAnalysis> {
	try {
		const response = await fetch('/api/scope', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ message, brief, revisionsUsed })
		});
		if (!response.ok) throw new Error(String(response.status));
		return await response.json();
	} catch {
		return analyzeScopeHeuristic(message, brief, revisionsUsed);
	}
}
