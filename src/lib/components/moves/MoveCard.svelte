<script lang="ts">
	import type { Move, ActionRoll, Stat } from '$lib/data/types';
	import { actionRoll, progressRoll, outcomeLabel } from '$lib/engine/dice';
	import { characterStore } from '$lib/stores/character.svelte';
	import { campaignStore } from '$lib/stores/campaign.svelte';
	import RollResult from '../dice/RollResult.svelte';

	let { move, compact = false }: { move: Move; compact?: boolean } = $props();

	let expanded = $state(!compact);
	let selectedStat = $state<Stat | undefined>(move.stats?.[0]);
	let adds = $state(0);
	let lastRoll = $state<ActionRoll | null>(null);
	let showRoller = $state(false);

	const canRoll = $derived(!!move.stats?.length || move.isProgressMove);

	function doRoll() {
		if (move.isProgressMove) {
			// Progress rolls will be handled from the track page
			return;
		}
		if (!selectedStat) return;
		const statVal = characterStore.stats[selectedStat];
		const roll = actionRoll(
			selectedStat,
			statVal,
			adds,
			characterStore.meters.momentum,
			characterStore.debilities
		);
		roll.moveName = move.name;
		roll.moveId = move.id;
		lastRoll = roll;

		const matchText = roll.isMatch ? ' (MATCH!)' : '';
		campaignStore.logRoll(
			`${move.name} +${selectedStat}: ${outcomeLabel(roll.outcome)}${matchText}`,
			roll
		);
	}

	function doBurn() {
		if (!lastRoll?.canBurnMomentum || !lastRoll.burnOutcome) return;
		const burned = characterStore.burnMomentum();
		campaignStore.addJournalEntry('roll',
			`Burned momentum (${burned}): ${outcomeLabel(lastRoll.outcome)} → ${outcomeLabel(lastRoll.burnOutcome)}`
		);
		lastRoll = { ...lastRoll, outcome: lastRoll.burnOutcome, canBurnMomentum: false };
	}
</script>

<div class="move-card card">
	<button class="move-header" onclick={() => expanded = !expanded}>
		<h4 class="move-name">{move.name}</h4>
		<span class="move-category">{move.category}</span>
		<span class="expand-icon">{expanded ? '▾' : '▸'}</span>
	</button>

	{#if expanded}
		<div class="move-body">
			<p class="move-text">{move.text}</p>

			{#if canRoll && !move.isProgressMove}
				<div class="move-outcomes">
					<div class="outcome-block">
						<span class="outcome-label outcome-strong-hit">Strong Hit</span>
						<p>{move.outcomes.strong_hit}</p>
					</div>
					<div class="outcome-block">
						<span class="outcome-label outcome-weak-hit">Weak Hit</span>
						<p>{move.outcomes.weak_hit}</p>
					</div>
					<div class="outcome-block">
						<span class="outcome-label outcome-miss">Miss</span>
						<p>{move.outcomes.miss}</p>
					</div>
				</div>

				{#if !showRoller}
					<button class="btn btn-primary" onclick={() => showRoller = true}>
						Roll this move
					</button>
				{:else}
					<div class="move-roller">
						{#if move.stats && move.stats.length > 1}
							<div class="stat-pick">
								{#each move.stats as s}
									<button
										class="stat-chip"
										class:selected={selectedStat === s}
										onclick={() => selectedStat = s}
									>
										+{s} ({characterStore.stats[s]})
									</button>
								{/each}
							</div>
						{/if}

						<div class="adds-row">
							<label>Adds</label>
							<button class="meter-btn" onclick={() => adds = Math.max(-2, adds - 1)}>-</button>
							<span class="font-mono">{adds >= 0 ? '+' : ''}{adds}</span>
							<button class="meter-btn" onclick={() => adds = Math.min(4, adds + 1)}>+</button>
							<button class="btn btn-primary" onclick={doRoll} disabled={!selectedStat}>
								Roll +{selectedStat ?? '...'}
							</button>
						</div>

						{#if lastRoll}
							<RollResult roll={lastRoll} onburn={lastRoll.canBurnMomentum ? doBurn : undefined} />

							<div class="outcome-text-display">
								{#if lastRoll.outcome === 'strong_hit'}
									<p class="outcome-strong-hit">{move.outcomes.strong_hit}</p>
								{:else if lastRoll.outcome === 'weak_hit'}
									<p class="outcome-weak-hit">{move.outcomes.weak_hit}</p>
								{:else}
									<p class="outcome-miss">{move.outcomes.miss}</p>
								{/if}
							</div>
						{/if}
					</div>
				{/if}
			{:else if move.isProgressMove}
				<p class="text-muted text-sm">This is a progress move. Roll it from the Tracks page.</p>
			{:else}
				<div class="move-outcomes">
					<p class="text-secondary">{move.outcomes.strong_hit}</p>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.move-card {
		padding: 0;
		overflow: hidden;
	}
	.move-header {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		padding: var(--space-md) var(--space-lg);
		width: 100%;
		border: none;
		background: transparent;
		cursor: pointer;
		text-align: left;
		color: var(--text-primary);
		font-family: var(--font-body);
	}
	.move-header:hover {
		background: var(--bg-raised);
	}
	.move-name {
		flex: 1;
		font-size: 14px;
		font-weight: 700;
	}
	.move-category {
		font-size: 11px;
		text-transform: uppercase;
		color: var(--text-muted);
		letter-spacing: 0.5px;
	}
	.expand-icon {
		color: var(--text-muted);
		font-size: 12px;
	}
	.move-body {
		padding: 0 var(--space-lg) var(--space-lg);
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}
	.move-text {
		font-size: 13px;
		color: var(--text-secondary);
		line-height: 1.6;
	}
	.move-outcomes {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}
	.outcome-block {
		padding: var(--space-sm);
		background: var(--bg-raised);
		border-radius: var(--radius-sm);
	}
	.outcome-block p {
		font-size: 12px;
		color: var(--text-secondary);
		margin-top: 2px;
	}
	.outcome-label {
		font-size: 11px;
		font-weight: 700;
		text-transform: uppercase;
	}
	.move-roller {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		padding: var(--space-md);
		background: var(--bg-raised);
		border-radius: var(--radius-md);
	}
	.stat-pick {
		display: flex;
		gap: var(--space-xs);
		flex-wrap: wrap;
	}
	.stat-chip {
		padding: var(--space-xs) var(--space-sm);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		background: var(--bg-overlay);
		color: var(--text-secondary);
		font-size: 12px;
		cursor: pointer;
		font-family: var(--font-body);
	}
	.stat-chip.selected {
		border-color: var(--accent);
		color: var(--accent);
		background: var(--accent-glow);
	}
	.adds-row {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
	}
	.outcome-text-display {
		padding: var(--space-sm);
		border-radius: var(--radius-sm);
		background: var(--bg-overlay);
	}
	.outcome-text-display p {
		font-size: 13px;
		line-height: 1.5;
	}
</style>
