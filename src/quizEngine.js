/* ============================================================================
   quizEngine.js — serves quiz questions from QUIZ_CONTENT (content.js).

   QuizEngine.generateForTopic(topicId) returns:
     { q, choices, correctIndex, topic, hint }

   QuizEngine.generateSession(topicId, count) returns an array of the above.

   QuizEngine.generate(tier) is kept for any code that asks for a question by
   difficulty tier (1–3); it maps tiers to the first three topics by index.
   ============================================================================ */

const QuizEngine = (function () {

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function topicById(id) {
    return QUIZ_CONTENT.topics.find((t) => t.id === id) || QUIZ_CONTENT.topics[0];
  }

  /* Convert a raw content.js question into the shape the scenes expect. */
  function toQuestion(raw) {
    /* Shuffle choices so the correct answer isn't always in the same slot. */
    const shuffled = shuffle(raw.choices);
    const correctIndex = shuffled.indexOf(raw.answer);
    return {
      q:            raw.q,
      choices:      shuffled,
      correctIndex: correctIndex < 0 ? 0 : correctIndex,
      topic:        raw.topic || '',
      hint:         raw.hint  || '',
      /* also expose answer as a string for any code that checks it directly */
      answer:       raw.answer,
    };
  }

  return {
    /* One question for a topic id. */
    generateForTopic(topicId) {
      const topic = topicById(topicId);
      const pool  = topic.questions;
      const raw   = pool[Math.floor(Math.random() * pool.length)];
      return toQuestion({ ...raw, topic: topic.name });
    },

    /* A session of `count` questions. Cycles the pool if count > pool size. */
    generateSession(topicId, count) {
      const topic   = topicById(topicId);
      const pool    = shuffle(topic.questions.slice());
      const out     = [];
      for (let i = 0; i < count; i++) {
        const raw = pool[i % pool.length];
        out.push(toQuestion({ ...raw, topic: topic.name }));
      }
      return out;
    },

    /* Tier-based access kept for backward compatibility. */
    generate(tier) {
      const t = Math.max(1, Math.min(tier || 1, QUIZ_CONTENT.topics.length));
      return this.generateForTopic(QUIZ_CONTENT.topics[t - 1].id);
    },
  };
})();

/* Keep old name as an alias so any lingering references don't break. */
const MathProblems = QuizEngine;
