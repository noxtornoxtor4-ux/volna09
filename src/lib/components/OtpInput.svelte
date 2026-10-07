<script lang="ts">
	let {
		value = $bindable(''),
		length = 6,
		disabled = false,
		invalid = false,
		oncomplete
	}: {
		value?: string;
		length?: number;
		disabled?: boolean;
		invalid?: boolean;
		oncomplete?: (code: string) => void;
	} = $props();

	let focused = $state(false);

	// Одно настоящее поле поверх клеток: так работают вставка, автоподстановка кода из SMS и клавиатура
	function input(e: Event) {
		const el = e.currentTarget as HTMLInputElement;
		value = el.value.replace(/\D/g, '').slice(0, length);
		el.value = value;
		if (value.length === length) oncomplete?.(value);
	}
</script>

<div class="relative">
	<div
		class="grid gap-2"
		style="grid-template-columns: repeat({length}, minmax(0, 1fr))"
		aria-hidden="true"
	>
		{#each { length }, i (i)}
			{@const active = focused && i === Math.min(value.length, length - 1) && value.length < length}
			<div
				class="grid aspect-[4/5] max-h-16 place-items-center rounded-2xl border-2 bg-surface-2 text-2xl font-extrabold transition {invalid
					? 'border-pastel-peach-ink'
					: active
						? 'border-accent bg-surface shadow-md'
						: value[i]
							? 'border-accent/60'
							: 'border-line'}"
			>
				{#if value[i]}
					{value[i]}
				{:else if active}
					<span class="h-7 w-0.5 animate-pulse rounded-full bg-ink"></span>
				{/if}
			</div>
		{/each}
	</div>
	<input
		class="absolute inset-0 size-full cursor-text opacity-0"
		type="text"
		inputmode="numeric"
		autocomplete="one-time-code"
		pattern="[0-9]*"
		maxlength={length}
		aria-label="Код из SMS"
		{value}
		{disabled}
		oninput={input}
		onfocus={() => (focused = true)}
		onblur={() => (focused = false)}
	/>
</div>
