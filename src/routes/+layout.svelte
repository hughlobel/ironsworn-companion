<script lang="ts">
	import '../app.css';
	import { base } from '$app/paths';
	import { page } from '$app/stores';
	import { characterStore } from '$lib/stores/character.svelte';
	import { campaignStore } from '$lib/stores/campaign.svelte';
	import { loadFromLocalStorage, saveToLocalStorage, saveToMcp } from '$lib/stores/persistence.svelte';
	import { rulebookStore } from '$lib/stores/rulebook.svelte';
	import { referencePanelStore } from '$lib/stores/reference-panel.svelte';
	import RulebookPanel from '$lib/components/reference/RulebookPanel.svelte';
	import { onMount } from 'svelte';

	let { children } = $props();

	let loaded = $state(false);
	let sidebarCollapsed = $state(false);
	let fromMcpSync = false; // plain var — not reactive, used to break POST↔SSE loop

	function handleGlobalKeydown(e: KeyboardEvent) {
		const target = e.target as HTMLElement;
		if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
		if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
			e.preventDefault();
			referencePanelStore.toggle();
		}
	}

	onMount(() => {
		loadFromLocalStorage();
		loaded = true;
		rulebookStore.init();
		document.addEventListener('keydown', handleGlobalKeydown);

		// Connect to MCP real-time sync stream
		const es = new EventSource('/api/sync/stream');
		es.onmessage = (event) => {
			try {
				const data = JSON.parse(event.data);
				if (data?.id) {
					if ((data.updatedAt ?? 0) >= campaignStore.updatedAt) {
						// MCP is same age or newer — accept it
						fromMcpSync = true;
						campaignStore.loadCampaign(data);
					} else {
						// Local data is newer — push local state to MCP
						saveToMcp();
					}
				}
			} catch {
				// Ignore parse errors
			}
		};
		es.onerror = () => es.close(); // Gracefully degrade if endpoint unavailable

		return () => {
			document.removeEventListener('keydown', handleGlobalKeydown);
			es.close();
		};
	});

	// Auto-save on changes
	$effect(() => {
		if (!loaded) return;
		// Touch reactive state to track it
		const _ = JSON.stringify(characterStore.character);
		const __ = JSON.stringify(campaignStore.tracks);
		const ___ = campaignStore.journal.length;
		const ____ = JSON.stringify(campaignStore.npcs);
		const _____ = JSON.stringify(campaignStore.locations);
		const ______ = JSON.stringify(campaignStore.sites);
		// Debounce save — skip MCP POST when the change came from MCP itself
		const postToMcp = !fromMcpSync;
		fromMcpSync = false;
		const timer = setTimeout(() => {
			saveToLocalStorage();
			if (postToMcp) {
				campaignStore.stampUpdatedAt();
				saveToMcp();
			}
		}, 500);
		return () => clearTimeout(timer);
	});

	const nav = [
		{ href: `${base}/`, label: 'Play', icon: '⚔' },
		{ href: `${base}/character`, label: 'Character', icon: '👤' },
		{ href: `${base}/moves`, label: 'Moves', icon: '📜' },
		{ href: `${base}/tracks`, label: 'Tracks', icon: '◼' },
		{ href: `${base}/oracles`, label: 'Oracles', icon: '🎲' },
		{ href: `${base}/world`, label: 'World', icon: '🌍' },
		{ href: `${base}/delves`, label: 'Delves', icon: '🕳' },
		{ href: `${base}/journal`, label: 'Journal', icon: '📖' },
		{ href: `${base}/reference`, label: 'Contents', icon: '📚' },
	];

	function isActive(href: string, pathname: string) {
		const path = href.replace(base, '') || '/';
		const current = pathname.replace(base, '') || '/';
		if (path === '/') return current === '/';
		return current.startsWith(path);
	}
</script>

