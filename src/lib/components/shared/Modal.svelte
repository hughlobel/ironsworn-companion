<script lang="ts">
	import type { Snippet } from 'svelte';

	let { open = false, title = '', onclose, children }: {
		open?: boolean;
		title?: string;
		onclose?: () => void;
		children: Snippet;
	} = $props();

	function handleBackdrop(e: MouseEvent) {
		if (e.target === e.currentTarget) onclose?.();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onclose?.();
	}
</script>

{#if open}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="modal-backdrop" onclick={handleBackdrop} onkeydown={handleKeydown}>
		<div class="modal-content card">
			<div class="modal-header">
				<h3 class="card-title">{title}</h3>
				<button class="meter-btn" onclick={() => onclose?.()}>×</button>
			</div>
			{@render children()}
		</div>
	</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.6);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: var(--space-xl);
	}
	.modal-content {
		max-width: 600px;
		width: 100%;
		max-height: 80vh;
		overflow-y: auto;
	}
	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: var(--space-lg);
	}
</style>
