export type MilestoneStatus = 'funded' | 'in_progress' | 'review' | 'released';

export interface Criterion {
	label: string;
	done: boolean;
}

export interface Milestone {
	id: number;
	title: string;
	amount: number;
	status: MilestoneStatus;
	criteria: Criterion[];
	reviewHoursLeft: number;
}

export const statusLabels: Record<MilestoneStatus, string> = {
	funded: 'Средства зарезервированы',
	in_progress: 'В работе',
	review: 'На приёмке',
	released: 'Выплачено'
};

export const AUTO_RELEASE_HOURS = 72;

export function createDemoMilestones(): Milestone[] {
	return [
		{
			id: 1,
			title: 'Прототип и структура',
			amount: 300,
			status: 'released',
			reviewHoursLeft: 0,
			criteria: [
				{ label: 'Wireframe 5 секций в Figma', done: true },
				{ label: 'Согласована структура меню', done: true }
			]
		},
		{
			id: 2,
			title: 'Дизайн главной',
			amount: 450,
			status: 'in_progress',
			reviewHoursLeft: AUTO_RELEASE_HOURS,
			criteria: [
				{ label: 'Десктоп-макет в Figma', done: true },
				{ label: 'Мобильная версия макета', done: false },
				{ label: 'UI-кит: цвета, шрифты, кнопки', done: false }
			]
		},
		{
			id: 3,
			title: 'Вёрстка и адаптив',
			amount: 600,
			status: 'funded',
			reviewHoursLeft: AUTO_RELEASE_HOURS,
			criteria: [
				{ label: 'Lighthouse Performance ≥ 90', done: false },
				{ label: 'Адаптив 360–1920px', done: false },
				{ label: 'Форма отправляет заявку в Telegram', done: false }
			]
		},
		{
			id: 4,
			title: 'Запуск',
			amount: 150,
			status: 'funded',
			reviewHoursLeft: AUTO_RELEASE_HOURS,
			criteria: [
				{ label: 'Домен и SSL подключены', done: false },
				{ label: 'Метрика собирает данные', done: false }
			]
		}
	];
}
