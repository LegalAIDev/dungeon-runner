/* ============================================================================
   shopItems.js — every weapon, armour, character, companion, consumable,
   math topic and world in the game. Pure data, no behaviour.
   ========================================================================== */

/* ---- Star Upgrades: bought with ⭐ Math Stars, all permanent --------------- */

const WEAPONS = [
  { id: 'wood_sword',  name: 'Wooden Sword', cost: 0,   damage: 10, gearScore: 10,
    range: 78,  desc: 'A trusty starter blade.' },
  { id: 'iron_sword',  name: 'Iron Sword',   cost: 60,  damage: 20, gearScore: 20,
    range: 84,  desc: 'Heavier steel hits harder.' },
  { id: 'fire_axe',    name: 'Fire Axe',     cost: 150, damage: 28, gearScore: 35,
    range: 100, aoe: 3, desc: 'Wide arc strikes up to 3 enemies.' },
  { id: 'magic_staff', name: 'Magic Staff',  cost: 280, damage: 22, gearScore: 40,
    range: 92,  ranged: true, desc: 'Fires a magic bolt across the arena.' },
  { id: 'dragon_blade',name: 'Dragon Blade', cost: 550, damage: 50, gearScore: 70,
    range: 96,  pierces: true, desc: 'Light attacks pierce enemy guard.' },
];

const ARMOR = [
  { id: 'cloth',        name: 'Cloth Armor',   cost: 0,   defense: 0,  gearScore: 0,
    desc: 'Barely better than nothing.' },
  { id: 'leather',      name: 'Leather Armor', cost: 80,  defense: 5,  gearScore: 15,
    desc: 'Light protection from blows.' },
  { id: 'chain_mail',   name: 'Chain Mail',    cost: 200, defense: 12, gearScore: 30,
    deflect: 0.10, desc: '10% chance to deflect a hit entirely.' },
  { id: 'dragon_scale', name: 'Dragon Scale',  cost: 500, defense: 22, gearScore: 55,
    autoBlock: true, desc: 'Auto-blocks the first hit of each wave.' },
];

const CHARACTERS = [
  { id: 'fighter', name: 'Fighter', cost: 0,   gearScore: 0,  bonusHp: 0,
    desc: 'Balanced and dependable.', passive: 'A solid all-rounder.' },
  { id: 'ninja',   name: 'Ninja',   cost: 150, gearScore: 15, bonusHp: 0, crit: 0.25,
    desc: '+25% critical hit chance.', passive: 'Strikes often land as crits.' },
  { id: 'wizard',  name: 'Wizard',  cost: 250, gearScore: 10, bonusHp: 0, labBonus: 1,
    desc: '+1 ⭐ per Quiz Lab answer.', passive: 'Learns faster in the Lab.' },
  { id: 'knight',  name: 'Knight',  cost: 400, gearScore: 20, bonusHp: 20, heavySpeed: 0.25,
    desc: '+1 heart, faster heavy attacks.', passive: 'Tanky and strong.' },
  { id: 'archer',   name: 'Archer',    cost: 350, gearScore: 20, bonusHp: 0, alwaysRanged: true,
    desc: 'All attacks are ranged shots.', passive: 'Fights from a safe distance.' },
  { id: 'warrior',  name: 'Warrior',   cost: 500, gearScore: 25, bonusHp: 10, crit: 0.15,
    desc: '+1 heart, +15% crit chance.', passive: 'Battle-hardened veteran.' },
  { id: 'king',     name: 'King',      cost: 650, gearScore: 30, bonusHp: 30,
    desc: '+2 hearts — maximum toughness.', passive: 'Royally hard to kill.' },
  { id: 'arcmage',  name: 'Arcmage',   cost: 600, gearScore: 20, bonusHp: 0, labBonus: 2, alwaysRanged: true,
    desc: '+2 ⭐ per Quiz Lab answer, ranged only.', passive: 'Scholar of the arcane.' },
  { id: 'ranger',   name: 'Ranger',    cost: 450, gearScore: 20, bonusHp: 0, crit: 0.20, alwaysRanged: true,
    desc: '+20% crit, attacks are ranged.', passive: 'Precise long-range shots.' },
  { id: 'berserker',name: 'Berserker', cost: 550, gearScore: 25, bonusHp: 0, crit: 0.30,
    desc: '+30% critical hit chance.', passive: 'Wild and devastating strikes.' },
  { id: 'striker',  name: 'Striker',   cost: 400, gearScore: 20, bonusHp: 0, crit: 0.10,
    desc: '+10% crit, fast combo style.', passive: 'Never stops attacking.' },
  { id: 'duelist',  name: 'Duelist',   cost: 480, gearScore: 22, bonusHp: 0, crit: 0.18,
    desc: '+18% crit, elegant fighter.', passive: 'Precision over brute force.' },
];

