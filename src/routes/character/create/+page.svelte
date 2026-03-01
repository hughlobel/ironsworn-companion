<script lang="ts">
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { characterStore } from '$lib/stores/character.svelte';
	import { campaignStore } from '$lib/stores/campaign.svelte';
	import type { Stat, Stats, CharacterAsset } from '$lib/data/types';
	import { defaultStats } from '$lib/data/types';
	import { ASSETS, assetCategoryLabel } from '$lib/data/assets';
	import StatBlock from '$lib/components/character/StatBlock.svelte';

	let name = $state('');
	let stats = $state<Stats>({ edge: 1, heart: 1, iron: 1, shadow: 1, wits: 1 });
	let selectedAssets = $state<string[]>([]);
	let step = $state(1);

	// Ironsworn: distribute array [3, 2, 2, 1, 1] across 5 stats
	const STAT_ARRAY = [3, 2, 2, 1, 1];
	const statPoints = $derived(Object.values(stats).reduce((a, b) => a + b, 0));
	const targetPoints = STAT_ARRAY.reduce((a, b) => a + b, 0); // 9

	function setStat(stat: Stat, value: number) {
		const clamped = Math.max(1, Math.min(4, value));
		stats = { ...stats, [stat]: clamped };
	}

	function isValid() {
		return name.trim() && statPoints === targetPoints && selectedAssets.length >= 1;
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
				Distribute your stats. Arrange the values 3, 2, 2, 1, 1 among your five stats.
				Current total: {statPoints}/{targetPoints}
			</p>
			<StatBlock {stats} editable onchange={setStat} />
			<div class="flex gap-sm mt-lg">
				<button class="btn" onclick={() => step = 1}>Back</button>
				<button class="btn btn-primary" disabled={statPoints !== targetPoints} onclick={() => step = 3}>
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
