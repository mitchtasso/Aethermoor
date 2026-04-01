'use strict';

// ── Seeded PRNG (Mulberry32) ────────────────────────────────────────────────
// Deterministic so world placement is identical every run.
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// ── Terrain height formula ──────────────────────────────────────────────────
// Layered sine-wave hills. Used for both mesh generation AND runtime height
// queries (cheaper than raycasting for scenery placement).
// Biome height modifiers add character to each region.
function terrainHeight(x, z) {
  let h = (
    Math.sin(x * 0.040) * Math.cos(z * 0.040) * 4.0 +
    Math.sin(x * 0.090 + 1.2) * Math.cos(z * 0.070) * 2.0 +
    Math.sin(x * 0.150) * Math.cos(z * 0.130 + 0.5) * 1.0 +
    Math.sin(x * 0.250 + z * 0.180) * 0.4
  );

  // Frostveil (northwest) — mountainous uplift
  const fvDist = Math.sqrt((x + 180) * (x + 180) + (z + 220) * (z + 220));
  if (fvDist < 140) {
    const t = 1 - fvDist / 140;
    h += t * 8.0 + Math.sin(x * 0.12) * Math.cos(z * 0.10) * t * 4.0;
  }

  // Ashfeld (south) — volcanic ridges
  const afDist = Math.sqrt((x - 50) * (x - 50) + (z - 200) * (z - 200));
  if (afDist < 120) {
    const t = 1 - afDist / 120;
    h += Math.sin(x * 0.08 + z * 0.06) * t * 3.0;
    h += Math.abs(Math.sin(x * 0.20 + 2.0)) * t * 2.5; // sharp volcanic ridges
  }

  // The Blight (far east) — blasted lowlands with jagged spikes
  const blDist = Math.sqrt((x - 400) * (x - 400) + (z + 60) * (z + 60));
  if (blDist < 130) {
    const t = 1 - blDist / 130;
    h -= t * 3.0; // sunken wasteland
    h += Math.abs(Math.sin(x * 0.25) * Math.cos(z * 0.30)) * t * 4.0; // jagged spikes
  }

  return h;
}

// ═══════════════════════════════════════════════════════════════════════════
// RENDERER
// ═══════════════════════════════════════════════════════════════════════════

const canvas   = document.getElementById('canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
renderer.toneMapping       = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

// ═══════════════════════════════════════════════════════════════════════════
// MAIN SCENE
// ═══════════════════════════════════════════════════════════════════════════

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x7db3d0);
scene.fog = new THREE.FogExp2(0x9ac4d8, 0.005);

// ── Main camera ─────────────────────────────────────────────────────────────
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 800);

// ── Lighting ────────────────────────────────────────────────────────────────
// Sun
const sun = new THREE.DirectionalLight(0xfff0cc, 1.8);
sun.position.set(80, 120, 60);
sun.castShadow = true;
sun.shadow.mapSize.width  = 2048;
sun.shadow.mapSize.height = 2048;
sun.shadow.camera.near   = 1;
sun.shadow.camera.far    = 350;
sun.shadow.camera.left   = -100;
sun.shadow.camera.right  = 100;
sun.shadow.camera.top    = 100;
sun.shadow.camera.bottom = -100;
sun.shadow.bias          = -0.001;
scene.add(sun);

// Sky ambient
const ambientLight = new THREE.AmbientLight(0x7db3d0, 0.65);
scene.add(ambientLight);

// Hemisphere (sky/ground bounce)
const hemiLight = new THREE.HemisphereLight(0x9ac4d8, 0x4a7c28, 0.45);
scene.add(hemiLight);

// ═══════════════════════════════════════════════════════════════════════════
// DAY / NIGHT CYCLE
// ═══════════════════════════════════════════════════════════════════════════
// 1 real second = 1 game minute → full 24h in 24 real minutes.
// gameTime is in hours (0–24).

let gameTime = 8.0; // start at 8:00 AM
const TIME_SCALE = (1.0/60.0) / 60.0; // hours per real second

// Time-of-day color presets (interpolated)
const TOD = {
  // [hour, skyColor, fogColor, sunColor, sunIntensity, ambientColor, ambientIntensity, hemiSkyColor, hemiGroundColor, hemiIntensity, exposure]
  presets: [
    { h:  0, sky: 0x0a0a1a, fog: 0x0a0a18, sunCol: 0x222244, sunI: 0.05, ambCol: 0x0a0a20, ambI: 0.12, hSky: 0x0a0a18, hGnd: 0x050510, hI: 0.10, exp: 0.35 },
    { h:  5, sky: 0x1a1028, fog: 0x1a1025, sunCol: 0x443355, sunI: 0.10, ambCol: 0x1a1028, ambI: 0.18, hSky: 0x1a1025, hGnd: 0x0a0a10, hI: 0.15, exp: 0.45 },
    { h:  6, sky: 0x6a4068, fog: 0x6a4060, sunCol: 0xff8855, sunI: 0.60, ambCol: 0x553350, ambI: 0.30, hSky: 0x6a4060, hGnd: 0x2a1a18, hI: 0.25, exp: 0.70 },
    { h:  7, sky: 0xd09070, fog: 0xc88868, sunCol: 0xffcc88, sunI: 1.20, ambCol: 0x8a6a60, ambI: 0.45, hSky: 0xc88868, hGnd: 0x4a3a20, hI: 0.35, exp: 0.90 },
    { h:  9, sky: 0x7db3d0, fog: 0x9ac4d8, sunCol: 0xfff0cc, sunI: 1.80, ambCol: 0x7db3d0, ambI: 0.65, hSky: 0x9ac4d8, hGnd: 0x4a7c28, hI: 0.45, exp: 1.05 },
    { h: 12, sky: 0x88c0e0, fog: 0xa0cce0, sunCol: 0xfffff0, sunI: 2.00, ambCol: 0x88c0e0, ambI: 0.70, hSky: 0xa0cce0, hGnd: 0x5a8a30, hI: 0.50, exp: 1.10 },
    { h: 17, sky: 0x7db3d0, fog: 0x9ac4d8, sunCol: 0xfff0cc, sunI: 1.60, ambCol: 0x7db3d0, ambI: 0.60, hSky: 0x9ac4d8, hGnd: 0x4a7c28, hI: 0.42, exp: 1.00 },
    { h: 19, sky: 0xd08050, fog: 0xc07848, sunCol: 0xff9944, sunI: 0.80, ambCol: 0x885540, ambI: 0.35, hSky: 0xc07848, hGnd: 0x3a2a18, hI: 0.28, exp: 0.75 },
    { h: 20, sky: 0x4a2838, fog: 0x3a2030, sunCol: 0x884455, sunI: 0.25, ambCol: 0x3a2030, ambI: 0.20, hSky: 0x3a2030, hGnd: 0x1a0a10, hI: 0.15, exp: 0.50 },
    { h: 21, sky: 0x0a0a1a, fog: 0x0a0a18, sunCol: 0x222244, sunI: 0.05, ambCol: 0x0a0a20, ambI: 0.12, hSky: 0x0a0a18, hGnd: 0x050510, hI: 0.10, exp: 0.35 },
    { h: 24, sky: 0x0a0a1a, fog: 0x0a0a18, sunCol: 0x222244, sunI: 0.05, ambCol: 0x0a0a20, ambI: 0.12, hSky: 0x0a0a18, hGnd: 0x050510, hI: 0.10, exp: 0.35 },
  ],
};

const _c1 = new THREE.Color(), _c2 = new THREE.Color();

function lerpColor(hex1, hex2, t) {
  _c1.setHex(hex1); _c2.setHex(hex2);
  _c1.lerp(_c2, t);
  return _c1;
}

function getTOD(hour) {
  const p = TOD.presets;
  // Find bounding presets
  let lo = p[0], hi = p[1];
  for (let i = 0; i < p.length - 1; i++) {
    if (hour >= p[i].h && hour <= p[i + 1].h) {
      lo = p[i]; hi = p[i + 1]; break;
    }
  }
  const range = hi.h - lo.h || 1;
  const t = (hour - lo.h) / range;
  return { lo, hi, t };
}

function updateDayNight(dt) {
  gameTime += dt * TIME_SCALE * 60; // dt is in seconds, TIME_SCALE is hours/sec
  if (gameTime >= 24) gameTime -= 24;

  const { lo, hi, t } = getTOD(gameTime);

  // Sky
  scene.background.copy(lerpColor(lo.sky, hi.sky, t));

  // Fog
  scene.fog.color.copy(lerpColor(lo.fog, hi.fog, t));

  // Sun position — orbit around scene
  const sunAngle = ((gameTime - 6) / 24) * Math.PI * 2; // 6:00 = sunrise (east)
  const sunHeight = Math.sin(sunAngle);
  const sunHoriz  = Math.cos(sunAngle);
  sun.position.set(sunHoriz * 120, Math.max(sunHeight * 120, -20), 60);
  sun.color.copy(lerpColor(lo.sunCol, hi.sunCol, t));
  sun.intensity = lo.sunI + (hi.sunI - lo.sunI) * t;
  // Only cast shadows when sun is above horizon
  sun.castShadow = sunHeight > 0;

  // Ambient
  ambientLight.color.copy(lerpColor(lo.ambCol, hi.ambCol, t));
  ambientLight.intensity = lo.ambI + (hi.ambI - lo.ambI) * t;

  // Hemisphere
  hemiLight.color.copy(lerpColor(lo.hSky, hi.hSky, t));
  hemiLight.groundColor.copy(lerpColor(lo.hGnd, hi.hGnd, t));
  hemiLight.intensity = lo.hI + (hi.hI - lo.hI) * t;

  // Tone mapping exposure
  renderer.toneMappingExposure = lo.exp + (hi.exp - lo.exp) * t;

  // Moon visibility
  if (moonMesh) {
    const moonAngle = sunAngle + Math.PI; // opposite sun
    const moonHeight = Math.sin(moonAngle);
    moonMesh.position.set(
      Math.cos(moonAngle) * 300,
      Math.max(moonHeight * 250, -100),
      -80
    );
    moonMesh.visible = moonHeight > -0.1;
    moonGlow.visible = moonMesh.visible;
    moonGlow.position.copy(moonMesh.position);
  }

  // Stars visibility
  if (starField) {
    const nightFactor = Math.max(0, Math.min(1, (sunHeight < 0 ? 1 : 0) + (sunHeight < 0.1 ? (0.1 - sunHeight) * 10 : 0)));
    starField.material.opacity = nightFactor * 0.8;
    starField.visible = nightFactor > 0.01;
  }
}

// ── Moon ────────────────────────────────────────────────────────────────────
let moonMesh = null;
let moonGlow = null;
(function buildMoon() {
  const moonGeo = new THREE.SphereGeometry(8, 16, 12);
  const moonMat = new THREE.MeshBasicMaterial({ color: 0xdde8f0 });
  moonMesh = new THREE.Mesh(moonGeo, moonMat);
  moonMesh.visible = false;
  scene.add(moonMesh);

  // Soft glow around moon
  const glowGeo = new THREE.SphereGeometry(14, 16, 12);
  const glowMat = new THREE.MeshBasicMaterial({
    color: 0x8899bb, transparent: true, opacity: 0.12, side: THREE.BackSide,
  });
  moonGlow = new THREE.Mesh(glowGeo, glowMat);
  moonGlow.visible = false;
  scene.add(moonGlow);
}());

// ── Stars ───────────────────────────────────────────────────────────────────
let starField = null;
(function buildStars() {
  const count = 600;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    // Random positions on a large sphere
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 350 + Math.random() * 50;
    positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = Math.abs(r * Math.cos(phi)); // only upper hemisphere
    positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({
    color: 0xffffff, size: 1.2, transparent: true, opacity: 0,
    sizeAttenuation: false,
  });
  starField = new THREE.Points(geo, mat);
  starField.visible = false;
  scene.add(starField);
}());

// ═══════════════════════════════════════════════════════════════════════════
// WEATHER SYSTEM
// ═══════════════════════════════════════════════════════════════════════════

const WEATHER_PARTICLE_COUNT = 800;

// Generic particle system builder
function buildParticleSystem(color, size, opacity, areaSize) {
  const positions = new Float32Array(WEATHER_PARTICLE_COUNT * 3);
  for (let i = 0; i < WEATHER_PARTICLE_COUNT; i++) {
    positions[i * 3]     = (Math.random() - 0.5) * areaSize;
    positions[i * 3 + 1] = Math.random() * 40;
    positions[i * 3 + 2] = (Math.random() - 0.5) * areaSize;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({
    color, size, transparent: true, opacity, sizeAttenuation: true, depthWrite: false,
  });
  const particles = new THREE.Points(geo, mat);
  particles.visible = false;
  scene.add(particles);
  return particles;
}

// Rain — light blue streaks
const rainParticles = buildParticleSystem(0x8899cc, 0.15, 0.4, 80);

// Snow (Frostveil) — white fluffy
const snowParticles = buildParticleSystem(0xeeeeff, 0.3, 0.6, 80);

// Ash/Embers (Ashfeld) — orange flecks
const ashParticles  = buildParticleSystem(0xff6622, 0.2, 0.5, 80);

// Blight spores (The Blight) — purple motes
const blightParticles = buildParticleSystem(0x8800cc, 0.25, 0.35, 80);

let _currentWeather = 'clear'; // 'clear' | 'rain' | 'snow' | 'ash' | 'blight'

function updateWeather(dt) {
  const px = player.position.x, pz = player.position.z;

  // Determine weather by biome
  const biome = getBiome(px, pz);
  let targetWeather = 'clear';
  if (biome === 'frostveil')  targetWeather = 'snow';
  else if (biome === 'ashfeld')   targetWeather = 'ash';
  else if (biome === 'blight')    targetWeather = 'blight';
  // Rain: random chance in greenvale/thornwood during night
  else if (gameTime > 20 || gameTime < 5) targetWeather = 'rain';

  _currentWeather = targetWeather;

  // Toggle visibility
  rainParticles.visible   = targetWeather === 'rain';
  snowParticles.visible   = targetWeather === 'snow';
  ashParticles.visible    = targetWeather === 'ash';
  blightParticles.visible = targetWeather === 'blight';

  // Animate active particle system
  const active = targetWeather === 'rain' ? rainParticles :
                 targetWeather === 'snow' ? snowParticles :
                 targetWeather === 'ash'  ? ashParticles  :
                 targetWeather === 'blight' ? blightParticles : null;

  if (!active) return;

  // Center particles around player
  active.position.x = px;
  active.position.z = pz;

  const pos = active.geometry.attributes.position;
  const arr = pos.array;
  const fallSpeed = targetWeather === 'snow' ? 3.0 :
                    targetWeather === 'ash'  ? 2.0 :
                    targetWeather === 'blight' ? 1.5 : 12.0;
  const drift = targetWeather === 'snow' ? 1.5 :
                targetWeather === 'ash'  ? 2.5 :
                targetWeather === 'blight' ? 1.0 : 0.3;

  for (let i = 0; i < WEATHER_PARTICLE_COUNT; i++) {
    const i3 = i * 3;
    arr[i3 + 1] -= fallSpeed * dt; // fall
    arr[i3]     += (Math.sin(i + elapsed * 0.5) * drift) * dt; // drift

    // Reset particle when it hits ground
    if (arr[i3 + 1] < 0) {
      arr[i3]     = (Math.random() - 0.5) * 80;
      arr[i3 + 1] = 30 + Math.random() * 10;
      arr[i3 + 2] = (Math.random() - 0.5) * 80;
    }
  }
  pos.needsUpdate = true;
}

// ═══════════════════════════════════════════════════════════════════════════
// TERRAIN
// ═══════════════════════════════════════════════════════════════════════════

const TERRAIN_SIZE = 1200;
const TERRAIN_SEGS = 350;

const TERRAIN_OFFSET_X = 110; // shift terrain to cover all regions

// ── Biome detection (used for vertex coloring and scenery) ──────────────────
function getBiome(x, z) {
  const fvDist = Math.sqrt((x + 180) * (x + 180) + (z + 220) * (z + 220));
  if (fvDist < 120) return 'frostveil';
  const afDist = Math.sqrt((x - 50) * (x - 50) + (z - 200) * (z - 200));
  if (afDist < 100) return 'ashfeld';
  const blDist = Math.sqrt((x - 400) * (x - 400) + (z + 60) * (z + 60));
  if (blDist < 110) return 'blight';
  if (x > 35 && x < 220) return 'thornwood';
  return 'greenvale';
}

function buildTerrain() {
  const geo = new THREE.PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE, TERRAIN_SEGS, TERRAIN_SEGS);
  geo.rotateX(-Math.PI / 2);
  geo.translate(TERRAIN_OFFSET_X, 0, 0);

  const pos    = geo.attributes.position;
  const colors = [];
  const c      = new THREE.Color();

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const y = terrainHeight(x, z);
    pos.setY(i, y);

    const biome = getBiome(x, z);

    if (biome === 'frostveil') {
      // Snow & ice palette
      if      (y < 2.0)  c.setHex(0x8899aa); // frozen ground
      else if (y < 6.0)  c.setHex(0xb8c8d8); // snow
      else if (y < 10.0) c.setHex(0xd0dde8); // high snow
      else                c.setHex(0xe8eef4); // peak ice
    } else if (biome === 'ashfeld') {
      // Volcanic reds & blacks
      if      (y < 0.0)  c.setHex(0x3a2a1a); // dark volcanic soil
      else if (y < 2.0)  c.setHex(0x5a3a1a); // scorched earth
      else if (y < 5.0)  c.setHex(0x7a4a22); // volcanic rock
      else                c.setHex(0x4a2a0a); // obsidian peaks
    } else if (biome === 'blight') {
      // Corrupted purples & blacks
      if      (y < -1.0) c.setHex(0x1a0a1a); // void pools
      else if (y < 1.0)  c.setHex(0x2a1a2a); // blighted earth
      else if (y < 4.0)  c.setHex(0x3a2a3a); // corrupted ground
      else                c.setHex(0x2a1a30); // dark spires
    } else if (biome === 'thornwood') {
      // Darker forest greens
      if      (y < -1.0) c.setHex(0x4a5a32); // boggy
      else if (y < 1.0)  c.setHex(0x3a6a28); // dark forest floor
      else if (y < 3.0)  c.setHex(0x4a7a38); // mid forest
      else                c.setHex(0x5a7a40); // forest hill
    } else {
      // Greenvale — default
      if      (y < -1.5) c.setHex(0x6b7c52); // low boggy
      else if (y <  0.5) c.setHex(0x5a8a3c); // grass
      else if (y <  2.5) c.setHex(0x62924a); // mid grass
      else if (y <  4.0) c.setHex(0x7aaa60); // hilltop
      else               c.setHex(0x8aaa72); // peak
    }
    colors.push(c.r, c.g, c.b);
  }

  pos.needsUpdate = true;
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.computeVertexNormals();

  const mat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.92,
    metalness: 0.0,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  return mesh;
}

