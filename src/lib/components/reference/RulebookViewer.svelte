<script lang="ts">
	import { rulebookStore } from '$lib/stores/rulebook.svelte';
	import { referencePanelStore } from '$lib/stores/reference-panel.svelte';
	import { RULEBOOK_SECTIONS } from '$lib/data/rulebook-index';

	let { sectionSlug }: { sectionSlug: string } = $props();

	const markdown = $derived(rulebookStore.getSection(sectionSlug));
	const html = $derived(renderMarkdown(markdown));

	// Get subsections for the current section (direct children)
	const subsections = $derived(
		RULEBOOK_SECTIONS.filter(s => s.parent === sectionSlug)
	);

	function renderMarkdown(md: string): string {
		if (!md) return '<p class="text-muted">Section not found.</p>';

		const lines = md.split('\n');
		const output: string[] = [];
		let inList = false;
		let inOrderedList = false;
		let inTable = false;
		let inCodeBlock = false;
		let inBlockquote = false;

		for (let i = 0; i < lines.length; i++) {
			let line = lines[i];

			// Code blocks
			if (line.startsWith('```')) {
				if (inCodeBlock) {
					output.push('</pre>');
					inCodeBlock = false;
				} else {
					closeAll();
					output.push('<pre class="code-block">');
					inCodeBlock = true;
				}
				continue;
			}
			if (inCodeBlock) {
				output.push(escapeHtml(line));
				output.push('\n');
				continue;
			}

			// Blockquote lines
			if (/^>\s?/.test(line)) {
				const content = line.replace(/^>\s?/, '');

				// Open blockquote if not already in one
				if (!inBlockquote) {
					closeAll();
					output.push('<blockquote class="md-blockquote">');
					inBlockquote = true;
				}

				// Empty blockquote line = paragraph break within blockquote
				if (content.trim() === '') {
					continue;
				}

				// List item inside blockquote
				if (/^[-*+]\s+/.test(content)) {
					const text = content.replace(/^[-*+]\s+/, '');
					output.push(`<p class="bq-list-item">${inlineFormat(text)}</p>`);
					continue;
				}

				// Render blockquote content as paragraph
				output.push(`<p>${inlineFormat(content)}</p>`);
				continue;
			}

			// Close blockquote when we hit a non-blockquote line
			if (inBlockquote) {
				output.push('</blockquote>');
				inBlockquote = false;
			}

			// Table rows
			if (line.includes('|') && line.trim().startsWith('|')) {
				if (!inTable) {
					closeOpenLists();
					output.push('<table class="md-table">');
					inTable = true;
				}
				// Skip separator rows like |---|---|
				if (/^\|[\s\-:|]+\|$/.test(line.trim())) continue;

				const cells = line.split('|').filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
				const isHeader = i + 1 < lines.length && /^\|[\s\-:|]+\|$/.test(lines[i + 1]?.trim() ?? '');
				const tag = isHeader ? 'th' : 'td';
				output.push('<tr>');
				for (const cell of cells) {
					output.push(`<${tag}>${inlineFormat(cell.trim())}</${tag}>`);
				}
				output.push('</tr>');
				continue;
			} else if (inTable) {
				output.push('</table>');
				inTable = false;
			}

			// Headings
			const headingMatch = line.match(/^(#{1,4})\s+(.+)/);
			if (headingMatch) {
				closeOpenLists();
				const level = headingMatch[1].length;
				const text = headingMatch[2].trim();
				const tag = `h${Math.min(level + 1, 6)}`; // Shift down since h1 is panel title
				output.push(`<${tag} class="md-heading">${inlineFormat(text)}</${tag}>`);
				continue;
			}

			// Unordered list items
			if (/^(\s*)[-*+]\s+/.test(line)) {
				if (inOrderedList) { output.push('</ol>'); inOrderedList = false; }
				if (!inList) { output.push('<ul>'); inList = true; }
				const text = line.replace(/^(\s*)[-*+]\s+/, '');
				output.push(`<li>${inlineFormat(text)}</li>`);
				continue;
			}

			// Ordered list items
			if (/^(\s*)\d+\.\s+/.test(line)) {
				if (inList) { output.push('</ul>'); inList = false; }
				if (!inOrderedList) { output.push('<ol>'); inOrderedList = true; }
				const text = line.replace(/^(\s*)\d+\.\s+/, '');
				output.push(`<li>${inlineFormat(text)}</li>`);
				continue;
			}

			// Close lists if we hit a non-list line
			closeOpenLists();

			// Blank line
			if (line.trim() === '') {
				continue;
			}

			// Paragraph
			output.push(`<p>${inlineFormat(line)}</p>`);
		}

		closeAll();
		if (inTable) output.push('</table>');
		if (inCodeBlock) output.push('</pre>');

		return output.join('\n');

		function closeOpenLists() {
			if (inList) { output.push('</ul>'); inList = false; }
			if (inOrderedList) { output.push('</ol>'); inOrderedList = false; }
		}

		function closeAll() {
			closeOpenLists();
			if (inBlockquote) { output.push('</blockquote>'); inBlockquote = false; }
		}
	}

	function escapeHtml(text: string): string {
		return text
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;');
	}

	function inlineFormat(text: string): string {
		text = escapeHtml(text);
		// Bold
		text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
		// Italic
		text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');
		text = text.replace(/_(.+?)_/g, '<em>$1</em>');
		return text;
	}

	function handleClick(e: MouseEvent) {
		const target = e.target as HTMLElement;
		const link = target.closest('a');
		if (link) {
			const href = link.getAttribute('href');
			if (href?.startsWith('#')) {
				e.preventDefault();
				const slug = href.slice(1);
				referencePanelStore.openSection(slug);
			}
		}
	}
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="rulebook-viewer" onclick={handleClick}>
	{#if subsections.length > 0}
		<nav class="section-nav">
			{#each subsections as sub}
				<button
					class="nav-item"
					onclick={() => referencePanelStore.openSection(sub.slug)}
				>
					{sub.heading}
				</button>
			{/each}
		</nav>
	{/if}

	<div class="md-content">
		{@html html}
	</div>

	<footer class="viewer-attribution">
		<a href="https://www.ironswornrpg.com" target="_blank" rel="noopener noreferrer">Ironsworn</a>
		&copy; 2018 Shawn Tomkin, licensed under
		<a href="https://creativecommons.org/licenses/by-nc-sa/4.0/" target="_blank" rel="noopener noreferrer">CC BY-NC-SA 4.0</a>.
	</footer>
</div>

<style>
	.rulebook-viewer {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	.section-nav {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-xs);
		padding: var(--space-sm);
		background: var(--bg-raised);
		border-radius: var(--radius-md);
	}

	.nav-item {
		padding: var(--space-xs) var(--space-sm);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		background: var(--bg-overlay);
		color: var(--text-secondary);
		font-size: 12px;
		cursor: pointer;
		font-family: var(--font-body);
	}
	.nav-item:hover {
		border-color: var(--accent);
		color: var(--accent);
	}

	.md-content {
		font-size: 14px;
		line-height: 1.7;
		color: var(--text-secondary);
	}

	.md-content :global(h2) {
		font-size: 20px;
		font-weight: 700;
		color: var(--text-primary);
		margin: var(--space-xl) 0 var(--space-md);
		padding-bottom: var(--space-xs);
		border-bottom: 1px solid var(--border);
	}
	.md-content :global(h3) {
		font-size: 16px;
		font-weight: 700;
		color: var(--text-primary);
		margin: var(--space-lg) 0 var(--space-sm);
	}
	.md-content :global(h4) {
		font-size: 14px;
		font-weight: 700;
		color: var(--text-primary);
		margin: var(--space-md) 0 var(--space-xs);
	}
	.md-content :global(h5) {
		font-size: 13px;
		font-weight: 700;
		color: var(--text-primary);
		margin: var(--space-sm) 0 var(--space-xs);
	}
	.md-content :global(p) {
		margin: var(--space-sm) 0;
	}
	.md-content :global(ul),
	.md-content :global(ol) {
		margin: var(--space-sm) 0;
		padding-left: var(--space-xl);
	}
	.md-content :global(li) {
		margin: var(--space-xs) 0;
	}
	.md-content :global(strong) {
		color: var(--text-primary);
		font-weight: 700;
	}
	.md-content :global(.md-table) {
		width: 100%;
		border-collapse: collapse;
		margin: var(--space-md) 0;
		font-size: 13px;
	}
	.md-content :global(.md-table th),
	.md-content :global(.md-table td) {
		padding: var(--space-xs) var(--space-sm);
		border: 1px solid var(--border);
		text-align: left;
	}
	.md-content :global(.md-table th) {
		background: var(--bg-raised);
		font-weight: 700;
		color: var(--text-primary);
	}
	.md-content :global(.md-blockquote) {
		border-left: 3px solid var(--accent);
		background: var(--bg-raised);
		margin: var(--space-md) 0;
		padding: var(--space-sm) var(--space-md);
		border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
	}
	.md-content :global(.md-blockquote p) {
		margin: var(--space-xs) 0;
	}
	.md-content :global(.md-blockquote .bq-list-item) {
		padding-left: var(--space-md);
	}
	.md-content :global(.md-blockquote .bq-list-item::before) {
		content: '•';
		margin-right: var(--space-xs);
		color: var(--text-muted);
	}
	.md-content :global(.code-block) {
		background: var(--bg-raised);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		padding: var(--space-md);
		font-family: var(--font-mono);
		font-size: 12px;
		overflow-x: auto;
		white-space: pre-wrap;
		margin: var(--space-md) 0;
	}

	.viewer-attribution {
		margin-top: var(--space-xl);
		padding-top: var(--space-sm);
		border-top: 1px solid var(--border);
		font-size: 11px;
		color: var(--text-muted);
		text-align: center;
	}
	.viewer-attribution a {
		color: var(--text-muted);
		text-decoration: underline;
		text-underline-offset: 2px;
	}
	.viewer-attribution a:hover {
		color: var(--text-secondary);
	}
</style>
