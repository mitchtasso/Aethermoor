'use strict';

// ── Quest Database ──────────────────────────────────────────────────────────

const QUEST_DATA = {

  wolf_bounty: {
    id: 'wolf_bounty',
    title: 'The Wolf Problem',
    giver: 'Captain Aldric',
    region: 'Greenvale',
    level: 1,
    type: 'main',
    description: 'Captain Aldric has asked you to deal with the wolves terrorizing the farms around Millhaven. Kill 4 wolves and return to him for your reward.',
    objectives: [
      { type: 'kill', target: 'wolf', required: 4, label: 'Kill wolves' },
      { type: 'talk', target: 'guard_millhaven', label: 'Return to Captain Aldric' },
    ],
    rewards: { xp: 150, gold: 75, items: ['potion_health', 'potion_health'] },
  },

  thornwood_road: {
    id: 'thornwood_road',
    title: 'Road to Briarwatch',
    giver: 'Marta',
    region: 'Greenvale',
    level: 3,
    type: 'main',
    description: 'The innkeeper Marta mentioned that Briarwatch in Thornwood is in trouble. Travel east through the forest and find the town.',
    objectives: [
      { type: 'reach', x: 180, z: -50, radius: 25, label: 'Reach Briarwatch' },
      { type: 'talk', target: 'innkeeper_briarwatch', label: 'Speak to the Briarwatch innkeeper' },
    ],
    rewards: { xp: 100, gold: 40 },
  },

  wolf_road_clear: {
    id: 'wolf_road_clear',
    title: 'Clear the Road',
    giver: 'Oswin',
    region: 'Thornwood',
    level: 5,
    type: 'side',
    description: 'Wolves have made the road between Millhaven and Briarwatch dangerous. Clear out the wolves along the Thornwood road.',
    objectives: [
      { type: 'kill', target: 'wolf', required: 8, label: 'Kill wolves (total)' },
    ],
    rewards: { xp: 200, gold: 100, items: ['sword_steel'] },
  },

  // ── Ashfeld Quests ─────────────────────────────────────────────────────────

  ashfeld_imps: {
    id: 'ashfeld_imps',
    title: 'Scorched Supply Lines',
    giver: 'Captain Rolf',
    region: 'Ashfeld',
    level: 8,
    type: 'main',
    description: 'Captain Rolf needs the fire imp threat dealt with. The creatures have been raiding Cinderhearth\'s ore caravans from the south. Kill 6 fire imps in the Ashfeld foothills.',
    objectives: [
      { type: 'kill', target: 'fire_imp', required: 6, label: 'Kill fire imps' },
      { type: 'talk', target: 'guard_cinderhearth', label: 'Return to Captain Rolf' },
    ],
    rewards: { xp: 350, gold: 150, items: ['potion_health', 'potion_health', 'potion_magic'] },
  },

  ashfeld_golem: {
    id: 'ashfeld_golem',
    title: 'Heart of Magma',
    giver: 'Varn',
    region: 'Ashfeld',
    level: 12,
    type: 'side',
    description: 'The Forgemaster Varn seeks molten cores from the Magma Golems to fuel the master forge. Slay 3 golems in the deeper volcanic fields.',
    objectives: [
      { type: 'kill', target: 'magma_golem', required: 3, label: 'Kill magma golems' },
    ],
    rewards: { xp: 450, gold: 200, items: ['sword_volcanic'] },
  },

  // ── Frostveil Quests ───────────────────────────────────────────────────────

  frostveil_wraiths: {
    id: 'frostveil_wraiths',
    title: 'Disrupted Ley Lines',
    giver: 'Archmage Lyris',
    region: 'Frostveil',
    level: 14,
    type: 'main',
    description: 'Archmage Lyris of the Winterhold Academy needs ice wraiths destroyed to stabilize the ley lines. Kill 5 ice wraiths in the Frostveil peaks.',
    objectives: [
      { type: 'kill', target: 'ice_wraith', required: 5, label: 'Kill ice wraiths' },
      { type: 'talk', target: 'archmage_winterhold', label: 'Return to Archmage Lyris' },
    ],
    rewards: { xp: 550, gold: 250, items: ['staff_frost'] },
  },

  frostveil_wolves: {
    id: 'frostveil_wolves',
    title: 'Howls in the Snow',
    giver: 'Helga',
    region: 'Frostveil',
    level: 12,
    type: 'side',
    description: 'Frost wolves have been circling Winterhold Keep, picking off travelers. Helga asks you to thin their numbers. Kill 6 frost wolves.',
    objectives: [
      { type: 'kill', target: 'frost_wolf', required: 6, label: 'Kill frost wolves' },
    ],
    rewards: { xp: 400, gold: 180, items: ['helm_frost'] },
  },

  // ── The Blight Quests ──────────────────────────────────────────────────────

  blight_knights: {
    id: 'blight_knights',
    title: 'Fallen Soldiers',
    giver: 'Commander Thane',
    region: 'The Blight',
    level: 20,
    type: 'main',
    description: 'Commander Thane\'s garrison is under siege by Corrupted Knights — soldiers lost to the Blight. Destroy 4 of them to relieve the pressure on Duskspire.',
    objectives: [
      { type: 'kill', target: 'corrupted_knight', required: 4, label: 'Kill corrupted knights' },
      { type: 'talk', target: 'commander_duskspire', label: 'Return to Commander Thane' },
    ],
    rewards: { xp: 800, gold: 400, items: ['chest_dark'] },
  },

  blight_hounds: {
    id: 'blight_hounds',
    title: 'Corruption\'s Teeth',
    giver: 'Mordren',
    region: 'The Blight',
    level: 18,
    type: 'side',
    description: 'Blight Hounds prowl the wastes around Duskspire, making it impossible to forage. Kill 5 of the beasts.',
    objectives: [
      { type: 'kill', target: 'blight_hound', required: 5, label: 'Kill blight hounds' },
    ],
    rewards: { xp: 500, gold: 250, items: ['sword_dark'] },
  },
};

