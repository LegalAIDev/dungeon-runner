/* ============================================================================
   ShopScene — spend coins on upgrades. Every purchase is unlocked by solving a
   grade-5 math problem (multiple choice). Reached from the menu, the pause
   menu, or the game-over screen.
   ========================================================================== */

class ShopScene extends Phaser.Scene {
  constructor() { super('Shop'); }

  init(data) {
    this.fromScene = (data && data.from) || 'Menu';
  }

  create() {
    const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;
    this.mathStreak = 0;
    this.cards = [];
    this.mathLayer = null;

    /* opaque background (covers the game when opened from the pause menu) */
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x241a4d, 0x241a4d, 0x150f31, 0x150f31, 1);
    bg.fillRect(0, 0, W, H);
    for (let i = 0; i < 16; i++) {
      this.add.image(Math.random() * W, Math.random() * H, 'star')
        .setAlpha(0.15 + Math.random() * 0.3).setScale(0.5 + Math.random());
    }

    /* header */
    UI.text(this, W / 2, 42, 'Upgrade Shop', 36, '#ffd23f', { bold: true, shadow: true });
    UI.panel(this, W / 2, 84, 240, 40, UI.COLORS.panel, { radius: 14, shadow: false });
    this.add.image(W / 2 - 64, 84, 'coin').setScale(0.92);
    this.coinText = UI.text(this, W / 2 - 44, 84, String(Save.data.coins), 22,
      '#ffd23f', { originX: 0, bold: true });
    this.streakText = UI.text(this, W / 2 + 12, 84, '', 15, '#cdb8ff', { originX: 0 });
    this.updateStreakText();

    UI.button(this, 86, 42, {
      label: '‹ Back', width: 130, height: 46, fontSize: 19,
      color: UI.COLORS.panelLight, onClick: () => this.closeShop(),
    });

    /* upgrade cards in a 3-wide grid */
    const colX = [166, 480, 794];
    const rowY = [184, 330, 476];
    UPGRADES.forEach((up, i) => {
      let cx = colX[i % 3], cy = rowY[Math.floor(i / 3)];
      if (i === UPGRADES.length - 1 && i % 3 === 0) cx = colX[1]; // lone last card → centre
      this.cards.push(this.buildCard(up, cx, cy));
    });

    this.confetti = this.add.particles(0, 0, 'spark', {
      speed: { min: 120, max: 340 }, angle: { min: 200, max: 340 },
      lifespan: 900, gravityY: 520, scale: { start: 1.1, end: 0 },
      tint: [0xff5a6e, 0xffd23f, 0x36c98d, 0x5b6ef5, 0x46e0d0],
      emitting: false,
    }).setDepth(1500);

    /* keyboard: answer math with keys 1-4, Esc to cancel */
    this.input.keyboard.on('keydown-ONE',   () => this.pickChoice(0));
    this.input.keyboard.on('keydown-TWO',   () => this.pickChoice(1));
    this.input.keyboard.on('keydown-THREE', () => this.pickChoice(2));
    this.input.keyboard.on('keydown-FOUR',  () => this.pickChoice(3));
    this.input.keyboard.on('keydown-ESC',   () => {
      if (this.mathLayer) this.closeMath(); else this.closeShop();
    });
    this.events.once('shutdown', () => this.input.keyboard.removeAllListeners());

