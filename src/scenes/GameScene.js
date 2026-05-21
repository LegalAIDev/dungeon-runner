/* ============================================================================
   GameScene — the actual running game: the runner, obstacles, coins, power-ups,
   the four worlds, scoring and the pause menu.
   ========================================================================== */

class GameScene extends Phaser.Scene {
  constructor() { super('Game'); }

  create() {
    const W = CONFIG.WIDTH, H = CONFIG.HEIGHT, GY = CONFIG.GROUND_Y;

    /* fresh HUD overlay every run */
    if (this.scene.isActive('Hud')) this.scene.stop('Hud');
    this.scene.launch('Hud');

    /* per-run state (HudScene reads this object every frame) */
    this.stats = computeRunStats();
    this.run = {
      distance: 0, coins: 0,
      lives: CONFIG.BASE_LIVES + Save.owned('heart'),
      maxLives: this.stats.maxLives,
      biomeIndex: 0, biomeName: BIOMES[0].name,
      combo: 0, shield: this.stats.startShield,
      magnetUntil: 0, slowUntil: 0, x2Until: 0,
      over: false,
    };
    this.bestCombo = 0;
    this.paused = false;
    this.worldSpeed = CONFIG.SPEED_START * this.stats.speedMult;
    this.invulnUntil = 0;
    this.jumpsUsed = 0;
    this.maxJumps = this.stats.doubleJump ? 2 : 1;
    this.sliding = false;
    this.wasGrounded = true;
    this.lastCoinTime = -9999;

    this.obstacles = [];
    this.pickups = [];     // coins and gems
    this.powerups = [];
    this.distToObstacle = 520;
    this.distToCoins = 0;
    this.coinsQueued = false;
    this.distToPowerup = Phaser.Math.Between(1700, 2600);

    /* ---- background layers ---- */
    this.sky = this.add.graphics().setDepth(0);
    this.sunGlow = this.add.image(W - 175, 120, 'glow').setScale(2.7).setDepth(1).setAlpha(0.85);
    this.sunDisc = this.add.circle(W - 175, 120, 42, 0xffffff, 1).setDepth(1);
    this.stars = this.add.container(0, 0).setDepth(1);
    for (let i = 0; i < 55; i++) {
      this.stars.add(this.add.image(Math.random() * W, Math.random() * GY * 0.8, 'star')
        .setAlpha(0.25 + Math.random() * 0.6).setScale(0.4 + Math.random()));
    }
    this.hillFar = this.add.tileSprite(W / 2, GY + 8, W, 220, 'hillfar_meadow')
      .setOrigin(0.5, 1).setDepth(2).setAlpha(0.9);
    this.clouds = [];
    for (let i = 0; i < 5; i++) {
      this.clouds.push(this.add.image(Math.random() * W, 40 + Math.random() * 150, 'cloud')
        .setScale(0.45 + Math.random() * 0.6).setAlpha(0.85).setDepth(2));
    }
    this.hillNear = this.add.tileSprite(W / 2, GY + 24, W, 250, 'hillnear_meadow')
      .setOrigin(0.5, 1).setDepth(3);
    this.groundTile = this.add.tileSprite(W / 2, GY, W, H - GY + 6, 'ground_meadow')
      .setOrigin(0.5, 0).setDepth(4);

    /* ---- the runner ---- */
    this.player = this.physics.add.sprite(CONFIG.PLAYER_X, GY, 'hero_run0')
      .setOrigin(0.5, 1).setDepth(12);
    this.player.body.setSize(32, 56).setOffset(20, 24);
    this.player.play('run');

    const ground = this.add.rectangle(W / 2, GY + 220, W + 600, 440, 0, 0);
    this.physics.add.existing(ground, true);
    this.physics.add.collider(this.player, ground);

    /* shield bubble that follows the runner */
    this.shieldFx = this.add.image(this.player.x, GY - 30, 'glow')
      .setTint(0x6fb0ff).setScale(1.0).setDepth(13).setVisible(this.run.shield);

    /* ---- particle emitters (reused for every burst) ---- */
    this.coinBurst = this.makeEmitter('spark', 0xffd23f);
    this.gemBurst  = this.makeEmitter('spark', 0x46e0d0);
    this.starBurst = this.makeEmitter('spark', 0xffffff);
    this.hitBurst  = this.makeEmitter('bit', 0xff6a3c);
    this.dust      = this.makeEmitter('bit', 0xe9e2ff);

    /* ---- input ---- */
    this.input.keyboard.on('keydown-SPACE', () => this.jump());
    this.input.keyboard.on('keydown-UP', () => this.jump());
    this.input.keyboard.on('keydown-W', () => this.jump());
    this.input.keyboard.on('keydown-DOWN', () => this.setSlide(true));
    this.input.keyboard.on('keyup-DOWN', () => this.setSlide(false));
    this.input.keyboard.on('keydown-S', () => this.setSlide(true));
    this.input.keyboard.on('keyup-S', () => this.setSlide(false));
    this.input.keyboard.on('keydown-P', () => this.togglePause());
    this.input.keyboard.on('keydown-ESC', () => this.togglePause());

    this.applyBiome(0);
    this.cameras.main.fadeIn(300, 0, 0, 0);

    this.events.once('shutdown', () => { this.input.keyboard.removeAllListeners(); });
  }

