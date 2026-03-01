<script lang="ts">
	import type { PdfKey } from '$lib/data/pdf-types';
	import { PDF_CATALOG } from '$lib/data/pdf-types';
	import { pdfStore } from '$lib/stores/pdf.svelte';
	import { base } from '$app/paths';

	let { pdfKey, page = 1 }: { pdfKey: PdfKey; page?: number } = $props();

	const viewerUrl = $derived(pdfStore.getViewerUrl(pdfKey, page));
	const meta = $derived(PDF_CATALOG.find(p => p.key === pdfKey));
</script>

<div class="pdf-viewer">
	{#if viewerUrl}
		<div class="viewer-toolbar">
			<a href="{base}/reference" class="btn btn-sm">Back to Reference</a>
			<span class="viewer-title">{meta?.label ?? pdfKey} &mdash; Page {page}</span>
		</div>
		<iframe
			src={viewerUrl}
			title="{meta?.label ?? 'PDF'} viewer"
			class="viewer-frame"
		></iframe>
	{:else}
		<div class="not-loaded">
			<p>This PDF has not been loaded yet.</p>
			<a href="{base}/reference" class="btn btn-primary">Go to Reference to load PDFs</a>
		</div>
	{/if}
</div>

<style>
	.pdf-viewer {
		display: flex;
		flex-direction: column;
		height: 100%;
		min-height: 0;
	}
	.viewer-toolbar {
		display: flex;
		align-items: center;
		gap: var(--space-md);
		padding: var(--space-sm) var(--space-md);
		border-bottom: 1px solid var(--border);
		flex-shrink: 0;
	}
	.viewer-title {
		font-size: 13px;
		color: var(--text-secondary);
	}
	.viewer-frame {
		flex: 1;
		border: none;
		width: 100%;
		min-height: 0;
	}
	.not-loaded {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--space-md);
		padding: var(--space-xl);
		color: var(--text-muted);
		text-align: center;
	}
	.btn-sm {
		font-size: 12px;
		padding: var(--space-xs) var(--space-sm);
	}
</style>
