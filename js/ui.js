'use strict';

// ── UI ──────────────────────────────────────────────────────────────────────
// Manages all HTML-overlay HUD elements: resource bars, compass, sprint flag.
// Reads player state each frame; never modifies it.

class UI {

  constructor(player) {
    this.player = player;

    this.hpFill   = document.getElementById('hp-fill');
    this.spFill   = document.getElementById('sp-fill');
    this.mpFill   = document.getElementById('mp-fill');
    this.sprintEl = document.getElementById('sprint-indicator');
    this.strip    = document.getElementById('compass-strip');

    // XP bar
    this.xpFill    = document.getElementById('xp-fill');
    this.xpText    = document.getElementById('xp-text');
    this.levelBadge = document.getElementById('level-badge');

    this._buildCompassStrip();
  }

  // ── Compass strip ──────────────────────────────────────────────────────────
  // The 300-px-wide compass viewport scrolls over a 900-px strip (3 reps).
  // Each rep maps 360° → 300 px  (37.5 px per 45° tick).
  //
  // Direction mapping  (yaw = 0 → N):
  //   fraction = ((-yaw) / 2π)  mod 1      where 0 = N, 0.25 = E, 0.5 = S, 0.75 = W
  //   strip.left = -150 - fraction * 300   (keeps current direction centred)

  _buildCompassStrip() {
    const labels = ['N','NE','E','SE','S','SW','W','NW'];
    const repW   = 300;                    // pixels per 360°
    const tickW  = repW / labels.length;   // 37.5 px per tick

    let html = '';
    for (let rep = 0; rep < 3; rep++) {
      for (let i = 0; i < labels.length; i++) {
        const x        = rep * repW + i * tickW;
        const cardinal = i % 2 === 0;
        const color    = cardinal ? '#f59e0b' : 'rgba(255,255,255,0.60)';
        const size     = cardinal ? '12'       : '10';
        const weight   = cardinal ? 'bold'     : 'normal';
        html +=
          `<span style="position:absolute;left:${x}px;top:50%;transform:translate(-50%,-50%);` +
          `color:${color};font-size:${size}px;font-weight:${weight};` +
          `font-family:Georgia,serif;letter-spacing:1px">${labels[i]}</span>`;
      }
    }
    this.strip.innerHTML = html;
  }

  // ── Per-frame update ───────────────────────────────────────────────────────

  update() {
    const p = this.player;

    // Resource bars
    this.hpFill.style.width = (p.hp / p.maxHp * 100).toFixed(1) + '%';
    this.spFill.style.width = (p.sp / p.maxSp * 100).toFixed(1) + '%';
    this.mpFill.style.width = (p.mp / p.maxMp * 100).toFixed(1) + '%';

    // Sprint indicator
    this.sprintEl.classList.toggle('active', p.isSprinting);

    // XP bar
    const xpNeeded = p.xpToNext();
    const xpPct = p.level >= p.maxLevel ? 100 : (p.xp / xpNeeded * 100);
    this.xpFill.style.width = xpPct.toFixed(1) + '%';
    this.xpText.textContent = p.level >= p.maxLevel ? 'MAX' : p.xp + ' / ' + xpNeeded;
    this.levelBadge.textContent = 'Lv ' + p.level;

    // Compass scroll
    const fraction = ((-p.yaw / (Math.PI * 2)) % 1 + 1) % 1;
    this.strip.style.left = (-150 - fraction * 300) + 'px';
  }
}
