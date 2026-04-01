'use strict';

// ═══════════════════════════════════════════════════════════════════════════
// CRAFTING RECIPES
// ═══════════════════════════════════════════════════════════════════════════

const ALCHEMY_RECIPES = [
  {
    id: 'craft_health_potion',
    name: 'Health Potion',
    output: 'potion_health',
    outputCount: 2,
    ingredients: [
      { id: 'herb_healwort', count: 2 },
    ],
    description: 'Brew two health potions from healwort.',
  },
  {
    id: 'craft_stamina_potion',
    name: 'Stamina Potion',
    output: 'potion_stamina',
    outputCount: 2,
    ingredients: [
      { id: 'herb_healwort', count: 1 },
      { id: 'wolf_pelt', count: 1 },
    ],
    description: 'Combine healwort with pelt extract for stamina recovery.',
  },
  {
    id: 'craft_magic_potion',
    name: 'Magic Potion',
    output: 'potion_magic',
    outputCount: 2,
    ingredients: [
      { id: 'herb_healwort', count: 1 },
      { id: 'spider_venom', count: 1 },
    ],
    description: 'Distill spider venom with healwort into a mana restorative.',
  },
  {
    id: 'craft_greater_health',
    name: 'Greater Health Potion',
    output: 'potion_greater_health',
    outputCount: 1,
    ingredients: [
      { id: 'herb_healwort', count: 3 },
      { id: 'bear_claw', count: 1 },
    ],
    description: 'A potent healing elixir using concentrated bear extract.',
  },
  {
    id: 'craft_greater_magic',
    name: 'Greater Magic Potion',
    output: 'potion_greater_magic',
    outputCount: 1,
    ingredients: [
      { id: 'herb_healwort', count: 2 },
      { id: 'soul_dust', count: 1 },
    ],
    description: 'Soul dust amplifies the magical restoration of healwort.',
  },
  {
    id: 'craft_fire_ward',
    name: 'Fire Ward Potion',
    output: 'potion_fire_ward',
    outputCount: 1,
    ingredients: [
      { id: 'fire_essence', count: 1 },
      { id: 'herb_healwort', count: 1 },
    ],
    description: 'Tempered fire essence grants brief resistance to flame.',
  },
  {
    id: 'craft_frost_ward',
    name: 'Frost Ward Potion',
    output: 'potion_frost_ward',
    outputCount: 1,
    ingredients: [
      { id: 'frost_crystal', count: 1 },
      { id: 'icebloom', count: 1 },
    ],
    description: 'Frost crystal and icebloom combined to ward off cold.',
  },
  {
    id: 'craft_blight_cure',
    name: 'Blight Cure',
    output: 'potion_blight_cure',
    outputCount: 1,
    ingredients: [
      { id: 'blight_essence', count: 1 },
      { id: 'herb_healwort', count: 2 },
    ],
    description: 'Purify blight essence with healwort to create a curative.',
  },
];

