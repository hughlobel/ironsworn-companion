<script lang="ts">
	import type { TrackRank } from '$lib/data/types';
	import { campaignStore } from '$lib/stores/campaign.svelte';
	import { createSite } from '$lib/engine/delve';
	import DelveSiteCard from '$lib/components/delves/DelveSiteCard.svelte';
	import OracleRollButton from '$lib/components/world/OracleRollButton.svelte';

	const SITE_THEMES = ['Ancient', 'Corrupted', 'Fortified', 'Hallowed', 'Haunted', 'Infested', 'Ravaged', 'Wild'];
	const SITE_DOMAINS = ['Barrow', 'Cavern', 'Frozen Cavern', 'Icereach', 'Mine', 'Pass', 'Ruin', 'Sea Cave', 'Shadowfen', 'Stronghold', 'Tanglewood', 'Underkeep'];
	const RANKS: TrackRank[] = ['troublesome', 'dangerous', 'formidable', 'extreme', 'epic'];

	let showForm = $state(false);
	let siteName = $state('');
	let siteRank = $state<TrackRank>('dangerous');
	let siteObjective = $state('');
	let siteTheme = $state('');
	let siteDomain = $state('');

	const rankColors: Record<TrackRank, string> = {
		troublesome: '#4ade80',
		dangerous: '#facc15',
		formidable: '#fb923c',
		extreme: '#f87171',
		epic: '#c084fc'
	};

	function create() {
		const site = createSite(
			siteName || 'Unnamed Site',
			siteRank,
			siteObjective,
			siteTheme,
			siteDomain
		);
		campaignStore.addSite(site);
		campaignStore.addJournalEntry('narrative', `Discovered a site: ${site.name} (${site.theme} ${site.domain})`);
		resetForm();
	}

	function resetForm() {
		siteName = ''; siteObjective = ''; siteTheme = ''; siteDomain = '';
		siteRank = 'dangerous';
		showForm = false;
	}
</script>

<div class="page-header">
	<h2>Delve Sites</h2>
	<p>Perilous places to explore</p>
</div>

<div class="section-toolbar">
	<button class="btn btn-primary btn-sm" onclick={() => showForm = !showForm}>
		{showForm ? 'Cancel' : '+ New Site'}
	</button>
</div>

{#if showForm}
	<div class="create-form card">
		<div class="form-row">
			<div class="form-field">
				<label>Name</label>
				<div class="field-with-oracle">
					<input bind:value={siteName} placeholder="Site name" />
					<OracleRollButton oracleId="delve-site-name" onresult={(r) => siteName = r} />
				</div>
			</div>
			<div class="form-field">
				<label>Objective</label>
				<input bind:value={siteObjective} placeholder="What do you seek?" />
			</div>
		</div>

		<div class="form-field">
			<label>Rank</label>
			<div class="rank-chips">
				{#each RANKS as rank}
					<button
						class="rank-chip"
						class:active={siteRank === rank}
						style="--rank-color: {rankColors[rank]}"
						onclick={() => siteRank = rank}
					>
						{rank}
					</button>
				{/each}
			</div>
		</div>

		<div class="form-row">
			<div class="form-field">
				<label>Theme</label>
				<select bind:value={siteTheme}>
					<option value="">Select theme...</option>
					{#each SITE_THEMES as theme}
						<option value={theme}>{theme}</option>
					{/each}
				</select>
			</div>
			<div class="form-field">
				<label>Domain</label>
				<select bind:value={siteDomain}>
					<option value="">Select domain...</option>
					{#each SITE_DOMAINS as domain}
						<option value={domain}>{domain}</option>
					{/each}
				</select>
			</div>
		</div>

		<button class="btn btn-primary" onclick={create}>Create Site</button>
	</div>
{/if}

{#if campaignStore.activeSites.length > 0}
	<div class="sites-section">
		<h3 class="section-title">Active Sites</h3>
		<div class="site-list">
			{#each campaignStore.activeSites as site (site.id)}
				<DelveSiteCard
					{site}
					onupdate={(updated) => campaignStore.updateSite(site.id, () => updated)}
					onremove={() => campaignStore.removeSite(site.id)}
				/>
			{/each}
		</div>
	</div>
{/if}

{#if campaignStore.completedSites.length > 0}
	<div class="sites-section">
		<h3 class="section-title">Completed Sites</h3>
		<div class="site-list">
			{#each campaignStore.completedSites as site (site.id)}
				<DelveSiteCard
					{site}
					onupdate={(updated) => campaignStore.updateSite(site.id, () => updated)}
					onremove={() => campaignStore.removeSite(site.id)}
				/>
			{/each}
		</div>
	</div>
{/if}

{#if campaignStore.sites.length === 0 && !showForm}
	<p class="empty-state text-muted">No delve sites yet. Create one to begin exploring perilous places.</p>
{/if}

<style>
	.section-toolbar {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		margin-bottom: var(--space-lg);
	}
	.create-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
		margin-bottom: var(--space-lg);
	}
	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-md);
	}
	@media (max-width: 600px) {
		.form-row { grid-template-columns: 1fr; }
	}
	.form-field {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}
	.form-field input, .form-field select {
		width: 100%;
	}
	.field-with-oracle {
		display: flex;
		gap: var(--space-xs);
		align-items: center;
	}
	.field-with-oracle input {
		flex: 1;
	}
	.rank-chips {
		display: flex;
		gap: var(--space-xs);
		flex-wrap: wrap;
	}
	.rank-chip {
		padding: var(--space-xs) var(--space-md);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		background: var(--bg-raised);
		color: var(--text-secondary);
		font-size: 12px;
		font-weight: 600;
		text-transform: capitalize;
		cursor: pointer;
		transition: all 0.15s;
		font-family: var(--font-body);
	}
	.rank-chip:hover {
		background: var(--bg-overlay);
	}
	.rank-chip.active {
		color: var(--rank-color);
		border-color: var(--rank-color);
		background: color-mix(in srgb, var(--rank-color) 10%, var(--bg-raised));
	}
	.sites-section {
		margin-bottom: var(--space-xl);
	}
	.section-title {
		font-size: 14px;
		font-weight: 700;
		color: var(--text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.5px;
		margin-bottom: var(--space-md);
	}
	.site-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}
	.empty-state {
		font-size: 13px;
		padding: var(--space-xl);
		text-align: center;
	}
</style>
