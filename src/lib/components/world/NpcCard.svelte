<script lang="ts">
	import type { NPC } from '$lib/data/types';

	let { npc, onupdate, onremove }: {
		npc: NPC;
		onupdate?: (n: NPC) => void;
		onremove?: () => void;
	} = $props();

	let expanded = $state(false);
	let editing = $state(false);
	let editName = $state('');
	let editRole = $state('');
	let editDescriptor = $state('');
	let editGoal = $state('');
	let editDisposition = $state('');
	let editNotes = $state('');

	function startEdit() {
		editName = npc.name;
		editRole = npc.role;
		editDescriptor = npc.descriptor;
		editGoal = npc.goal;
		editDisposition = npc.disposition;
		editNotes = npc.notes;
		editing = true;
	}

	function saveEdit() {
		onupdate?.({
			...npc,
			name: editName,
			role: editRole,
			descriptor: editDescriptor,
			goal: editGoal,
			disposition: editDisposition,
			notes: editNotes
		});
		editing = false;
	}

	function toggleBonded() {
		onupdate?.({ ...npc, isBonded: !npc.isBonded });
	}
</script>

<div class="npc-card card">
	<div class="npc-header" onclick={() => expanded = !expanded}>
		<div class="npc-info">
			<div class="npc-name-row">
				<h4 class="npc-name">{npc.name}</h4>
				{#if npc.isBonded}
					<span class="bonded-badge" title="Bonded">⚔</span>
				{/if}
			</div>
			<div class="npc-meta">
				<span class="npc-kin">{npc.kin}</span>
				{#if npc.role}<span class="npc-role">{npc.role}</span>{/if}
			</div>
		</div>
		<div class="npc-right">
			{#if npc.disposition}
				<span class="disposition-badge">{npc.disposition}</span>
			{/if}
			<span class="expand-icon">{expanded ? '▾' : '▸'}</span>
		</div>
	</div>

	{#if npc.descriptor && !expanded}
		<p class="npc-descriptor">{npc.descriptor}</p>
	{/if}

	{#if expanded}
		{#if !editing}
			<div class="npc-details">
				{#if npc.descriptor}<div class="detail-row"><span class="detail-label">Descriptor</span> {npc.descriptor}</div>{/if}
				{#if npc.goal}<div class="detail-row"><span class="detail-label">Goal</span> {npc.goal}</div>{/if}
				{#if npc.disposition}<div class="detail-row"><span class="detail-label">Disposition</span> {npc.disposition}</div>{/if}
				{#if npc.notes}<div class="detail-row"><span class="detail-label">Notes</span> {npc.notes}</div>{/if}
			</div>
			<div class="npc-actions">
				<button class="btn btn-sm" onclick={toggleBonded}>
					{npc.isBonded ? 'Remove Bond' : 'Mark Bonded'}
				</button>
				<button class="btn btn-sm" onclick={startEdit}>Edit</button>
				{#if onremove}
					<button class="btn btn-sm btn-danger" onclick={onremove}>Remove</button>
				{/if}
			</div>
		{:else}
			<div class="npc-edit-form">
				<label>Name</label>
				<input bind:value={editName} />
				<label>Role</label>
				<input bind:value={editRole} />
				<label>Descriptor</label>
				<input bind:value={editDescriptor} />
				<label>Goal</label>
				<input bind:value={editGoal} />
				<label>Disposition</label>
				<input bind:value={editDisposition} />
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
	.npc-card {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}
	.npc-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		cursor: pointer;
	}
	.npc-name-row {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
	}
	.npc-name {
		font-size: 14px;
		font-weight: 700;
	}
	.bonded-badge {
		color: var(--accent);
		font-size: 12px;
	}
	.npc-meta {
		display: flex;
		gap: var(--space-sm);
		font-size: 11px;
		color: var(--text-secondary);
	}
	.npc-kin {
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}
	.npc-right {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
	}
	.disposition-badge {
		font-size: 11px;
		padding: 2px 6px;
		border-radius: var(--radius-sm);
		background: var(--bg-overlay);
		color: var(--text-secondary);
	}
	.expand-icon {
		color: var(--text-muted);
		font-size: 12px;
	}
	.npc-descriptor {
		font-size: 12px;
		color: var(--text-secondary);
		font-style: italic;
	}
	.npc-details {
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
	.npc-actions {
		display: flex;
		gap: var(--space-xs);
		margin-top: var(--space-xs);
	}
	.npc-edit-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}
	.npc-edit-form input, .npc-edit-form textarea {
		width: 100%;
	}
	.edit-actions {
		display: flex;
		gap: var(--space-xs);
		margin-top: var(--space-xs);
	}
</style>
