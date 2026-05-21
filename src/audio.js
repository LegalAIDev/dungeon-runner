/* ============================================================================
   audio.js — all game sound, created on the fly with the Web Audio API.

   Nothing is loaded from a file: every beep, sparkle and the background music
   is synthesised in code. That keeps the project a single tidy folder with no
   audio downloads. Call SFX.init() once from a button press (browsers only
   allow sound to start after the player interacts with the page).
   ========================================================================== */

const SFX = (function () {
  let ctx = null;          // the Web Audio context
  let master = null;       // sound-effects volume
  let musicGain = null;    // background-music volume (separate so it can fade)
  let musicTimer = null;
  let musicStep = 0;

  function ensure() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.85;
      master.connect(ctx.destination);
      musicGain = ctx.createGain();
      musicGain.gain.value = 0.0001;
      musicGain.connect(master);
    } catch (e) { ctx = null; }
  }

  const now = () => (ctx ? ctx.currentTime : 0);
  const sfxOn = () => Save.data.soundOn;
  const musicEffectiveOn = () => Save.data.soundOn && Save.data.musicOn;

  /* one short note, with an optional pitch slide and output destination */
  function blip(freq, t, dur, type, vol, freqEnd, dest) {
    if (!ctx) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(freq, t);
    if (freqEnd) o.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(dest || master);
    o.start(t);
    o.stop(t + dur + 0.03);
  }

  /* a burst of filtered noise — used for landings and hits */
  function noise(t, dur, vol, filterFreq) {
    if (!ctx) return;
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    const filt = ctx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.value = filterFreq || 1200;
    src.connect(filt);
    filt.connect(g);
    g.connect(master);
    src.start(t);
    src.stop(t + dur + 0.03);
  }

  /* gentle 16-step background loop (pleasant, repetitive, easy to ignore) */
  const MUSIC_MELODY = [523, 0, 659, 0, 784, 0, 659, 0, 587, 0, 440, 0, 494, 0, 392, 0];
  const MUSIC_BASS   = [131, 0, 0, 0, 165, 0, 0, 0, 110, 0, 0, 0, 147, 0, 0, 0];
  function musicTick() {
    if (!ctx) return;
    const t = now() + 0.06;
    const m = MUSIC_MELODY[musicStep % 16];
    const b = MUSIC_BASS[musicStep % 16];
    if (m) blip(m, t, 0.32, 'triangle', 0.5, null, musicGain);
    if (b) blip(b, t, 0.55, 'sawtooth', 0.4, null, musicGain);
    if (musicStep % 4 === 2) noise(t, 0.05, 0.05, 6000); // soft hi-hat tick
    musicStep++;
  }

  return {
    /* call from the first user click so the browser allows audio */
    init() {
      ensure();
      if (ctx && ctx.state === 'suspended') ctx.resume();
    },
    resume() { if (ctx && ctx.state === 'suspended') ctx.resume(); },

    /* --- sound effects --- */
    jump()       { if (!sfxOn()) return; ensure(); blip(300, now(), 0.18, 'square', 0.16, 640); },
    doubleJump() { if (!sfxOn()) return; ensure(); blip(520, now(), 0.2, 'square', 0.15, 940); },
    land()       { if (!sfxOn()) return; ensure(); noise(now(), 0.08, 0.1, 800); },
    coin()       { if (!sfxOn()) return; ensure(); const t = now();
                   blip(900, t, 0.08, 'square', 0.13); blip(1350, t + 0.06, 0.12, 'square', 0.13); },
    gem()        { if (!sfxOn()) return; ensure(); const t = now();
                   [880, 1175, 1568].forEach((f, i) => blip(f, t + i * 0.06, 0.16, 'triangle', 0.15)); },
    power()      { if (!sfxOn()) return; ensure(); const t = now();
                   [523, 659, 784, 1047].forEach((f, i) => blip(f, t + i * 0.05, 0.16, 'triangle', 0.16)); },
    shieldPop()  { if (!sfxOn()) return; ensure(); blip(720, now(), 0.3, 'sawtooth', 0.13, 180); },
    hit()        { if (!sfxOn()) return; ensure(); const t = now();
                   blip(190, t, 0.26, 'square', 0.2, 70); noise(t, 0.18, 0.16, 480); },
    correct()    { if (!sfxOn()) return; ensure(); const t = now();
                   [659, 784, 988, 1319].forEach((f, i) => blip(f, t + i * 0.08, 0.22, 'triangle', 0.17)); },
    wrong()      { if (!sfxOn()) return; ensure(); const t = now();
                   blip(220, t, 0.2, 'sawtooth', 0.13, 150); blip(160, t + 0.12, 0.3, 'sawtooth', 0.13, 90); },
    levelUp()    { if (!sfxOn()) return; ensure(); const t = now();
                   [523, 659, 784, 1047, 1319].forEach((f, i) => blip(f, t + i * 0.09, 0.26, 'triangle', 0.18)); },
    buy()        { if (!sfxOn()) return; ensure(); const t = now();
                   [784, 1047, 1319].forEach((f, i) => blip(f, t + i * 0.07, 0.2, 'triangle', 0.17)); },
    click()      { if (!sfxOn()) return; ensure(); blip(640, now(), 0.06, 'square', 0.11); },
    gameOver()   { if (!sfxOn()) return; ensure(); const t = now();
                   [523, 440, 349, 262].forEach((f, i) => blip(f, t + i * 0.17, 0.42, 'triangle', 0.18)); },

    /* --- background music --- */
    startMusic() {
      ensure();
      if (!ctx || musicTimer) return;
      musicTimer = setInterval(musicTick, 232);
      this.refreshMusic();
    },
    stopMusic() {
      if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
      if (musicGain) {
        musicGain.gain.cancelScheduledValues(now());
        musicGain.gain.setValueAtTime(Math.max(0.0001, musicGain.gain.value), now());
        musicGain.gain.exponentialRampToValueAtTime(0.0001, now() + 0.4);
      }
    },
    /* re-reads the sound settings and fades the music in or out to match */
    refreshMusic() {
      if (!ctx || !musicGain) return;
      const target = musicEffectiveOn() ? 0.32 : 0.0001;
      musicGain.gain.cancelScheduledValues(now());
      musicGain.gain.setValueAtTime(Math.max(0.0001, musicGain.gain.value), now());
      musicGain.gain.exponentialRampToValueAtTime(target, now() + 0.6);
    },
  };
})();
