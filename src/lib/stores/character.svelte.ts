import type { Character, Stat, DebilityKey, CharacterAsset, ConditionMeters, Stats, Debilities } from '$lib/data/types';
import { defaultStats, defaultMeters, defaultDebilities, maxMomentum, momentumReset } from '$lib/data/types';

function createCharacterStore() {
	let character = $state<Character>({
		name: '',
		experience: 0,
		experienceSpent: 0,
		stats: defaultStats(),
		meters: defaultMeters(),
		debilities: defaultDebilities(),
		bonds: 0,
		assets: [],
		vows: []
	});

	let initialized = $state(false);

	return {
		get character() { return character; },
		get initialized() { return initialized; },
		get name() { return character.name; },
		get stats() { return character.stats; },
		get meters() { return character.meters; },
		get debilities() { return character.debilities; },
		get bonds() { return character.bonds; },
		get assets() { return character.assets; },
		get experience() { return character.experience; },
		get experienceSpent() { return character.experienceSpent; },
		get availableExperience() { return character.experience - character.experienceSpent; },
		get maxMomentum() { return maxMomentum(character.debilities); },
		get momentumReset() { return momentumReset(character.debilities); },

		init(char: Character) {
			character = char;
			initialized = true;
		},

		create(name: string, stats: Stats, startingAssets: CharacterAsset[] = []) {
			character = {
				name,
				experience: 0,
				experienceSpent: 0,
				stats,
				meters: defaultMeters(),
				debilities: defaultDebilities(),
				bonds: 0,
				assets: startingAssets,
				vows: []
			};
			initialized = true;
		},

		setStat(stat: Stat, value: number) {
			character.stats[stat] = Math.max(1, Math.min(4, value));
		},

		// Meters
		setHealth(v: number) { character.meters.health = Math.max(0, Math.min(5, v)); },
		setSpirit(v: number) { character.meters.spirit = Math.max(0, Math.min(5, v)); },
		setSupply(v: number) { character.meters.supply = Math.max(0, Math.min(5, v)); },
		setMomentum(v: number) {
			const max = maxMomentum(character.debilities);
			character.meters.momentum = Math.max(-6, Math.min(max, v));
		},

		adjustHealth(delta: number) { this.setHealth(character.meters.health + delta); },
		adjustSpirit(delta: number) { this.setSpirit(character.meters.spirit + delta); },
		adjustSupply(delta: number) { this.setSupply(character.meters.supply + delta); },
		adjustMomentum(delta: number) { this.setMomentum(character.meters.momentum + delta); },

		resetMomentum() {
			character.meters.momentum = momentumReset(character.debilities);
		},

		burnMomentum() {
			const reset = momentumReset(character.debilities);
			const burned = character.meters.momentum;
			character.meters.momentum = reset;
			return burned;
		},

		// Debilities
		toggleDebility(key: DebilityKey) {
			character.debilities[key] = !character.debilities[key];
			// Clamp momentum if max decreased
			const max = maxMomentum(character.debilities);
			if (character.meters.momentum > max) {
				character.meters.momentum = max;
			}
		},

		// Bonds
		adjustBonds(delta: number) {
			character.bonds = Math.max(0, Math.min(40, character.bonds + delta));
		},

		// Experience
		addExperience(amount: number) {
			character.experience += amount;
		},
		spendExperience(amount: number) {
			if (amount <= this.availableExperience) {
				character.experienceSpent += amount;
				return true;
			}
			return false;
		},

		// Assets
		addAsset(asset: CharacterAsset) {
			character.assets = [...character.assets, asset];
		},
		removeAsset(index: number) {
			character.assets = character.assets.filter((_, i) => i !== index);
		},
		toggleAssetAbility(assetIndex: number, abilityIndex: number) {
			const a = character.assets[assetIndex];
			if (a) {
				a.abilities[abilityIndex] = !a.abilities[abilityIndex];
				character.assets = [...character.assets]; // trigger reactivity
			}
		},
		setAssetTrack(assetIndex: number, value: number) {
			const a = character.assets[assetIndex];
			if (a) {
				a.trackValue = value;
				character.assets = [...character.assets];
			}
		},

		// Serialization
		toJSON(): Character {
			return JSON.parse(JSON.stringify(character));
		},

		loadFromJSON(data: Character) {
			character = data;
			initialized = true;
		},

		reset() {
			character = {
				name: '',
				experience: 0,
				experienceSpent: 0,
				stats: defaultStats(),
				meters: defaultMeters(),
				debilities: defaultDebilities(),
				bonds: 0,
				assets: [],
				vows: []
			};
			initialized = false;
		}
	};
}

export const characterStore = createCharacterStore();
