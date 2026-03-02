<script lang="ts">
	import type { PdfKey } from '$lib/data/pdf-types';
	import { PDF_CATALOG } from '$lib/data/pdf-types';
	import { pdfStore } from '$lib/stores/pdf.svelte';
	import { base } from '$app/paths';
	import { onMount, onDestroy } from 'svelte';

	let { pdfKey, page = 1 }: { pdfKey: PdfKey; page?: number } = $props();

	const isLoaded = $derived(pdfStore.loadedPdfs[pdfKey]);
	const meta = $derived(PDF_CATALOG.find(p => p.key === pdfKey));

	let canvasEl: HTMLCanvasElement;
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

	async function loadPdf() {
		if (!isLoaded) return;
		error = '';
		rendering = true;

		try {
			// Dynamic import to avoid SSR issues — pdfjs-dist requires browser APIs
			pdfjsLib = await import('pdfjs-dist');
			// Import the worker source and set it for pdf.js.
			// The ?url suffix tells Vite to return the asset URL after bundling.
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

	async function renderPage() {
		if (!pdfDoc || !canvasEl) return;
		rendering = true;

		try {
			const pdfPage = await pdfDoc.getPage(currentPage);
			const viewport = pdfPage.getViewport({ scale });
			const ctx = canvasEl.getContext('2d')!;

			// Handle high-DPI displays
			const dpr = window.devicePixelRatio || 1;
			canvasEl.width = viewport.width * dpr;
			canvasEl.height = viewport.height * dpr;
			canvasEl.style.width = `${viewport.width}px`;
			canvasEl.style.height = `${viewport.height}px`;
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

			await pdfPage.render({ canvasContext: ctx, viewport }).promise;
		} catch (e: any) {
			error = e?.message || 'Failed to render page.';
		}
		rendering = false;
	}

	function prevPage() {
		if (currentPage > 1) {
			currentPage--;
			renderPage();
		}
	}

	function nextPage() {
		if (currentPage < totalPages) {
			currentPage++;
			renderPage();
		}
	}

	function zoomIn() {
		scale = Math.min(4, scale + 0.25);
		renderPage();
	}

	function zoomOut() {
		scale = Math.max(0.5, scale - 0.25);
		renderPage();
	}

	function handleKeydown(e: KeyboardEvent) {
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
		document.addEventListener('keydown', handleKeydown);
	});

	onDestroy(() => {
		document.removeEventListener('keydown', handleKeydown);
		pdfDoc?.destroy();
	});
</script>

<div class="pdf-viewer">
	{#if isLoaded}
		<div class="viewer-toolbar">
			<a href="{base}/reference" class="btn btn-sm">Back</a>
			<div class="page-nav">
				<button class="btn btn-sm" onclick={prevPage} disabled={currentPage <= 1}>&#9664;</button>
				<span class="page-info">{currentPage} / {totalPages || '...'}</span>
				<button class="btn btn-sm" onclick={nextPage} disabled={currentPage >= totalPages}>&#9654;</button>
			</div>
			<div class="zoom-controls">
				<button class="btn btn-sm" onclick={zoomOut}>-</button>
				<span class="zoom-info">{Math.round(scale * 100)}%</span>
				<button class="btn btn-sm" onclick={zoomIn}>+</button>
			</div>
			<span class="viewer-title">{meta?.label ?? pdfKey}</span>
		</div>
		<div
			class="canvas-container"
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
	.page-info, .zoom-info {
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
	canvas {
		display: block;
		max-width: 100%;
		height: auto;
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