const COMPANIONS = [
  { id: 'owl',    name: 'Wise Owl',    cost: 200, gearScore: 10,
    desc: 'Start each level with a Shield Potion.' },
  { id: 'dragon', name: 'Baby Dragon', cost: 450, gearScore: 15, coinBonus: 0.25,
    desc: '+25% coins from every enemy.' },
  { id: 'golem',  name: 'Math Golem',  cost: 700, gearScore: 20, labBonus: 2,
    desc: '+2 ⭐ on every Quiz Lab answer.' },
];

/* ---- Coin Shop: bought with 💰 coins, consumable -------------------------- */

const CONSUMABLES = [
  { id: 'shield', name: 'Shield Potion', cost: 50,  effect: 'blockHit',
    desc: 'Blocks one enemy hit — no HP loss.' },
  { id: 'revive', name: 'Revive Token',  cost: 200, effect: 'revive',
    desc: 'Continue the level once after falling.' },
  { id: 'magnet', name: 'Coin Magnet',   cost: 80,  effect: 'magnet', duration: 30,
    desc: 'Auto-collects coins for 30 seconds.' },
  { id: 'speed',  name: 'Speed Boost',   cost: 100, effect: 'speed', duration: 20,
    desc: '+50% movement speed for 20 seconds.' },
  { id: 'bomb',   name: 'Bomb',          cost: 150, effect: 'bomb',
    desc: 'Clears every enemy on screen — one use.' },
];

/* ---- Quiz Lab topics (defined in content.js, admin-editable) ------------- */

const MATH_TOPICS = QUIZ_CONTENT.topics;

/* ---- Worlds and levels --------------------------------------------------- */

const WORLDS = [
  { id: 'forest', name: 'Goblin Forest', biome: 0, starGate: 0,
    enemies: ['goblin', 'skeleton', 'mushroom'], boss: 'goblin_king',
    recommend: 'Gear 10 – 55' },
  { id: 'desert', name: 'Orc Desert',    biome: 1, starGate: 80,
    enemies: ['orc', 'mage', 'armored', 'fire_worm'], boss: 'orc_warchief',
    recommend: 'Gear 35 – 120' },
  { id: 'ice',    name: 'Troll Ice Cave',biome: 2, starGate: 220,
    enemies: ['troll', 'flying_eye', 'armored', 'skeleton'], boss: 'frost_troll',
    recommend: 'Gear 80 – 160' },
  { id: 'castle', name: 'Dragon Castle', biome: 3, starGate: 500,
    enemies: ['shadow', 'armored', 'troll', 'mage'], boss: 'dragon_lord',
    recommend: 'Gear 160 – 225' },
];

/* Comfortable / brutal / locked gear thresholds, indexed by world id. */
const WORLD_GEAR_THRESHOLDS = {
  forest: { comfortable: 10,  brutal: 5   },
  desert: { comfortable: 35,  brutal: 20  },
  ice:    { comfortable: 80,  brutal: 55  },
  castle: { comfortable: 160, brutal: 120 },
};

/* Five levels per world. Level 5 (index 4) is always a boss fight. */
const LEVELS_PER_WORLD = 5;

/* Wave count for each level index (0-3 standard, 4 = boss). */
const LEVEL_WAVES = [2, 3, 3, 4, 1];

/* Looks an item up in any of the upgrade lists. */
function findItem(list, id) {
  for (let i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
  return null;
}
