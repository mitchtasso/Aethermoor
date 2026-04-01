# Realms of Aethermoor — Game Design Document

**Version:** 1.1  
**Last Updated:** March 30, 2026  
**Platform:** Web (Three.js / React Artifact)  
**Genre:** First-Person Open-World Medieval Fantasy RPG  
**Perspective:** First-Person 3D (Pointer Lock mouse look)

> *Working title. Replace as desired.*

---

## 1. Game Overview

### 1.1 Concept

A first-person 3D open-world RPG set in the medieval fantasy kingdom of Aethermoor. The player sees the world entirely through their character's eyes — weapons, shields, and spell effects are visible in-hand at all times, creating an immersive perspective where every sword swing, arrow shot, and fireball cast feels direct and personal. The player is a wanderer who arrives in a war-torn land threatened by an encroaching dark force. Through exploration, combat, and questing across multiple towns and wilderness regions, the player builds their character, forges alliances, and ultimately confronts the source of corruption.

### 1.2 Core Pillars

- **Player Freedom** — Non-linear exploration; the player chooses where to go and how to grow.
- **First-Person Immersion** — The player experiences everything through their character's eyes. Hands, weapons, and spell effects are always visible on screen. NPCs make eye contact. The world is designed to reward looking around and engaging with the environment directly.
- **Build Diversity** — Melee, ranged, and magic are all viable combat paths, with hybrid builds encouraged.
- **Living World** — Towns with NPCs, shops, and quests; wilderness with roaming enemies scaled by region.
- **Progression Depth** — Layered attribute, skill, and equipment systems that reward investment.

### 1.3 Target Scope (Artifact Constraints)

Because development takes place inside a single-file Three.js artifact, the design favors:

- Procedurally generated or low-poly geometry (no imported 3D models).
- Data-driven systems (JSON-like config objects for items, enemies, quests).
- Modular implementation — each major system can be built and tested independently before integration.

---

## 2. World Design

### 2.1 World Structure

The world is a continuous open map divided into named regions. Each region has a suggested level range that determines enemy difficulty and loot quality.

| Region | Level Range | Biome | Key Location |
|---|---|---|---|
| Greenvale | 1–5 | Temperate fields, farms | Millhaven (starter town) |
| Thornwood | 4–10 | Dense forest, rivers | Briarwatch (lumber town) |
| Ashfeld | 8–15 | Volcanic foothills, ruins | Cinderhearth (forge city) |
| Frostveil | 12–20 | Snow peaks, frozen lakes | Winterhold Keep (mountain fortress) |
| The Blight | 18–25 | Corrupted wasteland | Duskspire (final city / end-game hub) |

### 2.2 Towns and Cities (3–5)

Each town contains:

- **Inn / Rest Point** — Restore health, stamina, magic. Acts as a save/respawn anchor.
- **General Merchant** — Buys and sells common goods, potions, materials.
- **Specialist Vendor(s)** — Blacksmith (weapons/armor), Alchemist (potions/reagents), Enchanter (magic scrolls/staves).
- **Quest Givers** — Named NPCs with quest dialogue. Some offer main story quests, others offer side quests.
- **Notice Board** — Procedural side quests (bounties, fetch, escort) for repeatable content.
- **Unique Feature** — Each town has one distinguishing element (e.g., Cinderhearth has a master forge for crafting legendary gear; Winterhold Keep has a mage academy).

### 2.3 Wilderness and Dungeons

Between towns, the wilderness contains:

- **Enemy spawn zones** — Defined areas tied to enemy type and level.
- **Points of interest** — Abandoned camps, shrines, caves, ruins with loot chests and optional mini-bosses.
- **Dungeons** — Enclosed multi-room areas with tougher enemies and a boss encounter. 1–2 per region.
- **Resource nodes** — Herbs, ore deposits, and other gathering points for crafting materials.

### 2.4 Map System

- An in-game world map accessible via a key/button.
- The map reveals as the player explores (fog-of-war style).
- Icons for discovered towns, dungeons, points of interest, and the current quest objective.
- Player position indicator and cardinal directions.
- Fast travel between discovered inns after first visit.

---

## 3. Character System

### 3.1 Character Creation

At game start the player selects:

- **Name** — Free text input.
- **Race** (cosmetic + minor passive bonus):
  - Human — +5% experience gain.
  - Elf — +10% magic regeneration.
  - Dwarf — +10% stamina regeneration.
  - Orc — +10% melee damage.