// ── Quest Manager ───────────────────────────────────────────────────────────

class QuestManager {

  constructor() {
    // Active quests: { questId: { progress: [{current, complete}...], turnedIn: false } }
    this.active    = {};
    this.completed = [];
    this.tracked   = null; // quest id shown on compass

    // Global kill counters (persist across quests)
    this.kills = {};

    // UI
    this.isOpen      = false;
    this._questList  = document.getElementById('quest-list');
    this._questDetail = document.getElementById('quest-detail');
    this._selected   = null; // quest id

    this._bindEvents();
  }

  // ── Quest lifecycle ───────────────────────────────────────────────────────

  accept(questId) {
    if (this.active[questId] || this.completed.includes(questId)) return false;
    const def = QUEST_DATA[questId];
    if (!def) return false;

    const progress = def.objectives.map(obj => ({
      current: 0,
      complete: false,
    }));

    this.active[questId] = { progress, turnedIn: false };
    if (!this.tracked) this.tracked = questId;
    return true;
  }

  isActive(questId) { return !!this.active[questId]; }
  isComplete(questId) { return this.completed.includes(questId); }

  // Check if all objectives for a quest are done
  allObjectivesMet(questId) {
    const state = this.active[questId];
    if (!state) return false;
    return state.progress.every(p => p.complete);
  }

  // ── Event hooks (called by game systems) ──────────────────────────────────

  onKill(enemyType) {
    this.kills[enemyType] = (this.kills[enemyType] || 0) + 1;

    for (const [qid, state] of Object.entries(this.active)) {
      const def = QUEST_DATA[qid];
      def.objectives.forEach((obj, i) => {
        if (obj.type === 'kill' && obj.target === enemyType && !state.progress[i].complete) {
          state.progress[i].current = this.kills[enemyType];
          if (state.progress[i].current >= obj.required) {
            state.progress[i].complete = true;
          }
        }
      });
    }
  }

  onTalk(npcId) {
    for (const [qid, state] of Object.entries(this.active)) {
      const def = QUEST_DATA[qid];
      def.objectives.forEach((obj, i) => {
        if (obj.type === 'talk' && obj.target === npcId && !state.progress[i].complete) {
          // Talk objectives require all prior objectives to be complete
          const priorDone = state.progress.slice(0, i).every(p => p.complete);
          if (priorDone) {
            state.progress[i].complete = true;
          }
        }
      });
    }
  }

  onReach(playerX, playerZ) {
    for (const [qid, state] of Object.entries(this.active)) {
      const def = QUEST_DATA[qid];
      def.objectives.forEach((obj, i) => {
        if (obj.type === 'reach' && !state.progress[i].complete) {
          const dx = playerX - obj.x;
          const dz = playerZ - obj.z;
          if (Math.sqrt(dx * dx + dz * dz) < obj.radius) {
            state.progress[i].complete = true;
          }
        }
      });
    }
  }

  // Turn in a completed quest — returns rewards or null
  turnIn(questId) {
    if (!this.allObjectivesMet(questId)) return null;
    const def   = QUEST_DATA[questId];
    const state = this.active[questId];
    if (!state || state.turnedIn) return null;

    state.turnedIn = true;
    delete this.active[questId];
    this.completed.push(questId);
    if (this.tracked === questId) {
      // Track next active quest or null
      const remaining = Object.keys(this.active);
      this.tracked = remaining.length > 0 ? remaining[0] : null;
    }

    return def.rewards;
  }

  // ── Tracked quest info for compass ────────────────────────────────────────

