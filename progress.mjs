export function recordFromGame(game, mode) {
  return {
    tokenId: game.nft.id,
    date: game.date,
    mode: mode === 'verified' ? 'verified' : mode === 'sample' ? 'sample' : 'preview',
    status: game.status,
    turns: game.turns,
    score: game.status === 'won' ? Math.max(0, 1500 - game.turns * 20 - game.hits * 140 + game.energy * 40) : 0,
    fragments: game.relics.filter(relic => relic.found).length,
    hits: game.hits,
    ability: game.build.power,
    powersUsed: game.powersUsed
  };
}

export function progressKey(nft, mode) {
  const bucket = mode === 'verified' ? 'verified' : mode === 'sample' ? 'sample' : 'preview';
  return `chogescape:records:v1:${bucket}:${nft.contract.toLowerCase()}:${nft.id}`;
}

export function addRecord(records, record) {
  return [...records.filter(item => item && item.date && item.status), record].slice(-120);
}

export function dailyBest(records, date) {
  return Math.max(0, ...records.filter(item => item.date === date && item.status === 'won').map(item => item.score));
}

export function successfulStreak(records, today) {
  const wonDates = new Set(records.filter(item => item.status === 'won').map(item => item.date));
  const start = new Date(`${today}T00:00:00.000Z`);
  if (!wonDates.has(today)) start.setUTCDate(start.getUTCDate() - 1);
  let count = 0;
  while (wonDates.has(start.toISOString().slice(0, 10))) {
    count++;
    start.setUTCDate(start.getUTCDate() - 1);
  }
  return count;
}

export function earnedBadges(records, today) {
  const wins = records.filter(item => item.status === 'won');
  const badges = [];
  if (wins.length) badges.push('FIRST ESCAPE');
  if (wins.some(item => item.hits === 0)) badges.push('NO DAMAGE');
  if (wins.some(item => item.turns <= 30)) badges.push('SPEED RUNNER');
  for (const power of ['FIRESTORM', 'LASER', 'PHASE']) {
    if (wins.some(item => item.ability === power && item.powersUsed > 0)) badges.push(`${power} SPECIALIST`);
  }
  if (successfulStreak(records, today) >= 3) badges.push('THREE DAY STREAK');
  return badges;
}

export function shareText(record, nft, origin) {
  const result = record.status === 'won' ? 'ESCAPED' : 'CAUGHT';
  const modeLabel = record.mode === 'sample' ? 'SAMPLE DATA / PREVIEW' : `${record.mode.toUpperCase()} RUN`;
  return `CHOG ESCAPE PROTOCOL // ${record.date}\n${nft.name} · ONCHAIN TOKEN #${record.tokenId}\n${record.ability} · ${modeLabel}\n${result} · ${record.score} PTS · ${record.turns} TURNS · ${record.fragments}/3 FRAGMENTS\nBrowser-local result, not an onchain proof. #Chogathon\n${origin}`;
}
