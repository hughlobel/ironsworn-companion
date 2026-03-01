<script lang="ts">
	import { base } from '$app/paths';
	import { characterStore } from '$lib/stores/character.svelte';
	import { campaignStore } from '$lib/stores/campaign.svelte';
	import { MOVES, MOVE_CATEGORIES, getMovesByCategory } from '$lib/data/moves';
	import MoveCard from '$lib/components/moves/MoveCard.svelte';
	import JournalFeed from '$lib/components/journal/JournalFeed.svelte';
	import OraclePanel from '$lib/components/oracle/OraclePanel.svelte';

	let activeTab = $state<'moves' | 'oracle'>('moves');
	let moveFilter = $state('adventure');
	let moveSearch = $state('');
	const filteredMoves = $derived(getMovesByCategory(moveFilter as any));
	const searchResults = $derived(() => {
		if (!moveSearch.trim()) return [];
		const q = moveSearch.trim().toLowerCase();
		return MOVES.filter(m =>
			m.name.toLowerCase().includes(q) || m.trigger.toLowerCase().includes(q)
		);
	});
</script>

<div class="play-dashboard">
	{#if !characterStore.initialized}
		<div class="empty-state card">
			<h2>Welcome to Ironsworn</h2>
			<p class="text-secondary">Create a character to begin your journey into the Ironlands.</p>
			<a href="{base}/character/create" class="btn btn-primary" style="text-decoration: none;">Create Character</a>
		</div>
	{:else}
		<div class="dashboard-grid">
			<div class="panel-left">
				<div class="panel-tabs">
					<button class="tab" class:active={activeTab === 'moves'} onclick={() => activeTab = 'moves'}>Moves</button>
					<button class="tab" class:active={activeTab === 'oracle'} onclick={() => activeTab = 'oracle'}>Oracle</button>
				</div>

				{#if activeTab === 'moves'}
					<input
						type="text"
						bind:value={moveSearch}
						placeholder="Search moves..."
						class="move-search"
					/>

					{#if moveSearch.trim()}
						<div class="move-list">
							{#each searchResults() as move (move.id)}
								<MoveCard {move} compact />
							{:else}
								<p class="text-muted text-sm">No moves match "{moveSearch}"</p>
							{/each}
						</div>
					{:else}
						<div class="move-filters">
							{#each MOVE_CATEGORIES as cat}
								<button
									class="filter-btn"
									class:active={moveFilter === cat.category}
									onclick={() => moveFilter = cat.category}
								>
									{cat.name}
								</button>
							{/each}
						</div>

						<div class="move-list">
							{#each filteredMoves as move (move.id)}
								<MoveCard {move} compact />
							{/each}
						</div>
					{/if}
				{:else}
					<OraclePanel />
				{/if}
			</div>

			<div class="panel-right">
				<div class="card">
					<h3 class="card-title">Session Log</h3>
				</div>
				<JournalFeed entries={campaignStore.journal} maxEntries={30} />
			</div>
		</div>
	{/if}
</div>

<style>
	.play-dashboard {
		height: 100%;
	}
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-lg);
		padding: var(--space-2xl);
		text-align: center;
		max-width: 400px;
		margin: 80px auto;
	}
	.dashboard-grid {
		display: grid;
		grid-template-columns: 1fr 360px;
		gap: var(--space-lg);
		height: 100%;
	}
	.panel-left {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
		overflow-y: auto;
	}
	.panel-right {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
		overflow-y: auto;
	}
	.panel-tabs {
		display: flex;
		gap: 2px;
		border-bottom: 1px solid var(--border);
	}
	.tab {
		padding: var(--space-sm) var(--space-lg);
		border: none;
		background: transparent;
		color: var(--text-muted);
		font-size: 13px;
		font-weight: 600;
		cursor: pointer;
		border-bottom: 2px solid transparent;
		font-family: var(--font-body);
	}
	.tab.active {
		color: var(--accent);
		border-bottom-color: var(--accent);
	}
	.move-search {
		font-size: 13px;
	}
	.move-filters {
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
	.move-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}

	@media (max-width: 900px) {
		.dashboard-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
