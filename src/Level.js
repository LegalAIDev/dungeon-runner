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
  };
})();
