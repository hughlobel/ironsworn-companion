<script lang="ts">
	import type { DelveSite, TrackRank } from '$lib/data/types';
	import { RANK_PROGRESS } from '$lib/data/types';
	import { getBoxes, getProgressScore } from '$lib/engine/progress';
	import { progressRoll, outcomeLabel } from '$lib/engine/dice';
	import { DENIZEN_LABELS, rollDenizen } from '$lib/engine/delve';
	import { campaignStore } from '$lib/stores/campaign.svelte';
	import RollResult from '../dice/RollResult.svelte';

	let { site, onupdate, onremove }: {
		site: DelveSite;
		onupdate?: (s: DelveSite) => void;
		onremove?: () => void;
	} = $props();

	let expanded = $state(false);
	let showDenizens = $state(false);
	let lastRoll = $state<ReturnType<typeof progressRoll> | null>(null);
	let lastDenizenRoll = $state<{ index: number; name: string } | null>(null);
	let editing = $state(false);
	let editNotes = $state('');
	let editObjective = $state('');

	const boxes = $derived(getBoxes(site.ticks));
	const progressScore = $derived(getProgressScore(site.ticks));

	const rankColors: Record<TrackRank, string> = {
		troublesome: '#4ade80',
		dangerous: '#facc15',
		formidable: '#fb923c',
		extreme: '#f87171',
		epic: '#c084fc'
	};

	function markProgress() {
		const ticksToAdd = RANK_PROGRESS[site.rank];
		const newTicks = Math.min(site.ticks + ticksToAdd, 40);
		onupdate?.({ ...site, ticks: newTicks });
		campaignStore.logTrackUpdate(
			`Marked progress on delve "${site.name}" (${site.ticks} -> ${newTicks} ticks)`,
			site.id
		);
	}

	function locateObjective() {
		const roll = progressRoll(site.ticks);
		roll.trackName = site.name;
		lastRoll = roll;
		const matchText = roll.isMatch ? ' (MATCH!)' : '';
		campaignStore.logRoll(
			`Locate Your Objective for "${site.name}": ${outcomeLabel(roll.outcome)}${matchText} (${progressScore} vs ${roll.challengeDie1}, ${roll.challengeDie2})`,
			roll
		);
	}

	function completeSite() {
		onupdate?.({ ...site, completed: true });
		campaignStore.logTrackUpdate(`Completed delve site "${site.name}"`, site.id);
	}

	function denizenRoll() {
		lastDenizenRoll = rollDenizen(site.denizens);
		campaignStore.addJournalEntry('oracle', `Denizen roll for "${site.name}": ${lastDenizenRoll.name} (slot ${lastDenizenRoll.index + 1}: ${DENIZEN_LABELS[lastDenizenRoll.index]})`);
	}

	function updateDenizen(index: number, value: string) {
		const newDenizens = [...site.denizens];
		newDenizens[index] = value;
		onupdate?.({ ...site, denizens: newDenizens });
	}

	function startEdit() {
		editNotes = site.notes;
		editObjective = site.objective;
		editing = true;
	}

	function saveEdit() {
		onupdate?.({ ...site, notes: editNotes, objective: editObjective });
		editing = false;
	}
</script>

