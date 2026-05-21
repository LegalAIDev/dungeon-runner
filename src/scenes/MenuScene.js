/* ============================================================================
   MenuScene — the title screen: play, how-to-play, shop and sound settings.
   ========================================================================== */

class MenuScene extends Phaser.Scene {
  constructor() { super('Menu'); }

  create() {
    const W = CONFIG.WIDTH, H = CONFIG.HEIGHT, GY = CONFIG.GROUND_Y;
    this.helpOpen = false;

    this.bg = UI.scenicBackground(this, BIOMES[0]);
    this.cameras.main.fadeIn(350, 0, 0, 0);

    /* browsers only allow sound after the player interacts — start it then */
    this.input.once('pointerdown', () => { SFX.init(); SFX.startMusic(); });

    /* a runner showing off on the right, with bobbing coins */
    this.add.sprite(806, GY + 3, 'hero_run0').setOrigin(0.5, 1).setScale(1.15).play('run');
    for (let i = 0; i < 3; i++) {
      const cy = GY - 86 - i * 33;
      const coin = this.add.image(806, cy, 'coin');
      this.tweens.add({ targets: coin, y: cy - 11, duration: 680 + i * 130,
        yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    }

    /* title */
    const title = this.add.text(W / 2, 120, 'MATH RUNNER', {
      fontFamily: UI.FONT, fontSize: '76px', fontStyle: 'bold',
      color: '#ffd23f', stroke: '#3a2150', strokeThickness: 12,
    }).setOrigin(0.5);
    title.setShadow(0, 8, 'rgba(0,0,0,0.4)', 10, false, true);
    this.tweens.add({ targets: title, scaleX: 1.045, scaleY: 1.045,
      duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    UI.text(this, W / 2, 180,
      'Dash through four worlds  •  Solve math to power up', 21, '#ffffff',
      { shadow: true });

    /* coins + best score panels */
    UI.panel(this, 130, 44, 210, 54, UI.COLORS.panel, { alpha: 0.9, radius: 14 });
    this.add.image(56, 44, 'coin').setScale(0.95);
    UI.text(this, 80, 44, '', 24, '#ffd23f', { originX: 0, bold: true })
      .setText(String(Save.data.coins));

    UI.panel(this, W - 150, 44, 250, 54, UI.COLORS.panel, { alpha: 0.9, radius: 14 });
    UI.text(this, W - 150, 44, 'Best  ' + Save.data.highScore + ' m', 22,
      '#cdb8ff', { bold: true });

    /* main buttons */
    const play = UI.button(this, W / 2, 292, {
      label: '▶  PLAY', width: 286, height: 80, fontSize: 35,
      color: UI.COLORS.good, onClick: () => this.startGame(),
    });
    this.tweens.add({ targets: play, scaleX: 1.05, scaleY: 1.05,
      duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    UI.button(this, W / 2 - 129, 376, {
      label: 'How to Play', width: 226, height: 58, fontSize: 22,
      color: UI.COLORS.accent, onClick: () => this.showHelp(),
    });
    UI.button(this, W / 2 + 129, 376, {
      label: 'Shop', width: 226, height: 58, fontSize: 22,
      color: 0x8a63d6, onClick: () => { SFX.click(); this.scene.start('Shop', { from: 'Menu' }); },
    });

    /* sound + music toggles */
    this.soundBtn = UI.button(this, W / 2 - 108, 458, {
      label: this.soundLabel(), width: 200, height: 48, fontSize: 18,
      color: UI.COLORS.panelLight, onClick: () => this.toggleSound(),
    });
    this.musicBtn = UI.button(this, W / 2 + 108, 458, {
      label: this.musicLabel(), width: 200, height: 48, fontSize: 18,
      color: UI.COLORS.panelLight, onClick: () => this.toggleMusic(),
    });

    /* keyboard shortcut to start */
    this.input.keyboard.on('keydown-ENTER', () => { if (!this.helpOpen) this.startGame(); });
    this.input.keyboard.on('keydown-SPACE', () => { if (!this.helpOpen) this.startGame(); });
    this.events.once('shutdown', () => this.input.keyboard.removeAllListeners());
  }

  soundLabel() { return 'Sound: ' + (Save.data.soundOn ? 'On' : 'Off'); }
  musicLabel() { return 'Music: ' + (Save.data.musicOn ? 'On' : 'Off'); }

  toggleSound() {
    Save.data.soundOn = !Save.data.soundOn;
    Save.persist();
    this.soundBtn.setButtonLabel(this.soundLabel());
    SFX.refreshMusic();
  }

  toggleMusic() {
    Save.data.musicOn = !Save.data.musicOn;
    Save.persist();
    this.musicBtn.setButtonLabel(this.musicLabel());
    SFX.init();
    SFX.startMusic();
    SFX.refreshMusic();
  }

  startGame() {
    if (this.helpOpen) return;
    SFX.init();
    SFX.startMusic();
    SFX.click();
    this.cameras.main.fadeOut(260, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Game'));
  }

  /* ---- the How to Play overlay (everything lives in one container) ---- */
  showHelp() {
    if (this.helpOpen) return;
    this.helpOpen = true;
    const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;
    const c = this.add.container(0, 0).setDepth(1000);

    c.add(this.add.rectangle(0, 0, W, H, 0x000000, 0.55).setOrigin(0).setInteractive());
    c.add(UI.panel(this, W / 2, H / 2, 640, 388, UI.COLORS.panel,
      { stroke: UI.COLORS.accent, strokeWidth: 4 }));
    c.add(UI.text(this, W / 2, H / 2 - 148, 'How to Play', 36, '#ffd23f', { bold: true }));

    const lines = [
      'The runner moves on its own — react to what is ahead.',
      'Tap, Space or the Up arrow to JUMP over spikes and lava.',
      'Hold, or the Down arrow, to SLIDE under saws and drones.',
      'Collect coins, then open the Shop to buy upgrades.',
      'Every upgrade asks you to solve a math problem first.',
      'Travel as far as you can across four different worlds!',
    ];
    lines.forEach((ln, i) => {
      const y = H / 2 - 92 + i * 40;
      c.add(this.add.circle(W / 2 - 272, y, 5, UI.COLORS.gold, 1));
      c.add(this.add.text(W / 2 - 254, y, ln,
        { fontFamily: UI.FONT, fontSize: '19px', color: '#ffffff' }).setOrigin(0, 0.5));
    });

    c.add(UI.button(this, W / 2, H / 2 + 154, {
      label: 'Got it!', width: 200, height: 54, fontSize: 22,
      color: UI.COLORS.good, onClick: () => this.hideHelp(),
    }));

    this.helpOverlay = c;
    c.setAlpha(0);
    this.tweens.add({ targets: c, alpha: 1, duration: 160 });
  }

  hideHelp() {
    if (!this.helpOverlay) return;
    SFX.click();
    this.helpOverlay.destroy();
    this.helpOverlay = null;
    this.helpOpen = false;
  }

  update(time, delta) {
    const d = delta / 1000;
    this.bg.hillFar.tilePositionX += 7 * d;
    this.bg.hillNear.tilePositionX += 16 * d;
    this.bg.ground.tilePositionX += 42 * d;
    this.bg.clouds.forEach((cl) => {
      cl.x -= 9 * d;
      if (cl.x < -100) cl.x = CONFIG.WIDTH + 100;
    });
  }
}
