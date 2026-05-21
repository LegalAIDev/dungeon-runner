/* ============================================================================
   mathProblems.js — generates the grade-5 math problems used in the shop.

   MathProblems.generate(tier) returns:
     { q, answer, choices, hint, topic }
   where q/answer/choices are display strings, choices has 4 entries (one is the
   answer), and tier 1 is easiest, tier 3 is the most challenging.
   ========================================================================== */

const MathProblems = (function () {
  /* --- small helpers ------------------------------------------------------ */
  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
  /* tidy number → string ("10", "6.1", not "6.1000001") */
  function fmtNum(x) {
    return String(Math.round(x * 1000) / 1000);
  }

  /* builds the 4 answer buttons: the correct answer plus 3 unique distractors */
  function buildChoices(answer, distractors) {
    const out = [];
    const seen = new Set([answer]);
    for (const d of distractors) {
      const s = String(d);
      if (out.length >= 3) break;
      if (s !== answer && !seen.has(s)) { seen.add(s); out.push(s); }
    }
    let pad = 1;
    while (out.length < 3) {
      const guess = isNaN(Number(answer))
        ? answer + ' '.repeat(pad)
        : String(Number(answer) + pad);
      if (!seen.has(guess)) { seen.add(guess); out.push(guess); }
      pad++;
    }
    return shuffle([answer, ...out]);
  }

  /* distractors for a whole-number answer */
  function intChoices(answer) {
    const c = [answer + 1, answer - 1, answer + 2, answer - 2,
               answer + 5, answer - 5, answer + 10, answer - 10, answer + 3];
    return buildChoices(String(answer), shuffle(c.filter((x) => x >= 0)));
  }
  /* distractors for a decimal answer (includes a place-value style mistake) */
  function decChoices(answer) {
    const c = [answer + 0.1, answer - 0.1, answer + 1, answer - 1,
               answer + 0.2, answer * 10, answer / 10, answer + 2];
    return buildChoices(fmtNum(answer), shuffle(c.filter((x) => x > 0).map(fmtNum)));
  }
  /* distractors for a "round number" answer (multiples of step) */
  function stepChoices(answer, step) {
    const c = [answer + step, answer - step, answer + 2 * step, answer - 2 * step];
    return buildChoices(String(answer), shuffle(c.filter((x) => x >= 0)));
  }

  /* ======================  TIER 1  — warm-up  ============================ */
  function gAddition() {
    const a = randInt(125, 875), b = randInt(125, 875);
    return { q: `${a} + ${b}`, answer: String(a + b), choices: intChoices(a + b),
      hint: 'Add the ones, then the tens, then the hundreds.', topic: 'Addition' };
  }
  function gSubtraction() {
    const a = randInt(430, 980), b = randInt(110, a - 120);
    return { q: `${a} − ${b}`, answer: String(a - b), choices: intChoices(a - b),
      hint: 'Stack the numbers and subtract, borrowing when you need to.',
      topic: 'Subtraction' };
  }
  function gMultFact() {
    const a = randInt(6, 12), b = randInt(4, 12);
    return { q: `${a} × ${b}`, answer: String(a * b), choices: intChoices(a * b),
      hint: `Skip-count by ${a}, ${b} times.`, topic: 'Multiplication' };
  }
  function gRounding() {
    const n = randInt(12, 88) * 100 + pick([randInt(1, 49), randInt(51, 99)]);
    const ans = Math.round(n / 100) * 100;
    return { q: `Round ${n.toLocaleString()} to the nearest hundred`,
      answer: String(ans), choices: stepChoices(ans, 100),
      hint: 'Look at the tens digit — 5 or more rounds up.', topic: 'Rounding' };
  }

  /* ======================  TIER 2  — build-up  =========================== */
  function gMult2() {
    const a = randInt(12, 39), b = randInt(3, 9);
    return { q: `${a} × ${b}`, answer: String(a * b), choices: intChoices(a * b),
      hint: `Multiply ${b} by the ones, then ${b} by the tens, and add.`,
      topic: 'Multiplication' };
  }
  function gDivision() {
    const b = randInt(3, 9), quot = randInt(4, 15);
    return { q: `${b * quot} ÷ ${b}`, answer: String(quot), choices: intChoices(quot),
      hint: `How many groups of ${b} fit inside ${b * quot}?`, topic: 'Division' };
  }
  function gRemainder() {
    const b = randInt(3, 9), quot = randInt(3, 11), r = randInt(1, b - 1);
    const a = b * quot + r;
    const pool = [];
    for (let i = 0; i < b; i++) if (i !== r) pool.push(i);
    pool.push(b, quot);
    return { q: `The remainder of ${a} ÷ ${b}`, answer: String(r),
      choices: buildChoices(String(r), shuffle(pool).map(String)),
      hint: `${b} × ${quot} = ${b * quot}. How much more reaches ${a}?`,
      topic: 'Remainders' };
  }
  function gDecimalAddSub() {
    let a = randInt(15, 95) / 10, b = randInt(12, 80) / 10;
    const add = Math.random() < 0.5;
    if (!add && b > a) { const t = a; a = b; b = t; }
    const ans = add ? a + b : a - b;
    return { q: `${fmtNum(a)} ${add ? '+' : '−'} ${fmtNum(b)}`,
      answer: fmtNum(ans), choices: decChoices(ans),
      hint: 'Line up the decimal points before adding or subtracting.',
      topic: 'Decimals' };
  }
  function gPerimeter() {
    const w = randInt(3, 18), h = randInt(3, 18), ans = 2 * (w + h);
    return { q: `Perimeter of a ${w} cm by ${h} cm rectangle`, answer: `${ans} cm`,
      choices: buildChoices(`${ans} cm`,
        [`${w * h} cm`, `${w + h} cm`, `${ans + 2} cm`, `${ans - 2} cm`, `${ans + 6} cm`]),
      hint: 'Perimeter is the distance all the way around — add every side.',
      topic: 'Perimeter' };
  }

  /* ======================  TIER 3  — challenge  ========================== */
  function gFractionLike() {
    const d = randInt(4, 10);
    const x = randInt(1, d - 2), y = randInt(1, d - 1 - x);
    const ans = `${x + y}/${d}`;
    return { q: `${x}/${d} + ${y}/${d}`, answer: ans,
      choices: buildChoices(ans,
        [`${x + y}/${d + d}`, `${x + y + 1}/${d}`, `${Math.max(1, x + y - 1)}/${d}`,
         `${x * y}/${d}`, `${x + y}/${d + 1}`]),
      hint: 'Same bottom number: add the tops, keep the bottom.', topic: 'Fractions' };
  }
  const UNLIKE = [
    { q: '1/2 + 1/4', a: '3/4', d: ['2/6', '1/8', '5/4', '1/2'] },
    { q: '1/2 + 1/8', a: '5/8', d: ['2/10', '3/8', '4/8', '6/8'] },
    { q: '1/3 + 1/6', a: '1/2', d: ['2/9', '1/9', '2/6', '3/9'] },
    { q: '1/4 + 1/8', a: '3/8', d: ['2/12', '4/8', '5/8', '2/8'] },
    { q: '2/3 + 1/6', a: '5/6', d: ['3/9', '3/6', '4/6', '6/9'] },
    { q: '1/2 + 1/3', a: '5/6', d: ['2/5', '2/6', '3/6', '4/6'] },
    { q: '3/4 + 1/8', a: '7/8', d: ['4/12', '6/8', '5/8', '8/8'] },
    { q: '1/5 + 3/10', a: '1/2', d: ['4/15', '2/10', '3/10', '4/10'] },
    { q: '1/2 + 2/8', a: '3/4', d: ['3/10', '3/8', '5/8', '2/4'] },
  ];
  function gFractionUnlike() {
    const p = pick(UNLIKE);
    return { q: p.q, answer: p.a, choices: buildChoices(p.a, shuffle(p.d.slice())),
      hint: 'Give both fractions the same bottom number, then add the tops.',
      topic: 'Fractions' };
  }
  function gOrderOfOps() {
    const form = pick(['a+b*c', 'a*b+c', '(a+b)*c', 'a*b-c']);
    const a = randInt(2, 9), b = randInt(2, 9), c = randInt(2, 9);
    let q, ans, trap;
    if (form === 'a+b*c') { q = `${a} + ${b} × ${c}`; ans = a + b * c; trap = (a + b) * c; }
    else if (form === 'a*b+c') { q = `${a} × ${b} + ${c}`; ans = a * b + c; trap = a * (b + c); }
    else if (form === '(a+b)*c') { q = `(${a} + ${b}) × ${c}`; ans = (a + b) * c; trap = a + b * c; }
    else { q = `${a} × ${b} − ${c}`; ans = a * b - c; trap = a * (b - c); }
    const distract = [];
    if (trap !== ans && trap >= 0) distract.push(String(trap));
    intChoices(ans).forEach((x) => distract.push(x));
    return { q, answer: String(ans), choices: buildChoices(String(ans), distract),
      hint: 'Do brackets first, then × and ÷, and finally + and −.',
      topic: 'Order of Operations' };
  }
  const DEC_MUL = [[0.5, 7], [2.5, 4], [1.5, 6], [0.6, 8], [3.2, 3], [1.2, 5],
                   [0.4, 9], [2.4, 5], [0.25, 8], [1.5, 4], [0.8, 6], [3.5, 2]];
  function gDecimalMul() {
    const [d, w] = pick(DEC_MUL);
    const ans = Math.round(d * w * 1000) / 1000;
    return { q: `${fmtNum(d)} × ${w}`, answer: fmtNum(ans),
      choices: buildChoices(fmtNum(ans),
        [fmtNum(d * w * 10), fmtNum(Math.round(d) * w), fmtNum(ans + 1),
         fmtNum(ans - 1), fmtNum(ans + 0.5)]),
      hint: 'Multiply as whole numbers, then put the decimal point back.',
      topic: 'Decimals' };
  }
  function gArea() {
    const w = randInt(3, 16), h = randInt(3, 16), ans = w * h;
    return { q: `Area of a ${w} m by ${h} m rectangle`, answer: `${ans} m²`,
      choices: buildChoices(`${ans} m²`,
        [`${2 * (w + h)} m²`, `${w + h} m²`, `${ans + w} m²`,
         `${Math.max(1, ans - h)} m²`, `${ans + 10} m²`]),
      hint: 'Area of a rectangle = length × width.', topic: 'Area' };
  }
  const WORD = [
    (r) => { const rows = r(4, 8), per = r(6, 9);
      return { q: `A classroom has ${rows} rows of ${per} desks. How many desks in all?`,
        n: rows * per, hint: 'Rows × desks in each row.' }; },
    (r) => { const each = r(3, 9), groups = 4, total = each * groups;
      return { q: `${total} stickers are shared equally by ${groups} friends. How many each?`,
        n: each, hint: 'Sharing equally means divide.' }; },
    (r) => { const price = r(3, 9), num = r(3, 7);
      return { q: `Pencils cost ${price} coins each. What is the cost of ${num} pencils?`,
        n: price * num, hint: 'Cost of one × how many you buy.' }; },
    (r) => { const start = r(45, 95), spent = r(12, 38);
      return { q: `You have ${start} coins and spend ${spent}. How many are left?`,
        n: start - spent, hint: '"Left" tells you to subtract.' }; },
    (r) => { const a = r(150, 480), b = r(150, 480);
      return { q: `A team scored ${a} points, then ${b} more. How many points total?`,
        n: a + b, hint: '"Total" means add the amounts together.' }; },
  ];
  function gWord() {
    const w = pick(WORD)(randInt);
    return { q: w.q, answer: String(w.n), choices: intChoices(w.n),
      hint: w.hint, topic: 'Word Problem' };
  }

  const TIERS = {
    1: [gAddition, gSubtraction, gMultFact, gRounding],
    2: [gMult2, gDivision, gRemainder, gDecimalAddSub, gPerimeter],
    3: [gFractionLike, gFractionUnlike, gOrderOfOps, gDecimalMul, gArea, gWord],
  };

  return {
    generate(tier) {
      const t = (tier >= 1 && tier <= 3) ? tier : 1;
      return pick(TIERS[t])();
    },
  };
})();
