'use strict';

// ═══════════════════════════════════════════════════════════════════════════
// ENEMY TYPE CONFIGS
// ═══════════════════════════════════════════════════════════════════════════

const ENEMY_TYPES = {
  wolf: {
    name: 'Wolf',       hp: 40,  damage: 8,  speed: 4.5,
    aggroRange: 20,  atkRange: 1.85,  atkCooldown: 1.6,
    xp: 25,  lootTable: 'wolf',  meshBuilder: 'buildWolfMesh',
  },
  bear: {
    name: 'Bear',       hp: 120,  damage: 18,  speed: 3.2,
    aggroRange: 16,  atkRange: 2.5,  atkCooldown: 2.2,
    xp: 60,  lootTable: 'bear',  meshBuilder: 'buildBearMesh',
  },
  spider: {
    name: 'Spider',     hp: 25,  damage: 6,  speed: 6.0,
    aggroRange: 14,  atkRange: 1.6,  atkCooldown: 1.0,
    xp: 18,  lootTable: 'spider',  meshBuilder: 'buildSpiderMesh',
  },
  skeleton: {
    name: 'Skeleton',   hp: 55,  damage: 12,  speed: 3.5,
    aggroRange: 18,  atkRange: 2.0,  atkCooldown: 1.8,
    xp: 35,  lootTable: 'skeleton',  meshBuilder: 'buildSkeletonMesh',
  },
  bandit: {
    name: 'Bandit',     hp: 70,  damage: 14,  speed: 4.0,
    aggroRange: 22,  atkRange: 2.2,  atkCooldown: 1.5,
    xp: 45,  lootTable: 'bandit',  meshBuilder: 'buildBanditMesh',
  },
  // ── Ashfeld ──────────────────────────────────────────────────────────────
  fire_imp: {
    name: 'Fire Imp',   hp: 45,  damage: 11,  speed: 5.5,
    aggroRange: 18,  atkRange: 1.8,  atkCooldown: 1.2,
    xp: 40,  lootTable: 'fire_imp',  meshBuilder: 'buildFireImpMesh',
  },
  magma_golem: {
    name: 'Magma Golem', hp: 180, damage: 24,  speed: 2.2,
    aggroRange: 14,  atkRange: 2.8,  atkCooldown: 2.5,
    xp: 85,  lootTable: 'magma_golem',  meshBuilder: 'buildMagmaGolemMesh',
  },
  // ── Frostveil ────────────────────────────────────────────────────────────
  frost_wolf: {
    name: 'Frost Wolf',  hp: 65,  damage: 12,  speed: 5.0,
    aggroRange: 22,  atkRange: 2.0,  atkCooldown: 1.4,
    xp: 50,  lootTable: 'frost_wolf',  meshBuilder: 'buildFrostWolfMesh',
  },
  ice_wraith: {
    name: 'Ice Wraith',  hp: 80,  damage: 16,  speed: 3.8,
    aggroRange: 20,  atkRange: 2.2,  atkCooldown: 1.8,
    xp: 65,  lootTable: 'ice_wraith',  meshBuilder: 'buildIceWraithMesh',
  },
  // ── The Blight ───────────────────────────────────────────────────────────
  blight_hound: {
    name: 'Blight Hound', hp: 90,  damage: 16,  speed: 5.2,
    aggroRange: 24,  atkRange: 2.0,  atkCooldown: 1.3,
    xp: 70,  lootTable: 'blight_hound',  meshBuilder: 'buildBlightHoundMesh',
  },
  corrupted_knight: {
    name: 'Corrupted Knight', hp: 200, damage: 28, speed: 3.0,
    aggroRange: 20,  atkRange: 2.5,  atkCooldown: 2.0,
    xp: 110, lootTable: 'corrupted_knight', meshBuilder: 'buildCorruptedKnightMesh',
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// MESH BUILDERS
// ═══════════════════════════════════════════════════════════════════════════

function buildWolfMesh() {
  const g    = new THREE.Group();
  g.legs     = [];

  const fur  = new THREE.MeshStandardMaterial({ color: 0x8a8070, roughness: 1.0 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x50483e, roughness: 1.0 });
  const eye  = new THREE.MeshStandardMaterial({ color: 0xffcc44, emissive: 0xffcc00, emissiveIntensity: 0.5 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.44, 1.10), fur);
  body.position.y = 0.58; body.castShadow = true;
  g.add(body);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.26, 6), fur);
  neck.position.set(0, 0.84, -0.42); neck.rotation.x = -0.4;
  g.add(neck);

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.30, 0.40), fur);
  head.position.set(0, 0.92, -0.64); head.castShadow = true;
  g.add(head);

  const snout = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.17, 0.22), dark);
  snout.position.set(0, 0.84, -0.84);
  g.add(snout);

  for (const s of [-1, 1]) {
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.04, 4, 4), eye);
    e.position.set(s * 0.12, 0.96, -0.74);
    g.add(e);
  }

  for (const s of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.14, 4), dark);
    ear.position.set(s * 0.12, 1.12, -0.63);
    g.add(ear);
  }

  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.08, 0.50, 5), fur);
  tail.position.set(0, 0.76, 0.63); tail.rotation.x = -0.75;
  g.add(tail);

  const legGeo = new THREE.CylinderGeometry(0.08, 0.065, 0.50, 5);
  for (const [lx, lz] of [[-0.20, -0.32], [0.20, -0.32], [-0.20, 0.30], [0.20, 0.30]]) {
    const leg = new THREE.Mesh(legGeo, fur);
    leg.position.set(lx, 0.32, lz); leg.castShadow = true;
    g.add(leg);
    g.legs.push(leg);
  }

  return g;
}

