'use strict';

// ── Inventory System ────────────────────────────────────────────────────────
// Manages player inventory, equipment, hotbar, and the inventory UI overlay.

class Inventory {

  constructor(player) {
    this.player = player;

    // Items: array of { id, count }
    this.items = [];

    // Equipment slots
    this.equipped = {
      head:      null,  // item id
      chest:     null,
      hands:     null,
      feet:      null,
      rightHand: null,  // weapon
      leftHand:  null,  // shield / spell
      amulet:    null,
      ring1:     null,
      ring2:     null,
    };

    // Hotbar: 4 slots for potions/consumables (item ids or null)
    this.hotbar = [null, null, null, null];

    // Gold
    this.gold = 50;

    // Carry weight
    this.maxWeight = 100;

    // UI state
    this.isOpen   = false;
    this._tab     = 'all'; // 'all' | 'weapons' | 'armor' | 'potions' | 'materials'
    this._selected = null;  // index into this.items

    // Cache DOM
    this._itemList  = document.getElementById('inv-item-list');
    this._detail    = document.getElementById('inv-detail');
    this._equipList = document.getElementById('inv-equip-list');
    this._goldEl    = document.getElementById('inv-gold');
    this._weightEl  = document.getElementById('inv-weight');
    this._tabs      = document.querySelectorAll('.inv-tab');

    this._bindEvents();

    // Give starter gear
    this.addItem('sword_iron');
    this.addItem('potion_health', 3);
    this.addItem('tome_firebolt');
    this.addItem('bow_short');
    this.addItem('arrow', 20);
    this.equip('sword_iron');
  }

  // ── Item management ───────────────────────────────────────────────────────

  addItem(id, count = 1) {
    const def = ITEMS[id];
    if (!def) return false;
    const existing = this.items.find(s => s.id === id);
    if (existing) {
      existing.count += count;
    } else {
      this.items.push({ id, count });
    }
    return true;
  }

  removeItem(id, count = 1) {
    const idx = this.items.findIndex(s => s.id === id);
    if (idx === -1) return false;
    this.items[idx].count -= count;
    if (this.items[idx].count <= 0) {
      this.items.splice(idx, 1);
      if (this._selected >= this.items.length) this._selected = null;
    }
    return true;
  }

  hasItem(id) {
    const s = this.items.find(s => s.id === id);
    return s ? s.count : 0;
  }

  currentWeight() {
    let w = 0;
    for (const s of this.items) {
      const def = ITEMS[s.id];
      if (def) w += def.weight * s.count;
    }
    return w;
  }

  // ── Equipment ─────────────────────────────────────────────────────────────

  equip(id) {
    const def = ITEMS[id];
    if (!def) return;
    if (!this.hasItem(id)) return;

    let slot = null;
    if (def.type === 'weapon')  slot = 'rightHand';
    else if (def.type === 'shield') slot = 'leftHand';
    else if (def.type === 'armor')  slot = def.slot;
    if (!slot) return;

    // Unequip current if occupied
    if (this.equipped[slot]) {
      this.unequip(slot);
    }

    this.equipped[slot] = id;
    this._applyStats();
  }

  unequip(slot) {
    if (!this.equipped[slot]) return;
    this.equipped[slot] = null;
    this._applyStats();
  }

  _applyStats() {
    let totalArmor = 0;
    let weaponDmg  = 15; // base fist damage

    for (const [slot, id] of Object.entries(this.equipped)) {
      if (!id) continue;
      const def = ITEMS[id];
      if (!def) continue;
      if (def.armor)  totalArmor += def.armor;
      if (def.damage && slot === 'rightHand') weaponDmg = def.damage;
    }

    // Check if weapon is ranged
    const wpnId = this.equipped.rightHand;
    const wpnDef = wpnId ? ITEMS[wpnId] : null;
    if (wpnDef && wpnDef.subtype === 'ranged') {
      this.player.isRanged = true;
      this.player.rangedDamage = wpnDef.damage;
      this.player.drawTime = wpnDef.drawTime || 0.6;
      this.player.projectileSpeed = wpnDef.projectileSpeed || 55;
      this.player.ammoType = wpnDef.ammoType || 'arrow';
      this.player.attackDamage = wpnDef.damage; // for display
    } else {
      this.player.isRanged = false;
      this.player.rangedDamage = 0;
      this.player.ammoType = null;
      this.player.attackDamage = weaponDmg;
    }

    this.player.armor = totalArmor;
  }

  // ── Hotbar ────────────────────────────────────────────────────────────────

  assignHotbar(slotIndex, itemId) {
    if (slotIndex < 0 || slotIndex > 3) return;
    const def = ITEMS[itemId];
    if (!def || def.type !== 'potion') return;
    this.hotbar[slotIndex] = itemId;
  }

