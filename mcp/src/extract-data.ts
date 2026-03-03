/**
 * Data extraction script — run with `npm run extract-data`
 * Imports the TypeScript data arrays from the SvelteKit app and writes JSON files.
 * Uses tsx to handle TypeScript imports directly.
 */

import { writeFileSync, mkdirSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = resolve(__dirname, 'data');
const srcLib = resolve(__dirname, '../../src/lib');

// Shim $lib imports by registering a loader isn't needed with tsx —
// we just import directly from the resolved paths.

async function main() {
	mkdirSync(dataDir, { recursive: true });

	// Import from the SvelteKit source files directly
	const { MOVES, MOVE_CATEGORIES } = await import(
		`file://${srcLib}/data/moves.ts`
	);
	const { ORACLE_TABLES } = await import(
		`file://${srcLib}/data/oracles.ts`
	);
	const { ASSETS } = await import(
		`file://${srcLib}/data/assets.ts`
	);
	const { RULEBOOK_SECTIONS, MOVE_RULEBOOK_REFS, ORACLE_RULEBOOK_REFS, REFERENCE_INDEX } = await import(
		`file://${srcLib}/data/rulebook-index.ts`
	);

	writeFileSync(
		resolve(dataDir, 'moves.json'),
		JSON.stringify({ moves: MOVES, categories: MOVE_CATEGORIES }, null, '\t')
	);
	console.log(`Wrote moves.json (${MOVES.length} moves)`);

	writeFileSync(
		resolve(dataDir, 'oracles.json'),
		JSON.stringify({ tables: ORACLE_TABLES }, null, '\t')
	);
	console.log(`Wrote oracles.json (${ORACLE_TABLES.length} tables)`);

	writeFileSync(
		resolve(dataDir, 'assets.json'),
		JSON.stringify({ assets: ASSETS }, null, '\t')
	);
	console.log(`Wrote assets.json (${ASSETS.length} assets)`);

	writeFileSync(
		resolve(dataDir, 'rulebook-index.json'),
		JSON.stringify({
			sections: RULEBOOK_SECTIONS,
			moveRefs: MOVE_RULEBOOK_REFS,
			oracleRefs: ORACLE_RULEBOOK_REFS,
			referenceIndex: REFERENCE_INDEX
		}, null, '\t')
	);
	console.log(`Wrote rulebook-index.json (${RULEBOOK_SECTIONS.length} sections)`);

	console.log('Done!');
}

main().catch(err => {
	console.error('Extraction failed:', err);
	process.exit(1);
});
