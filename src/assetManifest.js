/* ============================================================================
   assetManifest.js — maps game entities to real sprite files.
   Every entry is optional: missing or failed-to-load files fall back to the
   procedural art generated in BootScene with no crash or code change needed.

   frameWidth / frameHeight: size of a single cell in the horizontal strip.
   displayScale: multiplier applied to the sprite so it fits the game canvas.
   anchorY: fractional Y where the character's feet sit (0 = top, 1 = bottom).
             Adjust if the sprite floats above or sinks into the ground.
   ========================================================================== */

const ASSET_MANIFEST = {

  characters: {

    fighter: {
      frameWidth: 200, frameHeight: 200,
      displayScale: 2.27, anchorY: 0.605,
      anims: {
        idle:   { file: 'src/sprites/Martial Hero/Sprites/Idle.png',    frames: 8, fps: 8,  loop: true  },
        walk:   { file: 'src/sprites/Martial Hero/Sprites/Run.png',     frames: 8, fps: 12, loop: true  },
        jump:   { file: 'src/sprites/Martial Hero/Sprites/Jump.png',    frames: 2, fps: 8,  loop: false },
        attack: { file: 'src/sprites/Martial Hero/Sprites/Attack1.png', frames: 6, fps: 14, loop: false },
        hurt:   { file: 'src/sprites/Martial Hero/Sprites/Take Hit.png',frames: 4, fps: 10, loop: false },
        dodge:  { file: 'src/sprites/Martial Hero/Sprites/Run.png',     frames: 8, fps: 20, loop: false },
        death:  { file: 'src/sprites/Martial Hero/Sprites/Death.png',   frames: 6, fps: 9,  loop: false },
      },
    },

    ninja: {
      frameWidth: 200, frameHeight: 200,
      displayScale: 2.11, anchorY: 0.635,
      anims: {
        idle:   { file: 'src/sprites/Martial Hero 2/Sprites/Idle.png',     frames: 4, fps: 6,  loop: true  },
        walk:   { file: 'src/sprites/Martial Hero 2/Sprites/Run.png',      frames: 8, fps: 12, loop: true  },
        jump:   { file: 'src/sprites/Martial Hero 2/Sprites/Jump.png',     frames: 2, fps: 8,  loop: false },
        attack: { file: 'src/sprites/Martial Hero 2/Sprites/Attack1.png',  frames: 4, fps: 14, loop: false },
        hurt:   { file: 'src/sprites/Martial Hero 2/Sprites/Take hit.png', frames: 3, fps: 10, loop: false },
        dodge:  { file: 'src/sprites/Martial Hero 2/Sprites/Run.png',      frames: 8, fps: 22, loop: false },
        death:  { file: 'src/sprites/Martial Hero 2/Sprites/Death.png',    frames: 7, fps: 9,  loop: false },
      },
    },

    wizard: {
      frameWidth: 150, frameHeight: 150,
      displayScale: 2.03, anchorY: 0.673,
      anims: {
        idle:   { file: 'src/sprites/Evil Wizard/Sprites/Idle.png',    frames: 8, fps: 8,  loop: true  },
        walk:   { file: 'src/sprites/Evil Wizard/Sprites/Move.png',    frames: 8, fps: 12, loop: true  },
        jump:   { file: 'src/sprites/Evil Wizard/Sprites/Move.png',    frames: 8, fps: 12, loop: false },
        attack: { file: 'src/sprites/Evil Wizard/Sprites/Attack.png',  frames: 8, fps: 14, loop: false },
        hurt:   { file: 'src/sprites/Evil Wizard/Sprites/Take Hit.png',frames: 4, fps: 10, loop: false },
        dodge:  { file: 'src/sprites/Evil Wizard/Sprites/Move.png',    frames: 8, fps: 22, loop: false },
        death:  { file: 'src/sprites/Evil Wizard/Sprites/Death.png',   frames: 5, fps: 9,  loop: false },
      },
    },

    knight: {
      frameWidth: 140, frameHeight: 140,
      displayScale: 3.03, anchorY: 0.586,
      anims: {
        idle:   { file: 'src/sprites/Hero Knight 2/Sprites/Idle.png',    frames: 11, fps: 8,  loop: true  },
        walk:   { file: 'src/sprites/Hero Knight 2/Sprites/Run.png',     frames: 8,  fps: 12, loop: true  },
        jump:   { file: 'src/sprites/Hero Knight 2/Sprites/Jump.png',    frames: 4,  fps: 10, loop: false },
        attack: { file: 'src/sprites/Hero Knight 2/Sprites/Attack.png',  frames: 6,  fps: 14, loop: false },
        hurt:   { file: 'src/sprites/Hero Knight 2/Sprites/Take Hit.png',frames: 4,  fps: 10, loop: false },
        dodge:  { file: 'src/sprites/Hero Knight 2/Sprites/Dash.png',    frames: 4,  fps: 18, loop: false },
        death:  { file: 'src/sprites/Hero Knight 2/Sprites/Death.png',   frames: 9,  fps: 9,  loop: false },
      },
    },

    archer: {
      frameWidth: 150, frameHeight: 150,
      displayScale: 2.81, anchorY: 0.64,
      anims: {
        idle:   { file: 'src/sprites/Huntress/Sprites/Idle.png',    frames: 8, fps: 8,  loop: true  },
        walk:   { file: 'src/sprites/Huntress/Sprites/Run.png',     frames: 8, fps: 12, loop: true  },
        jump:   { file: 'src/sprites/Huntress/Sprites/Jump.png',    frames: 2, fps: 8,  loop: false },
        attack: { file: 'src/sprites/Huntress/Sprites/Attack1.png', frames: 5, fps: 14, loop: false },
        hurt:   { file: 'src/sprites/Huntress/Sprites/Take hit.png',frames: 3, fps: 10, loop: false },
        dodge:  { file: 'src/sprites/Huntress/Sprites/Run.png',     frames: 8, fps: 22, loop: false },
        death:  { file: 'src/sprites/Huntress/Sprites/Death.png',   frames: 8, fps: 9,  loop: false },
      },
    },

    warrior: {
      frameWidth: 135, frameHeight: 135,
      displayScale: 3.11, anchorY: 0.63,
      anims: {
        idle:   { file: 'src/sprites/Medieval Warrior Pack 3/Sprites/Idle.png',    frames: 10, fps: 8,  loop: true  },
        walk:   { file: 'src/sprites/Medieval Warrior Pack 3/Sprites/Run.png',     frames: 6,  fps: 12, loop: true  },
        jump:   { file: 'src/sprites/Medieval Warrior Pack 3/Sprites/Jump.png',    frames: 2,  fps: 8,  loop: false },
        attack: { file: 'src/sprites/Medieval Warrior Pack 3/Sprites/Attack1.png', frames: 4,  fps: 14, loop: false },
        hurt:   { file: 'src/sprites/Medieval Warrior Pack 3/Sprites/Get Hit.png', frames: 3,  fps: 10, loop: false },
        dodge:  { file: 'src/sprites/Medieval Warrior Pack 3/Sprites/Run.png',     frames: 6,  fps: 22, loop: false },
        death:  { file: 'src/sprites/Medieval Warrior Pack 3/Sprites/Death.png',   frames: 9,  fps: 9,  loop: false },
      },
    },

    king: {
      frameWidth: 160, frameHeight: 111,
      displayScale: 2.19, anchorY: 0.937,
      anims: {
        idle:   { file: 'src/sprites/Medieval King Pack 2/Sprites/Idle.png',    frames: 8, fps: 8,  loop: true  },
        walk:   { file: 'src/sprites/Medieval King Pack 2/Sprites/Run.png',     frames: 8, fps: 12, loop: true  },
        jump:   { file: 'src/sprites/Medieval King Pack 2/Sprites/Jump.png',    frames: 2, fps: 8,  loop: false },
        attack: { file: 'src/sprites/Medieval King Pack 2/Sprites/Attack1.png', frames: 4, fps: 14, loop: false },
        hurt:   { file: 'src/sprites/Medieval King Pack 2/Sprites/Take Hit.png',frames: 4, fps: 10, loop: false },
        dodge:  { file: 'src/sprites/Medieval King Pack 2/Sprites/Run.png',     frames: 8, fps: 22, loop: false },
        death:  { file: 'src/sprites/Medieval King Pack 2/Sprites/Death.png',   frames: 6, fps: 9,  loop: false },
      },
    },

    arcmage: {
      frameWidth: 231, frameHeight: 190,
      displayScale: 1.37, anchorY: 0.737,
      anims: {
        idle:   { file: 'src/sprites/Wizard Pack/Idle.png',    frames: 6, fps: 8,  loop: true  },
        walk:   { file: 'src/sprites/Wizard Pack/Run.png',     frames: 8, fps: 12, loop: true  },
        jump:   { file: 'src/sprites/Wizard Pack/Jump.png',    frames: 2, fps: 8,  loop: false },
        attack: { file: 'src/sprites/Wizard Pack/Attack1.png', frames: 8, fps: 14, loop: false },
        hurt:   { file: 'src/sprites/Wizard Pack/Hit.png',     frames: 4, fps: 10, loop: false },
        dodge:  { file: 'src/sprites/Wizard Pack/Run.png',     frames: 8, fps: 22, loop: false },
        death:  { file: 'src/sprites/Wizard Pack/Death.png',   frames: 7, fps: 9,  loop: false },
      },
    },

    ranger: {
      frameWidth: 100, frameHeight: 100,
      displayScale: 3.28, anchorY: 0.66,
      anims: {
        idle:   { file: 'src/sprites/Huntress 2/Sprites/Character/Idle.png',    frames: 10, fps: 8,  loop: true  },
        walk:   { file: 'src/sprites/Huntress 2/Sprites/Character/Run.png',     frames: 8,  fps: 12, loop: true  },
        jump:   { file: 'src/sprites/Huntress 2/Sprites/Character/Jump.png',    frames: 2,  fps: 8,  loop: false },
        attack: { file: 'src/sprites/Huntress 2/Sprites/Character/Attack.png',  frames: 6,  fps: 14, loop: false },
        hurt:   { file: 'src/sprites/Huntress 2/Sprites/Character/Get Hit.png', frames: 3,  fps: 10, loop: false },
        dodge:  { file: 'src/sprites/Huntress 2/Sprites/Character/Run.png',     frames: 8,  fps: 22, loop: false },
        death:  { file: 'src/sprites/Huntress 2/Sprites/Character/Death.png',   frames: 10, fps: 9,  loop: false },
      },
    },

    berserker: {
      frameWidth: 162, frameHeight: 162,
      displayScale: 2.62, anchorY: 0.617,
      anims: {
        idle:   { file: 'src/sprites/Fantasy Warrior/Sprites/Idle.png',    frames: 10, fps: 8,  loop: true  },
        walk:   { file: 'src/sprites/Fantasy Warrior/Sprites/Run.png',     frames: 8,  fps: 12, loop: true  },
        jump:   { file: 'src/sprites/Fantasy Warrior/Sprites/Jump.png',    frames: 3,  fps: 8,  loop: false },
        attack: { file: 'src/sprites/Fantasy Warrior/Sprites/Attack1.png', frames: 7,  fps: 14, loop: false },
        hurt:   { file: 'src/sprites/Fantasy Warrior/Sprites/Take hit.png',frames: 3,  fps: 10, loop: false },
        dodge:  { file: 'src/sprites/Fantasy Warrior/Sprites/Run.png',     frames: 8,  fps: 22, loop: false },
        death:  { file: 'src/sprites/Fantasy Warrior/Sprites/Death.png',   frames: 7,  fps: 9,  loop: false },
      },
    },

    striker: {
      frameWidth: 120, frameHeight: 80,
      displayScale: 3.11, anchorY: 0.988,
      anims: {
        idle:   { file: 'src/sprites/Colour1/Outline/120x80_PNGSheets/_Idle.png',   frames: 10, fps: 8,  loop: true  },
        walk:   { file: 'src/sprites/Colour1/Outline/120x80_PNGSheets/_Run.png',    frames: 10, fps: 12, loop: true  },
        jump:   { file: 'src/sprites/Colour1/Outline/120x80_PNGSheets/_Jump.png',   frames: 1,  fps: 8,  loop: false },
        attack: { file: 'src/sprites/Colour1/Outline/120x80_PNGSheets/_Attack.png', frames: 4,  fps: 14, loop: false },
        hurt:   { file: 'src/sprites/Colour1/Outline/120x80_PNGSheets/_Hit.png',    frames: 1,  fps: 10, loop: false },
        dodge:  { file: 'src/sprites/Colour1/Outline/120x80_PNGSheets/_Dash.png',   frames: 1,  fps: 18, loop: false },
        death:  { file: 'src/sprites/Colour1/Outline/120x80_PNGSheets/_Death.png',  frames: 10, fps: 9,  loop: false },
      },
    },

    duelist: {
      frameWidth: 120, frameHeight: 80,
      displayScale: 3.11, anchorY: 0.988,
      anims: {
        idle:   { file: 'src/sprites/Colour2/Outline/120x80_PNGSheets/_Idle.png',   frames: 10, fps: 8,  loop: true  },
        walk:   { file: 'src/sprites/Colour2/Outline/120x80_PNGSheets/_Run.png',    frames: 10, fps: 12, loop: true  },
        jump:   { file: 'src/sprites/Colour2/Outline/120x80_PNGSheets/_Jump.png',   frames: 1,  fps: 8,  loop: false },
        attack: { file: 'src/sprites/Colour2/Outline/120x80_PNGSheets/_Attack.png', frames: 4,  fps: 14, loop: false },
        hurt:   { file: 'src/sprites/Colour2/Outline/120x80_PNGSheets/_Hit.png',    frames: 1,  fps: 10, loop: false },
        dodge:  { file: 'src/sprites/Colour2/Outline/120x80_PNGSheets/_Dash.png',   frames: 1,  fps: 18, loop: false },
        death:  { file: 'src/sprites/Colour2/Outline/120x80_PNGSheets/_Death.png',  frames: 10, fps: 9,  loop: false },
      },
    },

  }, // end characters

  enemies: {

    /* existing goblin replaced with MCF sprite (Attack3 only pack — frame 0 = idle) */
    goblin: {
      frameWidth: 150, frameHeight: 150,
      displayScale: 2.64, anchorY: 0.667,
      anims: {
        idle:   { file: 'src/sprites/Monster_Creatures_Fantasy(Version 1.3)/Goblin/Attack3.png', frames: 1,  fps: 2,  loop: true  },
        attack: { file: 'src/sprites/Monster_Creatures_Fantasy(Version 1.3)/Goblin/Attack3.png', frames: 12, fps: 12, loop: false },
      },
    },

    flying_eye: {
      frameWidth: 150, frameHeight: 150,
      displayScale: 3.7, anchorY: 0.6,
      anims: {
        idle:   { file: 'src/sprites/Monster_Creatures_Fantasy(Version 1.3)/Flying eye/Attack3.png', frames: 1, fps: 2,  loop: true  },
        attack: { file: 'src/sprites/Monster_Creatures_Fantasy(Version 1.3)/Flying eye/Attack3.png', frames: 6, fps: 12, loop: false },
      },
    },

    mushroom: {
      frameWidth: 150, frameHeight: 150,
      displayScale: 3.11, anchorY: 0.667,
      anims: {
        idle:   { file: 'src/sprites/Monster_Creatures_Fantasy(Version 1.3)/Mushroom/Attack3.png', frames: 1,  fps: 2,  loop: true  },
        attack: { file: 'src/sprites/Monster_Creatures_Fantasy(Version 1.3)/Mushroom/Attack3.png', frames: 11, fps: 12, loop: false },
      },
    },

    skeleton: {
      frameWidth: 150, frameHeight: 150,
      displayScale: 1.76, anchorY: 0.667,
      anims: {
        idle:   { file: 'src/sprites/Monster_Creatures_Fantasy(Version 1.3)/Skeleton/Attack3.png', frames: 1, fps: 2,  loop: true  },
        attack: { file: 'src/sprites/Monster_Creatures_Fantasy(Version 1.3)/Skeleton/Attack3.png', frames: 6, fps: 12, loop: false },
      },
    },

    fire_worm: {
      frameWidth: 90, frameHeight: 90,
      displayScale: 2.56, anchorY: 0.633,
      anims: {
        idle:   { file: 'src/sprites/Fire Worm/Sprites/Worm/Idle.png',    frames: 9,  fps: 8,  loop: true  },
        walk:   { file: 'src/sprites/Fire Worm/Sprites/Worm/Walk.png',    frames: 9,  fps: 12, loop: true  },
        attack: { file: 'src/sprites/Fire Worm/Sprites/Worm/Attack.png',  frames: 16, fps: 14, loop: false },
        hurt:   { file: 'src/sprites/Fire Worm/Sprites/Worm/Get Hit.png', frames: 3,  fps: 10, loop: false },
        death:  { file: 'src/sprites/Fire Worm/Sprites/Worm/Death.png',   frames: 8,  fps: 10, loop: false },
      },
    },

  }, // end enemies

  bosses: {

    /* No dedicated boss art exists, so each boss reuses the closest enemy
       sprite sheet at a far larger displayScale — a giant world monster.
       Any boss left out here falls back to the procedural art in BootScene. */

    goblin_king: {
      frameWidth: 150, frameHeight: 150,
      displayScale: 4.6, anchorY: 0.667,
      anims: {
        idle:   { file: 'src/sprites/Monster_Creatures_Fantasy(Version 1.3)/Goblin/Attack3.png', frames: 1,  fps: 2,  loop: true  },
        attack: { file: 'src/sprites/Monster_Creatures_Fantasy(Version 1.3)/Goblin/Attack3.png', frames: 12, fps: 12, loop: false },
      },
    },

    orc_warchief: {
      frameWidth: 150, frameHeight: 150,
      displayScale: 5.4, anchorY: 0.667,
      anims: {
        idle:   { file: 'src/sprites/Monster_Creatures_Fantasy(Version 1.3)/Mushroom/Attack3.png', frames: 1,  fps: 2,  loop: true  },
        attack: { file: 'src/sprites/Monster_Creatures_Fantasy(Version 1.3)/Mushroom/Attack3.png', frames: 11, fps: 12, loop: false },
      },
    },

    frost_troll: {
      frameWidth: 150, frameHeight: 150,
      displayScale: 3.6, anchorY: 0.667,
      anims: {
        idle:   { file: 'src/sprites/Monster_Creatures_Fantasy(Version 1.3)/Skeleton/Attack3.png', frames: 1, fps: 2,  loop: true  },
        attack: { file: 'src/sprites/Monster_Creatures_Fantasy(Version 1.3)/Skeleton/Attack3.png', frames: 6, fps: 12, loop: false },
      },
    },

    dragon_lord: {
      frameWidth: 90, frameHeight: 90,
      displayScale: 4.6, anchorY: 0.633,
      anims: {
        idle:   { file: 'src/sprites/Fire Worm/Sprites/Worm/Idle.png',    frames: 9,  fps: 8,  loop: true  },
        walk:   { file: 'src/sprites/Fire Worm/Sprites/Worm/Walk.png',    frames: 9,  fps: 12, loop: true  },
        attack: { file: 'src/sprites/Fire Worm/Sprites/Worm/Attack.png',  frames: 16, fps: 14, loop: false },
        hurt:   { file: 'src/sprites/Fire Worm/Sprites/Worm/Get Hit.png', frames: 3,  fps: 10, loop: false },
        death:  { file: 'src/sprites/Fire Worm/Sprites/Worm/Death.png',   frames: 8,  fps: 10, loop: false },
      },
    },

  },

};

/* Expose on window: a top-level `const` is a lexical global and never becomes
   a window property, but BootScene and AnimHelper gate the whole real-art
   pipeline on `window.ASSET_MANIFEST`. Without this the manifest reads as
   undefined and every sprite silently falls back to procedural art. */
window.ASSET_MANIFEST = ASSET_MANIFEST;