function buildBearMesh() {
  const g   = new THREE.Group();
  g.legs    = [];

  const fur  = new THREE.MeshStandardMaterial({ color: 0x5c3a1e, roughness: 1.0 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x3d2510, roughness: 1.0 });
  const eye  = new THREE.MeshStandardMaterial({ color: 0x221100, roughness: 0.5 });

  // Large body
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.9, 1.6), fur);
  body.position.y = 0.85; body.castShadow = true;
  g.add(body);

  // Hump (upper back)
  const hump = new THREE.Mesh(new THREE.SphereGeometry(0.45, 6, 5), fur);
  hump.position.set(0, 1.35, -0.3);
  g.add(hump);

  // Head
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.50, 0.55), fur);
  head.position.set(0, 1.20, -1.0); head.castShadow = true;
  g.add(head);

  // Snout
  const snout = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.22, 0.30), dark);
  snout.position.set(0, 1.08, -1.30);
  g.add(snout);

  // Eyes
  for (const s of [-1, 1]) {
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.05, 4, 4), eye);
    e.position.set(s * 0.18, 1.28, -1.18);
    g.add(e);
  }

  // Ears
  for (const s of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.10, 5, 4), dark);
    ear.position.set(s * 0.22, 1.50, -0.90);
    g.add(ear);
  }

  // Legs — thick and stubby
  const legGeo = new THREE.CylinderGeometry(0.16, 0.13, 0.70, 6);
  for (const [lx, lz] of [[-0.45, -0.52], [0.45, -0.52], [-0.45, 0.52], [0.45, 0.52]]) {
    const leg = new THREE.Mesh(legGeo, fur);
    leg.position.set(lx, 0.38, lz); leg.castShadow = true;
    g.add(leg);
    g.legs.push(leg);
  }

  return g;
}

function buildSpiderMesh() {
  const g   = new THREE.Group();
  g.legs    = [];

  const body = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.9 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 });
  const eye  = new THREE.MeshStandardMaterial({ color: 0xff2200, emissive: 0xff0000, emissiveIntensity: 0.6 });

  // Abdomen (rear)
  const abdomen = new THREE.Mesh(new THREE.SphereGeometry(0.35, 6, 5), body);
  abdomen.position.set(0, 0.40, 0.25);
  abdomen.scale.set(1, 0.7, 1.2);
  abdomen.castShadow = true;
  g.add(abdomen);

  // Thorax (front)
  const thorax = new THREE.Mesh(new THREE.SphereGeometry(0.22, 6, 5), dark);
  thorax.position.set(0, 0.38, -0.20);
  thorax.castShadow = true;
  g.add(thorax);

  // Eyes (cluster of red dots)
  for (let i = 0; i < 4; i++) {
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.03, 3, 3), eye);
    e.position.set((i % 2 === 0 ? -1 : 1) * 0.06, 0.44 + (i < 2 ? 0.03 : 0), -0.38);
    g.add(e);
  }

  // Fangs
  for (const s of [-1, 1]) {
    const fang = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.12, 4), dark);
    fang.position.set(s * 0.06, 0.28, -0.36);
    fang.rotation.x = 0.3;
    g.add(fang);
  }

  // 8 legs — 4 per side
  const legGeo = new THREE.CylinderGeometry(0.025, 0.015, 0.55, 4);
  for (let side = -1; side <= 1; side += 2) {
    for (let i = 0; i < 4; i++) {
      const angle = -0.5 + i * 0.35;
      const leg = new THREE.Mesh(legGeo, dark);
      leg.position.set(side * 0.22, 0.30, -0.10 + i * 0.12);
      leg.rotation.z = side * -0.8;
      leg.rotation.y = angle * side;
      g.add(leg);
      g.legs.push(leg);
    }
  }

  return g;
}

