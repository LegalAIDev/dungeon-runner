/* ============================================================================
   MathLabScene — voluntary math training. Solve problems, earn ⭐ stars.
   Wrong answers cost nothing — the Lab is a safe place to try.
   ========================================================================== */

class MathLabScene extends Phaser.Scene {
  constructor() { super('MathLab'); }

  init(data) {
    this.topic = data.topic || MATH_TOPICS[1];
    this.isChallenge = !!data.isChallenge;
    this.sessionSize = 10;
  }

  create() {
    const W = CONFIG.WIDTH;
    UI.scenicBackground(this, BIOMES[2]);
    this.add.rectangle(0, 0, W, CONFIG.HEIGHT, 0x140d33, 0.62).setOrigin(0);
    this.cameras.main.fadeIn(240, 0, 0, 0);

    this.problems = QuizEngine.generateSession(this.topic.id, this.sessionSize);
    this.index = 0;
    this.starsEarned = 0;
    this.streak = 0;
    this.bestStreak = 0;
    this.correctCount = 0;
    this.fastest = Infinity;
    this.results = [];
    this.phase = 'question';

    /* header */
    this.add.text(W / 2, 46,
      (this.isChallenge ? '⭐ DAILY CHALLENGE — ' : (QUIZ_CONTENT.labTabIcon || '🧪') + ' ') +
      this.topic.name.toUpperCase(), {
      fontFamily: UI.FONT, fontSize: '28px', color: '#ffd23f', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.progressText = this.add.text(W / 2, 80, '', {
      fontFamily: UI.FONT, fontSize: '17px', color: '#cdb8ff',
    }).setOrigin(0.5);

    UI.panel(this, W - 110, 46, 180, 48, UI.COLORS.panel, { radius: 12 });
    this.add.image(W - 178, 46, 'starcoin').setScale(0.8);
    this.starsText = this.add.text(W - 156, 46, '0', {
      fontFamily: UI.FONT, fontSize: '22px', color: '#ffcf3f', fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    UI.button(this, 86, 46, {
      label: '← Quit', width: 130, height: 44, fontSize: 17,
      color: UI.COLORS.panelLight, onClick: () => this.quit(),
    });

    this.renderProblem();
  }

  renderProblem() {
    if (this.qBox) this.qBox.destroy();
    const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;
    const box = this.add.container(0, 0);
    this.qBox = box;
    this.phase = 'question';

    const prob = this.problems[this.index];
    this.progressText.setText('Problem ' + (this.index + 1) + ' of ' + this.sessionSize);

    /* question card */
    box.add(UI.panel(this, W / 2, 200, 560, 150, UI.COLORS.panel,
      { stroke: this.topic.color, strokeWidth: 4 }));
    const qText = prob.q;
    const fontSize = qText.length > 60 ? '22px' : qText.length > 35 ? '30px' : '46px';
    box.add(this.add.text(W / 2, 200, qText, {
      fontFamily: UI.FONT, fontSize: fontSize, color: '#ffffff', fontStyle: 'bold',
      wordWrap: { width: 520 }, align: 'center',
    }).setOrigin(0.5));

    /* answer buttons (2 x 2) */
    this.answerBtns = [];
    prob.choices.forEach((choice, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const x = W / 2 + (col === 0 ? -160 : 160);
      const y = 320 + row * 84;
      const btn = UI.button(this, x, y, {
        label: String.fromCharCode(65 + i) + ':  ' + choice,
        width: 286, height: 68, fontSize: 26, color: UI.COLORS.accent,
        onClick: () => this.handleAnswer(i),
      });
      box.add(btn);
      this.answerBtns.push(btn);
    });

    /* timer bar */
    box.add(UI.text(this, W / 2, 468, '', 15, '#cdb8ff'));
    this.timerBg = this.add.rectangle(W / 2, 492, 560, 18, 0x000000, 0.5)
      .setStrokeStyle(2, 0xffffff, 0.3);
    this.timerBar = this.add.rectangle(W / 2 - 278, 492, 556, 12, this.topic.color)
      .setOrigin(0, 0.5);
    box.add(this.timerBg);
    box.add(this.timerBar);
    this.timerText = this.add.text(W / 2, 468, '', {
      fontFamily: UI.FONT, fontSize: '15px', color: '#cdb8ff',
    }).setOrigin(0.5);
    box.add(this.timerText);

    this.timeLimit = this.topic.timerSeconds * 1000;
    this.deadline = this.time.now + this.timeLimit;
    this.questionStart = this.time.now;
  }

  update(time) {
    if (this.phase !== 'question') return;
    const left = Math.max(0, this.deadline - time);
    this.timerBar.width = 556 * (left / this.timeLimit);
    this.timerText.setText((left / 1000).toFixed(1) + 's');
    if (left <= 0) this.resolveAnswer(-1);
  }

  handleAnswer(i) {
    if (this.phase !== 'question') return;
    this.resolveAnswer(i);
  }

  resolveAnswer(chosenIndex) {
    this.phase = 'feedback';
    const prob = this.problems[this.index];
    const timeMs = this.time.now - this.questionStart;
    const correct = chosenIndex === prob.correctIndex;
    this.results.push({ correct: correct, timeMs: timeMs });

    /* colour the buttons to reveal the answer (further clicks are ignored
       by the phase guard, so they need not be disabled) */
    this.answerBtns.forEach((b, i) => {
      if (i === prob.correctIndex) b.setButtonColor(UI.COLORS.good);
      else if (i === chosenIndex) b.setButtonColor(UI.COLORS.bad);
    });

    if (correct) {
      this.correctCount++;
      this.streak++;
      this.bestStreak = Math.max(this.bestStreak, this.streak);
      this.fastest = Math.min(this.fastest, timeMs);

      let stars = this.topic.starsPerCorrect;
      let label = '+' + this.topic.starsPerCorrect + ' ⭐';
      if (timeMs < 2000) { stars += 1; label += '  +1 fast'; }
      const char = PlayerState.equippedCharacter();
      const comp = PlayerState.equippedCompanion();
      if (char.labBonus) { stars += char.labBonus; label += '  +' + char.labBonus + ' hero'; }
      if (comp && comp.labBonus) { stars += comp.labBonus; label += '  +' + comp.labBonus + ' golem'; }
      if (this.streak % 5 === 0) { stars += 5; label += '   🔥 STREAK +5'; }

      this.starsEarned += stars;
      this.starsText.setText(String(this.starsEarned));
      this.flash(label, '#36c98d');
    } else {
      this.streak = 0;
      this.flash(chosenIndex < 0 ? 'Time up!  0 ⭐  (no penalty)'
                                 : 'Not quite — 0 ⭐  (no penalty)', '#ff9bb0');
    }

    this.time.delayedCall(950, () => {
      this.index++;
      if (this.index >= this.sessionSize) this.endSession();
      else this.renderProblem();
    });
  }

  flash(msg, color) {
    const t = this.add.text(CONFIG.WIDTH / 2, 138, msg, {
      fontFamily: UI.FONT, fontSize: '22px', color: color, fontStyle: 'bold',
      stroke: '#1a1330', strokeThickness: 4,
    }).setOrigin(0.5).setScale(0.6);
    this.tweens.add({ targets: t, scale: 1, duration: 180, ease: 'Back.out' });
    this.tweens.add({ targets: t, alpha: 0, duration: 300, delay: 700,
      onComplete: () => t.destroy() });
  }

  endSession() {
    if (this.qBox) this.qBox.destroy();
    this.phase = 'summary';

    const perfect = this.correctCount === this.sessionSize;
    if (perfect) this.starsEarned += 15;

    /* persist */
    PlayerState.addStars(this.starsEarned);
    PlayerState.recordLabSession(this.topic.id, this.correctCount,
      this.sessionSize, this.bestStreak);

    /* daily quests */
    DailyQuests.progress('labSession', 1);
    DailyQuests.progress('labCorrect', this.correctCount);
    if (this.bestStreak >= 5) DailyQuests.progress('labStreak', 5);
    let challengeBonus = 0;
    if (this.isChallenge) challengeBonus = DailyQuests.completeChallenge();

    this.showSummary(perfect, challengeBonus);
  }

  showSummary(perfect, challengeBonus) {
    const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;
    const c = this.add.container(0, 0);
    c.add(UI.panel(this, W / 2, H / 2, 600, 420, UI.COLORS.panel,
      { stroke: UI.COLORS.gold, strokeWidth: 4 }));
    c.add(UI.text(this, W / 2, H / 2 - 168, (QUIZ_CONTENT.labTabIcon || '🧪') + '  Training Complete!', 32, '#ffd23f',
      { bold: true }));
    c.add(UI.text(this, W / 2, H / 2 - 126,
      this.topic.name + '  ·  ' + this.sessionSize + ' questions', 18, '#cdb8ff'));

    const rows = [
      ['✅ Correct', this.correctCount + ' / ' + this.sessionSize],
      ['❌ Missed', String(this.sessionSize - this.correctCount)],
      ['⚡ Fastest', this.fastest === Infinity ? '—' : (this.fastest / 1000).toFixed(1) + 's'],
      ['🔥 Best streak', String(this.bestStreak)],
    ];
    rows.forEach((r, i) => {
      const y = H / 2 - 78 + i * 34;
      c.add(this.add.text(W / 2 - 200, y, r[0],
        { fontFamily: UI.FONT, fontSize: '19px', color: '#ffffff' }).setOrigin(0, 0.5));
      c.add(this.add.text(W / 2 + 200, y, r[1],
        { fontFamily: UI.FONT, fontSize: '19px', color: '#ffce3a', fontStyle: 'bold' })
        .setOrigin(1, 0.5));
    });

    let earnLine = 'Stars earned: +' + this.starsEarned + ' ⭐';
    if (perfect) earnLine += '   (perfect +15!)';
    c.add(UI.text(this, W / 2, H / 2 + 72, earnLine, 22, '#36c98d', { bold: true }));
    if (challengeBonus) {
      c.add(UI.text(this, W / 2, H / 2 + 100,
        'Daily Challenge bonus: +' + challengeBonus + ' ⭐', 18, '#ffcf3f', { bold: true }));
    }
    c.add(UI.text(this, W / 2, H / 2 + 126,
      'Total stars: ' + PlayerState.data.mathStars + ' ⭐', 18, '#cdb8ff'));

    c.add(UI.button(this, W / 2 - 130, H / 2 + 172, {
      label: 'Train Again', width: 230, height: 54, fontSize: 21,
      color: UI.COLORS.good,
      onClick: () => { this.scene.restart(
        { topic: this.topic, isChallenge: false }); },
    }));
    c.add(UI.button(this, W / 2 + 130, H / 2 + 172, {
      label: 'Back to Shop', width: 230, height: 54, fontSize: 21,
      color: UI.COLORS.accent,
      onClick: () => { this.scene.start('Shop',
        { from: 'WorldMap', tab: 'lab' }); },
    }));

    c.setAlpha(0);
    this.tweens.add({ targets: c, alpha: 1, duration: 200 });
  }

  quit() {
    if (this.starsEarned > 0 && this.phase !== 'summary') {
      PlayerState.addStars(this.starsEarned);
    }
    this.scene.start('Shop', { from: 'WorldMap', tab: 'lab' });
  }
}
