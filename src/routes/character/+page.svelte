<script lang="ts">
	import { characterStore } from '$lib/stores/character.svelte';
	import { campaignStore } from '$lib/stores/campaign.svelte';
	import StatBlock from '$lib/components/character/StatBlock.svelte';
	import MeterTrack from '$lib/components/character/MeterTrack.svelte';
	import ConditionToggle from '$lib/components/character/ConditionToggle.svelte';
	import AssetCard from '$lib/components/character/AssetCard.svelte';
	import Modal from '$lib/components/shared/Modal.svelte';
	import { getBoxes, getProgressScore } from '$lib/engine/progress';
	import { progressRoll, outcomeLabel } from '$lib/engine/dice';
	import RollResult from '$lib/components/dice/RollResult.svelte';
	import type { Stat, DebilityKey, CharacterAsset, ProgressRoll } from '$lib/data/types';

	let bondsRoll = $state<ProgressRoll | null>(null);

	function rollBonds() {
		const roll = progressRoll(characterStore.bonds);
		roll.trackName = 'Bonds';
		bondsRoll = roll;
		const matchText = roll.isMatch ? ' (MATCH!)' : '';
		campaignStore.logRoll(
			`Write Your Epilogue: ${outcomeLabel(roll.outcome)}${matchText} (${getProgressScore(characterStore.bonds)} vs ${roll.challengeDie1}, ${roll.challengeDie2})`,
			roll
		);
	}
	import { ASSETS, getAssetsByCategory, assetCategoryLabel } from '$lib/data/assets';
	import { base } from '$app/paths';
	import { downloadCampaignFile, uploadCampaignFile, clearLocalStorage } from '$lib/stores/persistence.svelte';
	import { goto } from '$app/navigation';

	let confirmingReset = $state(false);
	let showAssetBrowser = $state(false);

	const ownedAssetIds = $derived(new Set(characterStore.assets.map(a => a.definitionId)));

	function addAssetById(id: string) {
		const def = ASSETS.find(a => a.id === id);
		if (!def || ownedAssetIds.has(id)) return;
		const asset: CharacterAsset = {
			definitionId: id,
			abilities: def.abilities.map((_, i) => i === 0),
			trackValue: def.track?.max
		};
		characterStore.addAsset(asset);
		campaignStore.addJournalEntry('narrative', `Acquired asset: ${def.name}`);
		showAssetBrowser = false;
	}

	function newCampaign() {
		campaignStore.reset();
		clearLocalStorage();
		confirmingReset = false;
		goto(`${base}/character/create`);
	}

	const debilityGroups = [
		{ label: 'Conditions', keys: ['wounded', 'shaken', 'unprepared', 'encumbered'] as DebilityKey[] },
		{ label: 'Banes', keys: ['maimed', 'corrupted'] as DebilityKey[] },
		{ label: 'Burdens', keys: ['cursed', 'tormented'] as DebilityKey[] }
	];

	function adjustMeter(meter: string, delta: number) {
		const old = characterStore.meters[meter as keyof typeof characterStore.meters];
		switch (meter) {
			case 'health': characterStore.adjustHealth(delta); break;
			case 'spirit': characterStore.adjustSpirit(delta); break;
			case 'supply': characterStore.adjustSupply(delta); break;
			case 'momentum': characterStore.adjustMomentum(delta); break;
		}
		const newVal = characterStore.meters[meter as keyof typeof characterStore.meters];
		if (old !== newVal) {
			campaignStore.logMeterChange(`${meter}: ${old} → ${newVal}`, meter, old, newVal);
		}
	}

	const bondBoxes = $derived(getBoxes(characterStore.bonds));
</script>

