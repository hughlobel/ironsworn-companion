<script lang="ts">
	let { value = 0, min = 0, max = 10, label = '', onchange }: {
		value?: number;
		min?: number;
		max?: number;
		label?: string;
		onchange?: (v: number) => void;
	} = $props();

	function adjust(delta: number) {
		const next = Math.max(min, Math.min(max, value + delta));
		if (next !== value) onchange?.(next);
	}
</script>

<div class="counter">
	{#if label}
		<span class="counter-label">{label}</span>
	{/if}
	<button class="meter-btn" onclick={() => adjust(-1)} disabled={value <= min}>-</button>
	<span class="counter-value">{value}</span>
	<button class="meter-btn" onclick={() => adjust(1)} disabled={value >= max}>+</button>
</div>

<style>
	.counter {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
	}
	.counter-label {
		font-size: 12px;
		font-weight: 600;
		color: var(--text-secondary);
		min-width: 48px;
	}
	.counter-value {
		font-family: var(--font-mono);
		font-weight: 700;
		font-size: 16px;
		min-width: 28px;
		text-align: center;
	}
</style>
