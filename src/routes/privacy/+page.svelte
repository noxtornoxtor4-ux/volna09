<script lang="ts">
	import { tr } from '#lib/i18n.ts';
	import Logo from '#lib/components/Logo.svelte';

	const sections = [
		{
			title: tr('Что мы храним'),
			text: tr(
				'Имя, город, возраст и фото профиля, ваши публикации, заявки, навыки, сертификаты и волонтёрские часы. Почту для входа хранит Firebase — другие пользователи её не видят.'
			)
		},
		{
			title: tr('Зачем'),
			text: tr(
				'Чтобы подбирать мероприятия, связывать волонтёров с организациями и вести подтверждённое портфолио.'
			)
		},
		{
			title: tr('Кто видит'),
			text: tr(
				'Профиль, публикации и подтверждённые часы видны пользователям платформы. В настройках конфиденциальности можно закрыть профиль и скрыть часы. Ответы на анкету видит только организатор мероприятия.'
			)
		},
		{
			title: tr('Проверка сертификатов'),
			text: tr(
				'По ссылке проверки сертификата любой человек увидит имя волонтёра, организацию и число часов — только эти данные.'
			)
		},
		{
			title: tr('Хранение и удаление'),
			text: tr(
				'Данные хранятся в Google Firebase. Чтобы удалить аккаунт и все данные, напишите модератору платформы.'
			)
		},
		{
			title: tr('Дети и подростки'),
			text: tr(
				'Пользователи младше 18 лет подтверждают при регистрации, что родители или опекуны разрешили им участвовать в проектах.'
			)
		}
	];
</script>

<svelte:head><title>{tr('Политика конфиденциальности — Волна')}</title></svelte:head>

<article class="mx-auto max-w-2xl px-5 py-10">
	<Logo />
	<h1 class="mt-8 text-3xl font-extrabold tracking-tight">{tr('Политика конфиденциальности')}</h1>
	<p class="mt-2 text-sm text-muted">{tr('Какие данные мы собираем и как ими пользуемся.')}</p>
	<div class="mt-6 space-y-5">
		{#each sections as s, i (s.title)}
			<section>
				<h2 class="font-extrabold">{i + 1}. {s.title}</h2>
				<p class="mt-1 text-[15px] text-muted">{s.text}</p>
			</section>
		{/each}
	</div>
	<a href="/terms" class="mt-8 inline-block font-semibold text-accent-text"
		>{tr('Условия использования')} →</a
	>
</article>
