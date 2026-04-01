'use strict';

class PlayerController {

  constructor(camera, terrain) {
    this.camera  = camera;
    this.terrain = terrain;

    this.position = new THREE.Vector3(0, 0, 0);
    this.yaw   = 0;
    this.pitch = 0;
    this.keys  = {};

    this.isMoving    = false;
    this.isSprinting = false;
    this.bobTime = 0;
    this.bobY    = 0;

    // ── Leveling ──────────────────────────────────────────────────────────────
    this.level       = 1;
    this.xp          = 0;
    this.statPoints  = 0;  // unspent points
    this.maxLevel    = 50;

    // Core stats (all start at 5)
    this.str = 5;  // melee damage, carry weight
    this.agi = 5;  // move speed, dodge
    this.end = 5;  // max stamina, stamina regen, phys resist
    this.int = 5;  // max magic, spell damage
    this.wil = 5;  // magic regen, magic resist
    this.per = 5;  // crit chance, ranged accuracy

    // Resource pools (base values — recalcDerived adds stat bonuses)
    this.baseHp = 100; this.baseSp = 100; this.baseMp = 100;
    this.hp = 100; this.maxHp = 100;
    this.sp = 100; this.maxSp = 100;
    this.mp = 100; this.maxMp = 100;

    // Movement
    this.BASE_WALK_SPEED   = 7.5;
    this.BASE_SPRINT_SPEED = 13.5;
    this.WALK_SPEED   = 7.5;
    this.SPRINT_SPEED = 13.5;
    this.EYE_HEIGHT   = 1.72;
    this.BOB_FREQ     = 8.0;
    this.BOB_AMP      = 0.048;
    this.PITCH_LIMIT  = Math.PI / 2 - 0.04;
    this.BASE_SP_DRAIN = 12;
    this.BASE_SP_REGEN = 6;
    this.BASE_MP_REGEN = 1.5;
    this.SP_DRAIN     = 12;
    this.SP_REGEN     = 6;
    this.MP_REGEN     = 1.5;

    // Combat
    this.isAttacking    = false;
    this.attackTimer    = 0;
    this.attackCooldown = 0.65;
    this.baseAttackDamage = 15;
    this.attackDamage   = 15;
    this.armor          = 0;
    this.attackRange    = 3.2;
    this.critChance     = 0.05;  // 5% base
    this.critMultiplier = 1.5;
    this.spellDamageMultiplier = 1.0;
    this._hitDealt      = false;
    this._lmb           = false;
    this.onAttackHit    = null; // assigned by game.js

    // Ranged combat
    this.isRanged       = false;  // true when a ranged weapon is equipped
    this.isDrawing      = false;  // currently drawing the bow
    this.drawTimer      = 0;      // current draw progress (0 → drawTime)
    this.drawTime       = 0.6;    // seconds to fully draw (set by weapon)
    this.rangedCooldown = 0;      // reload timer after firing
    this.rangedDamage   = 0;      // set by weapon
    this.projectileSpeed = 55;    // set by weapon
    this.ammoType       = null;   // 'arrow' or 'bolt'
    this._wantsShoot    = false;  // LMB released after draw = fire
    this._lastDrawPct   = 0;      // draw % at release (used by fireArrow)

    // Carry capacity
    this.maxWeight      = 100;

    this.recalcDerived();

    // Raycaster for terrain
    this._ray    = new THREE.Raycaster();
    this._down   = new THREE.Vector3(0, -1, 0);
    this._origin = new THREE.Vector3();

    this._bindEvents();
    this.position.y = this._terrainY(0, 0);
  }

  _bindEvents() {
    document.addEventListener('keydown', e => {
      this.keys[e.code] = true;
      if (e.code === 'Space' || e.code === 'Tab') e.preventDefault();
    });
    document.addEventListener('keyup', e => { this.keys[e.code] = false; });

    document.addEventListener('mousemove', e => {
      if (!document.pointerLockElement) return;
      const sens = 0.0018;
      this.yaw   -= e.movementX * sens;
      this.pitch -= e.movementY * sens;
      this.pitch  = Math.max(-this.PITCH_LIMIT, Math.min(this.PITCH_LIMIT, this.pitch));
    });

    document.addEventListener('mousedown', e => {
      if (e.button === 0 && document.pointerLockElement) this._lmb = true;
    });
    document.addEventListener('mouseup', e => {
      if (e.button === 0) this._lmb = false;
    });
  }

  // ── XP & Leveling ──────────────────────────────────────────────────────────

  xpToNext() {
    return Math.floor(100 * Math.pow(this.level, 1.5));
  }

  addXP(amount) {
    if (this.level >= this.maxLevel) return false;
    this.xp += amount;
    let leveled = false;
    while (this.xp >= this.xpToNext() && this.level < this.maxLevel) {
      this.xp -= this.xpToNext();
      this.level++;
      this.statPoints += 5;
      this.baseHp += 10;
      this.baseSp += 5;
      this.baseMp += 5;
      leveled = true;
    }
    if (leveled) {
      this.recalcDerived();
      // Restore resources on level-up
      this.hp = this.maxHp;
      this.sp = this.maxSp;
      this.mp = this.maxMp;
    }
    return leveled;
  }

  allocateStat(stat) {
    if (this.statPoints <= 0) return false;
    if (!['str', 'agi', 'end', 'int', 'wil', 'per'].includes(stat)) return false;
    this[stat]++;
    this.statPoints--;
    this.recalcDerived();
    return true;
  }

