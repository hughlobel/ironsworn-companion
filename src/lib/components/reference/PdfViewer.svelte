<script lang="ts">
	import type { PdfKey } from '$lib/data/pdf-types';
	import { PDF_CATALOG } from '$lib/data/pdf-types';
	import { pdfStore } from '$lib/stores/pdf.svelte';
	import { base } from '$app/paths';
	import { onMount, onDestroy } from 'svelte';

	let {
		pdfKey,
		page = 1,
		twoPage = false,
		externalControls = false,
	}: {
		pdfKey: PdfKey;
		page?: number;
		twoPage?: boolean;
		externalControls?: boolean;
	} = $props();

	const isLoaded = $derived(pdfStore.loadedPdfs[pdfKey]);
	const meta = $derived(PDF_CATALOG.find(p => p.key === pdfKey));

	let canvasEl: HTMLCanvasElement;
	let canvasEl2: HTMLCanvasElement;
	let containerEl: HTMLDivElement;
	let pdfjsLib: any = null;
	let pdfDoc: any = null;
	let currentPage = $state(page);
	let totalPages = $state(0);
	let rendering = $state(false);
	let error = $state('');
	let scale = $state(1.5);

	// Pinch-to-zoom state
	let initialPinchDistance = 0;
	let initialPinchScale = 1;

	// Expose for parent components
	export function getPage() { return currentPage; }
	export function getTotalPages() { return totalPages; }
	export function getScale() { return scale; }

	export function goToPage(p: number) {
		if (!pdfDoc) return;
		currentPage = Math.min(Math.max(1, p), totalPages);
		renderPage();
	}

	export function prevPage() {
		if (currentPage > 1) {
			currentPage--;
			renderPage();
		}
	}

	export function nextPage() {
		if (currentPage < totalPages) {
			currentPage++;
			renderPage();
		}
	}

	export function zoomIn() {
		scale = Math.min(4, scale + 0.25);
		renderPage();
	}

	export function zoomOut() {
		scale = Math.max(0.5, scale - 0.25);
		renderPage();
	}

	async function loadPdf() {
		if (!isLoaded) return;
		error = '';
		rendering = true;

		try {
			pdfjsLib = await import('pdfjs-dist');
			const workerUrl = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
			pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl.default;

			const data = await pdfStore.getPdfData(pdfKey);
			if (!data) {
				error = 'Could not read PDF data.';
				rendering = false;
				return;
			}

			pdfDoc = await pdfjsLib.getDocument({ data }).promise;
			totalPages = pdfDoc.numPages;
			currentPage = Math.min(Math.max(1, page), totalPages);
			await renderPage();
		} catch (e: any) {
			error = e?.message || 'Failed to load PDF.';
			rendering = false;
		}
	}

	async function renderSingleCanvas(canvas: HTMLCanvasElement, pageNum: number) {
		if (!pdfDoc || !canvas || pageNum < 1 || pageNum > totalPages) return;

		const pdfPage = await pdfDoc.getPage(pageNum);
		const viewport = pdfPage.getViewport({ scale });
		const ctx = canvas.getContext('2d')!;

		const dpr = window.devicePixelRatio || 1;
		canvas.width = viewport.width * dpr;
		canvas.height = viewport.height * dpr;
		canvas.style.width = `${viewport.width}px`;
		canvas.style.height = `${viewport.height}px`;
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

		await pdfPage.render({ canvasContext: ctx, viewport }).promise;
	}

	async function renderPage() {
		if (!pdfDoc || !canvasEl) return;
		rendering = true;

		try {
			await renderSingleCanvas(canvasEl, currentPage);

			if (twoPage && canvasEl2 && currentPage + 1 <= totalPages) {
				await renderSingleCanvas(canvasEl2, currentPage + 1);
			}
		} catch (e: any) {
			error = e?.message || 'Failed to render page.';
		}
		rendering = false;
	}

	function handleKeydown(e: KeyboardEvent) {
		const target = e.target as HTMLElement;
		if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
		if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { prevPage(); e.preventDefault(); }
		else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { nextPage(); e.preventDefault(); }
		else if (e.key === '+' || e.key === '=') { zoomIn(); e.preventDefault(); }
		else if (e.key === '-') { zoomOut(); e.preventDefault(); }
	}

	function handleTouchStart(e: TouchEvent) {
		if (e.touches.length === 2) {
			const dx = e.touches[0].clientX - e.touches[1].clientX;
			const dy = e.touches[0].clientY - e.touches[1].clientY;
			initialPinchDistance = Math.sqrt(dx * dx + dy * dy);
			initialPinchScale = scale;
		}
	}

	function handleTouchMove(e: TouchEvent) {
		if (e.touches.length === 2 && initialPinchDistance > 0) {
			e.preventDefault();
			const dx = e.touches[0].clientX - e.touches[1].clientX;
			const dy = e.touches[0].clientY - e.touches[1].clientY;
			const dist = Math.sqrt(dx * dx + dy * dy);
			const newScale = initialPinchScale * (dist / initialPinchDistance);
			scale = Math.max(0.5, Math.min(4, newScale));
		}
	}

	function handleTouchEnd(e: TouchEvent) {
		if (e.touches.length < 2 && initialPinchDistance > 0) {
			initialPinchDistance = 0;
			renderPage();
		}
	}

	onMount(() => {
		loadPdf();
		if (!externalControls) {
			document.addEventListener('keydown', handleKeydown);
		}
	});

	onDestroy(() => {
		if (!externalControls) {
			document.removeEventListener('keydown', handleKeydown);
		}
		pdfDoc?.destroy();
	});

	// Re-render when twoPage changes
	$effect(() => {
		twoPage;
		if (pdfDoc) renderPage();
	});
