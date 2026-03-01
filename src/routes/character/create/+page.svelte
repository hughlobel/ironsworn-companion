<script lang="ts">
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { characterStore } from '$lib/stores/character.svelte';
	import { campaignStore } from '$lib/stores/campaign.svelte';
	import type { Stat, Stats, CharacterAsset } from '$lib/data/types';
	import { defaultStats } from '$lib/data/types';
	import { ASSETS, assetCategoryLabel } from '$lib/data/assets';

	let name = $state('');
	let statAssignments = $state<Record<Stat, number | null>>({
		edge: null, heart: null, iron: null, shadow: null, wits: null
	});
	let selectedAssets = $state<string[]>([]);
	let step = $state(1);

	const STAT_VALUES = [3, 2, 2, 1, 1];
	const STAT_KEYS: Stat[] = ['edge', 'heart', 'iron', 'shadow', 'wits'];

	const assignedCount = $derived(
		STAT_KEYS.filter(k => statAssignments[k] !== null).length
	);
	const allAssigned = $derived(assignedCount === 5);

	// Which values from the pool are still available
	const usedValues = $derived(
		STAT_KEYS.map(k => statAssignments[k]).filter(v => v !== null) as number[]
	);
	const availableValues = $derived(() => {
		const pool = [...STAT_VALUES];
		for (const v of usedValues) {
			const idx = pool.indexOf(v);
			if (idx >= 0) pool.splice(idx, 1);
		}
		return pool;
	});
	const nextValue = $derived(availableValues().length > 0 ? availableValues()[0] : null);

	function assignStat(stat: Stat) {
		if (statAssignments[stat] !== null) {
			// Unassign
			statAssignments = { ...statAssignments, [stat]: null };
		} else if (nextValue !== null) {
			statAssignments = { ...statAssignments, [stat]: nextValue };
		}
	}

	function resetStats() {
		statAssignments = { edge: null, heart: null, iron: null, shadow: null, wits: null };
	}

	const stats = $derived<Stats>({
		edge: statAssignments.edge ?? 0,
		heart: statAssignments.heart ?? 0,
		iron: statAssignments.iron ?? 0,
		shadow: statAssignments.shadow ?? 0,
		wits: statAssignments.wits ?? 0
	});

	function isValid() {
		return name.trim() && allAssigned && selectedAssets.length >= 1;
	}

	function toggleAsset(id: string) {
		if (selectedAssets.includes(id)) {
			selectedAssets = selectedAssets.filter(a => a !== id);
		} else if (selectedAssets.length < 3) {
			selectedAssets = [...selectedAssets, id];
		}
	}

	function createCharacter() {
		if (!isValid()) return;

		const assets: CharacterAsset[] = selectedAssets.map(id => {
			const def = ASSETS.find(a => a.id === id)!;
			return {
				definitionId: id,
				abilities: def.abilities.map((a, i) => i === 0), // first ability enabled
				trackValue: def.track?.max
			};
		});

		characterStore.create(name.trim(), stats, assets);
		campaignStore.setCampaignName(`${name.trim()}'s Campaign`);
		campaignStore.addNarrative(`${name.trim()} sets out into the Ironlands, iron vow in hand.`);
		goto(`${base}/`);
	}

	const assetCategories = $derived(() => {
		const cats = new Map<string, typeof ASSETS>();
		for (const a of ASSETS) {
			if (!cats.has(a.category)) cats.set(a.category, []);
			cats.get(a.category)!.push(a);
		}
		return cats;
	});
</script>

