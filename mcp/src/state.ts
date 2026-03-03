import { readFileSync, writeFileSync, mkdirSync, renameSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { homedir } from 'os';
import { randomUUID } from 'crypto';
import type { Campaign, Character, JournalEntry, JournalEntryType, DiceRoll } from './types.js';
import { defaultDebilities, defaultStats, defaultMeters } from './types.js';

const STATE_DIR = join(homedir(), '.ironsworn-mcp');
const STATE_FILE = join(STATE_DIR, 'campaign.json');

function createDefaultCharacter(): Character {
	return {
		name: 'Unnamed',
		experience: 0,
		experienceSpent: 0,
		stats: defaultStats(),
		meters: defaultMeters(),
		debilities: defaultDebilities(),
		bonds: 0,
		assets: [],
		vows: []
	};
}

function createDefaultCampaign(): Campaign {
	return {
		id: randomUUID(),
		name: 'New Campaign',
		character: createDefaultCharacter(),
		tracks: [],
		journal: [],
		rollHistory: [],
		session: 1,
		createdAt: Date.now(),
		updatedAt: Date.now(),
		npcs: [],
		locations: [],
		sites: []
	};
}

export class CampaignState {
	private campaign: Campaign;
	private saveCallbacks: Array<() => void> = [];

	constructor() {
		this.campaign = this.load();
	}

	onSave(cb: () => void): void {
		this.saveCallbacks.push(cb);
	}

	private load(): Campaign {
		try {
			if (existsSync(STATE_FILE)) {
				const raw = readFileSync(STATE_FILE, 'utf-8');
				const data = JSON.parse(raw) as Campaign;
				// Ensure arrays exist (backwards compat)
				data.tracks = data.tracks ?? [];
				data.journal = data.journal ?? [];
				data.npcs = data.npcs ?? [];
				data.locations = data.locations ?? [];
				data.sites = data.sites ?? [];
				data.rollHistory = data.rollHistory ?? [];
				data.session = data.session ?? 1;
				data.createdAt = data.createdAt ?? Date.now();
				return data;
			}
		} catch {
			// Corrupted file — start fresh
		}
		return createDefaultCampaign();
	}

	save(): void {
		mkdirSync(STATE_DIR, { recursive: true });
		this.campaign.updatedAt = Date.now();
		const tmp = STATE_FILE + '.tmp';
		writeFileSync(tmp, JSON.stringify(this.campaign, null, '\t'), 'utf-8');
		renameSync(tmp, STATE_FILE);
		this.saveCallbacks.forEach(cb => cb());
	}

	get data(): Campaign {
		return this.campaign;
	}

	get character(): Character {
		return this.campaign.character;
	}

	addJournalEntry(type: JournalEntryType, text: string, data?: Record<string, unknown>): JournalEntry {
		const entry: JournalEntry = {
			id: randomUUID(),
			timestamp: Date.now(),
			session: this.campaign.session,
			type,
			text,
			data
		};
		this.campaign.journal.push(entry);
		this.save();
		return entry;
	}

	addRollToHistory(roll: DiceRoll): void {
		this.campaign.rollHistory.push(roll);
		// Keep last 100 rolls
		if (this.campaign.rollHistory.length > 100) {
			this.campaign.rollHistory = this.campaign.rollHistory.slice(-100);
		}
		this.save();
	}

	getLastActionRoll() {
		for (let i = this.campaign.rollHistory.length - 1; i >= 0; i--) {
			if (this.campaign.rollHistory[i].type === 'action') {
				return this.campaign.rollHistory[i] as import('./types.js').ActionRoll;
			}
		}
		return null;
	}

	mutate(fn: (c: Campaign) => void): void {
		fn(this.campaign);
		this.save();
	}

	importCampaign(json: string): void {
		const data = JSON.parse(json) as Campaign;
		if (!data.id || !data.character || !data.name) {
			throw new Error('Invalid campaign data');
		}
		data.npcs = data.npcs ?? [];
		data.locations = data.locations ?? [];
		data.sites = data.sites ?? [];
		data.rollHistory = data.rollHistory ?? [];
		this.campaign = data;
		this.save();
	}

	exportCampaign(): string {
		return JSON.stringify(this.campaign, null, '\t');
	}

	reset(): void {
		this.campaign = createDefaultCampaign();
		this.save();
	}
}
