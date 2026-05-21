/* ============================================================================
   HudScene — the overlay that runs on top of the game: distance, coins, lives,
   combo, power-up timers, the biome banner and the touch controls.
   ========================================================================== */

class HudScene extends Phaser.Scene {
  constructor() { super('Hud'); }

  create() {
    const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;
    this.gameScene = this.scene.get('Game');
    const run = this.gameScene.run;
    this.touchMode = this.sys.game.device.input.touch;
    this.lastCombo = 0;

    /* distance + biome name */
    this.distanceText = UI.text(this, W / 2, 32, '0 m', 34, '#ffffff',
      { bold: true, shadow: true });
    this.biomeText = UI.text(this, W / 2, 62, run.biomeName, 15, '#e7ddff',
      { bold: true, shadow: true });

    /* lives (a row of hearts) */
    this.hearts = this.add.container(34, 36);
    this.heartIcons = [];
    for (let i = 0; i < run.maxLives; i++) {
      const himg = this.add.image(i * 31, 0, 'heart_full').setOrigin(0, 0.5);
      this.heartIcons.push(himg);
      this.hearts.add(himg);
    }

    /* coins */
    this.add.image(40, 74, 'coin').setScale(0.92);
    this.coinText = UI.text(this, 60, 74, '0', 24, '#ffd23f',
      { originX: 0, bold: true, shadow: true });

    /* combo pill (hidden until a streak builds) */
    this.comboPill = this.add.container(W / 2, 94).setVisible(false);
    this.comboBg = UI.panel(this, 0, 0, 150, 34, 0xff7a3c, { radius: 17, shadow: false });
    this.comboText = UI.text(this, 0, 0, '', 17, '#ffffff', { bold: true });
    this.comboPill.add([this.comboBg, this.comboText]);

    /* power-up timers (top-right) */
    this.indicators = {};
    ['shield', 'magnet', 'slow', 'x2'].forEach((t, i) => {
      const cont = this.add.container(W - 44, 116 + i * 46).setVisible(false);
      const bg = this.add.rectangle(0, 21, 44, 9, 0x000000, 0.55);
      const bar = this.add.image(-21, 21, 'bit').setOrigin(0, 0.5)
        .setTint(0xffd23f).setDisplaySize(42, 7);
      const icon = this.add.image(0, 0, 'pu_' + t).setScale(0.72);
      cont.add([bg, bar, icon]);
      this.indicators[t] = { cont, bar };
    });

    /* pause button — always available */
    UI.button(this, W - 68, 40, {
      label: 'Pause', width: 104, height: 46, fontSize: 18,
      color: UI.COLORS.panelLight,
      onClick: () => this.gameScene.togglePause(),
    });

    /* touch controls — shown only on touch devices */
    if (this.touchMode) {
      this.jumpBtn = this.roundButton(W - 84, H - 84, 56, 0x4a8bff, 'up');
      this.jumpBtn.on('pointerdown', () => {
        this.bump(this.jumpBtn); this.gameScene.jump();
      });
      this.slideBtn = this.roundButton(86, H - 84, 56, 0x9b6bff, 'down');
      this.slideBtn.on('pointerdown', () => {
        this.bump(this.slideBtn); this.gameScene.setSlide(true);
      });
      const endSlide = () => { this.slideBtn.setScale(1); this.gameScene.setSlide(false); };
      this.slideBtn.on('pointerup', endSlide);
      this.slideBtn.on('pointerout', endSlide);
    }

    /* banner for biome changes */
    this.banner = this.add.container(W / 2, -120).setDepth(90);
    this.bannerBg = UI.panel(this, 0, 0, 440, 96, UI.COLORS.accent,
      { stroke: 0xffffff, strokeWidth: 4 });
    this.bannerTitle = UI.text(this, 0, -18, '', 30, '#ffd23f', { bold: true });
    this.bannerSub = UI.text(this, 0, 20, '', 20, '#ffffff', { bold: true });
    this.banner.add([this.bannerBg, this.bannerTitle, this.bannerSub]);
  }

