<script lang="ts">
	import type { NPC, Location, Kin } from '$lib/data/types';
	import { campaignStore } from '$lib/stores/campaign.svelte';
	import TabBar from '$lib/components/shared/TabBar.svelte';
	import NpcCard from '$lib/components/world/NpcCard.svelte';
	import LocationCard from '$lib/components/world/LocationCard.svelte';
	import OracleRollButton from '$lib/components/world/OracleRollButton.svelte';

	let activeTab = $state('npcs');
	let showNpcForm = $state(false);
	let showLocationForm = $state(false);
	let npcSearch = $state('');
	let npcFilterBonded = $state(false);

	// NPC form fields
	let npcName = $state('');
	let npcKin = $state<Kin>('Ironlander');
	let npcRole = $state('');
	let npcDescriptor = $state('');
	let npcGoal = $state('');
	let npcDisposition = $state('');
	let npcNotes = $state('');

	// Location form fields
	let locName = $state('');
	let locRegion = $state('');
	let locType = $state('');
	let locDescriptor = $state('');
	let locTrouble = $state('');
	let locNotes = $state('');

	const kinNameOracle: Record<Kin, string> = {
		'Ironlander': 'ironlander-name',
		'Elf': 'elf-name',
		'Giant': 'giant-name',
		'Varou': 'varou-name',
		'Troll': 'troll-name'
	};

	const filteredNpcs = $derived(
		campaignStore.npcs.filter(n => {
			if (npcFilterBonded && !n.isBonded) return false;
			if (npcSearch && !n.name.toLowerCase().includes(npcSearch.toLowerCase())) return false;
			return true;
		})
	);

	function createNpc() {
		const npc: NPC = {
			id: crypto.randomUUID(),
			name: npcName || 'Unnamed',
			kin: npcKin,
			role: npcRole,
			descriptor: npcDescriptor,
			goal: npcGoal,
			disposition: npcDisposition,
			isBonded: false,
			notes: npcNotes
		};
		campaignStore.addNpc(npc);
		campaignStore.addJournalEntry('narrative', `Created NPC: ${npc.name} (${npc.kin} ${npc.role})`);
		resetNpcForm();
	}

	function resetNpcForm() {
		npcName = ''; npcRole = ''; npcDescriptor = ''; npcGoal = ''; npcDisposition = ''; npcNotes = '';
		npcKin = 'Ironlander';
		showNpcForm = false;
	}

	function createLocation() {
		const loc: Location = {
			id: crypto.randomUUID(),
			name: locName || 'Unnamed',
			region: locRegion,
			type: locType,
			descriptor: locDescriptor,
			trouble: locTrouble,
			notes: locNotes
		};
		campaignStore.addLocation(loc);
		campaignStore.addJournalEntry('narrative', `Discovered location: ${loc.name} (${loc.region})`);
		resetLocationForm();
	}

	function resetLocationForm() {
		locName = ''; locRegion = ''; locType = ''; locDescriptor = ''; locTrouble = ''; locNotes = '';
		showLocationForm = false;
	}
</script>

<div class="page-header">
	<h2>World</h2>
	<p>People and places of the Ironlands</p>
</div>

<TabBar
	tabs={[{ id: 'npcs', label: 'NPCs' }, { id: 'locations', label: 'Locations' }]}
	active={activeTab}
	onselect={(id) => activeTab = id}
/>

