<script lang="ts">
	import { RULEBOOK_SECTIONS, type RulebookSection } from '$lib/data/rulebook-index';
	import { referencePanelStore } from '$lib/stores/reference-panel.svelte';
	import { onMount } from 'svelte';

	onMount(() => {
		referencePanelStore.openLastOrFirst();
	});

	let search = $state('');

	// Build chapter tree: level 1 sections are chapters, level 2 are sections, level 3 are subsections
	interface TocEntry {
		section: RulebookSection;
		children: TocEntry[];
	}

	function buildToc(sections: RulebookSection[]): TocEntry[] {
		const chapters: TocEntry[] = [];
		const bySlug = new Map<string, TocEntry>();

		for (const s of sections) {
			const entry: TocEntry = { section: s, children: [] };
			bySlug.set(s.slug, entry);

			if (s.level === 1) {
				chapters.push(entry);
			} else if (s.parent) {
				const parent = bySlug.get(s.parent);
				if (parent) parent.children.push(entry);
			}
		}
		return chapters;
	}

	const fullToc = buildToc(RULEBOOK_SECTIONS);

	// Filter TOC based on search
	function matchesSearch(entry: TocEntry, query: string): boolean {
		if (entry.section.heading.toLowerCase().includes(query)) return true;
		return entry.children.some(c => matchesSearch(c, query));
	}

	function filterToc(chapters: TocEntry[], query: string): TocEntry[] {
		if (!query) return chapters;
		return chapters
			.filter(ch => matchesSearch(ch, query))
			.map(ch => ({
				...ch,
				children: ch.children
					.filter(sec => matchesSearch(sec, query))
					.map(sec => ({
						...sec,
						children: sec.children.filter(sub =>
							sub.section.heading.toLowerCase().includes(query)
						)
					}))
			}));
	}

	const filteredToc = $derived(filterToc(fullToc, search.trim().toLowerCase()));

	// Track which chapters are expanded
	let expanded = $state(new Set<string>());

	function toggleChapter(slug: string) {
		const next = new Set(expanded);
		if (next.has(slug)) next.delete(slug);
		else next.add(slug);
		expanded = next;
	}

	function openSection(slug: string) {
		referencePanelStore.openSection(slug);
	}

	// When searching, auto-expand all
	const isSearching = $derived(search.trim().length > 0);
</script>

<div class="reference-page">
	<div class="browse-mode">
		<div class="page-header">
			<h2>Rulebook</h2>
		</div>

		<div class="license-notice">
			<strong>Ironsworn</strong> is written and designed by Shawn Tomkin. The text is licensed under the
			<a href="https://creativecommons.org/licenses/by-nc-sa/4.0/" target="_blank" rel="noopener noreferrer">Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License</a>.
			For more information, visit <a href="https://www.ironswornrpg.com" target="_blank" rel="noopener noreferrer">ironswornrpg.com</a>.
			<br/>
			Inspired by
			<a href="https://nboughton.uk/apps/ironsworn-campaign" target="_blank" rel="noopener noreferrer">Ironsworn Campaign</a> by Nick Boughton
			and <a href="https://ironvault.quest/" target="_blank" rel="noopener noreferrer">Iron Vault</a>.
		</div>

		<div class="search-bar">
			<input
				type="text"
				placeholder="Search sections..."
				bind:value={search}
				class="search-input"
			/>
		</div>

		{#each filteredToc as chapter}
			<div class="chapter-section">
				<!-- Chapter heading (level 1) -->
				<button
					class="chapter-title"
					onclick={() => toggleChapter(chapter.section.slug)}
				>
					<span class="chevron" class:open={isSearching || expanded.has(chapter.section.slug)}>&#9656;</span>
					<span
						class="chapter-name"
						role="link"
						tabindex="-1"
						onclick={(e) => { e.stopPropagation(); openSection(chapter.section.slug); }}
					>{chapter.section.heading}</span>
				</button>

				<!-- Sections (level 2) and subsections (level 3) -->
				{#if isSearching || expanded.has(chapter.section.slug)}
					<div class="section-list">
						{#each chapter.children as sec}
							<div class="section-group">
								<button
									class="section-item"
									onclick={() => openSection(sec.section.slug)}
								>
									<span class="section-name">{sec.section.heading}</span>
								</button>

								{#if sec.children.length > 0}
									<div class="subsection-list">
										{#each sec.children as sub}
											<button
												class="subsection-item"
												onclick={() => openSection(sub.section.slug)}
											>
												{sub.section.heading}
											</button>
										{/each}
									</div>
								{/if}
							</div>
						{/each}
					</div>
				{/if}
			</div>
		{/each}

		{#if filteredToc.length === 0}
			<p class="text-muted" style="text-align:center; padding: var(--space-lg);">No sections match your search.</p>
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
		gap: var(--space-md);
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

	.license-notice {
		font-size: 12px;
		line-height: 1.6;
		color: var(--text-muted);
		padding: var(--space-sm) var(--space-md);
		background: var(--bg-raised);
		border-radius: var(--radius-md);
		border: 1px solid var(--border);
	}
	.license-notice a {
		color: var(--text-secondary);
		text-decoration: underline;
		text-underline-offset: 2px;
	}
	.license-notice a:hover {
		color: var(--accent);
	}

	/* Chapter (level 1) */
	.chapter-section {
		display: flex;
		flex-direction: column;
	}
	.chapter-title {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
		padding: var(--space-sm) var(--space-xs);
		background: none;
		border: none;
		cursor: pointer;
		font-family: var(--font-body);
		font-size: 15px;
		font-weight: 700;
		color: var(--text-primary);
		border-bottom: 1px solid var(--border);
		text-align: left;
		width: 100%;
	}
	.chapter-title:hover {
		background: var(--bg-raised);
	}
	.chevron {
		font-size: 11px;
		color: var(--text-muted);
		transition: transform 0.15s;
		flex-shrink: 0;
		width: 14px;
		text-align: center;
	}
	.chevron.open {
		transform: rotate(90deg);
	}
	.chapter-name:hover {
		color: var(--accent);
	}

	/* Section (level 2) */
	.section-list {
		display: flex;
		flex-direction: column;
		padding-left: var(--space-md);
	}
	.section-group {
		display: flex;
		flex-direction: column;
	}
	.section-item {
		display: flex;
		align-items: center;
		padding: var(--space-xs) var(--space-sm);
		background: none;
		border: none;
		cursor: pointer;
		font-family: var(--font-body);
		font-size: 14px;
		font-weight: 600;
		color: var(--text-secondary);
		text-align: left;
		width: 100%;
		border-radius: var(--radius-sm);
	}
	.section-item:hover {
		background: var(--bg-raised);
		color: var(--accent);
	}

	/* Subsection (level 3) */
	.subsection-list {
		display: flex;
		flex-direction: column;
		padding-left: var(--space-lg);
	}
	.subsection-item {
		display: flex;
		align-items: center;
		padding: 2px var(--space-sm);
		background: none;
		border: none;
		cursor: pointer;
		font-family: var(--font-body);
		font-size: 13px;
		color: var(--text-muted);
		text-align: left;
		width: 100%;
		border-radius: var(--radius-sm);
	}
	.subsection-item:hover {
		background: var(--bg-raised);
		color: var(--accent);
	}
</style>