function buildSkeletonMesh() {
  const g   = new THREE.Group();
  g.legs    = [];

  const bone  = new THREE.MeshStandardMaterial({ color: 0xe8e0d0, roughness: 0.85 });
  const dark  = new THREE.MeshStandardMaterial({ color: 0x888070, roughness: 0.90 });
  const eye   = new THREE.MeshStandardMaterial({ color: 0x44ffaa, emissive: 0x22ff88, emissiveIntensity: 0.7 });
  const metal = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.4, metalness: 0.7 });

  // Pelvis
  const pelvis = new THREE.Mesh(new THREE.BoxGeometry(0.40, 0.15, 0.22), bone);
  pelvis.position.y = 0.80;
  g.add(pelvis);

  // Spine
  const spine = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.55, 5), bone);
  spine.position.y = 1.15;
  g.add(spine);

  // Ribcage
  const ribs = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.35, 0.22), dark);
  ribs.position.y = 1.40; ribs.castShadow = true;
  g.add(ribs);

  // Skull
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.18, 6, 5), bone);
  skull.position.y = 1.78; skull.castShadow = true;
  g.add(skull);

  // Jaw
  const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.06, 0.10), dark);
  jaw.position.set(0, 1.64, -0.10);
  g.add(jaw);

  // Eye glow
  for (const s of [-1, 1]) {
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.04, 4, 4), eye);
    e.position.set(s * 0.07, 1.82, -0.14);
    g.add(e);
  }

  // Arms
  for (const s of [-1, 1]) {
    const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.035, 0.45, 5), bone);
    upper.position.set(s * 0.28, 1.30, 0);
    upper.rotation.z = s * 0.15;
    g.add(upper);
    const lower = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.03, 0.40, 5), bone);
    lower.position.set(s * 0.32, 0.92, 0);
    g.add(lower);
  }

  // Sword in right hand
  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.50, 0.02), metal);
  blade.position.set(0.35, 0.90, -0.15);
  blade.rotation.x = -0.4;
  g.add(blade);

  // Legs
  const legGeo = new THREE.CylinderGeometry(0.05, 0.04, 0.65, 5);
  for (const s of [-1, 1]) {
    const leg = new THREE.Mesh(legGeo, bone);
    leg.position.set(s * 0.14, 0.42, 0); leg.castShadow = true;
    g.add(leg);
    g.legs.push(leg);
  }

  return g;
}

