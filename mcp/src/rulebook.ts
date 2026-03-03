import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import type { RulebookSection } from './types.js';

let rulebookLines: string[] | null = null;
let rulebookPath: string | null = null;

function getRulebookPath(): string {
	if (rulebookPath) return rulebookPath;
	// Check env var first, then try relative paths
	if (process.env.IRONSWORN_RULEBOOK && existsSync(process.env.IRONSWORN_RULEBOOK)) {
		rulebookPath = process.env.IRONSWORN_RULEBOOK;
	} else {
		// Try relative to mcp/dist/ — go up to ironsworn-companion/static/
		const relative = resolve(import.meta.dirname ?? '.', '../../static/Ironsworn-Rulebook.md');
		if (existsSync(relative)) {
			rulebookPath = relative;
		}
	}
	if (!rulebookPath) {
		throw new Error(
			'Rulebook not found. Set IRONSWORN_RULEBOOK env var to the path of Ironsworn-Rulebook.md'
		);
	}
	return rulebookPath;
}

function loadRulebook(): string[] {
	if (rulebookLines) return rulebookLines;
	const path = getRulebookPath();
	const content = readFileSync(path, 'utf-8');
	rulebookLines = content.split('\n');
	return rulebookLines;
}

export function getSectionContent(
	section: RulebookSection,
	allSections: RulebookSection[]
): string {
	const lines = loadRulebook();
	const startLine = section.line - 1; // 0-indexed

	// Find the next section's line to know where this one ends
	const sortedSections = [...allSections].sort((a, b) => a.line - b.line);
	const idx = sortedSections.findIndex(s => s.slug === section.slug);
	const endLine = idx < sortedSections.length - 1
		? sortedSections[idx + 1].line - 1
		: lines.length;

	return lines.slice(startLine, endLine).join('\n').trim();
}

export function searchRulebook(
	query: string,
	allSections: RulebookSection[]
): Array<{ section: RulebookSection; excerpt: string }> {
	const lines = loadRulebook();
	const lowerQuery = query.toLowerCase();
	const results: Array<{ section: RulebookSection; excerpt: string }> = [];
	const seen = new Set<string>();

	// Sort sections by line number
	const sortedSections = [...allSections].sort((a, b) => a.line - b.line);

	for (let i = 0; i < lines.length; i++) {
		if (!lines[i].toLowerCase().includes(lowerQuery)) continue;

		// Find which section this line belongs to
		let matchSection: RulebookSection | undefined;
		for (let j = sortedSections.length - 1; j >= 0; j--) {
			if (sortedSections[j].line - 1 <= i) {
				matchSection = sortedSections[j];
				break;
			}
		}
		if (!matchSection || seen.has(matchSection.slug)) continue;
		seen.add(matchSection.slug);

		// Extract context around the match (±3 lines)
		const start = Math.max(0, i - 3);
		const end = Math.min(lines.length, i + 4);
		const excerpt = lines.slice(start, end).join('\n');

		results.push({ section: matchSection, excerpt });

		if (results.length >= 10) break;
	}

	return results;
}