- **Starting Class** (determines initial attribute spread and starter gear, does not lock future progression):
  - Warrior — High Strength/Endurance, starts with sword and shield.
  - Ranger — High Agility/Perception, starts with bow and leather armor.
  - Mage — High Intelligence/Willpower, starts with staff and two starter spells.
  - Wanderer — Balanced attributes, starts with a dagger and basic supplies. (Default / "no class" option.)

### 3.2 Primary Attributes

These are the three player-visible resource bars:

| Attribute | Function | Base Value | Regeneration |
|---|---|---|---|
| **Health (HP)** | Damage taken reduces HP. Reaching 0 = death. | 100 | Slow passive regen out of combat; potions; resting. |
| **Stamina (SP)** | Spent on melee attacks, blocking, sprinting, dodging. | 100 | Moderate passive regen; pauses briefly after depletion. |
| **Magic (MP)** | Spent on casting spells. | 100 | Slow passive regen; meditation (stand still for faster regen); potions. |

### 3.3 Core Stats

Leveling grants stat points the player distributes freely. Stats influence derived values.

| Stat | Effect |
|---|---|
| **Strength** | Melee damage, carry weight, heavy weapon effectiveness. |
| **Agility** | Movement speed, dodge effectiveness, ranged weapon draw speed. |
| **Endurance** | Max stamina, stamina regen rate, physical damage resistance. |
| **Intelligence** | Max magic, spell damage, spell duration. |
| **Willpower** | Magic regen rate, magic resistance, crowd-control resistance. |
| **Perception** | Ranged accuracy, critical hit chance, enemy detection range. |

**Leveling formula:** Each level grants 5 stat points. Leveling requires cumulative XP thresholds (e.g., Level 2 = 100 XP, Level 3 = 250 XP, scaling curve).

### 3.4 Derived Stats

Calculated from core stats and equipment:

- **Physical Armor** — Reduces incoming physical damage. From gear + Endurance bonus.
- **Magic Resist** — Reduces incoming spell damage. From gear + Willpower bonus.
- **Critical Chance** — Base 5% + Perception scaling.
- **Critical Damage** — Base 150% + weapon modifier.
- **Carry Capacity** — Base 50 + (Strength × 5). Exceeding slows movement.
- **Movement Speed** — Base value modified by Agility and encumbrance.

---

## 4. Skill System

### 4.1 Skill Categories

Skills level up through use (not point allocation). Performing actions associated with a skill grants skill XP toward the next rank.

**Combat Skills:**

| Skill | Leveled By | Effect of Leveling |
|---|---|---|
| One-Handed Weapons | Hitting enemies with one-handed weapons | Increased damage, unlock combos. |
| Two-Handed Weapons | Hitting enemies with two-handed weapons | Increased damage, faster swing, unlock power attacks. |
| Dual Wield | Hitting enemies while dual wielding | Reduced dual-wield penalty, unlock flurry attacks. |
| Ranged Weapons (Bows) | Landing bow shots | Increased damage, draw speed, unlock aimed shot. |
| Ranged Weapons (Crossbows) | Landing crossbow shots | Increased damage, reload speed, unlock piercing bolt. |
| Block / Shield | Blocking incoming attacks | Reduced stamina cost, unlock shield bash, parry window. |

**Magic Skills:**

| Skill | Leveled By | Effect of Leveling |
|---|---|---|
| Combat Magic (Destruction) | Dealing spell damage | Stronger spells, reduced MP cost, unlock higher-tier spells. |
| Restoration Magic | Healing self or allies | Stronger heals, unlock ward spells, passive HP regen buff. |
| Alteration Magic | Using buff/utility spells | Longer durations, unlock new buffs (night vision, waterwalking, etc.). |

**Survival Skills:**

| Skill | Leveled By | Effect of Leveling |
|---|---|---|
| Heavy Armor | Taking hits while wearing heavy armor | Reduced movement penalty, increased armor value. |
| Light Armor | Taking hits while wearing light armor | Increased dodge chance, armor value. |
| Alchemy | Crafting potions | Stronger potions, discover new recipes, chance for bonus potions. |
| Smithing | Crafting/upgrading weapons and armor at a forge | Unlock higher-tier crafting, improve upgrade quality. |
| Speechcraft | Completing dialogue checks | Better shop prices, unlock persuasion dialogue options. |

