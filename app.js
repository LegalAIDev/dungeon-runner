const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const ui = {
  distance: document.getElementById('distance'),
  coins: document.getElementById('coins'),
  lives: document.getElementById('lives'),
  store: document.getElementById('store-items')
};

const dialog = document.getElementById('math-dialog');
const questionEl = document.getElementById('math-question');
const answerEl = document.getElementById('math-answer');
const feedbackEl = document.getElementById('math-feedback');
const submitBtn = document.getElementById('submit-btn');
const jumpBtn = document.getElementById('jump-btn');
const slideBtn = document.getElementById('slide-btn');
const pauseBtn = document.getElementById('pause-btn');

const state = {
  t: 0,
  paused: false,
  distance: 0,
  coins: 0,
  lives: 3,
  speed: 4,
  gravity: 0.7,
  jumpPower: 12,
  coinMultiplier: 1,
  shopBonus: 0,
  invulnUntil: 0,
  player: { x: 90, y: 270, w: 34, h: 52, vy: 0, onGround: true, sliding: false },
  obstacles: [],
  pickups: [],
  pendingPurchase: null,
  coinStreak: 0,
  mathStreak: 0,
  lastCoinAt: 0,
  comboBonusUntil: 0,
  roundBonuses: {
    jumpBoost: 0,
    coinRush: 0,
    extraLife: 0,
  },
};

const SAVE_KEY = 'mathRunnerProgressV1';

const upgrades = [
  { id: 'shoes', name: 'Speed Shoes', cost: 25, tier: 1, desc: '+8% run speed', bought: 0, apply: () => state.speed *= 1.08 },
  { id: 'double', name: 'Jump Boost', cost: 40, tier: 2, desc: '+2 jump power', bought: 0, apply: () => state.jumpPower += 2 },
  { id: 'magnet', name: 'Coin Multiplier', cost: 60, tier: 3, desc: '+25% coins', bought: 0, apply: () => state.coinMultiplier += 0.25 },
  { id: 'bonus', name: 'Shop Bonus', cost: 70, tier: 2, desc: '+1 coin per pickup', bought: 0, apply: () => state.shopBonus += 1 },
  { id: 'round-jump', name: 'Round Jump Juice', cost: 35, tier: 2, desc: '+4 jump power this round', bought: 0, apply: () => state.roundBonuses.jumpBoost += 1 },
  { id: 'round-coins', name: 'Round Coin Rush', cost: 45, tier: 2, desc: '+50% coin value this round', bought: 0, apply: () => state.roundBonuses.coinRush += 1 },
  { id: 'round-life', name: 'Round Heart', cost: 55, tier: 2, desc: '+1 life this round (max 5)', bought: 0, apply: () => {
    state.roundBonuses.extraLife += 1;
    state.lives = Math.min(5, state.lives + 1);
  } },
  { id: 'shield', name: 'Shield', cost: 50, tier: 2, desc: '1 hit protection (10s)', bought: 0, apply: () => state.invulnUntil = performance.now() + 10000 },
];



function saveProgress() {
  const payload = {
    coins: state.coins,
    upgrades: upgrades.map((u) => ({ id: u.id, bought: u.bought })),
  };
  localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
}

function loadProgress() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (typeof parsed.coins === 'number' && Number.isFinite(parsed.coins)) {
      state.coins = Math.max(0, Math.floor(parsed.coins));
    }
    if (Array.isArray(parsed.upgrades)) {
      parsed.upgrades.forEach((saved) => {
        const up = upgrades.find((u) => u.id === saved.id);
        const bought = Number(saved.bought);
        if (!up || !Number.isFinite(bought) || bought < 1) return;
        const toApply = Math.floor(bought);
        up.bought = toApply;
        for (let i = 0; i < toApply; i++) up.apply();
      });
    }
  } catch {
    // If save data is corrupted, ignore it and continue with defaults.
  }
}

