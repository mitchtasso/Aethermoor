'use strict';

// ── Item Database ───────────────────────────────────────────────────────────
// All items in the game. Equipment, consumables, materials, loot.
// Rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'

const RARITY_COLORS = {
  common:    '#cccccc',
  uncommon:  '#2ecc71',
  rare:      '#3b82f6',
  epic:      '#a855f7',
  legendary: '#f59e0b',
};

const ITEMS = {

  // ── Weapons (right hand) ──────────────────────────────────────────────────
  sword_iron: {
    id: 'sword_iron', name: 'Iron Sword', type: 'weapon', subtype: 'one_handed',
    rarity: 'common', damage: 12, weight: 4, value: 45,
    description: 'A simple but reliable iron blade.',
  },
  sword_steel: {
    id: 'sword_steel', name: 'Steel Sword', type: 'weapon', subtype: 'one_handed',
    rarity: 'uncommon', damage: 18, weight: 4, value: 120,
    description: 'Well-forged steel with a keen edge.',
  },
  axe_iron: {
    id: 'axe_iron', name: 'Iron Axe', type: 'weapon', subtype: 'one_handed',
    rarity: 'common', damage: 14, weight: 5, value: 55,
    description: 'A sturdy iron axe. Slow but hits hard.',
  },
  dagger_iron: {
    id: 'dagger_iron', name: 'Iron Dagger', type: 'weapon', subtype: 'one_handed',
    rarity: 'common', damage: 7, weight: 1.5, value: 20,
    description: 'Light and fast. Good for quick strikes.',
  },
  greatsword_iron: {
    id: 'greatsword_iron', name: 'Iron Greatsword', type: 'weapon', subtype: 'two_handed',
    rarity: 'common', damage: 22, weight: 10, value: 80,
    description: 'A massive two-handed blade.',
  },
  staff_oak: {
    id: 'staff_oak', name: 'Oak Staff', type: 'weapon', subtype: 'staff',
    rarity: 'common', damage: 6, weight: 3, value: 30, magicBonus: 10,
    description: 'A simple wooden staff that channels magic.',
  },

  // ── Ranged Weapons ────────────────────────────────────────────────────────
  bow_short: {
    id: 'bow_short', name: 'Short Bow', type: 'weapon', subtype: 'ranged',
    rarity: 'common', damage: 14, weight: 2, value: 40, ammoType: 'arrow',
    drawTime: 0.6, projectileSpeed: 55,
    description: 'A light hunting bow. Quick to draw.',
  },
  bow_long: {
    id: 'bow_long', name: 'Long Bow', type: 'weapon', subtype: 'ranged',
    rarity: 'uncommon', damage: 22, weight: 3.5, value: 110, ammoType: 'arrow',
    drawTime: 0.9, projectileSpeed: 65,
    description: 'A tall yew bow with impressive range and power.',
  },
  bow_frost: {
    id: 'bow_frost', name: 'Frostpiercer Bow', type: 'weapon', subtype: 'ranged',
    rarity: 'rare', damage: 30, weight: 3, value: 280, ammoType: 'arrow',
    drawTime: 0.75, projectileSpeed: 70,
    description: 'A bow carved from frost-oak. Arrows crackle with cold.',
  },
  crossbow_light: {
    id: 'crossbow_light', name: 'Light Crossbow', type: 'weapon', subtype: 'ranged',
    rarity: 'uncommon', damage: 20, weight: 4, value: 95, ammoType: 'bolt',
    drawTime: 1.1, projectileSpeed: 75,
    description: 'A compact crossbow. Slow to reload but hits hard.',
  },
  crossbow_heavy: {
    id: 'crossbow_heavy', name: 'Heavy Crossbow', type: 'weapon', subtype: 'ranged',
    rarity: 'rare', damage: 35, weight: 7, value: 320, ammoType: 'bolt',
    drawTime: 1.5, projectileSpeed: 80,
    description: 'A massive siege crossbow. Devastating at any range.',
  },

  // ── Ammunition ────────────────────────────────────────────────────────────
  arrow: {
    id: 'arrow', name: 'Arrow', type: 'ammo', ammoType: 'arrow',
    rarity: 'common', weight: 0.05, value: 2,
    description: 'A basic iron-tipped arrow.',
  },
  arrow_fire: {
    id: 'arrow_fire', name: 'Fire Arrow', type: 'ammo', ammoType: 'arrow',
    rarity: 'uncommon', weight: 0.05, value: 8, bonusDamage: 8,
    description: 'An arrow wrapped in oil-soaked cloth. Burns on impact.',
  },
  arrow_frost: {
    id: 'arrow_frost', name: 'Frost Arrow', type: 'ammo', ammoType: 'arrow',
    rarity: 'uncommon', weight: 0.05, value: 8, bonusDamage: 8,
    description: 'An arrow tipped with frost crystal. Chills the target.',
  },
  bolt: {
    id: 'bolt', name: 'Crossbow Bolt', type: 'ammo', ammoType: 'bolt',
    rarity: 'common', weight: 0.08, value: 3,
    description: 'A short, heavy crossbow bolt.',
  },
  bolt_dark: {
    id: 'bolt_dark', name: 'Dark Iron Bolt', type: 'ammo', ammoType: 'bolt',
    rarity: 'rare', weight: 0.08, value: 12, bonusDamage: 12,
    description: 'A bolt forged from dark iron. Pierces armor.',
  },

  // ── Shields (left hand) ───────────────────────────────────────────────────
  shield_wood: {
    id: 'shield_wood', name: 'Wooden Shield', type: 'shield',
    rarity: 'common', armor: 8, weight: 4, value: 30,
    description: 'A basic wooden buckler.',
  },
  shield_iron: {
    id: 'shield_iron', name: 'Iron Shield', type: 'shield',
    rarity: 'uncommon', armor: 15, weight: 7, value: 90,
    description: 'Solid iron. Takes a beating.',
  },

  // ── Armor ─────────────────────────────────────────────────────────────────
  helm_leather: {
    id: 'helm_leather', name: 'Leather Cap', type: 'armor', slot: 'head',
    rarity: 'common', armor: 4, weight: 1.5, value: 25,
    description: 'Simple head protection.',
  },
  helm_iron: {
    id: 'helm_iron', name: 'Iron Helm', type: 'armor', slot: 'head',
    rarity: 'uncommon', armor: 10, weight: 4, value: 75,
    description: 'A sturdy iron helmet.',
  },
  chest_leather: {
    id: 'chest_leather', name: 'Leather Armor', type: 'armor', slot: 'chest',
    rarity: 'common', armor: 10, weight: 5, value: 50,
    description: 'Light and flexible protection.',
  },
  chest_iron: {
    id: 'chest_iron', name: 'Iron Chestplate', type: 'armor', slot: 'chest',
    rarity: 'uncommon', armor: 22, weight: 12, value: 150,
    description: 'Heavy plate armor. Slows you down but keeps you alive.',
  },
  gauntlets_leather: {
    id: 'gauntlets_leather', name: 'Leather Gloves', type: 'armor', slot: 'hands',
    rarity: 'common', armor: 3, weight: 1, value: 15,
    description: 'Basic hand protection.',
  },
  boots_leather: {
    id: 'boots_leather', name: 'Leather Boots', type: 'armor', slot: 'feet',
    rarity: 'common', armor: 3, weight: 2, value: 20,
    description: 'Comfortable and quiet.',
  },

  // ── Potions ───────────────────────────────────────────────────────────────
  potion_health: {
    id: 'potion_health', name: 'Health Potion', type: 'potion',
    rarity: 'common', weight: 0.3, value: 25, restores: 'hp', amount: 40,
    description: 'Restores 40 HP.',
  },
  potion_stamina: {
    id: 'potion_stamina', name: 'Stamina Potion', type: 'potion',
    rarity: 'common', weight: 0.3, value: 25, restores: 'sp', amount: 50,
    description: 'Restores 50 Stamina.',
  },
  potion_magic: {
    id: 'potion_magic', name: 'Magic Potion', type: 'potion',
    rarity: 'common', weight: 0.3, value: 30, restores: 'mp', amount: 50,
    description: 'Restores 50 Magic.',
  },
  potion_greater_health: {
    id: 'potion_greater_health', name: 'Greater Health Potion', type: 'potion',
    rarity: 'uncommon', weight: 0.4, value: 60, restores: 'hp', amount: 90,
    description: 'Restores 90 HP.',
  },
  potion_greater_magic: {
    id: 'potion_greater_magic', name: 'Greater Magic Potion', type: 'potion',
    rarity: 'uncommon', weight: 0.4, value: 65, restores: 'mp', amount: 100,
    description: 'Restores 100 Magic.',
  },
  potion_fire_ward: {
    id: 'potion_fire_ward', name: 'Fire Ward Potion', type: 'potion',
    rarity: 'uncommon', weight: 0.3, value: 50, restores: 'hp', amount: 30,
    description: 'Restores 30 HP and grants brief fire resistance.',
  },
  potion_frost_ward: {
    id: 'potion_frost_ward', name: 'Frost Ward Potion', type: 'potion',
    rarity: 'uncommon', weight: 0.3, value: 50, restores: 'hp', amount: 30,
    description: 'Restores 30 HP and grants brief frost resistance.',
  },
  potion_blight_cure: {
    id: 'potion_blight_cure', name: 'Blight Cure', type: 'potion',
    rarity: 'rare', weight: 0.3, value: 75, restores: 'hp', amount: 60,
    description: 'Purges corruption and restores 60 HP.',
  },

  // ── Materials ─────────────────────────────────────────────────────────────
  wolf_pelt: {
    id: 'wolf_pelt', name: 'Wolf Pelt', type: 'material',
    rarity: 'common', weight: 2, value: 12,
    description: 'A coarse wolf hide. Used in leather crafting.',
  },
  wolf_fang: {
    id: 'wolf_fang', name: 'Wolf Fang', type: 'material',
    rarity: 'common', weight: 0.2, value: 5,
    description: 'A sharp canine tooth.',
  },
  iron_ore: {
    id: 'iron_ore', name: 'Iron Ore', type: 'material',
    rarity: 'common', weight: 3, value: 8,
    description: 'Raw iron. Can be smelted at a forge.',
  },
  herb_healwort: {
    id: 'herb_healwort', name: 'Healwort', type: 'material',
    rarity: 'common', weight: 0.1, value: 4,
    description: 'A medicinal herb used in alchemy.',
  },

  bear_pelt: {
    id: 'bear_pelt', name: 'Bear Pelt', type: 'material',
    rarity: 'uncommon', weight: 5, value: 30,
    description: 'A thick brown bear hide. Prized by armorers.',
  },
  bear_claw: {
    id: 'bear_claw', name: 'Bear Claw', type: 'material',
    rarity: 'common', weight: 0.3, value: 10,
    description: 'A massive curved claw.',
  },
  spider_silk: {
    id: 'spider_silk', name: 'Spider Silk', type: 'material',
    rarity: 'common', weight: 0.1, value: 8,
    description: 'Strong, fine thread from a giant spider.',
  },
  spider_venom: {
    id: 'spider_venom', name: 'Spider Venom', type: 'material',
    rarity: 'uncommon', weight: 0.2, value: 18,
    description: 'A vial of potent venom. Useful in alchemy.',
  },
  bone_fragment: {
    id: 'bone_fragment', name: 'Bone Fragment', type: 'material',
    rarity: 'common', weight: 0.5, value: 6,
    description: 'A piece of ancient bone, faintly glowing.',
  },
  soul_dust: {
    id: 'soul_dust', name: 'Soul Dust', type: 'material',
    rarity: 'rare', weight: 0.1, value: 35,
    description: 'Shimmering dust left by defeated undead.',
  },
  bandit_lockpick: {
    id: 'bandit_lockpick', name: 'Lockpick', type: 'material',
    rarity: 'common', weight: 0.1, value: 5,
    description: 'A crude but functional lockpick.',
  },
  feather: {
    id: 'feather', name: 'Feather', type: 'material',
    rarity: 'common', weight: 0.05, value: 2,
    description: 'A sturdy flight feather. Used in arrow fletching.',
  },

  // ── Ashfeld Materials ──────────────────────────────────────────────────────
  obsidian_shard: {
    id: 'obsidian_shard', name: 'Obsidian Shard', type: 'material',
    rarity: 'uncommon', weight: 1, value: 18,
    description: 'A razor-sharp sliver of volcanic glass.',
  },
  fire_essence: {
    id: 'fire_essence', name: 'Fire Essence', type: 'material',
    rarity: 'rare', weight: 0.2, value: 40,
    description: 'A flickering mote of elemental flame.',
  },
  molten_core: {
    id: 'molten_core', name: 'Molten Core', type: 'material',
    rarity: 'epic', weight: 3, value: 80,
    description: 'A still-glowing heart of living magma.',
  },

  // ── Frostveil Materials ───────────────────────────────────────────────────
  frost_crystal: {
    id: 'frost_crystal', name: 'Frost Crystal', type: 'material',
    rarity: 'uncommon', weight: 0.5, value: 22,
    description: 'An eternally frozen shard that never melts.',
  },
  yeti_fur: {
    id: 'yeti_fur', name: 'Yeti Fur', type: 'material',
    rarity: 'rare', weight: 4, value: 45,
    description: 'Thick white fur from a mountain beast.',
  },
  icebloom: {
    id: 'icebloom', name: 'Icebloom', type: 'material',
    rarity: 'uncommon', weight: 0.1, value: 15,
    description: 'A pale flower that grows only in permafrost.',
  },

  // ── Blight Materials ──────────────────────────────────────────────────────
  blight_essence: {
    id: 'blight_essence', name: 'Blight Essence', type: 'material',
    rarity: 'rare', weight: 0.2, value: 50,
    description: 'A swirling vial of corrupted energy.',
  },
  corrupted_bone: {
    id: 'corrupted_bone', name: 'Corrupted Bone', type: 'material',
    rarity: 'uncommon', weight: 1, value: 20,
    description: 'Blackened bone pulsing with dark energy.',
  },
  dark_iron: {
    id: 'dark_iron', name: 'Dark Iron', type: 'material',
    rarity: 'rare', weight: 4, value: 55,
    description: 'Tainted metal from the heart of the Blight.',
  },

  // ── Higher-tier Equipment ─────────────────────────────────────────────────
  sword_volcanic: {
    id: 'sword_volcanic', name: 'Volcanic Blade', type: 'weapon', subtype: 'one_handed',
    rarity: 'rare', damage: 26, weight: 5, value: 220,
    description: 'A sword forged in Cinderhearth\'s master forge. Its edge glows faintly.',
  },
  staff_frost: {
    id: 'staff_frost', name: 'Frostweave Staff', type: 'weapon', subtype: 'staff',
    rarity: 'rare', damage: 10, weight: 3.5, value: 250, magicBonus: 25,
    description: 'A staff carved from ancient frost-oak, channeling icy magic.',
  },
  chest_volcanic: {
    id: 'chest_volcanic', name: 'Volcanic Plate', type: 'armor', slot: 'chest',
    rarity: 'rare', armor: 32, weight: 14, value: 280,
    description: 'Obsidian-forged plate. Warm to the touch.',
  },
  helm_frost: {
    id: 'helm_frost', name: 'Frostveil Helm', type: 'armor', slot: 'head',
    rarity: 'rare', armor: 16, weight: 4, value: 180,
    description: 'An ice-blue helm from the northern peaks.',
  },
  chest_dark: {
    id: 'chest_dark', name: 'Dark Iron Cuirass', type: 'armor', slot: 'chest',
    rarity: 'epic', armor: 40, weight: 16, value: 400,
    description: 'Forged from Blight-tainted iron. Unnervingly light.',
  },
  sword_dark: {
    id: 'sword_dark', name: 'Dark Iron Greatsword', type: 'weapon', subtype: 'two_handed',
    rarity: 'epic', damage: 38, weight: 12, value: 450,
    description: 'A massive blade of dark iron. It hums with corruption.',
  },

  // ── Misc / Vendor Loot ────────────────────────────────────────────────────
  gold_pouch_small: {
    id: 'gold_pouch_small', name: 'Small Gold Pouch', type: 'misc',
    rarity: 'common', weight: 0.1, value: 15,
    description: 'A small pouch of coins.',
  },
  gold_pouch_large: {
    id: 'gold_pouch_large', name: 'Large Gold Pouch', type: 'misc',
    rarity: 'uncommon', weight: 0.2, value: 40,
    description: 'A hefty pouch of coins.',
  },
};