### 4.2 Skill Ranks

Each skill has ranks from 1–100. Milestone ranks unlock perks:

- **Rank 25** — First perk unlock (e.g., One-Handed Rank 25: "Quick Slash" combo).
- **Rank 50** — Second perk unlock (e.g., Heavy Armor Rank 50: "Fortress" reduces stagger).
- **Rank 75** — Third perk unlock.
- **Rank 100** — Mastery perk (powerful passive or ability).

---

## 5. Combat System

### 5.1 General Model

Real-time first-person action combat. The player sees their own hands and equipped items at all times via viewmodels rendered in the lower portion of the screen. The left and right hands correspond directly to the left and right mouse buttons. Combat feedback is communicated through screen effects (hit flash, directional damage indicators, camera shake on heavy impacts) and visible weapon/spell animations in the player's hands.

### 5.2 Melee Combat

**One-Handed:**
- Light attack (low stamina cost, fast).
- Heavy attack / Power attack (high stamina cost, slow, high damage, can stagger).
- Off-hand can hold: shield (block), second weapon (dual wield), spell, or torch.

**Two-Handed:**
- Occupies both hand slots.
- Light attack has wider arc.
- Heavy attack has long wind-up but massive damage and knockback.
- No off-hand option while wielding.

**Dual Wield:**
- Each hand holds a one-handed weapon.
- Alternating light attacks; combined power strike (both weapons).
- Cannot block; relies on dodging.
- Slight damage penalty per hand until Dual Wield skill increases.

**Blocking and Dodging:**
- Shield block: Hold block to absorb damage (costs stamina per hit absorbed). Timed block = parry (stagger enemy, open for counterattack).
- Dodge roll: Costs stamina, brief invincibility window. Effectiveness scales with Agility.

### 5.3 Ranged Combat

**Bows:**
- Hold to draw, release to fire. Longer draw = more damage.
- Ammunition: arrows (crafted or purchased). Different arrow types (standard, fire, poison) as the player progresses.
- Aiming uses a first-person reticle that tightens as the bow is fully drawn. Optional zoom/focus effect on full draw for precision shots.

**Crossbows:**
- Click to fire instantly. Must reload between shots (brief animation).
- Higher base damage than bows, slower fire rate.
- Bolt types similar to arrow types.

**Ammunition Management:**
- Arrows/bolts are inventory items with weight.
- Retrievable from fallen enemies (percentage chance).

### 5.4 Magic Combat

**Hand Assignment:**
- Each hand can be assigned one spell from the Magic Menu.
- The player's hands are always visible on screen. When a spell is equipped, the corresponding hand glows with the spell's element (orange for fire, blue for frost, white for lightning, green for restoration, etc.).
- Spells are cast from the assigned hand using the corresponding attack button (LMB for left hand, RMB for right hand).
- Both hands can hold the same spell for a "dual cast" — the player brings both hands together at center screen for increased power at increased MP cost.

**Spell Schools and Examples:**

*Destruction:*
- Firebolt — Projectile, fire damage.
- Frost Shard — Projectile, frost damage + slow.
- Lightning Arc — Short-range beam, shock damage + stamina drain.
- Flame Cloak — AoE aura, damages nearby enemies.

*Restoration:*
- Heal — Restore HP over time.
- Ward — Absorb incoming spell damage.
- Turn Undead — Fear effect on undead enemies.

*Alteration:*
- Mage Armor — Increase physical armor temporarily.
- Candlelight — Summon a floating light.
- Telekinesis — Move objects at range.

**Spell Acquisition:**
- Starter spells from character creation (Mage class).
- Purchase spell tomes from Enchanters in towns.
- Find spell tomes in dungeon loot.
- Quest rewards.

### 5.5 Damage Calculation

```
Base Damage = Weapon Damage + (Relevant Stat × Scaling Factor)
Modified Damage = Base Damage × Skill Multiplier
Final Damage = Modified Damage − Target Armor (minimum 1)
Critical Hit = Final Damage × Crit Multiplier (if crit roll succeeds)
```

### 5.6 Death and Respawn

- On death, the camera tilts and falls to the ground with a brief red-out and fade-to-black effect.
- A "You Died" screen appears with options: respawn at last inn or load a save.
- On respawn, the player reappears at the last inn rested at.
- No experience loss. Inventory is retained.
- Enemies in the area reset to full health.

