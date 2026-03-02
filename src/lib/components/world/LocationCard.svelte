<script lang="ts">
	import type { Location } from '$lib/data/types';

	let { location, onupdate, onremove }: {
		location: Location;
		onupdate?: (l: Location) => void;
		onremove?: () => void;
	} = $props();

	let expanded = $state(false);
	let editing = $state(false);
	let editName = $state('');
	let editRegion = $state('');
	let editType = $state('');
	let editDescriptor = $state('');
	let editTrouble = $state('');
	let editNotes = $state('');

	function startEdit() {
		editName = location.name;
		editRegion = location.region;
		editType = location.type;
		editDescriptor = location.descriptor;
		editTrouble = location.trouble;
		editNotes = location.notes;
		editing = true;
	}

	function saveEdit() {
		onupdate?.({
			...location,
			name: editName,
			region: editRegion,
			type: editType,
			descriptor: editDescriptor,
			trouble: editTrouble,
			notes: editNotes
		});
		editing = false;
	}
</script>

<div class="location-card card">
	<div class="location-header" onclick={() => expanded = !expanded}>
		<div class="location-info">
			<h4 class="location-name">{location.name}</h4>
			<div class="location-meta">
				{#if location.region}<span class="region-badge">{location.region}</span>{/if}
				{#if location.type}<span class="type-badge">{location.type}</span>{/if}
			</div>
		</div>
		<span class="expand-icon">{expanded ? '▾' : '▸'}</span>
	</div>

	{#if location.descriptor && !expanded}
		<p class="location-descriptor">{location.descriptor}</p>
	{/if}

	{#if expanded}
		{#if !editing}
			<div class="location-details">
				{#if location.descriptor}<div class="detail-row"><span class="detail-label">Descriptor</span> {location.descriptor}</div>{/if}
				{#if location.trouble}<div class="detail-row"><span class="detail-label">Trouble</span> {location.trouble}</div>{/if}
				{#if location.notes}<div class="detail-row"><span class="detail-label">Notes</span> {location.notes}</div>{/if}
			</div>
			<div class="location-actions">
				<button class="btn btn-sm" onclick={startEdit}>Edit</button>
				{#if onremove}
					<button class="btn btn-sm btn-danger" onclick={onremove}>Remove</button>
				{/if}
			</div>
		{:else}
			<div class="location-edit-form">
				<label>Name</label>
				<input bind:value={editName} />
				<label>Region</label>
				<input bind:value={editRegion} />
				<label>Type</label>
				<input bind:value={editType} />
				<label>Descriptor</label>
				<input bind:value={editDescriptor} />
				<label>Trouble</label>
				<input bind:value={editTrouble} />
				<label>Notes</label>
				<textarea bind:value={editNotes} rows="3"></textarea>
				<div class="edit-actions">
					<button class="btn btn-sm btn-primary" onclick={saveEdit}>Save</button>
					<button class="btn btn-sm" onclick={() => editing = false}>Cancel</button>
				</div>
			</div>
		{/if}
	{/if}
</div>

<style>
	.location-card {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}
	.location-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		cursor: pointer;
	}
	.location-name {
		font-size: 14px;
		font-weight: 700;
	}
	.location-meta {
		display: flex;
		gap: var(--space-sm);
		margin-top: 2px;
	}
	.region-badge, .type-badge {
		font-size: 11px;
		padding: 1px 6px;
		border-radius: var(--radius-sm);
		background: var(--bg-overlay);
		color: var(--text-secondary);
		font-weight: 600;
	}
	.expand-icon {
		color: var(--text-muted);
		font-size: 12px;
	}
	.location-descriptor {
		font-size: 12px;
		color: var(--text-secondary);
		font-style: italic;
	}
	.location-details {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}
	.detail-row {
		font-size: 13px;
		color: var(--text-secondary);
	}
	.detail-label {
		font-weight: 600;
		color: var(--text-muted);
		text-transform: uppercase;
		font-size: 10px;
		letter-spacing: 0.5px;
		margin-right: var(--space-xs);
	}
	.location-actions {
		display: flex;
		gap: var(--space-xs);
		margin-top: var(--space-xs);
	}
	.location-edit-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}
	.location-edit-form input, .location-edit-form textarea {
		width: 100%;
	}
	.edit-actions {
		display: flex;
		gap: var(--space-xs);
		margin-top: var(--space-xs);
	}
</style>
