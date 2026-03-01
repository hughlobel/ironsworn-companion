<script lang="ts">
	let { label, value, min = 0, max = 5, color = 'var(--text-primary)', onchange }: {
		label: string;
		value: number;
		min?: number;
		max?: number;
		color?: string;
		onchange?: (v: number) => void;
	} = $props();

	function setVal(v: number) {
		onchange?.(Math.max(min, Math.min(max, v)));
	}
</script>

<div class="meter-track">
	<div class="meter-header">
		<span class="meter-name" style="color: {color}">{label}</span>
		<span class="meter-val font-mono" style="color: {color}">{value}</span>
	</div>
	<div class="meter-pips">
		{#each Array(max - min + 1) as _, i}
			{@const pipVal = min + i}
			<button
				class="pip"
				class:active={pipVal <= value}
				class:negative={pipVal < 0}
				style={pipVal <= value ? `background: ${color}` : ''}
				onclick={() => setVal(pipVal)}
				title="{pipVal}"
			>
				<span class="pip-label">{pipVal}</span>
			</button>
		{/each}
	</div>
</div>

<style>
	.meter-track {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}
	.meter-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.meter-name {
		font-size: 12px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}
	.meter-val {
		font-size: 18px;
		font-weight: 700;
	}
	.meter-pips {
		display: flex;
		gap: 2px;
	}
	.pip {
		flex: 1;
		height: 24px;
		border: 1px solid var(--border);
		border-radius: 3px;
		background: var(--bg-raised);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background 0.1s;
	}
	.pip:hover {
		border-color: var(--text-muted);
	}
	.pip.active {
		border-color: transparent;
	}
	.pip-label {
		font-size: 9px;
		font-family: var(--font-mono);
		color: var(--text-muted);
	}
	.pip.active .pip-label {
		color: var(--bg-base);
		font-weight: 700;
	}
</style>
