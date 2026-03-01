<script lang="ts">
	import type { AssetDefinition, CharacterAsset } from '$lib/data/types';
	import { getAssetById } from '$lib/data/assets';
	import { ASSET_PDF_REFS } from '$lib/data/pdf-index';
	import PdfRefLink from '../reference/PdfRefLink.svelte';

	let { asset, definition, ontoggle, ontrackchange, onremove }: {
		asset: CharacterAsset;
		definition?: AssetDefinition;
		ontoggle?: (abilityIndex: number) => void;
		ontrackchange?: (value: number) => void;
		onremove?: () => void;
	} = $props();

	const def = $derived(definition ?? getAssetById(asset.definitionId));
</script>

{#if def}
	<div class="asset-card card">
		<div class="asset-header">
			<div>
				<div class="asset-name-row">
					<h4 class="asset-name">{asset.customName || def.name}</h4>
					{#if ASSET_PDF_REFS[asset.definitionId]}
						<PdfRefLink ref={ASSET_PDF_REFS[asset.definitionId]} />
					{/if}
				</div>
				<span class="asset-category">{def.category}</span>
			</div>
			{#if onremove}
				<button class="meter-btn" onclick={onremove}>×</button>
			{/if}
		</div>

		{#if def.track}
			<div class="asset-track">
				<span class="track-label">{def.track.label}</span>
				<div class="track-pips">
					{#each Array(def.track.max - def.track.min + 1) as _, i}
						{@const val = def.track.min + i}
						<button
							class="pip"
							class:active={val <= (asset.trackValue ?? def.track.max)}
							onclick={() => ontrackchange?.(val)}
						>{val}</button>
					{/each}
				</div>
			</div>
		{/if}

		<div class="asset-abilities">
			{#each def.abilities as ability, i}
				<div class="ability-row" class:enabled={asset.abilities[i]}>
					<button class="ability-toggle" onclick={() => ontoggle?.(i)}>
						{asset.abilities[i] ? '◆' : '◇'}
					</button>
					<p class="ability-text">{ability.text}</p>
				</div>
			{/each}
		</div>
	</div>
{/if}

<style>
	.asset-card {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}
	.asset-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
	}
	.asset-name-row {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
	}
	.asset-name {
		font-size: 14px;
		font-weight: 700;
	}
	.asset-category {
		font-size: 10px;
		text-transform: uppercase;
		color: var(--text-muted);
		letter-spacing: 0.5px;
	}
	.asset-track {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
	}
	.track-label {
		font-size: 11px;
		font-weight: 600;
		color: var(--text-muted);
		text-transform: uppercase;
	}
	.track-pips {
		display: flex;
		gap: 2px;
	}
	.pip {
		width: 24px;
		height: 24px;
		border: 1px solid var(--border);
		border-radius: 3px;
		background: var(--bg-raised);
		color: var(--text-muted);
		font-size: 11px;
		font-family: var(--font-mono);
		cursor: pointer;
	}
	.pip.active {
		background: var(--health);
		border-color: var(--health);
		color: var(--bg-base);
		font-weight: 700;
	}
	.asset-abilities {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}
	.ability-row {
		display: flex;
		gap: var(--space-sm);
		padding: var(--space-xs);
		border-radius: var(--radius-sm);
	}
	.ability-row:not(.enabled) {
		opacity: 0.5;
	}
	.ability-toggle {
		border: none;
		background: transparent;
		color: var(--accent);
		cursor: pointer;
		font-size: 14px;
		padding: 0;
		flex-shrink: 0;
	}
	.ability-text {
		font-size: 12px;
		color: var(--text-secondary);
		line-height: 1.5;
	}
</style>