const terrain = buildTerrain();
scene.add(terrain);

// ═══════════════════════════════════════════════════════════════════════════
// SHARED GEOMETRY / MATERIAL POOLS
// (One geometry per shape; many meshes share it — avoids repeated GPU uploads)
// ═══════════════════════════════════════════════════════════════════════════

const MAT = {
  trunk:    new THREE.MeshStandardMaterial({ color: 0x5c3d1e, roughness: 1.0 }),
  foliage0: new THREE.MeshStandardMaterial({ color: 0x2b5018, roughness: 0.95 }),
  foliage1: new THREE.MeshStandardMaterial({ color: 0x396a22, roughness: 0.95 }),
  foliage2: new THREE.MeshStandardMaterial({ color: 0x4a7c2a, roughness: 0.95 }),
  rock0:    new THREE.MeshStandardMaterial({ color: 0x7e7a72, roughness: 0.90 }),
  rock1:    new THREE.MeshStandardMaterial({ color: 0x696560, roughness: 0.95 }),
  stone:    new THREE.MeshStandardMaterial({ color: 0xb8a888, roughness: 0.88 }),
  thatch:   new THREE.MeshStandardMaterial({ color: 0x8b5e1e, roughness: 0.95 }),
  slate:    new THREE.MeshStandardMaterial({ color: 0x5a5248, roughness: 0.95 }),
  wood:     new THREE.MeshStandardMaterial({ color: 0x7a5030, roughness: 0.95 }),
  sign:     new THREE.MeshStandardMaterial({ color: 0x9a7040, roughness: 0.95 }),
};

const GEO = {
  trunk:   new THREE.CylinderGeometry(0.18, 0.30, 3.0, 7),
  cone0:   new THREE.ConeGeometry(2.0, 2.6, 7),
  cone1:   new THREE.ConeGeometry(1.6, 2.3, 7),
  cone2:   new THREE.ConeGeometry(1.1, 2.1, 7),
  dodec:   new THREE.DodecahedronGeometry(1, 0),
  post:    new THREE.CylinderGeometry(0.06, 0.08, 1.8, 5),
  board:   new THREE.BoxGeometry(0.9, 0.4, 0.06),
};

// ═══════════════════════════════════════════════════════════════════════════
// SCENERY BUILDERS
// ═══════════════════════════════════════════════════════════════════════════

function addTree(x, z) {
  const y     = terrainHeight(x, z);
  const group = new THREE.Group();
  group.position.set(x, y, z);

  const trunk = new THREE.Mesh(GEO.trunk, MAT.trunk);
  trunk.position.y = 1.5;
  trunk.castShadow = true;
  group.add(trunk);

  const coneGeos = [GEO.cone0, GEO.cone1, GEO.cone2];
  const coneMats = [MAT.foliage0, MAT.foliage1, MAT.foliage2];
  for (let i = 0; i < 3; i++) {
    const cone = new THREE.Mesh(coneGeos[i], coneMats[i]);
    cone.position.y = 2.8 + i * 1.6;
    cone.castShadow = true;
    group.add(cone);
  }

  scene.add(group);
}

function addRock(x, z, scale, rng) {
  const y    = terrainHeight(x, z);
  const mat  = rng() > 0.5 ? MAT.rock0 : MAT.rock1;
  const mesh = new THREE.Mesh(GEO.dodec, mat);
  mesh.scale.set(scale, scale * (0.6 + rng() * 0.5), scale * (0.9 + rng() * 0.3));
  mesh.position.set(x, y + scale * 0.45, z);
  mesh.rotation.set(rng() * Math.PI, rng() * Math.PI, rng() * Math.PI);
  mesh.castShadow    = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
}

// Low-poly building: stone walls + 4-sided pyramid roof
function addBuilding(x, z, w, d, h, wallMat = MAT.stone, roofMat = MAT.thatch) {
  const y     = terrainHeight(x, z);
  const group = new THREE.Group();
  group.position.set(x, y, z);

  // Walls
  const walls = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
  walls.position.y = h / 2;
  walls.castShadow    = true;
  walls.receiveShadow = true;
  group.add(walls);

  // Roof — CylinderGeometry(topR=0, bottomR, height, 4 sides) = pyramid
  const roofH  = h * 0.55;
  const roofBR = Math.sqrt(w * w + d * d) / 2 + 0.4;
  const roof   = new THREE.Mesh(
    new THREE.CylinderGeometry(0, roofBR, roofH, 4, 1),
    roofMat
  );
  roof.position.y  = h + roofH / 2;
  roof.rotation.y  = Math.PI / 4;
  roof.castShadow  = true;
  group.add(roof);

  scene.add(group);
}

function addSignPost(x, z, angle = 0) {
  const y     = terrainHeight(x, z);
  const group = new THREE.Group();
  group.position.set(x, y, z);
  group.rotation.y = angle;

  const post  = new THREE.Mesh(GEO.post, MAT.wood);
  post.position.y = 0.9;
  group.add(post);

  const board = new THREE.Mesh(GEO.board, MAT.sign);
  board.position.set(0, 1.65, 0.03);
  group.add(board);

  scene.add(group);
}

// Stone wall segment (low retaining wall)
function addWallSegment(x, z, length, angle = 0) {
  const y   = terrainHeight(x, z);
  const geo = new THREE.BoxGeometry(length, 1.2, 0.4);
  const m   = new THREE.Mesh(geo, MAT.rock1);
  m.position.set(x, y + 0.6, z);
  m.rotation.y    = angle;
  m.castShadow    = true;
  m.receiveShadow = true;
  scene.add(m);
}

// ═══════════════════════════════════════════════════════════════════════════
// WORLD POPULATION  (deterministic — seed 12345)
// ═══════════════════════════════════════════════════════════════════════════

(function populateWorld() {
  const rng = mulberry32(12345);

  // ── Trees ──────────────────────────────────────────────────────────────────
  for (let i = 0; i < 160; i++) {
    const angle  = rng() * Math.PI * 2;
    const radius = 14 + rng() * 120;
    const x      = Math.cos(angle) * radius;
    const z      = Math.sin(angle) * radius;
    // Keep a clear area around spawn and Millhaven path
    if (Math.sqrt(x * x + z * z) < 10) continue;
    if (Math.abs(x) < 5 && z < -20 && z > -60) continue;
    addTree(x, z);
  }

  // ── Rocks ──────────────────────────────────────────────────────────────────
  for (let i = 0; i < 35; i++) {
    const angle  = rng() * Math.PI * 2;
    const radius = 8 + rng() * 95;
    const x      = Math.cos(angle) * radius;
    const z      = Math.sin(angle) * radius;
    addRock(x, z, 0.35 + rng() * 0.9, rng);
  }

  // ── Millhaven — starter town ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  // Located ~55 units north (z = -55) — player faces north at spawn.
  const TX = 0, TZ = -55;

  // Inn (largest building, centre)
  addBuilding(TX, TZ, 9, 7, 4.5, MAT.stone, MAT.thatch);
  // Smithy (east side, stone walls, slate roof)
  addBuilding(TX + 13, TZ + 3, 7, 6, 4.0, MAT.stone, MAT.slate);
  // General store (west side)
  addBuilding(TX - 12, TZ - 2, 6, 5, 3.8, MAT.stone, MAT.thatch);
  // Cottage north-east
  addBuilding(TX + 9,  TZ - 10, 5, 5, 3.2, MAT.stone, MAT.thatch);
  // Cottage west
  addBuilding(TX - 9,  TZ + 10, 5, 4, 3.0, MAT.stone, MAT.thatch);
  // Small hut (south of inn)
  addBuilding(TX + 3,  TZ + 12, 4, 4, 2.8, MAT.wood,  MAT.thatch);

  // Town wall segments
  addWallSegment(TX - 17, TZ - 5,  12, Math.PI / 2);
  addWallSegment(TX + 17, TZ - 5,  12, Math.PI / 2);
  addWallSegment(TX,       TZ - 18, 14, 0);

  // Entrance sign posts (either side of the road)
  addSignPost(TX - 2.5, TZ - 22,  0.15);
  addSignPost(TX + 2.5, TZ - 22, -0.15);

  // A handful of trees inside/near town
  const townTrees = [
    [TX - 20, TZ + 8], [TX + 20, TZ - 8],
    [TX - 15, TZ + 18], [TX + 16, TZ + 14],
    [TX - 22, TZ - 12],
  ];
  for (const [x, z] of townTrees) addTree(x, z);

}());

// ═══════════════════════════════════════════════════════════════════════════
// VIEWMODEL SCENE  (hands rendered on a separate depth pass — never clips)
// ═══════════════════════════════════════════════════════════════════════════

const vmScene  = new THREE.Scene();
const vmCamera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.01, 10);

vmScene.add(new THREE.AmbientLight(0xffffff, 1.1));
const vmSun = new THREE.DirectionalLight(0xfff4e0, 0.9);
vmSun.position.set(1.5, 3, 4);
vmScene.add(vmSun);

// Sword holder — empty group so position/rotation animation code still works
const rightHand = new THREE.Group();

// Resting positions in view space (camera looks at -Z)
const RH_BASE = { x:  0.235, y: -0.290, z: -0.520 };

rightHand.position.set(RH_BASE.x, RH_BASE.y, RH_BASE.z);
rightHand.rotation.set(0.10, -0.20, 0.06);

vmScene.add(rightHand);

// ── Sword viewmodel (child of rightHand so it moves with it) ────────────────
let swordGroup = null;  // exposed so the game loop can animate it
(function buildSword() {
  const MAT_BLADE = new THREE.MeshStandardMaterial({ color: 0xd0d8e8, roughness: 0.20, metalness: 0.90 });
  const MAT_GUARD = new THREE.MeshStandardMaterial({ color: 0x8a6820, roughness: 0.55, metalness: 0.65 });
  const MAT_GRIP  = new THREE.MeshStandardMaterial({ color: 0x5a2e10, roughness: 0.95 });

  const sw = new THREE.Group();
  swordGroup = sw;

  // Blade — blade is oriented along Y, pointing UP from the guard.
  // BoxGeometry(width, height, depth): keep depth ≥ 0.025 so it's never edge-on-invisible.
  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.040, 0.52, 0.025), MAT_BLADE);
  blade.position.set(0, 0.25, 0);   // blade center sits above the guard
  sw.add(blade);

  // Cross-guard
  const guard = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.028, 0.028), MAT_GUARD);
  guard.position.set(0, 0.0, 0);
  sw.add(guard);

  // Grip
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.020, 0.18, 6), MAT_GRIP);
  grip.position.set(0, -0.105, 0);
  sw.add(grip);

  // Pommel
  const pommel = new THREE.Mesh(new THREE.SphereGeometry(0.032, 6, 5), MAT_GUARD);
  pommel.position.set(0, -0.205, 0);
  sw.add(pommel);

  // Mount: grip sits in the hand, blade extends upward and forward out of the fist.
  // Tilt forward (~35°) so the blade angles into the scene rather than straight up.
  sw.position.set(0.02, 0.05, -0.10);
  sw.rotation.set(-0.60, 0.05, 0);   // -X tilts blade forward toward scene

  rightHand.add(sw);
}());

// ── Right hand resting rotation (sword held naturally) ──────────────────────
rightHand.rotation.set(0.10, -0.20, 0.06);