</script>

<div class="pdf-viewer">
	{#if isLoaded}
		{#if !externalControls}
			<div class="viewer-toolbar">
				<a href="{base}/reference" class="btn btn-sm">Back</a>
				<div class="page-nav">
					<button class="btn btn-sm" onclick={prevPage} disabled={currentPage <= 1}>&#9664;</button>
					<input
						class="page-input"
						type="number"
						min="1"
						max={totalPages || 1}
						value={currentPage}
						onchange={(e) => {
							const val = parseInt(e.currentTarget.value, 10);
							if (val >= 1 && val <= totalPages) goToPage(val);
							else e.currentTarget.value = String(currentPage);
						}}
						onkeydown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
					/>
					<span class="page-total">/ {totalPages || '...'}</span>
					<button class="btn btn-sm" onclick={nextPage} disabled={currentPage >= totalPages}>&#9654;</button>
				</div>
				<div class="zoom-controls">
					<button class="btn btn-sm" onclick={zoomOut}>-</button>
					<span class="zoom-info">{Math.round(scale * 100)}%</span>
					<button class="btn btn-sm" onclick={zoomIn}>+</button>
				</div>
				<span class="viewer-title">{meta?.label ?? pdfKey}</span>
			</div>
		{/if}
		<div
			class="canvas-container"
			class:two-page={twoPage}
			bind:this={containerEl}
			ontouchstart={handleTouchStart}
			ontouchmove={handleTouchMove}
			ontouchend={handleTouchEnd}
		>
			{#if error}
				<div class="error-msg">{error}</div>
			{:else if rendering && !canvasEl?.width}
				<div class="loading-msg">Loading...</div>
			{/if}
			<canvas bind:this={canvasEl}></canvas>
			{#if twoPage}
				<canvas bind:this={canvasEl2} class:hidden={currentPage + 1 > totalPages}></canvas>
			{/if}
		</div>
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
		gap: var(--space-sm);
		padding: var(--space-xs) var(--space-md);
		border-bottom: 1px solid var(--border);
		flex-shrink: 0;
		flex-wrap: wrap;
	}
	.page-nav {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
	}
	.page-input {
		width: 44px;
		font-size: 13px;
		font-family: var(--font-mono);
		color: var(--text-primary);
		background: var(--bg-raised);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		text-align: center;
		padding: 2px 4px;
		-moz-appearance: textfield;
	}
	.page-input::-webkit-inner-spin-button,
	.page-input::-webkit-outer-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}
	.page-input:focus {
		border-color: var(--accent);
		outline: none;
	}
	.page-total {
		font-size: 13px;
		font-family: var(--font-mono);
		color: var(--text-secondary);
	}
	.zoom-info {
		font-size: 13px;
		font-family: var(--font-mono);
		color: var(--text-secondary);
		min-width: 48px;
		text-align: center;
	}
	.zoom-controls {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
	}
	.viewer-title {
		font-size: 13px;
		color: var(--text-muted);
		margin-left: auto;
	}
	.canvas-container {
		flex: 1;
		overflow: auto;
		display: flex;
		justify-content: center;
		padding: var(--space-sm);
		background: var(--bg-raised);
		-webkit-overflow-scrolling: touch;
	}
	.canvas-container.two-page {
		gap: var(--space-md);
		align-items: flex-start;
	}
	canvas {
		display: block;
		max-width: 100%;
		height: auto;
	}
	canvas.hidden {
		display: none;
	}
	.not-loaded, .loading-msg, .error-msg {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--space-md);
		padding: var(--space-xl);
		color: var(--text-muted);
		text-align: center;
	}
	.error-msg {
		color: var(--miss);
	}
	.btn-sm {
		font-size: 12px;
		padding: var(--space-xs) var(--space-sm);
	}
</style>
