/* ============================================================================
   BootScene — runs once at startup. It draws every picture the game needs
   (the runner, coins, obstacles, backgrounds…) straight into textures with
   code, then hands over to the menu. Nothing is loaded from an image file.
   ========================================================================== */

class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  create() {
    const g = this.make.graphics({ add: false });

    /* --- the runner: 4 running frames plus jump / fall / slide / hurt --- */
    for (let i = 0; i < 4; i++) {
      this.drawHero(g, 'run', i); g.generateTexture('hero_run' + i, 72, 80); g.clear();
    }
    this.drawHero(g, 'jump', 0); g.generateTexture('hero_jump', 72, 80); g.clear();
    this.drawHero(g, 'fall', 0); g.generateTexture('hero_fall', 72, 80); g.clear();
    this.drawHero(g, 'hurt', 0); g.generateTexture('hero_hurt', 72, 80); g.clear();
    this.drawHeroSlide(g);       g.generateTexture('hero_slide', 72, 80); g.clear();

    /* --- collectibles --- */
    this.drawCoin(g); g.generateTexture('coin', 30, 30); g.clear();
    this.drawGem(g);  g.generateTexture('gem', 34, 32);  g.clear();

    /* --- obstacles --- */
    this.drawSpike(g); g.generateTexture('spike', 58, 56); g.clear();
    this.drawLava(g);  g.generateTexture('lava', 132, 42); g.clear();
    this.drawSaw(g);   g.generateTexture('saw', 64, 64);   g.clear();
    this.drawDrone(g); g.generateTexture('drone', 64, 56); g.clear();

    /* --- power-ups --- */
    ['shield', 'magnet', 'slow', 'x2', 'heart'].forEach((t) => {
      this.drawPowerUp(g, t); g.generateTexture('pu_' + t, 48, 48); g.clear();
    });

    /* --- HUD hearts --- */
    this.drawHeart(g, true);  g.generateTexture('heart_full', 34, 32);  g.clear();
    this.drawHeart(g, false); g.generateTexture('heart_empty', 34, 32); g.clear();

    /* --- particles & decorations --- */
    this.drawSpark(g); g.generateTexture('spark', 16, 16); g.clear();
    g.fillStyle(0xffffff, 1); g.fillRoundedRect(0, 0, 9, 9, 2);
    g.generateTexture('bit', 9, 9); g.clear();
    this.drawCloud(g); g.generateTexture('cloud', 140, 74); g.clear();
    this.drawStar(g);  g.generateTexture('star', 12, 12);  g.clear();
    this.drawGlow(g);  g.generateTexture('glow', 128, 128); g.clear();

    /* --- one set of scenery textures per biome --- */
    BIOMES.forEach((b) => {
      this.drawHills(g, 512, 220, b.hillFar, 3, 26);
      g.generateTexture('hillfar_' + b.key, 512, 220); g.clear();
      this.drawHills(g, 512, 250, b.hillNear, 2, 52);
      g.generateTexture('hillnear_' + b.key, 512, 250); g.clear();
      this.drawGround(g, 256, 170, b);
      g.generateTexture('ground_' + b.key, 256, 170); g.clear();
    });

    g.destroy();

    /* the looping run animation */
    this.anims.create({
      key: 'run',
      frames: [0, 1, 2, 3].map((i) => ({ key: 'hero_run' + i })),
      frameRate: 14,
      repeat: -1,
    });

