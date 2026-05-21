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
  invulnUntil: 0,
  player: { x: 90, y: 270, w: 34, h: 52, vy: 0, onGround: true, sliding: false },
  obstacles: [],
  pickups: [],
  pendingPurchase: null,
};

const upgrades = [
  { id: 'shoes', name: 'Speed Shoes', cost: 25, tier: 1, desc: '+8% run speed', bought: 0, apply: () => state.speed *= 1.08 },
  { id: 'double', name: 'Jump Boost', cost: 40, tier: 2, desc: '+2 jump power', bought: 0, apply: () => state.jumpPower += 2 },
  { id: 'magnet', name: 'Coin Multiplier', cost: 60, tier: 3, desc: '+25% coins', bought: 0, apply: () => state.coinMultiplier += 0.25 },
  { id: 'shield', name: 'Shield', cost: 50, tier: 2, desc: '1 hit protection (10s)', bought: 0, apply: () => state.invulnUntil = performance.now() + 10000 },
];

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
      feedbackEl.textContent = `Correct! Purchased ${upgrade.name}.`;
      feedbackEl.className = 'feedback good';
      setTimeout(() => closeDialog(), 600);
    }
  } else {
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
    state.player.vy = -state.jumpPower;
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

function spawnObstacle() {
  const h = rand(24, 55);
  state.obstacles.push({ x: canvas.width + 20, y: 320 - h, w: rand(18, 30), h });
}
function spawnCoin() {
  state.pickups.push({ x: canvas.width + 20, y: rand(180, 290), r: 8 });
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
  const floorY = 320 - (p.sliding ? 28 : p.h);
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
      state.invulnUntil = performance.now() + 900;
      if (state.lives <= 0) {
        alert(`Game over! Distance: ${Math.floor(state.distance)}m`);
        Object.assign(state, { distance: 0, coins: 0, lives: 3, speed: 4, obstacles: [], pickups: [] });
      }
      break;
    }
  }

  state.pickups = state.pickups.filter((c) => {
    const hit = Math.hypot((c.x - (p.x + p.w / 2)), (c.y - (p.y + 18))) < 20;
    if (hit) state.coins += Math.round(1 * state.coinMultiplier);
    return !hit;
  });
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#6ec0ff';
  ctx.fillRect(0, 0, canvas.width, 220);
  ctx.fillStyle = '#6bbf59';
  ctx.fillRect(0, 320, canvas.width, 30);

  ctx.fillStyle = '#454d66';
  const p = state.player;
  ctx.fillRect(p.x, p.y, p.w, p.sliding ? 28 : p.h);

  ctx.fillStyle = '#9b3f2b';
  state.obstacles.forEach(o => ctx.fillRect(o.x, o.y, o.w, o.h));

  ctx.fillStyle = '#ffcf35';
  state.pickups.forEach(c => {
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
    ctx.fill();
  });

  if (state.paused) {
    ctx.fillStyle = 'rgba(0,0,0,.4)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText(dialog.open ? 'Math Time!' : 'Paused', canvas.width / 2 - 90, canvas.height / 2);
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

renderStore();
loop();
