'use strict';

// ═══════════════════════════════════════════════════════════════════════════
// SOUND MANAGER — Procedural Web Audio API sound engine
// No audio files needed — all sounds generated with oscillators + noise.
// ═══════════════════════════════════════════════════════════════════════════

class SoundManager {

  constructor() {
    this.ctx = null;       // AudioContext — created on first user gesture
    this._ready = false;

    // Master volume nodes
    this._masterGain  = null;
    this._sfxGain     = null;
    this._ambientGain = null;
    this._musicGain   = null;

    // Volume levels (0–1)
    this.masterVol  = 0.7;
    this.sfxVol     = 0.8;
    this.ambientVol = 0.5;
    this.musicVol   = 0.3;

    // Ambient state
    this._ambientSources = [];  // active ambient oscillators/noise
    this._currentBiome   = '';

    // Music state
    this._musicOsc   = null;
    this._musicOsc2  = null;
    this._musicLFO   = null;
    this._musicBiome = '';

    // Footstep state
    this._footstepTimer = 0;
    this._footstepRate  = 0.42; // seconds between steps

    // Noise buffer (shared for all noise-based sounds)
    this._noiseBuffer = null;
  }

  // ── Initialization (call on first click/interaction) ─────────────────────
  init() {
    if (this._ready) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio not supported');
      return;
    }

    // Master chain: source → category gain → master gain → destination
    this._masterGain = this.ctx.createGain();
    this._masterGain.gain.value = this.masterVol;
    this._masterGain.connect(this.ctx.destination);

    this._sfxGain = this.ctx.createGain();
    this._sfxGain.gain.value = this.sfxVol;
    this._sfxGain.connect(this._masterGain);

    this._ambientGain = this.ctx.createGain();
    this._ambientGain.gain.value = this.ambientVol;
    this._ambientGain.connect(this._masterGain);

    this._musicGain = this.ctx.createGain();
    this._musicGain.gain.value = this.musicVol;
    this._musicGain.connect(this._masterGain);

    // Pre-generate white noise buffer (2 seconds)
    this._noiseBuffer = this._createNoiseBuffer(2);

