<script lang="ts">
	import { PDF_CATALOG } from '$lib/data/pdf-types';
	import { pdfPanelStore } from '$lib/stores/pdf-panel.svelte';
	import PdfViewer from './PdfViewer.svelte';
	import { onMount, onDestroy } from 'svelte';

	const meta = $derived(
		pdfPanelStore.pdfKey
			? PDF_CATALOG.find(p => p.key === pdfPanelStore.pdfKey)
			: null
	);

	let viewer = $state<PdfViewer>();
	let resizing = $state(false);
	let startX = 0;
	let startWidth = 0;

	// Derived display values from viewer
	let currentPageNum = $state(1);
	let totalPagesNum = $state(0);
	let zoomDisplay = $state('150%');

	function updateDisplays() {
		if (!viewer) return;
		currentPageNum = viewer.getPage();
		totalPagesNum = viewer.getTotalPages();
		const s = viewer.getScale();
		zoomDisplay = `${Math.round(s * 100)}%`;
	}

	function handlePageInput(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const val = parseInt(input.value, 10);
		if (val >= 1 && val <= totalPagesNum) {
			viewer?.goToPage(val);
			setTimeout(updateDisplays, 50);
		} else {
			input.value = String(currentPageNum);
		}
	}

	function handlePrev() { viewer?.prevPage(); setTimeout(updateDisplays, 50); }
	function handleNext() { viewer?.nextPage(); setTimeout(updateDisplays, 50); }
	function handleZoomIn() { viewer?.zoomIn(); setTimeout(updateDisplays, 50); }
	function handleZoomOut() { viewer?.zoomOut(); setTimeout(updateDisplays, 50); }

	// Update display after viewer loads
	$effect(() => {
		if (pdfPanelStore.pdfKey && pdfPanelStore.currentPage) {
			setTimeout(updateDisplays, 500);
		}
	});

	function handleKeydown(e: KeyboardEvent) {
		if (!pdfPanelStore.isOpen) return;
		const target = e.target as HTMLElement;
		if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
		if (e.key === 'Escape') { pdfPanelStore.close(); e.preventDefault(); }
		else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { handlePrev(); e.preventDefault(); }
		else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { handleNext(); e.preventDefault(); }
		else if (e.key === '+' || e.key === '=') { handleZoomIn(); e.preventDefault(); }
		else if (e.key === '-') { handleZoomOut(); e.preventDefault(); }
	}

	// Resize handle
	function startResize(e: MouseEvent) {
		e.preventDefault();
		resizing = true;
		startX = e.clientX;
		startWidth = pdfPanelStore.panelWidth;
		document.addEventListener('mousemove', onResizeMove);
		document.addEventListener('mouseup', onResizeEnd);
	}

	function startResizeTouch(e: TouchEvent) {
		if (e.touches.length !== 1) return;
		e.preventDefault();
		resizing = true;
		startX = e.touches[0].clientX;
		startWidth = pdfPanelStore.panelWidth;
		document.addEventListener('touchmove', onResizeTouchMove, { passive: false });
		document.addEventListener('touchend', onResizeTouchEnd);
	}

	function onResizeMove(e: MouseEvent) {
		const delta = startX - e.clientX;
		pdfPanelStore.setPanelWidth(startWidth + delta);
	}

	function onResizeTouchMove(e: TouchEvent) {
		if (e.touches.length !== 1) return;
		e.preventDefault();
		const delta = startX - e.touches[0].clientX;
		pdfPanelStore.setPanelWidth(startWidth + delta);
	}

	function onResizeEnd() {
		resizing = false;
		document.removeEventListener('mousemove', onResizeMove);
		document.removeEventListener('mouseup', onResizeEnd);
	}

	function onResizeTouchEnd() {
		resizing = false;
		document.removeEventListener('touchmove', onResizeTouchMove);
		document.removeEventListener('touchend', onResizeTouchEnd);
	}

	onMount(() => {
		document.addEventListener('keydown', handleKeydown);
	});

	onDestroy(() => {
		document.removeEventListener('keydown', handleKeydown);
		document.removeEventListener('mousemove', onResizeMove);
		document.removeEventListener('mouseup', onResizeEnd);
		document.removeEventListener('touchmove', onResizeTouchMove);
		document.removeEventListener('touchend', onResizeTouchEnd);
	});
</script>

<div
	class="pdf-panel"
	class:fullscreen={pdfPanelStore.isFullscreen}
	style={pdfPanelStore.isFullscreen ? '' : `width: ${pdfPanelStore.panelWidth}px`}