---

## 6. Inventory System

### 6.1 Structure

Grid or list-based inventory. Items have weight; total carry weight is limited by Carry Capacity.

### 6.2 Item Categories

| Category | Examples | Equippable? |
|---|---|---|
| Weapons | Swords, axes, maces, daggers, bows, crossbows, staves | Yes (hand slots) |
| Armor | Helmets, chest, gauntlets, boots, shields | Yes (armor slots) |
| Potions | Health potion, stamina potion, magic potion, buff potions | No (quick-use from hotbar) |
| Ammunition | Arrows, bolts (various types) | Auto-consumed on ranged attack |
| Spell Tomes | Single-use items that teach a spell permanently | No (consumed on use) |
| Quest Items | Keys, letters, artifacts | No (cannot be dropped) |
| Materials | Ore, herbs, leather, gems | No (used in crafting) |
| Miscellaneous | Loot for selling (goblets, gems, trinkets) | No |

### 6.3 Equipment Slots

- Head
- Chest
- Hands
- Feet
- Left Hand (weapon / shield / spell)
- Right Hand (weapon / spell)
- Amulet (accessory — passive bonus)
- Ring × 2 (accessory — passive bonuses)

### 6.4 Item Rarity Tiers

| Tier | Color Code | Drop Source |
|---|---|---|
| Common | White | Vendors, basic enemies, world loot |
| Uncommon | Green | Tougher enemies, dungeon chests |
| Rare | Blue | Mini-bosses, quest rewards |
| Epic | Purple | Dungeon bosses, major quest rewards |
| Legendary | Gold | Unique quests, master crafting, hidden locations |

### 6.5 Item Tooltips

Each item displays: name, rarity, item type, damage/armor value, weight, stat requirements (if any), special effects, gold value.

---

## 7. Quest System

### 7.1 Quest Types

**Main Story Quests:**
- A linear chain of ~10–15 quests that drive the central narrative.
- Span all five regions, escalating in difficulty.
- Final quest is the climactic confrontation.

**Side Quests:**
- 3–5 unique side quests per town, given by named NPCs.
- May involve dungeon crawling, item retrieval, NPC escort, dialogue choices, or boss fights.
- Some have branching outcomes affecting NPC disposition or town state.

**Notice Board Bounties:**
- Repeatable, procedurally configured tasks: kill X enemies in a region, gather X materials, clear a dungeon.
- Reward gold and XP.

### 7.2 Quest Journal

Accessible via a key/button. Contains:

- **Active Quests** — List of accepted quests with descriptions, objectives, and progress.
- **Set Active Quest** — The player marks one quest as "tracked." Its objective appears on the HUD and the map.
- **Completed Quests** — Archive of finished quests with outcome notes.
- **Quest Detail View** — Full description, objective checklist, reward preview, NPC involved, recommended level.

### 7.3 Quest Flow

1. Player speaks to NPC or reads notice board.
2. Quest details presented in dialogue; player accepts or declines.
3. Quest appears in journal; objectives tracked.
4. On completion, player returns to NPC (or auto-completes for bounties).
5. Rewards granted (XP, gold, items).

---

## 8. NPC and Dialogue System

### 8.1 NPC Types

- **Quest Givers** — Marked with indicator icon. Initiate dialogue trees.
- **Merchants** — Open a buy/sell shop interface.
- **Trainers** — Pay gold to boost a skill (limited per trainer per level bracket).
- **Ambient NPCs** — Provide world flavor. Short barks or one-line dialogues.
- **Companions** (stretch goal) — Recruitable NPCs that follow and fight alongside the player.

### 8.2 Dialogue Structure

First-person dialogue interaction:
- On pressing interact while looking at an NPC, the camera smoothly zooms toward the NPC's face. The NPC turns to face the player and makes eye contact.
- NPC dialogue text appears in a panel at the bottom of the screen. The NPC can have idle animations (gestures, shifting weight) visible above the dialogue panel.
- Player sees 2–4 response options below the NPC's text.
- Some options gated by Speechcraft skill level (shown with a lock icon and required rank).
- Choices can affect quest outcomes, vendor prices, or NPC reactions.
- Exiting dialogue smoothly returns the camera to normal first-person view.

---

## 9. Enemy System

### 9.1 Enemy Types

