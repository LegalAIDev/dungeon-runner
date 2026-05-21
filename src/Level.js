/* ============================================================================
   Level.js — cave level geometry. Builds the collidable platforms (the main
   floor plus jump-up ledges) from the mainlev_build tileset, and provides the
   one-way landing helpers GameScene uses for player/enemy/coin physics.
   ========================================================================== */

const Level = (function () {
  /* mainlev_build.png is loaded as a 32x32 tile sheet (32 columns).
     A frame index is row * 32 + col. */
  const SHEET_COLS = 32;
  const SRC_TILE   = 32;                       // source tile size in the sheet
  const frame = (col, row) => row * SHEET_COLS + col;

  const TILE_FLOOR = frame(27, 16);            // seamless brown-brick stone

  const T = () => CONFIG.TILE;                 // on-screen tile size (64)

  /* Decoration prop atlases. Each entry is a sub-rectangle [x, y, w, h]
     inside props1.png / props2.png, measured from the source sheets. */
  const PROP_FRAMES = {
    props1: {                                  // dark cave rocks
      cave_a: [16, 16, 144, 144], cave_b: [720, 54, 96, 106],
      cave_c: [912, 72, 118, 88], cave_d: [464, 96, 173, 64],
      cave_e: [176, 99, 160, 61],
    },
    props2: {                                  // trees, bushes, rock piles
      tree_big:  [69, 6, 283, 170],   tree_small: [391, 38, 218, 138],
      bush_big:  [855, 101, 133, 75], bush_small: [690, 110, 94, 66],
      rock_grass:[23, 864, 353, 144], rock_med:   [609, 521, 302, 183],
      rock_tall: [36, 503, 330, 265],
    },
  };

  /* Which props decorate each world — forest is leafy, the other three
     worlds are all caverns. `scale` keeps every prop a sensible size. */
  const DECOR_SETS = {
    forest: [
      { sheet: 'props2', frame: 'tree_big',   scale: 1.00 },
      { sheet: 'props2', frame: 'tree_small', scale: 1.00 },
      { sheet: 'props2', frame: 'bush_big',   scale: 1.00 },
      { sheet: 'props2', frame: 'bush_small', scale: 1.00 },
      { sheet: 'props2', frame: 'rock_grass', scale: 0.90 },
      { sheet: 'props1', frame: 'cave_c',     scale: 1.00 },
    ],
    cave: [
      { sheet: 'props1', frame: 'cave_a',    scale: 0.92 },
      { sheet: 'props1', frame: 'cave_b',    scale: 1.00 },
      { sheet: 'props1', frame: 'cave_c',    scale: 1.00 },
      { sheet: 'props1', frame: 'cave_d',    scale: 1.00 },
      { sheet: 'props1', frame: 'cave_e',    scale: 1.00 },
      { sheet: 'props2', frame: 'rock_med',  scale: 0.80 },
      { sheet: 'props2', frame: 'rock_tall', scale: 0.72 },
    ],
  };

  return {

    /* Solid rectangles for a level of the given pixel length. Each entry is
       { x, y, w, h, ledge } where y is the surface (feet stand at y).
       Entry 0 is always the continuous main floor. */
    buildPlatforms(levelLength) {
      const GY = CONFIG.GROUND_Y;
      const t  = T();
      const plats = [{ x: 0, y: GY, w: levelLength, h: t, ledge: false }];

      /* One reachable tier of ledges. Jump apex is
         JUMP_VELOCITY^2 / (2*GRAVITY) ~= 138px, so a 120px-high ledge is
         always clearable from the floor with a single jump. */
      const ledgeY = GY - 120;
      let x = 540, i = 0;
      while (x < levelLength - 520) {
        const wTiles = 3 + (i % 3);            // 3..5 tiles wide
        plats.push({ x: x, y: ledgeY, w: wTiles * t, h: t, ledge: true });
        x += CONFIG.WAVE_SPACING * (0.62 + (i % 3) * 0.16);
        i++;
      }
      return plats;
    },

    /* Draw every platform as a tiled brick strip with a lit top edge.
       Purely visual — `tint` colours the surface highlight per world. */
    render(scene, platforms, tint) {
      const scale = T() / SRC_TILE;
      platforms.forEach((p) => {
        const depth = p.ledge ? -9 : -10;
        scene.add.tileSprite(p.x, p.y, p.w, p.h, 'tiles', TILE_FLOOR)
          .setOrigin(0, 0)
          .setTileScale(scale, scale)
          .setDepth(depth);
        /* lit top edge so the stand-on surface reads crisply */
        scene.add.rectangle(p.x, p.y, p.w, 3, tint != null ? tint : 0xd8c0a0)
          .setOrigin(0, 0)
          .setDepth(depth)
          .setAlpha(0.55);
      });
    },

    /* One-way landing. An entity's feet moved from prevFootY to footY at
       world x. Returns the surface y to snap onto, or null to keep falling.
       Only catches platforms whose top the feet crossed downward from above. */
    landingY(platforms, x, prevFootY, footY, halfW) {
      let best = null;
      for (let k = 0; k < platforms.length; k++) {
        const p = platforms[k];
        if (x + halfW < p.x || x - halfW > p.x + p.w) continue;
        if (prevFootY <= p.y + 3 && footY >= p.y) {
          if (best === null || p.y < best) best = p.y;
        }
      }
      return best;
    },

    /* Highest platform surface at or just below footY at world x — used to
       tell whether a standing entity has walked off its ledge's edge. */
    surfaceUnder(platforms, x, footY, halfW) {
      let best = null;
      for (let k = 0; k < platforms.length; k++) {
        const p = platforms[k];
        if (x + halfW < p.x || x - halfW > p.x + p.w) continue;
        if (p.y >= footY - 3) {
          if (best === null || p.y < best) best = p.y;
        }
      }
      return best;
    },

    /* Registers the prop sub-frames on the loaded props sheets so decoration
       can be drawn with scene.add.image(x, y, sheet, frameName). Call once
       from BootScene after the props sheets have loaded. */
    registerPropFrames(scene) {
      Object.keys(PROP_FRAMES).forEach((sheet) => {
        if (!scene.textures.exists(sheet)) return;
        const tex = scene.textures.get(sheet);
        const set = PROP_FRAMES[sheet];
        Object.keys(set).forEach((name) => {
          if (tex.has(name)) return;
          const r = set[name];
          tex.add(name, 0, r[0], r[1], r[2], r[3]);
        });
      });
    },

    /* Scatters decorative trees / rocks along the main floor, tinted to the
       biome and drawn behind the action. Purely visual. */
    renderDecor(scene, platforms, biome, worldKey) {
      const floor = platforms[0];
      if (!floor) return;
      const set = DECOR_SETS[worldKey] || DECOR_SETS.cave;
      const tint = (biome && biome.caveTint != null) ? biome.caveTint : 0xffffff;
      const GY = CONFIG.GROUND_Y;
      let x = 240, i = 0;
      while (x < floor.w - 240) {
        const d = set[(i * 5 + 2) % set.length];
        if (scene.textures.exists(d.sheet) &&
            scene.textures.get(d.sheet).has(d.frame)) {
          const img = scene.add.image(x, GY + 8, d.sheet, d.frame)
            .setOrigin(0.5, 1)
            .setDepth(-30)
            .setTint(tint)
            .setScale(d.scale);
          if (i % 2 === 0) img.setFlipX(true);
        }
        x += 300 + (i * 67) % 220;
        i++;
      }
    },
  };
})();
