/* ============================================================================
   PlayerState.js — the player's saved progress: coins, math stars, owned gear,
   equipped loadout, level completion and Math Lab statistics.

   Persisted to localStorage so progress survives between visits.
   ========================================================================== */

const PlayerState = (function () {
  const SAVE_KEY = 'mathrunner_v2';

  function defaultProgress() {
    const p = {};
    WORLDS.forEach((w) => { p[w.id] = { cleared: [], bestCoins: {} }; });
    return p;
  }

  // DEV MODE: start with unlimited coins/stars for testing
  const DEV_UNLIMITED = true;

  function defaultState() {
    return {
      coins: DEV_UNLIMITED ? 999999 : 0,
      mathStars: DEV_UNLIMITED ? 999999 : 0,

      inventory: {
        consumables: {},                 // { itemId: quantity }
        equipped: {
          weapon: 'wood_sword',
          armor: 'cloth',
          character: 'fighter',
          companion: null,
        },
      },

      unlocks: {
        weapons:    ['wood_sword'],
        armor:      ['cloth'],
        characters: ['fighter'],
        companions: [],
        worlds:     ['forest'],
      },

      progress: defaultProgress(),

      mathLabStats: {
        totalSessions: 0,
        totalCorrect: 0,
        totalAttempted: 0,
        bestStreak: 0,
        topicHistory: {},                // { topicId: { correct, attempted } }
      },

      dailyQuests: { date: null, quests: [], completed: [], challengeDone: false },

      settings: { soundOn: true, musicOn: true },

      charPicked: false,                 // has the player chosen a starter?
    };
  }

  const State = {
    data: defaultState(),

    /* ---- persistence ----------------------------------------------------- */
    load() {
      try {
        const raw = localStorage.getItem(SAVE_KEY);
        if (!raw) return;
        const saved = JSON.parse(raw);
        this.data = deepMerge(defaultState(), saved);
      } catch (e) {
        this.data = defaultState();      // corrupted save → start fresh
      }
      if (DEV_UNLIMITED) {
        this.data.coins = 999999;
        this.data.mathStars = 999999;
      }
    },

    save() {
      try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(this.data));
      } catch (e) { /* storage blocked or full — ignore */ }
    },

    reset() {
      this.data = defaultState();
      this.save();
    },

    /* ---- currency -------------------------------------------------------- */
    addCoins(n)   { this.data.coins = Math.max(0, this.data.coins + Math.round(n)); this.save(); },
    spendCoins(n) { this.data.coins = DEV_UNLIMITED ? 999999 : Math.max(0, this.data.coins - n); this.save(); },
    addStars(n)   { this.data.mathStars = Math.max(0, this.data.mathStars + Math.round(n)); this.save(); },
    spendStars(n) { this.data.mathStars = DEV_UNLIMITED ? 999999 : Math.max(0, this.data.mathStars - n); this.save(); },

    /* ---- unlocks --------------------------------------------------------- */
    owns(kind, id) { return this.data.unlocks[kind].indexOf(id) !== -1; },

    unlock(kind, id) {
      if (!this.owns(kind, id)) { this.data.unlocks[kind].push(id); this.save(); }
    },

    equip(slot, id) {
      this.data.inventory.equipped[slot] = id;
      this.save();
    },

    equipped(slot)  { return this.data.inventory.equipped[slot]; },

    equippedWeapon()    { return findItem(WEAPONS,    this.equipped('weapon'))    || WEAPONS[0]; },
    equippedArmor()     { return findItem(ARMOR,      this.equipped('armor'))     || ARMOR[0]; },
    equippedCharacter() { return findItem(CHARACTERS, this.equipped('character')) || CHARACTERS[0]; },
    equippedCompanion() {
      const id = this.equipped('companion');
      return id ? findItem(COMPANIONS, id) : null;
    },

    /* ---- consumables ----------------------------------------------------- */
    consumableQty(id) { return this.data.inventory.consumables[id] || 0; },

    addConsumable(id, n) {
      const c = this.data.inventory.consumables;
      c[id] = (c[id] || 0) + (n || 1);
      this.save();
    },

    useConsumable(id) {
      const c = this.data.inventory.consumables;
      if (!c[id]) return false;
      c[id] -= 1;
      if (c[id] <= 0) delete c[id];
      this.save();
      return true;
    },

    /* ---- gear score ------------------------------------------------------ */
    gearScore() {
      const w = this.equippedWeapon();
      const a = this.equippedArmor();
      const c = this.equippedCharacter();
      const p = this.equippedCompanion();
      return (w.gearScore || 0) + (a.gearScore || 0) +
             (c.gearScore || 0) + (p ? (p.gearScore || 0) : 0);
    },

    /* ---- level progress -------------------------------------------------- */
    isLevelCleared(worldId, levelIndex) {
      const prog = this.data.progress[worldId];
      return !!prog && prog.cleared.indexOf(levelIndex) !== -1;
    },

    isLevelUnlocked(worldId, levelIndex) {
      if (levelIndex === 0) return true;                 // first level always open
      return this.isLevelCleared(worldId, levelIndex - 1);
    },

    isWorldUnlocked(worldId) {
      const world = findItem(WORLDS, worldId);
      return !world || this.data.mathStars >= world.starGate ||
             this.owns('worlds', worldId);
    },

    clearLevel(worldId, levelIndex, coins) {
      const prog = this.data.progress[worldId];
      if (!prog) return;
      if (prog.cleared.indexOf(levelIndex) === -1) prog.cleared.push(levelIndex);
      const key = String(levelIndex);
      prog.bestCoins[key] = Math.max(prog.bestCoins[key] || 0, coins);
      this.save();
    },

    /* ---- Math Lab stats -------------------------------------------------- */
    recordLabSession(topicId, correct, attempted, bestStreak) {
      const s = this.data.mathLabStats;
      s.totalSessions  += 1;
      s.totalCorrect   += correct;
      s.totalAttempted += attempted;
      s.bestStreak      = Math.max(s.bestStreak, bestStreak);
      const h = s.topicHistory[topicId] || { correct: 0, attempted: 0 };
      h.correct   += correct;
      h.attempted += attempted;
      s.topicHistory[topicId] = h;
      this.save();
    },
  };

  /* recursively fill any missing keys of `base` from `over` (saved data) */
  function deepMerge(base, over) {
    if (Array.isArray(base)) return Array.isArray(over) ? over.slice() : base;
    if (base && typeof base === 'object') {
      const out = {};
      Object.keys(base).forEach((k) => {
        out[k] = (over && k in over) ? deepMerge(base[k], over[k]) : base[k];
      });
      // keep extra keys the save had (e.g. consumables added later)
      if (over && typeof over === 'object') {
        Object.keys(over).forEach((k) => { if (!(k in out)) out[k] = over[k]; });
      }
      return out;
    }
    return over === undefined ? base : over;
  }

  State.load();
  return State;
})();
