import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CampaignState } from '../state.js';
import type { Stat, DebilityKey, AssetDefinition } from '../types.js';
import { maxMomentum, defaultDebilities, defaultMeters } from '../types.js';

export function registerCharacterTools(server: McpServer, state: CampaignState, assets: AssetDefinition[]) {
	server.tool(
		'get_character',
		'Get the current character sheet: name, stats, meters (health/spirit/supply/momentum), debilities, bonds, assets, and experience.',
		{},
		async () => {
			const c = state.character;
			const debils = Object.entries(c.debilities).filter(([, v]) => v).map(([k]) => k);

			let text = `## ${c.name}\n\n`;
			text += `**Stats:** Edge ${c.stats.edge} | Heart ${c.stats.heart} | Iron ${c.stats.iron} | Shadow ${c.stats.shadow} | Wits ${c.stats.wits}\n\n`;
			text += `**Health:** ${c.meters.health}/5 | **Spirit:** ${c.meters.spirit}/5 | **Supply:** ${c.meters.supply}/5\n`;
			text += `**Momentum:** ${c.meters.momentum} (max ${maxMomentum(c.debilities)})\n\n`;
			text += `**Bonds:** ${Math.floor(c.bonds / 4)}/10 (${c.bonds} ticks)\n`;
			text += `**Experience:** ${c.experience} earned, ${c.experienceSpent} spent (${c.experience - c.experienceSpent} available)\n\n`;

			if (debils.length > 0) {
				text += `**Debilities:** ${debils.join(', ')}\n\n`;
			}

			if (c.assets.length > 0) {
				text += `**Assets:**\n`;
				for (const a of c.assets) {
					const def = assets.find(d => d.id === a.definitionId);
					const name = a.customName || def?.name || a.definitionId;
					const enabledAbilities = a.abilities.map((enabled, i) => enabled ? i + 1 : null).filter(Boolean);
					text += `- ${name} (abilities: ${enabledAbilities.join(', ')})`;
					if (a.trackValue !== undefined && def?.track) {
						text += ` [${def.track.label}: ${a.trackValue}/${def.track.max}]`;
					}
					text += '\n';
				}
				text += '\n';
			}

			if (c.vows.length > 0) {
				text += `**Vows:**\n`;
				for (const v of c.vows) {
					const score = Math.min(Math.floor(v.ticks / 4), 10);
					text += `- ${v.name} (${v.rank}) — ${score}/10${v.completed ? ' ✓' : ''}\n`;
				}
			}

			return { content: [{ type: 'text', text }] };
		}
	);

	server.tool(
		'create_character',
		'Create a new character with the given name and stat values. Stats must total 9 (each 1–3). Resets the character sheet.',
		{
			name: z.string().describe('Character name'),
			edge: z.number().int().min(1).max(3).describe('Edge stat (1-3)'),
			heart: z.number().int().min(1).max(3).describe('Heart stat (1-3)'),
			iron: z.number().int().min(1).max(3).describe('Iron stat (1-3)'),
			shadow: z.number().int().min(1).max(3).describe('Shadow stat (1-3)'),
			wits: z.number().int().min(1).max(3).describe('Wits stat (1-3)')
		},
		async ({ name, edge, heart, iron, shadow, wits }) => {
			const total = edge + heart + iron + shadow + wits;
			if (total !== 9) {
				return { content: [{ type: 'text', text: `Stats must total 9 (got ${total}). Standard array: 3,2,2,1,1` }] };
			}

			state.mutate(c => {
				c.character = {
					name,
					experience: 0,
					experienceSpent: 0,
					stats: { edge, heart, iron, shadow, wits },
					meters: defaultMeters(),
					debilities: defaultDebilities(),
					bonds: 0,
					assets: [],
					vows: []
				};
			});

			state.addJournalEntry('narrative', `Character created: ${name} (Edge ${edge}, Heart ${heart}, Iron ${iron}, Shadow ${shadow}, Wits ${wits})`);

			return { content: [{ type: 'text', text: `Character **${name}** created!\nEdge ${edge} | Heart ${heart} | Iron ${iron} | Shadow ${shadow} | Wits ${wits}` }] };
		}
	);

	server.tool(
		'adjust_meter',
		'Adjust a condition meter (health, spirit, supply, momentum) by a delta. Clamps to valid range.',
		{
			meter: z.enum(['health', 'spirit', 'supply', 'momentum']).describe('Which meter to adjust'),
			delta: z.number().int().describe('Amount to add (negative to subtract)')
		},
		async ({ meter, delta }) => {
			const char = state.character;
			const oldVal = char.meters[meter];
			let newVal: number;

			if (meter === 'momentum') {
				const max = maxMomentum(char.debilities);
				newVal = Math.max(-6, Math.min(max, oldVal + delta));
			} else {
				newVal = Math.max(0, Math.min(5, oldVal + delta));
			}

			state.mutate(c => {
				c.character.meters[meter] = newVal;
			});

			state.addJournalEntry('meter_change',
				`${meter}: ${oldVal} → ${newVal} (${delta >= 0 ? '+' : ''}${delta})`
			);

			return { content: [{ type: 'text', text: `**${meter}:** ${oldVal} → ${newVal}` }] };
		}
	);

	server.tool(
		'set_stat',
		'Set a character stat to a specific value.',
		{
			stat: z.enum(['edge', 'heart', 'iron', 'shadow', 'wits']).describe('Stat to set'),
			value: z.number().int().min(1).max(4).describe('New value')
		},
		async ({ stat, value }) => {
			const oldVal = state.character.stats[stat as Stat];
			state.mutate(c => {
				c.character.stats[stat as Stat] = value;
			});
			return { content: [{ type: 'text', text: `**${stat}:** ${oldVal} → ${value}` }] };
		}
	);

	server.tool(
		'toggle_debility',
		'Toggle a debility on or off.',
		{
			debility: z.enum(['wounded', 'shaken', 'unprepared', 'encumbered', 'maimed', 'corrupted', 'cursed', 'tormented'])
				.describe('Debility to toggle')
		},
		async ({ debility }) => {
			const current = state.character.debilities[debility as DebilityKey];
			state.mutate(c => {
				c.character.debilities[debility as DebilityKey] = !current;
			});

			const newState = !current ? 'marked' : 'cleared';
			state.addJournalEntry('meter_change', `Debility ${debility}: ${newState}`);

			return { content: [{ type: 'text', text: `**${debility}:** ${newState} (max momentum now ${maxMomentum(state.character.debilities)})` }] };
		}
	);

	server.tool(
		'adjust_bonds',
		'Adjust the bond progress track by a number of ticks (usually +1 for forging a bond).',
		{
			delta: z.number().int().describe('Ticks to add (usually 1)')
		},
		async ({ delta }) => {
			const oldVal = state.character.bonds;
			const newVal = Math.max(0, Math.min(40, oldVal + delta));
			state.mutate(c => {
				c.character.bonds = newVal;
			});

			return { content: [{ type: 'text', text: `**Bonds:** ${Math.floor(oldVal / 4)} → ${Math.floor(newVal / 4)} boxes (${newVal} ticks)` }] };
		}
	);

	server.tool(
		'manage_asset',
		'Add, remove, or toggle an ability on a character asset.',
		{
			action: z.enum(['add', 'remove', 'toggle_ability']).describe('Action to perform'),
			asset_id: z.string().describe('Asset definition ID (e.g. "hunter", "hawk")'),
			ability_index: z.number().int().min(0).max(2).optional().describe('Ability index (0-2) for toggle_ability'),
			custom_name: z.string().optional().describe('Custom name (e.g. companion name)')
		},
		async ({ action, asset_id, ability_index, custom_name }) => {
			const def = assets.find(a => a.id === asset_id);
			if (!def) {
				return { content: [{ type: 'text', text: `Unknown asset: "${asset_id}"` }] };
			}

			if (action === 'add') {
				const existing = state.character.assets.find(a => a.definitionId === asset_id);
				if (existing) {
					return { content: [{ type: 'text', text: `Already have asset: ${def.name}` }] };
				}
				state.mutate(c => {
					c.character.assets.push({
						definitionId: asset_id,
						abilities: [true, false, false], // First ability enabled by default
						trackValue: def.track ? def.track.max : undefined,
						customName: custom_name
					});
				});
				state.addJournalEntry('narrative', `Acquired asset: ${def.name}`);
				return { content: [{ type: 'text', text: `Added asset: **${def.name}**` }] };
			}

			if (action === 'remove') {
				state.mutate(c => {
					c.character.assets = c.character.assets.filter(a => a.definitionId !== asset_id);
				});
				return { content: [{ type: 'text', text: `Removed asset: **${def.name}**` }] };
			}

			if (action === 'toggle_ability') {
				if (ability_index === undefined) {
					return { content: [{ type: 'text', text: 'ability_index is required for toggle_ability' }] };
				}
				const asset = state.character.assets.find(a => a.definitionId === asset_id);
				if (!asset) {
					return { content: [{ type: 'text', text: `Character doesn't have asset: ${def.name}` }] };
				}
				state.mutate(() => {
					asset.abilities[ability_index] = !asset.abilities[ability_index];
				});
				const abilityState = asset.abilities[ability_index] ? 'enabled' : 'disabled';
				return { content: [{ type: 'text', text: `${def.name} ability ${ability_index + 1}: ${abilityState}` }] };
			}

			return { content: [{ type: 'text', text: 'Invalid action' }] };
		}
	);

	server.tool(
		'manage_experience',
		'Add or spend experience points.',
		{
			action: z.enum(['add', 'spend']).describe('"add" to earn XP, "spend" to spend it'),
			amount: z.number().int().min(1).describe('Amount of experience')
		},
		async ({ action, amount }) => {
			if (action === 'add') {
				state.mutate(c => {
					c.character.experience += amount;
				});
				state.addJournalEntry('narrative', `Earned ${amount} experience`);
				return { content: [{ type: 'text', text: `Earned **${amount} XP** (total: ${state.character.experience}, available: ${state.character.experience - state.character.experienceSpent})` }] };
			}

			const available = state.character.experience - state.character.experienceSpent;
			if (amount > available) {
				return { content: [{ type: 'text', text: `Not enough XP. Available: ${available}, trying to spend: ${amount}` }] };
			}
			state.mutate(c => {
				c.character.experienceSpent += amount;
			});
			state.addJournalEntry('narrative', `Spent ${amount} experience`);
			return { content: [{ type: 'text', text: `Spent **${amount} XP** (available: ${state.character.experience - state.character.experienceSpent})` }] };
		}
	);
}
