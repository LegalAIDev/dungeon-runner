/* ============================================================================
   GameOverScene — shown after a run ends: the score, run stats, the high
   score, and buttons to play again, shop, or return to the menu.
   ========================================================================== */

class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOver'); }

  create() {
    const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;
    const data = this.registry.get('lastRun') || {
      distance: 0, coins: 0, biome: BIOMES[0].name, bestCombo: 0,
      newBest: false, biomeIndex: 0,
    };
    const biome = BIOMES[data.biomeIndex || 0];

    UI.scenicBackground(this, biome);
    this.add.rectangle(0, 0, W, H, 0x140d33, 0.62).setOrigin(0);
    this.cameras.main.fadeIn(320, 0, 0, 0);

    /* a tuckered-out runner beside the title */
    this.add.image(W / 2 - 220, 74, 'hero_hurt').setOrigin(0.5, 1).setScale(1.0);

    UI.text(this, W / 2, 66, 'Run Complete!', 40, '#ffd23f', { bold: true, shadow: true });

    UI.panel(this, W / 2, 274, 564, 312, UI.COLORS.panel,
      { stroke: UI.COLORS.accent, strokeWidth: 4 });

    UI.text(this, W / 2, 158, data.distance + ' m', 52, '#ffffff', { bold: true });
    UI.text(this, W / 2, 196, 'distance travelled', 14, '#9d8fce');

    if (data.newBest && data.distance > 0) {
      const nb = UI.text(this, W / 2, 236, '★   NEW BEST!   ★', 23, '#ffd23f', { bold: true });
      this.tweens.add({ targets: nb, scale: 1.12, duration: 620,
        yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      const confetti = this.add.particles(0, 0, 'spark', {
        speed: { min: 140, max: 360 }, angle: { min: 200, max: 340 },
        lifespan: 1100, gravityY: 500, scale: { start: 1.2, end: 0 },
        tint: [0xff5a6e, 0xffd23f, 0x36c98d, 0x5b6ef5, 0x46e0d0], emitting: false,
      });
      this.time.delayedCall(260, () => confetti.explode(60, W / 2, 120));
    } else {
      UI.text(this, W / 2, 236, 'Best:  ' + Save.data.highScore + ' m', 19,
        '#cdb8ff', { bold: true });
    }

    /* divider */
    const line = this.add.graphics();
    line.fillStyle(0xffffff, 0.12);
    line.fillRect(W / 2 - 240, 266, 480, 2);

    /* three run stats */
    const stat = (x, value, color, label) => {
      UI.text(this, x, 304, value, 26, color, { bold: true });
      UI.text(this, x, 332, label, 13, '#9d8fce');
    };
    stat(W / 2 - 168, '+' + data.coins, '#ffd23f', 'coins earned');
    stat(W / 2, 'x' + data.bestCombo, '#ff8f5a', 'best combo');
    stat(W / 2 + 168, 'World ' + ((data.biomeIndex || 0) + 1), '#7fd0ff', 'reached');

    this.add.image(W / 2 - 60, 380, 'coin').setScale(0.86);
    UI.text(this, W / 2 - 40, 380, 'Total saved: ' + Save.data.coins, 16,
      '#cdb8ff', { originX: 0 });

    /* buttons */
    UI.button(this, W / 2 - 202, 480, {
      label: 'Menu', width: 172, height: 56, fontSize: 21,
      color: UI.COLORS.panelLight, onClick: () => this.scene.start('Menu'),
    });
    UI.button(this, W / 2, 480, {
      label: '▶  Play Again', width: 214, height: 60, fontSize: 23,
      color: UI.COLORS.good, onClick: () => this.scene.start('Game'),
    });
    UI.button(this, W / 2 + 202, 480, {
      label: 'Shop', width: 172, height: 56, fontSize: 21,
      color: 0x8a63d6, onClick: () => this.scene.start('Shop', { from: 'GameOver' }),
    });

    this.input.keyboard.on('keydown-SPACE', () => this.scene.start('Game'));
    this.input.keyboard.on('keydown-ENTER', () => this.scene.start('Game'));
    this.events.once('shutdown', () => this.input.keyboard.removeAllListeners());
  }
}