// ── Loot Tables ─────────────────────────────────────────────────────────────
// Each entry: { id, chance (0-1), countMin, countMax }
const LOOT_TABLES = {
  wolf: [
    { id: 'wolf_pelt',         chance: 0.75, countMin: 1, countMax: 1 },
    { id: 'wolf_fang',         chance: 0.40, countMin: 1, countMax: 2 },
    { id: 'gold_pouch_small',  chance: 0.30, countMin: 1, countMax: 1 },
    { id: 'potion_health',     chance: 0.10, countMin: 1, countMax: 1 },
    { id: 'herb_healwort',     chance: 0.20, countMin: 1, countMax: 2 },
    { id: 'feather',           chance: 0.25, countMin: 1, countMax: 2 },
  ],
  bear: [
    { id: 'bear_pelt',         chance: 0.80, countMin: 1, countMax: 1 },
    { id: 'bear_claw',         chance: 0.55, countMin: 1, countMax: 2 },
    { id: 'gold_pouch_small',  chance: 0.50, countMin: 1, countMax: 1 },
    { id: 'potion_health',     chance: 0.25, countMin: 1, countMax: 1 },
    { id: 'herb_healwort',     chance: 0.30, countMin: 1, countMax: 3 },
  ],
  spider: [
    { id: 'spider_silk',       chance: 0.70, countMin: 1, countMax: 3 },
    { id: 'spider_venom',      chance: 0.30, countMin: 1, countMax: 1 },
    { id: 'gold_pouch_small',  chance: 0.15, countMin: 1, countMax: 1 },
  ],
  skeleton: [
    { id: 'bone_fragment',     chance: 0.80, countMin: 1, countMax: 3 },
    { id: 'soul_dust',         chance: 0.20, countMin: 1, countMax: 1 },
    { id: 'gold_pouch_small',  chance: 0.40, countMin: 1, countMax: 1 },
    { id: 'potion_health',     chance: 0.15, countMin: 1, countMax: 1 },
    { id: 'iron_ore',          chance: 0.25, countMin: 1, countMax: 1 },
    { id: 'arrow',             chance: 0.30, countMin: 2, countMax: 5 },
    { id: 'feather',           chance: 0.20, countMin: 1, countMax: 2 },
  ],
  bandit: [
    { id: 'gold_pouch_large',  chance: 0.45, countMin: 1, countMax: 1 },
    { id: 'gold_pouch_small',  chance: 0.60, countMin: 1, countMax: 1 },
    { id: 'bandit_lockpick',   chance: 0.35, countMin: 1, countMax: 2 },
    { id: 'potion_health',     chance: 0.30, countMin: 1, countMax: 1 },
    { id: 'potion_stamina',    chance: 0.20, countMin: 1, countMax: 1 },
    { id: 'dagger_iron',       chance: 0.08, countMin: 1, countMax: 1 },
    { id: 'arrow',             chance: 0.40, countMin: 3, countMax: 8 },
    { id: 'bolt',              chance: 0.20, countMin: 2, countMax: 5 },
    { id: 'bow_short',         chance: 0.05, countMin: 1, countMax: 1 },
  ],
  // ── Ashfeld ──────────────────────────────────────────────────────────────
  fire_imp: [
    { id: 'fire_essence',      chance: 0.35, countMin: 1, countMax: 1 },
    { id: 'obsidian_shard',    chance: 0.55, countMin: 1, countMax: 2 },
    { id: 'gold_pouch_small',  chance: 0.40, countMin: 1, countMax: 1 },
    { id: 'potion_magic',      chance: 0.15, countMin: 1, countMax: 1 },
    { id: 'arrow_fire',        chance: 0.20, countMin: 2, countMax: 4 },
  ],
  magma_golem: [
    { id: 'molten_core',       chance: 0.25, countMin: 1, countMax: 1 },
    { id: 'obsidian_shard',    chance: 0.70, countMin: 1, countMax: 3 },
    { id: 'fire_essence',      chance: 0.40, countMin: 1, countMax: 1 },
    { id: 'gold_pouch_large',  chance: 0.35, countMin: 1, countMax: 1 },
    { id: 'iron_ore',          chance: 0.50, countMin: 1, countMax: 2 },
  ],
  // ── Frostveil ────────────────────────────────────────────────────────────
  frost_wolf: [
    { id: 'yeti_fur',          chance: 0.30, countMin: 1, countMax: 1 },
    { id: 'frost_crystal',     chance: 0.45, countMin: 1, countMax: 1 },
    { id: 'wolf_fang',         chance: 0.50, countMin: 1, countMax: 2 },
    { id: 'gold_pouch_small',  chance: 0.35, countMin: 1, countMax: 1 },
    { id: 'icebloom',          chance: 0.20, countMin: 1, countMax: 2 },
  ],
  ice_wraith: [
    { id: 'frost_crystal',     chance: 0.65, countMin: 1, countMax: 2 },
    { id: 'icebloom',          chance: 0.40, countMin: 1, countMax: 1 },
    { id: 'soul_dust',         chance: 0.30, countMin: 1, countMax: 1 },
    { id: 'gold_pouch_large',  chance: 0.25, countMin: 1, countMax: 1 },
    { id: 'potion_magic',      chance: 0.20, countMin: 1, countMax: 1 },
    { id: 'arrow_frost',       chance: 0.25, countMin: 2, countMax: 4 },
  ],
  // ── The Blight ───────────────────────────────────────────────────────────
  blight_hound: [
    { id: 'blight_essence',    chance: 0.30, countMin: 1, countMax: 1 },
    { id: 'corrupted_bone',    chance: 0.60, countMin: 1, countMax: 2 },
    { id: 'gold_pouch_small',  chance: 0.40, countMin: 1, countMax: 1 },
    { id: 'potion_health',     chance: 0.20, countMin: 1, countMax: 1 },
  ],
  corrupted_knight: [
    { id: 'dark_iron',         chance: 0.30, countMin: 1, countMax: 1 },
    { id: 'blight_essence',    chance: 0.45, countMin: 1, countMax: 1 },
    { id: 'corrupted_bone',    chance: 0.55, countMin: 1, countMax: 2 },
    { id: 'gold_pouch_large',  chance: 0.50, countMin: 1, countMax: 1 },
    { id: 'potion_health',     chance: 0.30, countMin: 1, countMax: 1 },
    { id: 'sword_steel',       chance: 0.06, countMin: 1, countMax: 1 },
    { id: 'bolt_dark',         chance: 0.20, countMin: 2, countMax: 4 },
  ],
};

function rollLoot(tableKey) {
  const table = LOOT_TABLES[tableKey];
  if (!table) return [];
  const drops = [];
  for (const entry of table) {
    if (Math.random() < entry.chance) {
      const count = entry.countMin + Math.floor(Math.random() * (entry.countMax - entry.countMin + 1));
      for (let i = 0; i < count; i++) {
        drops.push(entry.id);
      }
    }
  }
  return drops;
}
