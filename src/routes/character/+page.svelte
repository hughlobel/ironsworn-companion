<script lang="ts">
	import { characterStore } from '$lib/stores/character.svelte';
	import { campaignStore } from '$lib/stores/campaign.svelte';
	import StatBlock from '$lib/components/character/StatBlock.svelte';
	import MeterTrack from '$lib/components/character/MeterTrack.svelte';
	import ConditionToggle from '$lib/components/character/ConditionToggle.svelte';
	import AssetCard from '$lib/components/character/AssetCard.svelte';
	import { getBoxes } from '$lib/engine/progress';
	import type { Stat, DebilityKey } from '$lib/data/types';
	import { base } from '$app/paths';
	import { downloadCampaignFile, uploadCampaignFile, clearLocalStorage } from '$lib/stores/persistence.svelte';
	import { goto } from '$app/navigation';

	let confirmingReset = $state(false);

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
		<p class="text-secondary">Create a character to begin.</p>
		<a href="{base}/character/create" class="btn btn-primary" style="text-decoration: none;">Create Character</a>
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
			<h3 class="section-title">Bonds ({bondBoxes.full}/10)</h3>
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
				<button class="btn btn-sm" onclick={() => characterStore.adjustBonds(-1)}>-1 Tick</button>
				<button class="btn btn-sm" onclick={() => characterStore.adjustBonds(1)}>+1 Tick</button>
			</div>
		</section>

		{#if characterStore.assets.length > 0}
			<section class="section">
				<h3 class="section-title">Assets</h3>
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
			</section>
		{/if}

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
</style>
