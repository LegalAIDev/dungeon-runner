/* ============================================================================
   MenuScene — the title screen.
   ========================================================================== */

class MenuScene extends Phaser.Scene {
  constructor() { super('Menu'); }

  create() {
    const W = CONFIG.WIDTH, H = CONFIG.HEIGHT, GY = CONFIG.GROUND_Y;
    this.helpOpen = false;

    this.bg = UI.scenicBackground(this, BIOMES[0]);
    this.cameras.main.fadeIn(350, 0, 0, 0);

    this.input.once('pointerdown', () => { SFX.init(); SFX.startMusic(); });

    /* hero squaring up against a goblin */
    this.add.image(770, GY, 'shadowblob').setOrigin(0.5).setDepth(1);
    this.hero = this.add.sprite(770, GY + 6, 'hero_idle').setOrigin(0.5, 1).setScale(1.25);
    this.hero.play('hero-walk');
    const foe = this.add.sprite(866, GY + 4, 'foe_goblin').setOrigin(0.5, 1)
      .setScale(1.2).setFlipX(true);
    this.tweens.add({ targets: foe, y: foe.y - 8, duration: 520,
      yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    /* title */
    const title = this.add.text(W / 2, 116, 'MATH RUNNER', {
      fontFamily: UI.FONT, fontSize: '74px', fontStyle: 'bold',
      color: '#ffd23f', stroke: '#3a2150', strokeThickness: 12,
    }).setOrigin(0.5);
    title.setShadow(0, 8, 'rgba(0,0,0,0.4)', 10, false, true);
    this.tweens.add({ targets: title, scaleX: 1.04, scaleY: 1.04,
      duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    UI.text(this, W / 2, 174,
      'Fight through four worlds  •  Train in the Math Lab to power up',
      20, '#ffffff', { shadow: true });

    /* currency panels */
    UI.panel(this, 132, 44, 214, 54, UI.COLORS.panel, { alpha: 0.92, radius: 14 });
    this.add.image(58, 44, 'coin').setScale(0.95);
    UI.text(this, 82, 44, String(PlayerState.data.coins), 24, '#ffd23f',
      { originX: 0, bold: true });

    UI.panel(this, W - 132, 44, 214, 54, UI.COLORS.panel, { alpha: 0.92, radius: 14 });
    this.add.image(W - 206, 44, 'starcoin').setScale(0.92);
    UI.text(this, W - 182, 44, String(PlayerState.data.mathStars), 24, '#ffcf3f',
      { originX: 0, bold: true });

    /* buttons */
    const play = UI.button(this, W / 2, 280, {
      label: '▶  PLAY', width: 290, height: 80, fontSize: 35,
      color: UI.COLORS.good, onClick: () => this.startGame(),
    });
    this.tweens.add({ targets: play, scaleX: 1.05, scaleY: 1.05,
      duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    UI.button(this, W / 2 - 129, 364, {
      label: 'How to Play', width: 226, height: 56, fontSize: 21,
      color: UI.COLORS.accent, onClick: () => this.showHelp(),
    });
    UI.button(this, W / 2 + 129, 364, {
      label: 'Shop', width: 226, height: 56, fontSize: 21,
      color: 0x8a63d6, onClick: () => { SFX.click(); this.scene.start('Shop', { from: 'Menu' }); },
    });

    this.soundBtn = UI.button(this, W / 2 - 108, 442, {
      label: this.soundLabel(), width: 200, height: 46, fontSize: 17,
      color: UI.COLORS.panelLight, onClick: () => this.toggleSound(),
    });
    this.musicBtn = UI.button(this, W / 2 + 108, 442, {
      label: this.musicLabel(), width: 200, height: 46, fontSize: 17,
      color: UI.COLORS.panelLight, onClick: () => this.toggleMusic(),
    });

    this.input.keyboard.on('keydown-ENTER', () => { if (!this.helpOpen) this.startGame(); });
    this.events.once('shutdown', () => this.input.keyboard.removeAllListeners());
  }

  soundLabel() { return 'Sound: ' + (PlayerState.data.settings.soundOn ? 'On' : 'Off'); }
  musicLabel() { return 'Music: ' + (PlayerState.data.settings.musicOn ? 'On' : 'Off'); }

  toggleSound() {
    PlayerState.data.settings.soundOn = !PlayerState.data.settings.soundOn;
    PlayerState.save();
    this.soundBtn.setButtonLabel(this.soundLabel());
    SFX.refreshMusic();
  }

  toggleMusic() {
    PlayerState.data.settings.musicOn = !PlayerState.data.settings.musicOn;
    PlayerState.save();
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
    const next = PlayerState.data.charPicked ? 'WorldMap' : 'CharSelect';
    this.cameras.main.fadeOut(260, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(next));
  }

  showHelp() {
    if (this.helpOpen) return;
    this.helpOpen = true;
    const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;
    const c = this.add.container(0, 0).setDepth(1000);

    c.add(this.add.rectangle(0, 0, W, H, 0x000000, 0.55).setOrigin(0).setInteractive());
    c.add(UI.panel(this, W / 2, H / 2, 660, 408, UI.COLORS.panel,
      { stroke: UI.COLORS.accent, strokeWidth: 4 }));
    c.add(UI.text(this, W / 2, H / 2 - 158, 'How to Play', 34, '#ffd23f', { bold: true }));

    const lines = [
      'Move with ← →   ·   Jump with ↑ or Space',
      'Z = light attack    ·    X = heavy attack',
      '↓ while moving = dodge roll (brief invincibility)',
      'Clear every wave of enemies to win the level.',
      'Enemies get tougher — coins buy potions, not power.',
      'Visit the Shop’s Math Lab: solve math, earn ⭐ stars.',
      'Spend stars on stronger weapons, armour and heroes!',
    ];
    lines.forEach((ln, i) => {
      const y = H / 2 - 104 + i * 38;
      c.add(this.add.circle(W / 2 - 286, y, 5, UI.COLORS.gold, 1));
      c.add(this.add.text(W / 2 - 268, y, ln,
        { fontFamily: UI.FONT, fontSize: '19px', color: '#ffffff' }).setOrigin(0, 0.5));
    });

    c.add(UI.button(this, W / 2, H / 2 + 158, {
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
    this.bg.hillFar.tilePositionX += 5 * d;
    this.bg.hillNear.tilePositionX += 11 * d;
    this.bg.clouds.forEach((cl) => {
      cl.x -= 9 * d;
      if (cl.x < -100) cl.x = CONFIG.WIDTH + 100;
    });
  }
}
