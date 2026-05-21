/* ============================================================================
   HudScene — the combat overlay: HP hearts, world/level label, coins, combo
   counter, consumable slots and the boss health bar. Runs on top of GameScene.
   Stars are deliberately absent — they are earned only in the Math Lab.
   ========================================================================== */

class HudScene extends Phaser.Scene {
  constructor() { super('Hud'); }

  init(data) { this.game_ = data.game; }

  create() {
    const W = CONFIG.WIDTH;
    const g = this.game_;

    /* HP hearts */
    this.maxHearts = Math.round(g.player.maxHp / 20);
    this.hearts = [];
    for (let i = 0; i < this.maxHearts; i++) {
      this.hearts.push(this.add.image(40 + i * 38, 36, 'heart_full'));
    }

    /* world / level label */
    UI.panel(this, W / 2, 32, 320, 44, UI.COLORS.panel, { alpha: 0.9, radius: 12 });
    const lvlName = g.isBossLevel ? 'BOSS' : 'LEVEL ' + (g.levelIndex + 1);
    this.add.text(W / 2, 26, g.world.name.toUpperCase() + '  ·  ' + lvlName, {
      fontFamily: UI.FONT, fontSize: '17px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.waveLabel = this.add.text(W / 2, 46, '', {
      fontFamily: UI.FONT, fontSize: '14px', color: '#cdb8ff',
    }).setOrigin(0.5);

    /* coins */
    UI.panel(this, W - 92, 36, 160, 44, UI.COLORS.panel, { alpha: 0.9, radius: 12 });
    this.add.image(W - 148, 36, 'coin').setScale(0.85);
    this.coinText = this.add.text(W - 130, 36, '0', {
      fontFamily: UI.FONT, fontSize: '21px', color: '#ffd23f', fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    /* combo counter */
    this.comboText = this.add.text(30, CONFIG.HEIGHT - 40, '', {
      fontFamily: UI.FONT, fontSize: '26px', color: '#ffce3a', fontStyle: 'bold',
      stroke: '#3a2150', strokeThickness: 6,
    }).setOrigin(0, 0.5);

    /* consumable slots */
    this.slotIcons = [];
    g.consumableSlots.forEach((id, i) => {
      const x = W - 54 - i * 70;
      const y = CONFIG.HEIGHT - 44;
      UI.panel(this, x, y, 62, 62, UI.COLORS.panel, { alpha: 0.92, radius: 12 });
      const item = findItem(CONSUMABLES, id);
      this.add.text(x, y - 4, this.slotGlyph(item.effect), {
        fontFamily: UI.FONT, fontSize: '24px',
      }).setOrigin(0.5);
      this.add.text(x - 22, y - 21, String(i + 1), {
        fontFamily: UI.FONT, fontSize: '13px', color: '#cdb8ff', fontStyle: 'bold',
      }).setOrigin(0.5);
      const qty = this.add.text(x + 24, y + 22, '', {
        fontFamily: UI.FONT, fontSize: '15px', color: '#ffffff', fontStyle: 'bold',
      }).setOrigin(1, 1);
      this.slotIcons.push({ id: id, qty: qty });
    });

    /* boss bar (hidden until a boss is present) */
    this.bossBarBg = this.add.rectangle(W / 2, 86, 520, 26, 0x000000, 0.7)
      .setStrokeStyle(2, 0xffffff, 0.5).setVisible(false);
    this.bossBarFg = this.add.rectangle(W / 2 - 256, 86, 512, 18, 0xe0566b)
      .setOrigin(0, 0.5).setVisible(false);
    this.bossName = this.add.text(W / 2, 86, '', {
      fontFamily: UI.FONT, fontSize: '15px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5).setVisible(false);
  }

  slotGlyph(effect) {
    return { blockHit: '🛡', revive: '✚', magnet: '🧲', speed: '⚡', bomb: '💣' }[effect]
      || '★';
  }

  update() {
    const g = this.game_;
    if (!g || !g.player) return;

    const hpPerHeart = g.player.maxHp / this.maxHearts;
    for (let i = 0; i < this.maxHearts; i++) {
      const full = g.player.hp > i * hpPerHeart + hpPerHeart * 0.35;
      this.hearts[i].setTexture(full ? 'heart_full' : 'heart_empty');
    }

    this.coinText.setText(String(PlayerState.data.coins));
    if (g.isBossLevel) this.waveLabel.setText('');
    else this.waveLabel.setText('Wave ' + Math.max(1, g.waveIndex + 1) +
      ' / ' + g.waves.length);

    if (g.combo >= 2) {
      this.comboText.setText('COMBO  ' + g.combo + '×  🔥');
      this.comboText.setScale(g.combo >= 10 ? 1.2 : (g.combo >= 5 ? 1.08 : 1));
    } else {
      this.comboText.setText('');
    }

    this.slotIcons.forEach((s) => {
      const q = PlayerState.consumableQty(s.id);
      s.qty.setText('×' + q);
      s.qty.setColor(q > 0 ? '#ffffff' : '#7a6f9c');
    });

    if (g.boss && g.boss.alive) {
      const frac = Math.max(0, g.boss.hp / g.boss.maxHp);
      this.bossBarBg.setVisible(true);
      this.bossBarFg.setVisible(true).width = 512 * frac;
      this.bossName.setVisible(true).setText(g.boss.cfg.name);
    } else {
      this.bossBarBg.setVisible(false);
      this.bossBarFg.setVisible(false);
      this.bossName.setVisible(false);
    }
  }
}