  makeEmitter(texture, tint) {
    return this.add.particles(0, 0, texture, {
      speed: { min: 60, max: 230 },
      angle: { min: 0, max: 360 },
      lifespan: { min: 320, max: 620 },
      scale: { start: 1.05, end: 0 },
      alpha: { start: 1, end: 0 },
      tint: tint,
      emitting: false,
    }).setDepth(15);
  }

  /* =====================  controls  ====================================== */
  jump() {
    if (this.paused || this.run.over) return;
    const grounded = this.player.y >= CONFIG.GROUND_Y - 1.5;
    if (grounded) {
      this.player.body.setVelocityY(-CONFIG.JUMP_VELOCITY * this.stats.jumpMult);
      this.jumpsUsed = 1;
      SFX.jump();
      this.dust.explode(8, this.player.x, CONFIG.GROUND_Y);
    } else if (this.jumpsUsed < this.maxJumps) {
      this.player.body.setVelocityY(-CONFIG.DOUBLE_JUMP_VELOCITY * this.stats.jumpMult);
      this.jumpsUsed++;
      SFX.doubleJump();
      this.starBurst.explode(12, this.player.x, this.player.y - 24);
    }
  }

  setSlide(on) {
    if (this.paused || this.run.over) return;
    if (on === this.sliding) return;
    this.sliding = on;
    if (on) this.player.body.setSize(46, 30).setOffset(13, 50);
    else this.player.body.setSize(32, 56).setOffset(20, 24);
  }

  togglePause() {
    if (this.run.over) return;
    if (this.paused) {
      this.paused = false;
      this.physics.resume();
      this.player.anims.resume();
      /* the scene clock kept running while paused — shift timers forward so
         power-ups and invulnerability do not lose time */
      const dp = this.time.now - this.pauseStart;
      this.run.magnetUntil += dp;
      this.run.slowUntil += dp;
      this.run.x2Until += dp;
      this.invulnUntil += dp;
      this.lastCoinTime += dp;
      const hud = this.scene.get('Hud');
      if (hud && hud.setPauseOverlay) hud.setPauseOverlay(false);
    } else {
      this.paused = true;
      this.pauseStart = this.time.now;
      this.physics.pause();
      this.player.anims.pause();
      const hud2 = this.scene.get('Hud');
      if (hud2 && hud2.setPauseOverlay) hud2.setPauseOverlay(true);
    }
  }

  /* =====================  the worlds  ==================================== */
  applyBiome(i) {
    const b = BIOMES[i];
    const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;
    this.sky.clear();
    this.sky.fillGradientStyle(b.skyTop, b.skyTop, b.skyBottom, b.skyBottom, 1);
    this.sky.fillRect(0, 0, W, H);
    this.sunDisc.setFillStyle(b.sun, 1);
    this.sunGlow.setTint(b.sun);
    this.stars.setVisible(!!b.night);
    this.hillFar.setTexture('hillfar_' + b.key);
    this.hillNear.setTexture('hillnear_' + b.key);
    this.groundTile.setTexture('ground_' + b.key);
    this.clouds.forEach((c) => c.setTint(b.night ? 0x70609e : 0xffffff));
  }

  onBiomeChange() {
    const b = BIOMES[this.run.biomeIndex];
    this.run.biomeName = b.name;
    this.applyBiome(this.run.biomeIndex);
    this.cameras.main.flash(360, 255, 255, 255);
    this.starBurst.explode(34, CONFIG.PLAYER_X, CONFIG.GROUND_Y - 60);
    SFX.levelUp();
    const hud = this.scene.get('Hud');
    if (hud && hud.showBanner) hud.showBanner('World ' + (this.run.biomeIndex + 1), b.name);
  }