function buildBanditMesh() {
  const g   = new THREE.Group();
  g.legs    = [];

  const skin   = new THREE.MeshStandardMaterial({ color: 0xc8a888, roughness: 0.85 });
  const cloth  = new THREE.MeshStandardMaterial({ color: 0x5a3820, roughness: 0.95 });
  const armor  = new THREE.MeshStandardMaterial({ color: 0x6a6050, roughness: 0.70, metalness: 0.3 });
  const hair   = new THREE.MeshStandardMaterial({ color: 0x2a2018, roughness: 1.0 });
  const metal  = new THREE.MeshStandardMaterial({ color: 0x999999, roughness: 0.35, metalness: 0.8 });

  // Legs
  const legGeo = new THREE.CylinderGeometry(0.10, 0.09, 0.80, 6);
  for (const s of [-1, 1]) {
    const leg = new THREE.Mesh(legGeo, cloth);
    leg.position.set(s * 0.14, 0.42, 0); leg.castShadow = true;
    g.add(leg);
    g.legs.push(leg);
  }

  // Torso
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.50, 0.60, 0.30), armor);
  torso.position.y = 1.12; torso.castShadow = true;
  g.add(torso);

  // Arms
  for (const s of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.55, 5), cloth);
    arm.position.set(s * 0.32, 1.10, 0);
    arm.rotation.z = s * 0.12;
    g.add(arm);
  }

  // Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 6, 5), skin);
  head.position.y = 1.58; head.castShadow = true;
  g.add(head);

  // Hair/hood
  const hood = new THREE.Mesh(new THREE.SphereGeometry(0.18, 6, 5), hair);
  hood.position.y = 1.62;
  hood.scale.set(1, 0.8, 1);
  g.add(hood);

  // Eyes
  for (const s of [-1, 1]) {
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.025, 4, 4), skin);
    e.position.set(s * 0.06, 1.58, -0.13);
    g.add(e);
  }

  // Sword in hand
  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.55, 0.02), metal);
  blade.position.set(0.36, 1.00, -0.18);
  blade.rotation.x = -0.35;
  g.add(blade);

  // Shield in left hand
  const shield = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.35, 0.30), armor);
  shield.position.set(-0.38, 1.10, -0.08);
  g.add(shield);

  return g;
}

// ── Ashfeld Mesh Builders ─────────────────────────────────────────────────

function buildFireImpMesh() {
  const g   = new THREE.Group();
  g.legs    = [];

  const skin  = new THREE.MeshStandardMaterial({ color: 0xcc3300, roughness: 0.7, emissive: 0xff4400, emissiveIntensity: 0.2 });
  const dark  = new THREE.MeshStandardMaterial({ color: 0x661100, roughness: 0.8 });
  const eye   = new THREE.MeshStandardMaterial({ color: 0xffaa00, emissive: 0xff8800, emissiveIntensity: 0.8 });
  const flame = new THREE.MeshStandardMaterial({ color: 0xff6600, emissive: 0xff4400, emissiveIntensity: 0.5, transparent: true, opacity: 0.8 });

  // Small body
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.28, 6, 5), skin);
  body.position.y = 0.65; body.scale.set(1, 1.2, 0.9);
  body.castShadow = true;
  g.add(body);

  // Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 6, 5), skin);
  head.position.y = 1.05; head.castShadow = true;
  g.add(head);

  // Horns
  for (const s of [-1, 1]) {
    const horn = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.18, 4), dark);
    horn.position.set(s * 0.10, 1.22, -0.02);
    horn.rotation.z = s * -0.3;
    g.add(horn);
  }

  // Eyes
  for (const s of [-1, 1]) {
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.035, 4, 4), eye);
    e.position.set(s * 0.07, 1.08, -0.14);
    g.add(e);
  }

  // Flame crown
  const crown = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.20, 5), flame);
  crown.position.y = 1.28;
  g.add(crown);

  // Arms (thin)
  for (const s of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.03, 0.35, 4), skin);
    arm.position.set(s * 0.28, 0.72, 0);
    arm.rotation.z = s * 0.3;
    g.add(arm);
  }

  // Legs
  const legGeo = new THREE.CylinderGeometry(0.06, 0.04, 0.40, 5);
  for (const s of [-1, 1]) {
    const leg = new THREE.Mesh(legGeo, dark);
    leg.position.set(s * 0.10, 0.28, 0); leg.castShadow = true;
    g.add(leg);
    g.legs.push(leg);
  }

  return g;
}

