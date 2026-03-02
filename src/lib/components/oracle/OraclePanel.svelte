<script lang="ts">
	import type { OracleYesNoOdds, OracleTable } from '$lib/data/types';
	import { rollOracle, rollYesNo, oddsLabel } from '$lib/engine/oracle';
	import { campaignStore } from '$lib/stores/campaign.svelte';
	import { ORACLE_RULEBOOK_REFS } from '$lib/data/rulebook-index';
	import RulebookRefLink from '../reference/RulebookRefLink.svelte';

	let { table }: { table?: OracleTable } = $props();

	// Yes/No oracle
	let selectedOdds = $state<OracleYesNoOdds>('fifty_fifty');
	let yesNoResult = $state<{ die: number; result: boolean; answer: string } | null>(null);

	// Table oracle
	let tableResult = $state<{ die: number; result: string } | null>(null);

	const oddsList: OracleYesNoOdds[] = ['almost_certain', 'likely', 'fifty_fifty', 'unlikely', 'small_chance'];

	function doYesNo() {
		const r = rollYesNo(selectedOdds);
		yesNoResult = r;
		campaignStore.addJournalEntry('oracle',
			`Oracle (${oddsLabel(selectedOdds)}): ${r.answer} [${r.die}]`
		);
	}

	function doTableRoll() {
		if (!table) return;
		const r = rollOracle(table);
		tableResult = { die: r.die, result: r.result };
		campaignStore.addJournalEntry('oracle',
			`Oracle "${table.name}": ${r.result} [${r.die}]`
		);
	}
</script>

<div class="oracle-panel">
	<div class="yes-no-section card">
		<h4 class="card-title">Ask the Oracle (Yes/No)</h4>
		<div class="odds-picker">
			{#each oddsList as odds}
				<button
					class="odds-btn"
					class:selected={selectedOdds === odds}
					onclick={() => selectedOdds = odds}
				>
					{oddsLabel(odds)}
				</button>
			{/each}
		</div>
		<button class="btn btn-primary" onclick={doYesNo}>Ask</button>

		{#if yesNoResult}
			<div class="oracle-result" class:yes={yesNoResult.result} class:no={!yesNoResult.result}>
				<span class="oracle-die font-mono">[{yesNoResult.die}]</span>
				<span class="oracle-answer">{yesNoResult.answer}</span>
			</div>
		{/if}
	</div>

	{#if table}
		<div class="table-section card">
			<div class="table-header">
				<h4 class="card-title">{table.name}</h4>
				{#if ORACLE_RULEBOOK_REFS[table.id]}
					<RulebookRefLink section={ORACLE_RULEBOOK_REFS[table.id]} />
				{/if}
			</div>
			<button class="btn btn-primary" onclick={doTableRoll}>Roll d{table.d}</button>

			{#if tableResult}
				<div class="oracle-result">
					<span class="oracle-die font-mono">[{tableResult.die}]</span>
					<span class="oracle-answer">{tableResult.result}</span>
				</div>
			{/if}

			<div class="oracle-table">
				{#each table.rows as row}
					<div class="oracle-row" class:highlighted={tableResult && tableResult.die >= row.min && tableResult.die <= row.max}>
						<span class="oracle-range font-mono">{row.min}{row.max !== row.min ? `–${row.max}` : ''}</span>
						<span class="oracle-text">{row.result}</span>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.oracle-panel {
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
	}
	.table-header {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
	}
	.odds-picker {
		display: flex;
		gap: var(--space-xs);
		flex-wrap: wrap;
		margin-bottom: var(--space-sm);
	}
	.odds-btn {
		padding: var(--space-xs) var(--space-sm);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		background: var(--bg-raised);
		color: var(--text-secondary);
		font-size: 12px;
		cursor: pointer;
		font-family: var(--font-body);
	}
	.odds-btn.selected {
		border-color: var(--accent);
		color: var(--accent);
		background: var(--accent-glow);
	}
	.oracle-result {
		display: flex;
		align-items: center;
		gap: var(--space-md);
		padding: var(--space-md);
		margin-top: var(--space-sm);
		background: var(--bg-raised);
		border-radius: var(--radius-md);
		border: 1px solid var(--border);
	}
	.oracle-result.yes { border-color: var(--strong-hit); }
	.oracle-result.no { border-color: var(--miss); }
	.oracle-die {
		color: var(--text-muted);
		font-size: 14px;
	}
	.oracle-answer {
		font-size: 18px;
		font-weight: 700;
	}
	.oracle-result.yes .oracle-answer { color: var(--strong-hit); }
	.oracle-result.no .oracle-answer { color: var(--miss); }
	.oracle-table {
		margin-top: var(--space-sm);
		max-height: 300px;
		overflow-y: auto;
	}
	.oracle-row {
		display: flex;
		gap: var(--space-md);
		padding: 3px var(--space-sm);
		font-size: 12px;
		border-radius: 2px;
	}
	.oracle-row.highlighted {
		background: var(--accent-glow);
	}
	.oracle-range {
		color: var(--text-muted);
		min-width: 48px;
	}
	.oracle-text {
		color: var(--text-secondary);
	}
</style>
