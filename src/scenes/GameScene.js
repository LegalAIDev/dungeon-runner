/* ============================================================================
   GameScene — pure-action side-scrolling combat. No math here: the player wins
   or loses on action skill and gear quality alone.
   ========================================================================== */

class GameScene extends Phaser.Scene {
  constructor() { super('Game'); }

  init(data) {
    this.worldId    = data.worldId || 'forest';
    this.levelIndex = data.levelIndex || 0;
  }

  create() {
    this.world      = findItem(WORLDS, this.worldId);
    this.worldIndex = WORLDS.indexOf(this.world);
    this.biome      = BIOMES[this.world.biome];
    this.isBossLevel = this.levelIndex === LEVELS_PER_WORLD - 1;

    /* gear loadout */
    this.weapon    = PlayerState.equippedWeapon();
    this.armor     = PlayerState.equippedArmor();
    this.character = PlayerState.equippedCharacter();
    this.companion = PlayerState.equippedCompanion();

    /* run state */
    this.clock = 0;                 // game time in ms (pauses with the game)
    this.freezeUntil = 0;           // hit-stop end time
    this.paused = false;
    this.finished = false;
    this.runCoins = 0;
    this.combo = 0;
    this.killCount = 0;
    this.tookDamageLevel = false;
    this.waveDamageless = true;
    this.enemies = [];
    this.projectiles = [];
    this.coinPickups = [];
    this.waveClearing = false;
    this.enemiesToSpawn = 0;
    this.usedRevive = false;
    this.speedBoostUntil = 0;
    this.magnetUntil = 0;
    this.shieldCharges = 0;
    this.boss = null;

    /* scenery */
    this.bg = UI.scenicBackground(this, this.biome);
    this.cameras.main.fadeIn(280, 0, 0, 0);

    this.createPlayer();
    this.buildWaveQueue();
    this.setupInput();
    this.buildConsumableSlots();

    /* traversable level: the camera follows the player through a long stage */
    this.waveAnchorX = CONFIG.WAVE_FIRST_X;
    this.levelLength = CONFIG.WAVE_FIRST_X +
      (this.waves.length - 1) * CONFIG.WAVE_SPACING + CONFIG.WIDTH;
    const cam = this.cameras.main;
    cam.setBounds(0, 0, this.levelLength, CONFIG.HEIGHT);
    cam.startFollow(this.player, true, 0.12, 1);
    cam.setFollowOffset(-CONFIG.CAMERA_OFFSET, 0);

    /* companion: Wise Owl grants a shield each level */
    if (this.companion && this.companion.id === 'owl') this.shieldCharges += 1;

    this.scene.launch('Hud', { game: this });
    this.scene.bringToTop('Hud');

    this.waveIndex = -1;
    this.time.delayedCall(700, () => this.nextWave());

    this.events.once('shutdown', () => {
      this.input.keyboard.removeAllListeners();
      if (this.scene.isActive('Hud')) this.scene.stop('Hud');
    });
  }

  /* ---- setup ------------------------------------------------------------ */
  createPlayer() {
    const tints = { fighter: 0xffffff, ninja: 0x8186b8, wizard: 0xc79ff0,
                    knight: 0xcfd6ff, archer: 0xa9e6b8 };
    const p = this.add.sprite(250, CONFIG.GROUND_Y, 'hero_idle').setOrigin(0.5, 1);
    AnimHelper.initSprite(this, p, 'characters', this.character.id, 'hero');
    if (!p._hasArt) p.setTint(tints[this.character.id] || 0xffffff);
    p.shadow = this.add.image(250, CONFIG.GROUND_Y + 2, 'shadowblob')
      .setOrigin(0.5).setScale(0.85).setDepth(1);

    p.maxHp = 100 + (this.character.bonusHp || 0);
    p.hp = p.maxHp;
    p.facing = 1;
    p.vy = 0;
    p.onGround = true;
    p.pose = 'idle';
    p.attack = null;                 // { type, start, hitDone }
    p.kbVx = 0;
    p.hurtUntil = 0;
    p.invulnUntil = 0;
    p.dodgeUntil = 0;
    p.dodgeDir = 1;
    p.frozenUntil = 0;
    p.attackCooldownUntil = 0;
    this.player = p;
  }

  buildWaveQueue() {
    this.waves = EnemyFactory.buildWaves(this.world, this.worldIndex, this.levelIndex);
  }