function buildMagmaGolemMesh() {
  const g   = new THREE.Group();
  g.legs    = [];

  const rock   = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.95 });
  const magma  = new THREE.MeshStandardMaterial({ color: 0xff4400, emissive: 0xff2200, emissiveIntensity: 0.6 });
  const eye    = new THREE.MeshStandardMaterial({ color: 0xffcc00, emissive: 0xff8800, emissiveIntensity: 0.8 });

  // Massive body
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.2, 1.0), rock);
  body.position.y = 1.20; body.castShadow = true;
  g.add(body);

  // Magma cracks (glowing lines on body)
  const crack1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.0, 1.02), magma);
  crack1.position.set(0.2, 1.20, 0);
  g.add(crack1);
  const crack2 = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.08, 0.06), magma);
  crack2.position.set(0, 1.0, -0.48);
  g.add(crack2);

  // Head (smaller boulder)
  const head = new THREE.Mesh(new THREE.DodecahedronGeometry(0.35, 0), rock);
  head.position.y = 2.10; head.castShadow = true;
  g.add(head);

  // Eyes
  for (const s of [-1, 1]) {
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.06, 4, 4), eye);
    e.position.set(s * 0.14, 2.14, -0.28);
    g.add(e);
  }

  // Arms (boulder-like)
  for (const s of [-1, 1]) {
    const upper = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.65, 0.30), rock);
    upper.position.set(s * 0.85, 1.50, 0);
    upper.castShadow = true;
    g.add(upper);
    const fist = new THREE.Mesh(new THREE.DodecahedronGeometry(0.22, 0), rock);
    fist.position.set(s * 0.85, 1.0, 0);
    g.add(fist);
    // Magma glow on fists
    const glow = new THREE.Mesh(new THREE.SphereGeometry(0.12, 4, 4), magma);
    glow.position.set(s * 0.85, 1.0, 0);
    g.add(glow);
  }

  // Legs (thick pillars)
  const legGeo = new THREE.CylinderGeometry(0.22, 0.18, 0.90, 6);
  for (const s of [-1, 1]) {
    const leg = new THREE.Mesh(legGeo, rock);
    leg.position.set(s * 0.35, 0.45, 0); leg.castShadow = true;
    g.add(leg);
    g.legs.push(leg);
  }

  return g;
}

// ── Frostveil Mesh Builders ──────────────────────────────────────────────

function buildFrostWolfMesh() {
  const g    = new THREE.Group();
  g.legs     = [];

  const fur  = new THREE.MeshStandardMaterial({ color: 0xd8e4f0, roughness: 1.0 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x9ab0c8, roughness: 1.0 });
  const eye  = new THREE.MeshStandardMaterial({ color: 0x44ccff, emissive: 0x2288ff, emissiveIntensity: 0.6 });

  // Larger than regular wolf
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.80, 0.52, 1.30), fur);
  body.position.y = 0.66; body.castShadow = true;
  g.add(body);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 0.30, 6), fur);
  neck.position.set(0, 0.96, -0.50); neck.rotation.x = -0.4;
  g.add(neck);

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.35, 0.45), fur);
  head.position.set(0, 1.04, -0.74); head.castShadow = true;
  g.add(head);

  const snout = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.18, 0.25), dark);
  snout.position.set(0, 0.96, -0.96);
  g.add(snout);

  for (const s of [-1, 1]) {
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.045, 4, 4), eye);
    e.position.set(s * 0.14, 1.08, -0.84);
    g.add(e);
  }

  for (const s of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.16, 4), dark);
    ear.position.set(s * 0.14, 1.24, -0.72);
    g.add(ear);
  }

  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.09, 0.55, 5), fur);
  tail.position.set(0, 0.84, 0.72); tail.rotation.x = -0.75;
  g.add(tail);

  const legGeo = new THREE.CylinderGeometry(0.09, 0.075, 0.55, 5);
  for (const [lx, lz] of [[-0.24, -0.38], [0.24, -0.38], [-0.24, 0.35], [0.24, 0.35]]) {
    const leg = new THREE.Mesh(legGeo, fur);
    leg.position.set(lx, 0.35, lz); leg.castShadow = true;
    g.add(leg);
    g.legs.push(leg);
  }

  return g;
}

