export interface BurnoutInput {
	hoursPerWeek: number;
	weekendsWorked: number;
	lateNightPercent: number;
	daysSinceVacation: number;
}

export interface BurnoutResult {
	score: number;
	level: 'low' | 'medium' | 'high';
	label: string;
	advice: string;
}

const clamp = (value: number) => Math.min(Math.max(value, 0), 1);

// Веса подобраны вручную для демо: переработки и отсутствие отпуска влияют сильнее всего.
export function burnoutIndex(input: BurnoutInput): BurnoutResult {
	const score = Math.round(
		clamp((input.hoursPerWeek - 35) / 35) * 35 +
			clamp(input.weekendsWorked / 8) * 20 +
			clamp(input.lateNightPercent / 50) * 20 +
			clamp(input.daysSinceVacation / 180) * 25
	);

	if (score >= 65) {
		return {
			score,
			level: 'high',
			label: 'Высокий риск',
			advice:
				'Заблокируйте 2 выходных в календаре: Shield автоматически ответит клиентам и сдвинет дедлайны.'
		};
	}
	if (score >= 35) {
		return {
			score,
			level: 'medium',
			label: 'Умеренный',
			advice:
				'Вы работаете после 22:00 чаще обычного. Включите «тихие часы»: сообщения клиентов будут ждать до утра.'
		};
	}
	return {
		score,
		level: 'low',
		label: 'В норме',
		advice: 'Отличный баланс! Можно взять ещё один проект: загрузка позволяет.'
	};
}
