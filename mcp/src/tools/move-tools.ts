import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { actionRoll, outcomeLabel } from '../dice.js';
import type { CampaignState } from '../state.js';
import type { Move, Stat } from '../types.js';
import { momentumReset } from '../types.js';

export function registerMoveTools(server: McpServer, state: CampaignState, moves: Move[]) {
	server.tool(
		'lookup_move',
		'Look up a move by ID and return its full text, trigger, stats, and outcome descriptions for strong hit, weak hit, and miss.',
		{
			move_id: z.string().describe('Move ID (e.g. "face-danger", "swear-iron-vow")')
		},
		async ({ move_id }) => {
			const move = moves.find(m => m.id === move_id);
			if (!move) {
				const available = moves.map(m => `${m.id} (${m.name})`).join(', ');
				return { content: [{ type: 'text', text: `Unknown move: "${move_id}". Available: ${available}` }] };
			}

			let text = `## ${move.name}\n`;
			text += `*Category: ${move.category}*\n\n`;
			text += `${move.text}\n\n`;
			if (move.stats && move.stats.length > 0) {
				text += `**Roll:** +${move.stats.join(' or +')}\n\n`;
			}
			if (move.isProgressMove) {
				text += `**Progress Move** — roll challenge dice vs progress score\n\n`;
			}
			text += `**Strong Hit:** ${move.outcomes.strong_hit}\n\n`;
			text += `**Weak Hit:** ${move.outcomes.weak_hit}\n\n`;
			text += `**Miss:** ${move.outcomes.miss}`;

			return { content: [{ type: 'text', text }] };
		}
	);

	server.tool(
		'list_moves',
		'List all available moves, optionally filtered by category (adventure, relationship, combat, suffer, quest, fate, delve).',
		{
			category: z.enum(['adventure', 'relationship', 'combat', 'suffer', 'quest', 'fate', 'delve']).optional()
				.describe('Filter by category')
		},
		async ({ category }) => {
			const filtered = category ? moves.filter(m => m.category === category) : moves;

			let text = `**Moves${category ? ` (${category})` : ''}**\n\n`;
			let currentCat = '';
			for (const m of filtered) {
				if (m.category !== currentCat) {
					currentCat = m.category;
					text += `### ${currentCat.charAt(0).toUpperCase() + currentCat.slice(1)}\n`;
				}
				const rollInfo = m.isProgressMove
					? ' *(progress)*'
					: m.stats && m.stats.length > 0
						? ` (+${m.stats.join('/')})`
						: '';
				text += `- \`${m.id}\` — ${m.name}${rollInfo}\n`;
			}

			return { content: [{ type: 'text', text }] };
		}
	);

	server.tool(
		'make_move',
		'Look up a move, roll the dice, and return the formatted outcome. Automatically logs to the journal. For progress moves, use progress_roll instead.',
		{
			move_id: z.string().describe('Move ID (e.g. "face-danger")'),
			stat: z.enum(['edge', 'heart', 'iron', 'shadow', 'wits']).describe('Stat to roll with'),
			adds: z.number().int().min(-10).max(10).optional().describe('Modifier (default 0)')
		},
		async ({ move_id, stat, adds }) => {
			const move = moves.find(m => m.id === move_id);
			if (!move) {
				return { content: [{ type: 'text', text: `Unknown move: "${move_id}"` }] };
			}
			if (move.isProgressMove) {
				return { content: [{ type: 'text', text: `"${move.name}" is a progress move — use progress_roll instead.` }] };
			}

			const char = state.character;
			const statValue = char.stats[stat as Stat];
			const roll = actionRoll(
				stat as Stat,
				statValue,
				adds ?? 0,
				char.meters.momentum,
				char.debilities
			);
			roll.moveId = move.id;
			roll.moveName = move.name;
			state.addRollToHistory(roll);

			// Get the outcome text
			const outcomeText = move.outcomes[roll.outcome];

			let text = `## ${move.name}\n`;
			text += `*${move.text}*\n\n`;
			text += `**Roll:** +${stat} (${statValue})${adds ? ` + ${adds}` : ''}\n`;
			text += `Action die: ${roll.actionDie} → Score: ${roll.actionScore}\n`;
			text += `Challenge dice: ${roll.challengeDie1} vs ${roll.challengeDie2}\n\n`;
			text += `### ${outcomeLabel(roll.outcome)}${roll.isMatch ? ' *(match!)*' : ''}\n`;
			text += `${outcomeText}\n`;

			if (roll.canBurnMomentum && roll.burnOutcome) {
				text += `\n---\n💫 You can **burn momentum** (${char.meters.momentum}) to upgrade to **${outcomeLabel(roll.burnOutcome)}** (resets to ${momentumReset(char.debilities)}).`;
			}

			// Journal
			state.addJournalEntry('roll',
				`${move.name} (+${stat}): ${outcomeLabel(roll.outcome)}${roll.isMatch ? ' (match!)' : ''} [${roll.actionDie}+${statValue}${adds ? '+' + adds : ''}=${roll.actionScore} vs ${roll.challengeDie1},${roll.challengeDie2}]`,
				{ moveId: move.id, roll }
			);

			return { content: [{ type: 'text', text }] };
		}
	);
}
