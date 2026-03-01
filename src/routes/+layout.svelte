<script lang="ts">
	import '../app.css';
	import { page } from '$app/stores';
	import { characterStore } from '$lib/stores/character.svelte';
	import { campaignStore } from '$lib/stores/campaign.svelte';
	import { loadFromLocalStorage, saveToLocalStorage } from '$lib/stores/persistence.svelte';
	import { onMount } from 'svelte';

	let { children } = $props();

	let loaded = $state(false);

	onMount(() => {
		loadFromLocalStorage();
		loaded = true;
	});

	// Auto-save on changes
	$effect(() => {
		if (!loaded) return;
		// Touch reactive state to track it
		const _ = JSON.stringify(characterStore.character);
		const __ = JSON.stringify(campaignStore.tracks);
		const ___ = campaignStore.journal.length;
		// Debounce save
		const timer = setTimeout(() => saveToLocalStorage(), 500);
		return () => clearTimeout(timer);
	});

	const nav = [
		{ href: '/', label: 'Play', icon: '⚔' },
		{ href: '/character', label: 'Character', icon: '👤' },
		{ href: '/moves', label: 'Moves', icon: '📜' },
		{ href: '/tracks', label: 'Tracks', icon: '◼' },
		{ href: '/oracles', label: 'Oracles', icon: '🎲' },
		{ href: '/journal', label: 'Journal', icon: '📖' },
	];

	function isActive(href: string, pathname: string) {
		if (href === '/') return pathname === '/';
		return pathname.startsWith(href);
	}
</script>

<div class="app-shell">
	<nav class="sidebar">
		<div class="sidebar-header">
			<span style="font-size: 20px;">⚔</span>
			<h1>IRONSWORN</h1>
		</div>

		<div class="sidebar-nav">
			{#each nav as item}
				<a
					href={item.href}
					class:active={isActive(item.href, $page.url.pathname)}
				>
					<span>{item.icon}</span>
					{item.label}
				</a>
			{/each}
		</div>

		{#if characterStore.initialized}
			<div class="quick-stats">
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
			</div>
		{:else}
			<div class="quick-stats">
				<a href="/character/create" class="btn btn-primary w-full" style="text-decoration: none; text-align: center;">
					Create Character
				</a>
			</div>
		{/if}
	</nav>

	<main class="main-content">
		{#if loaded}
			{@render children()}
		{/if}
	</main>
</div>