function buildIceWraithMesh() {
  const g   = new THREE.Group();
  g.legs    = [];

  const ghost = new THREE.MeshStandardMaterial({ color: 0x88ccff, roughness: 0.3, transparent: true, opacity: 0.7, emissive: 0x4488ff, emissiveIntensity: 0.3 });
  const core  = new THREE.MeshStandardMaterial({ color: 0xaaddff, emissive: 0x66aaff, emissiveIntensity: 0.6 });
  const eye   = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x88ddff, emissiveIntensity: 1.0 });

  // Floating robed body
  const body = new THREE.Mesh(new THREE.ConeGeometry(0.45, 1.4, 6), ghost);
  body.position.y = 0.90; body.castShadow = true;
  g.add(body);

  // Inner core glow
  const coreM = new THREE.Mesh(new THREE.SphereGeometry(0.18, 5, 5), core);
  coreM.position.y = 1.20;
  g.add(coreM);

  // Head (hooded)
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.20, 6, 5), ghost);
  head.position.y = 1.75; head.castShadow = true;
  g.add(head);

  // Hood
  const hood = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.30, 6), ghost);
  hood.position.y = 1.88;
  g.add(hood);

  // Eyes
  for (const s of [-1, 1]) {
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.04, 4, 4), eye);
    e.position.set(s * 0.08, 1.78, -0.16);
    g.add(e);
  }

  // Floating arms (outstretched)
  for (const s of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.03, 0.50, 4), ghost);
    arm.position.set(s * 0.40, 1.40, -0.10);
    arm.rotation.z = s * 0.8;
    g.add(arm);
  }

  // Wraith has no real legs — uses phantom bottom
  const base = new THREE.Mesh(new THREE.ConeGeometry(0.20, 0.40, 5), ghost);
  base.position.y = 0.20; base.rotation.x = Math.PI;
  g.add(base);
  g.legs.push(base); // dummy for anim

  return g;
}

// ── Blight Mesh Builders ─────────────────────────────────────────────────

function buildBlightHoundMesh() {
  const g    = new THREE.Group();
  g.legs     = [];

  const flesh = new THREE.MeshStandardMaterial({ color: 0x3a2a3a, roughness: 0.9 });
  const dark  = new THREE.MeshStandardMaterial({ color: 0x2a1a2a, roughness: 0.95 });
  const eye   = new THREE.MeshStandardMaterial({ color: 0xaa00ff, emissive: 0x8800cc, emissiveIntensity: 0.7 });
  const glow  = new THREE.MeshStandardMaterial({ color: 0x7700aa, emissive: 0x5500aa, emissiveIntensity: 0.4 });

  // Body (larger than wolf, hunched)
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.50, 1.20), flesh);
  body.position.y = 0.62; body.castShadow = true;
  g.add(body);

  // Corruption veins on body
  const vein = new THREE.Mesh(new THREE.BoxGeometry(0.77, 0.06, 0.06), glow);
  vein.position.set(0, 0.70, -0.20);
  g.add(vein);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.20, 0.28, 6), flesh);
  neck.position.set(0, 0.90, -0.46); neck.rotation.x = -0.3;
  g.add(neck);

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.32, 0.42), dark);
  head.position.set(0, 0.96, -0.70); head.castShadow = true;
  g.add(head);

  const snout = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.18, 0.24), dark);
  snout.position.set(0, 0.88, -0.92);
  g.add(snout);

  for (const s of [-1, 1]) {
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.045, 4, 4), eye);
    e.position.set(s * 0.12, 1.00, -0.80);
    g.add(e);
  }

  // Spiny ridges on back
  for (let i = 0; i < 4; i++) {
    const spine = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.15, 4), glow);
    spine.position.set(0, 0.92, -0.30 + i * 0.25);
    g.add(spine);
  }

  const legGeo = new THREE.CylinderGeometry(0.08, 0.065, 0.50, 5);
  for (const [lx, lz] of [[-0.22, -0.34], [0.22, -0.34], [-0.22, 0.32], [0.22, 0.32]]) {
    const leg = new THREE.Mesh(legGeo, flesh);
    leg.position.set(lx, 0.32, lz); leg.castShadow = true;
    g.add(leg);
    g.legs.push(leg);
  }

  return g;
}

