<script lang="ts">
	import { getOracleById } from '$lib/data/oracles';
	import { rollOracle } from '$lib/engine/oracle';
	import { campaignStore } from '$lib/stores/campaign.svelte';

	let { oracleId, onresult }: {
		oracleId: string;
		onresult: (result: string) => void;
	} = $props();

	function roll() {
		const table = getOracleById(oracleId);
		if (!table) return;
		const oracleRoll = rollOracle(table);
		onresult(oracleRoll.result);
		campaignStore.logRoll(
			`Oracle (${table.name}): ${oracleRoll.result} (${oracleRoll.die})`,
			oracleRoll
		);
	}
</script>

<button class="oracle-roll-btn" onclick={roll} title="Roll oracle">
	🎲
</button>

<style>
	.oracle-roll-btn {
		background: var(--bg-raised);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		cursor: pointer;
		font-size: 14px;
		width: 28px;
		height: 28px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		transition: background 0.15s, border-color 0.15s;
		flex-shrink: 0;
		padding: 0;
	}
	.oracle-roll-btn:hover {
		background: var(--bg-overlay);
		border-color: var(--accent);
	}
	.oracle-roll-btn:active {
		transform: scale(0.95);
	}
</style>
