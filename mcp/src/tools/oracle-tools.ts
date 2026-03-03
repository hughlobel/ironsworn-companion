import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { rollOracle, rollYesNo, oddsLabel } from '../oracle.js';
import type { CampaignState } from '../state.js';
import type { OracleTable, OracleYesNoOdds } from '../types.js';

export function registerOracleTools(server: McpServer, state: CampaignState, oracleTables: OracleTable[]) {
	server.tool(
		'roll_oracle',
		'Roll on a named oracle table (e.g. "action", "theme", "region", "character-role"). Returns the die result and the matching table entry.',
		{
			table_id: z.string().describe('Oracle table ID (e.g. "action", "theme", "ironlander-name")')
		},
		async ({ table_id }) => {
			const table = oracleTables.find(t => t.id === table_id);
			if (!table) {
				const available = oracleTables.map(t => t.id).join(', ');
				return { content: [{ type: 'text', text: `Unknown oracle table: "${table_id}". Available: ${available}` }] };
			}

			const roll = rollOracle(table);
			state.addRollToHistory(roll);
			state.addJournalEntry('oracle', `Oracle (${table.name}): rolled ${roll.die} → ${roll.result}`);

			let text = `**Oracle: ${table.name}**\n`;
			text += `Roll: ${roll.die} → **${roll.result}**`;

			return { content: [{ type: 'text', text }] };
		}
	);

	server.tool(
		'roll_yes_no',
		'Ask the oracle a yes/no question with specified odds. Rolls d100 against a threshold.',
		{
			odds: z.enum(['almost_certain', 'likely', 'fifty_fifty', 'unlikely', 'small_chance'])
				.describe('The likelihood: almost_certain (90%), likely (75%), fifty_fifty (50%), unlikely (25%), small_chance (10%)')
		},
		async ({ odds }) => {
			const result = rollYesNo(odds as OracleYesNoOdds);

			state.addJournalEntry('oracle',
				`Ask the Oracle (${oddsLabel(odds as OracleYesNoOdds)}): rolled ${result.die} → ${result.answer}`
			);

			let text = `**Ask the Oracle** (${oddsLabel(odds as OracleYesNoOdds)})\n`;
			text += `Roll: ${result.die} → **${result.answer}**`;

			return { content: [{ type: 'text', text }] };
		}
	);

	server.tool(
		'list_oracle_tables',
		'List all available oracle tables with their IDs, names, and categories.',
		{},
		async () => {
			const byCategory = new Map<string, { id: string; name: string }[]>();
			for (const t of oracleTables) {
				if (!byCategory.has(t.category)) byCategory.set(t.category, []);
				byCategory.get(t.category)!.push({ id: t.id, name: t.name });
			}

			let text = '**Oracle Tables**\n\n';
			for (const [cat, tables] of byCategory) {
				text += `### ${cat}\n`;
				for (const t of tables) {
					text += `- \`${t.id}\` — ${t.name}\n`;
				}
				text += '\n';
			}

			return { content: [{ type: 'text', text }] };
		}
	);
}
