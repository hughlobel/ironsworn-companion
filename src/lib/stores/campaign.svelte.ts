import type { Campaign, ProgressTrack, JournalEntry, JournalEntryType, DiceRoll } from '$lib/data/types';
import { characterStore } from './character.svelte';

function createCampaignStore() {
	let tracks = $state<ProgressTrack[]>([]);
	let journal = $state<JournalEntry[]>([]);
	let rollHistory = $state<DiceRoll[]>([]);
	let session = $state(1);
	let campaignId = $state(crypto.randomUUID());
	let campaignName = $state('New Campaign');
	let createdAt = $state(Date.now());

	return {
		get tracks() { return tracks; },
		get journal() { return journal; },
		get rollHistory() { return rollHistory; },
		get session() { return session; },
		get campaignId() { return campaignId; },
		get campaignName() { return campaignName; },

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
				updatedAt: Date.now()
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
		},

		reset() {
			campaignId = crypto.randomUUID();
			campaignName = 'New Campaign';
			tracks = [];
			journal = [];
			rollHistory = [];
			session = 1;
			createdAt = Date.now();
			characterStore.reset();
		}
	};
}

export const campaignStore = createCampaignStore();