const FLETCHING_RECIPES = [
  {
    id: 'craft_arrow',
    name: 'Arrows (10)',
    output: 'arrow',
    outputCount: 10,
    ingredients: [
      { id: 'iron_ore', count: 1 },
      { id: 'feather', count: 2 },
    ],
    description: 'Fletch 10 iron-tipped arrows from ore and feathers.',
  },
  {
    id: 'craft_arrow_fire',
    name: 'Fire Arrows (5)',
    output: 'arrow_fire',
    outputCount: 5,
    ingredients: [
      { id: 'arrow', count: 5 },
      { id: 'fire_essence', count: 1 },
    ],
    description: 'Dip arrows in fire essence to create burning projectiles.',
  },
  {
    id: 'craft_arrow_frost',
    name: 'Frost Arrows (5)',
    output: 'arrow_frost',
    outputCount: 5,
    ingredients: [
      { id: 'arrow', count: 5 },
      { id: 'frost_crystal', count: 1 },
    ],
    description: 'Tip arrows with frost crystal for chilling strikes.',
  },
  {
    id: 'craft_bolt',
    name: 'Crossbow Bolts (10)',
    output: 'bolt',
    outputCount: 10,
    ingredients: [
      { id: 'iron_ore', count: 2 },
    ],
    description: 'Forge 10 heavy crossbow bolts from iron.',
  },
  {
    id: 'craft_bolt_dark',
    name: 'Dark Iron Bolts (5)',
    output: 'bolt_dark',
    outputCount: 5,
    ingredients: [
      { id: 'bolt', count: 5 },
      { id: 'dark_iron', count: 1 },
    ],
    description: 'Forge bolts from dark iron for armor-piercing shots.',
  },
  {
    id: 'craft_bow_short',
    name: 'Short Bow',
    output: 'bow_short',
    outputCount: 1,
    ingredients: [
      { id: 'iron_ore', count: 2 },
      { id: 'spider_silk', count: 2 },
    ],
    description: 'Craft a light hunting bow with a silk bowstring.',
  },
  {
    id: 'craft_bow_long',
    name: 'Long Bow',
    output: 'bow_long',
    outputCount: 1,
    ingredients: [
      { id: 'iron_ore', count: 3 },
      { id: 'spider_silk', count: 3 },
      { id: 'bear_pelt', count: 1 },
    ],
    description: 'Craft a tall longbow with reinforced grip.',
  },
  {
    id: 'craft_crossbow_light',
    name: 'Light Crossbow',
    output: 'crossbow_light',
    outputCount: 1,
    ingredients: [
      { id: 'iron_ore', count: 4 },
      { id: 'spider_silk', count: 2 },
    ],
    description: 'Forge a compact crossbow with iron fittings.',
  },
];

