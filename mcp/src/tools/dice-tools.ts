import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { actionRoll, burnMomentum, outcomeLabel, progressRoll } from '../dice.js';
import { getProgressScore } from '../progress.js';
import type { CampaignState } from '../state.js';
import type { Stat } from '../types.js';
import { maxMomentum, momentumReset } from '../types.js';

export function registerDiceTools(server: McpServer, state: CampaignState) {
	server.tool(
		'action_roll',
		'Roll an action die + stat vs two challenge dice. Returns the outcome (strong hit / weak hit / miss) and whether burning momentum could improve the result.',
		{
			stat: z.enum(['edge', 'heart', 'iron', 'shadow', 'wits']).describe('The stat to roll with'),
			adds: z.number().int().min(-10).max(10).optional().describe('Modifier to add to the roll (default 0)')
		},
		async ({ stat, adds }) => {
			const char = state.character;
			const statValue = char.stats[stat as Stat];
			const roll = actionRoll(
				stat as Stat,
				statValue,
				adds ?? 0,
				char.meters.momentum,
				char.debilities
			);
			state.addRollToHistory(roll);

			let text = `**Action Roll** (+${stat} = ${statValue}${adds ? `, adds ${adds}` : ''})\n`;
			text += `Action die: ${roll.actionDie} → Score: ${roll.actionScore}\n`;
			text += `Challenge dice: ${roll.challengeDie1} vs ${roll.challengeDie2}\n`;
			text += `**${outcomeLabel(roll.outcome)}**${roll.isMatch ? ' *(match!)*' : ''}\n`;

			if (roll.canBurnMomentum && roll.burnOutcome) {
				text += `\n💫 You can **burn momentum** (${char.meters.momentum}) to upgrade to **${outcomeLabel(roll.burnOutcome)}** (momentum resets to ${momentumReset(char.debilities)}).`;
			}

			return { content: [{ type: 'text', text }] };
		}
	);

	server.tool(
		'progress_roll',
		'Roll challenge dice against a progress track score. Used for vows, journeys, combat, and other progress moves.',
		{
			track_id: z.string().describe('The ID of the progress track to roll against')
		},
		async ({ track_id }) => {
			const allTracks = [...state.data.tracks, ...state.character.vows];
			const track = allTracks.find(t => t.id === track_id);
			if (!track) {
				return { content: [{ type: 'text', text: `Track not found: ${track_id}` }] };
			}

			const roll = progressRoll(track.ticks);
			roll.trackName = track.name;
			state.addRollToHistory(roll);

			const score = getProgressScore(track.ticks);
			let text = `**Progress Roll** — ${track.name} (${track.rank})\n`;
			text += `Progress: ${score}/10 (${track.ticks} ticks)\n`;
			text += `Challenge dice: ${roll.challengeDie1} vs ${roll.challengeDie2}\n`;
			text += `**${outcomeLabel(roll.outcome)}**${roll.isMatch ? ' *(match!)*' : ''}`;

			return { content: [{ type: 'text', text }] };
		}
	);

	server.tool(
		'burn_momentum',
		'Burn momentum on the most recent action roll to improve its outcome. Resets momentum to the reset value (based on debilities).',
		{},
		async () => {
			const lastRoll = state.getLastActionRoll();
			if (!lastRoll) {
				return { content: [{ type: 'text', text: 'No recent action roll to burn momentum on.' }] };
			}
			if (!lastRoll.canBurnMomentum) {
				return { content: [{ type: 'text', text: 'Burning momentum would not improve the last roll.' }] };
			}

			const char = state.character;
			const { newOutcome, resetValue } = burnMomentum(lastRoll, char.meters.momentum, char.debilities);
			const oldMomentum = char.meters.momentum;

			state.mutate(c => {
				c.character.meters.momentum = resetValue;
			});

			state.addJournalEntry('meter_change',
				`Burned momentum (${oldMomentum} → ${resetValue}) to upgrade ${outcomeLabel(lastRoll.outcome)} to ${outcomeLabel(newOutcome)}.`
			);

			let text = `**Momentum Burned!**\n`;
			text += `${outcomeLabel(lastRoll.outcome)} → **${outcomeLabel(newOutcome)}**\n`;
			text += `Momentum: ${oldMomentum} → ${resetValue}`;

			return { content: [{ type: 'text', text }] };
		}
	);
}