  /* =====================  spawning  ====================================== */
  spawnObstacle() {
    const W = CONFIG.WIDTH, GY = CONFIG.GROUND_Y, x = W + 90;
    const type = Phaser.Utils.Array.GetRandom(
      ['spike', 'spike', 'lava', 'saw', 'saw', 'drone']);
    let spr;
    if (type === 'spike') {
      spr = this.add.image(x, GY + 2, 'spike').setOrigin(0.5, 1);
    } else if (type === 'lava') {
      spr = this.add.image(x, GY + 6, 'lava').setOrigin(0.5, 1);
    } else if (type === 'saw') {
      spr = this.add.image(x, GY - 66, 'saw');
    } else {
      spr = this.add.image(x, GY - 60, 'drone');
      spr.baseY = GY - 60;
      spr.phase = Math.random() * Math.PI * 2;
    }
    spr.setDepth(10);
    spr.htype = type;
    spr.spent = false;
    this.obstacles.push(spr);

    const gapSec = Phaser.Math.FloatBetween(1.05, 1.7) * (1 - this.run.biomeIndex * 0.07);
    const gap = Math.max(0.62, gapSec) * this.worldSpeed;
    this.distToObstacle = gap;
    this.distToCoins = gap * Phaser.Math.FloatBetween(0.42, 0.58);
    this.coinsQueued = true;
  }

