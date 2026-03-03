import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CampaignState } from '../state.js';
import type { NPC, Location, DelveSite, OracleTable, TrackRank, Kin } from '../types.js';
import { createSite, rollDenizen } from '../delve.js';
import { markProgress, getProgressScore } from '../progress.js';
import { rollOracle } from '../oracle.js';
import { randomUUID } from 'crypto';
import { RANK_PROGRESS } from '../types.js';

export function registerWorldTools(server: McpServer, state: CampaignState, oracleTables: OracleTable[]) {
	server.tool(
		'manage_npc',
		'Add, update, remove, or list NPCs in the campaign world.',
		{
			action: z.enum(['add', 'update', 'remove', 'list']).describe('Action to perform'),
			npc_id: z.string().optional().describe('NPC ID (required for update/remove)'),
			name: z.string().optional().describe('NPC name'),
			kin: z.enum(['Ironlander', 'Elf', 'Giant', 'Varou', 'Troll']).optional().describe('NPC kin'),
			role: z.string().optional(),
			descriptor: z.string().optional(),
			goal: z.string().optional(),
			disposition: z.string().optional(),
			is_bonded: z.boolean().optional(),
			notes: z.string().optional(),
			location_id: z.string().optional()
		},
		async ({ action, npc_id, name, kin, role, descriptor, goal, disposition, is_bonded, notes, location_id }) => {
			const npcs = state.data.npcs!;

			if (action === 'list') {
				if (npcs.length === 0) return { content: [{ type: 'text', text: 'No NPCs.' }] };
				let text = '**NPCs**\n';
				for (const n of npcs) {
					text += `- \`${n.id}\` **${n.name}** (${n.kin}) — ${n.role}${n.isBonded ? ' 🤝' : ''}\n`;
				}
				return { content: [{ type: 'text', text }] };
			}

			if (action === 'add') {
				const npc: NPC = {
					id: randomUUID(),
					name: name || 'Unknown',
					kin: (kin as Kin) || 'Ironlander',
					role: role || '',
					descriptor: descriptor || '',
					goal: goal || '',
					disposition: disposition || '',
					isBonded: is_bonded ?? false,
					notes: notes || '',
					locationId: location_id
				};
				state.mutate(c => { c.npcs!.push(npc); });
				state.addJournalEntry('narrative', `Met NPC: ${npc.name} (${npc.kin}, ${npc.role})`);
				return { content: [{ type: 'text', text: `Added NPC: **${npc.name}** (${npc.kin})\nID: \`${npc.id}\`` }] };
			}

			const npc = npcs.find(n => n.id === npc_id);
			if (!npc) return { content: [{ type: 'text', text: `NPC not found: ${npc_id}` }] };

			if (action === 'update') {
				state.mutate(() => {
					if (name !== undefined) npc.name = name;
					if (kin !== undefined) npc.kin = kin as Kin;
					if (role !== undefined) npc.role = role;
					if (descriptor !== undefined) npc.descriptor = descriptor;
					if (goal !== undefined) npc.goal = goal;
					if (disposition !== undefined) npc.disposition = disposition;
					if (is_bonded !== undefined) npc.isBonded = is_bonded;
					if (notes !== undefined) npc.notes = notes;
					if (location_id !== undefined) npc.locationId = location_id;
				});
				return { content: [{ type: 'text', text: `Updated NPC: **${npc.name}**` }] };
			}

			if (action === 'remove') {
				state.mutate(c => { c.npcs = c.npcs!.filter(n => n.id !== npc_id); });
				return { content: [{ type: 'text', text: `Removed NPC: **${npc.name}**` }] };
			}

			return { content: [{ type: 'text', text: 'Invalid action' }] };
		}
	);

	server.tool(
		'manage_location',
		'Add, update, remove, or list locations in the campaign world.',
		{
			action: z.enum(['add', 'update', 'remove', 'list']).describe('Action to perform'),
			location_id: z.string().optional().describe('Location ID (required for update/remove)'),
			name: z.string().optional(),
			region: z.string().optional(),
			type: z.string().optional(),
			descriptor: z.string().optional(),
			trouble: z.string().optional(),
			notes: z.string().optional()
		},
		async ({ action, location_id, name, region, type, descriptor, trouble, notes }) => {
			const locations = state.data.locations!;

			if (action === 'list') {
				if (locations.length === 0) return { content: [{ type: 'text', text: 'No locations.' }] };
				let text = '**Locations**\n';
				for (const l of locations) {
					text += `- \`${l.id}\` **${l.name}** (${l.region}) — ${l.type}\n`;
				}
				return { content: [{ type: 'text', text }] };
			}

			if (action === 'add') {
				const loc: Location = {
					id: randomUUID(),
					name: name || 'Unknown',
					region: region || '',
					type: type || '',
					descriptor: descriptor || '',
					trouble: trouble || '',
					notes: notes || ''
				};
				state.mutate(c => { c.locations!.push(loc); });
				state.addJournalEntry('narrative', `Discovered location: ${loc.name}`);
				return { content: [{ type: 'text', text: `Added location: **${loc.name}**\nID: \`${loc.id}\`` }] };
			}

			const loc = locations.find(l => l.id === location_id);
			if (!loc) return { content: [{ type: 'text', text: `Location not found: ${location_id}` }] };

			if (action === 'update') {
				state.mutate(() => {
					if (name !== undefined) loc.name = name;
					if (region !== undefined) loc.region = region;
					if (type !== undefined) loc.type = type;
					if (descriptor !== undefined) loc.descriptor = descriptor;
					if (trouble !== undefined) loc.trouble = trouble;
					if (notes !== undefined) loc.notes = notes;
				});
				return { content: [{ type: 'text', text: `Updated location: **${loc.name}**` }] };
			}

			if (action === 'remove') {
				state.mutate(c => { c.locations = c.locations!.filter(l => l.id !== location_id); });
				return { content: [{ type: 'text', text: `Removed location: **${loc.name}**` }] };
			}

			return { content: [{ type: 'text', text: 'Invalid action' }] };
		}
	);

	server.tool(
		'manage_site',
		'Add, update, remove, list, or mark progress on delve sites.',
		{
			action: z.enum(['add', 'update', 'remove', 'list', 'mark_progress']).describe('Action to perform'),
			site_id: z.string().optional().describe('Site ID (required for update/remove/mark_progress)'),
			name: z.string().optional(),
			rank: z.enum(['troublesome', 'dangerous', 'formidable', 'extreme', 'epic']).optional(),
			objective: z.string().optional(),
			theme: z.string().optional(),
			domain: z.string().optional(),
			notes: z.string().optional(),
			denizen_index: z.number().int().min(0).max(11).optional().describe('Denizen slot to set'),
			denizen_name: z.string().optional().describe('Name for the denizen slot')
		},
		async ({ action, site_id, name, rank, objective, theme, domain, notes, denizen_index, denizen_name }) => {
			const sites = state.data.sites!;

			if (action === 'list') {
				if (sites.length === 0) return { content: [{ type: 'text', text: 'No delve sites.' }] };
				let text = '**Delve Sites**\n';
				for (const s of sites) {
					const status = s.completed ? '✓' : `${getProgressScore(s.ticks)}/10`;
					text += `- \`${s.id}\` **${s.name}** (${s.theme}/${s.domain}, ${s.rank}) — ${status}\n`;
				}
				return { content: [{ type: 'text', text }] };
			}

			if (action === 'add') {
				if (!name || !rank || !objective || !theme || !domain) {
					return { content: [{ type: 'text', text: 'name, rank, objective, theme, and domain are all required.' }] };
				}
				const site = createSite(name, rank as TrackRank, objective, theme, domain);
				state.mutate(c => { c.sites!.push(site); });
				state.addJournalEntry('narrative', `Discovered site: ${name} (${theme}/${domain})`);
				return { content: [{ type: 'text', text: `Created delve site: **${name}** (${theme}/${domain}, ${rank})\nID: \`${site.id}\`` }] };
			}

			const site = sites.find(s => s.id === site_id);
			if (!site) return { content: [{ type: 'text', text: `Site not found: ${site_id}` }] };

			if (action === 'mark_progress') {
				const ticksToAdd = RANK_PROGRESS[site.rank];
				const oldTicks = site.ticks;
				state.mutate(() => {
					site.ticks = Math.min(site.ticks + ticksToAdd, 40);
				});
				state.addJournalEntry('track_update',
					`Marked progress on "${site.name}": ${getProgressScore(site.ticks)}/10`
				);
				return { content: [{ type: 'text', text: `**${site.name}:** progress ${getProgressScore(oldTicks)} → ${getProgressScore(site.ticks)}/10 (${site.ticks} ticks)` }] };
			}

			if (action === 'update') {
				state.mutate(() => {
					if (name !== undefined) site.name = name;
					if (objective !== undefined) site.objective = objective;
					if (theme !== undefined) site.theme = theme;
					if (domain !== undefined) site.domain = domain;
					if (notes !== undefined) site.notes = notes;
					if (denizen_index !== undefined && denizen_name !== undefined) {
						site.denizens[denizen_index] = denizen_name;
					}
				});
				return { content: [{ type: 'text', text: `Updated site: **${site.name}**` }] };
			}

			if (action === 'remove') {
				state.mutate(c => { c.sites = c.sites!.filter(s => s.id !== site_id); });
				return { content: [{ type: 'text', text: `Removed site: **${site.name}**` }] };
			}

			return { content: [{ type: 'text', text: 'Invalid action' }] };
		}
	);

	server.tool(
		'roll_denizen',
		'Roll on a delve site\'s denizen table using Ironsworn: Delve probability weights.',
		{
			site_id: z.string().describe('Site ID')
		},
		async ({ site_id }) => {
			const site = state.data.sites!.find(s => s.id === site_id);
			if (!site) return { content: [{ type: 'text', text: `Site not found: ${site_id}` }] };

			const result = rollDenizen(site.denizens);
			const label = ['Very Common', 'Common', 'Common', 'Common', 'Uncommon', 'Uncommon', 'Uncommon', 'Uncommon', 'Rare', 'Rare', 'Rare', 'Unforeseen'][result.index];

			let text = `**Denizen Roll** — ${site.name}\n`;
			text += `Slot ${result.index + 1} (${label}): **${result.name}**`;

			return { content: [{ type: 'text', text }] };
		}
	);

	server.tool(
		'generate_npc',
		'Generate a random NPC by rolling on character oracles (name, role, goal, descriptor, disposition). Adds them to the campaign.',
		{
			kin: z.enum(['Ironlander', 'Elf', 'Giant', 'Varou', 'Troll']).optional().describe('NPC kin (default: Ironlander)')
		},
		async ({ kin }) => {
			const npcKin = (kin || 'Ironlander') as Kin;

			// Roll on oracles
			const nameTableId = npcKin === 'Ironlander' ? 'ironlander-name'
				: npcKin === 'Elf' ? 'elf-name'
				: npcKin.toLowerCase() + '-name';

			const nameTable = oracleTables.find(t => t.id === nameTableId);
			const roleTable = oracleTables.find(t => t.id === 'character-role');
			const goalTable = oracleTables.find(t => t.id === 'character-goal');
			const descTable = oracleTables.find(t => t.id === 'character-descriptor');
			const dispTable = oracleTables.find(t => t.id === 'character-disposition');

			const npcName = nameTable ? rollOracle(nameTable).result : 'Unknown';
			const npcRole = roleTable ? rollOracle(roleTable).result : '';
			const npcGoal = goalTable ? rollOracle(goalTable).result : '';
			const npcDesc = descTable ? rollOracle(descTable).result : '';
			const npcDisp = dispTable ? rollOracle(dispTable).result : '';

			const npc: NPC = {
				id: randomUUID(),
				name: npcName,
				kin: npcKin,
				role: npcRole,
				descriptor: npcDesc,
				goal: npcGoal,
				disposition: npcDisp,
				isBonded: false,
				notes: ''
			};

			state.mutate(c => { c.npcs!.push(npc); });
			state.addJournalEntry('narrative',
				`Generated NPC: ${npc.name} — ${npc.descriptor} ${npc.kin}, ${npc.role}. Goal: ${npc.goal}. Disposition: ${npc.disposition}.`
			);

			let text = `## Generated NPC\n`;
			text += `**${npc.name}** — ${npc.kin}\n`;
			text += `**Role:** ${npc.role}\n`;
			text += `**Descriptor:** ${npc.descriptor}\n`;
			text += `**Goal:** ${npc.goal}\n`;
			text += `**Disposition:** ${npc.disposition}\n`;
			text += `ID: \`${npc.id}\``;

			return { content: [{ type: 'text', text }] };
		}
	);
}
