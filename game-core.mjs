export const SIZE = 7;
export const LIMIT = 45;
const relicSpots = [[0, 6], [3, 3], [6, 0]];
const key = (x, y) => `${x},${y}`;

function hash(input) {
  let n = 2166136261;
  for (const char of input) { n ^= char.charCodeAt(0); n = Math.imul(n, 16777619); }
  return n >>> 0;
}
function rng(seed) {
  let state = seed || 1;
  return () => { state += 0x6D2B79F5; let t = state; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
function reachable(walls, from, to) {
  const queue = [from], seen = new Set([key(...from)]);
  while (queue.length) {
    const [x, y] = queue.shift();
    if (x === to[0] && y === to[1]) return true;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, k = key(nx, ny);
      if (nx >= 0 && ny >= 0 && nx < SIZE && ny < SIZE && !walls.includes(k) && !seen.has(k)) { seen.add(k); queue.push([nx, ny]); }
    }
  }
  return false;
}
const pick = (random, array) => array[Math.floor(random() * array.length)];
const trait = (nft, name) => nft.attributes?.find(a => a.trait_type === name)?.value || 'None';

export function getBuild(nft) {
  const aura = trait(nft, 'Aura').toLowerCase();
  const eyes = trait(nft, 'Eyes').toLowerCase();
  const body = trait(nft, 'Body').toLowerCase();
  const head = trait(nft, 'Head').toLowerCase();
  const power = aura.includes('fire') ? 'FIRESTORM' : eyes.includes('laser') ? 'LASER' : 'PHASE';
  const health = /vest|armor|trackset|suit/.test(body) ? 5 : 4;
  const energy = /wizard|crown|hat/.test(head) ? 4 : 3;
  const vision = /laser|vertical|round/.test(eyes) ? 3 : 2;
  return { power, health, energy, vision, aura: trait(nft, 'Aura'), eyes: trait(nft, 'Eyes'), body: trait(nft, 'Body'), head: trait(nft, 'Head') };
}

export function createGame(nft, utcDate = new Date().toISOString().slice(0, 10)) {
  const identity = `${nft.contract}:${nft.id}:${nft.attributes.map(a => a.trait_type + '=' + a.value).join('|')}`;
  const random = rng(hash(`${utcDate}:${identity}`));
  const reserved = new Set(['0,0', '6,6', ...relicSpots.map(p => key(...p))]);
  const cells = [];
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) if (!reserved.has(key(x, y))) cells.push(key(x, y));
  let walls = [];
  for (let attempt = 0; attempt < 100; attempt++) {
    walls = [...cells].sort(() => random() - 0.5).slice(0, 8);
    if (relicSpots.every(p => reachable(walls, [0, 0], p)) && reachable(walls, [0, 0], [6, 6])) break;
  }
  const free = cells.filter(c => !walls.includes(c));
  const traps = [...free].sort(() => random() - 0.5).slice(0, 7);
  const droneCells = free.filter(c => !traps.includes(c) && c !== '1,0' && c !== '0,1');
  const drones = [pick(random, droneCells), pick(random, droneCells)].map((spot, i) => ({ x: Number(spot.split(',')[0]), y: Number(spot.split(',')[1]), stunned: 0, id: i }));
  const build = getBuild(nft);
  return { nft, date: utcDate, seed: hash(`${utcDate}:${identity}`), build, walls, traps, drones, relics: relicSpots.map(([x, y]) => ({ x, y, found: false })), x: 0, y: 0, face: [1, 0], hp: build.health, energy: build.energy, turns: 0, status: 'playing', log: 'Find three signal fragments. Reach the exit.', revealed: [], hits: 0 };
}