  recalcDerived() {
    // Max resources: base + stat bonuses + per-level bonuses are already in baseHp/Sp/Mp
    this.maxHp = this.baseHp + this.end * 2;
    this.maxSp = this.baseSp + this.end * 3;
    this.maxMp = this.baseMp + this.int * 3;

    // Clamp current to new max
    this.hp = Math.min(this.hp, this.maxHp);
    this.sp = Math.min(this.sp, this.maxSp);
    this.mp = Math.min(this.mp, this.maxMp);

    // Movement: agility adds a small speed bonus
    this.WALK_SPEED   = this.BASE_WALK_SPEED   + this.agi * 0.08;
    this.SPRINT_SPEED = this.BASE_SPRINT_SPEED + this.agi * 0.12;

    // Regen
    this.SP_REGEN = this.BASE_SP_REGEN + this.end * 0.3;
    this.MP_REGEN = this.BASE_MP_REGEN + this.wil * 0.2;

    // Melee damage: base + strength scaling
    this.attackDamage = this.baseAttackDamage + this.str * 1.2;

    // Spell damage multiplier: intelligence scaling
    this.spellDamageMultiplier = 1.0 + (this.int - 5) * 0.04;

    // Crit chance: perception scaling
    this.critChance = 0.05 + this.per * 0.005;

    // Carry capacity
    this.maxWeight = 50 + this.str * 5;
  }

  _terrainY(x, z) {
    this._origin.set(x, 200, z);
    this._ray.set(this._origin, this._down);
    const hits = this._ray.intersectObject(this.terrain, false);
    return hits.length > 0 ? hits[0].point.y : 0;
  }

  update(dt) {
    // ── Movement ──────────────────────────────────────────────────────────────
    const wantSprint = this.keys['ShiftLeft'] || this.keys['ShiftRight'];
    const sprinting  = wantSprint && this.sp > 0;
    const speed      = sprinting ? this.SPRINT_SPEED : this.WALK_SPEED;

    const sinY = Math.sin(this.yaw), cosY = Math.cos(this.yaw);
    let dx = 0, dz = 0;
    if (this.keys['KeyW']) { dx -= sinY; dz -= cosY; }
    if (this.keys['KeyS']) { dx += sinY; dz += cosY; }
    if (this.keys['KeyA']) { dx -= cosY; dz += sinY; }
    if (this.keys['KeyD']) { dx += cosY; dz -= sinY; }

    const len = Math.sqrt(dx * dx + dz * dz);
    this.isMoving    = len > 0;
    this.isSprinting = sprinting && this.isMoving;

    if (this.isMoving) {
      const s = speed * dt / len;
      this.position.x += dx * s;
      this.position.z += dz * s;
    }

    this.position.y = this._terrainY(this.position.x, this.position.z);

    // ── Head bob ──────────────────────────────────────────────────────────────
    if (this.isMoving) {
      this.bobTime += dt * this.BOB_FREQ * (this.isSprinting ? 1.45 : 1.0);
      this.bobY = Math.sin(this.bobTime) * this.BOB_AMP * (this.isSprinting ? 1.35 : 1.0);
    } else {
      this.bobY    *= 0.82;
      this.bobTime *= 0.95;
      if (Math.abs(this.bobY) < 0.0005) this.bobY = 0;
    }

    // ── Stamina ───────────────────────────────────────────────────────────────
    if (this.isSprinting) {
      this.sp = Math.max(0, this.sp - this.SP_DRAIN * dt);
    } else if (!(wantSprint && this.sp === 0)) {
      this.sp = Math.min(this.maxSp, this.sp + this.SP_REGEN * dt);
    }

    // ── Magic regen ───────────────────────────────────────────────────────────
    this.mp = Math.min(this.maxMp, this.mp + this.MP_REGEN * dt);

    // ── Attack ────────────────────────────────────────────────────────────────
    if (this.isRanged) {
      // Ranged: hold LMB to draw, release to fire
      if (this.rangedCooldown > 0) {
        this.rangedCooldown -= dt;
        this.isDrawing = false;
        this.drawTimer = 0;
      } else if (this._lmb && this.sp >= 5) {
        // Drawing the bow
        this.isDrawing = true;
        this.drawTimer = Math.min(this.drawTimer + dt, this.drawTime);
      } else if (this.isDrawing && !this._lmb) {
        // Released — fire if draw is at least 30%
        const drawPct = this.drawTimer / this.drawTime;
        if (drawPct >= 0.30) {
          this._wantsShoot = true;
          this._lastDrawPct = drawPct; // preserve for fireArrow()
          this.sp = Math.max(0, this.sp - 5);
          this.rangedCooldown = 0.2; // brief post-fire delay
        }
        this.isDrawing = false;
        this.drawTimer = 0;
      }
      // Keep melee attack state clear
      this.isAttacking = false;
      this._hitDealt = false;
    } else {
      // Melee attack
      this.isDrawing = false;
      this.drawTimer = 0;
      if (this.attackTimer > 0) {
        this.attackTimer -= dt;
        this.isAttacking  = true;
      } else {
        this.isAttacking = false;
        this._hitDealt   = false;
      }
      // LMB triggers attack if not on cooldown and have enough stamina
      if (this._lmb && this.attackTimer <= 0 && this.sp >= 8) {
        this.attackTimer = this.attackCooldown;
        this.isAttacking = true;
        this.sp          = Math.max(0, this.sp - 8);
      }
    }

    // ── Camera ────────────────────────────────────────────────────────────────
    this.camera.position.set(
      this.position.x,
      this.position.y + this.EYE_HEIGHT + this.bobY,
      this.position.z
    );
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;
  }
}