| Category | Examples | Behavior |
|---|---|---|
| Beasts | Wolves, bears, spiders, boars | Patrol or idle, aggro on proximity, basic melee. |
| Undead | Skeletons, wraiths, draugr | Found in ruins/dungeons, weak to fire and restoration. |
| Humanoid | Bandits, rogue mages, cultists | Use weapons and spells, may block or dodge. |
| Monsters | Trolls, ogres, wyverns | High HP, heavy attacks, special abilities. |
| Bosses | Named unique enemies per dungeon | Multi-phase, unique mechanics, valuable loot. |

### 9.2 Spawn System

- Each region has defined spawn zones (coordinate areas on the map).
- Spawn zones specify: enemy type, level range, max concurrent enemies, respawn timer.
- Enemies do not leave their spawn zone (leash range).
- Difficulty scales naturally: the player entering a high-level zone encounters appropriately tough foes.

### 9.3 Enemy AI Behavior

Basic state machine per enemy:

- **Idle** — Standing, patrolling a short path.
- **Alert** — Player detected within perception range. Turns toward player.
- **Pursue** — Moves toward player. Ranged enemies stop at range and attack.
- **Attack** — Executes attack pattern (melee swing, ranged projectile, spell cast). Cooldown between attacks.
- **Flee** — Low-health enemies (bandits) may attempt to run.
- **Leash** — If player moves too far from spawn zone, enemy resets.

### 9.4 Loot Tables

Each enemy type has a loot table: guaranteed drops (e.g., wolf pelt from wolves) and weighted random drops (gold, potions, equipment based on rarity tiers and enemy level).

---

## 10. Crafting System

### 10.1 Alchemy

- Combine 2–3 reagents (herbs, monster parts) at an Alchemy Table (found in towns and some wilderness camps).
- Recipes discovered by experimentation or by purchasing recipe scrolls.
- Output: Health potions, stamina potions, magic potions, poisons (apply to weapons), buff elixirs.

### 10.2 Smithing

- Requires a Forge (found in towns, primarily Cinderhearth).
- **Craft** — Combine materials (ingots, leather, gems) into weapons or armor. Recipes unlocked by Smithing skill rank.
- **Upgrade** — Improve an existing weapon or armor piece, increasing its damage/armor value. Requires materials and sufficient Smithing rank.

### 10.3 Enchanting (Stretch Goal)

- Apply magical effects to weapons/armor at an Enchanting Table.
- Requires a filled soul gem (dropped from magical enemies) and knowledge of the enchantment.
- Examples: Fire damage on a sword, magic resist on a helmet, stamina regen on boots.

---

## 11. Economy

### 11.1 Currency

Gold is the universal currency. Earned from: enemy drops, quest rewards, selling items to vendors, looting chests and containers.

### 11.2 Vendors

- Each vendor has a gold reserve. If the player sells more than the vendor can afford, the transaction is limited.
- Vendor gold replenishes over time (or on rest).
- Buy prices are higher than sell prices (standard markup). Speechcraft skill reduces the gap.
- Specialist vendors stock items relevant to their type and the town's level range.

### 11.3 Economic Balance Targets

| Milestone | Approximate Gold |
|---|---|
| Basic health potion | 25 |
| Starter weapon upgrade | 100 |
| Mid-tier armor set | 500 |
| High-tier weapon | 1,500 |
| Legendary item | 5,000+ |

---

## 12. User Interface and HUD

### 12.1 First-Person Viewport

The majority of the screen is the unobstructed 3D world seen through the player's eyes. HUD elements are kept minimal and pushed to screen edges to preserve immersion.

**Viewmodel Layer (Always Rendered on Top of World):**
- The player's hands and currently equipped items are rendered as viewmodels in the lower portion of the screen, in front of all world geometry.
- Left hand visible bottom-left; right hand visible bottom-right.
- Viewmodels animate for attacks, blocking, casting, drawing a bow, idle sway, and sprinting bob.
- When no weapon is equipped, bare hands are shown. Spell-equipped hands glow with the spell's element color.
- Weapons and shields are visible as distinct low-poly models (sword blade, axe head, shield face, bow limbs, staff).

**Screen Effects:**
- **Damage indicator** — Directional red vignette flash from the direction of incoming damage.
- **Low health** — Pulsing red border and desaturated vision.
- **Stamina depleted** — Brief blur and heavy breathing sound.
- **Healing** — Green particle shimmer at screen edges.
- **Camera shake** — On heavy hits taken or power attacks landed, scaled by impact.
- **Hit marker** — Small crosshair flash on successful attack landing.