<div class="create-page">
	<div class="page-header">
		<h2>Create Your Character</h2>
		<p>Forge your Ironsworn and begin your journey.</p>
	</div>

	{#if step === 1}
		<section class="step card">
			<h3 class="card-title">Step 1: Name</h3>
			<p class="text-secondary text-sm mb-md">Choose a name for your Ironsworn character.</p>
			<input type="text" bind:value={name} placeholder="Enter character name..." class="w-full" />
			<button class="btn btn-primary mt-lg" disabled={!name.trim()} onclick={() => step = 2}>
				Next
			</button>
		</section>
	{:else if step === 2}
		<section class="step card">
			<h3 class="card-title">Step 2: Stats</h3>
			<p class="text-secondary text-sm mb-md">
				Assign the values <strong>3, 2, 2, 1, 1</strong> to your five stats. Click a stat to assign the next value. Click an assigned stat to unassign it.
			</p>

			{#if nextValue !== null}
				<div class="next-value-hint">
					Assigning: <span class="next-val">{nextValue}</span>
					<span class="text-muted">({availableValues().join(', ')} remaining)</span>
				</div>
			{/if}

			<div class="stat-assign-grid">
				{#each STAT_KEYS as stat}
					<button
						class="stat-assign-btn"
						class:assigned={statAssignments[stat] !== null}
						onclick={() => assignStat(stat)}
					>
						<span class="stat-assign-label">{stat}</span>
						<span class="stat-assign-value">
							{statAssignments[stat] !== null ? statAssignments[stat] : '—'}
						</span>
					</button>
				{/each}
			</div>

			<div class="flex gap-sm mt-lg">
				<button class="btn" onclick={() => step = 1}>Back</button>
				<button class="btn" onclick={resetStats} disabled={assignedCount === 0}>Reset</button>
				<button class="btn btn-primary" disabled={!allAssigned} onclick={() => step = 3}>
					Next
				</button>
			</div>
		</section>
	{:else}
		<section class="step card">
			<h3 class="card-title">Step 3: Assets ({selectedAssets.length}/3)</h3>
			<p class="text-secondary text-sm mb-md">
				Choose 1–3 starting assets. These represent your character's special abilities and companions.
			</p>

			{#each [...assetCategories().entries()] as [category, assets]}
				<div class="asset-category">
					<h4 class="category-title">{assetCategoryLabel(category)}</h4>
					<div class="asset-picker">
						{#each assets as asset}
							<button
								class="asset-pick"
								class:selected={selectedAssets.includes(asset.id)}
								onclick={() => toggleAsset(asset.id)}
								disabled={!selectedAssets.includes(asset.id) && selectedAssets.length >= 3}
							>
								<span class="asset-pick-name">{asset.name}</span>
								<span class="asset-pick-desc">{asset.abilities[0].text.slice(0, 80)}...</span>
							</button>
						{/each}
					</div>
				</div>
			{/each}

			<div class="flex gap-sm mt-lg">
				<button class="btn" onclick={() => step = 2}>Back</button>
				<button class="btn btn-primary" disabled={!isValid()} onclick={createCharacter}>
					Begin Your Journey
				</button>
			</div>
		</section>
	{/if}
</div>

<style>
	.create-page {
		max-width: 600px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: var(--space-xl);
	}
	.step {
		display: flex;
		flex-direction: column;
	}
	.next-value-hint {
		font-size: 13px;
		color: var(--text-secondary);
		margin-bottom: var(--space-md);
	}
	.next-val {
		font-family: var(--font-mono);
		font-weight: 700;
		font-size: 18px;
		color: var(--accent);
	}
	.stat-assign-grid {
		display: flex;
		gap: var(--space-sm);
	}
	.stat-assign-btn {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-xs);
		padding: var(--space-md);
		background: var(--bg-raised);
		border: 2px solid var(--border);
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: border-color 0.15s, background 0.15s;
		font-family: var(--font-body);
		color: var(--text-primary);
	}
	.stat-assign-btn:hover {
		border-color: var(--text-muted);
	}
	.stat-assign-btn.assigned {
		border-color: var(--accent);
		background: var(--accent-glow);
	}
	.stat-assign-label {
		font-size: 11px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		color: var(--text-muted);
	}
	.stat-assign-btn.assigned .stat-assign-label {
		color: var(--accent);
	}
	.stat-assign-value {
		font-size: 28px;
		font-weight: 700;
		font-family: var(--font-mono);
		color: var(--text-muted);
	}
	.stat-assign-btn.assigned .stat-assign-value {
		color: var(--accent);
	}
	.asset-category {
		margin-bottom: var(--space-lg);
	}
	.category-title {
		font-size: 12px;
		font-weight: 700;
		text-transform: uppercase;
		color: var(--text-muted);
		margin-bottom: var(--space-sm);
	}
	.asset-picker {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
		gap: var(--space-xs);
	}
	.asset-pick {
		padding: var(--space-sm);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		background: var(--bg-raised);
		cursor: pointer;
		text-align: left;
		font-family: var(--font-body);
		color: var(--text-primary);
		transition: border-color 0.15s;
	}
	.asset-pick:hover:not(:disabled) {
		border-color: var(--text-muted);
	}
	.asset-pick.selected {
		border-color: var(--accent);
		background: var(--accent-glow);
	}
	.asset-pick:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
	.asset-pick-name {
		font-weight: 700;
		font-size: 13px;
		display: block;
	}
	.asset-pick-desc {
		font-size: 11px;
		color: var(--text-muted);
		display: block;
		margin-top: 2px;
		line-height: 1.4;
	}
</style>
