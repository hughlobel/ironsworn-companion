<script lang="ts">
	import { ORACLE_TABLES, getOraclesByCategory } from '$lib/data/oracles';
	import OraclePanel from '$lib/components/oracle/OraclePanel.svelte';
	import type { OracleTable } from '$lib/data/types';

	let selectedTable = $state<OracleTable | undefined>(undefined);
	const categories = getOraclesByCategory();
</script>

<div class="oracles-page">
	<div class="page-header">
		<h2>Oracles</h2>
		<p>Ask yes/no questions or roll on oracle tables for inspiration.</p>
	</div>

	<div class="oracle-layout">
		<div class="oracle-sidebar">
			<h3 class="section-label">Tables</h3>
			{#each [...categories.entries()] as [category, tables]}
				<div class="table-category">
					<span class="cat-label">{category}</span>
					{#each tables as table}
						<button
							class="table-btn"
							class:active={selectedTable?.id === table.id}
							onclick={() => selectedTable = table}
						>
							{table.name}
						</button>
					{/each}
				</div>
			{/each}
		</div>

		<div class="oracle-main">
			<OraclePanel table={selectedTable} />
		</div>
	</div>
</div>

<style>
	.oracles-page {
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
	}
	.oracle-layout {
		display: grid;
		grid-template-columns: 200px 1fr;
		gap: var(--space-lg);
	}
	.oracle-sidebar {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}
	.section-label {
		font-size: 12px;
		font-weight: 700;
		text-transform: uppercase;
		color: var(--text-muted);
		margin-bottom: var(--space-sm);
	}
	.table-category {
		margin-bottom: var(--space-md);
	}
	.cat-label {
		font-size: 11px;
		font-weight: 600;
		color: var(--text-muted);
		text-transform: uppercase;
		display: block;
		margin-bottom: var(--space-xs);
	}
	.table-btn {
		display: block;
		width: 100%;
		padding: var(--space-xs) var(--space-sm);
		border: none;
		background: transparent;
		color: var(--text-secondary);
		font-size: 13px;
		text-align: left;
		cursor: pointer;
		border-radius: var(--radius-sm);
		font-family: var(--font-body);
	}
	.table-btn:hover {
		background: var(--bg-raised);
	}
	.table-btn.active {
		background: var(--accent-glow);
		color: var(--accent);
	}

	@media (max-width: 700px) {
		.oracle-layout {
			grid-template-columns: 1fr;
		}
	}
</style>
