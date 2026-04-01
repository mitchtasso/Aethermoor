'use strict';

// ═══════════════════════════════════════════════════════════════════════════
// SAVE MANAGER — localStorage-based persistence
// ═══════════════════════════════════════════════════════════════════════════

const SAVE_KEY = 'aethermoor_save_v1';

const SaveManager = {

  // ── Gather all game state into a serializable object ────────────────────
  serialize(player, inventory, quests, magic) {
    return {
      version: 1,
      timestamp: Date.now(),

      // World
      gameTime: typeof gameTime !== 'undefined' ? gameTime : 8.0,

      // Player
      player: {
        x: player.position.x,
        y: player.position.y,
        z: player.position.z,
        yaw: player.yaw,
        pitch: player.pitch,
        level: player.level,
        xp: player.xp,
        statPoints: player.statPoints,
        str: player.str,
        agi: player.agi,
        end: player.end,
        int: player.int,
        wil: player.wil,
        per: player.per,
        baseHp: player.baseHp,
        baseSp: player.baseSp,
        baseMp: player.baseMp,
        hp: player.hp,
        sp: player.sp,
        mp: player.mp,
      },

      // Inventory
      inventory: {
        items: inventory.items.map(s => ({ id: s.id, count: s.count })),
        equipped: { ...inventory.equipped },
        hotbar: [...inventory.hotbar],
        gold: inventory.gold,
      },

      // Quests
      quests: {
        active: {},
        completed: [...quests.completed],
        kills: { ...quests.kills },
        tracked: quests.tracked,
      },

      // Magic
      magic: {
        known: [...magic.known],
        leftSpell: magic.leftSpell,
        rightSpell: magic.rightSpell,
      },
    };
  },

  // ── Save to localStorage ───────────────────────────────────────────────
  save(player, inventory, quests, magic) {
    const data = this.serialize(player, inventory, quests, magic);

    // Deep-copy quest active state (progress arrays)
    for (const [qid, state] of Object.entries(quests.active)) {
      data.quests.active[qid] = {
        progress: state.progress.map(p => ({ current: p.current, complete: p.complete })),
        turnedIn: state.turnedIn,
      };
    }

    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('Save failed:', e);
      return false;
    }
  },

  // ── Load from localStorage ─────────────────────────────────────────────
  load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (!data || data.version !== 1) return null;
      return data;
    } catch (e) {
      console.error('Load failed:', e);
      return null;
    }
  },

  // ── Apply loaded data to game objects ──────────────────────────────────
  apply(data, player, inventory, quests, magic) {
    if (!data) return false;

    // World time
    if (typeof gameTime !== 'undefined' && data.gameTime != null) {
      gameTime = data.gameTime;
    }

    // Player
    const p = data.player;
    player.position.set(p.x, p.y, p.z);
    player.yaw   = p.yaw;
    player.pitch = p.pitch;
    player.level = p.level;
    player.xp    = p.xp;
    player.statPoints = p.statPoints;
    player.str = p.str;
    player.agi = p.agi;
    player.end = p.end;
    player.int = p.int;
    player.wil = p.wil;
    player.per = p.per;
    player.baseHp = p.baseHp;
    player.baseSp = p.baseSp;
    player.baseMp = p.baseMp;
    player.recalcDerived();
    player.hp = p.hp;
    player.sp = p.sp;
    player.mp = p.mp;

    // Inventory
    const inv = data.inventory;
    inventory.items = inv.items.map(s => ({ id: s.id, count: s.count }));
    inventory.equipped = { ...inv.equipped };
    inventory.hotbar = [...inv.hotbar];
    inventory.gold = inv.gold;
    // Recalculate armor/weapon damage from equipped items
    inventory._applyStats();

    // Quests
    const q = data.quests;
    quests.active = {};
    for (const [qid, state] of Object.entries(q.active)) {
      quests.active[qid] = {
        progress: state.progress.map(p => ({ current: p.current, complete: p.complete })),
        turnedIn: state.turnedIn,
      };
    }
    quests.completed = [...q.completed];
    quests.kills = { ...q.kills };
    quests.tracked = q.tracked;

    // Magic
    const m = data.magic;
    magic.known = [...m.known];
    magic.leftSpell = m.leftSpell;
    magic.rightSpell = m.rightSpell;

    return true;
  },

  // ── Check if a save exists ─────────────────────────────────────────────
  hasSave() {
    return localStorage.getItem(SAVE_KEY) !== null;
  },

  // ── Delete save ────────────────────────────────────────────────────────
  deleteSave() {
    localStorage.removeItem(SAVE_KEY);
  },

  // ── Get save info (for display) ────────────────────────────────────────
  getSaveInfo() {
    const data = this.load();
    if (!data) return null;
    return {
      level: data.player.level,
      gold: data.inventory.gold,
      timestamp: data.timestamp,
    };
  },
};
