/* ============================================================================
   GameOverScene — shown after a level. Displays the result, coins earned and,
   on a win, an invitation to power up in the Math Lab.
   ========================================================================== */

class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOver'); }

  init(data) { this.result = data || {}; }

  create() {
    const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;
    const r = this.result;
    const win = !!r.win;

    UI.scenicBackground(this, BIOMES[win ? 0 : 2]);
    this.add.rectangle(0, 0, W, H, 0x140d33, 0.66).setOrigin(0);
    this.cameras.main.fadeIn(300, 0, 0, 0);

    const world = findItem(WORLDS, r.worldId) || WORLDS[0];

    const title = win ? (r.boss ? 'BOSS DEFEATED!' : 'LEVEL CLEAR!') : 'DEFEATED';
    this.add.text(W / 2, 92, title, {
      fontFamily: UI.FONT, fontSize: '56px', fontStyle: 'bold',
      color: win ? '#ffd23f' : '#ff6a7e', stroke: '#3a2150', strokeThickness: 10,
    }).setOrigin(0.5);

    this.add.text(W / 2, 142,
      world.name + '  ·  ' + (r.boss ? 'Boss' : 'Level ' + ((r.levelIndex || 0) + 1)), {
      fontFamily: UI.FONT, fontSize: '20px', color: '#cdb8ff',
    }).setOrigin(0.5);

    UI.panel(this, W / 2, 296, 540, 224, UI.COLORS.panel,
      { stroke: win ? UI.COLORS.gold : UI.COLORS.bad, strokeWidth: 4 });

    const totalCoins = (r.coins || 0) + (win ? (r.bonus || 0) : 0);
    const rows = [
      ['Enemies defeated', String(r.kills || 0)],
      ['Coins collected', (r.coins || 0) + ' 💰'],
    ];
    if (win) rows.push(['Level clear bonus', '+' + (r.bonus || 0) + ' 💰']);
    rows.push(['Total this run', totalCoins + ' 💰']);

    rows.forEach((row, i) => {
      const y = 224 + i * 38;
      this.add.text(W / 2 - 230, y, row[0],
        { fontFamily: UI.FONT, fontSize: '20px', color: '#ffffff' }).setOrigin(0, 0.5);
      this.add.text(W / 2 + 230, y, row[1],
        { fontFamily: UI.FONT, fontSize: '20px', color: '#ffd23f', fontStyle: 'bold' })
        .setOrigin(1, 0.5);
    });
    if (win && r.perfect) {
      this.add.text(W / 2, 384, '✦ PERFECT CLEAR — no damage taken!  +50% coins ✦', {
        fontFamily: UI.FONT, fontSize: '16px', color: '#36c98d', fontStyle: 'bold',
      }).setOrigin(0.5);
    }

    this.add.text(W / 2, 428,
      win ? 'Enemies ahead are tougher — train in the Math Lab to power up!'
          : 'Out-geared? Earn ⭐ stars in the Math Lab and gear up.', {
      fontFamily: UI.FONT, fontSize: '16px', color: '#cdb8ff',
    }).setOrigin(0.5);

    /* buttons */
    const hasNext = win && !r.boss && (r.levelIndex || 0) < LEVELS_PER_WORLD - 1;
    const btns = [];
    if (hasNext) {
      btns.push(['Next Level →', UI.COLORS.good, () => {
        this.scene.start('Game',
          { worldId: r.worldId, levelIndex: (r.levelIndex || 0) + 1 });
      }]);
    } else if (!win) {
      btns.push(['Retry', UI.COLORS.good, () => {
        this.scene.start('Game', { worldId: r.worldId, levelIndex: r.levelIndex || 0 });
      }]);
    }
    btns.push(['🧪 Math Lab', 0x8a63d6, () => {
      this.scene.start('Shop', { from: 'WorldMap', tab: 'lab' });
    }]);
    btns.push(['World Map', UI.COLORS.accent, () => { this.scene.start('WorldMap'); }]);

    const step = 244;
    let bx = W / 2 - (btns.length - 1) * step / 2;
    btns.forEach((b) => {
      UI.button(this, bx, 492, {
        label: b[0], width: 228, height: 54, fontSize: 20, color: b[1],
        onClick: () => { SFX.click(); b[2](); },
      });
      bx += step;
    });

    if (win) SFX.levelUp(); else SFX.gameOver();
  }
}
