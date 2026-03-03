import type { Campaign, ProgressTrack, JournalEntry, JournalEntryType, DiceRoll, NPC, Location, DelveSite } from '$lib/data/types';
import { characterStore } from './character.svelte';

function createCampaignStore() {
	let tracks = $state<ProgressTrack[]>([]);
	let journal = $state<JournalEntry[]>([]);
	let rollHistory = $state<DiceRoll[]>([]);
	let session = $state(1);
	let campaignId = $state(crypto.randomUUID());
	let campaignName = $state('New Campaign');
	let createdAt = $state(Date.now());
	let updatedAt = $state(0);
	let npcs = $state<NPC[]>([]);
	let locations = $state<Location[]>([]);
	let sites = $state<DelveSite[]>([]);

	return {
		get tracks() { return tracks; },
		get journal() { return journal; },
		get rollHistory() { return rollHistory; },
		get session() { return session; },
		get campaignId() { return campaignId; },
		get campaignName() { return campaignName; },
		get npcs() { return npcs; },
		get locations() { return locations; },
		get sites() { return sites; },
		get activeSites() { return sites.filter(s => !s.completed); },
		get completedSites() { return sites.filter(s => s.completed); },
		get updatedAt() { return updatedAt; },
		stampUpdatedAt() { updatedAt = Date.now(); },

		setCampaignName(name: string) { campaignName = name; },
		newSession() { session++; },

		// ── Tracks ──
		addTrack(track: ProgressTrack) {
			tracks = [...tracks, track];
		},
		updateTrack(id: string, updater: (t: ProgressTrack) => ProgressTrack) {
			tracks = tracks.map(t => t.id === id ? updater(t) : t);
		},
		removeTrack(id: string) {
			tracks = tracks.filter(t => t.id !== id);
		},
		getTrack(id: string) {
			return tracks.find(t => t.id === id);
		},
		get activeTracks() {
			return tracks.filter(t => !t.completed);
		},
		get completedTracks() {
			return tracks.filter(t => t.completed);
		},

		// ── NPCs ──
		addNpc(npc: NPC) { npcs = [...npcs, npc]; },
		updateNpc(id: string, updater: (n: NPC) => NPC) {
			npcs = npcs.map(n => n.id === id ? updater(n) : n);
		},
		removeNpc(id: string) { npcs = npcs.filter(n => n.id !== id); },

		// ── Locations ──
		addLocation(loc: Location) { locations = [...locations, loc]; },
		updateLocation(id: string, updater: (l: Location) => Location) {
			locations = locations.map(l => l.id === id ? updater(l) : l);
		},
		removeLocation(id: string) { locations = locations.filter(l => l.id !== id); },

		// ── Delve Sites ──
		addSite(site: DelveSite) { sites = [...sites, site]; },
		updateSite(id: string, updater: (s: DelveSite) => DelveSite) {
			sites = sites.map(s => s.id === id ? updater(s) : s);
		},
		removeSite(id: string) { sites = sites.filter(s => s.id !== id); },

		// ── Journal ──
		addJournalEntry(type: JournalEntryType, text: string, data?: Record<string, unknown>) {
			const entry: JournalEntry = {
				id: crypto.randomUUID(),
				timestamp: Date.now(),
				session,
				type,
				text,
				data
			};
			journal = [entry, ...journal];
			return entry;
		},

		addNarrative(text: string) {
			return this.addJournalEntry('narrative', text);
		},

		logRoll(text: string, roll: DiceRoll) {
			this.addRoll(roll);
			return this.addJournalEntry('roll', text, { roll });
		},

		logMeterChange(text: string, meter: string, oldVal: number, newVal: number) {
			return this.addJournalEntry('meter_change', text, { meter, oldVal, newVal });
		},

		logTrackUpdate(text: string, trackId: string) {
			return this.addJournalEntry('track_update', text, { trackId });
		},

		// ── Roll History ──
		addRoll(roll: DiceRoll) {
			rollHistory = [roll, ...rollHistory].slice(0, 100); // keep last 100
		},

		// ── Persistence ──
		toCampaign(): Campaign {
			return {
				id: campaignId,
				name: campaignName,
				character: characterStore.toJSON(),
				tracks: JSON.parse(JSON.stringify(tracks)),
				journal: JSON.parse(JSON.stringify(journal)),
				rollHistory: JSON.parse(JSON.stringify(rollHistory)),
				session,
				createdAt,
				updatedAt: Date.now(),
				npcs: JSON.parse(JSON.stringify(npcs)),
				locations: JSON.parse(JSON.stringify(locations)),
				sites: JSON.parse(JSON.stringify(sites))
			};
		},

		loadCampaign(data: Campaign) {
			campaignId = data.id;
			campaignName = data.name;
			characterStore.loadFromJSON(data.character);
			tracks = data.tracks;
			journal = data.journal;
			rollHistory = data.rollHistory || [];
			session = data.session;
			createdAt = data.createdAt;
			updatedAt = data.updatedAt ?? 0;
			npcs = data.npcs ?? [];
			locations = data.locations ?? [];
			sites = data.sites ?? [];
		},

		reset() {
			campaignId = crypto.randomUUID();
			campaignName = 'New Campaign';
			tracks = [];
			journal = [];
			rollHistory = [];
			npcs = [];
			locations = [];
			sites = [];
			session = 1;
			createdAt = Date.now();
			characterStore.reset();
		}
	};
}

export const campaignStore = createCampaignStore();
