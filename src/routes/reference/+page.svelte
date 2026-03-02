<script lang="ts">
	import type { PdfKey } from '$lib/data/pdf-types';
	import { REFERENCE_INDEX } from '$lib/data/pdf-index';
	import { pdfStore } from '$lib/stores/pdf.svelte';
	import { pdfPanelStore } from '$lib/stores/pdf-panel.svelte';
	import PdfSetup from '$lib/components/reference/PdfSetup.svelte';

	// Browse mode state
	let search = $state('');
	let showSetup = $state(false);

	const filteredEntries = $derived(
		search.trim()
			? REFERENCE_INDEX.filter(e =>
				e.topic.toLowerCase().includes(search.toLowerCase()) ||
				e.category.toLowerCase().includes(search.toLowerCase())
			)
			: REFERENCE_INDEX
	);

	// Group by category
	const grouped = $derived(() => {
		const map = new Map<string, typeof REFERENCE_INDEX>();
		for (const entry of filteredEntries) {
			if (!map.has(entry.category)) map.set(entry.category, []);
			map.get(entry.category)!.push(entry);
		}
		return map;
	});

	function openTopic(pdfKey: PdfKey, page: number) {
		pdfPanelStore.openPdf(pdfKey, page);
	}
</script>

<div class="reference-page">
	<div class="browse-mode">
		<div class="page-header">
			<h2>Reference</h2>
			<button
				class="btn btn-sm"
				onclick={() => showSetup = !showSetup}
			>
				{showSetup ? 'Hide' : 'Manage'} PDFs
			</button>
		</div>

		{#if showSetup}
			<PdfSetup />
		{/if}

		<div class="search-bar">
			<input
				type="text"
				placeholder="Search topics..."
				bind:value={search}
				class="search-input"
			/>
		</div>

		{#each [...grouped().entries()] as [category, entries]}
			<div class="category-section">
				<h3 class="category-title">{category}</h3>
				<div class="topic-list">
					{#each entries as entry}
						{@const loaded = pdfStore.loadedPdfs[entry.ref.pdf]}
						<button
							class="topic-item"
							class:disabled={!loaded}
							title={loaded ? `${entry.topic} — p.${entry.ref.page}` : 'PDF not loaded'}
							disabled={!loaded}
							onclick={() => openTopic(entry.ref.pdf, entry.ref.page)}
						>
							<span class="topic-name">{entry.topic}</span>
							<span class="topic-page">p.{entry.ref.page}</span>
						</button>
					{/each}
				</div>
			</div>
		{/each}

		{#if filteredEntries.length === 0}
			<p class="text-muted" style="text-align:center; padding: var(--space-lg);">No topics match your search.</p>
		{/if}
	</div>
</div>

<style>
	.reference-page {
		padding: var(--space-lg);
		max-width: 700px;
		margin: 0 auto;
	}
	.browse-mode {
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
	}
	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.page-header h2 {
		font-size: 20px;
		font-weight: 700;
	}
	.search-bar {
		display: flex;
	}
	.search-input {
		flex: 1;
		padding: var(--space-sm) var(--space-md);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		background: var(--bg-raised);
		color: var(--text-primary);
		font-size: 14px;
		font-family: var(--font-body);
	}
	.search-input::placeholder {
		color: var(--text-muted);
	}
	.category-section {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}
	.category-title {
		font-size: 12px;
		font-weight: 700;
		text-transform: uppercase;
		color: var(--text-muted);
		letter-spacing: 0.5px;
		padding-bottom: var(--space-xs);
		border-bottom: 1px solid var(--border);
	}
	.topic-list {
		display: flex;
		flex-direction: column;
	}
	.topic-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--space-sm) var(--space-sm);
		border-radius: var(--radius-sm);
		color: var(--text-primary);
		font-size: 14px;
		cursor: pointer;
		background: none;
		border: none;
		text-align: left;
		font-family: var(--font-body);
		width: 100%;
	}
	.topic-item:hover:not(.disabled) {
		background: var(--bg-raised);
	}
	.topic-item.disabled {
		opacity: 0.4;
		cursor: default;
	}
	.topic-page {
		font-size: 12px;
		color: var(--text-muted);
		font-family: var(--font-mono);
	}
	.btn-sm {
		font-size: 12px;
		padding: var(--space-xs) var(--space-sm);
	}
</style>
