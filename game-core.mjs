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
function shuffle(random, values) {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Minimum walking turns to collect every fragment and reach extraction.
export function shortestRouteLength(walls) {
  const blocked = new Set(walls);
  const targets = new Map(relicSpots.map((spot, i) => [key(...spot), 1 << i]));
  const queue = [[0, 0, 0, 0]], seen = new Set(['0,0,0']);
  for (let index = 0; index < queue.length; index++) {
    const [x, y, mask, steps] = queue[index];
    if (x === 6 && y === 6 && mask === 7) return steps;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, cell = key(nx, ny);
      if (nx < 0 || ny < 0 || nx >= SIZE || ny >= SIZE || blocked.has(cell)) continue;
      const nextMask = mask | (targets.get(cell) || 0);
      const state = `${cell},${nextMask}`;
      if (!seen.has(state)) { seen.add(state); queue.push([nx, ny, nextMask, steps + 1]); }
    }
  }
  return Infinity;
}
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
  const identity = `${nft.contract}:${nft.id}:${[...(nft.attributes || [])].map(a => a.trait_type + '=' + a.value).sort().join('|')}`;
  const random = rng(hash(`${utcDate}:${identity}`));
  const reserved = new Set(['0,0', '6,6', ...relicSpots.map(p => key(...p))]);
  const cells = [];
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) if (!reserved.has(key(x, y))) cells.push(key(x, y));
  let walls = [];
  for (let attempt = 0; attempt < 300; attempt++) {
    const candidate = shuffle(random, cells).slice(0, 8);
    if (shortestRouteLength(candidate) <= 38) { walls = candidate; break; }
  }
  // A fully open board is preferable to an unfinishable daily challenge.
  if (!walls.length) walls = [];
  const free = cells.filter(c => !walls.includes(c));
  const traps = shuffle(random, free.filter(c => !['1,0', '0,1'].includes(c))).slice(0, 7);
  const droneCells = shuffle(random, free.filter(c => !traps.includes(c) && !['1,0', '0,1'].includes(c) && c.split(',').map(Number).reduce((a, b) => a + b, 0) >= 5));
  const drones = droneCells.slice(0, 2).map((spot, i) => ({ x: Number(spot.split(',')[0]), y: Number(spot.split(',')[1]), stunned: 0, id: i }));
  const build = getBuild(nft);
  return { nft, date: utcDate, seed: hash(`${utcDate}:${identity}`), build, walls, traps, drones, relics: relicSpots.map(([x, y]) => ({ x, y, found: false })), x: 0, y: 0, face: [1, 0], hp: build.health, energy: build.energy, turns: 0, status: 'playing', log: 'Find three signal fragments. Reach the exit.', revealed: [], hits: 0, grace: 0, powersUsed: 0, events: [] };
}

function inside(x, y, game) { return x >= 0 && y >= 0 && x < SIZE && y < SIZE && !game.walls.includes(key(x, y)); }
function resolveTurn(game) {
  game.turns++;
  if (game.grace > 0) game.grace--;
  const spot = key(game.x, game.y);
  let damaged = false;
  if (game.traps.includes(spot)) {
    game.traps = game.traps.filter(c => c !== spot);
    if (game.grace === 0) {
      game.hp--; game.hits++; game.grace = 3; damaged = true;
      game.events.push({ type: 'damage', source: 'trap', cells: [spot], hp: game.hp });
      game.log = 'TRAP! One heart lost. Brief shield active.';
    } else { game.events.push({ type: 'shield', cells: [spot] }); game.log = 'Shield absorbed a trap.'; }
  }
  for (const relic of game.relics) if (!relic.found && relic.x === game.x && relic.y === game.y) {
    relic.found = true;
    game.energy = Math.min(game.build.energy, game.energy + 1);
    game.events.push({ type: 'fragment', cells: [spot] });
    game.log = 'Signal fragment acquired. Power recharged.';
  }
  if (game.x === 6 && game.y === 6 && game.relics.every(r => r.found)) {
    game.status = 'won'; game.events.push({ type: 'win', cells: [spot] }); game.log = 'Extraction complete. Your Chog rewrote the signal.'; return game;
  }
  if (game.turns % 3 === 0) {
    for (const drone of game.drones) {
      if (drone.stunned > 0) { drone.stunned--; continue; }
      const options = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => [drone.x + dx, drone.y + dy]).filter(([x, y]) => inside(x, y, game));
      options.sort((a, b) => (Math.abs(a[0] - game.x) + Math.abs(a[1] - game.y)) - (Math.abs(b[0] - game.x) + Math.abs(b[1] - game.y)));
      if (options[0]) [drone.x, drone.y] = options[0];
    }
  }
  if (game.drones.some(d => d.x === game.x && d.y === game.y && !d.stunned)) {
    if (!damaged && game.grace === 0) { game.hp--; game.hits++; game.grace = 3; game.events.push({ type: 'damage', source: 'drone', cells: [spot], hp: game.hp }); }
    else if (!damaged) game.events.push({ type: 'shield', cells: [spot] });
    game.log = damaged ? 'TRAP AND DRONE! One heart lost this turn.' : game.events.some(event => event.type === 'shield') ? 'Shield absorbed a drone hit.' : 'DRONE COLLISION! One heart lost. Brief shield active.';
    for (const d of game.drones) if (d.x === game.x && d.y === game.y) d.stunned = 2;
  }
  if (game.hp <= 0 || game.turns >= LIMIT) { game.status = 'lost'; game.events.push({ type: 'loss', reason: game.hp <= 0 ? 'health' : 'turns', cells: [spot] }); game.log = game.hp <= 0 ? 'Your Chog was caught. Retry this route.' : 'The signal closed. Retry this route.'; }
  return game;
}

