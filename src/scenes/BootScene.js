/* ============================================================================
   BootScene — runs once at startup. Draws every sprite the game needs straight
   into textures with code (no image files), then opens the menu.
   ========================================================================== */

class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  preload() {
    if (!window.ASSET_MANIFEST) return;
    ['characters', 'enemies', 'bosses'].forEach((section) => {
      const sec = ASSET_MANIFEST[section] || {};
      Object.keys(sec).forEach((id) => {
        const ent = sec[id];
        Object.keys(ent.anims).forEach((state) => {
          const a = ent.anims[state];
          const texKey = 'art_' + section.charAt(0) + '_' + id + '_' + state;
          a._texKey = texKey;
          this.load.spritesheet(texKey, a.file,
            { frameWidth: ent.frameWidth, frameHeight: ent.frameHeight });
        });
      });
    });
  }

  create() {
    const g = this.make.graphics({ add: false });

    /* ---- the player hero, in every combat pose ---------------------------- */
    ['idle', 'walk0', 'walk1', 'jump', 'attack', 'hurt', 'dodge'].forEach((p) => {
      this.drawHero(g, p);
      g.generateTexture('hero_' + p, 104, 112);
      g.clear();
    });

    /* ---- standard enemies: an idle and an attack frame each -------------- */
    const foes = EnemyFactory.list();
    Object.keys(foes).forEach((key) => {
      const e = foes[key];
      this.drawMonster(g, e.w, e.h, this.foeStyle(key, 'idle'));
      g.generateTexture('foe_' + key, e.w, e.h); g.clear();
      this.drawMonster(g, e.w, e.h, this.foeStyle(key, 'atk'));
      g.generateTexture('foe_' + key + '_atk', e.w, e.h); g.clear();
    });

    /* ---- bosses --------------------------------------------------------- */
    const bosses = EnemyFactory.bossList();
    Object.keys(bosses).forEach((key) => {
      const b = bosses[key];
      this.drawMonster(g, b.w, b.h, this.bossStyle(key, 'idle'));
      g.generateTexture('boss_' + key, b.w, b.h); g.clear();
      this.drawMonster(g, b.w, b.h, this.bossStyle(key, 'atk'));
      g.generateTexture('boss_' + key + '_atk', b.w, b.h); g.clear();
    });

    /* ---- combat effects & pickups --------------------------------------- */
    this.drawSlash(g);   g.generateTexture('slash', 110, 110); g.clear();
    this.drawBolt(g);    g.generateTexture('bolt', 32, 32);    g.clear();
    this.drawShadow(g);  g.generateTexture('shadowblob', 92, 26); g.clear();
    this.drawCoin(g);    g.generateTexture('coin', 30, 30);    g.clear();
    this.drawStarIcon(g);g.generateTexture('starcoin', 34, 34); g.clear();
    this.drawHeart(g, true);  g.generateTexture('heart_full', 38, 36);  g.clear();
    this.drawHeart(g, false); g.generateTexture('heart_empty', 38, 36); g.clear();

    /* ---- particles & decoration ----------------------------------------- */
    this.drawSpark(g); g.generateTexture('spark', 16, 16); g.clear();
    g.fillStyle(0xffffff, 1); g.fillRoundedRect(0, 0, 9, 9, 2);
    g.generateTexture('bit', 9, 9); g.clear();
    this.drawCloud(g); g.generateTexture('cloud', 140, 74); g.clear();
    this.drawStar(g);  g.generateTexture('star', 12, 12);  g.clear();
    this.drawGlow(g);  g.generateTexture('glow', 128, 128); g.clear();

    /* ---- scenery textures, one set per world ---------------------------- */
    BIOMES.forEach((b) => {
      this.drawHills(g, 512, 220, b.hillFar, 3, 26);
      g.generateTexture('hillfar_' + b.key, 512, 220); g.clear();
      this.drawHills(g, 512, 250, b.hillNear, 2, 52);
      g.generateTexture('hillnear_' + b.key, 512, 250); g.clear();
      this.drawGround(g, 256, 170, b);
      g.generateTexture('ground_' + b.key, 256, 170); g.clear();
    });

    g.destroy();

    /* hero walk-cycle animation (procedural fallback) */
    this.anims.create({
      key: 'hero-walk',
      frames: [{ key: 'hero_walk0' }, { key: 'hero_idle' },
               { key: 'hero_walk1' }, { key: 'hero_idle' }],
      frameRate: 9, repeat: -1,
    });

    this._buildRealArtAnims();

    this.scene.start('Menu');
  }

  _buildRealArtAnims() {
    if (!window.ASSET_MANIFEST) return;
    ['characters', 'enemies', 'bosses'].forEach((section) => {
      const sec = ASSET_MANIFEST[section] || {};
      Object.keys(sec).forEach((id) => {
        const ent = sec[id];
        Object.keys(ent.anims).forEach((state) => {
          const a = ent.anims[state];
          if (!a._texKey || !this.textures.exists(a._texKey)) return;
          const key = 'art:' + section + ':' + id + ':' + state;
          if (this.anims.exists(key)) return;
          this.anims.create({
            key,
            frames: this.anims.generateFrameNumbers(a._texKey,
              { start: 0, end: a.frames - 1 }),
            frameRate: a.fps,
            repeat: a.loop ? -1 : 0,
          });
        });
      });
    });
  }

  /* ======================================================================
     THE HERO — a limbed humanoid holding a sword
     ====================================================================== */
  limb(g, ax, ay, len, thick, angle, color) {
    g.save();
    g.translateCanvas(ax, ay);
    g.rotateCanvas(angle);
    g.fillStyle(color, 1);
    g.fillRoundedRect(-thick / 2, -thick / 2, thick, len + thick / 2, thick / 2);
    g.restore();
  }

  drawHero(g, pose) {
    const CX = 52, GY = 110;
    const BLUE = 0x5b6ef5, BLUEMID = 0x4a5ae0, BLUEDARK = 0x3a48c0;
    const SHOE = 0xffce3a, SHOEDK = 0xe6a81e, SKIN = 0xffd6b0;

    let lf = 0.16, lb = -0.16, armBack = 0.4, armFront = 0.2;
    let lean = 0, bob = 0, swordAngle = 1.35, mouth = 'set';

    if (pose === 'idle')  { lf = 0.14; lb = -0.14; }
    else if (pose === 'walk0') { lf = 0.55; lb = -0.45; bob = -2; }
    else if (pose === 'walk1') { lf = -0.42; lb = 0.5;  bob = -2; }
    else if (pose === 'jump')  { lf = 0.6;  lb = 0.95;  bob = -4; armFront = -0.6; }
    else if (pose === 'attack'){ lean = 0.2; armFront = -1.0; swordAngle = -0.5;
                                 lf = 0.7; lb = -0.5; mouth = 'open'; }
    else if (pose === 'hurt')  { lean = -0.35; lf = -0.5; lb = 0.4; bob = -1;
                                 armFront = -1.6; mouth = 'hurt'; }
    else if (pose === 'dodge') { lean = 0.7; bob = 16; lf = 1.3; lb = 1.0;
                                 armFront = 1.1; armBack = 1.2; }

    g.save();
    g.translateCanvas(CX, GY - 56 + bob);
    g.rotateCanvas(lean);
    g.translateCanvas(-CX, -(GY - 56 + bob));

    const hipY = GY - 38 + bob, shoulderY = GY - 74 + bob, bodyTop = GY - 88 + bob;
    const bodyW = 36, bodyH = 46;

    /* back leg + arm */
    this.limb(g, CX + 5, hipY, 30, 13, lb, BLUEDARK);
    this.drawShoe(g, CX + 5, hipY, 30, lb, SHOEDK);
    this.limb(g, CX + 9, shoulderY, 26, 11, armBack, BLUEDARK);

    /* body */
    g.fillStyle(BLUE, 1);
    g.fillRoundedRect(CX - bodyW / 2, bodyTop, bodyW, bodyH, 14);
    g.fillStyle(0xffffff, 0.16);
    g.fillRoundedRect(CX - bodyW / 2 + 5, bodyTop + 5, bodyW - 16, bodyH - 18, 9);
    /* belt */
    g.fillStyle(SHOEDK, 1);
    g.fillRect(CX - bodyW / 2, bodyTop + bodyH - 12, bodyW, 7);

    /* front leg */
    this.limb(g, CX - 5, hipY, 30, 13, lf, BLUEMID);
    this.drawShoe(g, CX - 5, hipY, 30, lf, SHOE);

    /* head */
    const headY = bodyTop - 2;
    g.fillStyle(SKIN, 1);
    g.fillCircle(CX, headY, 16);
    g.fillStyle(0x3a2150, 1);                       // hair
    g.fillRoundedRect(CX - 16, headY - 17, 32, 13, 8);
    /* face */
    const eyeY = headY + 2;
    g.fillStyle(0xffffff, 1);
    g.fillCircle(CX - 6, eyeY, 5.5); g.fillCircle(CX + 7, eyeY, 5.5);
    g.fillStyle(0x232048, 1);
    if (pose === 'hurt') {
      this.drawX(g, CX - 6, eyeY); this.drawX(g, CX + 7, eyeY);
    } else {
      g.fillCircle(CX - 4, eyeY + 1, 3); g.fillCircle(CX + 9, eyeY + 1, 3);
    }
    g.fillStyle(0x232048, 1);
    if (mouth === 'open') g.fillCircle(CX + 2, eyeY + 11, 4.5);
    else if (mouth === 'hurt') g.fillCircle(CX + 2, eyeY + 12, 3.5);
    else g.fillRoundedRect(CX - 4, eyeY + 10, 12, 4, 2);

    /* front arm + sword */
    this.limb(g, CX - 9, shoulderY, 24, 11, armFront, SKIN);
    const handX = CX - 9 - Math.sin(armFront) * 24;
    const handY = shoulderY + Math.cos(armFront) * 24;
    this.drawSword(g, handX, handY, swordAngle);

    g.restore();
  }

  drawShoe(g, ax, ay, len, angle, color) {
    const fx = ax - Math.sin(angle) * len;
    const fy = ay + Math.cos(angle) * len;
    g.fillStyle(color, 1);
    g.fillEllipse(fx + 3, fy + 3, 22, 12);
  }

  drawSword(g, hx, hy, angle) {
    g.save();
    g.translateCanvas(hx, hy);
    g.rotateCanvas(angle);
    g.fillStyle(0x6a5a3a, 1);  g.fillRoundedRect(-4, -6, 8, 14, 3);   // grip
    g.fillStyle(0xffce3a, 1);  g.fillRoundedRect(-12, -10, 24, 6, 3); // guard
    g.fillStyle(0xdfe6f5, 1);                                          // blade
    g.fillTriangle(-6, -10, 6, -10, 0, -54);
    g.fillStyle(0xffffff, 0.8);
    g.fillTriangle(-2, -12, 2, -12, 0, -48);
    g.restore();
  }

  drawX(g, x, y) {
    g.lineStyle(2.6, 0x232048, 1);
    g.lineBetween(x - 4, y - 4, x + 4, y + 4);
    g.lineBetween(x - 4, y + 4, x + 4, y - 4);
  }

  /* ======================================================================
     MONSTERS — a chunky body shared by every enemy and boss
     ====================================================================== */
  foeStyle(key, pose) {
    const styles = {
      goblin:  { body: 0x6cae3e, bodyDark: 0x4d7c2a, belly: 0x9fd071,
                 feature: 'ears', weapon: null },
      orc:     { body: 0x3f7a4a, bodyDark: 0x2a5333, belly: 0x6fa878,
                 feature: 'tusks', weapon: 'club' },
      troll:   { body: 0x6f8fb8, bodyDark: 0x4a6486, belly: 0x9cb6d6,
                 feature: 'horns', weapon: 'club' },
      mage:    { body: 0x7a4fb0, bodyDark: 0x553480, belly: 0x9d78c8,
                 feature: 'hat', weapon: 'staff' },
      armored: { body: 0x8a8f9e, bodyDark: 0x5c6070, belly: 0xb3b8c6,
                 feature: 'helmet', weapon: 'club' },
      shadow:   { body: 0x2c2840, bodyDark: 0x16142a, belly: 0x423c63,
                  feature: 'aura', weapon: 'sword', eyeGlow: 0x57e8ff },
      skeleton: { body: 0xd8d0b8, bodyDark: 0xa89e88, belly: 0xf0ecd8,
                  feature: 'skull', weapon: 'sword' },
      flying_eye: { body: 0x7c1c8c, bodyDark: 0x4e1260, belly: 0xa84cc4,
                    feature: 'aura', weapon: null, eyeGlow: 0xff3aff },
      mushroom: { body: 0xcc3333, bodyDark: 0x8a2020, belly: 0xf0c0a0,
                  feature: 'hat', weapon: null },
      fire_worm: { body: 0xcc4400, bodyDark: 0x882200, belly: 0xff8844,
                   feature: 'horns', weapon: null, eyeGlow: 0xff4400 },
    };
    return Object.assign({ pose: pose }, styles[key] || styles.goblin);
  }

  bossStyle(key, pose) {
    const styles = {
      goblin_king:  { body: 0x6cae3e, bodyDark: 0x4d7c2a, belly: 0x9fd071,
                      feature: 'crown', weapon: 'club' },
      orc_warchief: { body: 0x3f7a4a, bodyDark: 0x2a5333, belly: 0x6fa878,
                      feature: 'warhelm', weapon: 'bigclub' },
      frost_troll:  { body: 0x86b6e0, bodyDark: 0x5285b6, belly: 0xbfe0f5,
                      feature: 'iceback', weapon: 'bigclub' },
      dragon_lord:  { body: 0x9c2f4a, bodyDark: 0x6a1d33, belly: 0xe07a4a,
                      feature: 'wings', weapon: 'sword', eyeGlow: 0xffd23f },
    };
    return Object.assign({ pose: pose }, styles[key] || styles.goblin_king);
  }

  drawMonster(g, W, H, c) {
    const cx = W / 2, gy = H - 3;
    const atk = c.pose === 'atk';
    const bodyW = W * 0.80;
    const bodyH = H * 0.60;
    const bodyTop = gy - H * 0.05 - bodyH;

    /* wings drawn behind the body */
    if (c.feature === 'wings') {
      g.fillStyle(c.bodyDark, 1);
      [-1, 1].forEach((s) => {
        g.fillTriangle(cx + s * bodyW * 0.22, bodyTop + bodyH * 0.25,
                       cx + s * bodyW * 0.60, bodyTop - H * 0.04,
                       cx + s * bodyW * 0.52, bodyTop + bodyH * 0.66);
      });
    }
    if (c.feature === 'iceback') {
      g.fillStyle(0xdaf0ff, 0.9);
      [-0.5, 0, 0.5].forEach((s) => {
        g.fillTriangle(cx + s * bodyW * 0.4 - 10, bodyTop + 6,
                       cx + s * bodyW * 0.4 + 10, bodyTop + 6,
                       cx + s * bodyW * 0.4, bodyTop - H * 0.22);
      });
    }

    /* feet */
    g.fillStyle(c.bodyDark, 1);
    g.fillEllipse(cx - bodyW * 0.24, gy, bodyW * 0.34, H * 0.11);
    g.fillEllipse(cx + bodyW * 0.24, gy, bodyW * 0.34, H * 0.11);

    /* back arm */
    g.fillStyle(c.bodyDark, 1);
    g.fillRoundedRect(cx + bodyW * 0.30, bodyTop + bodyH * 0.18,
                      bodyW * 0.20, bodyH * 0.50, bodyW * 0.10);

    /* aura behind shadow knight */
    if (c.feature === 'aura') {
      g.fillStyle(0x57e8ff, 0.12);
      g.fillCircle(cx, bodyTop + bodyH * 0.5, bodyW * 0.62);
    }

    /* body */
    g.fillStyle(c.body, 1);
    g.fillRoundedRect(cx - bodyW / 2, bodyTop, bodyW, bodyH, bodyW * 0.30);
    g.fillStyle(c.belly, 1);
    g.fillEllipse(cx, bodyTop + bodyH * 0.62, bodyW * 0.52, bodyH * 0.46);
    g.fillStyle(0xffffff, 0.12);
    g.fillEllipse(cx - bodyW * 0.18, bodyTop + bodyH * 0.30, bodyW * 0.22, bodyH * 0.26);

    /* eyes */
    const eyeY = bodyTop + bodyH * 0.30;
    const eyeDX = bodyW * 0.20;
    g.fillStyle(0xffffff, 1);
    g.fillEllipse(cx - eyeDX, eyeY, bodyW * 0.20, bodyH * 0.22);
    g.fillEllipse(cx + eyeDX, eyeY, bodyW * 0.20, bodyH * 0.22);
    const pupil = c.eyeGlow || 0x1c1830;
    g.fillStyle(pupil, 1);
    const look = atk ? -bodyW * 0.05 : 0;
    g.fillCircle(cx - eyeDX + look, eyeY + 2, bodyW * 0.075);
    g.fillCircle(cx + eyeDX + look, eyeY + 2, bodyW * 0.075);
    if (c.eyeGlow) {
      g.fillStyle(c.eyeGlow, 0.4);
      g.fillCircle(cx - eyeDX, eyeY, bodyW * 0.14);
      g.fillCircle(cx + eyeDX, eyeY, bodyW * 0.14);
    }
    /* angry brows */
    g.lineStyle(Math.max(2, bodyW * 0.05), c.bodyDark, 1);
    g.lineBetween(cx - eyeDX - bodyW * 0.12, eyeY - bodyH * 0.20,
                  cx - eyeDX + bodyW * 0.10, eyeY - bodyH * 0.06);
    g.lineBetween(cx + eyeDX + bodyW * 0.12, eyeY - bodyH * 0.20,
                  cx + eyeDX - bodyW * 0.10, eyeY - bodyH * 0.06);

    /* mouth */
    g.fillStyle(0x1c1226, 1);
    const mY = bodyTop + bodyH * 0.66;
    if (atk) g.fillEllipse(cx, mY, bodyW * 0.26, bodyH * 0.20);
    else g.fillRoundedRect(cx - bodyW * 0.16, mY, bodyW * 0.32, bodyH * 0.07, 3);

    /* features */
    if (c.feature === 'ears') {
      g.fillStyle(c.body, 1);
      g.fillTriangle(cx - bodyW * 0.46, bodyTop + bodyH * 0.10,
                     cx - bodyW * 0.46, bodyTop + bodyH * 0.45,
                     cx - bodyW * 0.74, bodyTop + bodyH * 0.18);
      g.fillTriangle(cx + bodyW * 0.46, bodyTop + bodyH * 0.10,
                     cx + bodyW * 0.46, bodyTop + bodyH * 0.45,
                     cx + bodyW * 0.74, bodyTop + bodyH * 0.18);
    } else if (c.feature === 'tusks') {
      g.fillStyle(0xfff0d0, 1);
      g.fillTriangle(cx - bodyW * 0.12, mY, cx - bodyW * 0.04, mY,
                     cx - bodyW * 0.10, mY + bodyH * 0.22);
      g.fillTriangle(cx + bodyW * 0.12, mY, cx + bodyW * 0.04, mY,
                     cx + bodyW * 0.10, mY + bodyH * 0.22);
    } else if (c.feature === 'horns') {
      g.fillStyle(0xf2e6c8, 1);
      g.fillTriangle(cx - bodyW * 0.30, bodyTop + 4, cx - bodyW * 0.14, bodyTop + 4,
                     cx - bodyW * 0.34, bodyTop - H * 0.16);
      g.fillTriangle(cx + bodyW * 0.30, bodyTop + 4, cx + bodyW * 0.14, bodyTop + 4,
                     cx + bodyW * 0.34, bodyTop - H * 0.16);
    } else if (c.feature === 'hat') {
      g.fillStyle(c.bodyDark, 1);
      g.fillTriangle(cx - bodyW * 0.42, bodyTop + 6, cx + bodyW * 0.42, bodyTop + 6,
                     cx, bodyTop - H * 0.34);
      g.fillStyle(0xffd23f, 1);
      g.fillCircle(cx, bodyTop - H * 0.30, bodyW * 0.07);
    } else if (c.feature === 'helmet') {
      g.fillStyle(0x6c7080, 1);
      g.fillRoundedRect(cx - bodyW * 0.40, bodyTop - 4, bodyW * 0.80, bodyH * 0.26, 8);
      g.fillStyle(0x3a3d48, 1);
      g.fillRect(cx - bodyW * 0.30, eyeY - bodyH * 0.04, bodyW * 0.60, bodyH * 0.05);
    } else if (c.feature === 'crown') {
      g.fillStyle(0xffd23f, 1);
      const cyTop = bodyTop - H * 0.04;
      g.fillRect(cx - bodyW * 0.34, cyTop, bodyW * 0.68, bodyH * 0.10);
      [-0.30, 0, 0.30].forEach((s) => {
        g.fillTriangle(cx + s * bodyW - bodyW * 0.08, cyTop,
                       cx + s * bodyW + bodyW * 0.08, cyTop,
                       cx + s * bodyW, cyTop - H * 0.13);
      });
    } else if (c.feature === 'warhelm') {
      g.fillStyle(0x4a4d58, 1);
      g.fillRoundedRect(cx - bodyW * 0.42, bodyTop - H * 0.06, bodyW * 0.84, bodyH * 0.30, 10);
      g.fillStyle(0xf2e6c8, 1);
      g.fillTriangle(cx - bodyW * 0.42, bodyTop - H * 0.02, cx - bodyW * 0.30, bodyTop - H * 0.02,
                     cx - bodyW * 0.66, bodyTop - H * 0.20);
      g.fillTriangle(cx + bodyW * 0.42, bodyTop - H * 0.02, cx + bodyW * 0.30, bodyTop - H * 0.02,
                     cx + bodyW * 0.66, bodyTop - H * 0.20);
    }

    /* front arm + weapon */
    const armX = cx - bodyW * 0.42;
    const armY = bodyTop + bodyH * 0.20;
    g.fillStyle(c.body, 1);
    if (atk) {
      g.fillRoundedRect(armX - bodyW * 0.16, armY - bodyH * 0.30,
                        bodyW * 0.22, bodyH * 0.46, bodyW * 0.10);
      this.drawWeapon(g, c.weapon, armX - bodyW * 0.05, armY - bodyH * 0.34, -0.7, bodyW);
    } else {
      g.fillRoundedRect(armX - bodyW * 0.06, armY,
                        bodyW * 0.22, bodyH * 0.50, bodyW * 0.10);
      this.drawWeapon(g, c.weapon, armX + bodyW * 0.05, armY + bodyH * 0.40, 0.25, bodyW);
    }
  }

  drawWeapon(g, type, x, y, angle, scale) {
    if (!type) return;
    g.save();
    g.translateCanvas(x, y);
    g.rotateCanvas(angle);
    const s = scale / 70;
    if (type === 'club' || type === 'bigclub') {
      const big = type === 'bigclub' ? 1.5 : 1;
      g.fillStyle(0x6a4a2a, 1);
      g.fillRoundedRect(-4 * s, 0, 8 * s, 34 * s * big, 4 * s);
      g.fillStyle(0x8a6238, 1);
      g.fillCircle(0, -6 * s, 14 * s * big);
      g.fillStyle(0x5a3c20, 1);
      g.fillCircle(-5 * s, -10 * s, 3 * s); g.fillCircle(6 * s, -4 * s, 3 * s);
    } else if (type === 'staff') {
      g.fillStyle(0x6a4a2a, 1);
      g.fillRoundedRect(-3 * s, -6 * s, 6 * s, 46 * s, 3 * s);
      g.fillStyle(0x57e8ff, 1);   g.fillCircle(0, -10 * s, 9 * s);
      g.fillStyle(0xffffff, 0.8); g.fillCircle(-2 * s, -12 * s, 3 * s);
    } else if (type === 'sword') {
      g.fillStyle(0x6a5a3a, 1); g.fillRoundedRect(-3 * s, 0, 6 * s, 12 * s, 3 * s);
      g.fillStyle(0xc0c6d6, 1); g.fillTriangle(-5 * s, 0, 5 * s, 0, 0, -40 * s);
    }
    g.restore();
  }

  /* ======================================================================
     EFFECTS, PICKUPS, PARTICLES
     ====================================================================== */
  drawSlash(g) {
    const cx = 55, cy = 55;
    for (let i = 0; i < 5; i++) {
      const a = 0.16 - i * 0.03;
      g.fillStyle(0xffffff, a);
      g.beginPath();
      g.arc(cx, cy, 50 - i * 3, -0.9, 0.9, false);
      g.arc(cx, cy, 20 - i * 2, 0.9, -0.9, true);
      g.closePath();
      g.fillPath();
    }
    g.fillStyle(0xffffff, 0.95);
    g.beginPath();
    g.arc(cx, cy, 48, -0.55, 0.55, false);
    g.arc(cx, cy, 38, 0.55, -0.55, true);
    g.closePath();
    g.fillPath();
  }

  drawBolt(g) {
    g.fillStyle(0xffffff, 0.25); g.fillCircle(16, 16, 15);
    g.fillStyle(0xffffff, 0.55); g.fillCircle(16, 16, 10);
    g.fillStyle(0xffffff, 1);    g.fillCircle(16, 16, 6);
  }

  drawShadow(g) {
    g.fillStyle(0x000000, 0.30); g.fillEllipse(46, 13, 86, 22);
    g.fillStyle(0x000000, 0.18); g.fillEllipse(46, 13, 92, 26);
  }

  drawCoin(g) {
    g.fillStyle(0x000000, 0.18); g.fillCircle(16, 17, 12);
    g.fillStyle(0xe6a81e, 1);    g.fillCircle(15, 15, 13);
    g.fillStyle(0xffce3a, 1);    g.fillCircle(15, 15, 10);
    g.fillStyle(0xe6a81e, 1);
    g.fillPoints([{ x: 15, y: 9 }, { x: 18, y: 15 }, { x: 15, y: 21 }, { x: 12, y: 15 }], true);
    g.fillStyle(0xfff3b8, 0.95); g.fillCircle(11, 11, 3.4);
  }

  drawStarIcon(g) {
    const cx = 17, cy = 18, pts = [];
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? 15 : 6.4;
      const a = -Math.PI / 2 + i * Math.PI / 5;
      pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
    }
    g.fillStyle(0x000000, 0.18);
    g.fillPoints(pts.map((p) => ({ x: p.x + 1, y: p.y + 2 })), true);
    g.fillStyle(0xffcf3f, 1); g.fillPoints(pts, true);
    g.fillStyle(0xfff3b8, 0.9);
    g.fillCircle(cx - 3, cy - 4, 3.6);
  }

  drawHeart(g, full) {
    const c = full ? 0xff5a6e : 0x3c3760;
    g.fillStyle(0x000000, 0.2);
    g.fillCircle(13, 15, 9); g.fillCircle(26, 15, 9);
    g.fillTriangle(4, 18, 35, 18, 19, 34);
    g.fillStyle(c, 1);
    g.fillCircle(12, 13, 9); g.fillCircle(25, 13, 9);
    g.fillTriangle(3, 16, 34, 16, 18, 33);
    if (full) { g.fillStyle(0xffffff, 0.5); g.fillCircle(9, 9, 3.4); }
  }

  drawSpark(g) {
    g.fillStyle(0xffffff, 0.25); g.fillCircle(8, 8, 7);
    g.fillStyle(0xffffff, 0.6);  g.fillCircle(8, 8, 4.5);
    g.fillStyle(0xffffff, 1);    g.fillCircle(8, 8, 2.6);
  }

  drawCloud(g) {
    g.fillStyle(0xffffff, 1);
    g.fillCircle(38, 46, 26); g.fillCircle(72, 32, 32); g.fillCircle(106, 44, 27);
    g.fillRect(38, 44, 68, 26);
    g.fillStyle(0xeaf4ff, 1); g.fillRect(38, 60, 70, 10);
  }

  drawStar(g) {
    g.fillStyle(0xffffff, 1);
    g.fillPoints([
      { x: 6, y: 0 }, { x: 7.4, y: 4.6 }, { x: 12, y: 6 }, { x: 7.4, y: 7.4 },
      { x: 6, y: 12 }, { x: 4.6, y: 7.4 }, { x: 0, y: 6 }, { x: 4.6, y: 4.6 },
    ], true);
  }

  drawGlow(g) {
    for (let i = 0; i < 32; i++) {
      g.fillStyle(0xffffff, 0.038);
      g.fillCircle(64, 64, 64 - i * 2);
    }
  }

  drawHills(g, w, h, color, periods, amp) {
    g.fillStyle(color, 1);
    g.beginPath();
    g.moveTo(0, h);
    for (let x = 0; x <= w; x += 8) {
      const t = (x / w) * Math.PI * 2 * periods;
      const bump = Math.sin(t) * 0.6 + Math.sin(t * 2 + 1) * 0.4;
      g.lineTo(x, h * 0.55 - bump * amp);
    }
    g.lineTo(w, h);
    g.closePath();
    g.fillPath();
  }

  drawGround(g, w, h, biome) {
    g.fillStyle(biome.ground, 1);     g.fillRect(0, 0, w, h);
    g.fillStyle(biome.groundEdge, 1); g.fillRect(0, 0, w, 11);
    g.fillStyle(biome.groundDark, 1); g.fillRect(0, 11, w, 4);
    const dots = [[30, 46], [88, 70], [150, 40], [210, 84], [120, 120], [60, 100], [200, 130]];
    g.fillStyle(biome.groundDark, 1);
    dots.forEach(([x, y]) => g.fillCircle(x, y, 6));
    g.fillStyle(biome.groundDark, 0.4); g.fillRect(0, 90, w, 3);
  }
}