    this.scene.start('Menu');
  }

  /* =====================  the runner  ==================================== */
  /* a rotated capsule used for arms and legs (angle 0 points straight down) */
  limb(g, ax, ay, len, thick, angle, color) {
    g.save();
    g.translateCanvas(ax, ay);
    g.rotateCanvas(angle);
    g.fillStyle(color, 1);
    g.fillRoundedRect(-thick / 2, -thick / 2, thick, len + thick / 2, thick / 2);
    g.restore();
  }

  drawHero(g, pose, phase) {
    const CX = 36;
    const BLUE = 0x5b6ef5, BLUEMID = 0x4a5ae0, BLUEDARK = 0x3a48c0;
    const SHOE = 0xffce3a, SHOEDK = 0xe6a81e;

    let bob = 0, lf = 0, lb = 0, af = 0, ab = 0, mouth = 'smile';
    if (pose === 'run') {
      lf = [0.62, 0.18, -0.55, -0.05][phase];
      lb = [-0.5, -0.05, 0.6, 0.2][phase];
      af = -lf * 0.85; ab = -lb * 0.85;
      bob = [0, -3, 0, -3][phase];
    } else if (pose === 'jump') {
      lf = 0.5; lb = 0.95; af = -1.5; ab = -1.15; bob = -2; mouth = 'open';
    } else if (pose === 'fall') {
      lf = -0.25; lb = 0.3; af = -2.1; ab = -1.8; mouth = 'open';
    } else if (pose === 'hurt') {
      lf = -0.55; lb = 0.5; af = -2.4; ab = 1.1; bob = -1; mouth = 'hurt';
    }

    const hipY = 62 + bob, shoulderY = 36 + bob, bodyTop = 22 + bob;
    const bodyW = 34, bodyH = 40;

    /* back limbs (drawn behind the body) */
    this.limb(g, CX + 5, hipY, 16, 10, lb, BLUEDARK);
    this.drawShoe(g, CX + 5, hipY, 16, lb, SHOEDK);
    this.limb(g, CX + 11, shoulderY, 15, 8, ab, BLUEDARK);

    /* body */
    g.fillStyle(BLUE, 1);
    g.fillRoundedRect(CX - bodyW / 2, bodyTop, bodyW, bodyH, 15);
    g.fillStyle(0xffffff, 0.16);
    g.fillRoundedRect(CX - bodyW / 2 + 5, bodyTop + 5, bodyW - 15, bodyH - 16, 10);

    /* front limbs */
    this.limb(g, CX - 5, hipY, 16, 10, lf, BLUEMID);
    this.drawShoe(g, CX - 5, hipY, 16, lf, SHOE);
    this.limb(g, CX - 11, shoulderY, 15, 8, af, BLUEMID);

    /* face */
    const eyeY = bodyTop + 16;
    const look = pose === 'run' ? 1.6 : (pose === 'hurt' ? -1 : 0);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(CX - 7, eyeY, 6.6);
    g.fillCircle(CX + 7, eyeY, 6.6);
    g.fillStyle(0x232048, 1);
    if (pose === 'hurt') {
      this.drawX(g, CX - 7, eyeY); this.drawX(g, CX + 7, eyeY);
    } else {
      g.fillCircle(CX - 7 + look, eyeY + 1, 3.5);
      g.fillCircle(CX + 7 + look, eyeY + 1, 3.5);
    }
    g.fillStyle(0x232048, 1);
    if (mouth === 'smile') g.fillRoundedRect(CX - 7, eyeY + 12, 14, 6, 3);
    else if (mouth === 'open') g.fillCircle(CX, eyeY + 14, 5);
    else g.fillCircle(CX, eyeY + 14, 4);
    g.fillStyle(0xff8fae, 0.5);
    g.fillCircle(CX - 13, eyeY + 7, 3.4);
    g.fillCircle(CX + 13, eyeY + 7, 3.4);
  }

  drawHeroSlide(g) {
    const BLUE = 0x5b6ef5, BLUEMID = 0x4a5ae0, BLUEDARK = 0x3a48c0, SHOE = 0xffce3a;
    /* legs trailing behind */
    this.limb(g, 30, 60, 20, 10, 1.45, BLUEDARK);
    this.drawShoe(g, 30, 60, 20, 1.45, 0xe6a81e);
    this.limb(g, 28, 64, 18, 10, 1.7, BLUEMID);
    this.drawShoe(g, 28, 64, 18, 1.7, SHOE);
    /* tilted body */
    g.save();
    g.translateCanvas(40, 58);
    g.rotateCanvas(-0.92);
    g.fillStyle(BLUE, 1);
    g.fillRoundedRect(-18, -19, 36, 38, 15);
    g.fillStyle(0xffffff, 0.16);
    g.fillRoundedRect(-13, -14, 22, 22, 9);
    g.restore();
    /* arm reaching forward */
    this.limb(g, 52, 50, 16, 8, -1.35, BLUEMID);
    /* face looking ahead */
    const ex = 52, ey = 50;
    g.fillStyle(0xffffff, 1);
    g.fillCircle(ex - 2, ey - 6, 6);
    g.fillCircle(ex + 8, ey - 4, 6);
    g.fillStyle(0x232048, 1);
    g.fillCircle(ex, ey - 6, 3.2);
    g.fillCircle(ex + 10, ey - 4, 3.2);
    g.fillStyle(0x232048, 1);
    g.fillCircle(ex + 5, ey + 5, 4);
    g.fillStyle(0xff8fae, 0.5);
    g.fillCircle(ex - 4, ey + 3, 3);
  }

  drawShoe(g, ax, ay, len, angle, color) {
    const fx = ax - Math.sin(angle) * len;
    const fy = ay + Math.cos(angle) * len;
    g.fillStyle(color, 1);
    g.fillEllipse(fx, fy + 2, 17, 10);
  }

  drawX(g, x, y) {
    g.lineStyle(2.5, 0x232048, 1);
    g.lineBetween(x - 4, y - 4, x + 4, y + 4);
    g.lineBetween(x - 4, y + 4, x + 4, y - 4);
  }

  /* =====================  collectibles  ================================= */
  drawCoin(g) {
    g.fillStyle(0x000000, 0.18); g.fillCircle(16, 17, 12);
    g.fillStyle(0xe6a81e, 1);    g.fillCircle(15, 15, 13);
    g.fillStyle(0xffce3a, 1);    g.fillCircle(15, 15, 10);
    g.fillStyle(0xe6a81e, 1);
    g.fillPoints([{ x: 15, y: 9 }, { x: 18, y: 15 }, { x: 15, y: 21 }, { x: 12, y: 15 }], true);
    g.fillStyle(0xfff3b8, 0.95); g.fillCircle(11, 11, 3.4);
  }

  drawGem(g) {
    const pts = [{ x: 17, y: 2 }, { x: 30, y: 13 }, { x: 24, y: 30 },
                 { x: 10, y: 30 }, { x: 4, y: 13 }];
    g.fillStyle(0x000000, 0.18);
    g.fillPoints(pts.map((p) => ({ x: p.x + 1, y: p.y + 2 })), true);
    g.fillStyle(0x46e0d0, 1); g.fillPoints(pts, true);
    g.fillStyle(0x8af2e8, 1);
    g.fillTriangle(17, 2, 4, 13, 17, 15);
    g.fillStyle(0xffffff, 0.7);
    g.fillTriangle(17, 2, 11, 8, 17, 11);
  }

  /* =====================  obstacles  ==================================== */
  drawSpike(g) {
    g.fillStyle(0x2e2a45, 1); g.fillRoundedRect(3, 42, 52, 13, 6);
    const heights = [10, 3, 14];
    for (let i = 0; i < 3; i++) {
      const bx = 5 + i * 16, top = heights[i];
      g.fillStyle(0x4a4566, 1);
      g.fillTriangle(bx, 47, bx + 17, 47, bx + 8.5, top);
      g.fillStyle(0x6a6494, 1);
      g.fillTriangle(bx, 47, bx + 8.5, 47, bx + 8.5, top);
      g.fillStyle(0xff5a3c, 1);
      g.fillTriangle(bx + 4, top + 11, bx + 13, top + 11, bx + 8.5, top);
    }
  }

  drawLava(g) {
    g.fillStyle(0x3a2230, 1); g.fillRoundedRect(0, 8, 132, 32, 9);
    g.fillStyle(0xff6a2a, 1);  g.fillRoundedRect(5, 12, 122, 24, 8);
    g.fillStyle(0xffb43c, 1);  g.fillRoundedRect(10, 15, 112, 13, 6);
    g.fillStyle(0xffe884, 0.95);
    g.fillCircle(32, 21, 5); g.fillCircle(72, 19, 6); g.fillCircle(104, 22, 4);
    g.fillStyle(0x3a2230, 1);
    for (let i = 0; i < 6; i++) {
      const x = 8 + i * 22;
      g.fillTriangle(x, 12, x + 14, 12, x + 7, 4);
    }
  }

  drawSaw(g) {
    const cx = 32, cy = 32, n = 10, inner = 22, outer = 31;
    g.fillStyle(0x9a9ab8, 1);
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2;
      const a1 = ((i + 0.5) / n) * Math.PI * 2;
      const am = ((i + 0.25) / n) * Math.PI * 2;
      g.fillTriangle(
        cx + Math.cos(a0) * inner, cy + Math.sin(a0) * inner,
        cx + Math.cos(a1) * inner, cy + Math.sin(a1) * inner,
        cx + Math.cos(am) * outer, cy + Math.sin(am) * outer);
    }
    g.fillStyle(0xb6b6d0, 1); g.fillCircle(cx, cy, inner);
    g.fillStyle(0x8e8eae, 1); g.fillCircle(cx, cy, inner - 4);
    g.fillStyle(0xffffff, 0.25); g.fillCircle(cx - 7, cy - 7, 6);
    g.fillStyle(0xff5a3c, 1); g.fillCircle(cx, cy, 8);
    g.fillStyle(0x2e2a45, 1); g.fillCircle(cx, cy, 3.6);
  }

  drawDrone(g) {
    g.fillStyle(0x6a6494, 1); g.fillRoundedRect(13, 2, 38, 6, 3);
    g.fillStyle(0x3a3550, 1); g.fillRect(31, 4, 2, 9);
    g.fillStyle(0x3a3550, 1);
    g.fillTriangle(13, 24, 2, 19, 13, 34);
    g.fillTriangle(51, 24, 62, 19, 51, 34);
    g.fillStyle(0x4a4566, 1); g.fillRoundedRect(12, 12, 40, 31, 15);
    g.fillStyle(0x5a5480, 1); g.fillRoundedRect(16, 16, 32, 19, 11);
    g.fillStyle(0xff5a3c, 1);  g.fillCircle(32, 27, 9);
    g.fillStyle(0x2e2a45, 1);  g.fillCircle(32, 27, 3.6);
    g.fillStyle(0xffd6c8, 1);  g.fillCircle(29, 24, 2.6);
    g.fillStyle(0xff5a3c, 0.45); g.fillCircle(32, 46, 8);
  }

  /* =====================  power-ups  ==================================== */
  drawPowerUp(g, type) {
    const bg = { shield: 0x4a7bff, magnet: 0xe0566b, slow: 0x9b6bff,
                 x2: 0xf5b829, heart: 0xff7aa8 }[type];
    g.fillStyle(0x000000, 0.2); g.fillCircle(25, 26, 21);
    g.fillStyle(bg, 1); g.fillCircle(24, 24, 21);
    g.fillStyle(0xffffff, 0.22); g.fillCircle(18, 17, 9);
    g.lineStyle(3, 0xffffff, 0.9); g.strokeCircle(24, 24, 21);
    g.fillStyle(0xffffff, 1);
    if (type === 'shield') {
      g.fillPoints([{ x: 24, y: 10 }, { x: 35, y: 15 }, { x: 35, y: 25 },
                    { x: 24, y: 37 }, { x: 13, y: 25 }, { x: 13, y: 15 }], true);
      g.fillStyle(bg, 1); g.fillCircle(24, 22, 4);
    } else if (type === 'magnet') {
      g.fillRoundedRect(13, 16, 9, 21, 3);
      g.fillRoundedRect(26, 16, 9, 21, 3);
      g.fillRoundedRect(13, 30, 22, 8, 4);
      g.fillStyle(0xffd2d2, 1);
      g.fillRect(13, 14, 9, 5); g.fillRect(26, 14, 9, 5);
    } else if (type === 'slow') {
      g.fillCircle(24, 25, 12);
      g.fillStyle(0x9b6bff, 1); g.fillCircle(24, 25, 9.5);
      g.lineStyle(3, 0xffffff, 1);
      g.lineBetween(24, 25, 24, 17);
      g.lineBetween(24, 25, 30, 28);
      g.fillStyle(0xffffff, 1); g.fillCircle(24, 25, 2.4);
    } else if (type === 'x2') {
      g.fillCircle(19, 27, 9); g.fillCircle(30, 21, 9);
      g.fillStyle(0xf5b829, 1);
      g.fillCircle(19, 27, 5.5); g.fillCircle(30, 21, 5.5);
    } else { /* heart */
      g.fillCircle(18, 21, 7); g.fillCircle(30, 21, 7);
      g.fillTriangle(11, 23, 37, 23, 24, 38);
    }
  }

  drawHeart(g, full) {
    const c = full ? 0xff5a6e : 0x3c3760;
    g.fillStyle(0x000000, 0.2);
    g.fillCircle(12, 14, 8); g.fillCircle(24, 14, 8);
    g.fillTriangle(4, 17, 32, 17, 18, 31);
    g.fillStyle(c, 1);
    g.fillCircle(11, 12, 8); g.fillCircle(23, 12, 8);
    g.fillTriangle(3, 15, 31, 15, 17, 30);
    if (full) { g.fillStyle(0xffffff, 0.45); g.fillCircle(9, 9, 3); }
  }

  /* =====================  particles & scenery  ========================== */
  drawSpark(g) {
    g.fillStyle(0xffffff, 0.25); g.fillCircle(8, 8, 7);
    g.fillStyle(0xffffff, 0.6);  g.fillCircle(8, 8, 4.5);
    g.fillStyle(0xffffff, 1);    g.fillCircle(8, 8, 2.6);
  }

  drawCloud(g) {
    g.fillStyle(0xffffff, 1);
    g.fillCircle(38, 46, 26);
    g.fillCircle(72, 32, 32);
    g.fillCircle(106, 44, 27);
    g.fillRect(38, 44, 68, 26);
    g.fillStyle(0xeaf4ff, 1);
    g.fillRect(38, 60, 70, 10);
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

  /* a seamless, tileable silhouette of rolling hills */
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
    g.fillStyle(biome.ground, 1);  g.fillRect(0, 0, w, h);
    g.fillStyle(biome.groundEdge, 1); g.fillRect(0, 0, w, 11);
    g.fillStyle(biome.groundDark, 1);
    g.fillRect(0, 11, w, 4);
    const dots = [[30, 46], [88, 70], [150, 40], [210, 84], [120, 120], [60, 100], [200, 130]];
    dots.forEach(([x, y]) => g.fillCircle(x, y, 6));
    g.fillStyle(biome.groundDark, 0.4);
    g.fillRect(0, 90, w, 3);
  }
}
