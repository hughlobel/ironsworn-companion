<script lang="ts">
	import type { ActionRoll, ProgressRoll } from '$lib/data/types';
	import { outcomeLabel } from '$lib/engine/dice';

	let { roll, onburn }: {
		roll: ActionRoll | ProgressRoll;
		onburn?: () => void;
	} = $props();

	const outcomeClass = $derived(
		roll.outcome === 'strong_hit' ? 'outcome-strong-hit' :
		roll.outcome === 'weak_hit' ? 'outcome-weak-hit' : 'outcome-miss'
	);

	const isAction = $derived(roll.type === 'action');
	const actionRoll = $derived(roll.type === 'action' ? roll as ActionRoll : null);
	const score = $derived(
		isAction ? (roll as ActionRoll).actionScore : (roll as ProgressRoll).progressScore
	);
</script>

<div class="roll-result">
	<div class="dice-display">
		{#if isAction}
			<div class="die die-action" title="Action die">{actionRoll?.actionDie}</div>
			<span class="score-text">
				{actionRoll?.actionDie}+{actionRoll?.statValue}{actionRoll?.adds ? `+${actionRoll.adds}` : ''} = <strong>{score}</strong>
			</span>
		{:else}
			<span class="score-text">Progress: <strong>{score}</strong></span>
		{/if}

		<span class="vs-text">vs</span>

		<div
			class="die die-challenge"
			class:beaten={score > roll.challengeDie1}
			class:not-beaten={score <= roll.challengeDie1}
			class:match={roll.isMatch}
		>
			{roll.challengeDie1}
		</div>
		<div
			class="die die-challenge"
			class:beaten={score > roll.challengeDie2}
			class:not-beaten={score <= roll.challengeDie2}
			class:match={roll.isMatch}
		>
			{roll.challengeDie2}
		</div>
	</div>

	<div class="outcome-line">
		<span class="outcome-text {outcomeClass}">{outcomeLabel(roll.outcome)}</span>
		{#if roll.isMatch}
			<span class="match-indicator">MATCH</span>
		{/if}
	</div>

	{#if onburn && actionRoll?.canBurnMomentum && actionRoll.burnOutcome}
		<button class="btn burn-btn" onclick={onburn}>
			Burn Momentum → {outcomeLabel(actionRoll.burnOutcome)}
		</button>
	{/if}
</div>

<style>
	.roll-result {
		background: var(--bg-raised);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		padding: var(--space-md);
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}
	.dice-display {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
	}
	.score-text {
		font-size: 14px;
		color: var(--text-secondary);
		font-family: var(--font-mono);
	}
	.vs-text {
		color: var(--text-muted);
		font-size: 12px;
		font-style: italic;
	}
	.outcome-line {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
	}
	.outcome-text {
		font-size: 18px;
		font-weight: 700;
	}
	.burn-btn {
		background: var(--momentum);
		border-color: var(--momentum);
		color: var(--bg-base);
		font-weight: 700;
		animation: pulse 1.5s infinite;
	}
	@keyframes pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.8; }
	}
</style>
