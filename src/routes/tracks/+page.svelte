<script lang="ts">
	import { campaignStore } from '$lib/stores/campaign.svelte';
	import type { TrackType, TrackRank, ProgressTrack as PT } from '$lib/data/types';
	import { createTrack } from '$lib/engine/progress';
	import ProgressTrack from '$lib/components/tracks/ProgressTrack.svelte';

	let showCreate = $state(false);
	let newName = $state('');
	let newType = $state<TrackType>('vow');
	let newRank = $state<TrackRank>('dangerous');

	function doCreate() {
		if (!newName.trim()) return;
		const track = createTrack(newName.trim(), newType, newRank);
		campaignStore.addTrack(track);
		campaignStore.logTrackUpdate(`Created ${newRank} ${newType}: "${newName.trim()}"`, track.id);
		newName = '';
		showCreate = false;
	}

	function handleUpdate(id: string, updated: PT) {
		campaignStore.updateTrack(id, () => updated);
	}

	function handleRemove(id: string) {
		campaignStore.removeTrack(id);
	}

	const types: { value: TrackType; label: string }[] = [
		{ value: 'vow', label: 'Vow' },
		{ value: 'journey', label: 'Journey' },
		{ value: 'combat', label: 'Combat' },
		{ value: 'relationship', label: 'Relationship' },
		{ value: 'custom', label: 'Custom' }
	];

	const ranks: { value: TrackRank; label: string; desc: string }[] = [
		{ value: 'troublesome', label: 'Troublesome', desc: '3 boxes/mark' },
		{ value: 'dangerous', label: 'Dangerous', desc: '2 boxes/mark' },
		{ value: 'formidable', label: 'Formidable', desc: '1 box/mark' },
		{ value: 'extreme', label: 'Extreme', desc: '2 ticks/mark' },
		{ value: 'epic', label: 'Epic', desc: '1 tick/mark' }
	];
</script>

<div class="tracks-page">
	<div class="page-header flex justify-between items-center">
		<div>
			<h2>Progress Tracks</h2>
			<p>Track your vows, journeys, combat encounters, and relationships.</p>
		</div>
		<button class="btn btn-primary" onclick={() => showCreate = !showCreate}>
			{showCreate ? 'Cancel' : '+ New Track'}
		</button>
	</div>

	{#if showCreate}
		<div class="card create-form">
			<div class="form-row">
				<div class="form-field">
					<label>Name</label>
					<input type="text" bind:value={newName} placeholder="Track name..." class="w-full" />
				</div>
			</div>
			<div class="form-row">
				<div class="form-field">
					<label>Type</label>
					<div class="chip-group">
						{#each types as t}
							<button class="chip" class:active={newType === t.value} onclick={() => newType = t.value}>
								{t.label}
							</button>
						{/each}
					</div>
				</div>
			</div>
			<div class="form-row">
				<div class="form-field">
					<label>Rank</label>
					<div class="chip-group">
						{#each ranks as r}
							<button class="chip" class:active={newRank === r.value} onclick={() => newRank = r.value}>
								{r.label}
								<span class="chip-desc">{r.desc}</span>
							</button>
						{/each}
					</div>
				</div>
			</div>
			<button class="btn btn-primary" disabled={!newName.trim()} onclick={doCreate}>
				Create Track
			</button>
		</div>
	{/if}

	{#if campaignStore.activeTracks.length > 0}
		<section>
			<h3 class="section-label">Active ({campaignStore.activeTracks.length})</h3>
			<div class="track-list">
				{#each campaignStore.activeTracks as track (track.id)}
					<ProgressTrack
						{track}
						onupdate={(t) => handleUpdate(track.id, t)}
						onremove={() => handleRemove(track.id)}
					/>
				{/each}
			</div>
		</section>
	{/if}

	{#if campaignStore.completedTracks.length > 0}
		<section>
			<h3 class="section-label">Completed ({campaignStore.completedTracks.length})</h3>
			<div class="track-list">
				{#each campaignStore.completedTracks as track (track.id)}
					<ProgressTrack {track} onupdate={(t) => handleUpdate(track.id, t)} />
				{/each}
			</div>
		</section>
	{/if}

	{#if campaignStore.tracks.length === 0 && !showCreate}
		<div class="card" style="text-align: center; padding: var(--space-2xl);">
			<p class="text-muted">No progress tracks yet. Swear a vow to get started.</p>
		</div>
	{/if}
</div>

<style>
	.tracks-page {
		max-width: 700px;
		display: flex;
		flex-direction: column;
		gap: var(--space-xl);
	}
	.section-label {
		font-size: 12px;
		font-weight: 700;
		text-transform: uppercase;
		color: var(--text-muted);
		letter-spacing: 0.5px;
		margin-bottom: var(--space-md);
	}
	.track-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}
	.create-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
	}
	.form-row {
		display: flex;
		gap: var(--space-md);
	}
	.form-field {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}
	.chip-group {
		display: flex;
		gap: var(--space-xs);
		flex-wrap: wrap;
	}
	.chip {
		padding: var(--space-xs) var(--space-sm);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		background: var(--bg-raised);
		color: var(--text-secondary);
		cursor: pointer;
		font-size: 12px;
		font-family: var(--font-body);
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	.chip.active {
		border-color: var(--accent);
		color: var(--accent);
		background: var(--accent-glow);
	}
	.chip-desc {
		font-size: 10px;
		color: var(--text-muted);
	}
</style>
