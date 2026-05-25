/* ============================================================================
   WorldMapScene — the overworld: four worlds, level select, gear-score display,
   star gates and daily quests.
   ========================================================================== */

class WorldMapScene extends Phaser.Scene {
  constructor() { super('WorldMap'); }

  init(data) { this.toastMsg = data && data.toast; }

  create() {
    const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;
    this.overlayOpen = false;
    DailyQuests.refresh();

    UI.scenicBackground(this, BIOMES[0]);
    this.add.rectangle(0, 0, W, H, 0x140d33, 0.5).setOrigin(0);
    this.cameras.main.fadeIn(280, 0, 0, 0);

    UI.text(this, W / 2, 40, 'WORLD MAP', 38, '#ffd23f', { bold: true, shadow: true });

    this.drawTopBar();

    /* four world cards */
    const cardW = 210, gap = 18;
    const startX = W / 2 - (cardW * 4 + gap * 3) / 2 + cardW / 2;
    WORLDS.forEach((world, i) => {
      this.drawWorldCard(world, i, startX + i * (cardW + gap), 260, cardW);
    });

    /* bottom buttons */
    UI.button(this, W / 2 - 240, 488, {
      label: '🏪 Shop', width: 200, height: 56, fontSize: 22,
      color: 0x8a63d6, onClick: () => { this.scene.start('Shop', { from: 'WorldMap' }); },
    });
    UI.button(this, W / 2, 488, {
      label: '📋 Daily Quests', width: 230, height: 56, fontSize: 21,
      color: UI.COLORS.accent, onClick: () => this.showQuests(),
    });
    UI.button(this, W / 2 + 240, 488, {
      label: 'Menu', width: 200, height: 56, fontSize: 22,
      color: UI.COLORS.panelLight, onClick: () => { this.scene.start('Menu'); },
    });

    if (this.toastMsg) this.showToast(this.toastMsg);
  }

  drawTopBar() {
    const W = CONFIG.WIDTH;
    UI.panel(this, 128, 40, 200, 48, UI.COLORS.panel, { alpha: 0.92, radius: 12 });
    this.add.image(58, 40, 'coin').setScale(0.9);
    UI.text(this, 80, 40, String(PlayerState.data.coins), 22, '#ffd23f',
      { originX: 0, bold: true });

    UI.panel(this, W - 128, 40, 200, 48, UI.COLORS.panel, { alpha: 0.92, radius: 12 });
    this.add.image(W - 196, 40, 'starcoin').setScale(0.85);
    UI.text(this, W - 174, 40, String(PlayerState.data.mathStars), 22, '#ffcf3f',
      { originX: 0, bold: true });

    UI.panel(this, W / 2, 92, 320, 40, UI.COLORS.panelLight, { alpha: 0.9, radius: 10 });
    UI.text(this, W / 2, 92,
      '⚙ Your Gear Score: ' + PlayerState.gearScore(), 20, '#ffffff', { bold: true });
  }

  drawWorldCard(world, index, x, y, cardW) {
    const biome = BIOMES[world.biome];
    const unlocked = PlayerState.isWorldUnlocked(world.id);
    const cardH = 200;

    UI.panel(this, x, y, cardW, cardH, UI.COLORS.panel,
      { stroke: unlocked ? UI.COLORS.accent : UI.COLORS.panelLight, strokeWidth: 3 });

    /* biome colour swatch */
    const sw = this.add.graphics();
    sw.fillStyle(biome.skyTop, 1);
    sw.fillRoundedRect(x - cardW / 2 + 14, y - cardH / 2 + 14, cardW - 28, 60, 10);
    sw.fillStyle(biome.ground, 1);
    sw.fillRoundedRect(x - cardW / 2 + 14, y - cardH / 2 + 52, cardW - 28, 22, 10);

    const cleared = PlayerState.data.progress[world.id].cleared.length;
    UI.text(this, x, y - cardH / 2 + 44, 'W' + (index + 1), 30, '#ffffff',
      { bold: true, shadow: true });

    UI.text(this, x, y - 16, world.name, 20, '#ffffff', { bold: true });
    UI.text(this, x, y + 12, '⚙ ' + world.recommend, 15, '#cdb8ff');
    UI.text(this, x, y + 34, cleared + ' / ' + LEVELS_PER_WORLD + ' levels', 15,
      cleared >= LEVELS_PER_WORLD ? '#36c98d' : '#9d8fce');

    if (unlocked) {
      UI.button(this, x, y + cardH / 2 - 28, {
        label: 'Enter', width: cardW - 50, height: 44, fontSize: 19,
        color: UI.COLORS.good, onClick: () => this.openLevelSelect(world, index),
      });
    } else {
      this.add.rectangle(x, y, cardW, cardH, 0x000000, 0.5);
      UI.text(this, x, y - 6, '🔒', 40, '#ffffff');
      UI.text(this, x, y + 40, 'Needs ' + world.starGate + ' ⭐', 17, '#ffcf3f',
        { bold: true });
    }
  }

