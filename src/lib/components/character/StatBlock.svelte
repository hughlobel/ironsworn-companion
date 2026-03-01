<script lang="ts">
	import type { Stats, Stat } from '$lib/data/types';

	let { stats, editable = false, onchange }: {
		stats: Stats;
		editable?: boolean;
		onchange?: (stat: Stat, value: number) => void;
	} = $props();

	const statList: { key: Stat; label: string }[] = [
		{ key: 'edge', label: 'Edge' },
		{ key: 'heart', label: 'Heart' },
		{ key: 'iron', label: 'Iron' },
		{ key: 'shadow', label: 'Shadow' },
		{ key: 'wits', label: 'Wits' },
	];
</script>

<div class="stat-block">
	{#each statList as { key, label }}
		<div class="stat-item">
			<span class="stat-label">{label}</span>
			{#if editable}
				<div class="stat-edit">
					<button class="meter-btn" onclick={() => onchange?.(key, stats[key] - 1)}>-</button>
					<span class="stat-value">{stats[key]}</span>
					<button class="meter-btn" onclick={() => onchange?.(key, stats[key] + 1)}>+</button>
				</div>
			{:else}
				<span class="stat-value">{stats[key]}</span>
			{/if}
		</div>
	{/each}
</div>

<style>
	.stat-block {
		display: flex;
		gap: var(--space-md);
	}
	.stat-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-xs);
		flex: 1;
		padding: var(--space-sm);
		background: var(--bg-raised);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
	}
	.stat-label {
		font-size: 10px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		color: var(--text-muted);
	}
	.stat-value {
		font-size: 24px;
		font-weight: 700;
		font-family: var(--font-mono);
		color: var(--accent);
	}
	.stat-edit {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
	}
</style>
