import type { PdfRef } from './pdf-types';

// ── Move ID → Rulebook page ──
// Based on the standard Ironsworn Rulebook PDF page numbering
export const MOVE_PDF_REFS: Record<string, PdfRef> = {
	// Adventure Moves (Chapter 3)
	'face-danger':         { pdf: 'rulebook', page: 60 },
	'secure-advantage':    { pdf: 'rulebook', page: 61 },
	'gather-information':  { pdf: 'rulebook', page: 62 },
	'heal':                { pdf: 'rulebook', page: 63 },
	'resupply':            { pdf: 'rulebook', page: 64 },
	'make-camp':           { pdf: 'rulebook', page: 65 },
	'undertake-journey':   { pdf: 'rulebook', page: 66 },
	'reach-destination':   { pdf: 'rulebook', page: 68 },

	// Relationship Moves
	'compel':              { pdf: 'rulebook', page: 69 },
	'sojourn':             { pdf: 'rulebook', page: 71 },
	'draw-circle':         { pdf: 'rulebook', page: 73 },
	'forge-bond':          { pdf: 'rulebook', page: 74 },
	'test-bond':           { pdf: 'rulebook', page: 75 },
	'aid-ally':            { pdf: 'rulebook', page: 76 },
	'write-epilogue':      { pdf: 'rulebook', page: 77 },

	// Combat Moves
	'enter-fray':          { pdf: 'rulebook', page: 78 },
	'strike':              { pdf: 'rulebook', page: 79 },
	'clash':               { pdf: 'rulebook', page: 80 },
	'turn-tide':           { pdf: 'rulebook', page: 81 },
	'end-fight':           { pdf: 'rulebook', page: 82 },
	'battle':              { pdf: 'rulebook', page: 83 },

	// Suffer Moves
	'endure-harm':         { pdf: 'rulebook', page: 91 },
	'face-death':          { pdf: 'rulebook', page: 92 },
	'companion-endure-harm': { pdf: 'rulebook', page: 93 },
	'endure-stress':       { pdf: 'rulebook', page: 94 },
	'face-desolation':     { pdf: 'rulebook', page: 95 },
	'out-of-supply':       { pdf: 'rulebook', page: 96 },
	'face-setback':        { pdf: 'rulebook', page: 96 },

	// Quest Moves
	'swear-iron-vow':      { pdf: 'rulebook', page: 98 },
	'reach-milestone':     { pdf: 'rulebook', page: 100 },
	'fulfill-vow':         { pdf: 'rulebook', page: 101 },
	'forsake-vow':         { pdf: 'rulebook', page: 102 },
	'advance':             { pdf: 'rulebook', page: 103 },

	// Fate Moves
	'pay-the-price':       { pdf: 'rulebook', page: 105 },
	'ask-the-oracle':      { pdf: 'rulebook', page: 107 },
};

// ── Oracle table ID → Rulebook page ──
export const ORACLE_PDF_REFS: Record<string, PdfRef> = {
	'action':               { pdf: 'rulebook', page: 167 },
	'theme':                { pdf: 'rulebook', page: 168 },
	'region':               { pdf: 'rulebook', page: 119 },
	'location':             { pdf: 'rulebook', page: 176 },
	'pay-the-price':        { pdf: 'rulebook', page: 105 },
	'character-role':       { pdf: 'rulebook', page: 182 },
	'character-descriptor': { pdf: 'rulebook', page: 183 },
	'ironlander-name':      { pdf: 'rulebook', page: 184 },
	'elf-name':             { pdf: 'rulebook', page: 185 },
	'giant-name':           { pdf: 'rulebook', page: 185 },
	'varou-name':           { pdf: 'rulebook', page: 186 },
	'troll-name':           { pdf: 'rulebook', page: 186 },
	'settlement-name':      { pdf: 'rulebook', page: 178 },
	'settlement-trouble':   { pdf: 'rulebook', page: 179 },
	'character-goal':       { pdf: 'rulebook', page: 182 },
	'character-disposition': { pdf: 'rulebook', page: 183 },
	'character-activity':   { pdf: 'rulebook', page: 183 },
	'coastal-features':     { pdf: 'rulebook', page: 176 },
	'mystic-backlash':      { pdf: 'rulebook', page: 175 },
	'major-plot-twist':     { pdf: 'rulebook', page: 174 },
	'combat-action':        { pdf: 'rulebook', page: 173 },
};

