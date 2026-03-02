import { RULEBOOK_SECTIONS, type RulebookSection } from '$lib/data/rulebook-index';
import { base } from '$app/paths';

function createRulebookStore() {
	let rawContent = $state('');
	let ready = $state(false);
	let lines = $state<string[]>([]);

	return {
		get ready() { return ready; },

		async init() {
			try {
				const res = await fetch(`${base}/Ironsworn-Rulebook.md`);
				if (!res.ok) throw new Error(`Failed to fetch rulebook: ${res.status}`);
				rawContent = await res.text();
				lines = rawContent.split('\n');
				ready = true;
			} catch (e) {
				console.warn('Rulebook store init failed:', e);
			}
		},

		getSection(slug: string): string {
			if (!ready) return '';
			const section = RULEBOOK_SECTIONS.find(s => s.slug === slug);
			if (!section) return '';

			const startLine = section.line - 1; // 0-indexed
			// Find the next section at the same or higher level
			const idx = RULEBOOK_SECTIONS.indexOf(section);
			let endLine = lines.length;
			for (let i = idx + 1; i < RULEBOOK_SECTIONS.length; i++) {
				if (RULEBOOK_SECTIONS[i].level <= section.level) {
					endLine = RULEBOOK_SECTIONS[i].line - 1;
					break;
				}
			}

			return lines.slice(startLine, endLine).join('\n');
		},

		searchSections(query: string): RulebookSection[] {
			if (!query.trim()) return [];
			const q = query.toLowerCase();
			return RULEBOOK_SECTIONS.filter(s =>
				s.heading.toLowerCase().includes(q) ||
				s.category.toLowerCase().includes(q)
			);
		},
	};
}

export const rulebookStore = createRulebookStore();
