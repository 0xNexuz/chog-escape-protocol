import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, move, usePower, LIMIT } from './game-core.mjs';

const distance = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
function remainingWalk(game) {
  const targets = game.relics.filter(relic => !relic.found).map(relic => [relic.x, relic.y]);
  function route(from, left) {
    if (!left.length) return distance(from, [6, 6]);
    return Math.min(...left.map((target, index) => distance(from, target) + route(target, left.filter((_, i) => i !== index))));
  }
  return route([game.x, game.y], targets);
}

function stateKey(game) {
  return [game.x, game.y, game.relics.map(r => r.found ? 1 : 0).join(''), game.hp, game.energy, game.grace,
    game.turns % 3, game.drones.map(d => `${d.x}${d.y}${d.stunned}`).join(''), game.traps.join('|')].join(':');
}

function findLegalWin(initial) {
  let states = [initial];
  for (let turn = 0; turn < LIMIT; turn++) {
    const nextStates = new Map();
    for (const state of states) {
      for (const result of [move(state, 1, 0), move(state, -1, 0), move(state, 0, 1), move(state, 0, -1), usePower(state)]) {
        if (result.turns === state.turns || result.status === 'lost') continue;
        if (result.status === 'won') return result;
        if (result.turns + remainingWalk(result) > LIMIT) continue;
        const key = stateKey(result);
        const previous = nextStates.get(key);
        if (!previous || result.hits < previous.hits) nextStates.set(key, result);
      }
    }
    states = [...nextStates.values()]
      .sort((a, b) => (remainingWalk(a) + a.hits * 6 - a.energy) - (remainingWalk(b) + b.hits * 6 - b.energy))
      .slice(0, 1200);
    if (!states.length) break;
  }
  return null;
}

test('representative Firestorm, Laser, and Phase mazes have a legal dynamic win', { timeout: 240000 }, () => {
  for (const date of ['2026-10-23']) {
    for (const ability of ['FIRESTORM', 'LASER', 'PHASE']) {
      for (const id of [1, 7, 23]) {
        const nft = { contract: '0xc96d31f8626c6d03fae5dcd3d61e3fb9f4a73763', id, attributes: [
          { trait_type: 'Aura', value: ability === 'FIRESTORM' ? 'Fire' : 'None' },
          { trait_type: 'Eyes', value: ability === 'LASER' ? 'cyan laser' : 'Round' },
          { trait_type: 'Body', value: 'Trackset' },
          { trait_type: 'Head', value: 'Hat' }
        ] };
        const game = createGame(nft, date);
        const result = findLegalWin(game);
        assert.ok(result, `${date} ${ability} #${id} has no found legal win`);
        assert.ok(result.turns <= LIMIT, `${date} ${ability} #${id} took too many turns`);
      }
    }
  }
});