>
	<!-- Resize handle (left edge) -->
	{#if !pdfPanelStore.isFullscreen}
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div
			class="resize-handle"
			onmousedown={startResize}
			ontouchstart={startResizeTouch}
			role="separator"
			aria-orientation="vertical"
			tabindex="-1"
		></div>
	{/if}

	<!-- Toolbar -->
	<div class="panel-toolbar">
		<div class="toolbar-left">
			<button class="btn btn-sm" onclick={() => pdfPanelStore.close()} title="Close panel">✕</button>
			<button
				class="btn btn-sm"
				onclick={() => pdfPanelStore.toggleFullscreen()}
				title={pdfPanelStore.isFullscreen ? 'Exit fullscreen' : 'Fullscreen (two-page)'}
			>
				{pdfPanelStore.isFullscreen ? '⊟' : '⊞'}
			</button>
		</div>

		<div class="toolbar-center">
			<button class="btn btn-sm" onclick={handlePrev} title="Previous page">◀</button>
			<input
				class="page-input"
				type="number"
				min="1"
				max={totalPagesNum || 1}
				value={currentPageNum}
				onchange={handlePageInput}
				onkeydown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
			/>
			<span class="page-total">/ {totalPagesNum || '...'}</span>
			<button class="btn btn-sm" onclick={handleNext} title="Next page">▶</button>
			<span class="toolbar-sep"></span>
			<button class="btn btn-sm" onclick={handleZoomOut} title="Zoom out">−</button>
			<span class="zoom-info">{zoomDisplay}</span>
			<button class="btn btn-sm" onclick={handleZoomIn} title="Zoom in">+</button>
		</div>

		<div class="toolbar-right">
			<span class="panel-title">{meta?.label ?? pdfPanelStore.pdfKey ?? ''}</span>
		</div>
	</div>

	<!-- PDF Content -->
	<div class="panel-content">
		{#if pdfPanelStore.pdfKey}
			{#key pdfPanelStore.pdfKey}
				<PdfViewer
					bind:this={viewer}
					pdfKey={pdfPanelStore.pdfKey}
					page={pdfPanelStore.currentPage}
					twoPage={pdfPanelStore.isFullscreen}
					externalControls={true}
				/>
			{/key}
		{/if}
	</div>
</div>

{#if resizing}
	<div class="resize-overlay"></div>
{/if}

<style>
	.pdf-panel {
		display: flex;
		flex-direction: column;
		height: 100vh;
		background: var(--bg-surface);
		border-left: 1px solid var(--border);
		position: relative;
		flex-shrink: 0;
		min-width: 300px;
		max-width: 1200px;
	}

	.pdf-panel.fullscreen {
		width: 100% !important;
		max-width: none;
		border-left: none;
	}

	.resize-handle {
		position: absolute;
		left: -3px;
		top: 0;
		bottom: 0;
		width: 6px;
		cursor: col-resize;
		z-index: 10;
		background: transparent;
		transition: background 0.15s;
	}

	.resize-handle:hover,
	.resize-handle:active {
		background: var(--accent);
		opacity: 0.5;
	}

	.resize-overlay {
		position: fixed;
		inset: 0;
		z-index: 9999;
		cursor: col-resize;
	}

	.panel-toolbar {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		padding: var(--space-xs) var(--space-sm);
		border-bottom: 1px solid var(--border);
		flex-shrink: 0;
		min-height: 36px;
		flex-wrap: wrap;
	}

	.toolbar-left {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
	}

	.toolbar-center {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
		flex: 1;
		justify-content: center;
	}

	.toolbar-right {
		display: flex;
		align-items: center;
	}

	.toolbar-sep {
		width: 1px;
		height: 16px;
		background: var(--border);
		margin: 0 var(--space-xs);
	}

	.page-input {
		width: 40px;
		font-size: 12px;
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
		font-size: 12px;
		font-family: var(--font-mono);
		color: var(--text-secondary);
	}
	.zoom-info {
		font-size: 12px;
		font-family: var(--font-mono);
		color: var(--text-secondary);
		min-width: 44px;
		text-align: center;
	}

	.panel-title {
		font-size: 12px;
		color: var(--text-muted);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 160px;
	}

	.panel-content {
		flex: 1;
		overflow: hidden;
		min-height: 0;
	}

	.btn-sm {
		font-size: 12px;
		padding: var(--space-xs) var(--space-sm);
	}
</style>
