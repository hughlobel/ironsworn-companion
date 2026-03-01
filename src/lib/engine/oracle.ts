import type { OracleTable, OracleTableRow, OracleRoll, OracleYesNoOdds } from '$lib/data/types';
import { YES_NO_THRESHOLDS } from '$lib/data/types';
import { rollD100 } from './dice';

export function rollOracle(table: OracleTable): OracleRoll {
	const die = table.d === 100 ? rollD100() : Math.floor(Math.random() * table.d) + 1;
	const row = lookupRow(table.rows, die);
	return {
		type: 'oracle',
		die,
		tableName: table.name,
		result: row?.result ?? 'No result'
	};
}

export function lookupRow(rows: OracleTableRow[], value: number): OracleTableRow | undefined {
	return rows.find(r => value >= r.min && value <= r.max);
}

export function rollYesNo(odds: OracleYesNoOdds): { die: number; result: boolean; answer: string } {
	const die = rollD100();
	const threshold = YES_NO_THRESHOLDS[odds];
	const result = die <= threshold;
	return { die, result, answer: result ? 'Yes' : 'No' };
}

export function oddsLabel(odds: OracleYesNoOdds): string {
	switch (odds) {
		case 'almost_certain': return 'Almost Certain';
		case 'likely': return 'Likely';
		case 'fifty_fifty': return '50/50';
		case 'unlikely': return 'Unlikely';
		case 'small_chance': return 'Small Chance';
	}
}
