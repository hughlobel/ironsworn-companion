<script lang="ts">
	import type { JournalEntry } from '$lib/data/types';
	import { campaignStore } from '$lib/stores/campaign.svelte';

	let { entries, maxEntries = 50 }: {
		entries: JournalEntry[];
		maxEntries?: number;
	} = $props();

	let narrativeText = $state('');

	function addNarrative() {
		if (!narrativeText.trim()) return;
		campaignStore.addNarrative(narrativeText.trim());
		narrativeText = '';
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			addNarrative();
		}
	}

	function typeIcon(type: string): string {
		switch (type) {
			case 'roll': return '🎲';
			case 'meter_change': return '📊';
			case 'track_update': return '◼';
			case 'oracle': return '🔮';
			case 'narrative': return '✏';
			default: return '•';
		}
	}

	function timeStr(ts: number): string {
		return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	}

	const displayEntries = $derived(entries.slice(0, maxEntries));
</script>

<div class="journal-feed">
	<div class="narrative-input">
		<textarea
			bind:value={narrativeText}
			placeholder="Write what happens in the fiction..."
			rows="2"
			onkeydown={handleKeydown}
		></textarea>
		<button class="btn btn-sm" onclick={addNarrative} disabled={!narrativeText.trim()}>Add</button>
	</div>

	<div class="entries">
		{#each displayEntries as entry (entry.id)}
			<div class="entry entry-{entry.type}">
				<span class="entry-icon">{typeIcon(entry.type)}</span>
				<div class="entry-content">
					<p class="entry-text">{entry.text}</p>
					<span class="entry-time">{timeStr(entry.timestamp)}</span>
				</div>
			</div>
		{/each}

		{#if entries.length === 0}
			<p class="text-muted text-sm" style="padding: var(--space-md);">No entries yet. Start playing to see your story unfold.</p>
		{/if}
	</div>
</div>

<style>
	.journal-feed {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}
	.narrative-input {
		display: flex;
		gap: var(--space-sm);
		align-items: flex-end;
	}
	.narrative-input textarea {
		flex: 1;
		resize: vertical;
		min-height: 48px;
	}
	.entries {
		display: flex;
		flex-direction: column;
		gap: 1px;
	}
	.entry {
		display: flex;
		gap: var(--space-sm);
		padding: var(--space-sm) var(--space-md);
		background: var(--bg-surface);
		border-radius: var(--radius-sm);
	}
	.entry-icon {
		font-size: 14px;
		width: 20px;
		flex-shrink: 0;
		text-align: center;
	}
	.entry-content {
		flex: 1;
		min-width: 0;
	}
	.entry-text {
		font-size: 13px;
		color: var(--text-primary);
		line-height: 1.5;
		word-wrap: break-word;
	}
	.entry-time {
		font-size: 10px;
		color: var(--text-muted);
		font-family: var(--font-mono);
	}
	.entry-narrative .entry-text {
		font-style: italic;
		color: var(--text-secondary);
	}
	.entry-roll .entry-text {
		font-family: var(--font-mono);
		font-size: 12px;
	}
</style>