  spawnCoinPattern() {
    const W = CONFIG.WIDTH, GY = CONFIG.GROUND_Y;
    const n = Phaser.Math.Between(4, 6);
    const gap = 46;
    const arc = Math.random() < 0.5;
    const gemAt = Math.random() < 0.16 ? Phaser.Math.Between(0, n - 1) : -1;
    for (let i = 0; i < n; i++) {
      const x = W + 70 + i * gap;
      let y;
      if (arc) {
        const t = n > 1 ? i / (n - 1) : 0.5;
        y = GY - 46 - Math.sin(t * Math.PI) * 132;
      } else {
        y = GY - 52 - Math.random() * 22;
      }
      const isGem = i === gemAt;
      const c = this.add.image(x, y, isGem ? 'gem' : 'coin').setDepth(10);
      c.isGem = isGem;
      this.tweens.add({ targets: c, scaleX: 0.82, scaleY: 1.12,
        duration: 420, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      this.pickups.push(c);
    }
  }

  spawnPowerup() {
    const W = CONFIG.WIDTH, GY = CONFIG.GROUND_Y;
    const type = Phaser.Utils.Array.GetRandom(['shield', 'magnet', 'slow', 'x2', 'heart']);
    const y = GY - 90 - Math.random() * 80;
    const c = this.add.container(W + 80, y).setDepth(11);
    const halo = this.add.image(0, 0, 'glow').setScale(1.2).setAlpha(0.55);
    const icon = this.add.image(0, 0, 'pu_' + type);
    c.add([halo, icon]);
    c.putype = type;
    c.halo = halo;
    this.tweens.add({ targets: c, y: y - 16, duration: 900,
      yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    this.tweens.add({ targets: halo, scale: 1.5, alpha: 0.2,
      duration: 700, yoyo: true, repeat: -1 });
    this.powerups.push(c);
  }

  /* =====================  the main loop  ================================= */
  update(time, delta) {
    if (this.paused || this.run.over) return;
    const dt = Math.min(delta, 50) / 1000;     // clamp so a lag spike can't skip
    const GY = CONFIG.GROUND_Y;

    /* speed and distance */
    this.worldSpeed = Math.min(CONFIG.SPEED_MAX,
      this.worldSpeed + CONFIG.SPEED_ACCEL * this.stats.speedMult * dt);
    const slow = time < this.run.slowUntil ? 0.55 : 1;
    const eff = this.worldSpeed * slow;
    const moved = eff * dt;
    this.run.distance += moved * CONFIG.METERS_PER_PX;

    /* biome progress */
    while (this.run.biomeIndex < BIOMES.length - 1 &&
           this.run.distance >= BIOMES[this.run.biomeIndex + 1].startMeters) {
      this.run.biomeIndex++;
      this.onBiomeChange();
    }

    /* scrolling background */
    this.hillFar.tilePositionX += moved * 0.18;
    this.hillNear.tilePositionX += moved * 0.42;
    this.groundTile.tilePositionX += moved;
    this.clouds.forEach((c) => {
      c.x -= moved * 0.12;
      if (c.x < -110) { c.x = CONFIG.WIDTH + 110; c.y = 40 + Math.random() * 150; }
    });

    /* spawning */
    this.distToObstacle -= moved;
    if (this.distToObstacle <= 0) this.spawnObstacle();
    if (this.coinsQueued) {
      this.distToCoins -= moved;
      if (this.distToCoins <= 0) { this.spawnCoinPattern(); this.coinsQueued = false; }
    }
    this.distToPowerup -= moved;
    if (this.distToPowerup <= 0) {
      this.spawnPowerup();
      this.distToPowerup = Phaser.Math.Between(2200, 3500);
    }

    /* runner state */
    const grounded = this.player.y >= GY - 1.5;
    if (grounded) {
      this.jumpsUsed = 0;
      if (!this.wasGrounded) { this.dust.explode(10, this.player.x, GY); SFX.land(); }
    }
    this.wasGrounded = grounded;
    this.updatePlayerVisual(time);
    this.shieldFx.setPosition(this.player.x, this.player.y - 28).setVisible(this.run.shield);
    if (this.run.shield) this.shieldFx.rotation += dt * 1.5;

    /* move + check obstacles */
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const o = this.obstacles[i];
      o.x -= moved;
      if (o.htype === 'saw') o.rotation += dt * 13 * slow;
      if (o.htype === 'drone') o.y = o.baseY + Math.sin(time * 0.005 + o.phase) * 7;
      if (o.x < -130) { o.destroy(); this.obstacles.splice(i, 1); continue; }
      /* invulnerability is re-checked live so one frame cannot cost two lives */
      if (!o.spent && time >= this.invulnUntil && !this.run.over && this.hitsPlayer(o)) {
        o.spent = true;
        this.takeHit();
        if (this.run.over) return;
      }
    }

    /* move + collect pickups */
    const pcx = this.player.x, pcy = this.player.y - 28;
    const magnet = time < this.run.magnetUntil ? 250 : this.stats.magnetRange;
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const c = this.pickups[i];
      c.x -= moved;
      if (magnet > 0) {
        const d = Phaser.Math.Distance.Between(c.x, c.y, pcx, pcy);
        if (d < magnet) {
          c.x += (pcx - c.x) * 0.16;
          c.y += (pcy - c.y) * 0.16;
        }
      }
      if (c.x < -40) {
        this.tweens.killTweensOf(c); c.destroy(); this.pickups.splice(i, 1); continue;
      }
      if (Phaser.Math.Distance.Between(c.x, c.y, pcx, pcy) < 34) {
        this.collectCoin(c);
        this.pickups.splice(i, 1);
      }
    }

    /* move + collect power-ups */
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const c = this.powerups[i];
      c.x -= moved;
      if (c.x < -60) { this.removePowerup(i); continue; }
      if (Phaser.Math.Distance.Between(c.x, c.y, pcx, pcy) < 44) {
        this.activatePowerup(c.putype, c.x, c.y);
        this.removePowerup(i);
      }
    }
  }

  removePowerup(i) {
    const c = this.powerups[i];
    this.tweens.killTweensOf(c);
    if (c.halo) this.tweens.killTweensOf(c.halo);
    c.destroy();
    this.powerups.splice(i, 1);
  }

  updatePlayerVisual(time) {
    const p = this.player;
    p.setAlpha(time < this.invulnUntil ? 0.45 + 0.4 * Math.abs(Math.sin(time * 0.025)) : 1);
    const grounded = p.y >= CONFIG.GROUND_Y - 1.5;
    if (this.sliding) {
      if (p.anims.isPlaying) p.anims.stop();
      if (p.texture.key !== 'hero_slide') p.setTexture('hero_slide');
    } else if (!grounded) {
      if (p.anims.isPlaying) p.anims.stop();
      const key = p.body.velocity.y < 0 ? 'hero_jump' : 'hero_fall';
      if (p.texture.key !== key) p.setTexture(key);
    } else if (!p.anims.isPlaying) {
      p.play('run');
    }
  }

  /* hazard rectangle for an obstacle, then overlap test against the runner */
  hitsPlayer(o) {
    const GY = CONFIG.GROUND_Y;
    let cx = o.x, cy, hw, hh;
    if (o.htype === 'spike')      { hw = 21; hh = 22; cy = GY - 22; }
    else if (o.htype === 'lava') { hw = 56; hh = 9;  cy = GY - 9; }
    else if (o.htype === 'saw')  { hw = 23; hh = 22; cy = GY - 66; }
    else                          { hw = 23; hh = 19; cy = o.y; }
    const b = this.player.body;
    return (cx - hw < b.right && cx + hw > b.left &&
            cy - hh < b.bottom && cy + hh > b.top);
  }

  /* =====================  outcomes  ====================================== */
  takeHit() {
    if (this.run.shield) {
      this.run.shield = false;
      this.invulnUntil = this.time.now + 900;
      SFX.shieldPop();
      this.starBurst.explode(20, this.player.x, this.player.y - 28);
      this.cameras.main.shake(160, 0.008);
      this.popText(this.player.x, this.player.y - 80, 'Shield!', '#6fb0ff', 22);
      return;
    }
    this.run.lives--;
    this.run.combo = 0;
    this.invulnUntil = this.time.now + CONFIG.INVULN_MS;
    SFX.hit();
    this.hitBurst.explode(18, this.player.x, this.player.y - 30);
    this.cameras.main.shake(260, 0.015);
    this.cameras.main.flash(150, 150, 30, 40);
    const hud = this.scene.get('Hud');
    if (hud && hud.onDamage) hud.onDamage();
    if (this.run.lives <= 0) this.gameOver();
  }

  collectCoin(c) {
    const now = this.time.now;
    this.run.combo = (now - this.lastCoinTime < 1500) ? this.run.combo + 1 : 1;
    this.lastCoinTime = now;
    this.bestCombo = Math.max(this.bestCombo, this.run.combo);
    const comboBonus = Math.floor(this.run.combo / 5);
    const base = c.isGem ? CONFIG.GEM_VALUE : CONFIG.COIN_VALUE;
    const x2 = now < this.run.x2Until ? 2 : 1;
    const gain = (base + comboBonus + this.stats.coinBonus) * x2;
    this.run.coins += gain;
    Save.addCoins(gain);   /* bank coins right away so the shop can use them */
    if (c.isGem) { SFX.gem(); this.gemBurst.explode(16, c.x, c.y); }
    else { SFX.coin(); this.coinBurst.explode(9, c.x, c.y); }
    this.popText(c.x, c.y - 12, '+' + gain, c.isGem ? '#7ff0e6' : '#ffe27a',
      c.isGem ? 24 : 19);
    this.tweens.killTweensOf(c);
    c.destroy();
  }

  activatePowerup(type, x, y) {
    SFX.power();
    this.coinBurst.explode(14, x, y);
    const now = this.time.now;
    let label = '';
    if (type === 'shield')      { this.run.shield = true; label = 'Shield up!'; }
    else if (type === 'magnet') { this.run.magnetUntil = now + 8000; label = 'Magnet!'; }
    else if (type === 'slow')   { this.run.slowUntil = now + 6000; label = 'Slow-mo!'; }
    else if (type === 'x2')     { this.run.x2Until = now + 10000; label = 'Double coins!'; }
    else { /* heart */
      this.run.lives = Math.min(this.run.maxLives, this.run.lives + 1);
      label = 'Extra life!';
    }
    this.popText(this.player.x, this.player.y - 86, label, '#ffffff', 22);
  }

  gameOver() {
    if (this.run.over) return;
    this.run.over = true;
    this.sliding = false;
    this.player.anims.stop();
    this.player.setTexture('hero_hurt');
    this.player.body.setVelocity(0, -540);
    this.hitBurst.explode(26, this.player.x, this.player.y - 30);
    this.cameras.main.shake(340, 0.022);
    SFX.gameOver();

    const dist = Math.floor(this.run.distance);
    const newBest = dist > Save.data.highScore;   /* check before recordRun updates it */
    Save.recordRun(dist, this.run.biomeIndex);
    this.registry.set('lastRun', {
      distance: dist, coins: this.run.coins,
      biome: this.run.biomeName, bestCombo: this.bestCombo,
      newBest: newBest, biomeIndex: this.run.biomeIndex,
    });

    this.time.delayedCall(1150, () => {
      this.cameras.main.fadeOut(280, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.stop('Hud');
        this.scene.start('GameOver');
      });
    });
  }

  popText(x, y, str, color, size) {
    const t = this.add.text(x, y, str, {
      fontFamily: UI.FONT, fontSize: (size || 20) + 'px', color: color || '#ffffff',
      fontStyle: 'bold', stroke: '#241f44', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(20);
    this.tweens.add({ targets: t, y: y - 48, alpha: 0, duration: 760,
      ease: 'Cubic.out', onComplete: () => t.destroy() });
  }

  /* the game stays paused; the Shop (drawn by ShopScene) covers everything */
  openShopFromPause() {
    this.scene.launch('Shop', { from: 'Game' });
    this.scene.bringToTop('Shop');
  }
}
