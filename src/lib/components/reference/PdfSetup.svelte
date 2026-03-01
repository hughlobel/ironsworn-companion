<script lang="ts">
	import { PDF_CATALOG } from '$lib/data/pdf-types';
	import type { PdfKey } from '$lib/data/pdf-types';
	import { pdfStore } from '$lib/stores/pdf.svelte';

	async function handleFile(key: PdfKey, event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		await pdfStore.storePdf(key, file);
		input.value = '';
	}

	async function removeAll() {
		for (const meta of PDF_CATALOG) {
			if (pdfStore.loadedPdfs[meta.key]) {
				await pdfStore.removePdf(meta.key);
			}
		}
	}

	const anyLoaded = $derived(PDF_CATALOG.some(m => pdfStore.loadedPdfs[m.key]));
</script>

<div class="pdf-setup">
	<div class="setup-header">
		<h4>PDF References</h4>
		{#if anyLoaded}
			<button class="btn btn-danger-sm" onclick={removeAll}>Clear All</button>
		{/if}
	</div>
	<p class="setup-description">
		Load your Ironsworn PDFs for in-app reference. Files are stored locally in your browser and never uploaded.
	</p>

	<div class="pdf-list">
		{#each PDF_CATALOG as meta}
			<div class="pdf-item card">
				<div class="pdf-info">
					<div class="pdf-name">
						{#if pdfStore.loadedPdfs[meta.key]}
							<span class="status-dot loaded"></span>
						{:else}
							<span class="status-dot"></span>
						{/if}
						{meta.label}
					</div>
					<p class="pdf-desc">{meta.description}</p>
				</div>
				<div class="pdf-actions">
					{#if pdfStore.loadedPdfs[meta.key]}
						<button class="btn btn-sm" onclick={() => pdfStore.removePdf(meta.key)}>Remove</button>
					{:else}
						<label class="btn btn-primary btn-sm file-label">
							Load PDF
							<input
								type="file"
								accept=".pdf"
								onchange={(e) => handleFile(meta.key, e)}
								hidden
							/>
						</label>
					{/if}
				</div>
			</div>
		{/each}
	</div>
</div>

<style>
	.pdf-setup {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}
	.setup-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.setup-header h4 {
		font-size: 16px;
		font-weight: 700;
	}
	.setup-description {
		font-size: 13px;
		color: var(--text-muted);
		line-height: 1.5;
	}
	.pdf-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}
	.pdf-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: var(--space-md);
		padding: var(--space-md);
	}
	.pdf-info {
		flex: 1;
		min-width: 0;
	}
	.pdf-name {
		font-size: 14px;
		font-weight: 600;
		display: flex;
		align-items: center;
		gap: var(--space-xs);
	}
	.pdf-desc {
		font-size: 12px;
		color: var(--text-muted);
		margin-top: 2px;
	}
	.status-dot {
		display: inline-block;
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--border);
		flex-shrink: 0;
	}
	.status-dot.loaded {
		background: var(--strong-hit);
	}
	.pdf-actions {
		flex-shrink: 0;
	}
	.file-label {
		cursor: pointer;
	}
	.btn-sm {
		font-size: 12px;
		padding: var(--space-xs) var(--space-sm);
	}
	.btn-danger-sm {
		font-size: 12px;
		padding: var(--space-xs) var(--space-sm);
		background: transparent;
		border: 1px solid var(--miss);
		color: var(--miss);
		border-radius: var(--radius-sm);
		cursor: pointer;
		font-family: var(--font-body);
	}
	.btn-danger-sm:hover {
		background: var(--miss);
		color: var(--bg-base);
	}
</style>