const SMITHING_RECIPES = [
  {
    id: 'craft_sword_iron',
    name: 'Iron Sword',
    output: 'sword_iron',
    outputCount: 1,
    ingredients: [
      { id: 'iron_ore', count: 3 },
    ],
    description: 'Forge a reliable iron blade from raw ore.',
  },
  {
    id: 'craft_axe_iron',
    name: 'Iron Axe',
    output: 'axe_iron',
    outputCount: 1,
    ingredients: [
      { id: 'iron_ore', count: 3 },
    ],
    description: 'Forge a sturdy iron axe from raw ore.',
  },
  {
    id: 'craft_dagger_iron',
    name: 'Iron Dagger',
    output: 'dagger_iron',
    outputCount: 1,
    ingredients: [
      { id: 'iron_ore', count: 2 },
    ],
    description: 'Forge a quick iron dagger.',
  },
  {
    id: 'craft_helm_iron',
    name: 'Iron Helm',
    output: 'helm_iron',
    outputCount: 1,
    ingredients: [
      { id: 'iron_ore', count: 3 },
    ],
    description: 'Shape iron ore into a protective helm.',
  },
  {
    id: 'craft_chest_iron',
    name: 'Iron Chestplate',
    output: 'chest_iron',
    outputCount: 1,
    ingredients: [
      { id: 'iron_ore', count: 5 },
    ],
    description: 'Forge heavy iron plate armor from raw ore.',
  },
  {
    id: 'craft_shield_iron',
    name: 'Iron Shield',
    output: 'shield_iron',
    outputCount: 1,
    ingredients: [
      { id: 'iron_ore', count: 4 },
    ],
    description: 'Hammer iron ore into a solid shield.',
  },
  {
    id: 'craft_sword_steel',
    name: 'Steel Sword',
    output: 'sword_steel',
    outputCount: 1,
    ingredients: [
      { id: 'iron_ore', count: 4 },
      { id: 'bone_fragment', count: 2 },
    ],
    description: 'Fold bone ash into iron for a stronger steel alloy.',
  },
  {
    id: 'craft_sword_volcanic',
    name: 'Volcanic Blade',
    output: 'sword_volcanic',
    outputCount: 1,
    ingredients: [
      { id: 'obsidian_shard', count: 3 },
      { id: 'molten_core', count: 1 },
    ],
    description: 'Fuse obsidian with a molten core to forge a searing blade.',
  },
  {
    id: 'craft_chest_volcanic',
    name: 'Volcanic Plate',
    output: 'chest_volcanic',
    outputCount: 1,
    ingredients: [
      { id: 'obsidian_shard', count: 4 },
      { id: 'molten_core', count: 1 },
      { id: 'iron_ore', count: 3 },
    ],
    description: 'Obsidian-forged plate armor. Warm to the touch.',
  },
  {
    id: 'craft_staff_frost',
    name: 'Frostweave Staff',
    output: 'staff_frost',
    outputCount: 1,
    ingredients: [
      { id: 'frost_crystal', count: 3 },
      { id: 'yeti_fur', count: 1 },
    ],
    description: 'Weave frost crystals with yeti fur to channel icy magic.',
  },
  {
    id: 'craft_helm_frost',
    name: 'Frostveil Helm',
    output: 'helm_frost',
    outputCount: 1,
    ingredients: [
      { id: 'frost_crystal', count: 2 },
      { id: 'iron_ore', count: 2 },
    ],
    description: 'An ice-blue helm forged with frost crystals.',
  },
  {
    id: 'craft_sword_dark',
    name: 'Dark Iron Greatsword',
    output: 'sword_dark',
    outputCount: 1,
    ingredients: [
      { id: 'dark_iron', count: 3 },
      { id: 'blight_essence', count: 1 },
    ],
    description: 'A massive blade of tainted dark iron.',
  },
  {
    id: 'craft_chest_dark',
    name: 'Dark Iron Cuirass',
    output: 'chest_dark',
    outputCount: 1,
    ingredients: [
      { id: 'dark_iron', count: 4 },
      { id: 'corrupted_bone', count: 2 },
    ],
    description: 'Forge corrupted bone into dark iron plate.',
  },
  {
    id: 'craft_gauntlets_leather',
    name: 'Leather Gauntlets',
    output: 'gauntlets_leather',
    outputCount: 1,
    ingredients: [
      { id: 'wolf_pelt', count: 2 },
      { id: 'spider_silk', count: 1 },
    ],
    description: 'Stitch wolf hide with spider silk for tough gauntlets.',
  },
  {
    id: 'craft_boots_leather',
    name: 'Leather Boots',
    output: 'boots_leather',
    outputCount: 1,
    ingredients: [
      { id: 'bear_pelt', count: 1 },
      { id: 'wolf_pelt', count: 1 },
    ],
    description: 'Durable boots crafted from layered hides.',
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// CRAFTING MANAGER
// ═══════════════════════════════════════════════════════════════════════════

class CraftingManager {
  constructor(inventory) {
    this.inventory = inventory;
    this._craftTab = 'alchemy'; // 'alchemy' | 'smithing' | 'fletching'
    this._selected = null;      // recipe index within current tab
  }

  getRecipes() {
    if (this._craftTab === 'alchemy')   return ALCHEMY_RECIPES;
    if (this._craftTab === 'smithing')  return SMITHING_RECIPES;
    if (this._craftTab === 'fletching') return FLETCHING_RECIPES;
    return ALCHEMY_RECIPES;
  }

  canCraft(recipe) {
    for (const ing of recipe.ingredients) {
      if (this.inventory.hasItem(ing.id) < ing.count) return false;
    }
    return true;
  }

  craft(recipe) {
    if (!this.canCraft(recipe)) return false;

    // Consume ingredients
    for (const ing of recipe.ingredients) {
      this.inventory.removeItem(ing.id, ing.count);
    }

    // Add output
    for (let i = 0; i < recipe.outputCount; i++) {
      this.inventory.addItem(recipe.output);
    }

    return true;
  }
}
