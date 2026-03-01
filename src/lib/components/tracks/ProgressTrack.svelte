<script lang="ts">
	import type { ProgressTrack, TrackRank } from '$lib/data/types';
	import { RANK_PROGRESS } from '$lib/data/types';
	import { getBoxes, getProgressScore } from '$lib/engine/progress';
	import { progressRoll, outcomeLabel } from '$lib/engine/dice';
	import { campaignStore } from '$lib/stores/campaign.svelte';
	import RollResult from '../dice/RollResult.svelte';

	let { track, onupdate, onremove }: {
		track: ProgressTrack;
		onupdate?: (t: ProgressTrack) => void;
		onremove?: () => void;
	} = $props();

	let lastRoll = $state<ReturnType<typeof progressRoll> | null>(null);

	const boxes = $derived(getBoxes(track.ticks));
	const progressScore = $derived(getProgressScore(track.ticks));

	function markProgress() {
		const ticksToAdd = RANK_PROGRESS[track.rank];
		const newTicks = Math.min(track.ticks + ticksToAdd, 40);
		const updated = { ...track, ticks: newTicks };
		onupdate?.(updated);
		campaignStore.logTrackUpdate(
			`Marked progress on "${track.name}" (${track.ticks}→${newTicks} ticks)`,
			track.id
		);
	}

	function doProgressRoll() {
		const roll = progressRoll(track.ticks);
		roll.trackName = track.name;
		lastRoll = roll;
		const matchText = roll.isMatch ? ' (MATCH!)' : '';
		campaignStore.logRoll(
			`Progress roll for "${track.name}": ${outcomeLabel(roll.outcome)}${matchText} (${progressScore} vs ${roll.challengeDie1}, ${roll.challengeDie2})`,
			roll
		);
	}

	function complete() {
		onupdate?.({ ...track, completed: true });
		campaignStore.logTrackUpdate(`Completed "${track.name}"`, track.id);
	}

	const rankColors: Record<TrackRank, string> = {
		troublesome: '#4ade80',
		dangerous: '#facc15',
		formidable: '#fb923c',
		extreme: '#f87171',
		epic: '#c084fc'
	};
</script>

<div class="track-card card" class:completed={track.completed}>
	<div class="track-header">
		<div class="track-info">
			<h4 class="track-name">{track.name}</h4>
			<span class="track-rank" style="color: {rankColors[track.rank]}">
				{track.rank} {track.type}
			</span>
		</div>
		<span class="track-score font-mono">{progressScore}/10</span>
	</div>

	<div class="progress-track">
		{#each Array(10) as _, i}
			{@const boxTicks = Math.max(0, Math.min(4, track.ticks - i * 4))}
			<div class="progress-box" class:filled={boxTicks === 4}>
				{#if boxTicks >= 1 && boxTicks < 4}
					<div class="tick tick-1"></div>
				{/if}
				{#if boxTicks >= 2 && boxTicks < 4}
					<div class="tick tick-2"></div>
				{/if}
				{#if boxTicks >= 3 && boxTicks < 4}
					<div class="tick tick-3"></div>
				{/if}
			</div>
		{/each}
	</div>

	{#if !track.completed}
		<div class="track-actions">
			<button class="btn btn-sm" onclick={markProgress}>Mark Progress</button>
			<button class="btn btn-sm" onclick={doProgressRoll}>Roll Progress</button>
			{#if onremove}
				<button class="btn btn-sm btn-danger" onclick={onremove}>Remove</button>
			{/if}
		</div>
	{:else}
		<span class="completed-badge">Completed</span>
	{/if}

	{#if lastRoll}
		<RollResult roll={lastRoll} />
		<div class="roll-outcome-text">
			{#if lastRoll.outcome === 'strong_hit'}
				<button class="btn btn-sm" onclick={complete}>Mark Complete</button>
			{/if}
		</div>
	{/if}
</div>

<style>
	.track-card {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}
	.track-card.completed {
		opacity: 0.6;
	}
	.track-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
	}
	.track-name {
		font-size: 14px;
		font-weight: 700;
	}
	.track-rank {
		font-size: 11px;
		text-transform: uppercase;
		font-weight: 600;
	}
	.track-score {
		font-size: 20px;
		font-weight: 700;
		color: var(--accent);
	}
	.track-actions {
		display: flex;
		gap: var(--space-xs);
	}
	.completed-badge {
		font-size: 12px;
		font-weight: 700;
		color: var(--strong-hit);
		text-transform: uppercase;
	}
	.roll-outcome-text {
		margin-top: var(--space-xs);
	}
</style>
