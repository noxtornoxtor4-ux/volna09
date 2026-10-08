<script lang="ts">
	import { onMount } from 'svelte';
	import { DEMO_FLAG } from '#lib/firebase.ts';

	// Включаем демо-версию и открываем вход с готовыми пользователями
	onMount(() => {
		try {
			localStorage.setItem(DEMO_FLAG, '1');
		} catch {
			// без хранилища демо не включится
		}
		location.replace('/login');
	});
</script>