    this._ready = true;
  }

  _createNoiseBuffer(seconds) {
    const sr = this.ctx.sampleRate;
    const len = sr * seconds;
    const buf = this.ctx.createBuffer(1, len, sr);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buf;
  }

  // ── Volume setters ───────────────────────────────────────────────────────
  setMasterVolume(v) {
    this.masterVol = v;
    if (this._masterGain) this._masterGain.gain.value = v;
  }
  setSfxVolume(v) {
    this.sfxVol = v;
    if (this._sfxGain) this._sfxGain.gain.value = v;
  }
  setAmbientVolume(v) {
    this.ambientVol = v;
    if (this._ambientGain) this._ambientGain.gain.value = v;
  }
  setMusicVolume(v) {
    this.musicVol = v;
    if (this._musicGain) this._musicGain.gain.value = v;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // COMBAT SFX
  // ═══════════════════════════════════════════════════════════════════════════

  playSwordSwing() {
    if (!this._ready) return;
    const t = this.ctx.currentTime;

    // Whoosh: filtered noise sweep
    const noise = this._makeNoise(0.25);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, t);
    filter.frequency.exponentialRampToValueAtTime(2500, t + 0.12);
    filter.frequency.exponentialRampToValueAtTime(400, t + 0.25);
    filter.Q.value = 2.0;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.35, t + 0.04);
    gain.gain.linearRampToValueAtTime(0, t + 0.25);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this._sfxGain);
    noise.start(t);
    noise.stop(t + 0.25);
  }

  playBowDraw() {
    if (!this._ready) return;
    const t = this.ctx.currentTime;

    // Creak: low sine with slight frequency bend
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.linearRampToValueAtTime(180, t + 0.5);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.12, t + 0.1);
    gain.gain.linearRampToValueAtTime(0.08, t + 0.5);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this._sfxGain);
    osc.start(t);
    osc.stop(t + 0.5);
  }

  playBowRelease() {
    if (!this._ready) return;
    const t = this.ctx.currentTime;

    // Twang: short sine burst + noise
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(350, t);
    osc.frequency.exponentialRampToValueAtTime(120, t + 0.15);

    const oscGain = this.ctx.createGain();
    oscGain.gain.setValueAtTime(0.30, t);
    oscGain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);

    osc.connect(oscGain);
    oscGain.connect(this._sfxGain);
    osc.start(t);
    osc.stop(t + 0.2);

    // Arrow whoosh
    const noise = this._makeNoise(0.18);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 2000;

    const nGain = this.ctx.createGain();
    nGain.gain.setValueAtTime(0.15, t + 0.02);
    nGain.gain.linearRampToValueAtTime(0, t + 0.18);

    noise.connect(filter);
    filter.connect(nGain);
    nGain.connect(this._sfxGain);
    noise.start(t + 0.02);
    noise.stop(t + 0.2);
  }

  playHit() {
    if (!this._ready) return;
    const t = this.ctx.currentTime;

    // Impact: short noise thump
    const noise = this._makeNoise(0.12);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, t);
    filter.frequency.exponentialRampToValueAtTime(200, t + 0.1);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this._sfxGain);
    noise.start(t);
    noise.stop(t + 0.12);
  }

  playEnemyDeath() {
    if (!this._ready) return;
    const t = this.ctx.currentTime;

    // Low thud + descending tone
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.4);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.30, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);

    osc.connect(gain);
    gain.connect(this._sfxGain);
    osc.start(t);
    osc.stop(t + 0.4);

    // Noise layer
    const noise = this._makeNoise(0.3);
    const nGain = this.ctx.createGain();
    nGain.gain.setValueAtTime(0.15, t);
    nGain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 600;

    noise.connect(filter);
    filter.connect(nGain);
    nGain.connect(this._sfxGain);
    noise.start(t);
    noise.stop(t + 0.3);
  }

  playSpellCast() {
    if (!this._ready) return;
    const t = this.ctx.currentTime;

    // Magical shimmer: rising sine + harmonics
    for (let i = 0; i < 3; i++) {
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      const baseFreq = 400 + i * 200;
      osc.frequency.setValueAtTime(baseFreq, t);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, t + 0.3);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.12 / (i + 1), t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);

      osc.connect(gain);
      gain.connect(this._sfxGain);
      osc.start(t);
      osc.stop(t + 0.35);
    }
  }

  playPlayerHurt() {
    if (!this._ready) return;
    const t = this.ctx.currentTime;

    // Short impact thud
    const noise = this._makeNoise(0.15);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 800;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this._sfxGain);
    noise.start(t);
    noise.stop(t + 0.15);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FOOTSTEPS
  // ═══════════════════════════════════════════════════════════════════════════

  updateFootsteps(dt, isMoving, isSprinting) {
    if (!this._ready || !isMoving) {
      this._footstepTimer = 0;
      return;
    }

    this._footstepTimer += dt;
    const rate = isSprinting ? this._footstepRate * 0.65 : this._footstepRate;

    if (this._footstepTimer >= rate) {
      this._footstepTimer -= rate;
      this._playFootstep();
    }
  }

  _playFootstep() {
    const t = this.ctx.currentTime;

    const noise = this._makeNoise(0.08);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 600 + Math.random() * 400;
    filter.Q.value = 1.5;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.12 + Math.random() * 0.06, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this._sfxGain);
    noise.start(t);
    noise.stop(t + 0.08);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UI SOUNDS
  // ═══════════════════════════════════════════════════════════════════════════

  playMenuOpen() {
    if (!this._ready) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(900, t + 0.08);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);

    osc.connect(gain);
    gain.connect(this._sfxGain);
    osc.start(t);
    osc.stop(t + 0.1);
  }

  playMenuClose() {
    if (!this._ready) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(500, t + 0.08);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.10, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);

    osc.connect(gain);
    gain.connect(this._sfxGain);
    osc.start(t);
    osc.stop(t + 0.1);
  }

  playLootPickup() {
    if (!this._ready) return;
    const t = this.ctx.currentTime;

    // Coin jingle: rapid ascending tones
    for (let i = 0; i < 4; i++) {
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = 800 + i * 200;

      const gain = this.ctx.createGain();
      const start = t + i * 0.05;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.12, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, start + 0.1);

      osc.connect(gain);
      gain.connect(this._sfxGain);
      osc.start(start);
      osc.stop(start + 0.12);
    }
  }

  playLevelUp() {
    if (!this._ready) return;
    const t = this.ctx.currentTime;

    // Triumphant ascending chord
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    for (let i = 0; i < notes.length; i++) {
      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = notes[i];

      const gain = this.ctx.createGain();
      const start = t + i * 0.12;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.15, start + 0.05);
      gain.gain.linearRampToValueAtTime(0.10, start + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.01, start + 0.8);

      osc.connect(gain);
      gain.connect(this._sfxGain);
      osc.start(start);
      osc.stop(start + 0.8);
    }
  }

  playQuestComplete() {
    if (!this._ready) return;
    const t = this.ctx.currentTime;

    // Heroic fanfare: two-note horn call
    const notes = [392, 523.25]; // G4, C5
    for (let i = 0; i < notes.length; i++) {
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = notes[i];

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 2000;

      const gain = this.ctx.createGain();
      const start = t + i * 0.3;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.12, start + 0.05);
      gain.gain.linearRampToValueAtTime(0.10, start + 0.25);
      gain.gain.exponentialRampToValueAtTime(0.01, start + 0.6);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this._sfxGain);
      osc.start(start);
      osc.stop(start + 0.6);
    }
  }

  playCraftSuccess() {
    if (!this._ready) return;
    const t = this.ctx.currentTime;

    // Anvil ring + shimmer
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 1200;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);

    osc.connect(gain);
    gain.connect(this._sfxGain);
    osc.start(t);
    osc.stop(t + 0.5);

    // Harmonic shimmer
    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = 2400;
    const g2 = this.ctx.createGain();
    g2.gain.setValueAtTime(0.08, t + 0.05);
    g2.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
    osc2.connect(g2);
    g2.connect(this._sfxGain);
    osc2.start(t + 0.05);
    osc2.stop(t + 0.3);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // AMBIENT SOUNDSCAPES (per biome)
  // ═══════════════════════════════════════════════════════════════════════════

  updateAmbient(biome) {
    if (!this._ready) return;
    if (biome === this._currentBiome) return;

    // Fade out old ambient
    this._stopAmbient();
    this._currentBiome = biome;

    // Start new ambient
    if (biome === 'greenvale' || biome === 'thornwood') {
      this._startForestAmbient();
    } else if (biome === 'ashfeld') {
      this._startVolcanicAmbient();
    } else if (biome === 'frostveil') {
      this._startFrostAmbient();
    } else if (biome === 'blight') {
      this._startBlightAmbient();
    } else {
      this._startForestAmbient(); // default
    }
  }

  _stopAmbient() {
    for (const src of this._ambientSources) {
      try {
        if (src.gain) {
          src.gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1.0);
        }
        setTimeout(() => {
          try { src.node.stop(); } catch(e) {}
        }, 1200);
      } catch(e) {}
    }
    this._ambientSources = [];
  }

  _startForestAmbient() {
    const t = this.ctx.currentTime;

    // Wind: filtered noise
    const windNoise = this._makeNoise(0, true); // loop
    const windFilter = this.ctx.createBiquadFilter();
    windFilter.type = 'bandpass';
    windFilter.frequency.value = 350;
    windFilter.Q.value = 0.5;

    // LFO to modulate wind
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.15;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 150;
    lfo.connect(lfoGain);
    lfoGain.connect(windFilter.frequency);
    lfo.start(t);

    const windGain = this.ctx.createGain();
    windGain.gain.setValueAtTime(0, t);
    windGain.gain.linearRampToValueAtTime(0.08, t + 2.0);

    windNoise.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(this._ambientGain);
    windNoise.start(t);

    this._ambientSources.push(
      { node: windNoise, gain: windGain },
      { node: lfo, gain: null }
    );

    // Bird chirps (periodic random tones)
    this._startBirdChirps();
  }

  _startBirdChirps() {
    const chirp = () => {
      if (this._currentBiome !== 'greenvale' && this._currentBiome !== 'thornwood') return;
      if (!this._ready) return;

      const t = this.ctx.currentTime;
      const freq = 2000 + Math.random() * 2000;

      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * (0.8 + Math.random() * 0.4), t + 0.08);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.04 + Math.random() * 0.03, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

      osc.connect(gain);
      gain.connect(this._ambientGain);
      osc.start(t);
      osc.stop(t + 0.12);

      // Schedule next chirp
      setTimeout(chirp, 2000 + Math.random() * 5000);
    };
    setTimeout(chirp, 1000 + Math.random() * 3000);
  }

  _startVolcanicAmbient() {
    const t = this.ctx.currentTime;

    // Deep rumble: low frequency noise
    const noise = this._makeNoise(0, true);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 120;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.15, t + 2.0);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this._ambientGain);
    noise.start(t);

    this._ambientSources.push({ node: noise, gain: gain });

    // Crackling: periodic noise bursts
    this._startCrackling();
  }

  _startCrackling() {
    const crackle = () => {
      if (this._currentBiome !== 'ashfeld') return;
      if (!this._ready) return;

      const t = this.ctx.currentTime;
      const noise = this._makeNoise(0.06);
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 3000 + Math.random() * 2000;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.06 + Math.random() * 0.04, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this._ambientGain);
      noise.start(t);
      noise.stop(t + 0.06);

      setTimeout(crackle, 100 + Math.random() * 400);
    };
    setTimeout(crackle, 200);
  }

  _startFrostAmbient() {
    const t = this.ctx.currentTime;

    // Icy wind: higher-pitched filtered noise
    const noise = this._makeNoise(0, true);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 800;
    filter.Q.value = 0.8;

    // LFO: gusting
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.08;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 400;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start(t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.12, t + 2.0);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this._ambientGain);
    noise.start(t);

    this._ambientSources.push(
      { node: noise, gain: gain },
      { node: lfo, gain: null }
    );

    // Occasional ice creak
    this._startIceCreaks();
  }

  _startIceCreaks() {
    const creak = () => {
      if (this._currentBiome !== 'frostveil') return;
      if (!this._ready) return;

      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(80 + Math.random() * 60, t);
      osc.frequency.exponentialRampToValueAtTime(200 + Math.random() * 100, t + 0.2);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 500;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.04, t + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this._ambientGain);
      osc.start(t);
      osc.stop(t + 0.25);

      setTimeout(creak, 4000 + Math.random() * 8000);
    };
    setTimeout(creak, 3000 + Math.random() * 5000);
  }

  _startBlightAmbient() {
    const t = this.ctx.currentTime;

    // Corruption hum: low dissonant drone
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.value = 55;

    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sawtooth';
    osc2.frequency.value = 58; // slight detuning = beating

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 200;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.06, t + 3.0);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this._ambientGain);
    osc1.start(t);
    osc2.start(t);

    this._ambientSources.push(
      { node: osc1, gain: gain },
      { node: osc2, gain: null }
    );

    // Distorted whispers: occasional noise bursts
    this._startBlightWhispers();
  }

  _startBlightWhispers() {
    const whisper = () => {
      if (this._currentBiome !== 'blight') return;
      if (!this._ready) return;

      const t = this.ctx.currentTime;
      const noise = this._makeNoise(0.4);
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 400 + Math.random() * 300;
      filter.Q.value = 8;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.03, t + 0.1);
      gain.gain.linearRampToValueAtTime(0.02, t + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this._ambientGain);
      noise.start(t);
      noise.stop(t + 0.4);

      setTimeout(whisper, 3000 + Math.random() * 6000);
    };
    setTimeout(whisper, 2000 + Math.random() * 4000);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PROCEDURAL MUSIC (ambient drone per biome)
  // ═══════════════════════════════════════════════════════════════════════════

  updateMusic(biome) {
    if (!this._ready) return;
    if (biome === this._musicBiome) return;
    this._musicBiome = biome;

    this._stopMusic();

    const t = this.ctx.currentTime;

    // Biome-specific root note and color
    let root, third, fifth;
    if (biome === 'greenvale' || biome === 'thornwood') {
      root = 65.41; third = 82.41; fifth = 98.00; // C2, E2, G2 (major — peaceful)
    } else if (biome === 'ashfeld') {
      root = 73.42; third = 87.31; fifth = 110.0; // D2, F2, A2 (minor — ominous)
    } else if (biome === 'frostveil') {
      root = 61.74; third = 77.78; fifth = 92.50; // B1, Eb2, Gb2 (diminished — eerie)
    } else if (biome === 'blight') {
      root = 55.00; third = 65.41; fifth = 82.41; // A1, C2, E2 (minor — dark)
    } else {
      root = 65.41; third = 82.41; fifth = 98.00;
    }

    // Pad 1: root
    this._musicOsc = this.ctx.createOscillator();
    this._musicOsc.type = 'sine';
    this._musicOsc.frequency.value = root;

    const filter1 = this.ctx.createBiquadFilter();
    filter1.type = 'lowpass';
    filter1.frequency.value = 300;

    const gain1 = this.ctx.createGain();
    gain1.gain.setValueAtTime(0, t);
    gain1.gain.linearRampToValueAtTime(0.10, t + 4.0);

    this._musicOsc.connect(filter1);
    filter1.connect(gain1);
    gain1.connect(this._musicGain);
    this._musicOsc.start(t);

    // Pad 2: fifth (slow LFO on volume for breathing effect)
    this._musicOsc2 = this.ctx.createOscillator();
    this._musicOsc2.type = 'sine';
    this._musicOsc2.frequency.value = fifth;

    const filter2 = this.ctx.createBiquadFilter();
    filter2.type = 'lowpass';
    filter2.frequency.value = 250;

    const gain2 = this.ctx.createGain();
    gain2.gain.setValueAtTime(0, t);
    gain2.gain.linearRampToValueAtTime(0.06, t + 6.0);

    // Breathing LFO
    this._musicLFO = this.ctx.createOscillator();
    this._musicLFO.type = 'sine';
    this._musicLFO.frequency.value = 0.06; // very slow
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 0.03;
    this._musicLFO.connect(lfoGain);
    lfoGain.connect(gain2.gain);
    this._musicLFO.start(t);

    this._musicOsc2.connect(filter2);
    filter2.connect(gain2);
    gain2.connect(this._musicGain);
    this._musicOsc2.start(t);

    this._musicGain1 = gain1;
    this._musicGain2 = gain2;
  }

  _stopMusic() {
    const t = this.ctx ? this.ctx.currentTime : 0;
    try {
      if (this._musicGain1) this._musicGain1.gain.linearRampToValueAtTime(0, t + 2.0);
      if (this._musicGain2) this._musicGain2.gain.linearRampToValueAtTime(0, t + 2.0);
      const osc1 = this._musicOsc;
      const osc2 = this._musicOsc2;
      const lfo  = this._musicLFO;
      setTimeout(() => {
        try { if (osc1) osc1.stop(); } catch(e) {}
        try { if (osc2) osc2.stop(); } catch(e) {}
        try { if (lfo)  lfo.stop();  } catch(e) {}
      }, 2500);
    } catch(e) {}
    this._musicOsc  = null;
    this._musicOsc2 = null;
    this._musicLFO  = null;
    this._musicGain1 = null;
    this._musicGain2 = null;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITY
  // ═══════════════════════════════════════════════════════════════════════════

  _makeNoise(duration, loop) {
    const src = this.ctx.createBufferSource();
    src.buffer = this._noiseBuffer;
    if (loop) src.loop = true;
    return src;
  }
}
