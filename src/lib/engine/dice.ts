import type { ActionRoll, ProgressRoll, RollOutcome, Stat, Debilities } from '$lib/data/types';
import { maxMomentum, momentumReset } from '$lib/data/types';

function rollD(sides: number): number {
	return Math.floor(Math.random() * sides) + 1;
}

export function rollD6(): number { return rollD(6); }
export function rollD10(): number { return rollD(10); }
export function rollD100(): number { return rollD(100); }

function resolveOutcome(actionScore: number, c1: number, c2: number): RollOutcome {
	const beatsC1 = actionScore > c1;
	const beatsC2 = actionScore > c2;
	if (beatsC1 && beatsC2) return 'strong_hit';
	if (beatsC1 || beatsC2) return 'weak_hit';
	return 'miss';
}

export function actionRoll(
	stat: Stat,
	statValue: number,
	adds: number = 0,
	momentum: number = 0,
	debilities: Debilities = {} as Debilities
): ActionRoll {
	const actionDie = rollD6();
	const challengeDie1 = rollD10();
	const challengeDie2 = rollD10();
	const actionScore = Math.min(actionDie + statValue + adds, 10);
	const outcome = resolveOutcome(actionScore, challengeDie1, challengeDie2);
	const isMatch = challengeDie1 === challengeDie2;

	// Check if burning momentum would improve the outcome
	const maxMom = maxMomentum(debilities);
	const effectiveMomentum = Math.min(momentum, maxMom);
	let canBurnMomentum = false;
	let burnOutcome: RollOutcome | undefined;

	if (effectiveMomentum > 0) {
		const burnResult = resolveOutcome(effectiveMomentum, challengeDie1, challengeDie2);
		if (outcomeRank(burnResult) > outcomeRank(outcome)) {
			canBurnMomentum = true;
			burnOutcome = burnResult;
		}
	}

	return {
		type: 'action',
		actionDie,
		challengeDie1,
		challengeDie2,
		stat,
		statValue,
		adds,
		actionScore,
		outcome,
		isMatch,
		canBurnMomentum,
		burnOutcome
	};
}

export function progressRoll(progressTicks: number): ProgressRoll {
	const progressScore = Math.min(Math.floor(progressTicks / 4), 10);
	const challengeDie1 = rollD10();
	const challengeDie2 = rollD10();
	const outcome = resolveOutcome(progressScore, challengeDie1, challengeDie2);
	const isMatch = challengeDie1 === challengeDie2;

	return {
		type: 'progress',
		progressScore,
		challengeDie1,
		challengeDie2,
		outcome,
		isMatch
	};
}

function outcomeRank(outcome: RollOutcome): number {
	switch (outcome) {
		case 'miss': return 0;
		case 'weak_hit': return 1;
		case 'strong_hit': return 2;
	}
}

export function burnMomentum(
	roll: ActionRoll,
	momentum: number,
	debilities: Debilities
): { newOutcome: RollOutcome; resetValue: number } {
	const effectiveMomentum = Math.min(momentum, maxMomentum(debilities));
	const newOutcome = resolveOutcome(effectiveMomentum, roll.challengeDie1, roll.challengeDie2);
	const resetValue = momentumReset(debilities);
	return { newOutcome, resetValue };
}

export function outcomeLabel(outcome: RollOutcome): string {
	switch (outcome) {
		case 'strong_hit': return 'Strong Hit';
		case 'weak_hit': return 'Weak Hit';
		case 'miss': return 'Miss';
	}
}