### 12.2 HUD Elements (Always Visible)

- **Health bar** — Red, bottom-center-left.
- **Stamina bar** — Green, directly adjacent to health bar.
- **Magic bar** — Blue, directly adjacent to stamina bar.
- **Left hand icon** — Small icon bottom-left above the viewmodel showing equipped weapon/spell.
- **Right hand icon** — Small icon bottom-right above the viewmodel showing equipped weapon/spell.
- **Quick-use hotbar** — 1–4 slots centered at bottom, between the hand icons. For potions and consumables.
- **Compass bar** — Horizontal strip at top-center showing cardinal directions, nearby quest markers, enemy threat dots, and POI icons. Rotates with player view direction.
- **Active quest objective** — Small text below compass with distance to objective.
- **Crosshair** — Center screen. Static dot by default. Contextual prompts appear beneath it: "E — Talk," "E — Loot," "E — Open," "E — Read" when the player looks at interactable objects within range.
- **Stealth eye indicator** (stretch goal) — If stealth system is implemented, an eye icon near crosshair shows detection state.

### 12.3 First-Person Interaction Model

- **Interaction range:** ~2.5 meters from camera. Objects within range and near the center of view are highlighted with a subtle outline.
- **Loot containers:** Looking at a chest/body and pressing interact opens a transfer UI overlay (world still visible but blurred behind).
- **NPC dialogue:** Looking at an NPC and pressing interact zooms the camera slightly toward their face, dims the background, and opens the dialogue panel at the bottom of the screen.
- **Item pickup:** Small items on the ground can be grabbed with interact; a brief hand-reach animation plays on the viewmodel.
- **Reading:** Books, notes, and signs open a parchment overlay in front of the viewport.

### 12.4 Menus (Opened by Key/Button)

Menus pause or slow the game and render as overlay panels. The 3D world remains visible but blurred/dimmed behind the menu.

- **Inventory** — Grid/list of items, 3D equipment preview (a static character model shown wearing current gear), drag-and-drop equipping.
- **Character Sheet** — Attributes, stats, skill list with ranks and perks.
- **Magic Menu** — List of known spells by school. Select and assign to left or right hand. The hand icons update in real-time as the player makes assignments.
- **Quest Journal** — As described in Section 7.2.
- **World Map** — As described in Section 2.4.
- **Options / Settings** — Audio, controls, mouse sensitivity, FOV slider, display.

### 12.5 Menu Navigation

All menus accessible via a single "Menu" key that opens a tabbed interface, or via individual hotkeys per menu.

---

## 13. Progression and Leveling

### 13.1 Experience Sources

| Source | XP Awarded |
|---|---|
| Killing an enemy | Scales with enemy level relative to player. |
| Completing a quest | Fixed per quest (main quests > side quests > bounties). |
| Discovering a new location | Small bonus per POI, town, or dungeon. |
| Crafting an item for the first time | Small bonus. |

### 13.2 Level Curve

- **Max level:** 50.
- Each level grants: +5 stat points, +10 HP, +5 SP, +5 MP.
- XP required per level increases on a curve (e.g., `XP_needed = 100 × level^1.5`).

### 13.3 Difficulty Scaling

- Enemies do not scale to the player. Regions have fixed level ranges.
- The player is expected to progress through regions roughly in order, but is free to attempt high-level areas early at their own risk.
- Optional: a "New Game Plus" mode that resets quests but keeps character progression and scales all enemies up.

---

## 14. Audio and Atmosphere

### 14.1 Music (Tone.js)

- Ambient background tracks per biome type (pastoral, foreboding forest, volcanic, icy, corrupted).
- Combat music triggered on enemy aggro, fades back to ambient when combat ends.
- Town music — lighter, more melodic.
- Procedurally generated or looped synth compositions using Tone.js.

### 14.2 Sound Effects

- Weapon swing / impact sounds.
- Spell cast and impact.
- Footsteps (vary by terrain if feasible).
- UI sounds: menu open/close, item pickup, quest complete.
- Enemy alert and death sounds.

---

## 15. Save System

### 15.1 Save Mechanism

Because the artifact runs in-browser:

- **Manual Save** — Player triggers save, which serializes game state to the artifact's persistent storage API (`window.storage`).
- **Auto-save** — Triggers on entering a town, completing a quest, or resting at an inn.
- **Save data includes:** Player position, attributes, skills, inventory, quest states, discovered locations, world state flags.

### 15.2 Save Slots

Support 1–3 save slots so the player can maintain multiple playthroughs.

---

## 16. Technical Architecture (Three.js Artifact)

### 16.1 Rendering

- Three.js r128, WebGL renderer.
- Low-poly procedural geometry for terrain, buildings, and characters.
- Basic materials (MeshStandardMaterial) with color variation per biome.
- Simple lighting: directional sun + ambient. Optional point lights for torches and spells.
- Fog for distance culling and atmosphere.

### 16.2 First-Person Camera System

- **PerspectiveCamera** attached to the player entity at eye height (~1.7 units above ground).
- **Mouse look:** Pointer Lock API captures the mouse. Horizontal mouse movement rotates the player body (yaw). Vertical movement rotates the camera pitch, clamped to roughly ±85° to prevent over-rotation.
- **Field of view:** Default 75°, adjustable via options menu (60°–100° range).
- **Camera effects:** Subtle head bob while walking/sprinting (sinusoidal offset on Y-axis, intensity scales with speed). Slight camera tilt on strafing (optional). Smoothed transitions for all effects to avoid motion sickness.
- **Viewmodel rendering:** Player hands and weapons rendered using a separate scene or camera layer with a narrower near-clip plane, ensuring they always appear on top of world geometry and never clip into walls. Viewmodels have their own FOV (typically ~55°) independent of the world FOV, matching the convention of first-person games.
- **Collision:** Camera uses a capsule collider for player body. The camera cannot pass through walls or terrain. Step-up logic handles small ledges automatically.

### 16.3 World Streaming

- World divided into chunks/tiles.
- Only nearby chunks rendered (frustum culling + distance threshold). Because the player sees the world at eye level in first person, the visible horizon is naturally limited by terrain and fog, reducing the number of chunks that need to be rendered compared to a top-down view.
- Far chunks unloaded to manage performance.
- LOD (Level of Detail): Distant terrain and structures can use simplified geometry since the first-person perspective makes detail falloff less noticeable at range.

### 16.3 Data Architecture

All game data (items, enemies, quests, dialogue, spells) defined as JavaScript config objects / arrays at the top of the file. This allows easy tuning without code changes.

```
// Example structure (pseudocode)
const ITEMS = { sword_iron: { name: "Iron Sword", type: "weapon", ... }, ... }
const ENEMIES = { wolf: { name: "Wolf", hp: 40, damage: 8, ... }, ... }
const QUESTS = { main_01: { title: "A New Arrival", ... }, ... }
```

### 16.4 State Management

A single global `gameState` object holds all mutable state. All systems read from and write to this object. On save, this object is serialized to storage.

### 16.5 Implementation Phases

| Phase | Systems | Milestone |
|---|---|---|
| **1 — Foundation** | Renderer, first-person camera with pointer lock and mouse look, terrain, WASD movement, head bob, basic HUD | Walk around a world in first person and look freely |
| **2 — Viewmodels and Combat** | Hand/weapon viewmodels, melee attacks with animation, health/stamina bars, one enemy type, hit detection, damage indicators | See your sword in hand, fight a wolf, and survive |
| **3 — Inventory and Equipment** | Item data, inventory UI overlay, equip/unequip, viewmodel swaps, stat application | Equip a sword, see it in your hand, see damage change |
| **4 — World Building** | Multiple regions, towns (basic geometry), NPC interaction with dialogue zoom, interaction prompts | Visit two towns, walk up to an NPC, and have a conversation |
| **5 — Quest System** | Quest journal overlay, quest data, compass objective tracking, rewards | Accept and complete one quest using compass navigation |
| **6 — Magic** | Spell data, hand glow effects, spell casting VFX from hands, MP management, dual cast | See fire in your left hand, frost in your right, cast both |
| **7 — Ranged** | Bow/crossbow viewmodels, draw animation, projectile physics, reticle tightening | Draw a bow in first person, aim, and hit a target at range |
| **8 — Full Loop** | Crafting, shops, leveling, enemy variety, all regions, save system | Complete a 30-minute play session |
| **9 — Polish** | Audio, map, FOV/sensitivity options, difficulty tuning, bug fixing, UI polish | Shippable vertical slice |

---

## 17. Controls