// ── Bow viewmodel (hidden by default, shown when ranged weapon equipped) ────
let bowGroup = null;
let bowString = null;  // the drawstring line — we animate its midpoint
const BOW_BASE = { x: 0.20, y: -0.260, z: -0.480 };
(function buildBow() {
  const MAT_WOOD  = new THREE.MeshStandardMaterial({ color: 0x8B5A2B, roughness: 0.75, metalness: 0.1 });
  const MAT_GRIP  = new THREE.MeshStandardMaterial({ color: 0x5a3a1a, roughness: 0.95 });
  const MAT_TIP   = new THREE.MeshStandardMaterial({ color: 0xc0c0c0, roughness: 0.3, metalness: 0.8 });

  const bw = new THREE.Group();
  bowGroup = bw;

  // Bow limbs — two curved segments using tapered cylinders
  // Upper limb
  const upperLimb = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.008, 0.30, 6), MAT_WOOD);
  upperLimb.position.set(0, 0.17, 0);
  upperLimb.rotation.z = -0.15; // slight curve
  bw.add(upperLimb);

  // Lower limb
  const lowerLimb = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.012, 0.30, 6), MAT_WOOD);
  lowerLimb.position.set(0, -0.17, 0);
  lowerLimb.rotation.z = 0.15; // slight curve
  bw.add(lowerLimb);

  // Center grip (thicker handle)
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.020, 0.020, 0.10, 6), MAT_GRIP);
  grip.position.set(0, 0, 0);
  bw.add(grip);

  // Metal tips at limb ends
  const tipTop = new THREE.Mesh(new THREE.SphereGeometry(0.010, 4, 4), MAT_TIP);
  tipTop.position.set(0, 0.32, 0);
  bw.add(tipTop);
  const tipBot = new THREE.Mesh(new THREE.SphereGeometry(0.010, 4, 4), MAT_TIP);
  tipBot.position.set(0, -0.32, 0);
  bw.add(tipBot);

  // Bowstring — BufferGeometry line from top tip to bottom tip
  const stringGeo = new THREE.BufferGeometry();
  const stringVerts = new Float32Array([
    0, 0.32, 0,   // top
    0, 0.00, 0,   // midpoint (pulled back when drawing)
    0, -0.32, 0,  // bottom
  ]);
  stringGeo.setAttribute('position', new THREE.BufferAttribute(stringVerts, 3));
  const stringMat = new THREE.LineBasicMaterial({ color: 0xddccaa, linewidth: 1 });
  bowString = new THREE.Line(stringGeo, stringMat);
  bw.add(bowString);

  // Arrow nocked on the string (visible during draw, hidden at rest)
  const arrowShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.35, 4), MAT_WOOD);
  arrowShaft.name = 'nocked_arrow';
  arrowShaft.position.set(0, 0, -0.02);
  arrowShaft.rotation.x = Math.PI / 2; // point forward
  arrowShaft.visible = false;
  bw.add(arrowShaft);

  // Arrow tip
  const arrowTip = new THREE.Mesh(new THREE.ConeGeometry(0.008, 0.03, 4), MAT_TIP);
  arrowTip.name = 'nocked_arrow_tip';
  arrowTip.position.set(0, 0, -0.195);
  arrowTip.rotation.x = -Math.PI / 2;
  arrowTip.visible = false;
  bw.add(arrowTip);

  // Mount: bow held vertically, slightly angled
  bw.position.set(0.01, 0.02, -0.08);
  bw.rotation.set(0, 0, -0.10);

  bw.visible = false;
  rightHand.add(bw);
}());

// ── Crossbow viewmodel ──────────────────────────────────────────────────────
let crossbowGroup = null;
(function buildCrossbow() {
  const MAT_WOOD  = new THREE.MeshStandardMaterial({ color: 0x6B4226, roughness: 0.80, metalness: 0.1 });
  const MAT_METAL = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.35, metalness: 0.85 });

  const cb = new THREE.Group();
  crossbowGroup = cb;

  // Stock (horizontal body)
  const stock = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.030, 0.32), MAT_WOOD);
  stock.position.set(0, 0, -0.05);
  cb.add(stock);

  // Prod (the cross-piece at the front)
  const prod = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.22, 6), MAT_METAL);
  prod.rotation.z = Math.PI / 2;
  prod.position.set(0, 0.005, -0.20);
  cb.add(prod);

  // Trigger mechanism (small box underneath)
  const trigger = new THREE.Mesh(new THREE.BoxGeometry(0.020, 0.035, 0.05), MAT_METAL);
  trigger.position.set(0, -0.025, 0.02);
  cb.add(trigger);

  // Bolt groove (thin rail on top)
  const rail = new THREE.Mesh(new THREE.BoxGeometry(0.010, 0.006, 0.26), MAT_METAL);
  rail.position.set(0, 0.018, -0.06);
  cb.add(rail);

  // Bolt (visible when loaded)
  const boltMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.20, 4), MAT_WOOD);
  boltMesh.name = 'loaded_bolt';
  boltMesh.rotation.x = Math.PI / 2;
  boltMesh.position.set(0, 0.024, -0.10);
  boltMesh.visible = false;
  cb.add(boltMesh);

  // Bolt tip
  const boltTip = new THREE.Mesh(new THREE.ConeGeometry(0.007, 0.025, 4), MAT_METAL);
  boltTip.name = 'loaded_bolt_tip';
  boltTip.rotation.x = -Math.PI / 2;
  boltTip.position.set(0, 0.024, -0.22);
  boltTip.visible = false;
  cb.add(boltTip);

  // Mount: crossbow held horizontally, pointing forward
  cb.position.set(0.02, 0.03, -0.08);
  cb.rotation.set(-0.05, 0, 0);

  cb.visible = false;
  rightHand.add(cb);
}());

// ── Weapon viewmodel switching ──────────────────────────────────────────────
let _activeViewmodel = 'sword'; // 'sword' | 'bow' | 'crossbow'

function updateViewmodel() {
  const wpnId = inventory.equipped.rightHand;
  const wpnDef = wpnId ? ITEMS[wpnId] : null;

  let newModel = 'sword';
  if (wpnDef && wpnDef.subtype === 'ranged') {
    newModel = wpnDef.ammoType === 'bolt' ? 'crossbow' : 'bow';
  }

  if (newModel !== _activeViewmodel) {
    swordGroup.visible    = newModel === 'sword';
    bowGroup.visible      = newModel === 'bow';
    crossbowGroup.visible = newModel === 'crossbow';
    _activeViewmodel = newModel;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ARROW / BOLT PROJECTILE SYSTEM
// ═══════════════════════════════════════════════════════════════════════════

const arrowProjectiles = [];
const _arrowGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.5, 4);
_arrowGeo.rotateX(Math.PI / 2); // align along Z axis
const _arrowTipGeo = new THREE.ConeGeometry(0.035, 0.06, 4);
_arrowTipGeo.rotateX(-Math.PI / 2);
const _arrowMat = new THREE.MeshStandardMaterial({ color: 0x8B5A2B, roughness: 0.75 });
const _arrowTipMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.3, metalness: 0.8 });

function fireArrow(drawPct) {
  // Check ammo
  const ammoType = player.ammoType;
  if (!ammoType) return;

  // Find best ammo in inventory (special ammo first, then basic)
  let ammoId = null;
  let bonusDmg = 0;
  const ammoItems = [];
  for (const slot of inventory.items) {
    const def = ITEMS[slot.id];
    if (def && def.type === 'ammo' && def.ammoType === ammoType) {
      ammoItems.push({ id: slot.id, bonus: def.bonusDamage || 0 });
    }
  }
  // Use basic ammo first (save special ammo)
  ammoItems.sort((a, b) => a.bonus - b.bonus);
  if (ammoItems.length === 0) return; // no ammo!
  ammoId = ammoItems[0].id;
  bonusDmg = ammoItems[0].bonus;

  // Consume 1 ammo
  inventory.removeItem(ammoId, 1);
  inventory._updateHotbarUI();

  // Direction from camera
  const dir = new THREE.Vector3(0, 0, -1);
  dir.applyQuaternion(camera.quaternion);

  // Add slight spread based on draw percentage (less draw = more spread)
  const spread = (1 - drawPct) * 0.04;
  dir.x += (Math.random() - 0.5) * spread;
  dir.y += (Math.random() - 0.5) * spread;
  dir.normalize();

  // Spawn position
  const pos = camera.position.clone().add(dir.clone().multiplyScalar(1.5));

  // Create arrow mesh
  const arrowGroup = new THREE.Group();
  const shaft = new THREE.Mesh(_arrowGeo, _arrowMat);
  arrowGroup.add(shaft);
  const tip = new THREE.Mesh(_arrowTipGeo, _arrowTipMat);
  tip.position.set(0, 0, -0.28);
  arrowGroup.add(tip);

  arrowGroup.position.copy(pos);
  arrowGroup.lookAt(pos.clone().add(dir));
  scene.add(arrowGroup);

  // Damage = weapon base * draw% + per scaling + bonus ammo + crit
  const baseDmg = player.rangedDamage * drawPct;
  const perBonus = player.per * 0.8;
  let totalDmg = baseDmg + perBonus + bonusDmg;

  // Crit check
  if (Math.random() < player.critChance) {
    totalDmg *= player.critMultiplier;
  }

  const speed = player.projectileSpeed * (0.6 + 0.4 * drawPct);

  arrowProjectiles.push({
    mesh: arrowGroup,
    velocity: dir.multiplyScalar(speed),
    gravity: -12, // gravity pull
    damage: totalDmg,
    lifetime: 4.0,
    age: 0,
  });
}

function updateArrowProjectiles(dt) {
  for (let i = arrowProjectiles.length - 1; i >= 0; i--) {
    const a = arrowProjectiles[i];
    a.age += dt;

    // Apply gravity to velocity
    a.velocity.y += a.gravity * dt;

    // Move
    const move = a.velocity.clone().multiplyScalar(dt);
    a.mesh.position.add(move);

    // Orient arrow along velocity
    const lookTarget = a.mesh.position.clone().add(a.velocity.clone().normalize());
    a.mesh.lookAt(lookTarget);

    // Terrain collision
    const ty = terrainHeight(a.mesh.position.x, a.mesh.position.z);
    if (a.mesh.position.y < ty + 0.15) {
      _destroyArrow(i);
      continue;
    }

    // Enemy collision
    let hit = false;
    for (const enemy of enemies) {
      if (enemy.dead) continue;
      const dx = enemy.mesh.position.x - a.mesh.position.x;
      const dy = (enemy.mesh.position.y + 0.6) - a.mesh.position.y;
      const dz = enemy.mesh.position.z - a.mesh.position.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < 1.3) {
        enemy.takeDamage(a.damage);
        triggerHitMarker();
        sound.playHit();
        if (enemy.dead) {
          enemy._magicLootDone = true;
          addKillMessage(enemy.name);
          quests.onKill(enemy.type);
          awardXP(enemy.xp);
          sound.playEnemyDeath();
          const loot = rollLoot(enemy.lootTable);
          loot.push('gold');
          spawnLootDrop(enemy.mesh.position.x, enemy.mesh.position.z, loot);
        }
        hit = true;
        break;
      }
    }

    if (hit || a.age > a.lifetime) {
      _destroyArrow(i);
      continue;
    }
  }
}

function _destroyArrow(index) {
  const a = arrowProjectiles[index];
  scene.remove(a.mesh);
  arrowProjectiles.splice(index, 1);
}

// ═══════════════════════════════════════════════════════════════════════════
// PLAYER + UI
// ═══════════════════════════════════════════════════════════════════════════

const player = new PlayerController(camera, terrain);
const ui     = new UI(player);

// ═══════════════════════════════════════════════════════════════════════════
// COMBAT FX ELEMENTS
// ═══════════════════════════════════════════════════════════════════════════

const damageFlash = document.getElementById('damage-flash');
const hitMarker   = document.getElementById('hit-marker');
const killFeed    = document.getElementById('kill-feed');

let _dmgFlashTimer = 0;
let _hitMarkerTimer = 0;

function triggerDamageFlash() {
  damageFlash.classList.add('flash');
  _dmgFlashTimer = 0.35;
}

function triggerHitMarker() {
  hitMarker.classList.add('show');
  _hitMarkerTimer = 0.12;
}

function addKillMessage(name) {
  const line = document.createElement('div');
  line.textContent = (name || 'Enemy') + ' slain';
  line.style.cssText = 'margin-bottom:4px;opacity:1;transition:opacity 2s';
  killFeed.appendChild(line);
  setTimeout(() => { line.style.opacity = '0'; }, 800);
  setTimeout(() => { if (line.parentNode) line.parentNode.removeChild(line); }, 2800);
}

// ═══════════════════════════════════════════════════════════════════════════
// ENEMIES
// ═══════════════════════════════════════════════════════════════════════════

function onPlayerHit(dmg) {
  const reduced = Math.max(1, dmg - player.armor);
  player.hp = Math.max(0, player.hp - reduced);
  triggerDamageFlash();
  sound.playPlayerHurt();
}

const enemies = [];

// ── Greenvale (starter area) — wolves + bears ─────────────────────────────
enemies.push(
  new Enemy('wolf',  28,  18, scene, onPlayerHit, {
    patrol: [[28,18],[42,10],[35,30],[20,25]],
  }),
  new Enemy('wolf', -22,  30, scene, onPlayerHit, {
    patrol: [[-22,30],[-10,40],[-30,45],[-35,30]],
  }),
  new Enemy('wolf',  12, -28, scene, onPlayerHit),
  new Enemy('wolf', -30, -15, scene, onPlayerHit),
  new Enemy('bear',  -45,  10, scene, onPlayerHit, { leash: 25 }),
  new Enemy('bear',   40, -35, scene, onPlayerHit, { leash: 25 }),
);

// ── Greenvale Boss: Fenris the Alpha ────────────────────────────────────────
const fenris = new Enemy('boss_alpha_wolf', -50, -50, scene, onPlayerHit, {
  boss: true, leash: 50,
  patrol: [[-50,-50],[-35,-60],[-20,-50],[-35,-40]],
});
enemies.push(fenris);

// ═══════════════════════════════════════════════════════════════════════════
// INVENTORY
// ═══════════════════════════════════════════════════════════════════════════

const inventory = new Inventory(player);
const quests    = new QuestManager();
const magic     = new MagicManager(player, scene, camera);
const crafting  = new CraftingManager(inventory);
const sound     = new SoundManager();

// Loot popup elements
const lootPopup    = document.getElementById('loot-popup');
const lootItemsEl  = document.getElementById('loot-items');
const lootCloseBtn = document.getElementById('loot-close-btn');
let _pendingLoot   = [];

function showLootPopup(itemIds) {
  _pendingLoot = itemIds;
  let html = '';
  // Tally duplicates
  const tally = {};
  for (const id of itemIds) {
    tally[id] = (tally[id] || 0) + 1;
  }
  for (const [id, count] of Object.entries(tally)) {
    const def = ITEMS[id];
    if (!def) continue;
    const color = RARITY_COLORS[def.rarity] || '#ccc';
    html += `<div class="loot-item" style="color:${color}">${def.name}${count > 1 ? ' x' + count : ''}</div>`;
  }
  if (!html) html = '<div class="loot-item" style="color:#888">Nothing</div>';
  lootItemsEl.innerHTML = html;
  lootPopup.style.display = 'block';
  // Release cursor so player can click "Take All"
  if (document.pointerLockElement) document.exitPointerLock();
}

lootCloseBtn.addEventListener('click', () => {
  inventory.addLoot(_pendingLoot);
  _pendingLoot = [];
  lootPopup.style.display = 'none';
  inventory._updateHotbarUI();
  sound.playLootPickup();
  // Re-lock cursor to resume gameplay
  canvas.requestPointerLock();
});

// ═══════════════════════════════════════════════════════════════════════════
// THORNWOOD REGION (east of Millhaven)
// ═══════════════════════════════════════════════════════════════════════════