function buildCorruptedKnightMesh() {
  const g   = new THREE.Group();
  g.legs    = [];

  const armor  = new THREE.MeshStandardMaterial({ color: 0x2a2030, roughness: 0.6, metalness: 0.5 });
  const dark   = new THREE.MeshStandardMaterial({ color: 0x1a1018, roughness: 0.7, metalness: 0.3 });
  const glow   = new THREE.MeshStandardMaterial({ color: 0x8800cc, emissive: 0x6600aa, emissiveIntensity: 0.5 });
  const eye    = new THREE.MeshStandardMaterial({ color: 0xcc00ff, emissive: 0xaa00dd, emissiveIntensity: 0.8 });
  const metal  = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.3, metalness: 0.8 });

  // Legs
  const legGeo = new THREE.CylinderGeometry(0.12, 0.10, 0.85, 6);
  for (const s of [-1, 1]) {
    const leg = new THREE.Mesh(legGeo, armor);
    leg.position.set(s * 0.16, 0.44, 0); leg.castShadow = true;
    g.add(leg);
    g.legs.push(leg);
  }

  // Torso (heavy plate)
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.60, 0.70, 0.35), armor);
  torso.position.y = 1.22; torso.castShadow = true;
  g.add(torso);

  // Corruption glow on chest
  const chestGlow = new THREE.Mesh(new THREE.SphereGeometry(0.10, 5, 5), glow);
  chestGlow.position.set(0, 1.25, -0.16);
  g.add(chestGlow);

  // Pauldrons
  for (const s of [-1, 1]) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 0.22), dark);
    p.position.set(s * 0.38, 1.52, 0);
    g.add(p);
  }

  // Arms
  for (const s of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.60, 5), armor);
    arm.position.set(s * 0.36, 1.16, 0);
    arm.rotation.z = s * 0.10;
    g.add(arm);
  }

  // Helm
  const helm = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.38, 0.32), dark);
  helm.position.y = 1.78; helm.castShadow = true;
  g.add(helm);

  // Visor slit (glowing eyes)
  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.05, 0.02), eye);
  visor.position.set(0, 1.78, -0.16);
  g.add(visor);

  // Greatsword
  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.80, 0.025), metal);
  blade.position.set(0.40, 1.15, -0.20);
  blade.rotation.x = -0.3;
  g.add(blade);
  // Corruption on blade
  const bladeGlow = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.75, 0.03), glow);
  bladeGlow.position.set(0.40, 1.15, -0.20);
  bladeGlow.rotation.x = -0.3;
  g.add(bladeGlow);

  // Shield
  const shield = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.40, 0.35), dark);
  shield.position.set(-0.42, 1.20, -0.08);
  g.add(shield);

  return g;
}

// Lookup mesh builder by name
const MESH_BUILDERS = {
  buildWolfMesh,
  buildBearMesh,
  buildSpiderMesh,
  buildSkeletonMesh,
  buildBanditMesh,
  buildFireImpMesh,
  buildMagmaGolemMesh,
  buildFrostWolfMesh,
  buildIceWraithMesh,
  buildBlightHoundMesh,
  buildCorruptedKnightMesh,
};

// ═══════════════════════════════════════════════════════════════════════════
// GENERIC ENEMY CLASS
// ═══════════════════════════════════════════════════════════════════════════

class Enemy {
  constructor(type, x, z, scene, onPlayerHit) {
    const cfg = ENEMY_TYPES[type];
    this.type        = type;
    this.name        = cfg.name;
    this.hp          = cfg.hp;   this.maxHp    = cfg.hp;
    this.damage      = cfg.damage;
    this.speed       = cfg.speed;
    this.aggroRange  = cfg.aggroRange;
    this.atkRange    = cfg.atkRange;
    this.atkCooldown = cfg.atkCooldown;
    this.atkTimer    = 0;
    this.xp          = cfg.xp;
    this.lootTable   = cfg.lootTable;

    this.state         = 'idle';
    this.dead          = false;
    this._dyingTimer   = 0;
    this._legTime      = 0;
    this._wanderAngle  = Math.random() * Math.PI * 2;
    this._wanderTimer  = 0;
    this.onPlayerHit   = onPlayerHit;
    this._magicLootDone = false;

    this.mesh = MESH_BUILDERS[cfg.meshBuilder]();
    this.mesh.position.set(x, terrainHeight(x, z), z);
    scene.add(this.mesh);
    this._scene = scene;

    // Floating HP label
    this.hpEl = document.createElement('div');
    this.hpEl.style.cssText =
      'position:fixed;pointer-events:none;display:none;z-index:30;transform:translateX(-50%)';
    this.hpEl.innerHTML =
      '<div style="background:rgba(0,0,0,0.6);border:1px solid rgba(255,255,255,0.14);' +
      'border-radius:2px;padding:2px 4px;width:72px;text-align:center">' +
      `<div style="font-size:9px;color:rgba(255,200,200,0.7);letter-spacing:1px;margin-bottom:2px">${cfg.name}</div>` +
      '<div style="background:rgba(60,0,0,0.7);border-radius:1px;height:5px;overflow:hidden">' +
      '<div class="ef" style="background:#dc2626;height:100%;width:100%;transition:width 0.1s"></div>' +
      '</div></div>';
    document.body.appendChild(this.hpEl);
    this._hpFill = this.hpEl.querySelector('.ef');
  }

