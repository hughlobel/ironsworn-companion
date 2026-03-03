import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { RulebookSection } from '../types.js';
import { getSectionContent, searchRulebook } from '../rulebook.js';

export function registerRulebookTools(server: McpServer, sections: RulebookSection[]) {
	const sectionMap = new Map(sections.map(s => [s.slug, s]));

	server.tool(
		'lookup_rules',
		'Look up a rulebook section by slug or heading. Returns the full markdown content of that section.',
		{
			section: z.string().describe('Section slug (e.g. "momentum", "the-action-roll", "face-danger") or heading text to search for')
		},
		async ({ section }) => {
			// Try exact slug match first
			let found = sectionMap.get(section);

			// Try case-insensitive slug match
			if (!found) {
				const lower = section.toLowerCase().replace(/\s+/g, '-');
				found = sectionMap.get(lower);
			}

			// Try heading match
			if (!found) {
				const lower = section.toLowerCase();
				found = sections.find(s =>
					s.heading.toLowerCase() === lower ||
					s.heading.toLowerCase().includes(lower)
				);
			}

			if (!found) {
				// List matching sections
				const lower = section.toLowerCase();
				const matches = sections.filter(s =>
					s.slug.includes(lower) || s.heading.toLowerCase().includes(lower)
				);
				if (matches.length > 0) {
					let text = `No exact match for "${section}". Did you mean:\n`;
					for (const m of matches.slice(0, 10)) {
						text += `- \`${m.slug}\` — ${m.heading}\n`;
					}
					return { content: [{ type: 'text', text }] };
				}
				return { content: [{ type: 'text', text: `Section not found: "${section}"` }] };
			}

			const content = getSectionContent(found, sections);
			let text = `## ${found.heading}\n`;
			text += `*${found.category}* | slug: \`${found.slug}\`\n\n`;
			text += content;

			return { content: [{ type: 'text', text }] };
		}
	);

	server.tool(
		'search_rules',
		'Full-text search across the Ironsworn rulebook. Returns matching sections with context.',
		{
			query: z.string().describe('Search query')
		},
		async ({ query }) => {
			const results = searchRulebook(query, sections);

			if (results.length === 0) {
				return { content: [{ type: 'text', text: `No results for "${query}".` }] };
			}

			let text = `**Search results for "${query}"** (${results.length} matches)\n\n`;
			for (const r of results) {
				text += `### ${r.section.heading} (\`${r.section.slug}\`)\n`;
				text += `${r.excerpt}\n\n---\n\n`;
			}

			return { content: [{ type: 'text', text }] };
		}
	);
}