(function populateThornwood() {
  const rng = mulberry32(99999);
  const BX = 180, BZ = -50; // Briarwatch center

  // Dense forest — darker trees
  const darkFoliage = [
    new THREE.MeshStandardMaterial({ color: 0x1e3e12, roughness: 0.95 }),
    new THREE.MeshStandardMaterial({ color: 0x2a5518, roughness: 0.95 }),
    new THREE.MeshStandardMaterial({ color: 0x1a4a10, roughness: 0.95 }),
  ];

  // Trees along the road from Millhaven to Briarwatch and around
  for (let i = 0; i < 120; i++) {
    const x = 40 + rng() * 140;
    const z = -90 + rng() * 120;
    // Keep clear around Briarwatch buildings
    const dbx = x - BX, dbz = z - BZ;
    if (Math.sqrt(dbx * dbx + dbz * dbz) < 18) continue;

    const y = terrainHeight(x, z);
    const group = new THREE.Group();
    group.position.set(x, y, z);

    const trunk = new THREE.Mesh(GEO.trunk, MAT.trunk);
    trunk.position.y = 1.5; trunk.castShadow = true;
    group.add(trunk);

    const coneGeos = [GEO.cone0, GEO.cone1, GEO.cone2];
    for (let j = 0; j < 3; j++) {
      const cone = new THREE.Mesh(coneGeos[j], darkFoliage[j]);
      cone.position.y = 2.8 + j * 1.6; cone.castShadow = true;
      group.add(cone);
    }
    scene.add(group);
  }

  // Briarwatch buildings
  addBuilding(BX, BZ, 8, 6, 4.0, MAT.wood, MAT.thatch);       // Inn
  addBuilding(BX + 11, BZ + 3, 6, 5, 3.5, MAT.wood, MAT.slate);  // Lumber mill
  addBuilding(BX - 10, BZ - 4, 5, 5, 3.2, MAT.wood, MAT.thatch); // House
  addBuilding(BX + 5, BZ - 12, 5, 4, 3.0, MAT.wood, MAT.thatch); // Cottage

  // Some rocks
  for (let i = 0; i < 15; i++) {
    const x = 50 + rng() * 120;
    const z = -80 + rng() * 100;
    addRock(x, z, 0.3 + rng() * 0.7, rng);
  }

  // ── Thornwood enemies — wolves, spiders, bandits ──────────────────────────
  enemies.push(
    new Enemy('wolf',    60,  -20, scene, onPlayerHit, {
      patrol: [[60,-20],[75,-15],[80,-30],[65,-35]],
    }),
    new Enemy('wolf',    110, -10, scene, onPlayerHit),
    new Enemy('spider',  75,  -55, scene, onPlayerHit),
    new Enemy('spider',  95,  -30, scene, onPlayerHit),
    new Enemy('spider',  120, -60, scene, onPlayerHit),
    new Enemy('bandit',  85,  -40, scene, onPlayerHit, {
      patrol: [[85,-40],[100,-45],[110,-35],[95,-30]],
    }),
    new Enemy('bandit',  140, -55, scene, onPlayerHit, {
      patrol: [[140,-55],[155,-50],[160,-65],[145,-65]],
    }),
    new Enemy('bandit',  155, -35, scene, onPlayerHit),
    new Enemy('skeleton', 130, -70, scene, onPlayerHit, {
      patrol: [[130,-70],[140,-75],[150,-70],[140,-62]],
    }),
    new Enemy('skeleton', 160, -65, scene, onPlayerHit),
  );

  // ── Thornwood Boss: Arachne the Broodmother ────────────────────────────────
  const arachne = new Enemy('boss_spider_queen', 100, -75, scene, onPlayerHit, {
    boss: true, leash: 45,
  });
  enemies.push(arachne);
}());

// ═══════════════════════════════════════════════════════════════════════════
// ASHFELD REGION (south of Greenvale — volcanic foothills)
// ═══════════════════════════════════════════════════════════════════════════

(function populateAshfeld() {
  const rng = mulberry32(77777);
  const CX = 50, CZ = 200; // Cinderhearth center

  // Volcanic rock material
  const volcanicRock  = new THREE.MeshStandardMaterial({ color: 0x4a2a0a, roughness: 0.95 });
  const volcanicDark  = new THREE.MeshStandardMaterial({ color: 0x2a1a08, roughness: 0.95 });
  const lavaGlow      = new THREE.MeshStandardMaterial({ color: 0xff4400, emissive: 0xff2200, emissiveIntensity: 0.4 });

  // Dead/charred trees
  const charredTrunk = new THREE.MeshStandardMaterial({ color: 0x2a1a0a, roughness: 1.0 });

  for (let i = 0; i < 40; i++) {
    const x = CX - 70 + rng() * 140;
    const z = CZ - 70 + rng() * 140;
    const dcx = x - CX, dcz = z - CZ;
    if (Math.sqrt(dcx * dcx + dcz * dcz) < 20) continue;

    const y = terrainHeight(x, z);
    const group = new THREE.Group();
    group.position.set(x, y, z);

    // Charred trunk (no foliage)
    const trunk = new THREE.Mesh(GEO.trunk, charredTrunk);
    trunk.position.y = 1.5; trunk.castShadow = true;
    group.add(trunk);

    // Bare branches
    for (let j = 0; j < 2; j++) {
      const branch = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.06, 1.2, 4),
        charredTrunk
      );
      branch.position.set((rng() - 0.5) * 0.8, 2.5 + j * 0.8, (rng() - 0.5) * 0.8);
      branch.rotation.z = (rng() - 0.5) * 1.2;
      group.add(branch);
    }

    scene.add(group);
  }

  // Volcanic rocks
  for (let i = 0; i < 30; i++) {
    const x = CX - 80 + rng() * 160;
    const z = CZ - 80 + rng() * 160;
    const y = terrainHeight(x, z);
    const mat = rng() > 0.5 ? volcanicRock : volcanicDark;
    const mesh = new THREE.Mesh(GEO.dodec, mat);
    const scale = 0.4 + rng() * 1.2;
    mesh.scale.set(scale, scale * (0.5 + rng() * 0.5), scale * (0.8 + rng() * 0.3));
    mesh.position.set(x, y + scale * 0.4, z);
    mesh.rotation.set(rng() * Math.PI, rng() * Math.PI, rng() * Math.PI);
    mesh.castShadow = true;
    scene.add(mesh);
  }

  // Lava pools (glowing ground patches)
  for (let i = 0; i < 6; i++) {
    const x = CX - 60 + rng() * 120;
    const z = CZ - 60 + rng() * 120;
    const dcx = x - CX, dcz = z - CZ;
    if (Math.sqrt(dcx * dcx + dcz * dcz) < 25) continue;
    const y = terrainHeight(x, z);
    const pool = new THREE.Mesh(
      new THREE.CircleGeometry(1.5 + rng() * 2, 8),
      lavaGlow
    );
    pool.rotation.x = -Math.PI / 2;
    pool.position.set(x, y + 0.05, z);
    scene.add(pool);
    // Glow light
    const light = new THREE.PointLight(0xff4400, 0.8, 12);
    light.position.set(x, y + 1.0, z);
    scene.add(light);
  }

  // Cinderhearth buildings — stone + volcanic rock, dark roofs
  const ashStone = new THREE.MeshStandardMaterial({ color: 0x6a5040, roughness: 0.88 });
  const ashRoof  = new THREE.MeshStandardMaterial({ color: 0x3a2a1a, roughness: 0.95 });

  addBuilding(CX, CZ, 9, 7, 4.5, ashStone, ashRoof);            // Inn (center)
  addBuilding(CX + 12, CZ - 4, 8, 7, 5.0, ashStone, ashRoof);   // Master Forge (large)
  addBuilding(CX - 12, CZ + 4, 6, 5, 3.8, ashStone, ashRoof);   // Alchemy shop
  addBuilding(CX + 6, CZ + 14, 5, 5, 3.2, ashStone, ashRoof);   // House
  addBuilding(CX - 8, CZ - 10, 5, 4, 3.0, ashStone, ashRoof);   // Guard post

  // Forge chimney (tall tower on forge building)
  const chimney = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.0, 6, 6), volcanicRock);
  chimney.position.set(CX + 12, terrainHeight(CX + 12, CZ - 4) + 6, CZ - 4);
  chimney.castShadow = true;
  scene.add(chimney);
  // Forge glow
  const forgeLight = new THREE.PointLight(0xff6622, 1.2, 20);
  forgeLight.position.set(CX + 12, terrainHeight(CX + 12, CZ - 4) + 2, CZ - 4);
  scene.add(forgeLight);

  addSignPost(CX, CZ + 25, 0);
  addWallSegment(CX - 18, CZ - 5, 12, Math.PI / 2);
  addWallSegment(CX + 18, CZ - 5, 12, Math.PI / 2);

  // ── Ashfeld enemies ────────────────────────────────────────────────────────
  enemies.push(
    new Enemy('fire_imp',    CX - 40, CZ + 30,  scene, onPlayerHit, {
      patrol: [[CX-40,CZ+30],[CX-30,CZ+40],[CX-45,CZ+45]],
    }),
    new Enemy('fire_imp',    CX + 35, CZ + 40,  scene, onPlayerHit),
    new Enemy('fire_imp',    CX - 50, CZ - 30,  scene, onPlayerHit),
    new Enemy('fire_imp',    CX + 55, CZ + 15,  scene, onPlayerHit, {
      patrol: [[CX+55,CZ+15],[CX+65,CZ+25],[CX+50,CZ+30]],
    }),
    new Enemy('fire_imp',    CX - 25, CZ + 55,  scene, onPlayerHit),
    new Enemy('fire_imp',    CX + 20, CZ - 50,  scene, onPlayerHit),
    new Enemy('fire_imp',    CX - 60, CZ + 10,  scene, onPlayerHit),
    new Enemy('magma_golem', CX + 50, CZ + 55,  scene, onPlayerHit, { leash: 30 }),
    new Enemy('magma_golem', CX - 55, CZ - 45,  scene, onPlayerHit, { leash: 30 }),
    new Enemy('magma_golem', CX + 30, CZ - 60,  scene, onPlayerHit, { leash: 30 }),
    new Enemy('magma_golem', CX - 40, CZ + 60,  scene, onPlayerHit, { leash: 30 }),
  );

  // ── Ashfeld Boss: Pyraxis the Molten ───────────────────────────────────────
  enemies.push(new Enemy('boss_magma_titan', CX + 65, CZ - 70, scene, onPlayerHit, {
    boss: true, leash: 55,
  }));
}());

// ═══════════════════════════════════════════════════════════════════════════
// FROSTVEIL REGION (northwest — snow peaks, mage academy)
// ═══════════════════════════════════════════════════════════════════════════

(function populateFrostveil() {
  const rng = mulberry32(55555);
  const WX = -180, WZ = -220; // Winterhold Keep center

  // Snow-covered trees
  const snowFoliage = [
    new THREE.MeshStandardMaterial({ color: 0xc8d8e8, roughness: 0.95 }),
    new THREE.MeshStandardMaterial({ color: 0xd8e4f0, roughness: 0.95 }),
    new THREE.MeshStandardMaterial({ color: 0xe0eaf4, roughness: 0.95 }),
  ];
  const frostTrunk = new THREE.MeshStandardMaterial({ color: 0x6a5a4a, roughness: 1.0 });

  for (let i = 0; i < 60; i++) {
    const x = WX - 80 + rng() * 160;
    const z = WZ - 80 + rng() * 160;
    const dwx = x - WX, dwz = z - WZ;
    if (Math.sqrt(dwx * dwx + dwz * dwz) < 22) continue;

    const y = terrainHeight(x, z);
    const group = new THREE.Group();
    group.position.set(x, y, z);

    const trunk = new THREE.Mesh(GEO.trunk, frostTrunk);
    trunk.position.y = 1.5; trunk.castShadow = true;
    group.add(trunk);

    const coneGeos = [GEO.cone0, GEO.cone1, GEO.cone2];
    for (let j = 0; j < 3; j++) {
      const cone = new THREE.Mesh(coneGeos[j], snowFoliage[j]);
      cone.position.y = 2.8 + j * 1.6; cone.castShadow = true;
      group.add(cone);
    }
    scene.add(group);
  }

  // Snow-covered rocks
  const snowRock = new THREE.MeshStandardMaterial({ color: 0xb0b8c8, roughness: 0.90 });
  for (let i = 0; i < 25; i++) {
    const x = WX - 70 + rng() * 140;
    const z = WZ - 70 + rng() * 140;
    const y = terrainHeight(x, z);
    const mesh = new THREE.Mesh(GEO.dodec, snowRock);
    const scale = 0.4 + rng() * 1.0;
    mesh.scale.set(scale, scale * (0.6 + rng() * 0.5), scale * (0.9 + rng() * 0.3));
    mesh.position.set(x, y + scale * 0.45, z);
    mesh.rotation.set(rng() * Math.PI, rng() * Math.PI, rng() * Math.PI);
    mesh.castShadow = true;
    scene.add(mesh);
  }

  // Winterhold Keep — fortress-like stone buildings with slate roofs
  const frostStone = new THREE.MeshStandardMaterial({ color: 0x8898a8, roughness: 0.88 });
  const frostRoof  = new THREE.MeshStandardMaterial({ color: 0x5a6878, roughness: 0.95 });

  addBuilding(WX, WZ, 10, 8, 5.5, frostStone, frostRoof);          // Main keep
  addBuilding(WX - 12, WZ + 4, 7, 6, 4.5, frostStone, frostRoof);  // Arcane Academy
  addBuilding(WX + 8, WZ - 6, 6, 5, 4.0, frostStone, frostRoof);   // Spell shop
  addBuilding(WX + 14, WZ + 8, 5, 5, 3.5, frostStone, frostRoof);  // Barracks
  addBuilding(WX - 6, WZ - 14, 5, 5, 3.2, frostStone, frostRoof);  // House

  // Academy tower
  const tower = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.5, 10, 8), frostStone);
  tower.position.set(WX - 12, terrainHeight(WX - 12, WZ + 4) + 5, WZ + 4);
  tower.castShadow = true;
  scene.add(tower);
  const towerRoof = new THREE.Mesh(new THREE.ConeGeometry(2.0, 3, 8), frostRoof);
  towerRoof.position.set(WX - 12, terrainHeight(WX - 12, WZ + 4) + 11.5, WZ + 4);
  scene.add(towerRoof);
  // Magical glow atop tower
  const arcaneLight = new THREE.PointLight(0x4488ff, 1.5, 25);
  arcaneLight.position.set(WX - 12, terrainHeight(WX - 12, WZ + 4) + 13, WZ + 4);
  scene.add(arcaneLight);

  addSignPost(WX + 2, WZ + 22, 0);
  addWallSegment(WX - 20, WZ - 8, 14, Math.PI / 2);
  addWallSegment(WX + 20, WZ - 8, 14, Math.PI / 2);
  addWallSegment(WX, WZ - 22, 16, 0);

  // ── Frostveil enemies ──────────────────────────────────────────────────────
  enemies.push(
    new Enemy('frost_wolf', WX + 45, WZ + 30,  scene, onPlayerHit, {
      patrol: [[WX+45,WZ+30],[WX+55,WZ+40],[WX+40,WZ+50],[WX+35,WZ+35]],
    }),
    new Enemy('frost_wolf', WX - 40, WZ + 40,  scene, onPlayerHit, {
      patrol: [[WX-40,WZ+40],[WX-30,WZ+50],[WX-50,WZ+55]],
    }),
    new Enemy('frost_wolf', WX + 55, WZ - 25,  scene, onPlayerHit),
    new Enemy('frost_wolf', WX - 50, WZ - 35,  scene, onPlayerHit),
    new Enemy('frost_wolf', WX + 30, WZ + 55,  scene, onPlayerHit),
    new Enemy('frost_wolf', WX - 60, WZ + 10,  scene, onPlayerHit, {
      patrol: [[WX-60,WZ+10],[WX-70,WZ+20],[WX-55,WZ+25]],
    }),
    new Enemy('frost_wolf', WX + 20, WZ - 55,  scene, onPlayerHit),
    new Enemy('ice_wraith', WX - 50, WZ - 50,  scene, onPlayerHit, { leash: 35 }),
    new Enemy('ice_wraith', WX + 55, WZ + 50,  scene, onPlayerHit, { leash: 35 }),
    new Enemy('ice_wraith', WX - 35, WZ + 60,  scene, onPlayerHit),
    new Enemy('ice_wraith', WX + 60, WZ - 40,  scene, onPlayerHit),
    new Enemy('ice_wraith', WX - 20, WZ - 65,  scene, onPlayerHit),
    new Enemy('ice_wraith', WX + 40, WZ - 60,  scene, onPlayerHit),
  );

  // ── Frostveil Boss: Glacius the Eternal ────────────────────────────────────
  enemies.push(new Enemy('boss_frost_warden', WX - 65, WZ - 70, scene, onPlayerHit, {
    boss: true, leash: 50,
    patrol: [[WX-65,WZ-70],[WX-50,WZ-75],[WX-40,WZ-65],[WX-55,WZ-60]],
  }));
}());

// ═══════════════════════════════════════════════════════════════════════════
// THE BLIGHT REGION (far east — corrupted wasteland, end-game)
// ═══════════════════════════════════════════════════════════════════════════