  /* a round touch button with an arrow icon */
  roundButton(x, y, r, color, dir) {
    const c = this.add.container(x, y).setDepth(60).setAlpha(0.72);
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.3); g.fillCircle(2, 4, r);
    g.fillStyle(color, 1); g.fillCircle(0, 0, r);
    g.fillStyle(0xffffff, 0.18); g.fillCircle(0, -r * 0.34, r * 0.6);
    g.lineStyle(4, 0xffffff, 0.9); g.strokeCircle(0, 0, r);
    c.add(g);
    const s = dir === 'up' ? -1 : 1;
    const tri = this.add.triangle(0, dir === 'up' ? -4 : 4,
      0, 16 * s, -17, -10 * s, 17, -10 * s, 0xffffff);
    c.add(tri);
    c.add(UI.text(this, 0, dir === 'up' ? 26 : -26,
      dir === 'up' ? 'JUMP' : 'SLIDE', 13, '#ffffff', { bold: true }));
    c.setInteractive(new Phaser.Geom.Circle(0, 0, r), Phaser.Geom.Circle.Contains);
    return c;
  }

  bump(btn) {
    btn.setScale(0.88);
    this.tweens.add({ targets: btn, scale: 1, duration: 150, ease: 'Back.out' });
  }

  /* called by GameScene when the runner is hurt */
  onDamage() {
    this.tweens.add({
      targets: this.hearts, x: 44, duration: 55, yoyo: true, repeat: 4,
      onComplete: () => { this.hearts.x = 34; },
    });
  }

  /* called by GameScene when a new world begins */
  showBanner(title, sub) {
    this.bannerTitle.setText(title);
    this.bannerSub.setText(sub);
    this.tweens.killTweensOf(this.banner);
    this.banner.y = -120;
    this.tweens.add({ targets: this.banner, y: 132, duration: 420, ease: 'Back.out' });
    this.tweens.add({ targets: this.banner, y: -120, delay: 1900, duration: 360,
      ease: 'Back.in' });
  }

  /* the pause menu — drawn here because the HUD renders on top of everything */
  setPauseOverlay(show) {
    if (show) {
      if (this.pauseLayer) return;
      const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;
      const c = this.add.container(0, 0).setDepth(200);
      c.add(this.add.rectangle(0, 0, W, H, 0x140d33, 0.82).setOrigin(0).setInteractive());
      c.add(UI.panel(this, W / 2, H / 2, 404, 420, UI.COLORS.panel,
        { stroke: UI.COLORS.accent, strokeWidth: 4 }));
      c.add(UI.text(this, W / 2, H / 2 - 162, 'Paused', 40, '#ffd23f', { bold: true }));
      c.add(this.add.image(W / 2 - 42, H / 2 - 108, 'coin').setScale(0.95));
      c.add(UI.text(this, W / 2 - 20, H / 2 - 108, String(Save.data.coins), 24,
        '#ffd23f', { originX: 0, bold: true }));

      const mk = (dy, label, color, fn) => c.add(UI.button(this, W / 2, H / 2 - 54 + dy, {
        label: label, width: 286, height: 60, fontSize: 23, color: color, onClick: fn,
      }));
      mk(0,   '▶  Resume',     UI.COLORS.good,   () => this.gameScene.togglePause());
      mk(74,  'Shop',          0x8a63d6,         () => this.gameScene.openShopFromPause());
      mk(148, '↻  Restart',    UI.COLORS.accent, () => this.scene.start('Game'));
      mk(222, 'Quit to Menu',  UI.COLORS.bad,    () => {
        this.scene.stop('Game'); this.scene.start('Menu');
      });
      this.pauseLayer = c;
    } else if (this.pauseLayer) {
      this.pauseLayer.destroy();
      this.pauseLayer = null;
    }
  }

  update() {
    const run = this.gameScene && this.gameScene.run;
    if (!run) return;
    const now = this.gameScene.time.now;

    this.distanceText.setText(Math.floor(run.distance) + ' m');
    this.biomeText.setText(run.biomeName);
    this.coinText.setText(String(run.coins));

    for (let i = 0; i < this.heartIcons.length; i++) {
      this.heartIcons[i].setTexture(i < run.lives ? 'heart_full' : 'heart_empty');
    }

    /* combo pill */
    if (run.combo >= 3) {
      this.comboPill.setVisible(true);
      this.comboText.setText('Combo  x' + run.combo);
      if (run.combo !== this.lastCombo) {
        this.comboPill.setScale(1.25);
        this.tweens.add({ targets: this.comboPill, scale: 1, duration: 180,
          ease: 'Back.out' });
      }
    } else {
      this.comboPill.setVisible(false);
    }
    this.lastCombo = run.combo;

    /* power-up timers */
    const upd = (t, until, dur) => {
      const ind = this.indicators[t];
      const left = until - now;
      if (left > 0) {
        ind.cont.setVisible(true);
        ind.bar.setDisplaySize(42 * Phaser.Math.Clamp(left / dur, 0, 1), 7);
      } else {
        ind.cont.setVisible(false);
      }
    };
    upd('magnet', run.magnetUntil, 8000);
    upd('slow', run.slowUntil, 6000);
    upd('x2', run.x2Until, 10000);
    this.indicators.shield.cont.setVisible(run.shield);
    this.indicators.shield.bar.setDisplaySize(42, 7);
  }
}
