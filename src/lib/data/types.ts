// ── Stats ──
export type Stat = 'edge' | 'heart' | 'iron' | 'shadow' | 'wits';

export interface Stats {
	edge: number;
	heart: number;
	iron: number;
	shadow: number;
	wits: number;
}

// ── Condition Meters ──
export interface ConditionMeters {
	health: number;    // 0–5
	spirit: number;    // 0–5
	supply: number;    // 0–5
	momentum: number;  // -6 to +10
}

// ── Debilities / Impacts ──
export interface Debilities {
	// Conditions
	wounded: boolean;
	shaken: boolean;
	unprepared: boolean;
	encumbered: boolean;
	// Banes
	maimed: boolean;
	corrupted: boolean;
	// Burdens
	cursed: boolean;
	tormented: boolean;
}

export type DebilityKey = keyof Debilities;

// ── Character ──
export interface Character {
	name: string;
	experience: number;
	experienceSpent: number;
	stats: Stats;
	meters: ConditionMeters;
	debilities: Debilities;
	bonds: number; // Progress track ticks (0–40)
	assets: CharacterAsset[];
	vows: ProgressTrack[];
}

// ── Dice / Rolls ──
export type RollOutcome = 'strong_hit' | 'weak_hit' | 'miss';

export interface ActionRoll {
	type: 'action';
	actionDie: number;     // 1–6
	challengeDie1: number; // 1–10
	challengeDie2: number; // 1–10
	stat: Stat | 'progress';
	statValue: number;
	adds: number;
	actionScore: number;   // min(actionDie + statValue + adds, 10)
	outcome: RollOutcome;
	isMatch: boolean;      // challenge dice are equal
	moveId?: string;
	moveName?: string;
	canBurnMomentum: boolean;
	burnOutcome?: RollOutcome;
}

export interface ProgressRoll {
	type: 'progress';
	progressScore: number; // floor(ticks / 4), 0–10
	challengeDie1: number;
	challengeDie2: number;
	outcome: RollOutcome;
	isMatch: boolean;
	trackName?: string;
}

export interface OracleRoll {
	type: 'oracle';
	die: number;        // 1–100
	tableName: string;
	result: string;
}

export type DiceRoll = ActionRoll | ProgressRoll | OracleRoll;

// ── Progress Tracks ──
export type TrackType = 'vow' | 'journey' | 'combat' | 'relationship' | 'custom';
export type TrackRank = 'troublesome' | 'dangerous' | 'formidable' | 'extreme' | 'epic';

export const RANK_PROGRESS: Record<TrackRank, number> = {
	troublesome: 12, // 3 boxes (12 ticks)
	dangerous: 8,    // 2 boxes (8 ticks)
	formidable: 4,   // 1 box (4 ticks)
	extreme: 2,      // half box (2 ticks)
	epic: 1          // 1 tick
};

export interface ProgressTrack {
	id: string;
	name: string;
	type: TrackType;
	rank: TrackRank;
	ticks: number;    // 0–40 (10 boxes * 4 ticks)
	completed: boolean;
}

// ── Moves ──
export type MoveCategory = 'adventure' | 'relationship' | 'combat' | 'suffer' | 'quest' | 'fate';

export interface MoveOutcomeText {
	strong_hit: string;
	weak_hit: string;
	miss: string;
}

export interface Move {
	id: string;
	name: string;
	category: MoveCategory;
	text: string;          // Trigger + description
	stats?: Stat[];        // Which stats can be rolled (empty = no roll / progress roll)
	isProgressMove?: boolean;
	outcomes: MoveOutcomeText;
}

// ── Oracles ──
export interface OracleTableRow {
	min: number;
	max: number;
	result: string;
}

export interface OracleTable {
	id: string;
	name: string;
	category: string;
	d: number;           // die size (100, 6, etc.)
	rows: OracleTableRow[];
}

export type OracleYesNoOdds = 'almost_certain' | 'likely' | 'fifty_fifty' | 'unlikely' | 'small_chance';

export const YES_NO_THRESHOLDS: Record<OracleYesNoOdds, number> = {
	almost_certain: 90,
	likely: 75,
	fifty_fifty: 50,
	unlikely: 25,
	small_chance: 10
};

// ── Assets ──
export type AssetCategory = 'companion' | 'path' | 'talent' | 'ritual' | 'combat_talent';

export interface AssetAbility {
	text: string;
	enabled: boolean;
}

export interface AssetDefinition {
	id: string;
	name: string;
	category: AssetCategory;
	description?: string;
	abilities: AssetAbility[];
	track?: { min: number; max: number; label: string };  // e.g. companion health
}

export interface CharacterAsset {
	definitionId: string;
	abilities: boolean[];    // which abilities are enabled
	trackValue?: number;     // current companion health etc.
	customName?: string;     // e.g. companion name
}

// ── Journal ──
export type JournalEntryType = 'narrative' | 'roll' | 'meter_change' | 'track_update' | 'oracle';

export interface JournalEntry {
	id: string;
	timestamp: number;
	session: number;
	type: JournalEntryType;
	text: string;
	data?: Record<string, unknown>;
}

// ── Campaign (top-level save) ──
export interface Campaign {
	id: string;
	name: string;
	character: Character;
	tracks: ProgressTrack[];
	journal: JournalEntry[];
	rollHistory: DiceRoll[];
	session: number;
	createdAt: number;
	updatedAt: number;
}

// ── Momentum Helpers ──
export function maxMomentum(debilities: Debilities): number {
	const count = Object.values(debilities).filter(Boolean).length;
	return Math.max(0, 10 - count);
}

export function momentumReset(debilities: Debilities): number {
	const count = Object.values(debilities).filter(Boolean).length;
	if (count >= 2) return 0;
	if (count === 1) return 1;
	return 2;
}

export function defaultDebilities(): Debilities {
	return {
		wounded: false, shaken: false, unprepared: false, encumbered: false,
		maimed: false, corrupted: false, cursed: false, tormented: false
	};
}

export function defaultStats(): Stats {
	return { edge: 1, heart: 1, iron: 1, shadow: 1, wits: 1 };
}

export function defaultMeters(): ConditionMeters {
	return { health: 5, spirit: 5, supply: 5, momentum: 2 };
}