(function populateBlight() {
  const rng = mulberry32(66666);
  const DX = 400, DZ = -60; // Duskspire center

  // Corrupted materials
  const blightGround = new THREE.MeshStandardMaterial({ color: 0x2a1a2a, roughness: 0.95 });
  const blightRock   = new THREE.MeshStandardMaterial({ color: 0x3a2a3a, roughness: 0.90 });
  const blightGlow   = new THREE.MeshStandardMaterial({ color: 0x8800cc, emissive: 0x6600aa, emissiveIntensity: 0.3 });

  // Dead corrupted trees
  const blightTrunk  = new THREE.MeshStandardMaterial({ color: 0x1a0a1a, roughness: 1.0 });

  for (let i = 0; i < 35; i++) {
    const x = DX - 80 + rng() * 160;
    const z = DZ - 70 + rng() * 140;
    const ddx = x - DX, ddz = z - DZ;
    if (Math.sqrt(ddx * ddx + ddz * ddz) < 20) continue;

    const y = terrainHeight(x, z);
    const group = new THREE.Group();
    group.position.set(x, y, z);

    // Twisted dead trunk
    const trunk = new THREE.Mesh(GEO.trunk, blightTrunk);
    trunk.position.y = 1.5; trunk.castShadow = true;
    trunk.rotation.z = (rng() - 0.5) * 0.3;
    group.add(trunk);

    // Glowing corruption veins on trunk
    const vein = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 2.5, 4),
      blightGlow
    );
    vein.position.y = 1.5;
    group.add(vein);

    scene.add(group);
  }

  // Corrupted spire rocks
  for (let i = 0; i < 25; i++) {
    const x = DX - 70 + rng() * 140;
    const z = DZ - 60 + rng() * 120;
    const y = terrainHeight(x, z);
    const mesh = new THREE.Mesh(GEO.dodec, blightRock);
    const scale = 0.5 + rng() * 1.5;
    mesh.scale.set(scale * 0.6, scale, scale * 0.6); // tall and narrow like spires
    mesh.position.set(x, y + scale * 0.5, z);
    mesh.rotation.set(rng() * 0.3, rng() * Math.PI, rng() * 0.3);
    mesh.castShadow = true;
    scene.add(mesh);
  }

  // Corruption pools (glowing purple)
  for (let i = 0; i < 8; i++) {
    const x = DX - 60 + rng() * 120;
    const z = DZ - 50 + rng() * 100;
    const ddx = x - DX, ddz = z - DZ;
    if (Math.sqrt(ddx * ddx + ddz * ddz) < 25) continue;
    const y = terrainHeight(x, z);
    const pool = new THREE.Mesh(
      new THREE.CircleGeometry(1.0 + rng() * 2.5, 8),
      blightGlow
    );
    pool.rotation.x = -Math.PI / 2;
    pool.position.set(x, y + 0.05, z);
    scene.add(pool);
    const light = new THREE.PointLight(0x8800cc, 0.6, 10);
    light.position.set(x, y + 0.8, z);
    scene.add(light);
  }

  // Duskspire buildings — dark stone, slate roofs
  const darkStone = new THREE.MeshStandardMaterial({ color: 0x4a3a4a, roughness: 0.88 });
  const darkRoof  = new THREE.MeshStandardMaterial({ color: 0x2a1a2a, roughness: 0.95 });

  addBuilding(DX, DZ, 9, 7, 5.0, darkStone, darkRoof);          // Inn
  addBuilding(DX + 12, DZ + 6, 8, 6, 5.5, darkStone, darkRoof); // Garrison HQ
  addBuilding(DX - 12, DZ + 2, 6, 5, 4.0, darkStone, darkRoof); // War supply
  addBuilding(DX + 6, DZ - 14, 5, 5, 3.5, darkStone, darkRoof); // Barracks
  addBuilding(DX - 8, DZ - 12, 5, 5, 3.2, darkStone, darkRoof); // House

  // Garrison watchtower
  const watchTower = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.2, 8, 6), darkStone);
  watchTower.position.set(DX + 12, terrainHeight(DX + 12, DZ + 6) + 4, DZ + 6);
  watchTower.castShadow = true;
  scene.add(watchTower);
  const watchRoof = new THREE.Mesh(new THREE.ConeGeometry(1.8, 2.5, 6), darkRoof);
  watchRoof.position.set(DX + 12, terrainHeight(DX + 12, DZ + 6) + 9.25, DZ + 6);
  scene.add(watchRoof);
  // Warning beacon
  const beacon = new THREE.PointLight(0xcc00ff, 1.0, 20);
  beacon.position.set(DX + 12, terrainHeight(DX + 12, DZ + 6) + 10, DZ + 6);
  scene.add(beacon);

  addSignPost(DX - 2, DZ + 22, 0);
  addWallSegment(DX - 20, DZ - 5, 14, Math.PI / 2);
  addWallSegment(DX + 20, DZ - 5, 14, Math.PI / 2);
  addWallSegment(DX, DZ - 20, 16, 0);

  // ── Blight enemies ─────────────────────────────────────────────────────────
  enemies.push(
    new Enemy('blight_hound',     DX - 45, DZ + 30,  scene, onPlayerHit, {
      patrol: [[DX-45,DZ+30],[DX-35,DZ+40],[DX-50,DZ+45]],
    }),
    new Enemy('blight_hound',     DX + 40, DZ + 40,  scene, onPlayerHit, {
      patrol: [[DX+40,DZ+40],[DX+55,DZ+35],[DX+50,DZ+50]],
    }),
    new Enemy('blight_hound',     DX - 55, DZ - 25,  scene, onPlayerHit),
    new Enemy('blight_hound',     DX + 50, DZ - 35,  scene, onPlayerHit),
    new Enemy('blight_hound',     DX - 35, DZ + 55,  scene, onPlayerHit),
    new Enemy('blight_hound',     DX + 60, DZ + 10,  scene, onPlayerHit),
    new Enemy('corrupted_knight', DX + 55, DZ + 50,  scene, onPlayerHit, {
      patrol: [[DX+55,DZ+50],[DX+65,DZ+55],[DX+60,DZ+65],[DX+50,DZ+60]],
      leash: 35,
    }),
    new Enemy('corrupted_knight', DX - 50, DZ - 50,  scene, onPlayerHit, {
      patrol: [[DX-50,DZ-50],[DX-40,DZ-55],[DX-55,DZ-60]],
      leash: 35,
    }),
    new Enemy('corrupted_knight', DX + 40, DZ - 55,  scene, onPlayerHit, { leash: 35 }),
    new Enemy('corrupted_knight', DX - 60, DZ + 40,  scene, onPlayerHit, { leash: 35 }),
    new Enemy('corrupted_knight', DX + 25, DZ + 65,  scene, onPlayerHit, { leash: 35 }),
  );

  // ── Blight Boss: Malachar the Undying ──────────────────────────────────────
  const malachar = new Enemy('boss_blight_lord', DX + 70, DZ - 75, scene, onPlayerHit, {
    boss: true, leash: 60,
    patrol: [[DX+70,DZ-75],[DX+80,DZ-65],[DX+75,DZ-55],[DX+65,DZ-65]],
  });
  // Summon callback — spawns 2 blight hounds nearby
  malachar._onSummon = function(boss) {
    for (let i = 0; i < 2; i++) {
      const sx = boss.mesh.position.x + (Math.random() - 0.5) * 8;
      const sz = boss.mesh.position.z + (Math.random() - 0.5) * 8;
      const minion = new Enemy('blight_hound', sx, sz, scene, onPlayerHit, { leash: 20 });
      enemies.push(minion);
    }
  };
  enemies.push(malachar);
}());

// ═══════════════════════════════════════════════════════════════════════════
// NPCs
// ═══════════════════════════════════════════════════════════════════════════

const npcs = [];
for (const id of Object.keys(NPC_DATA)) {
  npcs.push(new NPC(id, scene));
}

// ═══════════════════════════════════════════════════════════════════════════
// LOOT DROPS  (ground bags from enemy kills)
// ═══════════════════════════════════════════════════════════════════════════

const lootDrops = [];
const LOOT_PICKUP_RANGE = 3.0;

const _lootBagGeo = new THREE.DodecahedronGeometry(0.25, 0);
const _lootBagMat = new THREE.MeshStandardMaterial({
  color: 0xc8a050, roughness: 0.7, metalness: 0.2, emissive: 0xc8a050, emissiveIntensity: 0.15
});

function spawnLootDrop(x, z, items) {
  const y = terrainHeight(x, z);
  const group = new THREE.Group();
  group.position.set(x, y + 0.35, z);

  const bag = new THREE.Mesh(_lootBagGeo, _lootBagMat);
  bag.scale.set(1, 0.7, 1);
  group.add(bag);

  // Small glow light
  const glow = new THREE.PointLight(0xf5c542, 0.6, 6);
  glow.position.y = 0.3;
  group.add(glow);

  scene.add(group);
  lootDrops.push({ mesh: group, items, baseY: y + 0.35, age: 0 });
}

function removeLootDrop(drop) {
  scene.remove(drop.mesh);
  const idx = lootDrops.indexOf(drop);
  if (idx !== -1) lootDrops.splice(idx, 1);
}

// ═══════════════════════════════════════════════════════════════════════════
// INTERACTION SYSTEM
// ═══════════════════════════════════════════════════════════════════════════

const interactPrompt  = document.getElementById('interact-prompt');
const INTERACT_RANGE  = 4.0;
let _nearestNPC       = null;   // NPC object or null
let _nearestLootDrop  = null;   // loot drop object or null

