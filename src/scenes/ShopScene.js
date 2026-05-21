/* ============================================================================
   ShopScene — three tabs:
     · Coin Shop   — consumables bought with 💰 coins
     · Math Lab    — launches a training session
     · Star Upgrades — permanent weapons / armour / heroes / pets, ⭐ stars
   ========================================================================== */

class ShopScene extends Phaser.Scene {
  constructor() { super('Shop'); }

  init(data) {
    this.fromScene = (data && data.from) || 'WorldMap';
    this.tab = (data && data.tab) || 'upgrades';
    if (!this.upgradeCat) this.upgradeCat = 'weapon';
    if (this.upgradePage == null) this.upgradePage = 0;
  }

  create() {
    const W = CONFIG.WIDTH;
    UI.scenicBackground(this, BIOMES[3]);
    this.add.rectangle(0, 0, W, CONFIG.HEIGHT, 0x140d33, 0.66).setOrigin(0);
    this.cameras.main.fadeIn(240, 0, 0, 0);

    this.add.text(W / 2, 38, '🏪  MATH STORE', {
      fontFamily: UI.FONT, fontSize: '32px', color: '#ffd23f', fontStyle: 'bold',
    }).setOrigin(0.5);

    /* currency readouts */
    UI.panel(this, 132, 38, 200, 46, UI.COLORS.panel, { radius: 12 });
    this.add.image(62, 38, 'coin').setScale(0.9);
    this.coinText = this.add.text(86, 38, '', {
      fontFamily: UI.FONT, fontSize: '21px', color: '#ffd23f', fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    UI.panel(this, W - 132, 38, 200, 46, UI.COLORS.panel, { radius: 12 });
    this.add.image(W - 200, 38, 'starcoin').setScale(0.85);
    this.starText = this.add.text(W - 178, 38, '', {
      fontFamily: UI.FONT, fontSize: '21px', color: '#ffcf3f', fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    /* tab bar */
    this.tabBtns = {};
    const tabs = [['coin', '💰 Coin Shop'], ['lab', '🧪 Math Lab'],
                  ['upgrades', '⭐ Star Upgrades']];
    tabs.forEach((t, i) => {
      const x = W / 2 + (i - 1) * 248;
      this.tabBtns[t[0]] = UI.button(this, x, 90, {
        label: t[1], width: 236, height: 50, fontSize: 19,
        color: UI.COLORS.panelLight, onClick: () => this.switchTab(t[0]),
      });
    });

    /* back button */
    UI.button(this, W / 2, CONFIG.HEIGHT - 30, {
      label: '← Back', width: 200, height: 44, fontSize: 19,
      color: UI.COLORS.panelLight,
      onClick: () => { this.scene.start(this.fromScene); },
    });

    this.content = this.add.container(0, 0);
    this.switchTab(this.tab);
  }

  refreshCurrency() {
    this.coinText.setText(String(PlayerState.data.coins));
    this.starText.setText(String(PlayerState.data.mathStars));
  }

  switchTab(tab) {
    this.tab = tab;
    Object.keys(this.tabBtns).forEach((k) => {
      this.tabBtns[k].setButtonColor(k === tab ? UI.COLORS.accent : UI.COLORS.panelLight);
    });
    this.content.removeAll(true);
    this.refreshCurrency();
    if (tab === 'coin') this.showCoinShop();
    else if (tab === 'lab') this.showMathLab();
    else this.showUpgrades();
  }

  /* ---- Tab 1: Coin Shop ------------------------------------------------- */
  showCoinShop() {
    const W = CONFIG.WIDTH;
    this.content.add(UI.text(this, W / 2, 138,
      'Consumables — handy in a fight, never required.', 17, '#cdb8ff'));
    const cardW = 172, gap = 16;
    const startX = W / 2 - (cardW * 5 + gap * 4) / 2 + cardW / 2;
    CONSUMABLES.forEach((item, i) => {
      this.itemCard(startX + i * (cardW + gap), 320, cardW, item, 'consumable');
    });
  }

  /* ---- Tab 2: Math Lab -------------------------------------------------- */
  showMathLab() {
    const W = CONFIG.WIDTH;
    this.content.add(UI.text(this, W / 2, 134,
      'Train your hero to earn ⭐ stars. Wrong answers never cost you anything.',
      17, '#cdb8ff'));

    MATH_TOPICS.forEach((topic, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const x = W / 2 + (col === 0 ? -210 : 210);
      const y = 218 + row * 116;
      this.content.add(UI.panel(this, x, y, 396, 100, UI.COLORS.panel,
        { stroke: topic.color, strokeWidth: 3 }));
      this.content.add(this.add.text(x - 168, y - 26, topic.icon + '  ' + topic.name, {
        fontFamily: UI.FONT, fontSize: '21px', color: '#ffffff', fontStyle: 'bold',
      }).setOrigin(0, 0.5));
      this.content.add(this.add.text(x - 168, y + 6,
        '+' + topic.starsPerCorrect + ' ⭐ per correct', {
        fontFamily: UI.FONT, fontSize: '15px', color: '#cdb8ff',
      }).setOrigin(0, 0.5));
      const hist = PlayerState.data.mathLabStats.topicHistory[topic.id];
      if (hist && hist.attempted) {
        this.content.add(this.add.text(x - 168, y + 30,
          'Solved ' + hist.correct + ' / ' + hist.attempted, {
          fontFamily: UI.FONT, fontSize: '13px', color: '#9d8fce',
        }).setOrigin(0, 0.5));
      }
      this.content.add(UI.button(this, x + 128, y + 18, {
        label: 'Train', width: 110, height: 44, fontSize: 18,
        color: topic.color, textColor: '#1a1330',
        onClick: () => this.startLab(topic, false),
      }));
    });

    /* daily challenge */
    const dq = DailyQuests.refresh();
    const ct = DailyQuests.challengeTopic();
    const y = 462;
    this.content.add(UI.panel(this, W / 2, y, 700, 64, 0x3a2a5a,
      { stroke: UI.COLORS.gold, strokeWidth: 3 }));
    this.content.add(this.add.text(W / 2 - 326, y - 8,
      '⭐ Daily Challenge: ' + ct.name + ' × 10', {
      fontFamily: UI.FONT, fontSize: '19px', color: '#ffcf3f', fontStyle: 'bold',
    }).setOrigin(0, 0.5));
    if (dq.challengeDone) {
      this.content.add(this.add.text(W / 2 + 250, y, '✓ Done today',
        { fontFamily: UI.FONT, fontSize: '18px', color: '#36c98d', fontStyle: 'bold' })
        .setOrigin(0.5));
    } else {
      this.content.add(this.add.text(W / 2 - 326, y + 16,
        'Reward: +50 ⭐ bonus  ·  resets at midnight', {
        fontFamily: UI.FONT, fontSize: '13px', color: '#cdb8ff' }).setOrigin(0, 0.5));
      this.content.add(UI.button(this, W / 2 + 272, y, {
        label: 'Start  →', width: 150, height: 46, fontSize: 18,
        color: UI.COLORS.gold, textColor: '#1a1330',
        onClick: () => this.startLab(ct, true),
      }));
    }
  }

  startLab(topic, isChallenge) {
    this.scene.start('MathLab', { topic: topic, isChallenge: isChallenge });
  }

  /* ---- Tab 3: Star Upgrades -------------------------------------------- */
  showUpgrades() {
    const W = CONFIG.WIDTH;
    const cats = [['weapon', 'Weapons'], ['armor', 'Armour'],
                  ['character', 'Heroes'], ['companion', 'Pets']];
    cats.forEach((c, i) => {
      const x = W / 2 + (i - 1.5) * 168;
      this.content.add(UI.button(this, x, 138, {
        label: c[1], width: 156, height: 42, fontSize: 17,
        color: c[0] === this.upgradeCat ? UI.COLORS.accent : UI.COLORS.panelLight,
        onClick: () => {
          this.upgradeCat = c[0];
          this.upgradePage = 0;
          this.switchTab('upgrades');
        },
      }));
    });

    const lists = { weapon: WEAPONS, armor: ARMOR,
                    character: CHARACTERS, companion: COMPANIONS };
    const list = lists[this.upgradeCat];

    /* paginate: a full row of cards is wider than the screen once a category
       has more than a handful of items (Heroes has twelve) */
    const perPage = 4;
    const pageCount = Math.ceil(list.length / perPage);
    this.upgradePage = Phaser.Math.Clamp(this.upgradePage || 0, 0, pageCount - 1);
    const start = this.upgradePage * perPage;
    const page = list.slice(start, start + perPage);

    const cardW = 176, gap = 14;
    const startX = W / 2 - (cardW * page.length + gap * (page.length - 1)) / 2 + cardW / 2;
    page.forEach((item, i) => {
      this.itemCard(startX + i * (cardW + gap), 340, cardW, item, this.upgradeCat);
    });

    if (pageCount > 1) {
      this.content.add(UI.button(this, 54, 340, {
        label: '‹', width: 56, height: 96, fontSize: 40,
        color: UI.COLORS.panelLight, enabled: this.upgradePage > 0,
        onClick: () => { this.upgradePage--; this.switchTab('upgrades'); },
      }));
      this.content.add(UI.button(this, W - 54, 340, {
        label: '›', width: 56, height: 96, fontSize: 40,
        color: UI.COLORS.panelLight, enabled: this.upgradePage < pageCount - 1,
        onClick: () => { this.upgradePage++; this.switchTab('upgrades'); },
      }));
      this.content.add(this.add.text(W / 2, 172,
        'Page ' + (this.upgradePage + 1) + ' / ' + pageCount, {
        fontFamily: UI.FONT, fontSize: '15px', color: '#cdb8ff', fontStyle: 'bold',
      }).setOrigin(0.5));
    }
  }

  /* ---- shared item card ------------------------------------------------- */
  itemCard(x, y, w, item, kind) {
    const isConsumable = kind === 'consumable';
    const cardH = isConsumable ? 252 : 300;
    const unlockKind = { weapon: 'weapons', armor: 'armor',
                         character: 'characters', companion: 'companions' }[kind];
    const owned = isConsumable ? true : PlayerState.owns(unlockKind, item.id);
    const equipped = !isConsumable && PlayerState.equipped(kind) === item.id;
    const currency = isConsumable ? 'coins' : 'stars';
    const have = isConsumable ? PlayerState.data.coins : PlayerState.data.mathStars;
    const affordable = have >= item.cost;

    const panel = UI.panel(this, x, y, w, cardH, UI.COLORS.panel,
      { radius: 14, stroke: equipped ? UI.COLORS.good : UI.COLORS.panelLight,
        strokeWidth: equipped ? 3 : 2 });
    this.content.add(panel);

    this.content.add(this.add.text(x, y - cardH / 2 + 24, item.name, {
      fontFamily: UI.FONT, fontSize: '17px', color: '#ffffff', fontStyle: 'bold',
      align: 'center', wordWrap: { width: w - 18 },
    }).setOrigin(0.5, 0));

    const isChar = kind === 'character';

    /* hero preview — let the player see who they are buying / equipping */
    if (isChar) {
      const hero = this.add.sprite(x, y - 10, 'hero_idle');
      AnimHelper.initSprite(this, hero, 'characters', item.id, 'hero');
      if (!hero._hasArt) hero.setOrigin(0.5, 0.9).setScale(0.92);
      this.content.add(hero);
    }

    let stat = 'Consumable';
    if (kind === 'weapon')    stat = '⚔ Damage ' + item.damage;
    else if (kind === 'armor')stat = '🛡 Defense ' + item.defense;
    else if (isChar)
      stat = item.bonusHp ? '❤ +' + Math.round(item.bonusHp / 20) + ' heart' : 'Hero';
    else if (kind === 'companion') stat = 'Companion';
    this.content.add(this.add.text(x, isChar ? y + 10 : y - cardH / 2 + 62, stat, {
      fontFamily: UI.FONT, fontSize: '15px', color: '#ffce3a', fontStyle: 'bold',
    }).setOrigin(0.5));

    this.content.add(this.add.text(x, isChar ? y + 30 : y - cardH / 2 + 86, item.desc, {
      fontFamily: UI.FONT, fontSize: '13px', color: '#cdb8ff',
      align: 'center', wordWrap: { width: w - 22 },
    }).setOrigin(0.5, 0));

    if (isConsumable) {
      this.content.add(this.add.text(x, y + cardH / 2 - 74,
        'Owned: ' + PlayerState.consumableQty(item.id), {
        fontFamily: UI.FONT, fontSize: '13px', color: '#9bd0ff', fontStyle: 'bold',
      }).setOrigin(0.5));
    } else {
      this.content.add(this.add.text(x, y + cardH / 2 - 74,
        '⚙ Gear Score +' + item.gearScore, {
        fontFamily: UI.FONT, fontSize: '13px', color: '#9bd0ff', fontStyle: 'bold',
      }).setOrigin(0.5));
    }

    const by = y + cardH / 2 - 36;
    if (equipped) {
      this.content.add(UI.button(this, x, by, { label: '✓ Equipped', width: w - 26,
        height: 44, fontSize: 16, color: UI.COLORS.good, enabled: false }));
    } else if (!isConsumable && owned) {
      this.content.add(UI.button(this, x, by, { label: 'Equip', width: w - 26,
        height: 44, fontSize: 17, color: UI.COLORS.accent,
        onClick: () => this.equipItem(kind, item) }));
    } else if (affordable) {
      const icon = currency === 'coins' ? ' 💰' : ' ⭐';
      this.content.add(UI.button(this, x, by, {
        label: 'Buy  ' + item.cost + icon, width: w - 26, height: 44, fontSize: 16,
        color: UI.COLORS.good,
        onClick: () => this.buyItem(item, kind, unlockKind) }));
    } else {
      this.content.add(UI.button(this, x, by, {
        label: (item.cost - have) + ' more ' + (currency === 'coins' ? '💰' : '⭐'),
        width: w - 26, height: 44, fontSize: 15, color: UI.COLORS.panelLight,
        enabled: false }));
      panel.setAlpha(0.82);
    }
  }

  buyItem(item, kind, unlockKind) {
    if (kind === 'consumable') {
      if (PlayerState.data.coins < item.cost) return;
      PlayerState.spendCoins(item.cost);
      PlayerState.addConsumable(item.id, 1);
    } else {
      if (PlayerState.data.mathStars < item.cost) return;
      PlayerState.spendStars(item.cost);
      PlayerState.unlock(unlockKind, item.id);
      PlayerState.equip(kind, item.id);
    }
    this.switchTab(this.tab);
  }

  equipItem(slot, item) {
    PlayerState.equip(slot, item.id);
    this.switchTab(this.tab);
  }
}