function resizeCanvasToViewport() {
  const dpr = window.devicePixelRatio || 1;
  const w = Math.max(320, window.innerWidth);
  const h = Math.max(240, window.innerHeight);
  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

window.addEventListener('resize', resizeCanvasToViewport);
resizeCanvasToViewport();

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function generateProblem(tier) {
  if (tier === 1) {
    const a = rand(10, 99), b = rand(10, 99);
    return { q: `${a} + ${b} = ?`, a: a + b, hint: 'Add ones, then tens.' };
  }
  if (tier === 2) {
    const a = rand(6, 12), b = rand(6, 12);
    return { q: `${a} × ${b} = ?`, a: a * b, hint: 'Use multiplication facts.' };
  }
  const denom = rand(2, 10);
  const x = rand(1, denom - 1), y = rand(1, denom - 1);
  return { q: `${x}/${denom} + ${y}/${denom} = ? (decimal)`, a: (x + y) / denom, hint: 'Same denominator: add the tops first.' };
}

function renderStore() {
  ui.store.innerHTML = '';
  upgrades.forEach((u) => {
    const item = document.createElement('article');
    item.className = 'item';
    const canAfford = state.coins >= u.cost;
    item.innerHTML = `
      <h3>${u.name}</h3>
      <p>${u.desc}</p>
      <p><strong>Cost:</strong> ${u.cost} coins</p>
      <p><strong>Owned:</strong> ${u.bought}</p>
      <button class="primary" ${canAfford ? '' : 'disabled'}>Buy + Solve Math</button>
    `;
    item.querySelector('button').addEventListener('click', () => startPurchase(u));
    ui.store.appendChild(item);
  });
}

function startPurchase(upgrade) {
  state.paused = true;
  state.pendingPurchase = { upgrade, problem: generateProblem(upgrade.tier) };
  questionEl.textContent = state.pendingPurchase.problem.q;
  answerEl.value = '';
  feedbackEl.textContent = '';
  feedbackEl.className = 'feedback';
  dialog.showModal();
  answerEl.focus();
}

submitBtn.addEventListener('click', (e) => {
  e.preventDefault();
  if (!state.pendingPurchase) return;
  const guess = Number(answerEl.value);
  const { upgrade, problem } = state.pendingPurchase;
  const correct = Math.abs(guess - problem.a) < 0.001;
  if (correct) {
    if (state.coins >= upgrade.cost) {
      state.coins -= upgrade.cost;
      upgrade.bought += 1;
      upgrade.apply();
      state.mathStreak += 1;
      const streakBonus = Math.min(6, state.mathStreak);
      state.coins += streakBonus;
      state.comboBonusUntil = performance.now() + 4000;
      saveProgress();
      feedbackEl.textContent = `Correct! Purchased ${upgrade.name}. +${streakBonus} streak coins`;
      feedbackEl.className = 'feedback good';
      setTimeout(() => closeDialog(), 650);
    }
  } else {
    state.mathStreak = 0;
    feedbackEl.textContent = `Not quite. Hint: ${problem.hint}`;
    feedbackEl.className = 'feedback bad';
  }
  syncHud();
  renderStore();
});

document.getElementById('cancel-btn').addEventListener('click', closeDialog);

function closeDialog() {
  dialog.close();
  state.pendingPurchase = null;
  state.paused = false;
}

function jump() {
  if (state.paused || dialog.open) return;
  if (state.player.onGround) {
    const roundJumpBoost = state.roundBonuses.jumpBoost * 4;
    state.player.vy = -(state.jumpPower + roundJumpBoost);
    state.player.onGround = false;
  }
}

function setSliding(isSliding) {
  if (state.paused || dialog.open) return;
  state.player.sliding = isSliding;
}

window.addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() === 'p') state.paused = !state.paused;
  if (e.key === ' ' || e.key === 'ArrowUp') jump();
  if (e.key === 'ArrowDown') setSliding(true);
});
window.addEventListener('keyup', (e) => { if (e.key === 'ArrowDown') setSliding(false); });

if (jumpBtn && slideBtn && pauseBtn) {
  jumpBtn.addEventListener('click', jump);
  slideBtn.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    setSliding(true);
  });
  const stopSlide = () => setSliding(false);
  slideBtn.addEventListener('pointerup', stopSlide);
  slideBtn.addEventListener('pointercancel', stopSlide);
  slideBtn.addEventListener('pointerleave', stopSlide);
  pauseBtn.addEventListener('click', () => { state.paused = !state.paused; });
}


let pressStart = 0;
let holdActivated = false;
let pointerActive = false;

canvas.addEventListener('pointerdown', (e) => {
  if (e.pointerType !== 'touch' && e.pointerType !== 'pen') return;
  e.preventDefault();
  pressStart = performance.now();
  holdActivated = false;
  pointerActive = true;
  setTimeout(() => {
    if (pointerActive && performance.now() - pressStart >= 220) {
      holdActivated = true;
      setSliding(true);
    }
  }, 220);
});