  update(dt, playerPos, camera) {
    if (this.dead) {
      this._dyingTimer += dt;
      this.mesh.rotation.z += (Math.PI / 2 - this.mesh.rotation.z) * 0.06;
      this.mesh.position.y -= dt * 0.4;
      if (this._dyingTimer > 3) this._cleanup();
      this.hpEl.style.display = 'none';
      return;
    }

    const dx   = playerPos.x - this.mesh.position.x;
    const dz   = playerPos.z - this.mesh.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    this.atkTimer = Math.max(0, this.atkTimer - dt);

    if (dist < this.aggroRange) {
      this.mesh.rotation.y = Math.atan2(dx, dz) + Math.PI;

      if (dist > this.atkRange) {
        this.state = 'pursue';
        const s = this.speed * dt / dist;
        this.mesh.position.x += dx * s;
        this.mesh.position.z += dz * s;
        this.mesh.position.y = terrainHeight(this.mesh.position.x, this.mesh.position.z);
        this._animLegs(dt, true);
      } else {
        this.state = 'attack';
        if (this.atkTimer === 0) {
          this.atkTimer = this.atkCooldown;
          this.onPlayerHit(this.damage);
        }
      }
    } else {
      this.state = 'idle';
      this._wanderTimer -= dt;
      if (this._wanderTimer <= 0) {
        this._wanderAngle += (Math.random() - 0.5) * 1.6;
        this._wanderTimer  = 1.5 + Math.random() * 2.5;
      }
      const s = this.speed * 0.25 * dt;
      this.mesh.position.x += Math.sin(this._wanderAngle) * s;
      this.mesh.position.z += Math.cos(this._wanderAngle) * s;
      this.mesh.position.y  = terrainHeight(this.mesh.position.x, this.mesh.position.z);
      this.mesh.rotation.y  = this._wanderAngle + Math.PI;
      this._animLegs(dt, false);
    }

    // Floating HP bar
    if (dist < this.aggroRange * 1.4) {
      const p3 = this.mesh.position.clone();
      p3.y += (this.type === 'spider' ? 1.0 : this.type === 'bear' ? 2.2 : 1.5);
      const ndc = p3.project(camera);
      if (ndc.z < 1) {
        const sx = (ndc.x * 0.5 + 0.5) * window.innerWidth;
        const sy = (-ndc.y * 0.5 + 0.5) * window.innerHeight;
        this.hpEl.style.display = 'block';
        this.hpEl.style.left    = sx + 'px';
        this.hpEl.style.top     = (sy - 30) + 'px';
        this._hpFill.style.width = (this.hp / this.maxHp * 100) + '%';
      } else {
        this.hpEl.style.display = 'none';
      }
    } else {
      this.hpEl.style.display = 'none';
    }
  }

  takeDamage(amount) {
    if (this.dead) return;
    this.hp = Math.max(0, this.hp - amount);
    this._hpFill.style.width = (this.hp / this.maxHp * 100) + '%';
    if (this.hp === 0) {
      this.dead  = true;
      this.state = 'dead';
    }
  }

  _animLegs(dt, fast) {
    this._legTime += dt * (fast ? 10 : 4);
    const legs = this.mesh.legs;
    if (!legs || legs.length === 0) return;
    for (let i = 0; i < legs.length; i++) {
      legs[i].rotation.x = Math.sin(this._legTime + (i % 2) * Math.PI) * 0.45;
    }
  }

  _cleanup() {
    if (this._cleaned) return;
    this._cleaned = true;
    this._scene.remove(this.mesh);
    if (this.hpEl.parentNode) this.hpEl.parentNode.removeChild(this.hpEl);
  }
}

// Keep Wolf as an alias for backward compatibility with game.js references
const Wolf = class extends Enemy {
  constructor(x, z, scene, onPlayerHit) {
    super('wolf', x, z, scene, onPlayerHit);
  }
};