    this.cameras.main.fadeIn(220, 0, 0, 0);
  }

  updateStreakText() {
    this.streakText.setText(this.mathStreak >= 2 ? 'Math streak: ' + this.mathStreak : '');
  }

  /* ---- one upgrade card ---- */
  buildCard(up, cx, cy) {
    const w = 292, h = 134;
    UI.panel(this, cx, cy, w, h, UI.COLORS.panel,
      { radius: 16, stroke: UI.COLORS.panelLight, strokeWidth: 2 });

    UI.text(this, cx - 130, cy - 50, up.name, 19, '#ffffff', { originX: 0, bold: true });
    const tierColor = ['#36c98d', '#ffd23f', '#e0566b'][up.tier - 1];
    const tierWord = ['Easy math', 'Medium math', 'Tricky math'][up.tier - 1];
    UI.text(this, cx + 132, cy - 50, tierWord, 13, tierColor, { originX: 1, bold: true });

    UI.text(this, cx - 130, cy - 12, up.desc, 13, '#cdb8ff',
      { originX: 0, originY: 0.5, align: 'left', wrapWidth: 260 });

    const ownedText = UI.text(this, cx - 130, cy + 28, '', 13, '#9d8fce', { originX: 0 });

    const buyBtn = UI.button(this, cx + 28, cy + 38, {
      label: '', width: 196, height: 40, fontSize: 16,
      color: UI.COLORS.good, onClick: () => this.openMath(up),
    });

    const card = { up, ownedText, buyBtn };
    this.refreshCard(card);
    return card;
  }

  refreshCard(card) {
    const up = card.up;
    const owned = Save.owned(up.id);
    const maxed = owned >= up.max;
    const cost = upgradeCost(up, owned);
    card.ownedText.setText('Owned: ' + owned + ' / ' + up.max);
    if (maxed) {
      card.buyBtn.setButtonLabel('MAXED OUT');
      card.buyBtn.setButtonEnabled(false);
    } else {
      card.buyBtn.setButtonLabel('Buy  ·  ' + cost + ' coins');
      card.buyBtn.setButtonEnabled(Save.data.coins >= cost);
    }
  }

  refreshAllCards() {
    this.coinText.setText(String(Save.data.coins));
    this.cards.forEach((c) => this.refreshCard(c));
  }

  /* ---- the math challenge overlay ---- */
  openMath(up) {
    if (this.mathLayer) return;
    const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;
    const owned = Save.owned(up.id);
    this.pendingCost = upgradeCost(up, owned);
    this.pendingUp = up;
    this.problem = MathProblems.generate(up.tier);
    this.resolved = false;

    const c = this.add.container(0, 0).setDepth(1000);
    c.add(this.add.rectangle(0, 0, W, H, 0x000000, 0.66).setOrigin(0).setInteractive());
    c.add(UI.panel(this, W / 2, 266, 612, 452, UI.COLORS.panel,
      { stroke: UI.COLORS.accent, strokeWidth: 4 }));
    c.add(UI.text(this, W / 2, 88, 'Solve to unlock: ' + up.name, 24, '#ffd23f',
      { bold: true }));
    const tierWord = ['Easy', 'Medium', 'Tricky'][up.tier - 1];
    c.add(UI.text(this, W / 2, 120, this.problem.topic + '  ·  ' + tierWord, 15,
      '#cdb8ff'));
    /* show "12 × 8  =  ?" for plain expressions, but word problems as-is */
    const qDisplay = /[a-z]/i.test(this.problem.q)
      ? this.problem.q : this.problem.q + '   =   ?';
    c.add(UI.text(this, W / 2, 168, qDisplay, 27, '#ffffff',
      { bold: true, wrapWidth: 544 }));

    /* four answer buttons in a 2x2 grid */
    this.choiceButtons = [];
    const gx = [W / 2 - 130, W / 2 + 130];
    const gy = [262, 326];
    this.problem.choices.forEach((choice, i) => {
      const btn = this.makeChoice(gx[i % 2], gy[Math.floor(i / 2)],
        (i + 1) + '.  ' + choice, i);
      this.choiceButtons.push(btn);
      c.add(btn);
    });

    this.mathFeedback = UI.text(this, W / 2, 388, 'Pick the correct answer', 17,
      '#cdb8ff', { bold: true });
    c.add(this.mathFeedback);
    this.mathHint = UI.text(this, W / 2, 418, '', 14, '#9d8fce',
      { wrapWidth: 540 });
    c.add(this.mathHint);

    c.add(UI.button(this, W / 2, 458, {
      label: 'Cancel', width: 150, height: 38, fontSize: 16,
      color: UI.COLORS.panelLight, onClick: () => this.closeMath(),
    }));

    this.mathLayer = c;
    c.setScale(0.92);
    this.tweens.add({ targets: c, scale: 1, duration: 180, ease: 'Back.out' });
  }

  /* a recolourable answer button */
  makeChoice(x, y, label, index) {
    const w = 248, h = 56;
    const cont = this.add.container(x, y);
    const g = this.add.graphics();
    const txt = this.add.text(0, 0, label, {
      fontFamily: UI.FONT, fontSize: '21px', color: '#ffffff', fontStyle: 'bold',
      align: 'center', wordWrap: { width: w - 26 },
    }).setOrigin(0.5);
    cont.add([g, txt]);

    const colors = { idle: 0x4a5ae0, hover: 0x5b6ef5, down: 0x3a48c0,
                     good: 0x36c98d, bad: 0xe0566b, dead: 0x4c4770 };
    cont.state2 = 'idle';
    function paint() {
      g.clear();
      g.fillStyle(0x000000, 0.3); g.fillRoundedRect(-w / 2 + 3, -h / 2 + 6, w, h, 14);
      g.fillStyle(colors[cont.state2], 1); g.fillRoundedRect(-w / 2, -h / 2, w, h, 14);
      g.fillStyle(0xffffff, 0.14); g.fillRoundedRect(-w / 2 + 5, -h / 2 + 4, w - 10, h * 0.4, 10);
    }
    paint();
    cont.repaint = paint;
    cont.isLive = () => ['idle', 'hover', 'down'].indexOf(cont.state2) >= 0;
    cont.setInteractive(new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h),
      Phaser.Geom.Rectangle.Contains);
    cont.on('pointerover', () => { if (cont.state2 === 'idle') { cont.state2 = 'hover'; paint(); } });
    cont.on('pointerout',  () => { if (cont.state2 === 'hover') { cont.state2 = 'idle'; paint(); } });
    cont.on('pointerdown', () => { if (cont.isLive()) { cont.state2 = 'down'; paint(); } });
    cont.on('pointerup',   () => { if (cont.isLive()) this.pickChoice(index); });
    return cont;
  }

  pickChoice(i) {
    if (!this.mathLayer || this.resolved) return;
    const btn = this.choiceButtons[i];
    if (!btn || !btn.isLive()) return;
    const chosen = this.problem.choices[i];

    if (chosen === this.problem.answer) {
      this.resolved = true;
      btn.state2 = 'good'; btn.repaint();
      this.choiceButtons.forEach((b) => { if (b.isLive()) { b.state2 = 'dead'; b.repaint(); } });
      this.completePurchase();
    } else {
      btn.state2 = 'bad'; btn.repaint();
      this.mathStreak = 0;
      this.updateStreakText();
      SFX.wrong();
      this.mathFeedback.setText('Not quite — try another!').setColor('#e0566b');
      this.mathHint.setText('Hint: ' + this.problem.hint);
      this.cameras.main.shake(150, 0.006);
    }
  }

  completePurchase() {
    const up = this.pendingUp;
    SFX.correct();
    SFX.buy();
    this.confetti.explode(40, CONFIG.WIDTH / 2, 150);

    Save.spendCoins(this.pendingCost);
    Save.buyUpgrade(up.id);
    this.mathStreak++;
    const bonus = Math.min(5, this.mathStreak);
    Save.addCoins(bonus);
    this.updateStreakText();

    this.mathFeedback
      .setText('Correct!  ' + up.name + ' bought.  +' + bonus + ' streak coins')
      .setColor('#36c98d');
    this.mathHint.setText('');
    this.refreshAllCards();
    this.time.delayedCall(1250, () => this.closeMath());
  }

  closeMath() {
    if (!this.mathLayer) return;
    if (!this.resolved) SFX.click();
    this.mathLayer.destroy();
    this.mathLayer = null;
  }

  closeShop() {
    if (this.mathLayer) return;
    SFX.click();
    this.cameras.main.fadeOut(200, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      if (this.fromScene === 'Game') this.scene.stop();
      else if (this.fromScene === 'GameOver') this.scene.start('GameOver');
      else this.scene.start('Menu');
    });
  }
}