{#if !characterStore.initialized}
	<div class="empty-state card" style="max-width: 400px; margin: 80px auto; text-align: center; padding: var(--space-2xl);">
		<h2>No Character</h2>
		<p class="text-secondary">Create a character to begin, or import an existing campaign.</p>
		<a href="{base}/character/create" class="btn btn-primary" style="text-decoration: none;">Create Character</a>
		<button class="btn" onclick={() => uploadCampaignFile()}>Import JSON</button>
	</div>
{:else}
	<div class="character-sheet">
		<div class="page-header">
			<h2>{characterStore.name}</h2>
			<p>Experience: {characterStore.experience} ({characterStore.availableExperience} available)</p>
		</div>

		<section class="section">
			<h3 class="section-title">Stats</h3>
			<StatBlock
				stats={characterStore.stats}
				editable={false}
			/>
		</section>

		<section class="section">
			<h3 class="section-title">Condition Meters</h3>
			<div class="meters-grid">
				<MeterTrack label="Health" value={characterStore.meters.health} max={5} color="var(--health)"
					onchange={(v) => { const old = characterStore.meters.health; characterStore.setHealth(v); if (old !== v) campaignStore.logMeterChange(`Health: ${old} → ${v}`, 'health', old, v); }} />
				<MeterTrack label="Spirit" value={characterStore.meters.spirit} max={5} color="var(--spirit)"
					onchange={(v) => { const old = characterStore.meters.spirit; characterStore.setSpirit(v); if (old !== v) campaignStore.logMeterChange(`Spirit: ${old} → ${v}`, 'spirit', old, v); }} />
				<MeterTrack label="Supply" value={characterStore.meters.supply} max={5} color="var(--supply)"
					onchange={(v) => { const old = characterStore.meters.supply; characterStore.setSupply(v); if (old !== v) campaignStore.logMeterChange(`Supply: ${old} → ${v}`, 'supply', old, v); }} />
				<MeterTrack label="Momentum" value={characterStore.meters.momentum} min={-6} max={characterStore.maxMomentum} color="var(--momentum)"
					onchange={(v) => { const old = characterStore.meters.momentum; characterStore.setMomentum(v); if (old !== v) campaignStore.logMeterChange(`Momentum: ${old} → ${v}`, 'momentum', old, v); }} />
			</div>
		</section>

		<section class="section">
			<h3 class="section-title">Debilities</h3>
			{#each debilityGroups as group}
				<div class="debility-group">
					<span class="group-label">{group.label}</span>
					<div class="debility-list">
						{#each group.keys as key}
							<ConditionToggle
								label={key}
								active={characterStore.debilities[key]}
								onchange={() => characterStore.toggleDebility(key)}
							/>
						{/each}
					</div>
				</div>
			{/each}
		</section>

		<section class="section">
			<h3 class="section-title">Bonds ({bondBoxes.full}/10, score {getProgressScore(characterStore.bonds)})</h3>
			<div class="progress-track">
				{#each Array(10) as _, i}
					{@const boxTicks = Math.max(0, Math.min(4, characterStore.bonds - i * 4))}
					<div class="progress-box" class:filled={boxTicks === 4}>
						{#if boxTicks >= 1 && boxTicks < 4}<div class="tick tick-1"></div>{/if}
						{#if boxTicks >= 2 && boxTicks < 4}<div class="tick tick-2"></div>{/if}
						{#if boxTicks >= 3 && boxTicks < 4}<div class="tick tick-3"></div>{/if}
					</div>
				{/each}
			</div>
			<div class="flex gap-sm mt-md">
				<button class="btn btn-sm" onclick={() => { characterStore.adjustBonds(-1); campaignStore.logTrackUpdate(`Bonds: removed 1 tick (${characterStore.bonds})`, 'bonds'); }}>-1 Tick</button>
				<button class="btn btn-sm" onclick={() => { characterStore.adjustBonds(1); campaignStore.logTrackUpdate(`Forge a Bond: +1 tick (${characterStore.bonds})`, 'bonds'); }}>Forge a Bond (+1 Tick)</button>
				<button class="btn btn-sm" onclick={rollBonds}>Write Your Epilogue</button>
			</div>
			{#if bondsRoll}
				<div class="mt-md">
					<RollResult roll={bondsRoll} />
				</div>
			{/if}
		</section>

		<section class="section">
			<div class="flex justify-between items-center mb-md">
				<h3 class="section-title" style="margin-bottom: 0;">Assets ({characterStore.assets.length})</h3>
				<button class="btn btn-sm" onclick={() => showAssetBrowser = true}>+ Add Asset</button>
			</div>
			{#if characterStore.assets.length > 0}
				<div class="assets-grid">
					{#each characterStore.assets as asset, i}
						<AssetCard
							{asset}
							ontoggle={(abilityIdx) => characterStore.toggleAssetAbility(i, abilityIdx)}
							ontrackchange={(v) => characterStore.setAssetTrack(i, v)}
							onremove={() => characterStore.removeAsset(i)}
						/>
					{/each}
				</div>
			{:else}
				<p class="text-muted text-sm">No assets yet. Use the Advance move to gain assets.</p>
			{/if}
		</section>

		<Modal open={showAssetBrowser} title="Add Asset" onclose={() => showAssetBrowser = false}>
			<div class="asset-browser">
				{#each [...getAssetsByCategory().entries()] as [category, assets]}
					<div class="browser-category">
						<h4 class="browser-cat-title">{assetCategoryLabel(category)}</h4>
						{#each assets as asset}
							<button
								class="browser-asset-btn"
								disabled={ownedAssetIds.has(asset.id)}
								onclick={() => addAssetById(asset.id)}
							>
								<div class="browser-asset-header">
									<span class="browser-asset-name">{asset.name}</span>
									{#if ownedAssetIds.has(asset.id)}
										<span class="owned-badge">Owned</span>
									{/if}
								</div>
								<p class="browser-asset-desc">{asset.abilities[0].text}</p>
							</button>
						{/each}
					</div>
				{/each}
			</div>
		</Modal>

		<section class="section">
			<h3 class="section-title">Campaign</h3>
			<div class="flex gap-sm">
				<button class="btn" onclick={downloadCampaignFile}>Export JSON</button>
				<button class="btn" onclick={() => uploadCampaignFile()}>Import JSON</button>
				{#if !confirmingReset}
					<button class="btn btn-danger" onclick={() => confirmingReset = true}>New Campaign</button>
				{:else}
					<span class="confirm-group">
						<span class="text-sm" style="color: var(--miss);">Delete this campaign?</span>
						<button class="btn btn-danger btn-sm" onclick={newCampaign}>Yes, start fresh</button>
						<button class="btn btn-sm" onclick={() => confirmingReset = false}>Cancel</button>
					</span>
				{/if}
			</div>
		</section>
	</div>
{/if}

<style>
	.character-sheet {
		max-width: 700px;
		display: flex;
		flex-direction: column;
		gap: var(--space-xl);
	}
	.section-title {
		font-size: 14px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		color: var(--text-muted);
		margin-bottom: var(--space-md);
	}
	.meters-grid {
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
	}
	.debility-group {
		margin-bottom: var(--space-md);
	}
	.group-label {
		font-size: 11px;
		font-weight: 600;
		color: var(--text-muted);
		display: block;
		margin-bottom: var(--space-xs);
	}
	.debility-list {
		display: flex;
		gap: var(--space-xs);
		flex-wrap: wrap;
	}
	.assets-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: var(--space-md);
	}
	.asset-browser {
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
	}
	.browser-cat-title {
		font-size: 12px;
		font-weight: 700;
		text-transform: uppercase;
		color: var(--text-muted);
		margin-bottom: var(--space-sm);
	}
	.browser-asset-btn {
		width: 100%;
		padding: var(--space-sm) var(--space-md);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		background: var(--bg-raised);
		cursor: pointer;
		text-align: left;
		font-family: var(--font-body);
		color: var(--text-primary);
		margin-bottom: var(--space-xs);
		transition: border-color 0.15s;
	}
	.browser-asset-btn:hover:not(:disabled) {
		border-color: var(--accent);
	}
	.browser-asset-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
	.browser-asset-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.browser-asset-name {
		font-weight: 700;
		font-size: 13px;
	}
	.owned-badge {
		font-size: 10px;
		font-weight: 700;
		color: var(--strong-hit);
		text-transform: uppercase;
	}
	.browser-asset-desc {
		font-size: 11px;
		color: var(--text-muted);
		margin-top: 2px;
		line-height: 1.4;
	}
</style>
