import test from 'node:test';
import assert from 'node:assert/strict';
import { addRecord, dailyBest, earnedBadges, progressKey, recordFromGame, shareText, successfulStreak } from './progress.mjs';

const nft = { id: 973, contract: '0xc96d31f8626c6d03fae5dcd3d61e3fb9f4a73763', name: 'CHOG #465' };
const won = (date, ability = 'FIRESTORM', extra = {}) => ({ tokenId: 973, date, mode: 'preview', status: 'won', turns: 29, score: 900, fragments: 3, hits: 0, ability, powersUsed: 1, ...extra });

test('completed game records include real state and distinct storage modes', () => {
  const game = { nft, date: '2026-10-22', status: 'won', turns: 30, hits: 0, energy: 2, powersUsed: 1, build: { power: 'FIRESTORM' }, relics: [{ found: true }, { found: true }, { found: true }] };
  const record = recordFromGame(game, 'preview');
  assert.equal(record.fragments, 3);
  assert.equal(record.score, 980);
  assert.notEqual(progressKey(nft, 'preview'), progressKey(nft, 'verified'));
  assert.notEqual(progressKey(nft, 'preview'), progressKey(nft, 'sample'));
  assert.match(shareText(recordFromGame(game, 'sample'), nft, 'https://example.com'), /SAMPLE DATA \/ PREVIEW/);
  assert.equal(addRecord([], record).length, 1);
});

test('badges and UTC streak derive only from successful recorded gameplay', () => {
  const records = [won('2026-10-20'), won('2026-10-21', 'LASER'), won('2026-10-22', 'PHASE')];
  assert.equal(successfulStreak(records, '2026-10-22'), 3);
  assert.deepEqual(earnedBadges(records, '2026-10-22'), ['FIRST ESCAPE', 'NO DAMAGE', 'SPEED RUNNER', 'FIRESTORM SPECIALIST', 'LASER SPECIALIST', 'PHASE SPECIALIST', 'THREE DAY STREAK']);
  assert.equal(successfulStreak(records, '2026-10-24'), 0);
  const losses = [{ ...won('2026-10-22'), status: 'lost', score: 0 }];
  assert.deepEqual(earnedBadges(losses, '2026-10-22'), []);
});

test('daily best and share copy label local preview honestly', () => {
  const records = [won('2026-10-22'), won('2026-10-22', 'LASER', { score: 1100 }), won('2026-10-21', 'PHASE', { score: 1200 })];
  assert.equal(dailyBest(records, '2026-10-22'), 1100);
  const card = shareText(records[0], nft, 'https://example.com');
  assert.match(card, /ONCHAIN TOKEN #973/);
  assert.match(card, /PREVIEW RUN/);
  assert.match(card, /not an onchain proof/);
});
