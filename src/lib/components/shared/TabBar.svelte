<script lang="ts">
	let { tabs, active, onselect }: {
		tabs: { id: string; label: string }[];
		active: string;
		onselect: (id: string) => void;
	} = $props();
</script>

<div class="tab-bar">
	{#each tabs as tab}
		<button
			class="tab-item"
			class:active={active === tab.id}
			onclick={() => onselect(tab.id)}
		>
			{tab.label}
		</button>
	{/each}
</div>

<style>
	.tab-bar {
		display: flex;
		gap: 2px;
		border-bottom: 1px solid var(--border);
		margin-bottom: var(--space-lg);
	}
	.tab-item {
		padding: var(--space-sm) var(--space-lg);
		border: none;
		background: transparent;
		color: var(--text-muted);
		font-size: 13px;
		font-weight: 600;
		cursor: pointer;
		border-bottom: 2px solid transparent;
		transition: color 0.15s, border-color 0.15s;
		font-family: var(--font-body);
	}
	.tab-item:hover {
		color: var(--text-secondary);
	}
	.tab-item.active {
		color: var(--accent);
		border-bottom-color: var(--accent);
	}
</style>
