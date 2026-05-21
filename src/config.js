/* ============================================================================
   config.js — all the game's numbers, world data, upgrades, and saved progress.
   Loaded first, so every other file can use CONFIG, BIOMES, UPGRADES and Save.
   ========================================================================== */

/* Core constants. Logical game size is fixed at 960x540 and Phaser scales it
   to fit any screen, so everything below is in "game pixels". */
const CONFIG = {
  WIDTH: 960,
  HEIGHT: 540,
  GROUND_Y: 474,            // y of the ground surface the runner stands on
  PLAYER_X: 215,            // the runner stays at this x; the world scrolls past

  GRAVITY: 2350,            // downward pull (pixels / second / second)
  JUMP_VELOCITY: 850,       // upward push of a jump
  DOUBLE_JUMP_VELOCITY: 770,// upward push of the mid-air second jump

  SPEED_START: 355,         // world scroll speed at the start of a run (px/s)
  SPEED_MAX: 780,           // fastest the world will ever scroll
  SPEED_ACCEL: 7.0,         // how much speed is added each second

  METERS_PER_PX: 1 / 16,    // turns scrolled pixels into the "distance" score

  COIN_VALUE: 1,
  GEM_VALUE: 8,

  BASE_LIVES: 3,
  INVULN_MS: 1400,          // safe time after taking a hit

  FONT: '"Trebuchet MS", "Segoe UI", Verdana, system-ui, sans-serif',
};

/* The four worlds the runner travels through. The game switches biome when the
   distance score passes "startMeters". Colours are 0xRRGGBB numbers. */
const BIOMES = [
  {
    key: 'meadow', name: 'Sunny Meadow', startMeters: 0, night: false,
    skyTop: 0x73c2ff, skyBottom: 0xd9f1ff, sun: 0xfff2b0,
    hillFar: 0x9bdd84, hillNear: 0x5fae47,
    ground: 0x6cc24a, groundDark: 0x4d9633, groundEdge: 0x8ad95f,
  },
  {
    key: 'desert', name: 'Golden Desert', startMeters: 700, night: false,
    skyTop: 0xffbe63, skyBottom: 0xffe8c2, sun: 0xfff0c4,
    hillFar: 0xeccb8c, hillNear: 0xd99f52,
    ground: 0xe6af58, groundDark: 0xc4882f, groundEdge: 0xf3c879,
  },
  {
    key: 'cave', name: 'Crystal Cave', startMeters: 1500, night: true,
    skyTop: 0x241a4d, skyBottom: 0x49386f, sun: 0xc9b9ff,
    hillFar: 0x3a2e63, hillNear: 0x2a2150,
    ground: 0x39305c, groundDark: 0x241d40, groundEdge: 0x5a4d8f,
  },
  {
    key: 'sky', name: 'Sunset Skylands', startMeters: 2600, night: false,
    skyTop: 0xff8f7a, skyBottom: 0xffdcab, sun: 0xfff3cd,
    hillFar: 0xffc8b5, hillNear: 0xff9f86,
    ground: 0xf2f0ff, groundDark: 0xcdc6ee, groundEdge: 0xffffff,
  },
];

/* Things you can buy in the shop. Every purchase also requires solving a math
   problem. "tier" decides how hard that problem is (1 easy → 3 challenging). */
const UPGRADES = [
  { id: 'shoes',  name: 'Speed Shoes',     tier: 1, cost: 18, max: 5,
    desc: 'Run a little faster — more distance, more score.' },
  { id: 'lucky',  name: 'Lucky Coin',      tier: 1, cost: 22, max: 5,
    desc: '+1 bonus coin from every coin you collect.' },
  { id: 'spring', name: 'Spring Boots',    tier: 2, cost: 38, max: 4,
    desc: 'Jump noticeably higher.' },
  { id: 'magnet', name: 'Coin Magnet',     tier: 2, cost: 52, max: 3,
    desc: 'Nearby coins drift toward you.' },
  { id: 'shield', name: 'Lucky Shield',    tier: 2, cost: 60, max: 1,
    desc: 'Begin every run inside a shield bubble.' },
  { id: 'wings',  name: 'Glider Wings',    tier: 3, cost: 95, max: 1,
    desc: 'Unlock a mid-air double jump.' },
  { id: 'heart',  name: 'Heart Container', tier: 3, cost: 80, max: 3,
    desc: '+1 life at the start of each run.' },
];

/* Each copy of an upgrade costs a bit more than the last. */
function upgradeCost(up, owned) {
  return Math.round(up.cost * (1 + owned * 0.75));
}

/* ----------------------------------------------------------------------------
   Save — keeps coins, owned upgrades, the high score and sound settings in the
   browser's localStorage so progress survives between visits.
   -------------------------------------------------------------------------- */
const SAVE_KEY = 'mathRunnerSaveV2';

const Save = {
  data: {
    coins: 0,
    upgrades: {},       // { upgradeId: howManyOwned }
    highScore: 0,
    biomesSeen: 1,      // how many worlds have been reached (for the menu)
    soundOn: true,
    musicOn: true,
  },

  load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return;
      const p = JSON.parse(raw);
      if (Number.isFinite(p.coins))     this.data.coins = Math.max(0, Math.floor(p.coins));
      if (Number.isFinite(p.highScore)) this.data.highScore = Math.max(0, Math.floor(p.highScore));
      if (Number.isFinite(p.biomesSeen))this.data.biomesSeen = Math.min(4, Math.max(1, p.biomesSeen));
      if (typeof p.soundOn === 'boolean') this.data.soundOn = p.soundOn;
      if (typeof p.musicOn === 'boolean') this.data.musicOn = p.musicOn;
      if (p.upgrades && typeof p.upgrades === 'object') {
        UPGRADES.forEach((u) => {
          const n = Number(p.upgrades[u.id]);
          if (Number.isFinite(n) && n > 0) this.data.upgrades[u.id] = Math.min(u.max, Math.floor(n));
        });
      }
    } catch (e) {
      /* A corrupted save just means we start fresh — no need to crash. */
    }
  },

  persist() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.data));
    } catch (e) { /* storage might be full or blocked; ignore */ }
  },

  owned(id)     { return this.data.upgrades[id] || 0; },
  addCoins(n)   { this.data.coins += n; this.persist(); },
  spendCoins(n) { this.data.coins = Math.max(0, this.data.coins - n); this.persist(); },

  buyUpgrade(id) {
    this.data.upgrades[id] = this.owned(id) + 1;
    this.persist();
  },

  recordRun(score, biomeIndex) {
    if (score > this.data.highScore) this.data.highScore = score;
    this.data.biomesSeen = Math.max(this.data.biomesSeen, biomeIndex + 1);
    this.persist();
  },
};

/* Turns the owned upgrades into the actual stats a run will use. Called fresh at
   the start of every run, so paid upgrades always take effect (this also fixes
   the old bug where Speed Shoes stopped working after a game over). */
function computeRunStats() {
  const heartCount = Save.owned('heart');
  return {
    speedMult:   1 + Save.owned('shoes')  * 0.045,
    coinBonus:   Save.owned('lucky'),
    jumpMult:    1 + Save.owned('spring') * 0.055,
    magnetRange: Save.owned('magnet') ? 60 + Save.owned('magnet') * 45 : 0,
    startShield: Save.owned('shield') > 0,
    doubleJump:  Save.owned('wings')  > 0,
    maxLives:    CONFIG.BASE_LIVES + heartCount,
  };
}

Save.load();
