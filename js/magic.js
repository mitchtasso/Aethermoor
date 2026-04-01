'use strict';

// ── Spell Database ──────────────────────────────────────────────────────────

const SPELLS = {

  // ── Destruction ───────────────────────────────────────────────────────────
  firebolt: {
    id: 'firebolt', name: 'Firebolt', school: 'destruction',
    mpCost: 12, damage: 18, speed: 45, lifetime: 3.0,
    color: 0xff6600, emissive: 0xff4400, particleColor: 0xff8833,
    projectile: true, radius: 0.18,
    description: 'Launches a bolt of fire that deals fire damage on impact.',
  },
  frost_shard: {
    id: 'frost_shard', name: 'Frost Shard', school: 'destruction',
    mpCost: 14, damage: 15, speed: 40, lifetime: 3.0,
    color: 0x66ccff, emissive: 0x4488ff, particleColor: 0xaaddff,
    projectile: true, radius: 0.15,
    description: 'Hurls a shard of ice that deals frost damage and slows.',
  },
  lightning_arc: {
    id: 'lightning_arc', name: 'Lightning Arc', school: 'destruction',
    mpCost: 8, damage: 6, speed: 0, lifetime: 0,
    color: 0xccccff, emissive: 0x8888ff, particleColor: 0xeeeeff,
    projectile: false, range: 12, beam: true,
    description: 'A short-range beam of lightning. Drains MP while held.',
  },

  // ── Restoration ───────────────────────────────────────────────────────────
  heal: {
    id: 'heal', name: 'Heal', school: 'restoration',
    mpCost: 20, healAmount: 35, speed: 0, lifetime: 0,
    color: 0x44ff66, emissive: 0x22cc44, particleColor: 0x88ffaa,
    projectile: false, self: true,
    description: 'Restores 35 HP over a moment.',
  },

  // ── Alteration ────────────────────────────────────────────────────────────
  mage_armor: {
    id: 'mage_armor', name: 'Mage Armor', school: 'alteration',
    mpCost: 25, armorBonus: 15, duration: 30, speed: 0, lifetime: 0,
    color: 0xaaaaff, emissive: 0x6666cc, particleColor: 0xccccff,
    projectile: false, self: true, buff: true,
    description: 'Increases armor by 15 for 30 seconds.',
  },
  candlelight: {
    id: 'candlelight', name: 'Candlelight', school: 'alteration',
    mpCost: 10, duration: 60, speed: 0, lifetime: 0,
    color: 0xffee88, emissive: 0xffcc44, particleColor: 0xffeeaa,
    projectile: false, self: true, light: true,
    description: 'Summons a floating light that follows you.',
  },
};

// Spell tomes — items that teach spells
const SPELL_TOMES = {
  tome_firebolt:    { id: 'tome_firebolt',    name: 'Spell Tome: Firebolt',    type: 'spelltome', rarity: 'common',   weight: 0.5, value: 80,  spell: 'firebolt',    description: 'Teaches the Firebolt spell.' },
  tome_frost_shard: { id: 'tome_frost_shard', name: 'Spell Tome: Frost Shard', type: 'spelltome', rarity: 'common',   weight: 0.5, value: 100, spell: 'frost_shard', description: 'Teaches the Frost Shard spell.' },
  tome_lightning:   { id: 'tome_lightning',   name: 'Spell Tome: Lightning Arc', type: 'spelltome', rarity: 'uncommon', weight: 0.5, value: 120, spell: 'lightning_arc', description: 'Teaches the Lightning Arc spell.' },
  tome_heal:        { id: 'tome_heal',        name: 'Spell Tome: Heal',        type: 'spelltome', rarity: 'common',   weight: 0.5, value: 90,  spell: 'heal',        description: 'Teaches the Heal spell.' },
  tome_mage_armor:  { id: 'tome_mage_armor',  name: 'Spell Tome: Mage Armor',  type: 'spelltome', rarity: 'uncommon', weight: 0.5, value: 130, spell: 'mage_armor',  description: 'Teaches the Mage Armor spell.' },
  tome_candlelight: { id: 'tome_candlelight', name: 'Spell Tome: Candlelight', type: 'spelltome', rarity: 'common',   weight: 0.5, value: 50,  spell: 'candlelight', description: 'Teaches the Candlelight spell.' },
};

// Register spell tomes into ITEMS database
for (const [id, tome] of Object.entries(SPELL_TOMES)) {
  ITEMS[id] = tome;
}


// ── Magic Manager ───────────────────────────────────────────────────────────

class MagicManager {

