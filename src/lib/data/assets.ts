import type { AssetDefinition } from './types';

export const ASSETS: AssetDefinition[] = [
	// ══════════════════════════════════
	// COMPANIONS
	// ══════════════════════════════════
	{
		id: 'cave-lion', name: 'Cave Lion', category: 'companion',
		description: 'Your companion is a fearsome cave lion.',
		abilities: [
			{ text: 'When you Endure Harm, you may roll +heart (instead of +health or +iron). If you do, take +1 momentum on a hit.', enabled: true },
			{ text: 'When you Strike or Clash alongside your cave lion and score a hit, inflict +1 harm.', enabled: false },
			{ text: 'When you Face Danger +heart by sending your cave lion to perform a task suited to its nature, add +1 and take +1 momentum on a hit.', enabled: false }
		],
		track: { min: 0, max: 4, label: 'Health' }
	},
	{
		id: 'hawk', name: 'Hawk', category: 'companion',
		description: 'Your companion is a keen-eyed hawk.',
		abilities: [
			{ text: 'When you Undertake a Journey, or when you Resupply by hunting for small game, add +1.', enabled: true },
			{ text: 'When you Secure an Advantage +edge using your hawk to scout ahead, add +1 and take +1 momentum on a hit.', enabled: false },
			{ text: 'When you Face Danger +wits to detect an ambush or spy on a distant location, add +2.', enabled: false }
		],
		track: { min: 0, max: 3, label: 'Health' }
	},
	{
		id: 'horse', name: 'Horse', category: 'companion',
		description: 'Your companion is a loyal horse.',
		abilities: [
			{ text: 'When you Undertake a Journey, you may roll +heart (instead of +wits). If you do, take +1 momentum on a hit.', enabled: true },
			{ text: 'When you Face Danger +edge using your horse\'s speed and mobility, or when you Strike at close range while mounted, add +1.', enabled: false },
			{ text: 'When you Secure an Advantage +heart by preparing your mount for a bytes ahead, take +2 momentum on a hit (instead of +1 or +2).', enabled: false }
		],
		track: { min: 0, max: 5, label: 'Health' }
	},
	{
		id: 'hound', name: 'Hound', category: 'companion',
		description: 'Your companion is a brave hound.',
		abilities: [
			{ text: 'When you Gather Information using your hound\'s keen senses to track or search, add +1 and take +1 momentum on a hit.', enabled: true },
			{ text: 'When you Strike, Clash, or Battle alongside your hound and score a hit, inflict +1 harm or take +1 momentum.', enabled: false },
			{ text: 'When you Endure Stress in the presence of your hound, add +1.', enabled: false }
		],
		track: { min: 0, max: 4, label: 'Health' }
	},
	{
		id: 'kindred', name: 'Kindred', category: 'companion',
		description: 'Your companion is a trusted NPC ally.',
		abilities: [
			{ text: 'When you make a move outside of combat and your companion aids you, add +1.', enabled: true },
			{ text: 'When you Clash or Battle alongside your companion, or when you Face Danger against an attack by rolling +its stat, add +1.', enabled: false },
			{ text: 'When your companion faces a dire situation, you may Endure Stress. On a hit, your companion is safe.', enabled: false }
		],
		track: { min: 0, max: 4, label: 'Health' }
	},
	{
		id: 'young-wyvern', name: 'Young Wyvern', category: 'companion',
		description: 'Your companion is a young wyvern.',
		abilities: [
			{ text: 'When you Undertake a Journey and score a hit, you may suffer -1 supply in exchange for +2 momentum.', enabled: true },
			{ text: 'When you Strike by commanding your wyvern to attack, roll +heart. Your wyvern inflicts 3 harm on a hit.', enabled: false },
			{ text: 'When you Face Danger by riding your wyvern into the skies, roll +heart. On a strong hit, take +2 momentum.', enabled: false }
		],
		track: { min: 0, max: 4, label: 'Health' }
	},

	// ══════════════════════════════════
	// PATHS
	// ══════════════════════════════════
	{
		id: 'herbalist', name: 'Herbalist', category: 'path',
		abilities: [
			{ text: 'When you attempt to Heal using herbal remedies, and you have at least +1 supply, choose one: add +2, or on a hit take +1 momentum.', enabled: true },
			{ text: 'When you Heal a companion, add +1 and take +1 momentum on a hit.', enabled: false },
			{ text: 'When you Make Camp and choose the option to recuperate, take +2 health (instead of +1).', enabled: false }
		]
	},
	{
		id: 'hunter', name: 'Hunter', category: 'path',
		abilities: [
			{ text: 'When you Gather Information by tracking, add +1 and take +1 momentum on a hit.', enabled: true },
			{ text: 'When you Resupply by hunting or trapping in the wild, take +1 momentum on a hit.', enabled: false },
			{ text: 'When you Strike or Clash from a concealed position against an unaware foe, add +1. On a strong hit, also take +1 momentum.', enabled: false }
		]
	},
	{
		id: 'ironclad', name: 'Ironclad', category: 'path',
		abilities: [
			{ text: 'When you equip or adjust your armor, choose one: Lightly armored: When you Endure Harm in combat, add +1 and take +1 momentum on a hit. Geared for war: Mark encumbered. When you Endure Harm in combat, add +2. When you Strike or Clash, add +1.', enabled: true },
			{ text: 'When you Clash while you are geared for war, add +1.', enabled: false },
			{ text: 'When you Compel in a situation where your strength of arms is a factor, add +2.', enabled: false }
		]
	},
	{
		id: 'ritualist', name: 'Ritualist', category: 'path',
		abilities: [
			{ text: 'When you perform a ritual to summon a mystical force, envision the nature of the ritual and roll +wits. On a strong hit, your ritual takes effect. On a weak hit, your ritual takes effect but there is an unexpected cost.', enabled: true },
			{ text: 'When you perform a divination ritual, add +1 and envision what the ritual reveals.', enabled: false },
			{ text: 'When you perform a ritual to protect a place, add +1 and take +1 momentum on a hit.', enabled: false }
		]
	},
	{
		id: 'shadow-walk', name: 'Shadow-Walk', category: 'path',
		abilities: [
			{ text: 'When you cloak yourself with the shadow of the other world, roll +shadow. On a strong hit, take +1 momentum. You and your gear are concealed. On a weak hit, as above, but the shadow drains you of warmth: suffer -1 spirit.', enabled: true },
			{ text: 'When you perform this ritual, add +1.', enabled: false },
			{ text: 'When you Gather Information by listening or watching unseen, add +2.', enabled: false }
		]
	},
	{
		id: 'wayfinder', name: 'Wayfinder', category: 'path',
		abilities: [
			{ text: 'When you Undertake a Journey, take +1 momentum on a strong hit. On a strong hit with a match, you spot a shortcut or discover something helpful. Envision what you find.', enabled: true },
			{ text: 'When you Secure an Advantage or Gather Information by carefully studying the landscape or environment, add +1.', enabled: false },
			{ text: 'When you Undertake a Journey through perilous or unknown lands, add +1.', enabled: false }
		]
	},

	// ══════════════════════════════════
	// COMBAT TALENTS
	// ══════════════════════════════════
	{
		id: 'archer', name: 'Archer', category: 'combat_talent',
		abilities: [
			{ text: 'When you Strike or Clash at range, you may add +1. On a weak hit, mark 1 extra harm.', enabled: true },
			{ text: 'Once per fight, when you Secure an Advantage by targeting your foe from a superior position, add +1 and take +2 momentum on a hit.', enabled: false },
			{ text: 'When you Strike at range and score a strong hit, you may spend +1 momentum (after applying the strong hit) to also inflict an arrow wound (the foe is hampered).', enabled: false }
		]
	},
	{
		id: 'berserker', name: 'Berserker', category: 'combat_talent',
		abilities: [
			{ text: 'When you Strike or Clash, you may suffer -1 health (before rolling) to add +1 and inflict +1 harm on a hit.', enabled: true },
			{ text: 'When you Endure Harm in a fight, and your health is above 0, you may let the pain fuel your rage: suffer -1 spirit and take +1 momentum.', enabled: false },
			{ text: 'When you Battle and score a strong hit, you may further push yourself. If you do, inflict +2 harm but suffer -1 health.', enabled: false }
		]
	},
	{
		id: 'blade-bound', name: 'Blade-Bound', category: 'combat_talent',
		abilities: [
			{ text: 'Once you mark a bond with a kin-blade, add +1 when you Strike or Clash with it.', enabled: true },
			{ text: 'When you Gather Information by listening to the whispers of your blade, add +1.', enabled: false },
			{ text: 'When you Face Death or Face Desolation while wielding your blade, add +2.', enabled: false }
		]
	},
	{
		id: 'shield-bearer', name: 'Shield-Bearer', category: 'combat_talent',
		abilities: [
			{ text: 'When you Clash in close quarters, add +1.', enabled: true },
			{ text: 'When you Face Danger using your shield as cover against ranged attacks, add +1.', enabled: false },
			{ text: 'When you Clash and score a strong hit, you may immediately follow up with a bash: Endure Harm (1 harm). On a hit, you retain initiative.', enabled: false }
		]
	},

	// ══════════════════════════════════
	// RITUALS
	// ══════════════════════════════════
	{
		id: 'augur', name: 'Augur', category: 'ritual',
		abilities: [
			{ text: 'When you summon a supernatural vision to reveal future events, roll +wits. On a strong hit, you may envision a helpful vision and take +2 momentum. On a weak hit, the vision is murky; take +1 momentum.', enabled: true },
			{ text: 'When you perform this ritual, add +1.', enabled: false },
			{ text: 'When you perform this ritual and burn momentum to improve your result, the cost of the ritual is negated.', enabled: false }
		]
	},
	{
		id: 'bind', name: 'Bind', category: 'ritual',
		abilities: [
			{ text: 'When you wear an animal pelt and dance in moonlight, roll +wits. On a strong hit, you take on the bytes of that animal. On a weak hit, as above but suffer -1 spirit.', enabled: true },
			{ text: 'When you perform this ritual, add +1.', enabled: false },
			{ text: 'When you Face Danger while in animal form, add +2.', enabled: false }
		]
	},
	{
		id: 'communion', name: 'Communion', category: 'ritual',
		abilities: [
			{ text: 'When you surround the remains of a recently dead intelligent creature with lit candles, roll +heart. On a strong hit, the spirit appears and you may ask it two questions. On a weak hit, the spirit appears but is uneasy; ask one question.', enabled: true },
			{ text: 'When you perform this ritual, add +1 and take +1 momentum on a hit.', enabled: false },
			{ text: 'When you perform this ritual in a sacred place, the spirit will answer an additional question.', enabled: false }
		]
	},
	{
		id: 'leech', name: 'Leech', category: 'ritual',
		abilities: [
			{ text: 'When you mark your hands with an iron-ite mixture and press them against a wounded person, roll +iron. On a strong hit, they take +2 health and you suffer -2 spirit. On a weak hit, they take +1 health and you suffer -1 spirit.', enabled: true },
			{ text: 'When you perform this ritual, add +1.', enabled: false },
			{ text: 'When you perform this ritual, you may exchange 1 spirit for 1 additional health healed.', enabled: false }
		]
	},
	{
		id: 'scry', name: 'Scry', category: 'ritual',
		abilities: [
			{ text: 'When you look into flames or reflective water and focus on a specific person or place, roll +wits. On a strong hit, you may envision a clear vision. On a weak hit, the vision is fleeting; envision what you see.', enabled: true },
			{ text: 'When you perform this ritual, add +1.', enabled: false },
			{ text: 'When you perform this ritual and the vision reveals a threat, take +2 momentum.', enabled: false }
		]
	},
	{
		id: 'visage', name: 'Visage', category: 'ritual',
		abilities: [
			{ text: 'When you paint yourself in the pointed symbols of your order, roll +wits. On a strong hit, you appear as a fearsome vision. Add +1 when you Compel using this visage. On a weak hit, as above but suffer -1 spirit.', enabled: true },
			{ text: 'When you perform this ritual, add +1.', enabled: false },
			{ text: 'When you Compel while wearing this visage and score a strong hit, take +1 momentum.', enabled: false }
		]
	},
	{
		id: 'ward', name: 'Ward', category: 'ritual',
		abilities: [
			{ text: 'When you walk a wide circle around a place of shelter while calling on mystic forces of protection, roll +wits. On a strong hit, hostile creatures and forces cannot cross the boundary. On a weak hit, as above, but the ward requires your constant attention — you cannot sleep.', enabled: true },
			{ text: 'When you perform this ritual, add +1.', enabled: false },
			{ text: 'When you rest within your ward, take +2 spirit (instead of +1).', enabled: false }
		]
	}
];

export function getAssetsByCategory(): Map<string, AssetDefinition[]> {
	const map = new Map<string, AssetDefinition[]>();
	for (const a of ASSETS) {
		const cat = a.category;
		if (!map.has(cat)) map.set(cat, []);
		map.get(cat)!.push(a);
	}
	return map;
}

export function getAssetById(id: string): AssetDefinition | undefined {
	return ASSETS.find(a => a.id === id);
}

export function assetCategoryLabel(cat: string): string {
	switch (cat) {
		case 'companion': return 'Companions';
		case 'path': return 'Paths';
		case 'combat_talent': return 'Combat Talents';
		case 'ritual': return 'Rituals';
		case 'talent': return 'Talents';
		default: return cat;
	}
}
