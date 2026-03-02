import type { DelveSite, TrackRank } from '$lib/data/types';

export const DENIZEN_LABELS = [
	'Very Common',
	'Common', 'Common', 'Common',
	'Uncommon', 'Uncommon', 'Uncommon', 'Uncommon',
	'Rare', 'Rare', 'Rare',
	'Unforeseen'
];

export function createDefaultDenizens(): string[] {
	return Array(12).fill('');
}

export function createSite(
	name: string,
	rank: TrackRank,
	objective: string,
	theme: string,
	domain: string
): DelveSite {
	return {
		id: crypto.randomUUID(),
		name,
		rank,
		ticks: 0,
		completed: false,
		objective,
		theme,
		domain,
		notes: '',
		denizens: createDefaultDenizens()
	};
}

/**
 * Roll a denizen from the table using Ironsworn: Delve probability weights.
 * Very Common: 1–27 (27%), Common×3: 28–41, 42–55, 56–69 (14% each),
 * Uncommon×4: 70–75, 76–81, 82–87, 88–93 (6% each),
 * Rare×3: 94–95, 96–97, 98–99 (2% each), Unforeseen: 100 (1%)
 */
export function rollDenizen(denizens: string[]): { index: number; name: string } {
	const roll = Math.floor(Math.random() * 100) + 1;
	let index: number;
	if (roll <= 27) index = 0;
	else if (roll <= 41) index = 1;
	else if (roll <= 55) index = 2;
	else if (roll <= 69) index = 3;
	else if (roll <= 75) index = 4;
	else if (roll <= 81) index = 5;
	else if (roll <= 87) index = 6;
	else if (roll <= 93) index = 7;
	else if (roll <= 95) index = 8;
	else if (roll <= 97) index = 9;
	else if (roll <= 99) index = 10;
	else index = 11;

	return { index, name: denizens[index] || `(Empty slot ${index + 1})` };
}