  constructor(player, scene, camera) {
    this.player = player;
    this.scene  = scene;
    this.camera = camera;

    // Known spells
    this.known = [];  // spell ids

    // Equipped spells (left/right mouse)
    this.leftSpell  = null;  // spell id
    this.rightSpell = null;  // spell id — null means sword

    // Active projectiles
    this.projectiles = [];

    // Active buffs: { spellId, timer }
    this.buffs = [];

    // Candlelight point light
    this._candleLight = null;

    // Lightning beam mesh
    this._beamMesh = null;
    this._beamActive = false;

    // Cast cooldowns
    this.leftCooldown  = 0;
    this.rightCooldown = 0;
    this.CAST_COOLDOWN = 0.35;

    // Shared geometries
    this._sphereGeo = new THREE.SphereGeometry(1, 8, 6);

    // Glow orbs on viewmodel (shows equipped spell color)
    this._leftGlow  = this._makeGlowOrb();
    this._rightGlow = this._makeGlowOrb();
  }

  _makeGlowOrb() {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.04, 6, 4),
      new THREE.MeshStandardMaterial({
        color: 0x000000, emissive: 0x000000,
        emissiveIntensity: 2.0, transparent: true, opacity: 0,
      })
    );
    return mesh;
  }

  learnSpell(spellId) {
    if (this.known.includes(spellId)) return false;
    if (!SPELLS[spellId]) return false;
    this.known.push(spellId);
    return true;
  }

  equipLeft(spellId) {
    if (!this.known.includes(spellId)) return;
    this.leftSpell = spellId;
    this._updateGlow(this._leftGlow, spellId);
  }

  equipRight(spellId) {
    if (!this.known.includes(spellId)) return;
    this.rightSpell = spellId;
    this._updateGlow(this._rightGlow, spellId);
  }

  unequipLeft()  { this.leftSpell = null;  this._updateGlow(this._leftGlow, null); }
  unequipRight() { this.rightSpell = null; this._updateGlow(this._rightGlow, null); }

  _updateGlow(orb, spellId) {
    if (!spellId) {
      orb.material.opacity = 0;
      return;
    }
    const spell = SPELLS[spellId];
    orb.material.color.setHex(spell.color);
    orb.material.emissive.setHex(spell.emissive);
    orb.material.opacity = 0.85;
  }

  // ── Casting ───────────────────────────────────────────────────────────────

  tryCast(hand) {
    const spellId = hand === 'left' ? this.leftSpell : this.rightSpell;
    if (!spellId) return false;

    const cd = hand === 'left' ? this.leftCooldown : this.rightCooldown;
    if (cd > 0) return false;

    const spell = SPELLS[spellId];
    if (this.player.mp < spell.mpCost) return false;

    this.player.mp -= spell.mpCost;

    if (hand === 'left')  this.leftCooldown  = this.CAST_COOLDOWN;
    else                  this.rightCooldown = this.CAST_COOLDOWN;

    if (spell.projectile) {
      this._spawnProjectile(spell);
    } else if (spell.self) {
      this._castSelf(spell);
    }

    return true;
  }

  // Continuous cast (lightning) — called every frame while held
  tryCastContinuous(hand, dt) {
    const spellId = hand === 'left' ? this.leftSpell : this.rightSpell;
    if (!spellId) return false;
    const spell = SPELLS[spellId];
    if (!spell.beam) return false;

    const mpCost = spell.mpCost * dt; // drain per second
    if (this.player.mp < mpCost) {
      this._hideBeam();
      return false;
    }

    this.player.mp -= mpCost;
    this._showBeam(spell);
    this._beamDamage(spell, dt);
    return true;
  }

  stopContinuous() {
    this._hideBeam();
  }

  _spawnProjectile(spell) {
    const dir = new THREE.Vector3(0, 0, -1);
    dir.applyQuaternion(this.camera.quaternion);

    const pos = this.camera.position.clone().add(dir.clone().multiplyScalar(1.2));

    const mat = new THREE.MeshStandardMaterial({
      color: spell.color,
      emissive: spell.emissive,
      emissiveIntensity: 3.0,
    });

    const mesh = new THREE.Mesh(this._sphereGeo, mat);
    mesh.scale.setScalar(spell.radius);
    mesh.position.copy(pos);
    this.scene.add(mesh);

    // Point light on the projectile
    const light = new THREE.PointLight(spell.color, 2.0, 15);
    mesh.add(light);

    this.projectiles.push({
      mesh,
      velocity: dir.multiplyScalar(spell.speed),
      damage: spell.damage * this.player.spellDamageMultiplier,
      lifetime: spell.lifetime,
      age: 0,
      spell,
    });
  }

  _castSelf(spell) {
    if (spell.healAmount) {
      const heal = spell.healAmount * this.player.spellDamageMultiplier;
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + heal);
    }
    if (spell.buff && spell.armorBonus) {
      // Remove existing mage armor buff if any
      this.buffs = this.buffs.filter(b => b.spellId !== spell.id);
      this.buffs.push({ spellId: spell.id, timer: spell.duration });
      this.player.armor += spell.armorBonus;
    }
    if (spell.light) {
      this._toggleCandlelight(spell);
    }
  }

  _toggleCandlelight(spell) {
    if (this._candleLight) {
      this.scene.remove(this._candleLight);
      this._candleLight = null;
    } else {
      this._candleLight = new THREE.PointLight(spell.color, 1.8, 30);
      this.scene.add(this._candleLight);
    }
  }

  // ── Beam (lightning) ──────────────────────────────────────────────────────

  _showBeam(spell) {
    if (!this._beamMesh) {
      const geo = new THREE.CylinderGeometry(0.03, 0.03, 1, 4);
      geo.rotateX(Math.PI / 2);
      const mat = new THREE.MeshStandardMaterial({
        color: spell.color, emissive: spell.emissive,
        emissiveIntensity: 4.0, transparent: true, opacity: 0.7,
      });
      this._beamMesh = new THREE.Mesh(geo, mat);
      this.scene.add(this._beamMesh);
    }

    const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
    const start = this.camera.position.clone().add(dir.clone().multiplyScalar(0.8));
    const end   = this.camera.position.clone().add(dir.clone().multiplyScalar(spell.range));

    this._beamMesh.position.copy(start.clone().add(end).multiplyScalar(0.5));
    this._beamMesh.lookAt(end);
    this._beamMesh.scale.set(1, 1, spell.range);
    this._beamMesh.visible = true;
    this._beamActive = true;

    // Jitter for electric effect
    this._beamMesh.position.x += (Math.random() - 0.5) * 0.08;
    this._beamMesh.position.y += (Math.random() - 0.5) * 0.08;
  }

  _hideBeam() {
    if (this._beamMesh) this._beamMesh.visible = false;
    this._beamActive = false;
  }

  _beamDamage(spell, dt) {
    // Stored externally — game.js will call checkBeamHits
    this._beamDir   = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
    this._beamStart = this.camera.position.clone();
    this._beamRange = spell.range;
    this._beamDmg   = spell.damage * this.player.spellDamageMultiplier * dt; // damage per second
  }

  // ── Update (per frame) ────────────────────────────────────────────────────

  update(dt, wolves) {
    // Cooldowns
    this.leftCooldown  = Math.max(0, this.leftCooldown  - dt);
    this.rightCooldown = Math.max(0, this.rightCooldown - dt);

    // Update projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.age += dt;

      // Move
      p.mesh.position.add(p.velocity.clone().multiplyScalar(dt));

      // Terrain collision
      const ty = terrainHeight(p.mesh.position.x, p.mesh.position.z);
      if (p.mesh.position.y < ty + 0.2) {
        this._destroyProjectile(i);
        continue;
      }

      // Enemy collision
      let hit = false;
      for (const wolf of wolves) {
        if (wolf.dead) continue;
        const dx = wolf.mesh.position.x - p.mesh.position.x;
        const dy = (wolf.mesh.position.y + 0.6) - p.mesh.position.y;
        const dz = wolf.mesh.position.z - p.mesh.position.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < 1.2) {
          wolf.takeDamage(p.damage);
          hit = true;
          break;
        }
      }

      if (hit || p.age > p.lifetime) {
        this._destroyProjectile(i);
        continue;
      }
    }

    // Check beam hits
    if (this._beamActive && this._beamDir) {
      for (const wolf of wolves) {
        if (wolf.dead) continue;
        const toWolf = new THREE.Vector3().subVectors(wolf.mesh.position, this._beamStart);
        toWolf.y += 0.6; // aim at body center
        const proj = toWolf.dot(this._beamDir);
        if (proj > 0 && proj < this._beamRange) {
          const closest = this._beamStart.clone().add(this._beamDir.clone().multiplyScalar(proj));
          const off = new THREE.Vector3().subVectors(wolf.mesh.position, closest);
          off.y += 0.6;
          if (off.length() < 1.5) {
            wolf.takeDamage(this._beamDmg);
          }
        }
      }
    }

    // Update buffs
    for (let i = this.buffs.length - 1; i >= 0; i--) {
      this.buffs[i].timer -= dt;
      if (this.buffs[i].timer <= 0) {
        const spell = SPELLS[this.buffs[i].spellId];
        if (spell.armorBonus) this.player.armor -= spell.armorBonus;
        this.buffs.splice(i, 1);
      }
    }

    // Update candlelight position
    if (this._candleLight) {
      this._candleLight.position.set(
        this.player.position.x + Math.sin(performance.now() * 0.001) * 0.5,
        this.player.position.y + 2.5,
        this.player.position.z + Math.cos(performance.now() * 0.001) * 0.5
      );
    }
  }

  _destroyProjectile(index) {
    const p = this.projectiles[index];
    this.scene.remove(p.mesh);
    p.mesh.geometry.dispose && p.mesh.geometry.dispose();
    p.mesh.material.dispose && p.mesh.material.dispose();
    this.projectiles.splice(index, 1);
  }
}
