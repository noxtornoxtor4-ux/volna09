<script lang="ts">
	import PageHeader from '#lib/components/PageHeader.svelte';
	import ScopeChat from '#lib/components/scope/ScopeChat.svelte';
</script>

<PageHeader
	title="AI Scope Creep Defender"
	subtitle="Отредактируйте ТЗ, ставку и число правок, затем пишите от лица клиента. Каждое сообщение сверяется с договором."
/>

<ScopeChat editable />
