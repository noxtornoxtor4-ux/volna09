# FreelanceShield AI

Хакатон-MVP: экосистема, которая защищает фрилансеров и заказчиков.

- **AI Scope Creep Defender** (`/app/scope`): сверяет сообщения клиента с ТЗ, оценивает допработы и предлагает ответ
- **Smart Milestone Escrow** (`/app/escrow`): этапы с критериями приёмки, авто-выплата через 72 часа
- **Instant Contract & Invoice** (`/app/contracts`): договор и инвойс под 6 юрисдикций, экспорт в PDF
- **Freelancer OS Dashboard** (`/app`): доходы, задачи, индекс выгорания
- Лендинг (`/`) и материалы для жюри (`/pitch`)

## Стек

SvelteKit 3 (Svelte 5), Tailwind CSS 4, Lucide, Bun. ИИ: OpenAI API (необязательно).

## Запуск

```sh
bun install
bun run dev
```

Без `OPENAI_API_KEY` Defender работает на встроенной эвристике. Чтобы включить OpenAI, скопируйте `.env.example` в `.env` и укажите ключ.

## Проверки

```sh
bun run check
bun run lint
bun run build
```
