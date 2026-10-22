import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, getBuild, move, usePower, SIZE } from './game-core.mjs';

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
