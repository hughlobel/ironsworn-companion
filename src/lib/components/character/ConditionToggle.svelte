<script lang="ts">
	let { label, active = false, onchange }: {
		label: string;
		active?: boolean;
		onchange?: () => void;
	} = $props();
</script>

<button class="condition-toggle" class:active onclick={onchange}>
	<span class="toggle-indicator">{active ? '●' : '○'}</span>
	<span class="toggle-label">{label}</span>
</button>

<style>
	.condition-toggle {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
		padding: var(--space-xs) var(--space-sm);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		background: var(--bg-raised);
		cursor: pointer;
		font-family: var(--font-body);
		color: var(--text-muted);
		transition: all 0.15s;
	}
	.condition-toggle:hover {
		border-color: var(--text-muted);
	}
	.condition-toggle.active {
		border-color: var(--miss);
		background: rgba(248, 113, 113, 0.1);
		color: var(--miss);
	}
	.toggle-indicator {
		font-size: 10px;
	}
	.toggle-label {
		font-size: 11px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}
</style>