  /* ---- level select overlay --------------------------------------------- */
  openLevelSelect(world, worldIndex) {
    if (this.overlayOpen) return;
    this.overlayOpen = true;
    const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;
    const c = this.add.container(0, 0).setDepth(900);

    c.add(this.add.rectangle(0, 0, W, H, 0x000000, 0.6).setOrigin(0).setInteractive());
    c.add(UI.panel(this, W / 2, H / 2, 720, 380, UI.COLORS.panel,
      { stroke: UI.COLORS.accent, strokeWidth: 4 }));
    c.add(UI.text(this, W / 2, H / 2 - 142, world.name, 32, '#ffd23f', { bold: true }));

    const th = WORLD_GEAR_THRESHOLDS[world.id];
    c.add(UI.text(this, W / 2, H / 2 - 104,
      'Recommended gear ' + th.comfortable + '   ·   You have ' + PlayerState.gearScore(),
      17, '#cdb8ff'));

    const slotW = 124, gap = 14;
    const sx = W / 2 - (slotW * 5 + gap * 4) / 2 + slotW / 2;
    for (let lvl = 0; lvl < LEVELS_PER_WORLD; lvl++) {
      const x = sx + lvl * (slotW + gap);
      const y = H / 2 - 8;
      const isBoss = lvl === LEVELS_PER_WORLD - 1;
      const unlocked = PlayerState.isLevelUnlocked(world.id, lvl);
      const cleared = PlayerState.isLevelCleared(world.id, lvl);

      c.add(UI.panel(this, x, y, slotW, 130,
        isBoss ? 0x5a2740 : UI.COLORS.panelLight,
        { radius: 12, stroke: cleared ? UI.COLORS.good : 0x000000,
          strokeWidth: cleared ? 3 : 0 }));
      c.add(UI.text(this, x, y - 38, isBoss ? 'BOSS' : 'Level ' + (lvl + 1),
        isBoss ? 19 : 17, isBoss ? '#ff9bb0' : '#ffffff', { bold: true }));
      c.add(UI.text(this, x, y - 10,
        isBoss ? '👑' : (cleared ? '✓ done' : (LEVEL_WAVES[lvl] + ' waves')),
        isBoss ? 26 : 15, cleared ? '#36c98d' : '#cdb8ff'));

      if (unlocked) {
        c.add(UI.button(this, x, y + 38, {
          label: cleared ? 'Replay' : 'Fight', width: slotW - 24, height: 40,
          fontSize: 17, color: isBoss ? UI.COLORS.bad : UI.COLORS.good,
          onClick: () => this.attemptLevel(world, worldIndex, lvl, c),
        }));
      } else {
        c.add(UI.text(this, x, y + 36, '🔒', 26, '#9d8fce'));
      }
    }

    c.add(UI.button(this, W / 2, H / 2 + 146, {
      label: 'Close', width: 180, height: 48, fontSize: 20,
      color: UI.COLORS.panelLight,
      onClick: () => { c.destroy(); this.overlayOpen = false; },
    }));

    c.setAlpha(0);
    this.tweens.add({ targets: c, alpha: 1, duration: 160 });
  }

  /* checks gear, shows a soft warning if under-geared, then starts the level */
  attemptLevel(world, worldIndex, levelIndex, overlay) {
    const th = WORLD_GEAR_THRESHOLDS[world.id];
    const gear = PlayerState.gearScore();
    if (gear < th.comfortable) {
      this.showGearWarning(world, worldIndex, levelIndex, gear, th, overlay);
    } else {
      this.startLevel(world.id, levelIndex);
    }
  }

  showGearWarning(world, worldIndex, levelIndex, gear, th, overlay) {
    const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;
    const c = this.add.container(0, 0).setDepth(1100);
    c.add(this.add.rectangle(0, 0, W, H, 0x000000, 0.55).setOrigin(0).setInteractive());
    c.add(UI.panel(this, W / 2, H / 2, 540, 280, 0x4a2a2a,
      { stroke: UI.COLORS.bad, strokeWidth: 4 }));
    c.add(UI.text(this, W / 2, H / 2 - 96, '⚠  Under-geared', 30, '#ffce3a',
      { bold: true }));

    const tough = gear < th.brutal;
    c.add(UI.text(this, W / 2, H / 2 - 44,
      'Your gear score is ' + gear + '.  Recommended: ' + th.comfortable + '.',
      19, '#ffffff'));
    c.add(UI.text(this, W / 2, H / 2 - 12,
      tough ? 'This will be extremely hard. Try the ' + QUIZ_CONTENT.labTitle + ' to power up!'
            : 'You can still win, but it will be tough.',
      17, '#ffd6d6', { wrapWidth: 480 }));

    c.add(UI.button(this, W / 2 - 130, H / 2 + 70, {
      label: 'Fight anyway', width: 220, height: 52, fontSize: 19,
      color: UI.COLORS.bad,
      onClick: () => { c.destroy(); this.startLevel(world.id, levelIndex); },
    }));
    c.add(UI.button(this, W / 2 + 130, H / 2 + 70, {
      label: QUIZ_CONTENT.labTitle + ' →', width: 220, height: 52, fontSize: 19,
      color: UI.COLORS.good,
      onClick: () => { this.scene.start('Shop', { from: 'WorldMap', tab: 'lab' }); },
    }));

    c.setAlpha(0);
    this.tweens.add({ targets: c, alpha: 1, duration: 150 });
  }