  useHotbar(slotIndex) {
    const id = this.hotbar[slotIndex];
    if (!id) return;
    if (!this.hasItem(id)) { this.hotbar[slotIndex] = null; return; }

    const def = ITEMS[id];
    if (def.type === 'potion') {
      if (def.restores === 'hp') this.player.hp = Math.min(this.player.maxHp, this.player.hp + def.amount);
      if (def.restores === 'sp') this.player.sp = Math.min(this.player.maxSp, this.player.sp + def.amount);
      if (def.restores === 'mp') this.player.mp = Math.min(this.player.maxMp, this.player.mp + def.amount);
      this.removeItem(id, 1);
      if (!this.hasItem(id)) this.hotbar[slotIndex] = null;
    }
  }

  // ── UI Toggle ─────────────────────────────────────────────────────────────

  open() {
    this.isOpen = true;
    this._selected = null;
    this._render();
  }

  close() {
    this.isOpen = false;
  }

  // ── UI Rendering ──────────────────────────────────────────────────────────

  _render() {
    this._renderItems();
    this._renderDetail();
    this._renderEquipment();
    this._goldEl.textContent = this.gold;
    const cw = this.currentWeight().toFixed(1);
    this._weightEl.textContent = cw + ' / ' + this.maxWeight;
  }

  _filteredItems() {
    return this.items.filter(s => {
      const def = ITEMS[s.id];
      if (!def) return false;
      if (this._tab === 'all') return true;
      if (this._tab === 'weapons') return def.type === 'weapon' || def.type === 'shield' || def.type === 'ammo';
      if (this._tab === 'armor') return def.type === 'armor';
      if (this._tab === 'potions') return def.type === 'potion';
      if (this._tab === 'materials') return def.type === 'material' || def.type === 'misc';
      return true;
    });
  }

  _renderItems() {
    const filtered = this._filteredItems();
    let html = '';
    for (let i = 0; i < this.items.length; i++) {
      const s = this.items[i];
      const def = ITEMS[s.id];
      if (!def) continue;

      // Apply tab filter
      if (this._tab !== 'all') {
        if (this._tab === 'weapons' && def.type !== 'weapon' && def.type !== 'shield' && def.type !== 'ammo') continue;
        if (this._tab === 'armor' && def.type !== 'armor') continue;
        if (this._tab === 'potions' && def.type !== 'potion') continue;
        if (this._tab === 'materials' && def.type !== 'material' && def.type !== 'misc') continue;
      }

      const color = RARITY_COLORS[def.rarity] || '#ccc';
      const sel   = this._selected === i ? 'inv-item-selected' : '';
      const eqTag = this._isEquipped(s.id) ? '<span class="inv-eq-tag">E</span>' : '';

      html += `<div class="inv-item ${sel}" data-idx="${i}">` +
        `<span class="inv-item-name" style="color:${color}">${def.name}</span>` +
        `${eqTag}` +
        `<span class="inv-item-count">${s.count > 1 ? 'x' + s.count : ''}</span>` +
        `</div>`;
    }
    if (!html) html = '<div class="inv-empty">No items</div>';
    this._itemList.innerHTML = html;
  }

  _renderDetail() {
    if (this._selected === null || !this.items[this._selected]) {
      this._detail.innerHTML = '<div class="inv-detail-empty">Select an item</div>';
      return;
    }
    const s   = this.items[this._selected];
    const def = ITEMS[s.id];
    const color = RARITY_COLORS[def.rarity] || '#ccc';
    const isEq  = this._isEquipped(s.id);

    let stats = '';
    if (def.damage) stats += `<div class="inv-stat">Damage: ${def.damage}</div>`;
    if (def.bonusDamage) stats += `<div class="inv-stat">Bonus Damage: +${def.bonusDamage}</div>`;
    if (def.armor)  stats += `<div class="inv-stat">Armor: ${def.armor}</div>`;
    if (def.drawTime) stats += `<div class="inv-stat">Draw Time: ${def.drawTime}s</div>`;
    if (def.ammoType && def.type === 'weapon') stats += `<div class="inv-stat">Ammo: ${def.ammoType}s</div>`;
    if (def.amount) stats += `<div class="inv-stat">Restores: ${def.amount} ${(def.restores || '').toUpperCase()}</div>`;
    stats += `<div class="inv-stat">Weight: ${def.weight}</div>`;
    stats += `<div class="inv-stat">Value: ${def.value} gold</div>`;

    let actions = '';
    if (def.type === 'weapon' || def.type === 'shield' || def.type === 'armor') {
      if (isEq) {
        const slot = def.type === 'weapon' ? 'rightHand' : def.type === 'shield' ? 'leftHand' : def.slot;
        actions = `<button class="inv-btn" data-action="unequip" data-slot="${slot}">Unequip</button>`;
      } else {
        actions = `<button class="inv-btn" data-action="equip" data-id="${s.id}">Equip</button>`;
      }
    }
    if (def.type === 'potion') {
      actions = `<button class="inv-btn" data-action="use" data-id="${s.id}">Use</button>`;
      for (let h = 0; h < 4; h++) {
        actions += `<button class="inv-btn inv-btn-sm" data-action="hotbar" data-id="${s.id}" data-slot="${h}">${h + 1}</button>`;
      }
    }
    if (def.type === 'spelltome') {
      actions = `<button class="inv-btn" data-action="use" data-id="${s.id}">Learn Spell</button>`;
    }
    if (def.type !== 'quest') {
      actions += `<button class="inv-btn inv-btn-drop" data-action="drop" data-id="${s.id}">Drop</button>`;
    }

    this._detail.innerHTML =
      `<div class="inv-detail-name" style="color:${color}">${def.name}</div>` +
      `<div class="inv-detail-rarity" style="color:${color}">${def.rarity}</div>` +
      `<div class="inv-detail-type">${def.type}${def.subtype ? ' — ' + def.subtype : ''}</div>` +
      `<div class="inv-detail-desc">${def.description}</div>` +
      `<div class="inv-detail-stats">${stats}</div>` +
      `<div class="inv-detail-actions">${actions}</div>`;
  }

