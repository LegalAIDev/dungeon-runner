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

    /* guard meter — drains when the shield soaks a hit, refills on its own */
    this.add.text(30, 63, '🛡', { fontFamily: UI.FONT, fontSize: '18px' })
      .setOrigin(0.5);
    this.add.rectangle(48, 63, 152, 13, 0x000000, 0.5)
      .setOrigin(0, 0.5).setStrokeStyle(2, 0xffffff, 0.25);
    this.guardBar = this.add.rectangle(50, 63, 148, 7, 0x6fd6ff).setOrigin(0, 0.5);

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

    /* combo counter — centred so it never sits under the touch controls */
    this.comboText = this.add.text(W / 2, 118, '', {
      fontFamily: UI.FONT, fontSize: '26px', color: '#ffce3a', fontStyle: 'bold',
      stroke: '#3a2150', strokeThickness: 6,
    }).setOrigin(0.5);

    /* consumable slots — a tappable column down the right edge, clear of the
       bottom-corner touch controls */
    this.slotIcons = [];
    g.consumableSlots.forEach((id, i) => {
      const x = W - 40;
      const y = 116 + i * 70;
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
      this.add.zone(x, y, 62, 62).setInteractive()
        .on('pointerdown', () => {
          if (!this.game_.paused && !this.game_.finished) {
            this.game_.useConsumable(i);
          }
        });
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

    /* on-screen controls — only built on actual mobile devices, not desktop
       touch-screen laptops.  UA check covers the common mobile platforms;
       the fallback catches tablets that may spoof a desktop UA. */
    const ua = navigator.userAgent || '';
    const mobileUA = /Android|iPhone|iPad|iPod|IEMobile|Opera Mini|BlackBerry|Mobile/i.test(ua);
    const likelyTablet = navigator.maxTouchPoints > 1 && window.innerWidth < 1100
                         && !(/Windows NT/.test(ua));
    if (mobileUA || likelyTablet) this.buildTouchControls();
  }

  slotGlyph(effect) {
    return { blockHit: '🛡', revive: '✚', magnet: '🧲', speed: '⚡', bomb: '💣' }[effect]
      || '★';
  }

  /* ---- touch controls --------------------------------------------------- */
  buildTouchControls() {
    this.input.addPointer(3);              // track several simultaneous touches
    const g = this.game_;
    const c = this.add.container(0, 0).setDepth(900);
    this.touchControls = c;

    const held = (k) => ({ onDown: () => { g.touch[k] = true; },
                           onUp:   () => { g.touch[k] = false; } });
    const tap  = (k) => ({ onDown: () => { g.touch[k] = true; } });

    c.add(this.touchButton(86,  474, 48, '◀', held('left')));
    c.add(this.touchButton(196, 474, 48, '▶', held('right')));
    c.add(this.touchButton(876, 470, 54, 'ATK',  tap('attack')));
    c.add(this.touchButton(762, 486, 46, 'JUMP', tap('jump')));
    c.add(this.touchButton(902, 352, 34, 'HVY',  tap('heavy')));
    c.add(this.touchButton(792, 360, 34, 'ROLL', tap('dodge')));
    c.add(this.touchButton(686, 404, 36, 'BLOCK', held('block')));
    /* pause — opens the pause menu, whose Resume button closes it again */
    c.add(this.touchButton(724, 32, 26, 'II', { onDown: () => g.togglePause() }));
  }

  touchButton(x, y, r, label, opts) {
    const cont = this.add.container(x, y);
    const gfx = this.add.graphics();
    const paint = (pressed) => {
      gfx.clear();
      gfx.fillStyle(0x000000, 0.4);  gfx.fillCircle(2, 4, r);
      gfx.fillStyle(pressed ? 0xffd23f : 0x3b2f72, pressed ? 0.92 : 0.5);
      gfx.fillCircle(0, 0, r);
      gfx.lineStyle(3, 0xffffff, pressed ? 0.95 : 0.45);
      gfx.strokeCircle(0, 0, r);
    };
    paint(false);
    const txt = this.add.text(0, 0, label, {
      fontFamily: UI.FONT, fontStyle: 'bold', color: '#ffffff',
      fontSize: Math.round(label.length > 1 ? r * 0.6 : r * 0.95) + 'px',
    }).setOrigin(0.5);
    cont.add([gfx, txt]);
    cont.setInteractive(new Phaser.Geom.Circle(0, 0, r),
                        Phaser.Geom.Circle.Contains);
    const press   = () => { paint(true);  if (opts.onDown) opts.onDown(); };
    const release = () => { paint(false); if (opts.onUp)   opts.onUp(); };
    cont.on('pointerdown', press);
    cont.on('pointerup', release);
    cont.on('pointerout', release);
    cont.on('pointerupoutside', release);
    return cont;
  }

  update() {
    const g = this.game_;
    if (!g || !g.player) return;

    const hpPerHeart = g.player.maxHp / this.maxHearts;
    for (let i = 0; i < this.maxHearts; i++) {
      const full = g.player.hp > i * hpPerHeart + hpPerHeart * 0.35;
      this.hearts[i].setTexture(full ? 'heart_full' : 'heart_empty');
    }

    /* guard meter — orange ghost bar while the guard is broken / recharging */
    const gp = g.player;
    const frac = Math.max(0, Math.min(1, gp.guard / gp.guardMax));
    if (g.clock < gp.guardBrokenUntil) {
      this.guardBar.width = 148;
      this.guardBar.setFillStyle(0xff7a4c).setAlpha(0.35);
    } else {
      this.guardBar.width = 148 * frac;
      this.guardBar.setAlpha(1)
        .setFillStyle(frac < 0.3 ? 0xffd23f : 0x6fd6ff);
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

    /* hide the touch pad while paused / finished, and drop any held
       movement so the player does not keep walking after a pause */
    if (this.touchControls) {
      const show = !g.paused && !g.finished;
      this.touchControls.setVisible(show);
      if (!show) {
        g.touch.left = false; g.touch.right = false; g.touch.block = false;
      }
    }
  }
}
