<script lang="ts">
	import { campaignStore } from '$lib/stores/campaign.svelte';
	import JournalFeed from '$lib/components/journal/JournalFeed.svelte';

	let filterType = $state<string>('all');

	const filteredEntries = $derived(
		filterType === 'all'
			? campaignStore.journal
			: campaignStore.journal.filter(e => e.type === filterType)
	);

	const filters = [
		{ id: 'all', label: 'All' },
		{ id: 'narrative', label: 'Narrative' },
		{ id: 'roll', label: 'Rolls' },
		{ id: 'oracle', label: 'Oracle' },
		{ id: 'meter_change', label: 'Meters' },
		{ id: 'track_update', label: 'Tracks' }
	];
</script>

<div class="journal-page">
	<div class="page-header flex justify-between items-center">
		<div>
			<h2>Journal</h2>
			<p>Session {campaignStore.session} — {campaignStore.journal.length} entries</p>
		</div>
		<button class="btn" onclick={() => campaignStore.newSession()}>
			New Session
		</button>
	</div>

	<div class="filters">
		{#each filters as f}
			<button
				class="filter-btn"
				class:active={filterType === f.id}
				onclick={() => filterType = f.id}
			>
				{f.label}
			</button>
		{/each}
	</div>

	<JournalFeed entries={filteredEntries} maxEntries={200} />
</div>

<style>
	.journal-page {
		max-width: 700px;
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
	}
	.filters {
		display: flex;
		gap: var(--space-xs);
		flex-wrap: wrap;
	}
	.filter-btn {
		padding: var(--space-xs) var(--space-sm);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		background: var(--bg-raised);
		color: var(--text-muted);
		font-size: 12px;
		cursor: pointer;
		font-family: var(--font-body);
	}
	.filter-btn.active {
		border-color: var(--accent);
		color: var(--accent);
		background: var(--accent-glow);
	}
</style>
