import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, getBuild, move, usePower, shortestRouteLength, SIZE, LIMIT } from './game-core.mjs';

const nft = { id: 973, contract: '0xc96d31f8626c6d03fae5dcd3d61e3fb9f4a73763', attributes: [
  { trait_type: 'Aura', value: 'Fire' }, { trait_type: 'Eyes', value: 'Round Crying' }, { trait_type: 'Body', value: 'Black Trackset' }, { trait_type: 'Head', value: 'Russian Hat' }
] };
test('real Chog traits control gameplay build', () => {
  assert.deepEqual(getBuild(nft), { power: 'FIRESTORM', health: 5, energy: 4, vision: 3, aura: 'Fire', eyes: 'Round Crying', body: 'Black Trackset', head: 'Russian Hat' });
});
test('daily NFT map is deterministic and reachable', () => {
  const a = createGame(nft, '2026-10-22'), b = createGame(nft, '2026-10-22');
  assert.deepEqual(a.walls, b.walls);
  assert.equal(a.walls.length, 8);
  assert.equal(a.relics.length, 3);
  assert.equal(a.walls.every(w => Number(w.split(',')[0]) < SIZE), true);
  assert.notDeepEqual(a.walls, createGame({ ...nft, id: 533 }, '2026-10-22').walls);
});
test('moves and power spend turns without mutating original state', () => {
  const a = createGame(nft, '2026-10-22');
  const p = usePower(a);
  assert.equal(a.turns, 0);
  assert.equal(p.turns, 1);
  assert.equal(p.energy, a.energy - 1);
  const m = move(a, 1, 0);
  assert.equal(a.x, 0);
  assert.ok(m.turns === 0 || m.turns === 1);
});

function sandbox(power = 'FIRESTORM') {
  const game = createGame(nft, '2026-10-22');
  game.build.power = power;
  game.walls = [];
  game.traps = [];
  game.drones = [];
  game.relics = [{ x: 0, y: 6, found: false }, { x: 3, y: 3, found: false }, { x: 6, y: 0, found: false }];
  game.events = [];
  return game;
}

test('seeded maze is stable across trait order, distinct across identities, and has route slack', () => {
  for (const date of ['2026-10-22', '2026-10-23', '2026-11-05']) {
    for (let id = 1; id <= 120; id++) {
      const token = { ...nft, id };
      const game = createGame(token, date);
      assert.ok(shortestRouteLength(game.walls) <= LIMIT - 7, `${date} #${id} route too long`);
      assert.deepEqual(game.walls, createGame({ ...token, attributes: [...token.attributes].reverse() }, date).walls);
    }
  }
  assert.notDeepEqual(createGame(nft, '2026-10-22').walls, createGame(nft, '2026-10-23').walls);
});

test('Firestorm clears only nearby traps and stuns affected drones', () => {
  const game = sandbox();
  game.x = 2; game.y = 2;
  game.traps = ['2,3', '6,6'];
  game.drones = [{ id: 0, x: 3, y: 2, stunned: 0 }, { id: 1, x: 6, y: 6, stunned: 0 }];
  const next = usePower(game);
  assert.deepEqual(next.traps, ['6,6']);
  assert.ok(next.drones[0].stunned > 0);
  assert.equal(next.drones[1].stunned, 0);
  assert.deepEqual(next.events[0].clearedTraps, ['2,3']);
  assert.equal(next.powersUsed, 1);
  assert.equal(game.traps.length, 2);
});

test('Laser follows facing direction and stops at a wall', () => {
  const game = sandbox('LASER');
  game.x = 1; game.y = 1; game.face = [1, 0];
  game.walls = ['4,1']; game.traps = ['2,1', '5,1'];
  game.drones = [{ id: 0, x: 3, y: 1, stunned: 0 }];
  const next = usePower(game);
  assert.deepEqual(next.events[0].cells, ['2,1', '3,1']);
  assert.deepEqual(next.traps, ['5,1']);
  assert.ok(next.drones[0].stunned > 0);
});

test('Phase crosses an intermediate wall, clears landing trap, and rejects blocked landing', () => {
  const game = sandbox('PHASE');
  game.x = 1; game.y = 1; game.face = [1, 0];
  game.walls = ['2,1']; game.traps = ['3,1'];
  const next = usePower(game);
  assert.deepEqual([next.x, next.y], [3, 1]);
  assert.equal(next.traps.includes('3,1'), false);
  assert.equal(next.energy, game.energy - 1);
  assert.equal(next.events[0].type, 'power');
  game.walls.push('3,1');
  const blocked = usePower(game);
  assert.equal(blocked.turns, 0);
  assert.equal(blocked.energy, game.energy);
  assert.equal(blocked.events[0].type, 'blocked');
});

test('fragment collection recharges energy, trap and drone on one tile cause at most one hit', () => {
  const game = sandbox();
  game.x = 2; game.y = 3; game.energy = 0;
  game.traps = ['3,3'];
  game.drones = [{ id: 0, x: 3, y: 3, stunned: 0 }];
  const next = move(game, 1, 0);
  assert.equal(next.relics[1].found, true);
  assert.equal(next.energy, 1);
  assert.equal(next.hp, game.hp - 1);
  assert.equal(next.hits, 1);
  assert.deepEqual(next.events.map(event => event.type), ['damage', 'fragment']);
});

test('drones pursue every third turn and blocked actions do not consume a turn', () => {
  const game = sandbox();
  game.x = 1; game.y = 1;
  game.drones = [{ id: 0, x: 5, y: 5, stunned: 0 }];
  game.walls = ['2,1'];
  const blocked = move(game, 1, 0);
  assert.equal(blocked.turns, 0);
  assert.equal(blocked.events[0].type, 'blocked');
  const first = move(game, 0, 1);
  assert.deepEqual([first.drones[0].x, first.drones[0].y], [5, 5]);
  const second = move(first, 0, 1);
  assert.deepEqual([second.drones[0].x, second.drones[0].y], [5, 5]);
  const third = move(second, 0, 1);
  assert.notDeepEqual([third.drones[0].x, third.drones[0].y], [5, 5]);
  assert.strictEqual(move(game, 0, 0), game);
});

test('winning and both losing conditions produce truthful outcome events', () => {
  const win = sandbox();
  win.x = 5; win.y = 6; win.relics.forEach(relic => { relic.found = true; });
  const escaped = move(win, 1, 0);
  assert.equal(escaped.status, 'won');
  assert.ok(escaped.events.some(event => event.type === 'win'));
  const lowHp = sandbox(); lowHp.hp = 1; lowHp.traps = ['1,0'];
  const caught = move(lowHp, 1, 0);
  assert.equal(caught.status, 'lost');
  assert.ok(caught.events.some(event => event.reason === 'health'));
  const timed = sandbox(); timed.turns = LIMIT - 1;
  const expired = move(timed, 1, 0);
  assert.equal(expired.status, 'lost');
  assert.ok(expired.events.some(event => event.reason === 'turns'));
  assert.strictEqual(usePower(escaped), escaped);
});