  setupInput() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('Z,X,ESC,ONE,TWO,THREE');
    this.input.keyboard.on('keydown-ESC', () => this.togglePause());
  }

  buildConsumableSlots() {
    const owned = PlayerState.data.inventory.consumables;
    this.consumableSlots = [];
    CONSUMABLES.forEach((c) => {
      if (this.consumableSlots.length < 3 && (owned[c.id] || 0) > 0) {
        this.consumableSlots.push(c.id);
      }
    });
  }

  /* ---- waves ------------------------------------------------------------ */
  nextWave() {
    if (this.finished) return;
    this.waveIndex++;
    if (this.waveIndex >= this.waves.length) { this.levelComplete(); return; }

    this.waveDamageless = true;
    /* Dragon Scale auto-blocks the first hit of each wave */
    if (this.armor.autoBlock) this.shieldCharges = Math.max(this.shieldCharges, 1);

    const wave = this.waves[this.waveIndex];
    const anchorX = this.waveAnchorX;
    this.waveAnchorX += CONFIG.WAVE_SPACING;
    if (wave.boss) {
      this.enemiesToSpawn = 0;
      this.spawnBoss(wave.boss, anchorX);
    } else {
      this.enemiesToSpawn = wave.length;
      wave.forEach((typeKey, i) => {
        this.time.delayedCall(i * 360, () => {
          this.enemiesToSpawn--;
          if (!this.finished) this.spawnEnemy(typeKey, anchorX + i * 64);
        });
      });
    }
    this.flashBanner(wave.boss ? 'BOSS FIGHT!'
      : 'WAVE ' + (this.waveIndex + 1) + ' / ' + this.waves.length);
  }

  spawnEnemy(typeKey, x) {
    const cfg = EnemyFactory.make(typeKey, this.worldIndex, this.levelIndex);
    return this.addEnemySprite(cfg, x, 'foe_' + typeKey);
  }

  spawnBoss(bossKey, x) {
    const cfg = EnemyFactory.makeBoss(bossKey, this.worldIndex);
    const e = this.addEnemySprite(cfg, x, 'boss_' + bossKey);
    e.phase = 1;
    e.spawnedAdds = false;
    e.enraged = false;
    this.boss = e;
  }

  addEnemySprite(cfg, x, texture) {
    const e = this.add.sprite(x, CONFIG.GROUND_Y, texture).setOrigin(0.5, 1);
    e.cfg = cfg;
    e.baseTexture = texture;
    e.hp = cfg.hp; e.maxHp = cfg.maxHp;
    e.dmg = cfg.damage;
    e.speed = cfg.speed;
    e.range = cfg.range;
    e.behaviour = cfg.behaviour;
    e.facing = -1;
    e.state = 'idle';
    e.stateAt = this.clock;
    e.struck = false;
    e.staggerDur = 200;
    e.staggerImmuneUntil = 0;
    e.attackReadyAt = this.clock + 600;
    e.kbVx = 0;
    e.frozenUntil = 0;
    e.guardBroken = false;
    e.enraged = false;
    e.alive = true;
    e.isBoss = !!cfg.isBoss;
    AnimHelper.initSprite(this, e, e.isBoss ? 'bosses' : 'enemies', cfg.key, texture);
    e.shadow = this.add.image(x, CONFIG.GROUND_Y + 2, 'shadowblob')
      .setOrigin(0.5).setScale(e.isBoss ? 1.7 : 0.9).setDepth(1);
    if (!e.isBoss) {
      e.hpBg = this.add.rectangle(x, 0, 46, 7, 0x000000, 0.6).setOrigin(0.5).setDepth(550);
      e.hpFg = this.add.rectangle(x, 0, 44, 5, 0xe0566b).setOrigin(0, 0.5).setDepth(551);
      e.hpBg.setVisible(false); e.hpFg.setVisible(false);
    }
    this.enemies.push(e);
    return e;
  }

  /* ---- main loop -------------------------------------------------------- */
  update(time, delta) {
    if (this.paused || this.finished) return;

    const dt = Math.min(delta / 1000, 0.04);
    this.clock += dt * 1000;
    const now = this.clock;

    if (now < this.freezeUntil) return;                 // hit-stop

    this.scrollBackground(dt);
    this.updatePlayer(dt, now);
    this.enemies.forEach((e) => { if (e.alive) this.updateEnemy(e, dt, now); });
    this.updateProjectiles(dt);
    this.updateCoins(dt, now);
    this.cullEnemies();

    if (!this.finished && !this.waveClearing && this.waveIndex >= 0 &&
        this.enemies.length === 0 && this.enemiesToSpawn <= 0) {
      this.onWaveCleared();
    }
  }

  scrollBackground(dt) {
    const sx = this.cameras.main.scrollX;
    this.bg.hillFar.tilePositionX  = sx * 0.15;
    this.bg.hillNear.tilePositionX = sx * 0.35;
    this.bg.ground.tilePositionX   = sx;
    this.bg.clouds.forEach((cl) => {
      cl.x -= 7 * dt;
      if (cl.x < -100) cl.x = CONFIG.WIDTH + 100;
    });
  }

  /* ---- player ----------------------------------------------------------- */
  updatePlayer(dt, now) {
    const p = this.player;
    const frozen = now < p.frozenUntil;
    const hurt = now < p.hurtUntil;
    const dodging = now < p.dodgeUntil;

    if (!hurt && !frozen) this.handleInput(now, dodging);

    /* horizontal motion */
    let speed = CONFIG.PLAYER_SPEED;
    if (now < this.speedBoostUntil) speed *= 1.5;
    if (dodging) {
      p.x += p.dodgeDir * 460 * dt;
    } else if (hurt) {
      p.x += p.kbVx * dt;
      p.kbVx *= 0.86;
    } else if (!frozen && !p.attack) {
      let mx = 0;
      if (this.cursors.left.isDown)  mx -= 1;
      if (this.cursors.right.isDown) mx += 1;
      p.x += mx * speed * dt;
      if (mx !== 0) p.facing = mx;
    }
    p.x = Phaser.Math.Clamp(p.x, CONFIG.ARENA_LEFT,
                            this.levelLength - CONFIG.ARENA_LEFT);

    /* vertical motion (jump arc) */
    if (!p.onGround) {
      p.vy += CONFIG.GRAVITY * dt;
      p.y += p.vy * dt;
      if (p.y >= CONFIG.GROUND_Y) {
        p.y = CONFIG.GROUND_Y;
        p.onGround = true;
        p.vy = 0;
        SFX.land();
      }
    }

    /* resolve an in-progress attack */
    if (p.attack) {
      const a = p.attack;
      const hitFrame = a.type === 'heavy' ? 200 : 110;
      const dur = a.type === 'heavy'
        ? 440 * (1 - (this.character.heavySpeed || 0)) : 280;
      if (!a.hitDone && now - a.start >= hitFrame) {
        a.hitDone = true;
        this.performAttack(a.type);
      }
      if (now - a.start >= dur) p.attack = null;
    }

    this.setPlayerPose(now, hurt, dodging);
    p.shadow.x = p.x;
    p.shadow.setAlpha(p.onGround ? 0.5 : 0.25);
    p.setDepth(p.y);
    p.setFlipX(p.facing < 0);

    if (Phaser.Input.Keyboard.JustDown(this.keys.ONE))   this.useConsumable(0);
    if (Phaser.Input.Keyboard.JustDown(this.keys.TWO))   this.useConsumable(1);
    if (Phaser.Input.Keyboard.JustDown(this.keys.THREE)) this.useConsumable(2);
  }

  handleInput(now, dodging) {
    const p = this.player;
    if ((Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
         Phaser.Input.Keyboard.JustDown(this.cursors.space)) &&
        p.onGround && !p.attack) {
      p.onGround = false;
      p.vy = -CONFIG.JUMP_VELOCITY;
      SFX.jump();
    }
    if (Phaser.Input.Keyboard.JustDown(this.cursors.down) &&
        !dodging && p.onGround && now > p.dodgeUntil + 250 && !p.attack) {
      this.startDodge(now);
    }
    if (!p.attack && p.onGround && now > p.attackCooldownUntil) {
      if (Phaser.Input.Keyboard.JustDown(this.keys.Z)) this.startAttack('light', now);
      else if (Phaser.Input.Keyboard.JustDown(this.keys.X)) this.startAttack('heavy', now);
    }
  }

  startAttack(type, now) {
    const p = this.player;
    p.attack = { type: type, start: now, hitDone: false };
    p.attackCooldownUntil = now + (type === 'heavy' ? 520 : 320);
    SFX.swing();
  }

  startDodge(now) {
    const p = this.player;
    let dir = p.facing;
    if (this.cursors.left.isDown)  dir = -1;
    if (this.cursors.right.isDown) dir = 1;
    p.dodgeDir = dir;
    p.dodgeUntil = now + 360;
    p.invulnUntil = now + 400;
    SFX.land();
  }

  setPlayerPose(now, hurt, dodging) {
    const p = this.player;
    let pose = 'idle';
    if (hurt) pose = 'hurt';
    else if (dodging) pose = 'dodge';
    else if (!p.onGround) pose = 'jump';
    else if (p.attack) pose = 'attack';
    else if (this.cursors.left.isDown || this.cursors.right.isDown) pose = 'walk';

    if (pose !== p.pose) {
      p.pose = pose;
      AnimHelper.playState(p, pose);
    }
    p.setAlpha(now < p.invulnUntil && !dodging ? 0.6 : 1);
  }

  /* ---- player attacks --------------------------------------------------- */
  performAttack(type) {
    const p = this.player;
    let dmg = this.weapon.damage * (type === 'heavy' ? 1.7 : 1) + this.worldIndex;
    let crit = false;
    if (this.character.crit && Math.random() < this.character.crit) {
      dmg *= 1.7; crit = true;
    }

    const ranged = this.weapon.ranged || this.character.alwaysRanged;
    const fx = p.x + p.facing * 52;
    const slash = this.add.image(fx, p.y - 48, 'slash')
      .setFlipX(p.facing < 0).setDepth(p.y + 1)
      .setScale(type === 'heavy' ? 1.25 : 0.95)
      .setTint(this.weaponTint());
    this.tweens.add({ targets: slash, alpha: 0, scaleX: slash.scaleX * 1.3,
      duration: 170, onComplete: () => slash.destroy() });

    if (ranged) { this.spawnProjectile(dmg, type, crit); return; }

    const range = this.weapon.range * (type === 'heavy' ? 1.3 : 1) + 24;
    const maxTargets = this.weapon.aoe || (type === 'heavy' ? 2 : 1);
    const inFront = this.enemies
      .filter((e) => e.alive)
      .map((e) => ({ e: e, gap: (e.x - p.x) * p.facing }))
      .filter((o) => o.gap >= -26 && o.gap <= range)
      .sort((a, b) => a.gap - b.gap);
    if (inFront.length === 0) return;
    inFront.slice(0, maxTargets).forEach((o) => this.damageEnemy(o.e, dmg, type, crit));
  }

  weaponTint() {
    return { wood_sword: 0xffffff, iron_sword: 0xdfe6f5, fire_axe: 0xff8a3c,
             magic_staff: 0x9bd0ff, dragon_blade: 0xff5fae }[this.weapon.id] || 0xffffff;
  }

  spawnProjectile(dmg, type, crit) {
    const p = this.player;
    const b = this.add.image(p.x + p.facing * 40, p.y - 50, 'bolt')
      .setTint(this.weaponTint()).setDepth(p.y + 1)
      .setScale(type === 'heavy' ? 1.4 : 1);
    b.vx = p.facing * 620;
    b.dmg = dmg;
    b.crit = crit;
    b.fromPlayer = true;
    b.pierce = this.weapon.pierces;
    b.hitSet = [];
    this.projectiles.push(b);
  }

  damageEnemy(e, dmg, type, crit) {
    if (!e.alive) return;
    if (e.behaviour === 'guard' && type === 'light' && !this.weapon.pierces &&
        !e.guardBroken) {
      dmg *= 0.18;
      this.floatText(e.x, e.y - e.displayHeight - 6, 'GUARD', '#9bd0ff', 18);
    } else if (e.behaviour === 'guard' && type === 'heavy') {
      e.guardBroken = true;
    }
    dmg = Math.max(1, Math.round(dmg));
    e.hp -= dmg;
    this.floatText(e.x + Phaser.Math.Between(-10, 10), e.y - e.displayHeight * 0.7,
      (crit ? '★' : '') + dmg, crit ? '#ffce3a' : '#ffffff', crit ? 26 : 21);
    this.hitSpark(e.x, e.y - e.displayHeight * 0.5);
    this.doHitStop();

    /* Light attacks only flinch (visual) — the enemy keeps advancing.
       Heavy attacks knock back + stagger, but a post-stagger immunity
       window stops chained heavies from perma-locking an enemy. */
    const now = this.clock;
    if (type === 'heavy' && !e.isBoss && now >= e.staggerImmuneUntil) {
      e.kbVx = this.player.facing * 240;
      e.state = 'stagger';
      e.stateAt = now;
      e.staggerDur = 320;
      e.staggerImmuneUntil = now + e.staggerDur + 700;
    }
    this.tweens.add({ targets: e, scaleX: 1.18, scaleY: 0.86, duration: 60, yoyo: true });

    if (e.hp <= 0) this.killEnemy(e);
    else SFX.hit();
  }

  killEnemy(e) {
    if (!e.alive) return;
    e.alive = false;
    SFX.enemyDown();
    this.killCount++;
    this.combo++;
    if (this.combo === 5 || this.combo === 10) SFX.combo();
    DailyQuests.progress('kill20', 1);

    let coins = this.coinValue(e);
    if (this.combo >= 10) coins = Math.round(coins * 1.5);
    else if (this.combo >= 5) coins = Math.round(coins * 1.25);
    if (this.companion && this.companion.coinBonus) {
      coins = Math.round(coins * (1 + this.companion.coinBonus));
    }
    this.spawnCoins(e.x, e.y - 30, coins);

    e.kbVx = this.player.facing * 200;
    for (let i = 0; i < 8; i++) this.hitSpark(e.x, e.y - e.height * 0.5);
    this.tweens.add({
      targets: e, alpha: 0, angle: this.player.facing * 70, y: e.y + 14,
      duration: 320, onComplete: () => this.removeEnemy(e),
    });
    if (e.hpBg) { e.hpBg.destroy(); e.hpFg.destroy(); e.hpBg = null; }

    if (e.isBoss) {
      this.boss = null;
      this.tweens.add({ targets: this.cameras.main, zoom: 1.05, duration: 200, yoyo: true });
    }
  }

  coinValue(e) {
    if (e.isBoss) {
      return PlayerState.isLevelCleared(this.worldId, this.levelIndex) ? 200 : 400;
    }
    const k = e.cfg.key;
    if (k === 'goblin') return Phaser.Math.Between(10, 15);
    if (k === 'troll')  return Phaser.Math.Between(35, 50);
    if (k === 'orc' || k === 'armored' || k === 'mage') return Phaser.Math.Between(20, 30);
    return Phaser.Math.Between(25, 40);
  }

  removeEnemy(e) {
    if (e.shadow) e.shadow.destroy();
    if (e.hpBg) { e.hpBg.destroy(); e.hpFg.destroy(); }
    e.destroy();
  }

  cullEnemies() {
    this.enemies = this.enemies.filter((e) => e.alive);
  }

  /* ---- enemy AI --------------------------------------------------------- */
  updateEnemy(e, dt, now) {
    const p = this.player;
    e.facing = p.x >= e.x ? 1 : -1;
    e.setFlipX(e._facingRight ? e.facing < 0 : e.facing > 0);
    const dist = Math.abs(p.x - e.x);

    if (Math.abs(e.kbVx) > 4) {
      e.x += e.kbVx * dt;
      e.kbVx *= 0.84;
      e.x = Phaser.Math.Clamp(e.x, CONFIG.ARENA_LEFT, this.levelLength);
    }

    if (e.isBoss) this.updateBossPhase(e, now);
    const frozen = now < e.frozenUntil;

    switch (e.state) {
      case 'idle': {
        const aggro = CONFIG.AGGRO_RANGE + (e.isBoss ? 220 : 0);
        if (dist <= aggro) { e.state = 'chase'; e.stateAt = now; }
        break;
      }
      case 'chase':
        if (!frozen) this.enemyChase(e, dt, now, dist);
        break;
      case 'windup':
        if (now - e.stateAt >= e.cfg.attackWindup * (e.enraged ? 0.6 : 1)) {
          e.state = 'strike'; e.stateAt = now; e.struck = false;
        }
        break;
      case 'strike':
        if (!e.struck) { e.struck = true; this.enemyStrike(e, dist); }
        if (now - e.stateAt >= 160) { e.state = 'recover'; e.stateAt = now; }
        break;
      case 'recover':
        if (now - e.stateAt >= (e.isBoss ? 420 : 360)) {
          e.state = 'chase'; e.stateAt = now;
          e.attackReadyAt = now + (e.isBoss ? 700 : 1000) * (e.enraged ? 0.5 : 1);
        }
        break;
      case 'stagger':
        if (now - e.stateAt >= e.staggerDur) { e.state = 'chase'; e.stateAt = now; }
        break;
    }

    const atkPose = e.state === 'windup' || e.state === 'strike';
    AnimHelper.playState(e, atkPose ? 'attack' : 'idle');
    if (e.state === 'windup') e.setTint(0xffaaaa);
    else if (e.enraged) e.setTint(0xff7a6a);
    else if (frozen) e.setTint(0x9fd6ff);
    else e.clearTint();

    e.shadow.x = e.x;
    e.setDepth(e.y);
    if (e.hpBg) {
      const top = e.y - e.displayHeight - 12;
      e.hpBg.x = e.x; e.hpBg.y = top;
      e.hpFg.x = e.x - 22; e.hpFg.y = top;
      e.hpFg.width = 44 * Math.max(0, e.hp / e.maxHp);
      const vis = e.hp < e.maxHp;
      e.hpBg.setVisible(vis); e.hpFg.setVisible(vis);
    }
  }

  enemyChase(e, dt, now, dist) {
    if (e.behaviour === 'ranged') {
      const want = 300;
      if (dist < want - 60) e.x -= e.facing * e.speed * dt;
      else if (dist > want + 60) e.x += e.facing * e.speed * dt;
      else if (now >= e.attackReadyAt) { e.state = 'windup'; e.stateAt = now; }
      return;
    }
    if (dist <= e.range) {
      if (now >= e.attackReadyAt) { e.state = 'windup'; e.stateAt = now; }
    } else {
      const spd = e.speed * (e.enraged ? 1.8 : 1);
      e.x += e.facing * spd * dt;
      this.enemies.forEach((o) => {
        if (o !== e && o.alive && Math.abs(o.x - e.x) < 42) {
          e.x += (e.x < o.x ? -1 : 1) * 30 * dt;
        }
      });
    }
  }

  enemyStrike(e, dist) {
    const p = this.player;
    if (e.behaviour === 'ranged') { this.castEnemyBolt(e); return; }
    if (dist > e.range + 28) return;
    if ((e.behaviour === 'sweep' || e.isBoss) && !p.onGround &&
        p.y < CONFIG.GROUND_Y - 46) {
      this.floatText(p.x, p.y - 90, 'dodged!', '#9bff9b', 18);
      return;
    }
    let dmg = e.dmg;
    if (e.enraged) dmg = Math.round(dmg * 1.4);
    this.damagePlayer(dmg, e);
  }

  castEnemyBolt(e) {
    const p = this.player;
    const b = this.add.image(e.x + e.facing * 20, e.y - e.displayHeight * 0.55, 'bolt')
      .setTint(0xc77aff).setDepth(e.y + 1).setScale(1.2);
    b.vx = (p.x >= e.x ? 1 : -1) * 360;
    b.dmg = e.dmg;
    b.fromPlayer = false;
    this.projectiles.push(b);
  }

  /* ---- boss phases ------------------------------------------------------ */
  updateBossPhase(e, now) {
    const frac = e.hp / e.maxHp;
    if (e.cfg.key === 'goblin_king' && frac <= 0.5 && !e.spawnedAdds) {
      e.spawnedAdds = true;
      this.flashBanner('The King calls for help!');
      this.spawnEnemy('goblin', e.x - 90);
      this.spawnEnemy('goblin', e.x + 90);
    }
    if (e.cfg.key === 'orc_warchief' && frac <= 0.4 && !e.enraged) {
      e.enraged = true;
      this.flashBanner('The Warchief ENRAGES!');
    }
    if (e.cfg.key === 'dragon_lord') {
      const phase = frac > 0.66 ? 1 : (frac > 0.33 ? 2 : 3);
      if (phase !== e.phase) {
        e.phase = phase;
        if (phase >= 2) e.enraged = true;
        this.flashBanner('Dragon Lord — Phase ' + phase);
      }
    }
  }

  /* ---- player damage ---------------------------------------------------- */
  damagePlayer(rawDmg, source) {
    const p = this.player;
    const now = this.clock;
    if (now < p.invulnUntil || this.finished) return;

    if (this.shieldCharges > 0) {
      this.shieldCharges--;
      this.floatText(p.x, p.y - 96, 'BLOCKED', '#9bd0ff', 20);
      SFX.shieldPop();
      p.invulnUntil = now + 500;
      return;
    }
    if (this.armor.deflect && Math.random() < this.armor.deflect) {
      this.floatText(p.x, p.y - 96, 'DEFLECT', '#9bd0ff', 18);
      SFX.shieldPop();
      p.invulnUntil = now + 400;
      return;
    }

    const dmg = Math.max(3, Math.round(rawDmg - this.armor.defense * 0.6));
    p.hp -= dmg;
    this.floatText(p.x, p.y - 100, '-' + dmg, '#ff6a7e', 24);
    this.hitSpark(p.x, p.y - 50);
    SFX.hit();
    this.cameras.main.shake(120, 0.012);
    this.doHitStop();

    p.kbVx = (source && source.x > p.x ? -1 : 1) * 260;
    p.hurtUntil = now + 360;
    p.invulnUntil = now + 950;
    if (source && source.cfg && source.cfg.key === 'frost_troll') {
      p.frozenUntil = now + 1100;
      this.floatText(p.x, p.y - 70, 'FROZEN!', '#9fe6ff', 20);
    }

    this.combo = 0;
    this.tookDamageLevel = true;
    this.waveDamageless = false;

    if (p.hp <= 0) this.handleDeath();
  }

  handleDeath() {
    const p = this.player;
    if (!this.usedRevive && PlayerState.consumableQty('revive') > 0) {
      PlayerState.useConsumable('revive');
      this.usedRevive = true;
      p.hp = Math.round(p.maxHp * 0.6);
      p.invulnUntil = this.clock + 1800;
      p.hurtUntil = 0;
      this.flashBanner('REVIVED!');
      SFX.power();
      return;
    }
    this.finished = true;
    SFX.gameOver();
    AnimHelper.playState(this.player, 'hurt');
    this.cameras.main.fadeOut(600, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.stop('Hud');
      this.scene.start('GameOver', {
        win: false, worldId: this.worldId, levelIndex: this.levelIndex,
        coins: this.runCoins, kills: this.killCount,
      });
    });
  }

  /* ---- projectiles & coins --------------------------------------------- */
  updateProjectiles(dt) {
    const p = this.player;
    this.projectiles = this.projectiles.filter((b) => {
      b.x += b.vx * dt;
      b.angle += 12;
      if (b.x < -60 || b.x > CONFIG.WIDTH + 60) { b.destroy(); return false; }

      if (b.fromPlayer) {
        for (let i = 0; i < this.enemies.length; i++) {
          const e = this.enemies[i];
          if (e.alive && b.hitSet.indexOf(e) === -1 &&
              Math.abs(e.x - b.x) < 40 &&
              Math.abs((e.y - e.displayHeight * 0.5) - b.y) < e.displayHeight * 0.6) {
            b.hitSet.push(e);
            this.damageEnemy(e, b.dmg, 'light', b.crit);
            if (!b.pierce) { b.destroy(); return false; }
          }
        }
      } else if (Math.abs(p.x - b.x) < 36 &&
                 Math.abs((p.y - 50) - b.y) < 60 && this.clock >= p.invulnUntil) {
        this.damagePlayer(b.dmg, { x: b.x });
        b.destroy(); return false;
      }
      return true;
    });
  }

  spawnCoins(x, y, total) {
    const n = Phaser.Math.Clamp(Math.round(total / 8), 2, 7);
    const per = total / n;
    for (let i = 0; i < n; i++) {
      const c = this.add.image(x, y, 'coin').setDepth(400).setScale(0.9);
      c.value = per;
      c.vx = Phaser.Math.Between(-160, 160);
      c.vy = Phaser.Math.Between(-320, -180);
      c.grounded = false;
      c.bornAt = this.clock;
      this.coinPickups.push(c);
    }
  }

  updateCoins(dt, now) {
    const p = this.player;
    const magnet = now < this.magnetUntil;
    this.coinPickups = this.coinPickups.filter((c) => {
      if (!c.grounded) {
        c.vy += 1400 * dt;
        c.x += c.vx * dt;
        c.y += c.vy * dt;
        if (c.y >= CONFIG.GROUND_Y - 14) { c.y = CONFIG.GROUND_Y - 14; c.grounded = true; }
      }
      const dist = Phaser.Math.Distance.Between(c.x, c.y, p.x, p.y - 40);
      if ((c.grounded && dist < 64) || magnet || now - c.bornAt > 9000) {
        this.collectCoin(c);
        return false;
      }
      return true;
    });
  }

  collectCoin(c) {
    const gain = Math.max(1, Math.round(c.value));
    this.runCoins += gain;
    PlayerState.addCoins(gain);
    SFX.coin();
    const cam = this.cameras.main;
    this.tweens.add({ targets: c, x: cam.scrollX + CONFIG.WIDTH - 80,
      y: cam.scrollY + 36, scale: 0.4, duration: 360, ease: 'Cubic.in',
      onComplete: () => c.destroy() });
  }

  /* ---- consumables ------------------------------------------------------ */
  useConsumable(slot) {
    const id = this.consumableSlots[slot];
    if (!id || PlayerState.consumableQty(id) <= 0) return;
    PlayerState.useConsumable(id);
    const item = findItem(CONSUMABLES, id);
    SFX.power();
    if (item.effect === 'blockHit') {
      this.shieldCharges++;
      this.floatText(this.player.x, this.player.y - 100, '+Shield', '#9bd0ff', 20);
    } else if (item.effect === 'bomb') {
      this.flashBanner('BOMB!');
      this.cameras.main.shake(220, 0.02);
      this.enemies.slice().forEach((e) => {
        if (!e.alive) return;
        this.damageEnemy(e, e.isBoss ? e.maxHp * 0.18 : 9999, 'heavy', false);
      });
    } else if (item.effect === 'speed') {
      this.speedBoostUntil = this.clock + item.duration * 1000;
      this.floatText(this.player.x, this.player.y - 100, 'Speed!', '#9bff9b', 20);
    } else if (item.effect === 'magnet') {
      this.magnetUntil = this.clock + item.duration * 1000;
      this.floatText(this.player.x, this.player.y - 100, 'Magnet!', '#ffce3a', 20);
    }
  }

  /* ---- wave / level end ------------------------------------------------- */
  onWaveCleared() {
    this.waveClearing = true;
    if (this.waveDamageless && this.waveIndex >= 0 && !this.waves[this.waveIndex].boss) {
      this.runCoins += 100;
      PlayerState.addCoins(100);
      this.floatText(this.cameras.main.scrollX + CONFIG.WIDTH / 2, 210,
        'PERFECT WAVE  +100', '#ffce3a', 30);
      DailyQuests.progress('perfectWave', 1);
      SFX.levelUp();
    }
    this.time.delayedCall(900, () => { this.waveClearing = false; this.nextWave(); });
  }

  levelComplete() {
    if (this.finished) return;
    this.finished = true;
    SFX.levelUp();

    let bonus = this.isBossLevel
      ? (PlayerState.isLevelCleared(this.worldId, this.levelIndex) ? 200 : 400)
      : 80 + this.waves.length * 22 + this.levelIndex * 12;
    if (this.companion && this.companion.coinBonus) {
      bonus = Math.round(bonus * (1 + this.companion.coinBonus));
    }
    const perfect = !this.tookDamageLevel;
    if (perfect) bonus = Math.round(bonus * 1.5);

    PlayerState.addCoins(bonus);
    PlayerState.clearLevel(this.worldId, this.levelIndex, this.runCoins + bonus);
    if (perfect) DailyQuests.progress('clearLevel', 1);

    this.player.anims.stop();
    this.player.setTexture('hero_idle');
    this.flashBanner(this.isBossLevel ? 'BOSS DEFEATED!' : 'LEVEL CLEAR!');

    this.time.delayedCall(1500, () => {
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.stop('Hud');
        this.scene.start('GameOver', {
          win: true, worldId: this.worldId, levelIndex: this.levelIndex,
          coins: this.runCoins, bonus: bonus, perfect: perfect,
          kills: this.killCount, boss: this.isBossLevel,
        });
      });
    });
  }

  /* ---- effects ---------------------------------------------------------- */
  doHitStop() { this.freezeUntil = this.clock + CONFIG.HIT_STOP_MS; }

  hitSpark(x, y) {
    const s = this.add.image(x, y, Math.random() < 0.5 ? 'spark' : 'bit')
      .setDepth(500).setScale(Phaser.Math.FloatBetween(0.6, 1.4))
      .setTint(0xffe9a8);
    this.tweens.add({
      targets: s, x: x + Phaser.Math.Between(-46, 46), y: y + Phaser.Math.Between(-46, 30),
      alpha: 0, duration: 320, onComplete: () => s.destroy(),
    });
  }

  floatText(x, y, str, color, size) {
    const t = this.add.text(x, y, str, {
      fontFamily: UI.FONT, fontSize: (size || 22) + 'px', color: color,
      fontStyle: 'bold', stroke: '#1a1330', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(600);
    this.tweens.add({ targets: t, y: y - 52, alpha: 0, duration: 760,
      ease: 'Cubic.out', onComplete: () => t.destroy() });
  }

  flashBanner(str) {
    const t = this.add.text(CONFIG.WIDTH / 2, 168, str, {
      fontFamily: UI.FONT, fontSize: '44px', color: '#ffd23f',
      fontStyle: 'bold', stroke: '#3a2150', strokeThickness: 9,
    }).setOrigin(0.5).setDepth(700).setScale(0.5).setAlpha(0).setScrollFactor(0);
    this.tweens.add({ targets: t, scale: 1, alpha: 1, duration: 220, ease: 'Back.out' });
    this.tweens.add({ targets: t, alpha: 0, duration: 320, delay: 1100,
      onComplete: () => t.destroy() });
  }

  /* ---- pause ------------------------------------------------------------ */
  togglePause() {
    if (this.finished) return;
    if (this.paused) { this.closePause(); return; }
    this.paused = true;
    const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;
    const c = this.add.container(0, 0).setDepth(2000).setScrollFactor(0);
    c.add(this.add.rectangle(0, 0, W, H, 0x000000, 0.66).setOrigin(0).setInteractive());
    c.add(UI.panel(this, W / 2, H / 2, 440, 320, UI.COLORS.panel,
      { stroke: UI.COLORS.accent, strokeWidth: 4 }));
    c.add(UI.text(this, W / 2, H / 2 - 110, 'PAUSED', 40, '#ffd23f', { bold: true }));
    c.add(UI.button(this, W / 2, H / 2 - 30, {
      label: 'Resume', width: 260, height: 56, fontSize: 23,
      color: UI.COLORS.good, onClick: () => this.closePause(),
    }));
    c.add(UI.button(this, W / 2, H / 2 + 42, {
      label: 'Restart Level', width: 260, height: 52, fontSize: 20,
      color: UI.COLORS.accent, onClick: () => {
        this.scene.stop('Hud');
        this.scene.restart({ worldId: this.worldId, levelIndex: this.levelIndex });
      },
    }));
    c.add(UI.button(this, W / 2, H / 2 + 108, {
      label: 'Quit to Map', width: 260, height: 52, fontSize: 20,
      color: UI.COLORS.bad, onClick: () => {
        this.scene.stop('Hud');
        this.scene.start('WorldMap');
      },
    }));
    this.pauseOverlay = c;
  }

  closePause() {
    if (this.pauseOverlay) { this.pauseOverlay.destroy(); this.pauseOverlay = null; }
    this.paused = false;
    SFX.click();
  }
}
