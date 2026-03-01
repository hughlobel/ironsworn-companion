<script lang="ts">
	import type { ActionRoll, Stat } from '$lib/data/types';
	import { actionRoll, outcomeLabel } from '$lib/engine/dice';
	import { characterStore } from '$lib/stores/character.svelte';
	import { campaignStore } from '$lib/stores/campaign.svelte';
	import RollResult from './RollResult.svelte';

	let { stat = undefined, adds = 0, moveName = '', onroll }: {
		stat?: Stat;
		adds?: number;
		moveName?: string;
		onroll?: (roll: ActionRoll) => void;
	} = $props();

	let selectedStat = $state<Stat | undefined>(stat);
	let customAdds = $state(adds);
	let lastRoll = $state<ActionRoll | null>(null);

	const stats: Stat[] = ['edge', 'heart', 'iron', 'shadow', 'wits'];

	function doRoll() {
		if (!selectedStat) return;
		const statVal = characterStore.stats[selectedStat];
		const roll = actionRoll(
			selectedStat,
			statVal,
			customAdds,
			characterStore.meters.momentum,
			characterStore.debilities
		);
		roll.moveName = moveName || undefined;
		lastRoll = roll;

		const matchText = roll.isMatch ? ' (MATCH!)' : '';
		const text = moveName
			? `${moveName}: ${outcomeLabel(roll.outcome)}${matchText} (${roll.actionDie}+${statVal}+${customAdds} vs ${roll.challengeDie1}, ${roll.challengeDie2})`
			: `Action Roll +${selectedStat}: ${outcomeLabel(roll.outcome)}${matchText}`;

		campaignStore.logRoll(text, roll);
		onroll?.(roll);
	}

	function doBurn() {
		if (!lastRoll?.canBurnMomentum || !lastRoll.burnOutcome) return;
		const burned = characterStore.burnMomentum();
		const text = `Burned momentum (${burned}) to upgrade: ${outcomeLabel(lastRoll.outcome)} → ${outcomeLabel(lastRoll.burnOutcome)}`;
		campaignStore.addJournalEntry('roll', text, { burn: true, from: lastRoll.outcome, to: lastRoll.burnOutcome });
		lastRoll = { ...lastRoll, outcome: lastRoll.burnOutcome, canBurnMomentum: false };
	}
</script>

<div class="dice-roller">
	<div class="stat-picker">
		{#each stats as s}
			<button
				class="stat-btn"
				class:selected={selectedStat === s}
				onclick={() => selectedStat = s}
			>
				<span class="stat-name">{s}</span>
				<span class="stat-val">{characterStore.stats[s]}</span>
			</button>
		{/each}
	</div>

	<div class="adds-row">
		<label>Adds</label>
		<button class="meter-btn" onclick={() => customAdds = Math.max(-2, customAdds - 1)}>-</button>
		<span class="font-mono">{customAdds >= 0 ? '+' : ''}{customAdds}</span>
		<button class="meter-btn" onclick={() => customAdds = Math.min(4, customAdds + 1)}>+</button>
		<button class="btn btn-primary" onclick={doRoll} disabled={!selectedStat}>
			Roll +{selectedStat ?? '...'}
		</button>
	</div>

	{#if lastRoll}
		<RollResult roll={lastRoll} onburn={lastRoll.canBurnMomentum ? doBurn : undefined} />
	{/if}
</div>

<style>
	.dice-roller {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}
	.stat-picker {
		display: flex;
		gap: var(--space-xs);
	}
	.stat-btn {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: var(--space-sm);
		background: var(--bg-raised);
		border: 2px solid var(--border);
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition: border-color 0.15s;
		font-family: var(--font-body);
		color: var(--text-primary);
	}
	.stat-btn:hover { border-color: var(--text-muted); }
	.stat-btn.selected { border-color: var(--accent); background: var(--accent-glow); }
	.stat-name {
		font-size: 10px;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		color: var(--text-muted);
	}
	.stat-val {
		font-size: 18px;
		font-weight: 700;
		font-family: var(--font-mono);
	}
	.adds-row {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
	}
</style>