export function move(game, dx, dy) {
  if (game.status !== 'playing' || Math.abs(dx) + Math.abs(dy) !== 1) return game;
  const next = structuredClone(game);
  next.events = [];
  next.face = [dx, dy];
  if (!inside(next.x + dx, next.y + dy, next)) { next.events.push({ type: 'blocked', cells: [key(next.x + dx, next.y + dy)] }); next.log = 'Blocked. Find another path.'; return next; }
  next.x += dx; next.y += dy; next.log = 'Keep moving. The drones follow every third turn.';
  return resolveTurn(next);
}

export function usePower(game) {
  if (game.status !== 'playing' || game.energy <= 0) return game;
  const next = structuredClone(game);
  next.events = [];
  const { power } = next.build;
  let cells = [], clearedTraps = [], stunnedDrones = [];
  if (power === 'PHASE') {
    const [dx, dy] = next.face, x = next.x + dx * 2, y = next.y + dy * 2;
    if (!inside(x, y, next)) { next.events.push({ type: 'blocked', cells: [key(x, y)] }); next.log = 'Phase needs an open landing tile two spaces ahead.'; return next; }
    const from = key(next.x, next.y);
    next.x = x; next.y = y;
    const landing = key(x, y);
    cells = [from, key(next.x - dx, next.y - dy), landing];
    clearedTraps = next.traps.filter(c => c === landing);
    next.traps = next.traps.filter(c => c !== landing);
    next.log = 'PHASE! You slip through the hazard.';
  } else if (power === 'FIRESTORM') {
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) if (Math.abs(x - next.x) + Math.abs(y - next.y) <= 2) cells.push(key(x, y));
    clearedTraps = next.traps.filter(c => cells.includes(c));
    next.traps = next.traps.filter(c => !cells.includes(c));
    next.drones.forEach(d => { if (cells.includes(key(d.x, d.y))) { d.stunned = 3; stunnedDrones.push(d.id); } });
    next.log = 'FIRESTORM! Nearby traps burn out; drones freeze.';
  } else {
    const [dx, dy] = next.face;
    for (let step = 1; step <= 3; step++) {
      const x = next.x + dx * step, y = next.y + dy * step;
      if (x < 0 || y < 0 || x >= SIZE || y >= SIZE || next.walls.includes(key(x, y))) break;
      cells.push(key(x, y));
    }
    clearedTraps = next.traps.filter(c => cells.includes(c));
    next.traps = next.traps.filter(c => !cells.includes(c));
    next.drones.forEach(d => { if (cells.includes(key(d.x, d.y))) { d.stunned = 3; stunnedDrones.push(d.id); } });
    next.log = 'LASER! The lane is clear.';
  }
  next.events.push({ type: 'power', power, cells, clearedTraps, stunnedDrones });
  next.energy--;
  next.powersUsed++;
  return resolveTurn(next);
}

export function visible(game, x, y) { return Math.abs(x - game.x) + Math.abs(y - game.y) <= game.build.vision || game.revealed.includes(key(x, y)); }
export function score(game) { return game.status === 'won' ? Math.max(0, 1500 - game.turns * 20 - game.hits * 140 + game.energy * 40) : 0; }
