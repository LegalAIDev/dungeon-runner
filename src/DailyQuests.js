/* ============================================================================
   DailyQuests.js — three daily quests plus one daily challenge, all generated
   from the calendar date so every player sees the same set each day.
   ========================================================================== */

const DailyQuests = (function () {
  /* a small deterministic generator seeded from a string */
  function seeded(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return function () {
      h += 0x6d2b79f5;
      let t = Math.imul(h ^ (h >>> 15), 1 | h);
      t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function todayKey() {
    const d = new Date();
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }

  /* the pool of quest templates — combat quests pay coins, math quests pay stars */
  const QUEST_POOL = [
    { id: 'clearLevel',  type: 'combat', currency: 'coins', reward: 100,
      goal: 1, text: 'Clear any level without dying.' },
    { id: 'kill20',      type: 'combat', currency: 'coins', reward: 150,
      goal: 20, text: 'Defeat 20 enemies in total.' },
    { id: 'perfectWave', type: 'combat', currency: 'coins', reward: 120,
      goal: 1, text: 'Finish a wave without taking damage.' },
    { id: 'labSession',  type: 'math',   currency: 'stars', reward: 30,
      goal: 1, text: 'Complete a Quiz Lab training session.' },
    { id: 'labStreak',   type: 'math',   currency: 'stars', reward: 25,
      goal: 5, text: 'Get a 5-answer streak in the Quiz Lab.' },
    { id: 'labCorrect',  type: 'math',   currency: 'stars', reward: 35,
      goal: 15, text: 'Answer 15 Quiz Lab questions correctly.' },
  ];

  return {
    todayKey: todayKey,

    /* ensures PlayerState.data.dailyQuests is for today; rebuilds it if not */
    refresh() {
      const dq = PlayerState.data.dailyQuests;
      const key = todayKey();
      if (dq.date === key && dq.quests && dq.quests.length) return dq;

      const rnd = seeded(key);
      const combat = QUEST_POOL.filter((q) => q.type === 'combat');
      const math   = QUEST_POOL.filter((q) => q.type === 'math');

      const firstCombat = pickFrom(combat, rnd);
      const secondCombat = pickFrom(
        combat.filter((q) => !firstCombat || q.id !== firstCombat.id), rnd);
      const quests = [firstCombat, secondCombat, pickFrom(math, rnd)]
        .filter(Boolean)
        .map((q) => ({ id: q.id, progress: 0 }));

      // daily challenge: a fixed Math Lab topic for the day
      const topic = MATH_TOPICS[Math.floor(rnd() * MATH_TOPICS.length)];

      PlayerState.data.dailyQuests = {
        date: key,
        quests: quests,
        completed: [],
        challengeDone: false,
        challengeTopic: topic.id,
      };
      PlayerState.save();
      return PlayerState.data.dailyQuests;
    },

    /* the static template for a quest id */
    template(id) {
      for (let i = 0; i < QUEST_POOL.length; i++) {
        if (QUEST_POOL[i].id === id) return QUEST_POOL[i];
      }
      return null;
    },

    challengeTopic() {
      this.refresh();
      const id = PlayerState.data.dailyQuests.challengeTopic;
      return MATH_TOPICS.find((t) => t.id === id) || MATH_TOPICS[1];
    },

    /* advances any active quest matching `id` by `amount`; awards on completion.
       Returns an array of {text, currency, reward} for quests just completed. */
    progress(id, amount) {
      this.refresh();
      const dq = PlayerState.data.dailyQuests;
      const done = [];
      dq.quests.forEach((q) => {
        if (q.id !== id) return;
        if (dq.completed.indexOf(id) !== -1) return;
        const tpl = this.template(id);
        if (!tpl) return;
        q.progress = Math.min(tpl.goal, q.progress + amount);
        if (q.progress >= tpl.goal) {
          dq.completed.push(id);
          if (tpl.currency === 'coins') PlayerState.addCoins(tpl.reward);
          else PlayerState.addStars(tpl.reward);
          done.push({ text: tpl.text, currency: tpl.currency, reward: tpl.reward });
        }
      });
      PlayerState.save();
      return done;
    },

    /* marks the daily challenge complete and pays the bonus once */
    completeChallenge() {
      this.refresh();
      const dq = PlayerState.data.dailyQuests;
      if (dq.challengeDone) return 0;
      dq.challengeDone = true;
      PlayerState.addStars(50);
      PlayerState.save();
      return 50;
    },
  };

  function pickFrom(list, rnd) {
    if (!list.length) return null;
    return list[Math.floor(rnd() * list.length)];
  }
})();