<div class="app-shell" class:pdf-panel-open={referencePanelStore.isOpen} class:pdf-fullscreen={referencePanelStore.isFullscreen}>
	<nav class="sidebar" class:collapsed={sidebarCollapsed}>
		<div class="sidebar-header">
			<span style="font-size: 20px;">⚔</span>
			{#if !sidebarCollapsed}<h1>IRONSWORN</h1>{/if}
			<button
				class="sidebar-toggle"
				onclick={() => sidebarCollapsed = !sidebarCollapsed}
				title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
			>
				{sidebarCollapsed ? '▶' : '◀'}
			</button>
		</div>

		<div class="sidebar-nav">
			{#each nav as item}
				<a
					href={item.href}
					class:active={isActive(item.href, $page.url.pathname)}
					title={sidebarCollapsed ? item.label : ''}
				>
					<span>{item.icon}</span>
					{#if !sidebarCollapsed}{item.label}{/if}
				</a>
			{/each}
		</div>

		<div class="sidebar-rulebook-toggle">
			<button
				class="rulebook-toggle-btn"
				class:active={referencePanelStore.isOpen}
				onclick={() => referencePanelStore.toggle()}
				title={sidebarCollapsed ? 'Toggle Rulebook (?)' : ''}
			>
				<span>📖</span>
				{#if !sidebarCollapsed}<span class="rulebook-toggle-label">Rulebook <kbd>?</kbd></span>{/if}
			</button>
		</div>

		{#if characterStore.initialized}
			<div class="quick-stats">
				{#if sidebarCollapsed}
					<div class="meter-compact" title="H{characterStore.meters.health} S{characterStore.meters.spirit} Su{characterStore.meters.supply} M{characterStore.meters.momentum}">
						<span class="meter-pip health">{characterStore.meters.health}</span>
						<span class="meter-pip spirit">{characterStore.meters.spirit}</span>
						<span class="meter-pip supply">{characterStore.meters.supply}</span>
						<span class="meter-pip momentum">{characterStore.meters.momentum}</span>
					</div>
				{:else}
					<div class="sidebar-section-label">{characterStore.name || 'Unnamed'}</div>

					<div class="meter-row">
						<span class="meter-label health">Health</span>
						<button class="meter-btn" onclick={() => characterStore.adjustHealth(-1)}>-</button>
						<span class="meter-value">{characterStore.meters.health}</span>
						<button class="meter-btn" onclick={() => characterStore.adjustHealth(1)}>+</button>
					</div>

					<div class="meter-row">
						<span class="meter-label spirit">Spirit</span>
						<button class="meter-btn" onclick={() => characterStore.adjustSpirit(-1)}>-</button>
						<span class="meter-value">{characterStore.meters.spirit}</span>
						<button class="meter-btn" onclick={() => characterStore.adjustSpirit(1)}>+</button>
					</div>

					<div class="meter-row">
						<span class="meter-label supply">Supply</span>
						<button class="meter-btn" onclick={() => characterStore.adjustSupply(-1)}>-</button>
						<span class="meter-value">{characterStore.meters.supply}</span>
						<button class="meter-btn" onclick={() => characterStore.adjustSupply(1)}>+</button>
					</div>

					<div class="meter-row">
						<span class="meter-label momentum">Moment.</span>
						<button class="meter-btn" onclick={() => characterStore.adjustMomentum(-1)}>-</button>
						<span class="meter-value">{characterStore.meters.momentum}</span>
						<button class="meter-btn" onclick={() => characterStore.adjustMomentum(1)}>+</button>
					</div>

					<div class="momentum-info">
						<span class="text-sm text-muted">Max {characterStore.maxMomentum} / Reset {characterStore.momentumReset}</span>
					</div>
				{/if}
			</div>
		{:else if !sidebarCollapsed}
			<div class="quick-stats">
				<a href="{base}/character/create" class="btn btn-primary w-full" style="text-decoration: none; text-align: center;">
					Create Character
				</a>
			</div>
		{/if}

		{#if !sidebarCollapsed}
			<div class="sidebar-attribution">
				<a href="https://www.ironswornrpg.com" target="_blank" rel="noopener noreferrer">Ironsworn</a> by
				<a href="https://www.ironswornrpg.com" target="_blank" rel="noopener noreferrer">Shawn Tomkin</a>.
				Licensed under
				<a href="https://creativecommons.org/licenses/by-nc-sa/4.0/" target="_blank" rel="noopener noreferrer">CC BY-NC-SA 4.0</a>.
			</div>
		{/if}
	</nav>

	<main class="main-content">
		{#if loaded}
			{@render children()}
		{/if}
	</main>

	{#if referencePanelStore.isOpen}
		<RulebookPanel />
	{/if}
</div>