  startLevel(worldId, levelIndex) {
    PlayerState.unlock('worlds', worldId);
    this.cameras.main.fadeOut(240, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('Game', { worldId: worldId, levelIndex: levelIndex });
    });
  }

  /* ---- daily quests overlay --------------------------------------------- */
  showQuests() {
    if (this.overlayOpen) return;
    this.overlayOpen = true;
    const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;
    const dq = DailyQuests.refresh();
    const c = this.add.container(0, 0).setDepth(900);

    c.add(this.add.rectangle(0, 0, W, H, 0x000000, 0.6).setOrigin(0).setInteractive());
    c.add(UI.panel(this, W / 2, H / 2, 600, 400, UI.COLORS.panel,
      { stroke: UI.COLORS.accent, strokeWidth: 4 }));
    c.add(UI.text(this, W / 2, H / 2 - 162, '📋  Daily Quests', 30, '#ffd23f',
      { bold: true }));

    dq.quests.forEach((q, i) => {
      const tpl = DailyQuests.template(q.id);
      if (!tpl) return;
      const y = H / 2 - 104 + i * 64;
      const done = dq.completed.indexOf(q.id) !== -1;
      c.add(UI.panel(this, W / 2, y, 540, 54, UI.COLORS.panelLight,
        { radius: 10, alpha: done ? 0.6 : 1 }));
      c.add(this.add.text(W / 2 - 252, y, (done ? '✓ ' : '') + tpl.text,
        { fontFamily: UI.FONT, fontSize: '17px', color: done ? '#36c98d' : '#ffffff' })
        .setOrigin(0, 0.5));
      const rewColor = tpl.currency === 'coins' ? '#ffd23f' : '#ffcf3f';
      const rewIcon = tpl.currency === 'coins' ? '💰' : '⭐';
      c.add(this.add.text(W / 2 + 252, y, '+' + tpl.reward + ' ' + rewIcon,
        { fontFamily: UI.FONT, fontSize: '17px', color: rewColor, fontStyle: 'bold' })
        .setOrigin(1, 0.5));
      c.add(this.add.text(W / 2 - 252, y + 16,
        'Progress: ' + q.progress + ' / ' + tpl.goal,
        { fontFamily: UI.FONT, fontSize: '13px', color: '#9d8fce' }).setOrigin(0, 0.5));
    });

    /* daily challenge */
    const ct = DailyQuests.challengeTopic();
    const cy = H / 2 + 110;
    c.add(UI.panel(this, W / 2, cy, 540, 56, 0x3a2a5a,
      { radius: 10, stroke: UI.COLORS.gold, strokeWidth: 2 }));
    c.add(this.add.text(W / 2 - 252, cy,
      '⭐ Daily Challenge: ' + ct.name + ' × 10',
      { fontFamily: UI.FONT, fontSize: '17px', color: '#ffcf3f', fontStyle: 'bold' })
      .setOrigin(0, 0.5));
    c.add(this.add.text(W / 2 + 252, cy,
      dq.challengeDone ? '✓ Done' : '+50 ⭐',
      { fontFamily: UI.FONT, fontSize: '16px',
        color: dq.challengeDone ? '#36c98d' : '#ffcf3f', fontStyle: 'bold' })
      .setOrigin(1, 0.5));

    c.add(UI.button(this, W / 2, H / 2 + 162, {
      label: 'Close', width: 180, height: 46, fontSize: 19,
      color: UI.COLORS.panelLight,
      onClick: () => { c.destroy(); this.overlayOpen = false; },
    }));

    c.setAlpha(0);
    this.tweens.add({ targets: c, alpha: 1, duration: 160 });
  }

  showToast(msg) {
    const W = CONFIG.WIDTH;
    const t = this.add.container(W / 2, 150).setDepth(1200);
    t.add(UI.panel(this, 0, 0, 460, 56, UI.COLORS.good, { radius: 14 }));
    t.add(UI.text(this, 0, 0, msg, 20, '#ffffff', { bold: true }));
    t.setAlpha(0);
    this.tweens.add({ targets: t, alpha: 1, y: 130, duration: 280 });
    this.tweens.add({ targets: t, alpha: 0, duration: 400, delay: 2400,
      onComplete: () => t.destroy() });
  }
}