const endPointerAction = (e) => {
  if (e.pointerType !== 'touch' && e.pointerType !== 'pen') return;
  e.preventDefault();
  pointerActive = false;
  setSliding(false);
  if (!holdActivated && performance.now() - pressStart < 220) jump();
};

canvas.addEventListener('pointerup', endPointerAction);
canvas.addEventListener('pointercancel', endPointerAction);
canvas.addEventListener('pointerleave', endPointerAction);

function groundY() { return canvas.height / (window.devicePixelRatio || 1) - 30; }

function spawnObstacle() {
  const h = rand(24, 55);
  state.obstacles.push({ x: canvas.width / (window.devicePixelRatio || 1) + 20, y: groundY() - h, w: rand(18, 30), h });
}
function spawnCoin() {
  const topBand = Math.max(110, groundY() - 170);
  const lowBand = Math.max(topBand + 10, groundY() - 30);
  state.pickups.push({ x: canvas.width / (window.devicePixelRatio || 1) + 20, y: rand(topBand, lowBand), r: 8 });
}
function overlaps(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function update() {
  if (state.paused) return;
  state.t += 1;
  state.distance += state.speed / 10;
  state.speed += 0.0008;

  if (state.t % Math.max(36, Math.floor(85 - state.speed * 5)) === 0) spawnObstacle();
  if (state.t % 45 === 0) spawnCoin();

  const p = state.player;
  p.vy += state.gravity;
  p.y += p.vy;
  const floorY = groundY() - (p.sliding ? 28 : p.h);
  if (p.y > floorY) {
    p.y = floorY;
    p.vy = 0;
    p.onGround = true;
  }

  state.obstacles.forEach(o => o.x -= state.speed);
  state.pickups.forEach(c => c.x -= state.speed);
  state.obstacles = state.obstacles.filter(o => o.x + o.w > -10);
  state.pickups = state.pickups.filter(c => c.x + c.r > -10);

  const playerBox = { x: p.x, y: p.y, w: p.w, h: p.sliding ? 28 : p.h };

  for (const o of state.obstacles) {
    if (overlaps(playerBox, o) && performance.now() > state.invulnUntil) {
      state.lives -= 1;
      state.coinStreak = 0;
      state.invulnUntil = performance.now() + 900;
      if (state.lives <= 0) {
        const finalDistance = Math.floor(state.distance);
        const openShop = window.confirm(`Game over! Distance: ${finalDistance}m. Open shop now?`);
        Object.assign(state, {
          distance: 0,
          lives: 3,
          speed: 4,
          obstacles: [],
          pickups: [],
          coinStreak: 0,
          mathStreak: 0,
          comboBonusUntil: 0,
          lastCoinAt: 0,
          roundBonuses: { jumpBoost: 0, coinRush: 0, extraLife: 0 },
        });
        if (openShop) state.paused = true;
      }
      break;
    }
  }

  state.pickups = state.pickups.filter((c) => {
    const hit = Math.hypot((c.x - (p.x + p.w / 2)), (c.y - (p.y + 18))) < 20;
    if (hit) {
      const now = performance.now();
      state.coinStreak = (now - state.lastCoinAt <= 1400) ? state.coinStreak + 1 : 1;
      state.lastCoinAt = now;
      const streakStep = Math.floor(state.coinStreak / 5);
      const comboMult = now < state.comboBonusUntil ? 1.5 : 1;
      const roundCoinMult = 1 + (state.roundBonuses.coinRush * 0.5);
      const earned = Math.max(1, Math.round((1 + streakStep) * state.coinMultiplier * roundCoinMult * comboMult)) + state.shopBonus;
      state.coins += earned;
      saveProgress();
    }
    return !hit;
  });
}

function drawSky() {
  const sky = ctx.createLinearGradient(0, 0, 0, 240);
  sky.addColorStop(0, '#78c8ff');
  sky.addColorStop(0.6, '#b7e8ff');
  sky.addColorStop(1, '#dcf4ff');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.width, 240);

  const offset = (state.distance * 0.08) % 280;
  for (let i = -1; i < 5; i++) {
    const x = i * 280 - offset;
    const y = 55 + (i % 2) * 22;
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    ctx.beginPath();
    ctx.arc(x + 40, y, 20, 0, Math.PI * 2);
    ctx.arc(x + 62, y - 9, 24, 0, Math.PI * 2);
    ctx.arc(x + 88, y, 20, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawGround() {
  const width = canvas.width / (window.devicePixelRatio || 1);
  const gY = groundY();
  const hillOffset = (state.distance * 0.2) % width;
  ctx.fillStyle = '#98db87';
  ctx.beginPath();
  ctx.moveTo(-hillOffset, gY);
  for (let i = -1; i < 6; i++) ctx.quadraticCurveTo(i * 200 + 100 - hillOffset, gY - 70, i * 200 + 200 - hillOffset, gY);
  ctx.lineTo(width, canvas.height / (window.devicePixelRatio || 1));
  ctx.lineTo(0, canvas.height / (window.devicePixelRatio || 1));
  ctx.closePath();
  ctx.fill();

  const ground = ctx.createLinearGradient(0, gY, 0, canvas.height / (window.devicePixelRatio || 1));
  ground.addColorStop(0, '#6bc85d');
  ground.addColorStop(1, '#3f9e3d');
  ctx.fillStyle = ground;
  ctx.fillRect(0, gY, width, 30);
}

function drawPlayer(p) {
  ctx.save();
  ctx.translate(p.x, p.y);
  if (performance.now() < state.invulnUntil) ctx.globalAlpha = 0.65 + Math.sin(state.t * 0.8) * 0.25;

  const height = p.sliding ? 28 : p.h;
  const body = ctx.createLinearGradient(0, 0, 0, height);
  body.addColorStop(0, '#5568ff');
  body.addColorStop(1, '#2c3fc9');
  ctx.fillStyle = body;
  ctx.fillRect(0, 0, p.w, height);

  ctx.fillStyle = '#f7d6b5';
  ctx.fillRect(8, 6, 18, 12);
  ctx.fillStyle = '#fff';
  ctx.fillRect(20, height - 10, 10, 7);
  ctx.restore();
}

function drawObstacle(o) {
  const spikes = Math.max(2, Math.floor(o.w / 8));
  ctx.fillStyle = '#7a3324';
  ctx.fillRect(o.x, o.y + 8, o.w, o.h - 8);
  ctx.fillStyle = '#b9543f';
  for (let i = 0; i < spikes; i++) {
    const x = o.x + i * (o.w / spikes);
    ctx.beginPath();
    ctx.moveTo(x, o.y + 8);
    ctx.lineTo(x + (o.w / spikes) / 2, o.y);
    ctx.lineTo(x + (o.w / spikes), o.y + 8);
    ctx.closePath();
    ctx.fill();
  }
}

function drawCoin(c) {
  const pulse = 1 + Math.sin((state.t + c.x) * 0.08) * 0.08;
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.scale(pulse, pulse);
  ctx.fillStyle = '#ffd43b';
  ctx.beginPath();
  ctx.arc(0, 0, c.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#e6a91b';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.7)';
  ctx.beginPath();
  ctx.arc(-2, -2, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function draw() {
  const width = canvas.width / (window.devicePixelRatio || 1);
  const height = canvas.height / (window.devicePixelRatio || 1);
  ctx.clearRect(0, 0, width, height);
  drawSky();
  drawGround();

  const p = state.player;
  drawPlayer(p);

  state.obstacles.forEach(drawObstacle);
  state.pickups.forEach(drawCoin);


  if (state.coinStreak >= 3 || state.mathStreak >= 2) {
    ctx.fillStyle = 'rgba(0,0,0,.35)';
    ctx.fillRect(16, 16, 230, 56);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(`Coin streak: ${state.coinStreak}`, 26, 40);
    ctx.fillText(`Math streak: ${state.mathStreak}`, 26, 63);
  }


  if (state.roundBonuses.jumpBoost || state.roundBonuses.coinRush || state.roundBonuses.extraLife) {
    ctx.fillStyle = 'rgba(0,0,0,.32)';
    ctx.fillRect(16, 78, 320, 34);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(`Round buffs → Jump +${state.roundBonuses.jumpBoost * 4}, Coin +${state.roundBonuses.coinRush * 50}%`, 26, 100);
  }

  if (state.paused) {
    ctx.fillStyle = 'rgba(0,0,0,.4)';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText(dialog.open ? 'Math Time!' : 'Paused', width / 2 - 90, height / 2);
  }
}

function syncHud() {
  ui.distance.textContent = Math.floor(state.distance);
  ui.coins.textContent = state.coins;
  ui.lives.textContent = state.lives;
}

function loop() {
  update();
  draw();
  syncHud();
  renderStore();
  requestAnimationFrame(loop);
}

loadProgress();
renderStore();
loop();
