/* ============================================================================
   EnemyFactory.js — base enemy stats, boss stats and the scaling rules that
   make better gear necessary as the player advances.
   ========================================================================== */

const EnemyFactory = (function () {
  /* Base stats. hp/damage are scaled up per world & level (see scale()).
     `w` and `h` size the drawn sprite. `tint` recolours a shared body shape. */
  const ENEMIES = {
    goblin: {
      key: 'goblin', name: 'Goblin Grunt', hp: 20, damage: 5, speed: 132,
      range: 50, w: 56, h: 66, attackWindup: 280, behaviour: 'rush',
    },
    orc: {
      key: 'orc', name: 'Orc Warrior', hp: 50, damage: 12, speed: 96,
      range: 56, w: 70, h: 84, attackWindup: 520, behaviour: 'telegraph',
    },
    troll: {
      key: 'troll', name: 'Troll Berserker', hp: 80, damage: 18, speed: 62,
      range: 72, w: 92, h: 106, attackWindup: 700, behaviour: 'sweep',
    },
    mage: {
      key: 'mage', name: 'Dark Mage', hp: 35, damage: 15, speed: 40,
      range: 460, w: 60, h: 80, attackWindup: 620, behaviour: 'ranged',
    },
    armored: {
      key: 'armored', name: 'Armored Orc', hp: 70, damage: 14, speed: 90,
      range: 56, w: 74, h: 86, attackWindup: 560, behaviour: 'telegraph',
    },
    shadow: {
      key: 'shadow', name: 'Shadow Knight', hp: 100, damage: 22, speed: 138,
      range: 58, w: 72, h: 90, attackWindup: 360, behaviour: 'guard',
    },
  };

  /* One boss per world. `phases` describes the special mechanic. */
  const BOSSES = {
    goblin_king: {
      key: 'goblin_king', name: 'Goblin King', hp: 300, damage: 14, speed: 86,
      range: 76, w: 132, h: 150, attackWindup: 480,
      mechanic: 'Summons two grunts at half health.',
    },
    orc_warchief: {
      key: 'orc_warchief', name: 'Orc Warchief', hp: 600, damage: 20, speed: 92,
      range: 84, w: 142, h: 160, attackWindup: 520,
      mechanic: 'Enrages below 40% health — speed and damage double.',
    },
    frost_troll: {
      key: 'frost_troll', name: 'Frost Troll', hp: 900, damage: 26, speed: 70,
      range: 96, w: 158, h: 176, attackWindup: 640,
      mechanic: 'Heavy hits freeze you — keep moving.',
    },
    dragon_lord: {
      key: 'dragon_lord', name: 'Dragon Lord', hp: 1800, damage: 32, speed: 104,
      range: 104, w: 188, h: 178, attackWindup: 540,
      mechanic: 'Three phases — grounded, diving, then both.',
    },
  };

  /* Difficulty multiplier for a given world (0-3) and level (0-4). */
  function scaleFactor(worldIndex, levelIndex) {
    return 1 + worldIndex * 0.55 + levelIndex * 0.14;
  }

  return {
    /* a fresh, scaled copy of a standard enemy */
    make(typeKey, worldIndex, levelIndex) {
      const base = ENEMIES[typeKey] || ENEMIES.goblin;
      const f = scaleFactor(worldIndex, levelIndex);
      return Object.assign({}, base, {
        hp: Math.round(base.hp * f),
        maxHp: Math.round(base.hp * f),
        damage: Math.round(base.damage * (1 + worldIndex * 0.35 + levelIndex * 0.08)),
        isBoss: false,
      });
    },

    /* a fresh, scaled copy of a boss (bosses scale only by world) */
    makeBoss(bossKey, worldIndex) {
      const base = BOSSES[bossKey] || BOSSES.goblin_king;
      const f = 1 + worldIndex * 0.12;
      return Object.assign({}, base, {
        hp: Math.round(base.hp * f),
        maxHp: Math.round(base.hp * f),
        damage: Math.round(base.damage * f),
        behaviour: 'boss',
        isBoss: true,
      });
    },

    list()      { return ENEMIES; },
    bossList()  { return BOSSES; },

    /* Builds the wave list for a level. Returns an array of waves, each wave an
       array of enemy type keys. The boss level returns a single boss wave. */
    buildWaves(world, worldIndex, levelIndex) {
      if (levelIndex === LEVELS_PER_WORLD - 1) {
        return [{ boss: world.boss }];
      }
      const waveCount = LEVEL_WAVES[levelIndex];
      const pool = world.enemies;
      const waves = [];
      for (let w = 0; w < waveCount; w++) {
        const size = 2 + Math.min(2, Math.floor((levelIndex + w) / 2));
        const wave = [];
        for (let i = 0; i < size; i++) {
          // later waves lean toward the tougher end of the pool
          const bias = Math.min(pool.length - 1,
            Math.floor(Math.random() * (1 + w * 0.6 + levelIndex * 0.4)));
          wave.push(pool[Math.min(bias, pool.length - 1)]);
        }
        waves.push(wave);
      }
      return waves;
    },
  };
})();