  getTrackedObjective() {
    if (!this.tracked) return null;
    const def   = QUEST_DATA[this.tracked];
    const state = this.active[this.tracked];
    if (!def || !state) return null;

    // Find first incomplete objective
    for (let i = 0; i < def.objectives.length; i++) {
      if (!state.progress[i].complete) {
        const obj = def.objectives[i];
        let label = obj.label;

        if (obj.type === 'kill') {
          label += ` (${Math.min(state.progress[i].current, obj.required)}/${obj.required})`;
        }

        // Position for compass marker
        let x = null, z = null;
        if (obj.type === 'reach') { x = obj.x; z = obj.z; }
        if (obj.type === 'talk') {
          const npcData = NPC_DATA[obj.target];
          if (npcData) { x = npcData.position[0]; z = npcData.position[1]; }
        }

        return { label, x, z, questTitle: def.title };
      }
    }
    return null;
  }

  // ── UI ────────────────────────────────────────────────────────────────────

  open() {
    this.isOpen = true;
    this._selected = this.tracked || Object.keys(this.active)[0] || null;
    this._render();
  }

  close() {
    this.isOpen = false;
  }

  _render() {
    this._renderList();
    this._renderDetail();
  }

  _renderList() {
    let html = '';
    // Active quests
    for (const qid of Object.keys(this.active)) {
      const def = QUEST_DATA[qid];
      const sel = this._selected === qid ? 'quest-item-selected' : '';
      const tracked = this.tracked === qid ? '<span class="quest-tracked-tag">◆</span>' : '';
      const typeColor = def.type === 'main' ? '#f59e0b' : '#3b82f6';
      html += `<div class="quest-item ${sel}" data-id="${qid}">` +
        `${tracked}<span class="quest-item-name" style="border-left:2px solid ${typeColor};padding-left:8px">${def.title}</span>` +
        `</div>`;
    }
    // Completed
    for (const qid of this.completed) {
      const def = QUEST_DATA[qid];
      html += `<div class="quest-item quest-item-done" data-id="${qid}">` +
        `<span class="quest-item-name" style="opacity:0.4">${def.title} ✓</span>` +
        `</div>`;
    }
    if (!html) html = '<div class="quest-empty">No quests</div>';
    this._questList.innerHTML = html;
  }

  _renderDetail() {
    const qid = this._selected;
    if (!qid) {
      this._questDetail.innerHTML = '<div class="quest-empty">Select a quest</div>';
      return;
    }

    const def     = QUEST_DATA[qid];
    const state   = this.active[qid];
    const done    = this.completed.includes(qid);
    const typeLabel = def.type === 'main' ? 'Main Quest' : 'Side Quest';
    const typeColor = def.type === 'main' ? '#f59e0b' : '#3b82f6';

    let objHtml = '';
    for (let i = 0; i < def.objectives.length; i++) {
      const obj = def.objectives[i];
      const p   = state ? state.progress[i] : { complete: done, current: obj.required || 0 };
      const check = p.complete ? '☑' : '☐';
      const color = p.complete ? 'rgba(100,255,100,0.7)' : 'rgba(255,255,255,0.55)';
      let label = obj.label;
      if (obj.type === 'kill') {
        const cur = Math.min(p.current || 0, obj.required);
        label += ` (${cur}/${obj.required})`;
      }
      objHtml += `<div style="color:${color};padding:3px 0;font-size:11px">${check} ${label}</div>`;
    }

    let rewardHtml = '';
    if (def.rewards.xp)   rewardHtml += `<span style="color:#a855f7">${def.rewards.xp} XP</span> `;
    if (def.rewards.gold) rewardHtml += `<span style="color:#f59e0b">${def.rewards.gold} Gold</span> `;
    if (def.rewards.items) {
      for (const id of def.rewards.items) {
        const item = ITEMS[id];
        if (item) rewardHtml += `<span style="color:${RARITY_COLORS[item.rarity]}">${item.name}</span> `;
      }
    }

    let trackBtn = '';
    if (state && !done) {
      const isTracked = this.tracked === qid;
      trackBtn = `<button class="quest-btn" data-action="track" data-id="${qid}">${isTracked ? 'Tracking ◆' : 'Track'}</button>`;
    }

    this._questDetail.innerHTML =
      `<div class="quest-detail-type" style="color:${typeColor}">${typeLabel} — Lv.${def.level}</div>` +
      `<div class="quest-detail-title">${def.title}</div>` +
      `<div class="quest-detail-giver">From: ${def.giver} (${def.region})</div>` +
      `<div class="quest-detail-desc">${def.description}</div>` +
      `<div class="quest-detail-section">Objectives</div>` +
      `${objHtml}` +
      `<div class="quest-detail-section" style="margin-top:10px">Rewards</div>` +
      `<div style="font-size:11px">${rewardHtml}</div>` +
      `<div style="margin-top:12px">${trackBtn}</div>`;
  }

  _bindEvents() {
    this._questList.addEventListener('click', e => {
      const el = e.target.closest('.quest-item');
      if (!el) return;
      this._selected = el.dataset.id;
      this._render();
    });

    this._questDetail.addEventListener('click', e => {
      const btn = e.target.closest('.quest-btn');
      if (!btn) return;
      if (btn.dataset.action === 'track') {
        this.tracked = btn.dataset.id;
        this._render();
      }
    });
  }
}