  _renderEquipment() {
    const slots = ['head', 'chest', 'hands', 'feet', 'rightHand', 'leftHand'];
    const labels = { head: 'Head', chest: 'Chest', hands: 'Hands', feet: 'Feet', rightHand: 'Weapon', leftHand: 'Off-Hand' };
    let html = '';
    for (const slot of slots) {
      const id  = this.equipped[slot];
      const def = id ? ITEMS[id] : null;
      const color = def ? (RARITY_COLORS[def.rarity] || '#ccc') : '#555';
      const name  = def ? def.name : '—';
      html += `<div class="inv-equip-slot">` +
        `<span class="inv-equip-label">${labels[slot]}</span>` +
        `<span class="inv-equip-name" style="color:${color}">${name}</span>` +
        `</div>`;
    }
    this._equipList.innerHTML = html;
  }

  _isEquipped(id) {
    return Object.values(this.equipped).includes(id);
  }

  // ── Events ────────────────────────────────────────────────────────────────

  _bindEvents() {
    // Item list clicks
    this._itemList.addEventListener('click', e => {
      const el = e.target.closest('.inv-item');
      if (!el) return;
      this._selected = parseInt(el.dataset.idx);
      this._render();
    });

    // Action buttons
    this._detail.addEventListener('click', e => {
      const btn = e.target.closest('.inv-btn');
      if (!btn) return;
      const action = btn.dataset.action;

      if (action === 'equip')   { this.equip(btn.dataset.id); }
      if (action === 'unequip') { this.unequip(btn.dataset.slot); }
      if (action === 'use')     { this._useItem(btn.dataset.id); }
      if (action === 'drop')    { this.removeItem(btn.dataset.id, 1); }
      if (action === 'hotbar')  { this.assignHotbar(parseInt(btn.dataset.slot), btn.dataset.id); }

      this._render();
      this._updateHotbarUI();
    });

    // Tab clicks
    for (const tab of this._tabs) {
      tab.addEventListener('click', () => {
        this._tab = tab.dataset.tab;
        for (const t of this._tabs) t.classList.toggle('inv-tab-active', t === tab);
        this._selected = null;
        this._render();
      });
    }
  }

  _useItem(id) {
    const def = ITEMS[id];
    if (!def) return;

    if (def.type === 'potion') {
      if (def.restores === 'hp') this.player.hp = Math.min(this.player.maxHp, this.player.hp + def.amount);
      if (def.restores === 'sp') this.player.sp = Math.min(this.player.maxSp, this.player.sp + def.amount);
      if (def.restores === 'mp') this.player.mp = Math.min(this.player.maxMp, this.player.mp + def.amount);
      this.removeItem(id, 1);
    }

    if (def.type === 'spelltome' && def.spell) {
      // magic manager is a global — set in game.js
      if (typeof magic !== 'undefined' && magic.learnSpell(def.spell)) {
        this.removeItem(id, 1);
      }
    }
  }

  // ── Hotbar UI (HUD) ──────────────────────────────────────────────────────

  _updateHotbarUI() {
    for (let i = 0; i < 4; i++) {
      const el = document.getElementById('hotbar-' + i);
      if (!el) continue;
      const id  = this.hotbar[i];
      const def = id ? ITEMS[id] : null;
      if (def && this.hasItem(id)) {
        el.innerHTML = `<span class="hb-name">${def.name.split(' ')[0]}</span>` +
          `<span class="hb-count">${"x"+this.hasItem(id)}</span>`;
        el.classList.add('hb-filled');
      } else {
        el.innerHTML = `<span class="hb-key">${i + 1}</span>`;
        el.classList.remove('hb-filled');
      }
    }
  }

  // ── Loot pickup (called when a loot bag is opened) ────────────────────────

  addLoot(itemIds) {
    let goldGain = 0;
    for (const id of itemIds) {
      if (id === 'gold') { goldGain += 5 + Math.floor(Math.random() * 10); continue; }
      this.addItem(id);
    }
    if (goldGain > 0) this.gold += goldGain;
  }
}