// ── Asset ID → Assets PDF page ──
export const ASSET_PDF_REFS: Record<string, PdfRef> = {
	// Companions
	'cave-lion':     { pdf: 'assets', page: 2 },
	'hawk':          { pdf: 'assets', page: 2 },
	'horse':         { pdf: 'assets', page: 3 },
	'hound':         { pdf: 'assets', page: 3 },
	'kindred':       { pdf: 'assets', page: 4 },
	'young-wyvern':  { pdf: 'assets', page: 4 },

	// Paths
	'herbalist':     { pdf: 'assets', page: 5 },
	'hunter':        { pdf: 'assets', page: 5 },
	'ironclad':      { pdf: 'assets', page: 6 },
	'ritualist':     { pdf: 'assets', page: 6 },
	'shadow-walk':   { pdf: 'assets', page: 7 },
	'wayfinder':     { pdf: 'assets', page: 7 },

	// Combat Talents
	'archer':        { pdf: 'assets', page: 8 },
	'berserker':     { pdf: 'assets', page: 8 },
	'blade-bound':   { pdf: 'assets', page: 9 },
	'shield-bearer': { pdf: 'assets', page: 9 },

	// Rituals
	'augur':         { pdf: 'assets', page: 10 },
	'bind':          { pdf: 'assets', page: 10 },
	'communion':     { pdf: 'assets', page: 11 },
	'leech':         { pdf: 'assets', page: 11 },
	'scry':          { pdf: 'assets', page: 12 },
	'visage':        { pdf: 'assets', page: 12 },
	'ward':          { pdf: 'assets', page: 13 },
};

// ── Browsable reference index ──
export interface IndexEntry {
	topic: string;
	category: string;
	ref: PdfRef;
}

export const REFERENCE_INDEX: IndexEntry[] = [
	// Core Rules
	{ topic: 'The Basics',              category: 'Core Rules',    ref: { pdf: 'rulebook', page: 8 } },
	{ topic: 'Your Character',          category: 'Core Rules',    ref: { pdf: 'rulebook', page: 12 } },
	{ topic: 'Stats',                   category: 'Core Rules',    ref: { pdf: 'rulebook', page: 14 } },
	{ topic: 'Momentum',               category: 'Core Rules',    ref: { pdf: 'rulebook', page: 22 } },
	{ topic: 'Tracks & Progress',       category: 'Core Rules',    ref: { pdf: 'rulebook', page: 18 } },
	{ topic: 'Assets Overview',         category: 'Core Rules',    ref: { pdf: 'rulebook', page: 24 } },
	{ topic: 'Bonds',                   category: 'Core Rules',    ref: { pdf: 'rulebook', page: 28 } },

	// Gameplay
	{ topic: 'Making Moves',            category: 'Gameplay',      ref: { pdf: 'rulebook', page: 50 } },
	{ topic: 'Action Roll',             category: 'Gameplay',      ref: { pdf: 'rulebook', page: 52 } },
	{ topic: 'Progress Roll',           category: 'Gameplay',      ref: { pdf: 'rulebook', page: 54 } },
	{ topic: 'Matches',                 category: 'Gameplay',      ref: { pdf: 'rulebook', page: 55 } },
	{ topic: 'Harm & Stress',           category: 'Gameplay',      ref: { pdf: 'rulebook', page: 86 } },
	{ topic: 'Equipment & Vehicles',    category: 'Gameplay',      ref: { pdf: 'rulebook', page: 30 } },

	// World
	{ topic: 'The Ironlands',           category: 'World',         ref: { pdf: 'rulebook', page: 112 } },
	{ topic: 'Regions Overview',        category: 'World',         ref: { pdf: 'rulebook', page: 114 } },
	{ topic: 'Communities',             category: 'World',         ref: { pdf: 'rulebook', page: 130 } },
	{ topic: 'Iron Vows',               category: 'World',         ref: { pdf: 'rulebook', page: 136 } },
	{ topic: 'Foes & Encounters',       category: 'World',         ref: { pdf: 'rulebook', page: 134 } },

	// Oracles
	{ topic: 'Using Oracles',           category: 'Oracles',       ref: { pdf: 'rulebook', page: 166 } },
	{ topic: 'Action & Theme',          category: 'Oracles',       ref: { pdf: 'rulebook', page: 167 } },
	{ topic: 'Combat Action',           category: 'Oracles',       ref: { pdf: 'rulebook', page: 173 } },
	{ topic: 'Plot Twist',              category: 'Oracles',       ref: { pdf: 'rulebook', page: 174 } },
	{ topic: 'Settlement Oracles',      category: 'Oracles',       ref: { pdf: 'rulebook', page: 178 } },
	{ topic: 'Character Oracles',       category: 'Oracles',       ref: { pdf: 'rulebook', page: 182 } },
	{ topic: 'Name Oracles',            category: 'Oracles',       ref: { pdf: 'rulebook', page: 184 } },

	// Playkit
	{ topic: 'Moves Reference Sheet',   category: 'Playkit',       ref: { pdf: 'playkit', page: 1 } },
	{ topic: 'Character Sheet',          category: 'Playkit',       ref: { pdf: 'playkit', page: 3 } },
	{ topic: 'Progress Track Sheet',     category: 'Playkit',       ref: { pdf: 'playkit', page: 4 } },

	// Workbook
	{ topic: 'World Workbook Intro',     category: 'Workbook',      ref: { pdf: 'workbook', page: 1 } },
];