{#if activeTab === 'npcs'}
	<div class="section-toolbar">
		<button class="btn btn-primary btn-sm" onclick={() => showNpcForm = !showNpcForm}>
			{showNpcForm ? 'Cancel' : '+ New NPC'}
		</button>
		<input class="search-input" placeholder="Search NPCs..." bind:value={npcSearch} />
		<label class="filter-toggle">
			<input type="checkbox" bind:checked={npcFilterBonded} />
			Bonded only
		</label>
	</div>

	{#if showNpcForm}
		<div class="create-form card">
			<div class="form-row">
				<div class="form-field">
					<label>Name</label>
					<div class="field-with-oracle">
						<input bind:value={npcName} placeholder="Name" />
						<OracleRollButton oracleId={kinNameOracle[npcKin]} onresult={(r) => npcName = r} />
					</div>
				</div>
				<div class="form-field">
					<label>Kin</label>
					<select bind:value={npcKin}>
						<option value="Ironlander">Ironlander</option>
						<option value="Elf">Elf</option>
						<option value="Giant">Giant</option>
						<option value="Varou">Varou</option>
						<option value="Troll">Troll</option>
					</select>
				</div>
			</div>
			<div class="form-row">
				<div class="form-field">
					<label>Role</label>
					<div class="field-with-oracle">
						<input bind:value={npcRole} placeholder="Role" />
						<OracleRollButton oracleId="character-role" onresult={(r) => npcRole = r} />
					</div>
				</div>
				<div class="form-field">
					<label>Descriptor</label>
					<div class="field-with-oracle">
						<input bind:value={npcDescriptor} placeholder="Descriptor" />
						<OracleRollButton oracleId="character-descriptor" onresult={(r) => npcDescriptor = r} />
					</div>
				</div>
			</div>
			<div class="form-row">
				<div class="form-field">
					<label>Goal</label>
					<div class="field-with-oracle">
						<input bind:value={npcGoal} placeholder="Goal" />
						<OracleRollButton oracleId="character-goal" onresult={(r) => npcGoal = r} />
					</div>
				</div>
				<div class="form-field">
					<label>Disposition</label>
					<div class="field-with-oracle">
						<input bind:value={npcDisposition} placeholder="Disposition" />
						<OracleRollButton oracleId="character-disposition" onresult={(r) => npcDisposition = r} />
					</div>
				</div>
			</div>
			<div class="form-field">
				<label>Notes</label>
				<textarea bind:value={npcNotes} rows="2" placeholder="Notes about this NPC..."></textarea>
			</div>
			<button class="btn btn-primary" onclick={createNpc}>Create NPC</button>
		</div>
	{/if}

	<div class="entity-list">
		{#each filteredNpcs as npc (npc.id)}
			<NpcCard
				{npc}
				onupdate={(updated) => campaignStore.updateNpc(npc.id, () => updated)}
				onremove={() => campaignStore.removeNpc(npc.id)}
			/>
		{:else}
			<p class="empty-state text-muted">No NPCs yet. Create one to track the people you encounter.</p>
		{/each}
	</div>

{:else if activeTab === 'locations'}
	<div class="section-toolbar">
		<button class="btn btn-primary btn-sm" onclick={() => showLocationForm = !showLocationForm}>
			{showLocationForm ? 'Cancel' : '+ New Location'}
		</button>
	</div>

	{#if showLocationForm}
		<div class="create-form card">
			<div class="form-row">
				<div class="form-field">
					<label>Name</label>
					<div class="field-with-oracle">
						<input bind:value={locName} placeholder="Name" />
						<OracleRollButton oracleId="settlement-name" onresult={(r) => locName = r} />
					</div>
				</div>
				<div class="form-field">
					<label>Region</label>
					<div class="field-with-oracle">
						<input bind:value={locRegion} placeholder="Region" />
						<OracleRollButton oracleId="region" onresult={(r) => locRegion = r} />
					</div>
				</div>
			</div>
			<div class="form-row">
				<div class="form-field">
					<label>Type</label>
					<div class="field-with-oracle">
						<input bind:value={locType} placeholder="Type" />
						<OracleRollButton oracleId="location" onresult={(r) => locType = r} />
					</div>
				</div>
				<div class="form-field">
					<label>Descriptor</label>
					<input bind:value={locDescriptor} placeholder="Descriptor" />
				</div>
			</div>
			<div class="form-field">
				<label>Trouble</label>
				<div class="field-with-oracle">
					<input bind:value={locTrouble} placeholder="Trouble" />
					<OracleRollButton oracleId="settlement-trouble" onresult={(r) => locTrouble = r} />
				</div>
			</div>
			<div class="form-field">
				<label>Notes</label>
				<textarea bind:value={locNotes} rows="2" placeholder="Notes about this location..."></textarea>
			</div>
			<button class="btn btn-primary" onclick={createLocation}>Create Location</button>
		</div>
	{/if}

	<div class="entity-list">
		{#each campaignStore.locations as location (location.id)}
			<LocationCard
				{location}
				onupdate={(updated) => campaignStore.updateLocation(location.id, () => updated)}
				onremove={() => campaignStore.removeLocation(location.id)}
			/>
		{:else}
			<p class="empty-state text-muted">No locations yet. Create one to track places in the Ironlands.</p>
		{/each}
	</div>
{/if}

<style>
	.section-toolbar {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		margin-bottom: var(--space-lg);
		flex-wrap: wrap;
	}
	.search-input {
		flex: 1;
		min-width: 150px;
		max-width: 300px;
	}
	.filter-toggle {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
		font-size: 12px;
		cursor: pointer;
		text-transform: none;
		font-weight: 500;
		color: var(--text-secondary);
	}
	.filter-toggle input[type="checkbox"] {
		width: auto;
		cursor: pointer;
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
	.form-field input, .form-field select, .form-field textarea {
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
	.entity-list {
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
