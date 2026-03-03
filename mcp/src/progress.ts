import type { ProgressTrack, TrackRank } from './types.js';
import { RANK_PROGRESS } from './types.js';
import { randomUUID } from 'crypto';

export function markProgress(track: ProgressTrack): ProgressTrack {
	const ticksToAdd = RANK_PROGRESS[track.rank];
	return {
		...track,
		ticks: Math.min(track.ticks + ticksToAdd, 40) // 10 boxes * 4 ticks
	};
}

export function getBoxes(ticks: number): { full: number; partial: number } {
	return {
		full: Math.floor(ticks / 4),
		partial: ticks % 4
	};
}

export function getProgressScore(ticks: number): number {
	return Math.min(Math.floor(ticks / 4), 10);
}

export function createTrack(
	name: string,
	type: ProgressTrack['type'],
	rank: TrackRank
): ProgressTrack {
	return {
		id: randomUUID(),
		name,
		type,
		rank,
		ticks: 0,
		completed: false
	};
}

export function rankLabel(rank: TrackRank): string {
	return rank.charAt(0).toUpperCase() + rank.slice(1);
}

export function rankProgressDescription(rank: TrackRank): string {
	const ticks = RANK_PROGRESS[rank];
	if (ticks >= 4) return `${ticks / 4} boxes`;
	if (ticks === 2) return '2 ticks';
	return '1 tick';
}