function updateInteraction() {
  const pp = player.position;
  const faceFwd = new THREE.Vector3(-Math.sin(player.yaw), 0, -Math.cos(player.yaw));

  // ── Check loot drops first (priority over NPCs) ──────────────────────────
  let closestDrop = null;
  let closestDropDist = Infinity;
  for (const drop of lootDrops) {
    const dx = drop.mesh.position.x - pp.x;
    const dz = drop.mesh.position.z - pp.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < LOOT_PICKUP_RANGE && dist < closestDropDist) {
      const toDropV = new THREE.Vector3(dx, 0, dz).normalize();
      if (faceFwd.dot(toDropV) > 0.3) {
        closestDrop = drop;
        closestDropDist = dist;
      }
    }
  }

  _nearestLootDrop = closestDrop;
  if (closestDrop) {
    interactPrompt.textContent = 'E — Loot';
    interactPrompt.style.opacity = '1';
    _nearestNPC = null;
    return;
  }

  // ── Check NPCs ───────────────────────────────────────────────────────────
  let closest = null;
  let closestDist = Infinity;

  for (const npc of npcs) {
    const d = npc.distanceTo(pp);
    if (d < INTERACT_RANGE && d < closestDist) {
      const dx = npc.mesh.position.x - pp.x;
      const dz = npc.mesh.position.z - pp.z;
      const toNpc = new THREE.Vector3(dx, 0, dz).normalize();
      if (faceFwd.dot(toNpc) > 0.5) {
        closest = npc;
        closestDist = d;
      }
    }
  }

  _nearestNPC = closest;
  if (closest) {
    const label = closest.data.title || closest.data.name;
    interactPrompt.textContent = 'E — Talk to ' + label;
    interactPrompt.style.opacity = '1';
  } else {
    interactPrompt.style.opacity = '0';
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// DIALOGUE CONTROLLER
// ═══════════════════════════════════════════════════════════════════════════

const dialogueOverlay = document.getElementById('dialogue-overlay');
const dialogueSpeaker = document.getElementById('dialogue-speaker');
const dialogueText    = document.getElementById('dialogue-text');
const dialogueOptions = document.getElementById('dialogue-options');

let _dialogueNPC   = null;  // current NPC in dialogue
let _dialogueNode  = null;  // current dialogue node key

function openDialogue(npc) {
  _dialogueNPC = npc;

  // Notify quest system that we're talking to this NPC
  quests.onTalk(npc.id);

  // Check for quest turn-ins — if this NPC is a turn-in target for a completed quest
  for (const qid of Object.keys(quests.active)) {
    if (quests.allObjectivesMet(qid)) {
      const rewards = quests.turnIn(qid);
      if (rewards) {
        sound.playQuestComplete();
        if (rewards.gold) inventory.gold += rewards.gold;
        if (rewards.xp)   awardXP(rewards.xp);
        if (rewards.items) {
          for (const itemId of rewards.items) inventory.addItem(itemId);
        }
        inventory._updateHotbarUI();
        // Auto-save after quest turn-in
        SaveManager.save(player, inventory, quests, magic);
        // Show a reward message instead of normal greeting
        _dialogueNPC = npc;
        _dialogueNode = '_reward';
        dialogueSpeaker.textContent = npc.data.name + ' — ' + npc.data.title;
        const def = QUEST_DATA[qid];
        let rewardText = `Quest complete: ${def.title}!\n\nRewards: `;
        if (rewards.xp) rewardText += rewards.xp + ' XP, ';
        if (rewards.gold) rewardText += rewards.gold + ' Gold';
        if (rewards.items) {
          for (const id of rewards.items) {
            const item = ITEMS[id];
            if (item) rewardText += ', ' + item.name;
          }
        }
        dialogueText.textContent = rewardText;
        dialogueOptions.innerHTML = '<button class="dialogue-option" data-idx="0">Thank you!</button>';
        dialogueOverlay.style.display = 'block';
        if (document.pointerLockElement) document.exitPointerLock();
        return;
      }
    }
  }

  showDialogueNode('greeting');
  dialogueOverlay.style.display = 'block';
  if (document.pointerLockElement) document.exitPointerLock();
}

function closeDialogue() {
  dialogueOverlay.style.display = 'none';
  _dialogueNPC = null;
  _dialogueNode = null;
  canvas.requestPointerLock();
}

function showDialogueNode(nodeKey) {
  _dialogueNode = nodeKey;
  const data = _dialogueNPC.data;
  const node = nodeKey === 'greeting' ? data.dialogue : data.dialogue[nodeKey];
  if (!node) { closeDialogue(); return; }

  const text    = node.greeting || node.text || '';
  const options = node.options || [];

  dialogueSpeaker.textContent = data.name + ' — ' + data.title;
  dialogueText.textContent = text;

  let html = '';
  for (let i = 0; i < options.length; i++) {
    html += `<button class="dialogue-option" data-idx="${i}">${options[i].text}</button>`;
  }
  dialogueOptions.innerHTML = html;
}

dialogueOptions.addEventListener('click', e => {
  const btn = e.target.closest('.dialogue-option');
  if (!btn || !_dialogueNPC) return;

  const idx  = parseInt(btn.dataset.idx);

  // Reward screen — any click closes
  if (_dialogueNode === '_reward') { closeDialogue(); return; }

  const data = _dialogueNPC.data;
  const node = _dialogueNode === 'greeting' ? data.dialogue : data.dialogue[_dialogueNode];
  const opt  = node.options[idx];
  if (!opt) return;

  if (opt.action === 'close') {
    closeDialogue();
  } else if (opt.action === 'rest') {
    // Restore stats
    player.hp = player.maxHp;
    player.sp = player.maxSp;
    player.mp = player.maxMp;
    closeDialogue();
  } else if (opt.action === 'shop') {
    const shopNpc = _dialogueNPC;
    // Close dialogue without re-locking — shop will handle the cursor
    dialogueOverlay.style.display = 'none';
    _dialogueNPC = null;
    _dialogueNode = null;
    openShop(shopNpc);
  } else if (opt.action === 'accept_wolf_quest') {
    if (quests.accept('wolf_bounty')) {
      inventory.addItem('potion_health', 1);
      inventory._updateHotbarUI();
    }
    closeDialogue();
  } else if (opt.action === 'accept_ashfeld_imps') {
    quests.accept('ashfeld_imps');
    closeDialogue();
  } else if (opt.action === 'accept_ashfeld_golem') {
    quests.accept('ashfeld_golem');
    closeDialogue();
  } else if (opt.action === 'accept_frostveil_wraiths') {
    quests.accept('frostveil_wraiths');
    closeDialogue();
  } else if (opt.action === 'accept_frostveil_wolves') {
    quests.accept('frostveil_wolves');
    closeDialogue();
  } else if (opt.action === 'accept_blight_knights') {
    quests.accept('blight_knights');
    closeDialogue();
  } else if (opt.action === 'accept_blight_hounds') {
    quests.accept('blight_hounds');
    closeDialogue();
  } else if (opt.next) {
    showDialogueNode(opt.next);
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// SHOP CONTROLLER
// ═══════════════════════════════════════════════════════════════════════════

const shopOverlay  = document.getElementById('shop-overlay');
const shopTitle    = document.getElementById('shop-title');
const shopGoldEl   = document.getElementById('shop-gold');
const shopItemsEl  = document.getElementById('shop-items');
const shopCloseBtn = document.getElementById('shop-close-btn');
const shopTabs     = document.querySelectorAll('.shop-tab');

let _shopNPC  = null;
let _shopTab  = 'buy';

function openShop(npc) {
  _shopNPC = npc;
  _shopTab = 'buy';
  shopTitle.textContent = npc.data.name + "'s Wares";
  shopOverlay.style.display = 'flex';
  for (const t of shopTabs) t.classList.toggle('shop-tab-active', t.dataset.tab === 'buy');
  renderShop();
  if (document.pointerLockElement) document.exitPointerLock();
}

function closeShop() {
  shopOverlay.style.display = 'none';
  _shopNPC = null;
  canvas.requestPointerLock();
}

function renderShop() {
  shopGoldEl.textContent = 'Gold: ' + inventory.gold;
  let html = '';

  if (_shopTab === 'buy' && _shopNPC && _shopNPC.data.shopItems) {
    for (const id of _shopNPC.data.shopItems) {
      const def = ITEMS[id];
      if (!def) continue;
      const color = RARITY_COLORS[def.rarity] || '#ccc';
      const info  = def.damage ? 'Dmg: ' + def.damage : def.armor ? 'Armor: ' + def.armor : def.amount ? '+' + def.amount + ' ' + (def.restores || '').toUpperCase() : '';
      const price = Math.ceil(def.value * 1.5); // buy markup
      const canBuy = inventory.gold >= price;
      html += `<div class="shop-item">` +
        `<span class="shop-item-name" style="color:${color}">${def.name}</span>` +
        `<span class="shop-item-info">${info}</span>` +
        `<span class="shop-item-price">${price}g</span>` +
        `<button class="shop-buy-btn" data-id="${id}" data-price="${price}" ${canBuy ? '' : 'disabled style="opacity:0.3;cursor:default"'}>Buy</button>` +
        `</div>`;
    }
  } else if (_shopTab === 'sell') {
    for (const slot of inventory.items) {
      const def = ITEMS[slot.id];
      if (!def || def.type === 'quest') continue;
      const color = RARITY_COLORS[def.rarity] || '#ccc';
      const price = Math.floor(def.value * 0.5); // sell discount
      html += `<div class="shop-item">` +
        `<span class="shop-item-name" style="color:${color}">${def.name} ${slot.count > 1 ? 'x' + slot.count : ''}</span>` +
        `<span class="shop-item-info"></span>` +
        `<span class="shop-item-price">${price}g</span>` +
        `<button class="shop-sell-btn" data-id="${slot.id}" data-price="${price}">Sell</button>` +
        `</div>`;
    }
    if (!html) html = '<div style="padding:12px;color:rgba(255,255,255,0.3);font-size:11px;text-align:center">Nothing to sell</div>';
  }

  shopItemsEl.innerHTML = html;
}

shopItemsEl.addEventListener('click', e => {
  const buyBtn  = e.target.closest('.shop-buy-btn');
  const sellBtn = e.target.closest('.shop-sell-btn');

  if (buyBtn) {
    const id    = buyBtn.dataset.id;
    const price = parseInt(buyBtn.dataset.price);
    if (inventory.gold >= price) {
      inventory.gold -= price;
      inventory.addItem(id);
      renderShop();
    }
  }
  if (sellBtn) {
    const id    = sellBtn.dataset.id;
    const price = parseInt(sellBtn.dataset.price);
    if (inventory.hasItem(id)) {
      inventory.removeItem(id, 1);
      inventory.gold += price;
      renderShop();
    }
  }
});

for (const tab of shopTabs) {
  tab.addEventListener('click', () => {
    _shopTab = tab.dataset.tab;
    for (const t of shopTabs) t.classList.toggle('shop-tab-active', t === tab);
    renderShop();
  });
}

shopCloseBtn.addEventListener('click', closeShop);

// ═══════════════════════════════════════════════════════════════════════════
// UNIFIED MENU CONTROLLER  (I/Tab → Inventory, J → Quests, K → Spellbook)
// ═══════════════════════════════════════════════════════════════════════════

const menuOverlay  = document.getElementById('menu-overlay');
const menuTabs     = document.querySelectorAll('.menu-tab');
const menuPanels   = document.querySelectorAll('.menu-panel');

const magicSpellList = document.getElementById('magic-spell-list');
const magicDetail    = document.getElementById('magic-detail');
const magicLeftName  = document.getElementById('magic-left-name');
const magicRightName = document.getElementById('magic-right-name');

let _menuOpen      = false;
let _menuTab       = 'inventory'; // 'inventory' | 'quests' | 'magic'
let _magicSelected = null;

function openMenu(tab) {
  _menuTab = tab || 'inventory';
  _menuOpen = true;
  menuOverlay.style.display = 'flex';
  switchMenuTab(_menuTab);
  sound.playMenuOpen();
  if (document.pointerLockElement) document.exitPointerLock();
}

function closeMenu() {
  _menuOpen = false;
  menuOverlay.style.display = 'none';
  inventory.close();
  quests.close();
  sound.playMenuClose();
  canvas.requestPointerLock();
}

function switchMenuTab(tab) {
  _menuTab = tab;
  // Update tab bar highlight
  for (const t of menuTabs) t.classList.toggle('menu-tab-active', t.dataset.panel === tab);
  // Show/hide panels
  for (const p of menuPanels) p.classList.toggle('menu-panel-active', p.id === 'panel-' + tab);

  // Activate the appropriate sub-system
  if (tab === 'inventory') {
    quests.close();
    inventory.open();
  } else if (tab === 'character') {
    inventory.close();
    quests.close();
    renderCharPanel();
  } else if (tab === 'quests') {
    inventory.close();
    quests.open();
  } else if (tab === 'magic') {
    inventory.close();
    quests.close();
    _magicSelected = null;
    renderMagicMenu();
  } else if (tab === 'crafting') {
    inventory.close();
    quests.close();
    crafting._selected = null;
    renderCraftingMenu();
  }
}

// Tab bar clicks
for (const t of menuTabs) {
  t.addEventListener('click', () => switchMenuTab(t.dataset.panel));
}

// ── Character panel rendering ──────────────────────────────────────────────

const charInfo  = document.getElementById('char-info');
const charStats = document.getElementById('char-stats');

function renderCharPanel() {
  const p = player;
  charInfo.innerHTML =
    `<div class="char-section">Overview</div>` +
    `<div class="char-row"><span class="char-label">Level</span><span class="char-val-gold">${p.level}</span></div>` +
    `<div class="char-row"><span class="char-label">XP</span><span class="char-val">${p.xp} / ${p.level >= p.maxLevel ? 'MAX' : p.xpToNext()}</span></div>` +
    `<div class="char-section">Resources</div>` +
    `<div class="char-row"><span class="char-label">Health</span><span class="char-val">${Math.round(p.hp)} / ${p.maxHp}</span></div>` +
    `<div class="char-row"><span class="char-label">Stamina</span><span class="char-val">${Math.round(p.sp)} / ${p.maxSp}</span></div>` +
    `<div class="char-row"><span class="char-label">Magic</span><span class="char-val">${Math.round(p.mp)} / ${p.maxMp}</span></div>` +
    `<div class="char-section">Derived</div>` +
    `<div class="char-row"><span class="char-label">Melee Damage</span><span class="char-val">${p.attackDamage.toFixed(1)}</span></div>` +
    `<div class="char-row"><span class="char-label">Spell Mult</span><span class="char-val">x${p.spellDamageMultiplier.toFixed(2)}</span></div>` +
    `<div class="char-row"><span class="char-label">Armor</span><span class="char-val">${p.armor}</span></div>` +
    `<div class="char-row"><span class="char-label">Crit Chance</span><span class="char-val">${(p.critChance * 100).toFixed(1)}%</span></div>` +
    `<div class="char-row"><span class="char-label">Move Speed</span><span class="char-val">${p.WALK_SPEED.toFixed(1)}</span></div>` +
    `<div class="char-row"><span class="char-label">SP Regen</span><span class="char-val">${p.SP_REGEN.toFixed(1)}/s</span></div>` +
    `<div class="char-row"><span class="char-label">MP Regen</span><span class="char-val">${p.MP_REGEN.toFixed(1)}/s</span></div>` +
    `<div class="char-row"><span class="char-label">Carry Cap</span><span class="char-val">${p.maxWeight}</span></div>`;

  const pts = p.statPoints;
  const statList = [
    { key: 'str', name: 'Strength',     desc: 'Melee dmg, carry weight' },
    { key: 'agi', name: 'Agility',      desc: 'Move speed, dodge' },
    { key: 'end', name: 'Endurance',    desc: 'Max SP, SP regen' },
    { key: 'int', name: 'Intelligence', desc: 'Max MP, spell damage' },
    { key: 'wil', name: 'Willpower',    desc: 'MP regen, magic resist' },
    { key: 'per', name: 'Perception',   desc: 'Crit chance, ranged' },
  ];

  let html = `<div class="char-section">Core Stats</div>`;
  if (pts > 0) html += `<div class="char-pts">Unspent Points: ${pts}</div>`;
  for (const s of statList) {
    html += `<div class="char-stat-row">` +
      `<span class="char-stat-name">${s.name}</span>` +
      `<span class="char-stat-val">${p[s.key]}</span>` +
      `<button class="char-plus" data-stat="${s.key}" ${pts > 0 ? '' : 'disabled'}>+</button>` +
      `<span style="font-size:8px;color:rgba(255,255,255,0.25);letter-spacing:1px">${s.desc}</span>` +
      `</div>`;
  }
  charStats.innerHTML = html;
}

charStats.addEventListener('click', e => {
  const btn = e.target.closest('.char-plus');
  if (!btn || btn.disabled) return;
  player.allocateStat(btn.dataset.stat);
  renderCharPanel();
});

// ── Magic (Spellbook) panel rendering ──────────────────────────────────────

function renderMagicMenu() {
  const ls = magic.leftSpell  ? SPELLS[magic.leftSpell]  : null;
  const rs = magic.rightSpell ? SPELLS[magic.rightSpell] : null;
  magicLeftName.textContent  = ls ? ls.name : '— None —';
  magicRightName.textContent = rs ? rs.name : '— None —';

  if (magic.known.length === 0) {
    magicSpellList.innerHTML = '<div class="magic-empty">No spells known</div>';
    magicDetail.innerHTML = '<div class="magic-empty">Learn spells from Spell Tomes</div>';
    return;
  }

  let html = '';
  for (let i = 0; i < magic.known.length; i++) {
    const spell = SPELLS[magic.known[i]];
    if (!spell) continue;
    const sel = _magicSelected === i ? 'magic-spell-item-selected' : '';
    let eqTag = '';
    if (magic.leftSpell === spell.id) eqTag += '<span class="magic-equipped-tag">L</span>';
    if (magic.rightSpell === spell.id) eqTag += '<span class="magic-equipped-tag">R</span>';
    html += `<div class="magic-spell-item ${sel}" data-idx="${i}">` +
      `<span class="magic-spell-name">${spell.name}</span>` +
      `${eqTag}` +
      `<span class="magic-spell-school">${spell.school}</span>` +
      `</div>`;
  }
  magicSpellList.innerHTML = html;

  if (_magicSelected === null || !magic.known[_magicSelected]) {
    magicDetail.innerHTML = '<div class="magic-empty">Select a spell</div>';
    return;
  }

  const spell = SPELLS[magic.known[_magicSelected]];
  let stats = '';
  if (spell.damage)     stats += `<div class="magic-stat">Damage: ${spell.damage}</div>`;
  if (spell.healAmount) stats += `<div class="magic-stat">Heals: ${spell.healAmount} HP</div>`;
  if (spell.armorBonus) stats += `<div class="magic-stat">Armor Bonus: +${spell.armorBonus}</div>`;
  if (spell.duration)   stats += `<div class="magic-stat">Duration: ${spell.duration}s</div>`;
  stats += `<div class="magic-stat">MP Cost: ${spell.mpCost}${spell.beam ? '/sec' : ''}</div>`;
  if (spell.speed)      stats += `<div class="magic-stat">Speed: ${spell.speed}</div>`;

  const isLeft  = magic.leftSpell  === spell.id;
  const isRight = magic.rightSpell === spell.id;

  let actions = '';
  actions += `<button class="magic-btn ${isLeft ? 'magic-btn-active' : ''}" data-action="left" data-id="${spell.id}">${isLeft ? 'Unequip Left' : 'Equip Left (RMB)'}</button>`;
  actions += `<button class="magic-btn ${isRight ? 'magic-btn-active' : ''}" data-action="right" data-id="${spell.id}">${isRight ? 'Unequip Right' : 'Equip Right (Q)'}</button>`;

  magicDetail.innerHTML =
    `<div class="magic-detail-name">${spell.name}</div>` +
    `<div class="magic-detail-school">${spell.school}</div>` +
    `<div class="magic-detail-desc">${spell.description}</div>` +
    `<div class="magic-detail-stats">${stats}</div>` +
    `<div class="magic-detail-actions">${actions}</div>`;
}

magicSpellList.addEventListener('click', e => {
  const el = e.target.closest('.magic-spell-item');
  if (!el) return;
  _magicSelected = parseInt(el.dataset.idx);
  renderMagicMenu();
});

magicDetail.addEventListener('click', e => {
  const btn = e.target.closest('.magic-btn');
  if (!btn) return;
  const action = btn.dataset.action;
  const id     = btn.dataset.id;

  if (action === 'left') {
    if (magic.leftSpell === id) magic.unequipLeft();
    else magic.equipLeft(id);
  }
  if (action === 'right') {
    if (magic.rightSpell === id) magic.unequipRight();
    else magic.equipRight(id);
  }
  renderMagicMenu();
});

// ═══════════════════════════════════════════════════════════════════════════
// CRAFTING PANEL
// ═══════════════════════════════════════════════════════════════════════════

const craftRecipeList = document.getElementById('craft-recipe-list');
const craftDetail     = document.getElementById('craft-detail');
const craftSubtabs    = document.querySelectorAll('.craft-subtab');

function renderCraftingMenu() {
  const recipes = crafting.getRecipes();

  // Recipe list
  if (recipes.length === 0) {
    craftRecipeList.innerHTML = '<div class="craft-empty">No recipes</div>';
    craftDetail.innerHTML = '<div class="craft-empty">Select a recipe</div>';
    return;
  }

  let html = '';
  for (let i = 0; i < recipes.length; i++) {
    const r = recipes[i];
    const sel = crafting._selected === i ? 'craft-recipe-item-selected' : '';
    const can = crafting.canCraft(r);
    const avail = can ? '' : 'craft-recipe-item-unavailable';
    const outDef = ITEMS[r.output];
    const color = outDef ? (RARITY_COLORS[outDef.rarity] || '#ccc') : '#ccc';
    html += `<div class="craft-recipe-item ${sel} ${avail}" data-idx="${i}">` +
      `<span class="craft-recipe-name" style="color:${color}">${r.name}</span>` +
      `${r.outputCount > 1 ? '<span class="craft-recipe-count">x' + r.outputCount + '</span>' : ''}` +
      `</div>`;
  }
  craftRecipeList.innerHTML = html;

  // Detail panel
  if (crafting._selected === null || !recipes[crafting._selected]) {
    craftDetail.innerHTML = '<div class="craft-empty">Select a recipe</div>';
    return;
  }

  const recipe = recipes[crafting._selected];
  const outDef = ITEMS[recipe.output];
  const outColor = outDef ? (RARITY_COLORS[outDef.rarity] || '#ccc') : '#ccc';
  const can = crafting.canCraft(recipe);

  // Output item info
  let outputInfo = '';
  if (outDef) {
    if (outDef.damage) outputInfo += `<div class="craft-output-stats">Damage: ${outDef.damage}</div>`;
    if (outDef.armor)  outputInfo += `<div class="craft-output-stats">Armor: ${outDef.armor}</div>`;
    if (outDef.amount) outputInfo += `<div class="craft-output-stats">Restores: ${outDef.amount} ${(outDef.restores || '').toUpperCase()}</div>`;
    if (outDef.magicBonus) outputInfo += `<div class="craft-output-stats">Magic Bonus: +${outDef.magicBonus}</div>`;
  }

  // Ingredients
  let ingHtml = '';
  for (const ing of recipe.ingredients) {
    const ingDef = ITEMS[ing.id];
    const have = inventory.hasItem(ing.id);
    const enough = have >= ing.count;
    const cls = enough ? 'craft-ing-have' : 'craft-ing-need';
    ingHtml += `<div class="craft-ingredient ${cls}">${ingDef ? ingDef.name : ing.id} — ${have}/${ing.count}</div>`;
  }

  craftDetail.innerHTML =
    `<div class="craft-detail-name" style="color:${outColor}">${recipe.name}${recipe.outputCount > 1 ? ' x' + recipe.outputCount : ''}</div>` +
    `<div class="craft-detail-output">${outDef ? outDef.description : ''}</div>` +
    outputInfo +
    `<div class="craft-section">Ingredients</div>` +
    ingHtml +
    `<div class="craft-detail-desc" style="margin-top:10px">${recipe.description}</div>` +
    `<button class="craft-btn" data-idx="${crafting._selected}" ${can ? '' : 'disabled'}>Craft</button>`;
}

// Recipe list clicks
craftRecipeList.addEventListener('click', e => {
  const el = e.target.closest('.craft-recipe-item');
  if (!el) return;
  crafting._selected = parseInt(el.dataset.idx);
  renderCraftingMenu();
});

// Craft button + subtab clicks
craftDetail.addEventListener('click', e => {
  const btn = e.target.closest('.craft-btn');
  if (!btn || btn.disabled) return;
  const idx = parseInt(btn.dataset.idx);
  const recipes = crafting.getRecipes();
  const recipe = recipes[idx];
  if (recipe && crafting.craft(recipe)) {
    renderCraftingMenu();
    sound.playCraftSuccess();
    // Flash success message
    const msg = document.createElement('div');
    msg.className = 'craft-success';
    const outDef = ITEMS[recipe.output];
    msg.textContent = `Crafted ${outDef ? outDef.name : recipe.name}${recipe.outputCount > 1 ? ' x' + recipe.outputCount : ''}!`;
    craftDetail.appendChild(msg);
    inventory._updateHotbarUI();
  }
});

// Subtab switching
for (const tab of craftSubtabs) {
  tab.addEventListener('click', () => {
    crafting._craftTab = tab.dataset.craft;
    crafting._selected = null;
    for (const t of craftSubtabs) t.classList.toggle('craft-subtab-active', t === tab);
    renderCraftingMenu();
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// LEVEL-UP CONTROLLER
// ═══════════════════════════════════════════════════════════════════════════

const levelupOverlay = document.getElementById('levelup-overlay');
const levelupLevel   = document.getElementById('levelup-level');
const levelupPts     = document.getElementById('levelup-pts');
const levelupDone    = document.getElementById('levelup-done');

let _levelupOpen = false;

function openLevelUp() {
  _levelupOpen = true;
  levelupLevel.textContent = player.level;
  renderLevelUp();
  levelupOverlay.style.display = 'flex';
  if (document.pointerLockElement) document.exitPointerLock();
}

function closeLevelUp() {
  _levelupOpen = false;
  levelupOverlay.style.display = 'none';
  canvas.requestPointerLock();
}

function renderLevelUp() {
  levelupPts.textContent = player.statPoints;
  document.getElementById('lu-str').textContent = player.str;
  document.getElementById('lu-agi').textContent = player.agi;
  document.getElementById('lu-end').textContent = player.end;
  document.getElementById('lu-int').textContent = player.int;
  document.getElementById('lu-wil').textContent = player.wil;
  document.getElementById('lu-per').textContent = player.per;

  // Enable/disable + buttons
  for (const btn of document.querySelectorAll('.levelup-plus')) {
    btn.disabled = player.statPoints <= 0;
  }
  // Enable done button only when all points spent (or allow early close)
  levelupDone.disabled = false;
}

// Stat + button clicks
document.getElementById('levelup-stats').addEventListener('click', e => {
  const btn = e.target.closest('.levelup-plus');
  if (!btn || btn.disabled) return;
  player.allocateStat(btn.dataset.stat);
  renderLevelUp();
});

levelupDone.addEventListener('click', () => {
  closeLevelUp();
});

// ── XP award helper ─────────────────────────────────────────────────────────
function awardXP(amount) {
  const leveled = player.addXP(amount);
  // Show XP gain in kill feed
  const line = document.createElement('div');
  line.textContent = '+' + amount + ' XP';
  line.style.cssText = 'margin-bottom:4px;opacity:1;transition:opacity 2s;color:#f59e0b';
  killFeed.appendChild(line);
  setTimeout(() => { line.style.opacity = '0'; }, 800);
  setTimeout(() => { if (line.parentNode) line.parentNode.removeChild(line); }, 2800);

  if (leveled) {
    sound.playLevelUp();
    // Small delay so kill message shows first
    setTimeout(() => openLevelUp(), 300);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// LOCATION NAME (based on player position)
// ═══════════════════════════════════════════════════════════════════════════

const locationNameEl = document.getElementById('location-name');

function updateLocationName() {
  const px = player.position.x, pz = player.position.z;

  // Towns (check first — higher priority than regions)
  if (Math.abs(px) < 25 && pz > -78 && pz < -30) {
    locationNameEl.textContent = 'Millhaven';
  }
  else if (Math.abs(px - 180) < 20 && Math.abs(pz + 50) < 25) {
    locationNameEl.textContent = 'Briarwatch';
  }
  else if (Math.abs(px - 50) < 22 && Math.abs(pz - 200) < 28) {
    locationNameEl.textContent = 'Cinderhearth';
  }
  else if (Math.abs(px + 180) < 24 && Math.abs(pz + 220) < 28) {
    locationNameEl.textContent = 'Winterhold Keep';
  }
  else if (Math.abs(px - 400) < 24 && Math.abs(pz + 60) < 28) {
    locationNameEl.textContent = 'Duskspire';
  }
  // Regions
  else if (Math.sqrt((px + 180) * (px + 180) + (pz + 220) * (pz + 220)) < 120) {
    locationNameEl.textContent = 'Frostveil';
  }
  else if (Math.sqrt((px - 50) * (px - 50) + (pz - 200) * (pz - 200)) < 100) {
    locationNameEl.textContent = 'Ashfeld';
  }
  else if (Math.sqrt((px - 400) * (px - 400) + (pz + 60) * (pz + 60)) < 110) {
    locationNameEl.textContent = 'The Blight';
  }
  else if (px > 35 && px < 220) {
    locationNameEl.textContent = 'Thornwood';
  }
  else {
    locationNameEl.textContent = 'Greenvale';
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// QUEST HUD
// ═══════════════════════════════════════════════════════════════════════════

const questHudTitle = document.getElementById('quest-hud-title');
const questHudObj   = document.getElementById('quest-hud-obj');
const questHudDist  = document.getElementById('quest-hud-dist');

// ── Time / Weather HUD ──────────────────────────────────────────────────
const timeDisplay    = document.getElementById('time-display');
const weatherDisplay = document.getElementById('weather-display');

function updateTimeHUD() {
  const h = Math.floor(gameTime) % 24;
  const m = Math.floor((gameTime % 1) * 60);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  timeDisplay.textContent = h12 + ':' + (m < 10 ? '0' : '') + m + ' ' + ampm;

  const weatherNames = { clear: '', rain: 'Rain', snow: 'Snow', ash: 'Ash Fall', blight: 'Corruption' };
  weatherDisplay.textContent = weatherNames[_currentWeather] || '';
}

function updateQuestHUD() {
  const obj = quests.getTrackedObjective();
  if (!obj) {
    questHudTitle.textContent = '';
    questHudObj.textContent   = '';
    questHudDist.textContent  = '';
    return;
  }

  questHudTitle.textContent = obj.questTitle;
  questHudObj.textContent   = obj.label;

  // Show distance if there's a target position
  if (obj.x !== null && obj.z !== null) {
    const dx = obj.x - player.position.x;
    const dz = obj.z - player.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    questHudDist.textContent = Math.round(dist) + 'm';
  } else {
    questHudDist.textContent = '';
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// POINTER LOCK + OVERLAY
// ═══════════════════════════════════════════════════════════════════════════

const overlay      = document.getElementById('overlay');
const pauseOverlay = document.getElementById('pause-overlay');
const hud          = document.getElementById('hud');
const startBtn     = document.getElementById('start-btn');

function requestLock() { canvas.requestPointerLock(); }

startBtn.addEventListener('click', requestLock);

// Clicking the pause screen re-locks (but not if clicking save/load buttons)
pauseOverlay.addEventListener('click', e => {
  if (e.target.closest('.pause-btn')) return;
  if (e.target.closest('#volume-controls')) return; // don't re-lock when adjusting volume
  requestLock();
});

// ── Volume control sliders ─────────────────────────────────────────────────
document.getElementById('vol-master').addEventListener('input', e => {
  sound.setMasterVolume(parseInt(e.target.value) / 100);
});
document.getElementById('vol-sfx').addEventListener('input', e => {
  sound.setSfxVolume(parseInt(e.target.value) / 100);
});
document.getElementById('vol-ambient').addEventListener('input', e => {
  sound.setAmbientVolume(parseInt(e.target.value) / 100);
});
document.getElementById('vol-music').addEventListener('input', e => {
  sound.setMusicVolume(parseInt(e.target.value) / 100);
});

document.addEventListener('pointerlockchange', () => {
  const locked = document.pointerLockElement === canvas;
  const menuOpen = _menuOpen || _levelupOpen ||
    lootPopup.style.display === 'block' ||
    dialogueOverlay.style.display === 'block' ||
    shopOverlay.style.display === 'flex';
  hud.style.display = (locked || menuOpen) ? 'block' : 'none';
  if (locked) {
    pauseOverlay.style.display = 'none';
  } else if (!menuOpen && overlay.style.display === 'none') {
    pauseOverlay.style.display = 'flex';
  }
});

document.addEventListener('keydown', e => {
  if (e.code === 'Escape') {
    if (_levelupOpen) {
      closeLevelUp(); return;
    }
    if (_menuOpen) {
      closeMenu(); return;
    }
    if (lootPopup.style.display !== 'none') {
      lootPopup.style.display = 'none'; _pendingLoot = [];
      canvas.requestPointerLock(); return;
    }
    if (dialogueOverlay.style.display === 'block') {
      closeDialogue(); return;
    }
    if (shopOverlay.style.display === 'flex') {
      closeShop(); return;
    }
  }
  // Interact key — E
  if (e.code === 'KeyE' && document.pointerLockElement) {
    if (_nearestLootDrop) {
      // Pick up loot drop — show popup
      showLootPopup(_nearestLootDrop.items);
      removeLootDrop(_nearestLootDrop);
      _nearestLootDrop = null;
    } else if (_nearestNPC) {
      openDialogue(_nearestNPC);
    }
  }
  // Unified menu: I/Tab → Inventory, J → Quests, K → Spellbook
  if (e.code === 'KeyI' || e.code === 'Tab') {
    e.preventDefault();
    if (_menuOpen && _menuTab === 'inventory') { closeMenu(); }
    else if (_menuOpen) { switchMenuTab('inventory'); }
    else { openMenu('inventory'); }
  }
  if (e.code === 'KeyC') {
    if (_menuOpen && _menuTab === 'character') { closeMenu(); }
    else if (_menuOpen) { switchMenuTab('character'); }
    else { openMenu('character'); }
  }
  if (e.code === 'KeyJ') {
    if (_menuOpen && _menuTab === 'quests') { closeMenu(); }
    else if (_menuOpen) { switchMenuTab('quests'); }
    else { openMenu('quests'); }
  }
  if (e.code === 'KeyK') {
    if (_menuOpen && _menuTab === 'magic') { closeMenu(); }
    else if (_menuOpen) { switchMenuTab('magic'); }
    else { openMenu('magic'); }
  }
  if (e.code === 'KeyF') {
    if (_menuOpen && _menuTab === 'crafting') { closeMenu(); }
    else if (_menuOpen) { switchMenuTab('crafting'); }
    else { openMenu('crafting'); }
  }
  // Cast right-hand spell — Q key
  if (e.code === 'KeyQ' && document.pointerLockElement && !_menuOpen) {
    magic.tryCast('right');
    sound.playSpellCast();
  }
  // Hotbar keys 1-4
  if (e.code >= 'Digit1' && e.code <= 'Digit4' && document.pointerLockElement && !_menuOpen) {
    const slot = parseInt(e.code.charAt(5)) - 1;
    inventory.useHotbar(slot);
    inventory._updateHotbarUI();
  }
});

// ── RMB casting (left-hand spell) ──────────────────────────────────────────
let _rmbHeld = false;

canvas.addEventListener('mousedown', e => {
  if (e.button === 2 && document.pointerLockElement) {
    e.preventDefault();
    _rmbHeld = true;
    // Try single cast for non-beam spells
    magic.tryCast('left');
    sound.playSpellCast();
  }
});

canvas.addEventListener('mouseup', e => {
  if (e.button === 2) {
    _rmbHeld = false;
    magic.stopContinuous();
  }
});

canvas.addEventListener('contextmenu', e => e.preventDefault());

// Hide start overlay once the player has clicked in
startBtn.addEventListener('click', () => {
  overlay.style.display = 'none';
  sound.init(); // initialize Web Audio on user gesture
});

// ═══════════════════════════════════════════════════════════════════════════
// SAVE / LOAD SYSTEM
// ═══════════════════════════════════════════════════════════════════════════

const saveBtn      = document.getElementById('save-btn');
const loadBtn      = document.getElementById('load-btn');
const saveStatus   = document.getElementById('save-status');
const continueBtn  = document.getElementById('continue-btn');
const continueInfo = document.getElementById('continue-info');

function doSave() {
  const ok = SaveManager.save(player, inventory, quests, magic);
  saveStatus.textContent = ok ? 'Game saved!' : 'Save failed!';
  saveStatus.style.color = ok ? 'rgba(100,255,100,0.6)' : 'rgba(255,100,100,0.6)';
  setTimeout(() => { saveStatus.textContent = ''; }, 2500);
}

function doLoad() {
  const data = SaveManager.load();
  if (!data) {
    saveStatus.textContent = 'No save found!';
    saveStatus.style.color = 'rgba(255,100,100,0.6)';
    setTimeout(() => { saveStatus.textContent = ''; }, 2500);
    return;
  }
  SaveManager.apply(data, player, inventory, quests, magic);
  ui.update();
  inventory._updateHotbarUI();
  saveStatus.textContent = 'Game loaded!';
  saveStatus.style.color = 'rgba(100,200,255,0.6)';
  setTimeout(() => { saveStatus.textContent = ''; }, 2500);
}

saveBtn.addEventListener('click', e => { e.stopPropagation(); doSave(); });
loadBtn.addEventListener('click', e => { e.stopPropagation(); doLoad(); });

// ── Continue button on start screen ─────────────────────────────────────
(function initStartScreen() {
  const info = SaveManager.getSaveInfo();
  if (info) {
    continueBtn.style.display = 'block';
    const d = new Date(info.timestamp);
    const timeStr = d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    continueInfo.textContent = `Level ${info.level} — ${info.gold} Gold — ${timeStr}`;
  }
}());

continueBtn.addEventListener('click', () => {
  sound.init(); // initialize Web Audio on user gesture
  const data = SaveManager.load();
  if (data) {
    SaveManager.apply(data, player, inventory, quests, magic);
    ui.update();
    inventory._updateHotbarUI();
  }
  overlay.style.display = 'none';
  canvas.requestPointerLock();
});

// ── Auto-save on key events ─────────────────────────────────────────────
// Save after: level up closed, quest turn-in, region change
let _lastAutoSaveLocation = '';

function checkAutoSave() {
  const loc = locationNameEl.textContent;
  if (loc !== _lastAutoSaveLocation && _lastAutoSaveLocation !== '') {
    // Region change — auto-save
    SaveManager.save(player, inventory, quests, magic);
  }
  _lastAutoSaveLocation = loc;
}

// Patch closeLevelUp to auto-save after leveling
const _origCloseLevelUp = closeLevelUp;
closeLevelUp = function() {
  _origCloseLevelUp();
  SaveManager.save(player, inventory, quests, magic);
};

// ═══════════════════════════════════════════════════════════════════════════
// RESIZE
// ═══════════════════════════════════════════════════════════════════════════

window.addEventListener('resize', () => {
  const w = window.innerWidth, h = window.innerHeight;
  camera.aspect   = w / h;
  vmCamera.aspect = w / h;
  camera.updateProjectionMatrix();
  vmCamera.updateProjectionMatrix();
  renderer.setSize(w, h);
});

// ═══════════════════════════════════════════════════════════════════════════
// AMMO HUD
// ═══════════════════════════════════════════════════════════════════════════

const ammoDisplayEl = document.getElementById('ammo-display');
const ammoCountEl   = document.getElementById('ammo-count');
const ammoLabelEl   = document.getElementById('ammo-label');
const drawIndicator = document.getElementById('draw-indicator');
const drawFill      = document.getElementById('draw-fill');

function updateAmmoHUD() {
  if (!player.isRanged) {
    ammoDisplayEl.style.display = 'none';
    drawIndicator.style.display = 'none';
    return;
  }

  // Show ammo count
  ammoDisplayEl.style.display = 'block';
  const ammoType = player.ammoType;
  let totalAmmo = 0;
  for (const slot of inventory.items) {
    const def = ITEMS[slot.id];
    if (def && def.type === 'ammo' && def.ammoType === ammoType) {
      totalAmmo += slot.count;
    }
  }
  ammoCountEl.textContent = totalAmmo;
  ammoLabelEl.textContent = ammoType === 'bolt' ? 'bolts' : 'arrows';

  // Draw strength indicator
  if (player.isDrawing) {
    drawIndicator.style.display = 'block';
    const pct = Math.min(1, player.drawTimer / player.drawTime) * 100;
    drawFill.style.height = pct + '%';
    // Color based on draw strength
    if (pct >= 90) drawFill.style.background = 'rgba(100,255,100,0.85)';
    else if (pct >= 50) drawFill.style.background = 'rgba(255,200,50,0.85)';
    else drawFill.style.background = 'rgba(255,100,50,0.85)';
  } else {
    drawIndicator.style.display = 'none';
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// GAME LOOP
// ═══════════════════════════════════════════════════════════════════════════
// BOSS HEALTH BAR
// ═══════════════════════════════════════════════════════════════════════════

const bossBarEl   = document.getElementById('boss-bar');
const bossBarName = document.getElementById('boss-bar-name');
const bossBarFill = document.getElementById('boss-bar-fill');
let _activeBoss = null;

function updateBossBar() {
  // Find closest alive boss in aggro range
  let closestBoss = null;
  let closestDist = Infinity;
  const pp = player.position;

  for (const enemy of enemies) {
    if (!enemy.isBoss || enemy.dead) continue;
    const dx = enemy.mesh.position.x - pp.x;
    const dz = enemy.mesh.position.z - pp.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < enemy.aggroRange * 1.5 && dist < closestDist) {
      closestBoss = enemy;
      closestDist = dist;
    }
  }

  if (closestBoss) {
    _activeBoss = closestBoss;
    bossBarEl.style.display = 'block';
    bossBarName.textContent = closestBoss.name;
    bossBarFill.style.width = (closestBoss.hp / closestBoss.maxHp * 100) + '%';
  } else {
    if (_activeBoss && _activeBoss.dead) {
      // Brief delay showing empty bar after boss dies
      bossBarFill.style.width = '0%';
      setTimeout(() => {
        bossBarEl.style.display = 'none';
        _activeBoss = null;
      }, 1500);
    } else {
      bossBarEl.style.display = 'none';
      _activeBoss = null;
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════

let prevTime = performance.now();
let elapsed  = 0;
let _wasAttacking = false;
let _wasDrawing   = false;

function animate() {
  requestAnimationFrame(animate);

  const now = performance.now();
  const dt  = Math.min((now - prevTime) / 1000, 0.05); // cap at 50 ms
  prevTime  = now;
  elapsed  += dt;

  const locked = document.pointerLockElement === canvas;

  if (locked) {
    player.update(dt);
    ui.update();

    // ── Sound: attack start detection ──────────────────────────────────────
    if (player.isAttacking && !_wasAttacking && !player.isRanged) {
      sound.playSwordSwing();
    }
    _wasAttacking = player.isAttacking;

    // ── Sound: bow draw/release ────────────────────────────────────────────
    if (player.isDrawing && !_wasDrawing) {
      sound.playBowDraw();
    }
    if (_wasDrawing && !player.isDrawing && player._wantsShoot) {
      sound.playBowRelease();
    }
    _wasDrawing = player.isDrawing;

    // ── Sound: footsteps ───────────────────────────────────────────────────
    sound.updateFootsteps(dt, player.isMoving, player.isSprinting);

    // ── Sound: ambient + music (biome-based) ───────────────────────────────
    const currentBiome = typeof getBiome === 'function'
      ? getBiome(player.position.x, player.position.z) : 'greenvale';
    sound.updateAmbient(currentBiome);
    sound.updateMusic(currentBiome);

    // ── Enemy updates + hit detection ──────────────────────────────────────
    const pp = player.position;
    for (const enemy of enemies) {
      enemy.update(dt, pp, camera);

      // Mid-swing hit window: 40–70% through attack timer
      if (player.isAttacking && !enemy.dead) {
        const progress = 1 - (player.attackTimer / player.attackCooldown);
        if (progress > 0.40 && progress < 0.70 && !player._hitDealt) {
          const dx = enemy.mesh.position.x - pp.x;
          const dz = enemy.mesh.position.z - pp.z;
          const dist = Math.sqrt(dx * dx + dz * dz);
          if (dist < player.attackRange) {
            const faceFwd = new THREE.Vector3(-Math.sin(player.yaw), 0, -Math.cos(player.yaw));
            const toEnemy = new THREE.Vector3(dx, 0, dz).normalize();
            if (faceFwd.dot(toEnemy) > 0.45) {
              enemy.takeDamage(player.attackDamage);
              player._hitDealt = true;
              triggerHitMarker();
              sound.playHit();
              if (enemy.dead) {
                enemy._magicLootDone = true;
                addKillMessage(enemy.name);
                sound.playEnemyDeath();
                quests.onKill(enemy.type);
                awardXP(enemy.xp);
                const loot = rollLoot(enemy.lootTable);
                loot.push('gold');
                spawnLootDrop(enemy.mesh.position.x, enemy.mesh.position.z, loot);
              }
            }
          }
        }
      }
    }

    // ── Magic updates ───────────────────────────────────────────────────────
    if (_rmbHeld) {
      magic.tryCastContinuous('left', dt);
    }

    magic.update(dt, enemies);

    // Check for magic kills
    for (const enemy of enemies) {
      if (enemy.dead && !enemy._magicLootDone) {
        enemy._magicLootDone = true;
        addKillMessage(enemy.name);
        quests.onKill(enemy.type);
        awardXP(enemy.xp);
        sound.playEnemyDeath();
        const loot = rollLoot(enemy.lootTable);
        loot.push('gold');
        spawnLootDrop(enemy.mesh.position.x, enemy.mesh.position.z, loot);
      }
    }

    // ── Loot drop animation ───────────────────────────────────────────────
    for (const drop of lootDrops) {
      drop.age += dt;
      drop.mesh.position.y = drop.baseY + Math.sin(drop.age * 2.0) * 0.08;
      drop.mesh.children[0].rotation.y += dt * 1.2;
    }

    // ── NPC updates ─────────────────────────────────────────────────────────
    for (const npc of npcs) npc.update(dt);
    updateInteraction();
    updateLocationName();
    checkAutoSave();

    // ── Quest updates ────────────────────────────────────────────────────
    quests.onReach(pp.x, pp.z);
    updateQuestHUD();

    // ── Ranged combat ────────────────────────────────────────────────────
    if (player._wantsShoot) {
      fireArrow(player._lastDrawPct);
      player._wantsShoot = false;
    }
    updateArrowProjectiles(dt);
    updateViewmodel();
    updateAmmoHUD();
    updateBossBar();

    // ── Day/Night + Weather ──────────────────────────────────────────────
    updateDayNight(dt);
    updateWeather(dt);
    updateTimeHUD();

    // ── FX timers ──────────────────────────────────────────────────────────
    if (_dmgFlashTimer > 0) {
      _dmgFlashTimer -= dt;
      if (_dmgFlashTimer <= 0) damageFlash.classList.remove('flash');
    }
    if (_hitMarkerTimer > 0) {
      _hitMarkerTimer -= dt;
      if (_hitMarkerTimer <= 0) hitMarker.classList.remove('show');
    }
  }

  // ── Viewmodel animation ───────────────────────────────────────────────────
  const swayX = Math.sin(elapsed * 1.05) * 0.006;
  const swayY = Math.sin(elapsed * 0.68) * 0.004;

  const bob = player.isMoving
    ? Math.sin(player.bobTime) * (player.isSprinting ? 0.018 : 0.011)
    : 0;

  if (_activeViewmodel === 'sword') {
    // ── MELEE VIEWMODEL ─────────────────────────────────────────────────────
    if (!player.isAttacking) {
      rightHand.position.x = RH_BASE.x + swayX;
      rightHand.position.y = RH_BASE.y + swayY - bob;
    }

    const atkProgress = player.isAttacking
      ? 1 - (player.attackTimer / player.attackCooldown)
      : 0;

    if (player.isAttacking) {
      const t = atkProgress;
      if (t < 0.25) {
        const u = t / 0.25;
        rightHand.position.x = RH_BASE.x + swayX + u *  0.18;
        rightHand.position.y = RH_BASE.y + swayY + u *  0.10;
        rightHand.rotation.x = 0.10 - u * 0.20;
        rightHand.rotation.z = 0.06;
        swordGroup.rotation.z = -0.60 - u * 0.80;
      } else {
        const u = (t - 0.25) / 0.75;
        const ease = 1 - Math.pow(1 - u, 2);
        rightHand.position.x = RH_BASE.x + swayX + 0.18 - ease * 0.55;
        rightHand.position.y = RH_BASE.y + swayY + 0.10 - ease * 0.16;
        rightHand.rotation.x = -0.10 + ease * 0.22;
        rightHand.rotation.z = 0.06;
        swordGroup.rotation.z = -1.40 + ease * 2.20;
      }
      rightHand.rotation.y = -0.20;
    } else {
      rightHand.position.x += (RH_BASE.x + swayX - rightHand.position.x) * 0.20;
      rightHand.position.y += (RH_BASE.y + swayY - rightHand.position.y) * 0.20;
      rightHand.rotation.x += (0.10 - rightHand.rotation.x) * 0.18;
      rightHand.rotation.y += (-0.20 - rightHand.rotation.y) * 0.18;
      rightHand.rotation.z += (0.06 - rightHand.rotation.z) * 0.18;
      swordGroup.rotation.z += (-0.60 - swordGroup.rotation.z) * 0.18;
    }

  } else if (_activeViewmodel === 'bow') {
    // ── BOW VIEWMODEL ───────────────────────────────────────────────────────
    const drawPct = player.isDrawing ? (player.drawTimer / player.drawTime) : 0;

    // Show nocked arrow while drawing
    const nockedArrow = bowGroup.getObjectByName('nocked_arrow');
    const nockedTip   = bowGroup.getObjectByName('nocked_arrow_tip');
    if (nockedArrow) nockedArrow.visible = player.isDrawing;
    if (nockedTip)   nockedTip.visible = player.isDrawing;

    // Animate bowstring pull-back (midpoint of string moves back with draw)
    if (bowString) {
      const stringPos = bowString.geometry.attributes.position;
      const pullBack = drawPct * 0.10; // max 0.10 units back
      stringPos.setZ(1, -pullBack); // midpoint Z
      stringPos.needsUpdate = true;

      // Move nocked arrow with string
      if (nockedArrow) {
        nockedArrow.position.z = -0.02 - pullBack;
        if (nockedTip) nockedTip.position.z = -0.195 - pullBack;
      }
    }

    if (player.isDrawing) {
      // Drawing: pull hand back slightly, tilt bow
      rightHand.position.x = BOW_BASE.x + swayX;
      rightHand.position.y = BOW_BASE.y + swayY - bob - drawPct * 0.02;
      rightHand.position.z = RH_BASE.z;
      rightHand.rotation.x = 0.05 - drawPct * 0.08;
      rightHand.rotation.y = -0.15;
      rightHand.rotation.z = -0.10 + drawPct * 0.02;
    } else {
      // Idle: rest position with gentle lerp
      rightHand.position.x += (BOW_BASE.x + swayX - rightHand.position.x) * 0.15;
      rightHand.position.y += (BOW_BASE.y + swayY - bob - rightHand.position.y) * 0.15;
      rightHand.position.z += (RH_BASE.z - rightHand.position.z) * 0.15;
      rightHand.rotation.x += (0.05 - rightHand.rotation.x) * 0.15;
      rightHand.rotation.y += (-0.15 - rightHand.rotation.y) * 0.15;
      rightHand.rotation.z += (-0.10 - rightHand.rotation.z) * 0.15;
    }

  } else if (_activeViewmodel === 'crossbow') {
    // ── CROSSBOW VIEWMODEL ──────────────────────────────────────────────────
    const drawPct = player.isDrawing ? (player.drawTimer / player.drawTime) : 0;

    // Show loaded bolt while drawing
    const loadedBolt = crossbowGroup.getObjectByName('loaded_bolt');
    const loadedTip  = crossbowGroup.getObjectByName('loaded_bolt_tip');
    if (loadedBolt) loadedBolt.visible = player.isDrawing;
    if (loadedTip)  loadedTip.visible = player.isDrawing;

    if (player.isDrawing) {
      // Cranking: slight shake + pull down
      const shake = drawPct * Math.sin(elapsed * 25) * 0.003;
      rightHand.position.x = BOW_BASE.x + swayX + shake;
      rightHand.position.y = BOW_BASE.y + swayY - bob - drawPct * 0.03;
      rightHand.position.z = RH_BASE.z;
      rightHand.rotation.x = 0.0 + drawPct * 0.06;
      rightHand.rotation.y = -0.10;
      rightHand.rotation.z = 0;
    } else {
      // Idle
      rightHand.position.x += (BOW_BASE.x + swayX - rightHand.position.x) * 0.15;
      rightHand.position.y += (BOW_BASE.y + swayY - bob - rightHand.position.y) * 0.15;
      rightHand.position.z += (RH_BASE.z - rightHand.position.z) * 0.15;
      rightHand.rotation.x += (0.0 - rightHand.rotation.x) * 0.15;
      rightHand.rotation.y += (-0.10 - rightHand.rotation.y) * 0.15;
      rightHand.rotation.z += (0 - rightHand.rotation.z) * 0.15;
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  renderer.render(scene, camera);

  // Render viewmodel on top (clear depth so hands never clip into walls)
  renderer.autoClear = false;
  renderer.clearDepth();
  renderer.render(vmScene, vmCamera);
  renderer.autoClear = true;
}

animate();
