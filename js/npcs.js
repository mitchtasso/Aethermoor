'use strict';

// ── NPC Data ────────────────────────────────────────────────────────────────

const NPC_DATA = {

  // ── Millhaven NPCs ──────────────────────────────────────────────────────
  innkeeper_millhaven: {
    name: 'Marta',
    title: 'Innkeeper',
    role: 'innkeeper',
    position: [0, -52],       // near inn entrance
    facing: Math.PI,           // faces south (toward player approach)
    bodyColor: 0x8b5e3c,
    shirtColor: 0xc4a882,
    dialogue: {
      greeting: "Welcome, traveler. You look like you've walked a long road. Rest here if you need — it's safe within these walls. For now.",
      options: [
        { text: "Rest here (restore HP/SP/MP)", action: 'rest' },
        { text: "What's happening in Aethermoor?", next: 'lore' },
        { text: "Farewell.", action: 'close' },
      ],
      lore: {
        text: "The Blight creeps closer every day. The Aether Pillar in Greenvale still holds, but Thornwood's gone dark. Briarwatch is barely hanging on. If you're heading that way... be careful.",
        options: [
          { text: "Where is Thornwood?", next: 'thornwood_dir' },
          { text: "I'll be careful. Farewell.", action: 'close' },
        ],
      },
      thornwood_dir: {
        text: "Follow the road east from here. You'll see the forest thicken — that's Thornwood. Briarwatch is at its heart. Watch for wolves on the road... they've been bolder lately.",
        options: [
          { text: "Thanks. Farewell.", action: 'close' },
        ],
      },
    },
  },

  blacksmith_millhaven: {
    name: 'Garin',
    title: 'Blacksmith',
    role: 'merchant',
    position: [13, -49],       // near smithy
    facing: -Math.PI / 2,
    bodyColor: 0x6b4226,
    shirtColor: 0x555555,
    shopItems: ['sword_iron', 'sword_steel', 'axe_iron', 'dagger_iron', 'shield_wood', 'shield_iron',
                'helm_iron', 'chest_iron', 'gauntlets_leather', 'boots_leather',
                'bow_short', 'crossbow_light'],
    dialogue: {
      greeting: "Need steel? I forge the best blades in Greenvale — not that there's much competition out here.",
      options: [
        { text: "Show me your wares.", action: 'shop' },
        { text: "Just looking. Farewell.", action: 'close' },
      ],
    },
  },

  merchant_millhaven: {
    name: 'Elda',
    title: 'General Merchant',
    role: 'merchant',
    position: [-12, -54],      // near general store
    facing: Math.PI / 2,
    bodyColor: 0xa0785a,
    shirtColor: 0x6a8a50,
    shopItems: ['potion_health', 'potion_stamina', 'potion_magic', 'herb_healwort', 'iron_ore',
                'tome_firebolt', 'tome_frost_shard', 'tome_lightning', 'tome_heal', 'tome_mage_armor', 'tome_candlelight',
                'arrow', 'bolt', 'feather'],
    dialogue: {
      greeting: "Potions, herbs, supplies — I've got what you need to survive out there.",
      options: [
        { text: "Let me see what you have.", action: 'shop' },
        { text: "Not right now. Farewell.", action: 'close' },
      ],
    },
  },

  guard_millhaven: {
    name: 'Captain Aldric',
    title: 'Town Guard',
    role: 'questgiver',
    position: [0, -72],        // near town entrance
    facing: Math.PI,
    bodyColor: 0x7a6050,
    shirtColor: 0x445566,
    dialogue: {
      greeting: "Halt, traveler. Millhaven doesn't get many visitors these days. The wolves have been terrorizing the farms, and we're short-handed. You look capable enough.",
      options: [
        { text: "I can help with the wolves.", next: 'wolf_quest' },
        { text: "Just passing through.", action: 'close' },
      ],
      wolf_quest: {
        text: "Good. Kill four wolves in the fields around town and I'll make it worth your while. Here — take this health potion. You'll need it.",
        options: [
          { text: "Consider it done.", action: 'accept_wolf_quest' },
          { text: "Maybe later.", action: 'close' },
        ],
      },
    },
  },

  // ── Briarwatch NPCs ────────────────────────────────────────────────────
  innkeeper_briarwatch: {
    name: 'Oswin',
    title: 'Innkeeper',
    role: 'innkeeper',
    position: [180, -50],
    facing: Math.PI,
    bodyColor: 0x6b5040,
    shirtColor: 0x8b7860,
    dialogue: {
      greeting: "You made it through the forest? That takes guts — or ignorance. Either way, welcome to Briarwatch. Rest your bones.",
      options: [
        { text: "Rest here (restore HP/SP/MP)", action: 'rest' },
        { text: "Tell me about Briarwatch.", next: 'about' },
        { text: "Farewell.", action: 'close' },
      ],
      about: {
        text: "We're a lumber town — or we were. The Blight's poisoned the eastern woods. Half the loggers have fled, and the ones who stayed hear things in the trees at night.",
        options: [
          { text: "What kind of things?", next: 'creatures' },
          { text: "I see. Farewell.", action: 'close' },
        ],
      },
      creatures: {
        text: "Skeletons. The dead, walking. They started appearing when the Pillar went dark. There's a ruin deeper in Thornwood... people say that's where they come from.",
        options: [
          { text: "I'll look into it.", action: 'close' },
        ],
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CINDERHEARTH (Ashfeld) — forge city in volcanic foothills
  // ═══════════════════════════════════════════════════════════════════════════

  innkeeper_cinderhearth: {
    name: 'Brenna',
    title: 'Innkeeper',
    role: 'innkeeper',
    position: [50, 200],
    facing: Math.PI,
    bodyColor: 0x8a5030,
    shirtColor: 0xaa4422,
    dialogue: {
      greeting: "Welcome to Cinderhearth, traveler. The air's thick with ash, but the ale's thicker. Rest here — the fires never go out.",
      options: [
        { text: "Rest here (restore HP/SP/MP)", action: 'rest' },
        { text: "What is this place?", next: 'about' },
        { text: "Farewell.", action: 'close' },
      ],
      about: {
        text: "Cinderhearth sits on the edge of the Ashfeld volcanic fields. The master forge draws smiths from across Aethermoor — the volcanic heat makes for the finest steel. But the fire imps and golems make travel dangerous.",
        options: [
          { text: "Tell me about the dangers.", next: 'dangers' },
          { text: "Farewell.", action: 'close' },
        ],
      },
      dangers: {
        text: "Fire Imps swarm the southern hills — quick little devils that throw flame. And the Magma Golems... they're living rock, molten inside. Don't pick a fight with one unless you're well-armed.",
        options: [
          { text: "I'll watch my step. Farewell.", action: 'close' },
        ],
      },
    },
  },

  forgemaster_cinderhearth: {
    name: 'Varn',
    title: 'Forgemaster',
    role: 'merchant',
    position: [62, 196],
    facing: -Math.PI / 2,
    bodyColor: 0x5a3010,
    shirtColor: 0x444444,
    shopItems: ['sword_volcanic', 'chest_volcanic', 'sword_steel', 'axe_iron', 'shield_iron',
                'helm_iron', 'chest_iron', 'gauntlets_leather', 'boots_leather',
                'bow_long', 'arrow', 'arrow_fire'],
    dialogue: {
      greeting: "The master forge of Cinderhearth can shape metal no other furnace can touch. Volcanic steel, obsidian-edged blades — you won't find finer work anywhere.",
      options: [
        { text: "Show me your wares.", action: 'shop' },
        { text: "I hear you need molten cores.", next: 'golem_quest' },
        { text: "Impressive. Farewell.", action: 'close' },
      ],
      golem_quest: {
        text: "Aye! The master forge runs on magma golem cores — nothing else burns hot enough. Bring me 3 cores from the deep fields and I'll reward you with my finest blade.",
        options: [
          { text: "I'll hunt the golems.", action: 'accept_ashfeld_golem' },
          { text: "Not right now.", action: 'close' },
        ],
      },
    },
  },

  merchant_cinderhearth: {
    name: 'Sera',
    title: 'Alchemist',
    role: 'merchant',
    position: [38, 204],
    facing: Math.PI / 2,
    bodyColor: 0xa07050,
    shirtColor: 0x884422,
    shopItems: ['potion_health', 'potion_stamina', 'potion_magic', 'herb_healwort',
                'tome_firebolt', 'tome_heal', 'arrow', 'arrow_fire', 'feather'],
    dialogue: {
      greeting: "Potions, tonics, flame-ward salves — if the heat doesn't kill you, dehydration will. Stock up.",
      options: [
        { text: "Let me see what you have.", action: 'shop' },
        { text: "Not right now. Farewell.", action: 'close' },
      ],
    },
  },

  guard_cinderhearth: {
    name: 'Captain Rolf',
    title: 'Cinderhearth Guard',
    role: 'questgiver',
    position: [50, 225],
    facing: Math.PI,
    bodyColor: 0x6a4030,
    shirtColor: 0x553322,
    dialogue: {
      greeting: "Another adventurer? Good. The fire imps have been raiding our supply lines from the south. We can't keep the forge running without ore shipments.",
      options: [
        { text: "I can deal with the imps.", next: 'imp_quest' },
        { text: "What about the golems?", next: 'golem_info' },
        { text: "Just passing through.", action: 'close' },
      ],
      imp_quest: {
        text: "Kill six fire imps in the Ashfeld foothills. That should thin them out enough to get the caravans moving again. I'll pay well for the trouble.",
        options: [
          { text: "Consider it done.", action: 'accept_ashfeld_imps' },
          { text: "Maybe later.", action: 'close' },
        ],
      },
      golem_info: {
        text: "The Magma Golems are ancient — they've wandered these volcanic fields since before Cinderhearth was built. Powerful, but slow. A strong warrior can take one down, and their molten cores are worth a fortune.",
        options: [
          { text: "I can deal with the imps too.", next: 'imp_quest' },
          { text: "Good to know. Farewell.", action: 'close' },
        ],
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // WINTERHOLD KEEP (Frostveil) — mountain fortress + mage academy
  // ═══════════════════════════════════════════════════════════════════════════

  innkeeper_winterhold: {
    name: 'Helga',
    title: 'Innkeeper',
    role: 'innkeeper',
    position: [-180, -220],
    facing: Math.PI,
    bodyColor: 0x7a6558,
    shirtColor: 0x556688,
    dialogue: {
      greeting: "You've climbed all the way up to Winterhold? The cold must not bother you. Warm yourself by the fire — you've earned it.",
      options: [
        { text: "Rest here (restore HP/SP/MP)", action: 'rest' },
        { text: "Tell me about Winterhold.", next: 'about' },
        { text: "The frost wolves are a problem?", next: 'wolf_quest' },
        { text: "Farewell.", action: 'close' },
      ],
      wolf_quest: {
        text: "Aye, they circle closer every night. Six of them at least have been spotted near the keep. Kill them and I'll make sure you're properly rewarded.",
        options: [
          { text: "I'll handle it.", action: 'accept_frostveil_wolves' },
          { text: "Not yet.", action: 'close' },
        ],
      },
      about: {
        text: "Winterhold Keep was built as a fortress against the northern storms. The Arcane Academy moved in decades ago — mages come to study where magic flows strongest. But the frost wolves and wraiths make the journey treacherous.",
        options: [
          { text: "An arcane academy?", next: 'academy' },
          { text: "Farewell.", action: 'close' },
        ],
      },
      academy: {
        text: "Archmage Lyris runs it. She's always looking for capable people to help with the wraith problem. The ice wraiths have been growing bolder — they're drawn to the magical energy here.",
        options: [
          { text: "I'll speak to her. Farewell.", action: 'close' },
        ],
      },
    },
  },

  archmage_winterhold: {
    name: 'Archmage Lyris',
    title: 'Arcane Academy',
    role: 'questgiver',
    position: [-192, -216],
    facing: 0,
    bodyColor: 0x7a6a7a,
    shirtColor: 0x334488,
    dialogue: {
      greeting: "Ah, a traveler with the look of someone who can handle themselves. The ice wraiths threaten our research. Their essence disrupts the ley lines we study.",
      options: [
        { text: "I can help with the wraiths.", next: 'wraith_quest' },
        { text: "Tell me about the ley lines.", next: 'ley_lines' },
        { text: "Farewell.", action: 'close' },
      ],
      wraith_quest: {
        text: "Destroy five ice wraiths in the Frostveil peaks. Bring calm to the ley lines, and I'll share some of the academy's finest spellwork with you.",
        options: [
          { text: "I'll handle it.", action: 'accept_frostveil_wraiths' },
          { text: "Not yet.", action: 'close' },
        ],
      },
      ley_lines: {
        text: "Ley lines are currents of raw magic that flow through the earth. Here in Frostveil, they run close to the surface — it's why mages built the academy here. But the wraiths feed on the same energy.",
        options: [
          { text: "I can help with the wraiths.", next: 'wraith_quest' },
          { text: "Fascinating. Farewell.", action: 'close' },
        ],
      },
    },
  },

  merchant_winterhold: {
    name: 'Thorin',
    title: 'Spell Merchant',
    role: 'merchant',
    position: [-172, -224],
    facing: Math.PI / 2,
    bodyColor: 0x6a5a50,
    shirtColor: 0x445577,
    shopItems: ['staff_frost', 'helm_frost', 'tome_frost_shard', 'tome_lightning', 'tome_mage_armor',
                'tome_candlelight', 'potion_magic', 'potion_health',
                'bow_frost', 'arrow_frost', 'arrow'],
    dialogue: {
      greeting: "The academy's surplus is your gain. Staves, tomes, frost-forged armor — everything a mage-warrior needs in these frozen peaks.",
      options: [
        { text: "Show me your wares.", action: 'shop' },
        { text: "Not right now. Farewell.", action: 'close' },
      ],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // DUSKSPIRE (The Blight) — end-game hub
  // ═══════════════════════════════════════════════════════════════════════════

  innkeeper_duskspire: {
    name: 'Mordren',
    title: 'Innkeeper',
    role: 'innkeeper',
    position: [400, -60],
    facing: Math.PI,
    bodyColor: 0x5a4a4a,
    shirtColor: 0x3a3040,
    dialogue: {
      greeting: "You've come to Duskspire. Either you're brave, desperate, or lost. Makes no difference — the Blight treats everyone the same. Rest if you can.",
      options: [
        { text: "Rest here (restore HP/SP/MP)", action: 'rest' },
        { text: "What is the Blight?", next: 'about' },
        { text: "Blight Hounds causing trouble?", next: 'hound_quest' },
        { text: "Farewell.", action: 'close' },
      ],
      hound_quest: {
        text: "Trouble? They're a plague. We can't send foragers beyond the walls without losing someone. Kill five of the beasts and you'll have earned your stay here.",
        options: [
          { text: "I'll thin the pack.", action: 'accept_blight_hounds' },
          { text: "Not right now.", action: 'close' },
        ],
      },
      about: {
        text: "The Blight is corruption made manifest. It seeps from the earth, twists beasts into monsters, and raises the dead as knights of darkness. Duskspire is the last outpost — beyond here, nothing survives.",
        options: [
          { text: "What caused it?", next: 'cause' },
          { text: "Farewell.", action: 'close' },
        ],
      },
      cause: {
        text: "Nobody knows for certain. Some say an Aether Pillar shattered deep underground. Others say something darker — something ancient woke up. All I know is it's spreading.",
        options: [
          { text: "Can it be stopped?", next: 'hope' },
          { text: "Farewell.", action: 'close' },
        ],
      },
      hope: {
        text: "Commander Thane thinks so. She leads what's left of the garrison. If anyone has a plan, it's her. You should speak with her.",
        options: [
          { text: "I will. Farewell.", action: 'close' },
        ],
      },
    },
  },

  commander_duskspire: {
    name: 'Commander Thane',
    title: 'Garrison Commander',
    role: 'questgiver',
    position: [412, -52],
    facing: -Math.PI / 2,
    bodyColor: 0x6a5858,
    shirtColor: 0x3a3050,
    dialogue: {
      greeting: "You don't look like a fool, so I'll be direct. The Blight is overrunning our defenses. Corrupted Knights — once our own soldiers — now patrol the wastes. We need them put down.",
      options: [
        { text: "I'll fight them.", next: 'knight_quest' },
        { text: "Tell me more about the Corrupted Knights.", next: 'knights_info' },
        { text: "Not my fight.", action: 'close' },
      ],
      knight_quest: {
        text: "Kill four Corrupted Knights in the Blight wastes. They're tough — heavy armor, dark blades. But every one we destroy is a victory. I'll reward you with our best equipment.",
        options: [
          { text: "I'll do it.", action: 'accept_blight_knights' },
          { text: "I need to prepare first.", action: 'close' },
        ],
      },
      knights_info: {
        text: "They were soldiers once — good men and women. The Blight took them, body and soul. Now they're hollow armor filled with dark energy. Fast, strong, relentless. Don't underestimate them.",
        options: [
          { text: "I'll fight them.", next: 'knight_quest' },
          { text: "Farewell.", action: 'close' },
        ],
      },
    },
  },

  merchant_duskspire: {
    name: 'Vex',
    title: 'War Supplier',
    role: 'merchant',
    position: [388, -56],
    facing: Math.PI / 2,
    bodyColor: 0x5a5050,
    shirtColor: 0x443344,
    shopItems: ['chest_dark', 'sword_dark', 'sword_volcanic', 'staff_frost', 'shield_iron',
                'potion_health', 'potion_stamina', 'potion_magic', 'helm_frost', 'chest_volcanic',
                'crossbow_heavy', 'bolt', 'bolt_dark'],
    dialogue: {
      greeting: "Duskspire's last line of supply. Everything here was hard-won — and priced accordingly. You'll need the best if you're heading into the wastes.",
      options: [
        { text: "Show me what you've got.", action: 'shop' },
        { text: "Not now. Farewell.", action: 'close' },
      ],
    },
  },
};


// ── NPC Mesh Builder ────────────────────────────────────────────────────────

function buildNPCMesh(data) {
  const g = new THREE.Group();

  const bodyMat  = new THREE.MeshStandardMaterial({ color: data.bodyColor,  roughness: 0.85 });
  const shirtMat = new THREE.MeshStandardMaterial({ color: data.shirtColor, roughness: 0.90 });
  const skinMat  = new THREE.MeshStandardMaterial({ color: 0xd4a574,        roughness: 0.80 });
  const hairMat  = new THREE.MeshStandardMaterial({ color: 0x3a2a1a,        roughness: 0.95 });
  const eyeMat   = new THREE.MeshStandardMaterial({ color: 0x222222,        roughness: 0.60 });

  // Legs
  for (const side of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.75, 0.25), bodyMat);
    leg.position.set(side * 0.15, 0.375, 0);
    leg.castShadow = true;
    g.add(leg);
  }

  // Torso
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.70, 0.30), shirtMat);
  torso.position.y = 1.10;
  torso.castShadow = true;
  g.add(torso);

  // Arms
  for (const side of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.65, 0.18), shirtMat);
    arm.position.set(side * 0.36, 1.05, 0);
    arm.castShadow = true;
    g.add(arm);
  }

  // Head
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.36, 0.32), skinMat);
  head.position.y = 1.65;
  head.castShadow = true;
  g.add(head);

  // Hair (top of head)
  const hair = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.12, 0.34), hairMat);
  hair.position.y = 1.88;
  g.add(hair);

  // Eyes
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.03, 4, 4), eyeMat);
    eye.position.set(side * 0.09, 1.68, -0.16);
    g.add(eye);
  }

  // NPC indicator — floating diamond above head
  const indicator = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.08, 0),
    new THREE.MeshStandardMaterial({
      color: data.role === 'merchant' ? 0xf59e0b : data.role === 'questgiver' ? 0x3b82f6 : 0x22cc66,
      emissive: data.role === 'merchant' ? 0xf59e0b : data.role === 'questgiver' ? 0x3b82f6 : 0x22cc66,
      emissiveIntensity: 0.6,
    })
  );
  indicator.position.y = 2.15;
  g.add(indicator);
  g._indicator = indicator;

  return g;
}


// ── NPC Class ───────────────────────────────────────────────────────────────

class NPC {
  constructor(id, scene) {
    this.id   = id;
    this.data = NPC_DATA[id];
    this.mesh = buildNPCMesh(this.data);

    const [x, z] = this.data.position;
    const y = terrainHeight(x, z);
    this.mesh.position.set(x, y, z);
    this.mesh.rotation.y = this.data.facing || 0;

    scene.add(this.mesh);
    this._scene = scene;
    this._time  = Math.random() * 100; // offset idle anim
  }

  update(dt) {
    this._time += dt;
    // Bobbing indicator
    if (this.mesh._indicator) {
      this.mesh._indicator.position.y = 2.15 + Math.sin(this._time * 2.0) * 0.06;
      this.mesh._indicator.rotation.y = this._time * 1.5;
    }
  }

  distanceTo(playerPos) {
    const dx = playerPos.x - this.mesh.position.x;
    const dz = playerPos.z - this.mesh.position.z;
    return Math.sqrt(dx * dx + dz * dz);
  }
}