### 17.1 Keyboard and Mouse (Default)

The game uses the Pointer Lock API to capture the mouse cursor. On first click or pressing a "Start" button, the cursor is locked and hidden. Pressing Escape releases the cursor and opens the pause menu.

| Action | Binding |
|---|---|
| Move forward / left / back / right | W / A / S / D |
| Look (aim) | Mouse movement (pointer locked) |
| Left hand action (attack / cast) | Left Mouse Button |
| Right hand action (attack / cast / block) | Right Mouse Button |
| Jump | Space |
| Dodge / Roll | Double-tap movement direction |
| Sprint | Hold Left Shift |
| Block (if shield equipped) | Right Mouse Button (contextual) |
| Interact / pick up / talk | E |
| Inventory | I or Tab |
| Quest Journal | J |
| Map | M |
| Magic Menu | K |
| Character Sheet | C |
| Quick-use Slots | 1, 2, 3, 4 |
| Toggle crouch | Left Ctrl |
| Pause / Options / Release cursor | Escape |

**Mouse Sensitivity:** Adjustable in options. Default tuned so a full mousepad sweep ≈ 360° horizontal turn.

### 17.2 Touch Controls (Mobile Stretch Goal)

Virtual joystick for movement, touch buttons for actions, swipe for camera.

---

## 18. Narrative Outline

### 18.1 Setting

The kingdom of Aethermoor was once prosperous, protected by the Aether Pillars — ancient monoliths that channel the world's magical energy. One by one, the Pillars have gone dark, and with each failure, a creeping corruption known as the Blight spreads. Monsters grow bolder, the dead rise, and the kingdom fractures.

### 18.2 Main Quest Arc (Summary)

1. **Act I (Greenvale / Millhaven):** The player arrives as a stranger, helps the town with local threats, and learns about the failing Pillars.
2. **Act II (Thornwood / Briarwatch → Ashfeld / Cinderhearth):** The player investigates the cause, discovers a cult working to destroy the Pillars, and gathers allies.
3. **Act III (Frostveil / Winterhold Keep):** The player reaches the last standing Pillar, defends it, and learns the location of the cult's stronghold.
4. **Act IV (The Blight / Duskspire):** The player enters the corrupted wasteland, confronts the cult leader (or the entity they serve), and restores or destroys the Pillars (player choice with different endings).

### 18.3 Side Quest Themes

- Town defense against enemy waves.
- NPC personal stories (lost family, stolen heirloom, revenge).
- Dungeon exploration and artifact recovery.
- Moral dilemmas (help a bandit reform or turn them in; side with rival factions).
- Lore collection (books, inscriptions that flesh out world history).

---

## 19. Stretch Goals and Future Features

These are desirable but not required for the initial build:

- **Companion system** — Recruit an NPC ally who follows and fights.
- **Enchanting** — Add magical properties to gear.
- **Housing** — Purchase and furnish a home in a town.
- **Fishing / cooking** — Additional crafting tree for food buffs.
- **Day/night cycle** — Affects lighting, enemy spawns, NPC schedules.
- **Weather effects** — Rain, snow, fog with gameplay impact (fire spells less effective in rain).
- **Stealth system** — Sneak, backstab, pickpocket.
- **Reputation system** — Per-town reputation affecting prices and quest availability.
- **Mounted travel** — Horses for faster overworld traversal.
- **PvE arena** — Wave-based survival challenge in Cinderhearth for leaderboard rewards.

---

## 20. Glossary

| Term | Definition |
|---|---|
| Aethermoor | The game world / kingdom. |
| Blight | The corruption spreading across the land. |
| Aether Pillars | Ancient monoliths that stabilize the world's magic. |
| Leash range | Maximum distance an enemy will chase before resetting. |
| Dual cast | Assigning the same spell to both hands for a powered-up version. |
| POI | Point of Interest — a discoverable location on the map. |
| Artifact | The Three.js/React file in which the game runs. |
| Viewmodel | The 3D model of the player's hands and equipped items rendered in first-person view. |
| Pointer Lock | Browser API that captures the mouse cursor for seamless first-person mouse look. |
| Head bob | Subtle vertical camera oscillation while walking/sprinting to simulate natural movement. |
| Near-clip plane | The minimum render distance from the camera; viewmodels use a separate value to prevent clipping. |

---

*This is a living document. Update as systems are implemented and designs are iterated.*
