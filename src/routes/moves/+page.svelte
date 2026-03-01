<script lang="ts">
	import { MOVES, MOVE_CATEGORIES, getMovesByCategory } from '$lib/data/moves';
	import MoveCard from '$lib/components/moves/MoveCard.svelte';

	let activeCategory = $state('adventure');
	const filteredMoves = $derived(getMovesByCategory(activeCategory as any));
</script>

<div class="moves-page">
	<div class="page-header">
		<h2>Moves</h2>
		<p>All 34 Ironsworn moves organized by category.</p>
	</div>

	<div class="category-tabs">
		{#each MOVE_CATEGORIES as cat}
			<button
				class="cat-btn"
				class:active={activeCategory === cat.category}
				onclick={() => activeCategory = cat.category}
			>
				{cat.name}
				<span class="cat-count">{getMovesByCategory(cat.category).length}</span>
			</button>
		{/each}
	</div>

	<div class="move-list">
		{#each filteredMoves as move (move.id)}
			<MoveCard {move} />
		{/each}
	</div>
</div>

<style>
	.moves-page {
		max-width: 800px;
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
	}
	.category-tabs {
		display: flex;
		gap: var(--space-xs);
		flex-wrap: wrap;
	}
	.cat-btn {
		padding: var(--space-sm) var(--space-md);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		background: var(--bg-surface);
		color: var(--text-secondary);
		font-size: 13px;
		font-weight: 600;
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: var(--space-xs);
		font-family: var(--font-body);
	}
	.cat-btn.active {
		border-color: var(--accent);
		color: var(--accent);
		background: var(--accent-glow);
	}
	.cat-count {
		font-size: 11px;
		background: var(--bg-raised);
		padding: 1px 6px;
		border-radius: 10px;
		color: var(--text-muted);
	}
	.move-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}
</style>
