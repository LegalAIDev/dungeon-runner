/* ============================================================================
   config.js — core constants and the four world backdrops.
   Loaded first, so every other file can use CONFIG and BIOMES.
   ========================================================================== */

/* Logical game size is fixed at 960x540 and Phaser scales it to fit any
   screen, so every number below is in "game pixels". */
const CONFIG = {
  WIDTH: 960,
  HEIGHT: 540,
  GROUND_Y: 486,            // y of the floor that fighters stand on (feet)

  TILE: 64,                 // on-screen size of one level tile (32px art drawn 2x)
  BG_FILL: 540 / 480,       // stretch the 960x480 backdrop art to the 960x540 canvas

  GRAVITY: 2200,            // downward pull for jumps (px / s / s)
  JUMP_VELOCITY: 780,       // upward push of a jump

  PLAYER_SPEED: 270,        // player walk speed (px/s)
  ARENA_LEFT: 64,           // left wall fighters cannot pass
  ARENA_RIGHT: 896,         // right edge of the starting view

  WAVE_SPACING: 760,        // world distance between successive wave anchors
  WAVE_FIRST_X: 820,        // world x of the first wave's lead enemy
  AGGRO_RANGE: 520,         // how close the player gets before an enemy wakes
  CAMERA_OFFSET: 160,       // keeps the player in the left third of the view

  HIT_STOP_MS: 70,          // freeze frame on a landed strike

  FONT: '"Trebuchet MS", "Segoe UI", Verdana, system-ui, sans-serif',
};

/* The four worlds. Each reuses the scenic-background drawer in ui.js, so the
   colour fields match what BootScene paints into the biome textures. */
const BIOMES = [
  {
    key: 'forest', name: 'Goblin Forest', night: false,
    skyTop: 0x73c2ff, skyBottom: 0xd9f1ff, sun: 0xfff2b0,
    hillFar: 0x9bdd84, hillNear: 0x5fae47,
    ground: 0x6cc24a, groundDark: 0x4d9633, groundEdge: 0x8ad95f,
    caveTint: 0x9fd9a0,       // mossy-green cave
  },
  {
    key: 'desert', name: 'Orc Desert', night: false,
    skyTop: 0xffa94e, skyBottom: 0xffe8c2, sun: 0xfff0c4,
    hillFar: 0xeccb8c, hillNear: 0xd99f52,
    ground: 0xe6af58, groundDark: 0xc4882f, groundEdge: 0xf3c879,
    caveTint: 0xe8c88a,       // warm sandstone cave
  },
  {
    key: 'ice', name: 'Troll Ice Cave', night: true,
    skyTop: 0x21407a, skyBottom: 0x4f7fb8, sun: 0xd7ecff,
    hillFar: 0x6f9fd0, hillNear: 0x4f7bb0,
    ground: 0x9ec8e8, groundDark: 0x6c98c2, groundEdge: 0xd6ecff,
    caveTint: 0xbcd6f5,       // pale-blue ice cave
  },
  {
    key: 'castle', name: 'Dragon Castle', night: true,
    skyTop: 0x3a1450, skyBottom: 0x8a2c4a, sun: 0xffb45c,
    hillFar: 0x4a2058, hillNear: 0x331842,
    ground: 0x3c2440, groundDark: 0x271630, groundEdge: 0x6a3c66,
    caveTint: 0xc89fd6,       // violet dragon cave
  },
];