function inside(x, y, game) { return x >= 0 && y >= 0 && x < SIZE && y < SIZE && !game.walls.includes(key(x, y)); }
function resolveTurn(game) {
  game.turns++;
  const spot = key(game.x, game.y);
  if (game.traps.includes(spot)) {
    game.traps = game.traps.filter(c => c !== spot);
    game.hp--; game.hits++;
    game.log = 'TRAP! One heart lost.';
  }
  for (const relic of game.relics) if (!relic.found && relic.x === game.x && relic.y === game.y) {
    relic.found = true;
    game.energy = Math.min(game.build.energy, game.energy + 1);
    game.log = 'Signal fragment acquired. Power recharged.';
  }
  if (game.x === 6 && game.y === 6 && game.relics.every(r => r.found)) {
    game.status = 'won'; game.log = 'Extraction complete. Your Chog rewrote the signal.'; return game;
  }
  if (game.turns % 2 === 0) {
    for (const drone of game.drones) {
      if (drone.stunned > 0) { drone.stunned--; continue; }
      const options = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => [drone.x + dx, drone.y + dy]).filter(([x, y]) => inside(x, y, game));
      options.sort((a, b) => (Math.abs(a[0] - game.x) + Math.abs(a[1] - game.y)) - (Math.abs(b[0] - game.x) + Math.abs(b[1] - game.y)));
      if (options[0]) [drone.x, drone.y] = options[0];
    }
  }
  if (game.drones.some(d => d.x === game.x && d.y === game.y && !d.stunned)) {
    game.hp--; game.hits++; game.log = 'DRONE COLLISION! One heart lost.';
    for (const d of game.drones) if (d.x === game.x && d.y === game.y) d.stunned = 2;
  }
  if (game.hp <= 0 || game.turns >= LIMIT) { game.status = 'lost'; game.log = game.hp <= 0 ? 'Your Chog was caught. Retry this route.' : 'The signal closed. Retry this route.'; }
  return game;
}

export function move(game, dx, dy) {
  if (game.status !== 'playing' || Math.abs(dx) + Math.abs(dy) !== 1) return game;
  const next = structuredClone(game);
  next.face = [dx, dy];
  if (!inside(next.x + dx, next.y + dy, next)) { next.log = 'Blocked. Find another path.'; return next; }
  next.x += dx; next.y += dy; next.log = 'Keep moving. The drones follow every other turn.';
  return resolveTurn(next);
}

export function usePower(game) {
  if (game.status !== 'playing' || game.energy <= 0) return game;
  const next = structuredClone(game);
  const { power } = next.build;
  if (power === 'PHASE') {
    const [dx, dy] = next.face, x = next.x + dx * 2, y = next.y + dy * 2;
    if (!inside(x, y, next)) { next.log = 'Phase needs an open landing tile two spaces ahead.'; return next; }
    next.x = x; next.y = y;
    next.traps = next.traps.filter(c => c !== key(x, y));
    next.log = 'PHASE! You slip through the hazard.';
  } else if (power === 'FIRESTORM') {
    next.traps = next.traps.filter(c => { const [x, y] = c.split(',').map(Number); return Math.abs(x - next.x) + Math.abs(y - next.y) > 2; });
    next.drones.forEach(d => { if (Math.abs(d.x - next.x) + Math.abs(d.y - next.y) <= 2) d.stunned = 3; });
    next.log = 'FIRESTORM! Nearby traps burn out; drones freeze.';
  } else {
    const [dx, dy] = next.face;
    next.traps = next.traps.filter(c => { const [x, y] = c.split(',').map(Number); return !((dx && y === next.y && (x - next.x) * dx > 0 && Math.abs(x - next.x) <= 3) || (dy && x === next.x && (y - next.y) * dy > 0 && Math.abs(y - next.y) <= 3)); });
    next.drones.forEach(d => { if ((dx && d.y === next.y && (d.x - next.x) * dx > 0 && Math.abs(d.x - next.x) <= 3) || (dy && d.x === next.x && (d.y - next.y) * dy > 0 && Math.abs(d.y - next.y) <= 3)) d.stunned = 3; });
    next.log = 'LASER! The lane is clear.';
  }
  next.energy--;
  return resolveTurn(next);
}

export function visible(game, x, y) { return Math.abs(x - game.x) + Math.abs(y - game.y) <= game.build.vision || game.revealed.includes(key(x, y)); }
export function score(game) { return game.status === 'won' ? Math.max(0, 1500 - game.turns * 20 - game.hits * 140 + game.energy * 40) : 0; }
