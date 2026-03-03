import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CampaignState } from '../state.js';
import { createTrack, markProgress, getProgressScore, rankLabel } from '../progress.js';
import type { TrackRank, TrackType } from '../types.js';
import { maxMomentum } from '../types.js';

export function registerCampaignTools(server: McpServer, state: CampaignState) {
	server.tool(
		'get_campaign',
		'Get a summary of the current campaign: character overview, active progress tracks, NPC/location/site counts, and current session number.',
		{},
		async () => {
			const c = state.data;
			const char = c.character;
			const activeTracks = c.tracks.filter(t => !t.completed);
			const activeVows = char.vows.filter(v => !v.completed);

			let text = `## Campaign: ${c.name}\n`;
			text += `Session: ${c.session} | Created: ${new Date(c.createdAt).toLocaleDateString()}\n\n`;
			text += `### ${char.name}\n`;
			text += `Health ${char.meters.health}/5 | Spirit ${char.meters.spirit}/5 | Supply ${char.meters.supply}/5 | Momentum ${char.meters.momentum}\n\n`;

			if (activeVows.length > 0) {
				text += `### Active Vows (${activeVows.length})\n`;
				for (const v of activeVows) {
					text += `- ${v.name} (${v.rank}) — ${getProgressScore(v.ticks)}/10\n`;
				}
				text += '\n';
			}

			if (activeTracks.length > 0) {
				text += `### Progress Tracks (${activeTracks.length})\n`;
				for (const t of activeTracks) {
					text += `- ${t.name} [${t.type}] (${t.rank}) — ${getProgressScore(t.ticks)}/10\n`;
				}
				text += '\n';
			}

			text += `### World\n`;
			text += `NPCs: ${(c.npcs ?? []).length} | Locations: ${(c.locations ?? []).length} | Delve Sites: ${(c.sites ?? []).length}\n`;
			text += `Journal entries: ${c.journal.length} | Roll history: ${c.rollHistory.length}`;

			return { content: [{ type: 'text', text }] };
		}
	);

	server.tool(
		'add_journal_entry',
		'Add a narrative journal entry to the campaign log.',
		{
			text: z.string().describe('Journal entry text')
		},
		async ({ text }) => {
			const entry = state.addJournalEntry('narrative', text);
			return { content: [{ type: 'text', text: `Journal entry added (session ${entry.session}).` }] };
		}
	);

	server.tool(
		'get_journal',
		'Get recent journal entries, optionally filtered by session number.',
		{
			limit: z.number().int().min(1).max(100).optional().describe('Max entries to return (default 20)'),
			session: z.number().int().optional().describe('Filter by session number')
		},
		async ({ limit, session }) => {
			let entries = state.data.journal;
			if (session !== undefined) {
				entries = entries.filter(e => e.session === session);
			}
			entries = entries.slice(-(limit ?? 20));

			if (entries.length === 0) {
				return { content: [{ type: 'text', text: 'No journal entries found.' }] };
			}

			let text = `**Journal** (${entries.length} entries)\n\n`;
			for (const e of entries) {
				const time = new Date(e.timestamp).toLocaleTimeString();
				text += `[S${e.session} ${time}] *${e.type}* — ${e.text}\n`;
			}

			return { content: [{ type: 'text', text }] };
		}
	);

	server.tool(
		'new_session',
		'Start a new session. Increments the session counter for journal entries.',
		{},
		async () => {
			state.mutate(c => {
				c.session += 1;
			});
			state.addJournalEntry('narrative', `Session ${state.data.session} started.`);
			return { content: [{ type: 'text', text: `**Session ${state.data.session}** started.` }] };
		}
	);

	server.tool(
		'manage_track',
		'Create, mark progress on, complete, or remove a progress track (journeys, combat, relationships, etc.).',
		{
			action: z.enum(['add', 'mark', 'complete', 'remove']).describe('Action to perform'),
			name: z.string().optional().describe('Track name (required for "add")'),
			type: z.enum(['vow', 'journey', 'combat', 'relationship', 'custom']).optional()
				.describe('Track type (required for "add")'),
			rank: z.enum(['troublesome', 'dangerous', 'formidable', 'extreme', 'epic']).optional()
				.describe('Rank (required for "add")'),
			track_id: z.string().optional().describe('Track ID (required for mark/complete/remove)')
		},
		async ({ action, name, type, rank, track_id }) => {
			if (action === 'add') {
				if (!name || !type || !rank) {
					return { content: [{ type: 'text', text: 'name, type, and rank are required to add a track.' }] };
				}
				const track = createTrack(name, type as TrackType, rank as TrackRank);

				// All tracks (including vows) go into campaign.tracks to match the web app's data model
				state.mutate(c => { c.tracks.push(track); });

				state.addJournalEntry('track_update', `New ${type}: "${name}" (${rankLabel(rank as TrackRank)})`);
				return { content: [{ type: 'text', text: `Created ${type} **"${name}"** (${rank})\nID: \`${track.id}\`` }] };
			}

			// Find the track
			const allTracks = [...state.data.tracks, ...state.character.vows];
			const track = allTracks.find(t => t.id === track_id);
			if (!track) {
				return { content: [{ type: 'text', text: `Track not found: ${track_id}` }] };
			}

			if (action === 'mark') {
				const updated = markProgress(track);
				state.mutate(c => {
					const inTracks = c.tracks.find(t => t.id === track_id);
					const inVows = c.character.vows.find(t => t.id === track_id);
					const target = inTracks || inVows;
					if (target) target.ticks = updated.ticks;
				});
				state.addJournalEntry('track_update',
					`Marked progress on "${track.name}": ${getProgressScore(updated.ticks)}/10 (${updated.ticks} ticks)`
				);
				return { content: [{ type: 'text', text: `**${track.name}:** marked progress → ${getProgressScore(updated.ticks)}/10 (${updated.ticks} ticks)` }] };
			}

			if (action === 'complete') {
				state.mutate(c => {
					const inTracks = c.tracks.find(t => t.id === track_id);
					const inVows = c.character.vows.find(t => t.id === track_id);
					const target = inTracks || inVows;
					if (target) target.completed = true;
				});
				state.addJournalEntry('track_update', `Completed: "${track.name}"`);
				return { content: [{ type: 'text', text: `**${track.name}:** completed!` }] };
			}

			if (action === 'remove') {
				state.mutate(c => {
					c.tracks = c.tracks.filter(t => t.id !== track_id);
					c.character.vows = c.character.vows.filter(t => t.id !== track_id);
				});
				return { content: [{ type: 'text', text: `Removed track: "${track.name}"` }] };
			}

			return { content: [{ type: 'text', text: 'Invalid action' }] };
		}
	);

	server.tool(
		'get_tracks',
		'List all progress tracks (active and completed), including vows.',
		{},
		async () => {
			const tracks = state.data.tracks;
			const vows = state.character.vows;

			if (tracks.length === 0 && vows.length === 0) {
				return { content: [{ type: 'text', text: 'No progress tracks.' }] };
			}

			let text = '';
			if (vows.length > 0) {
				text += `### Vows\n`;
				for (const v of vows) {
					const status = v.completed ? '✓' : `${getProgressScore(v.ticks)}/10`;
					text += `- \`${v.id}\` **${v.name}** (${v.rank}) — ${status}\n`;
				}
				text += '\n';
			}

			if (tracks.length > 0) {
				text += `### Tracks\n`;
				for (const t of tracks) {
					const status = t.completed ? '✓' : `${getProgressScore(t.ticks)}/10`;
					text += `- \`${t.id}\` **${t.name}** [${t.type}] (${t.rank}) — ${status}\n`;
				}
			}

			return { content: [{ type: 'text', text }] };
		}
	);

	server.tool(
		'sync_campaign',
		'Import or export the full campaign as JSON. Use to sync with the Ironsworn web companion app.',
		{
			action: z.enum(['import', 'export']).describe('"import" to load, "export" to dump'),
			json: z.string().optional().describe('Campaign JSON string (required for import)')
		},
		async ({ action, json }) => {
			if (action === 'export') {
				const exported = state.exportCampaign();
				return { content: [{ type: 'text', text: exported }] };
			}

			if (!json) {
				return { content: [{ type: 'text', text: 'json parameter required for import.' }] };
			}

			try {
				state.importCampaign(json);
				return { content: [{ type: 'text', text: `Campaign imported: **${state.data.name}** (${state.data.journal.length} journal entries)` }] };
			} catch (err) {
				return { content: [{ type: 'text', text: `Import failed: ${err}` }] };
			}
		}
	);
}
