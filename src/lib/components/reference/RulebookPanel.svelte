<script lang="ts">
	import { referencePanelStore } from '$lib/stores/reference-panel.svelte';
	import { getSection as getSectionData } from '$lib/data/rulebook-index';
	import RulebookViewer from './RulebookViewer.svelte';
	import { onMount, onDestroy } from 'svelte';

	const sectionData = $derived(
		referencePanelStore.currentSection
			? getSectionData(referencePanelStore.currentSection)
			: null
	);

	let resizing = $state(false);
	let startX = 0;
	let startWidth = 0;

	function handleKeydown(e: KeyboardEvent) {
		if (!referencePanelStore.isOpen) return;
		const target = e.target as HTMLElement;
		if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
		if (e.key === 'Escape') { referencePanelStore.close(); e.preventDefault(); }
	}

	// Resize handle
	function startResize(e: MouseEvent) {
		e.preventDefault();
		resizing = true;
		startX = e.clientX;
		startWidth = referencePanelStore.panelWidth;
		document.addEventListener('mousemove', onResizeMove);
		document.addEventListener('mouseup', onResizeEnd);
	}

	function startResizeTouch(e: TouchEvent) {
		if (e.touches.length !== 1) return;
		e.preventDefault();
		resizing = true;
		startX = e.touches[0].clientX;
		startWidth = referencePanelStore.panelWidth;
		document.addEventListener('touchmove', onResizeTouchMove, { passive: false });
		document.addEventListener('touchend', onResizeTouchEnd);
	}

	function onResizeMove(e: MouseEvent) {
		const delta = startX - e.clientX;
		referencePanelStore.setPanelWidth(startWidth + delta);
	}

	function onResizeTouchMove(e: TouchEvent) {
		if (e.touches.length !== 1) return;
		e.preventDefault();
		const delta = startX - e.touches[0].clientX;
		referencePanelStore.setPanelWidth(startWidth + delta);
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
	class="rulebook-panel"
	class:fullscreen={referencePanelStore.isFullscreen}
	style={referencePanelStore.isFullscreen ? '' : `width: ${referencePanelStore.panelWidth}px`}
>
	<!-- Resize handle (left edge) -->
	{#if !referencePanelStore.isFullscreen}
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
			<button class="btn btn-sm" onclick={() => referencePanelStore.close()} title="Close panel">✕</button>
			<button
				class="btn btn-sm"
				onclick={() => referencePanelStore.toggleFullscreen()}
				title={referencePanelStore.isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
			>
				{referencePanelStore.isFullscreen ? '⊟' : '⊞'}
			</button>
		</div>

		<div class="toolbar-center">
			<button
				class="btn btn-sm"
				onclick={() => referencePanelStore.goPrev()}
				disabled={!referencePanelStore.canGoPrev}
				title={referencePanelStore.prevSection ? `Previous: ${referencePanelStore.prevSection.heading}` : 'Previous section'}
			>◀</button>
			<button
				class="btn btn-sm"
				onclick={() => referencePanelStore.goNext()}
				disabled={!referencePanelStore.canGoNext}
				title={referencePanelStore.nextSection ? `Next: ${referencePanelStore.nextSection.heading}` : 'Next section'}
			>▶</button>
		</div>

		<div class="toolbar-right">
			<span class="panel-title">{sectionData?.heading ?? 'Rulebook'}</span>
		</div>
	</div>

	<!-- Content -->
	<div class="panel-content">
		{#if referencePanelStore.currentSection}
			{#key referencePanelStore.currentSection}
				<RulebookViewer sectionSlug={referencePanelStore.currentSection} />
			{/key}
		{/if}
	</div>
</div>

{#if resizing}
	<div class="resize-overlay"></div>
{/if}

<style>
	.rulebook-panel {
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

	.rulebook-panel.fullscreen {
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
	}

	.toolbar-right {
		display: flex;
		align-items: center;
		margin-left: auto;
	}

	.panel-title {
		font-size: 12px;
		color: var(--text-muted);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 200px;
	}

	.panel-content {
		flex: 1;
		overflow-y: auto;
		min-height: 0;
		padding: var(--space-md) var(--space-lg);
	}

	.btn-sm {
		font-size: 12px;
		padding: var(--space-xs) var(--space-sm);
	}
</style>