<div class="site-card card" class:completed={site.completed}>
	<div class="site-header" onclick={() => expanded = !expanded}>
		<div class="site-info">
			<h4 class="site-name">{site.name}</h4>
			<div class="site-badges">
				<span class="site-badge theme-badge">{site.theme}</span>
				<span class="site-badge domain-badge">{site.domain}</span>
				<span class="site-rank" style="color: {rankColors[site.rank]}">{site.rank}</span>
			</div>
		</div>
		<div class="site-right">
			<span class="site-score font-mono">{progressScore}/10</span>
			<span class="expand-icon">{expanded ? '▾' : '▸'}</span>
		</div>
	</div>

	{#if site.objective && !expanded}
		<p class="site-objective">{site.objective}</p>
	{/if}

	<div class="progress-track">
		{#each Array(10) as _, i}
			{@const boxTicks = Math.max(0, Math.min(4, site.ticks - i * 4))}
			<div class="progress-box" class:filled={boxTicks === 4}>
				{#if boxTicks >= 1 && boxTicks < 4}<div class="tick tick-1"></div>{/if}
				{#if boxTicks >= 2 && boxTicks < 4}<div class="tick tick-2"></div>{/if}
				{#if boxTicks >= 3 && boxTicks < 4}<div class="tick tick-3"></div>{/if}
			</div>
		{/each}
	</div>

	{#if !site.completed}
		<div class="site-actions">
			<button class="btn btn-sm" onclick={markProgress}>Mark Progress</button>
			<button class="btn btn-sm" onclick={locateObjective}>Locate Objective</button>
			<button class="btn btn-sm" onclick={() => showDenizens = !showDenizens}>
				{showDenizens ? 'Hide Denizens' : 'Denizens'}
			</button>
			<button class="btn btn-sm" onclick={denizenRoll}>Roll Denizen</button>
		</div>
	{:else}
		<span class="completed-badge">Completed</span>
	{/if}

	{#if lastRoll}
		<RollResult roll={lastRoll} />
		<div class="roll-outcome-actions">
			{#if lastRoll.outcome === 'strong_hit'}
				<button class="btn btn-sm" onclick={completeSite}>Mark Complete</button>
			{/if}
		</div>
	{/if}

	{#if lastDenizenRoll}
		<div class="denizen-result">
			Denizen: <strong>{lastDenizenRoll.name}</strong>
			<span class="text-muted text-sm">({DENIZEN_LABELS[lastDenizenRoll.index]})</span>
		</div>
	{/if}

	{#if expanded}
		<div class="site-details">
			{#if site.objective}<div class="detail-row"><span class="detail-label">Objective</span> {site.objective}</div>{/if}
			{#if site.notes}<div class="detail-row"><span class="detail-label">Notes</span> {site.notes}</div>{/if}
		</div>

		{#if !editing}
			<div class="site-edit-actions">
				<button class="btn btn-sm" onclick={startEdit}>Edit</button>
				{#if onremove}
					<button class="btn btn-sm btn-danger" onclick={onremove}>Remove</button>
				{/if}
			</div>
		{:else}
			<div class="site-edit-form">
				<label>Objective</label>
				<input bind:value={editObjective} />
				<label>Notes</label>
				<textarea bind:value={editNotes} rows="3"></textarea>
				<div class="edit-actions">
					<button class="btn btn-sm btn-primary" onclick={saveEdit}>Save</button>
					<button class="btn btn-sm" onclick={() => editing = false}>Cancel</button>
				</div>
			</div>
		{/if}
	{/if}

	{#if showDenizens}
		<div class="denizen-table">
			<h5 class="denizen-title">Denizen Table</h5>
			{#each site.denizens as denizen, i}
				<div class="denizen-row">
					<span class="denizen-label">{DENIZEN_LABELS[i]}</span>
					<input
						class="denizen-input"
						value={denizen}
						placeholder="Enter denizen..."
						oninput={(e) => updateDenizen(i, (e.target as HTMLInputElement).value)}
					/>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.site-card {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}
	.site-card.completed {
		opacity: 0.6;
	}
	.site-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		cursor: pointer;
	}
	.site-name {
		font-size: 14px;
		font-weight: 700;
	}
	.site-badges {
		display: flex;
		gap: var(--space-xs);
		align-items: center;
		margin-top: 2px;
	}
	.site-badge {
		font-size: 10px;
		padding: 1px 6px;
		border-radius: var(--radius-sm);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}
	.theme-badge {
		background: #c084fc22;
		color: #c084fc;
	}
	.domain-badge {
		background: #60a5fa22;
		color: #60a5fa;
	}
	.site-rank {
		font-size: 11px;
		text-transform: uppercase;
		font-weight: 600;
	}
	.site-right {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
	}
	.site-score {
		font-size: 20px;
		font-weight: 700;
		color: var(--accent);
	}
	.expand-icon {
		color: var(--text-muted);
		font-size: 12px;
	}
	.site-objective {
		font-size: 12px;
		color: var(--text-secondary);
		font-style: italic;
	}
	.site-actions {
		display: flex;
		gap: var(--space-xs);
		flex-wrap: wrap;
	}
	.completed-badge {
		font-size: 12px;
		font-weight: 700;
		color: var(--strong-hit);
		text-transform: uppercase;
	}
	.roll-outcome-actions {
		margin-top: var(--space-xs);
	}
	.denizen-result {
		font-size: 13px;
		padding: var(--space-sm);
		background: var(--bg-raised);
		border-radius: var(--radius-sm);
	}
	.site-details {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}
	.detail-row {
		font-size: 13px;
		color: var(--text-secondary);
	}
	.detail-label {
		font-weight: 600;
		color: var(--text-muted);
		text-transform: uppercase;
		font-size: 10px;
		letter-spacing: 0.5px;
		margin-right: var(--space-xs);
	}
	.site-edit-actions {
		display: flex;
		gap: var(--space-xs);
	}
	.site-edit-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}
	.site-edit-form input, .site-edit-form textarea {
		width: 100%;
	}
	.edit-actions {
		display: flex;
		gap: var(--space-xs);
		margin-top: var(--space-xs);
	}
	.denizen-table {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
		padding: var(--space-sm);
		background: var(--bg-raised);
		border-radius: var(--radius-sm);
	}
	.denizen-title {
		font-size: 12px;
		font-weight: 700;
		color: var(--text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}
	.denizen-row {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
	}
	.denizen-label {
		font-size: 11px;
		font-weight: 600;
		color: var(--text-muted);
		min-width: 90px;
		flex-shrink: 0;
	}
	.denizen-input {
		flex: 1;
		font-size: 12px;
		padding: var(--space-xs) var(--space-sm);
	}
</style>
