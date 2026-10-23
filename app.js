import { createGame, move, usePower, visible, SIZE, LIMIT } from './game-core.mjs';
import { recordFromGame, progressKey, addRecord, dailyBest, successfulStreak, earnedBadges, shareText } from './progress.mjs';

const $ = id => document.getElementById(id);
const utcDay = () => new Date().toISOString().slice(0, 10);
let today = utcDay();
const CONTRACT = '0xc96d31f8626c6d03fae5dcd3d61e3fb9f4a73763';
const fallback = {
  id: 973, name: 'CHOG #465', contract: CONTRACT,
  image: 'https://gateway.pinata.cloud/ipfs/bafybeihau2egcccbdxymeckmmbrqytbfor5gkt3en6d5fsbueymdbq7g6e/465.webp',
  attributes: [
    { trait_type: 'Aura', value: 'Fire' }, { trait_type: 'Eyes', value: 'Round Crying' },
    { trait_type: 'Body', value: 'Black Trackset' }, { trait_type: 'Head', value: 'Russian Hat' },
    { trait_type: 'Tier', value: 'Common' }, { trait_type: 'Skin', value: 'Yellow' }
  ], explorer: `https://monadvision.com/token/${CONTRACT}?a=973`
};
let nft = fallback;
let account = null;
let mode = 'preview';
let game = null;
let requestEpoch = 0;
let runRecord = null;

$('utc-day').textContent = today;
$('game-date').textContent = today;

function setStatus(message, kind = '') { const el = $('wallet-status'); el.textContent = message; el.className = 'status ' + kind; }
function shortAddress(address) { return address ? `${address.slice(0, 6)}…${address.slice(-4)}` : ''; }
function setNft(data, nextMode) {
  nft = data; mode = nextMode; game = null; runRecord = null;
  $('nft-image').src = data.image || '/favicon.svg';
  $('hero-nft').src = data.image || '/favicon.svg';
  $('nft-name').textContent = data.name;
  $('hero-nft-name').textContent = data.name;
  $('explorer-link').href = data.explorer || `https://monadvision.com/token/${CONTRACT}?a=${data.id}`;
  $('source-badge').textContent = nextMode === 'verified' ? 'OWNER VERIFIED' : nextMode === 'sample' ? 'SAMPLE DATA' : 'LIVE NFT / PREVIEW';
  $('source-badge').className = 'source-badge ' + (nextMode === 'verified' ? 'verified' : 'preview');
  $('game-mode').textContent = nextMode === 'verified' ? 'VERIFIED OWNER' : nextMode === 'sample' ? 'SAMPLE DATA / PREVIEW' : 'PREVIEW MODE';
  const traitList = $('trait-list'); traitList.replaceChildren();
  for (const item of data.attributes.filter(a => ['Aura', 'Eyes', 'Body', 'Head', 'Tier', 'Skin'].includes(a.trait_type))) {
    const tag = document.createElement('span'); tag.className = 'trait';
    tag.append(document.createTextNode(item.trait_type + ' '));
    const strong = document.createElement('strong'); strong.textContent = item.value; tag.append(strong); traitList.append(tag);
  }
  resetBoard();
  renderProgress();
}

async function fetchNft(id, ownerOnly = false) {
  const response = await fetch(`/api/nft?id=${encodeURIComponent(id)}${ownerOnly ? '&ownerOnly=1' : ''}`, { cache: 'no-store' });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'NFT lookup failed');
  return data;
}

async function loadPreview(id) {
  const epoch = ++requestEpoch;
  document.querySelectorAll('.preview-choice').forEach(b => b.classList.toggle('active', b.dataset.preview === String(id)));
  setStatus(`Loading public Chog #${id} metadata…`);
  try {
    const data = await fetchNft(id);
    if (epoch !== requestEpoch) return;
    setNft(data, 'preview');
    setStatus(`Previewing ${data.name}. Ownership is simulated; traits are real public metadata.`);
  } catch (error) {
    if (epoch !== requestEpoch) return;
    if (id === 973) {
      setNft(fallback, 'sample');
      setStatus('Live metadata unavailable. Showing a labeled sample for preview only.', 'error');
    } else setStatus(`Could not load this preview: ${error.message}`, 'error');
  }
}

async function connectWallet() {
  if (!window.ethereum) { setStatus('No EVM wallet detected. Install a wallet or use preview mode.', 'error'); return; }
  const epoch = ++requestEpoch;
  try {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    if (epoch !== requestEpoch) return;
    if (!accounts?.[0]) throw new Error('No account returned');
    const nextAccount = accounts[0].toLowerCase();
    if (mode === 'verified' && nextAccount !== account) setNft(nft, 'preview');
    account = nextAccount;
    $('connect-btn').textContent = `CONNECTED ${shortAddress(account)}`;
    setStatus(`Connected ${shortAddress(account)}. Enter your Chog Genesis token ID.`, 'success');
  } catch (error) { if (epoch === requestEpoch) setStatus(`Wallet connection cancelled or failed: ${error.message}`, 'error'); }
}

async function verifyOwnedNft() {
  if (!account) { setStatus('Connect your wallet first.', 'error'); return; }
  const raw = $('token-id').value.trim();
  const id = Number(raw);
  if (!/^\d+$/.test(raw) || !Number.isSafeInteger(id) || id > 100000) { setStatus('Enter a valid numeric token ID.', 'error'); return; }
  const epoch = ++requestEpoch;
  const requestedAccount = account;
  $('verify-btn').disabled = true; setStatus('Checking live ownership on Monad…');
  try {
    const data = await fetchNft(id);
    if (epoch !== requestEpoch || requestedAccount !== account) return;
    if (data.owner.toLowerCase() !== requestedAccount) throw new Error(`This token belongs to ${shortAddress(data.owner)}, not your connected wallet.`);
    setNft(data, 'verified');
    setStatus(`${data.name} verified on Monad. This NFT unlocks its own daily route.`, 'success');
  } catch (error) { if (epoch === requestEpoch) setStatus(error.message, 'error'); }
  finally { $('verify-btn').disabled = false; }
}

function resetBoard() {
  const preview = createGame(nft, today);
  renderBoard(preview);
  $('board-overlay').hidden = false;
  $('start-btn').disabled = false;
  $('start-btn').textContent = mode === 'verified' ? 'START VERIFIED RUN ↗' : 'START PREVIEW RUN ↗';
  $('run-status').textContent = 'STANDBY';
  $('hp').textContent = '—'; $('energy').textContent = '—'; $('fragments').textContent = '0 / 3'; $('turns').textContent = `0 / ${LIMIT}`;
  $('mobile-summary').textContent = `0 / 3 FRAGMENTS · 0 / ${LIMIT} TURNS`;
  $('power-name').textContent = preview.build.power;
  $('power-desc').textContent = powerDescription(preview.build.power);
  $('power-btn').disabled = true;
  $('mobile-power-btn').disabled = true;
  $('log').textContent = 'Start a run to enter the maze.';
  $('result').hidden = true;
  document.querySelector('.stats-panel').classList.remove('low-health');
}

function powerDescription(power) {
  return power === 'FIRESTORM' ? 'Fire aura clears nearby traps and stuns drones.' : power === 'LASER' ? 'Laser eyes clear the facing lane and stun drones.' : 'Phase two tiles ahead, skipping a trap or wall.';
}
async function startGame() {
  const epoch = ++requestEpoch;
  const selectedNft = nft;
  const selectedMode = mode;
  const selectedAccount = account;
  if (selectedMode === 'verified') {
    $('start-btn').disabled = true;
    setStatus('Rechecking ownership on Monad before this run…');
    try {
      const ownership = await fetchNft(selectedNft.id, true);
      if (epoch !== requestEpoch || selectedNft !== nft || selectedAccount !== account) return;
      if (!selectedAccount || ownership.owner.toLowerCase() !== selectedAccount) throw new Error('Ownership changed. Verify this Chog again.');
      setStatus(`${selectedNft.name} ownership confirmed for this run.`, 'success');
    } catch (error) {
      if (epoch === requestEpoch) { setNft(selectedNft, 'preview'); setStatus(`${error.message} Preview is still available.`, 'error'); }
      return;
    } finally { if (epoch === requestEpoch) $('start-btn').disabled = false; }
  }
  if (epoch !== requestEpoch) return;
  today = utcDay();
  $('utc-day').textContent = today;
  $('game-date').textContent = today;
  game = createGame(selectedNft, today);
  runRecord = null;
  $('board-overlay').hidden = true;
  $('result').hidden = true;
  render();
  $('arena').scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function renderBoard(current) {
  const board = $('board'); board.replaceChildren();
  const effects = new Map();
  const addEffect = (cell, effect) => {
    if (!effects.has(cell)) effects.set(cell, new Set());
    effects.get(cell).add(effect);
  };
  for (const event of current.events || []) {
    const effect = event.type === 'power' ? `effect-${event.power.toLowerCase()}` : `effect-${event.type}`;
    for (const cell of event.cells || []) addEffect(cell, effect);
    for (const cell of event.clearedTraps || []) addEffect(cell, 'effect-cleared');
  }
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
    const cell = document.createElement('div'); cell.className = 'tile';
    const k = `${x},${y}`;
    if (current.walls.includes(k)) cell.classList.add('wall');
    else if (x === 6 && y === 6) cell.classList.add('exit');
    else if (current.relics.some(r => r.x === x && r.y === y && !r.found)) cell.classList.add('relic');
    else if (current.traps.includes(k)) cell.classList.add('trap');
    const drone = current.drones.find(d => d.x === x && d.y === y);
    if (drone) { cell.classList.add('drone'); if (drone.stunned) cell.classList.add('stunned'); }
    if (!visible(current, x, y)) cell.classList.add('fog');
    if (effects.has(k)) cell.classList.add(...effects.get(k));
    if (current.x === x && current.y === y) {
      cell.classList.add('player'); cell.classList.remove('fog');
      const img = document.createElement('img'); img.src = nft.image || '/favicon.svg'; img.alt = ''; cell.append(img);
    }
    board.append(cell);
  }
  const remaining = current.relics.filter(r => !r.found).length;
  board.setAttribute('aria-label', `Seven by seven maze. Chog at row ${current.y + 1}, column ${current.x + 1}. ${remaining} fragments remain. ${current.hp} hearts and ${current.energy} power charges.`);
}
function render() {
  if (!game) return;
  renderBoard(game);
  $('run-status').textContent = game.status === 'playing' ? 'INFILTRATION' : game.status.toUpperCase();
  $('hp').textContent = '♥'.repeat(Math.max(0, game.hp)) + '♡'.repeat(Math.max(0, game.build.health - game.hp));
  document.querySelector('.stats-panel').classList.toggle('low-health', game.hp <= 2);
  $('energy').textContent = `${game.energy} / ${game.build.energy}`;
  $('fragments').textContent = `${game.relics.filter(r => r.found).length} / 3`;
  $('turns').textContent = `${game.turns} / ${LIMIT}`;
  $('power-name').textContent = game.build.power;
  $('power-btn').disabled = game.status !== 'playing' || game.energy <= 0;
  $('mobile-power-btn').disabled = game.status !== 'playing' || game.energy <= 0;
  $('mobile-summary').textContent = `${game.relics.filter(r => r.found).length} / 3 FRAGMENTS · ${game.turns} / ${LIMIT} TURNS · ${game.hp} HEARTS`;
  $('log').textContent = game.log;
  if (game.status !== 'playing') showResult();
}
function showResult() {
  $('result').hidden = false;
  const won = game.status === 'won';
  $('result').classList.toggle('victory', won);
  $('result').classList.toggle('failure', !won);
  $('result-title').textContent = won ? 'SIGNAL EXTRACTED.' : 'SIGNAL LOST.';
  if (!runRecord) {
    runRecord = recordFromGame(game, mode);
    try {
      const key = progressKey(nft, mode);
      const records = JSON.parse(localStorage.getItem(key) || '[]');
      localStorage.setItem(key, JSON.stringify(addRecord(Array.isArray(records) ? records : [], runRecord)));
    } catch { /* Private browsing can disable local storage. */ }
  }
  const points = runRecord.score;
  const key = `chogescape:${game.date}:${nft.id}:${mode}`;
  let best = 0;
  try { best = Number(localStorage.getItem(key)) || 0; if (points > best) { localStorage.setItem(key, String(points)); best = points; } } catch {}
  const runLabel = mode === 'verified' ? 'owner checked at run start' : mode === 'sample' ? 'sample data preview' : 'preview run';
  $('result-copy').textContent = `${nft.name} · token #${nft.id} · ${game.turns} turns · ${game.relics.filter(r => r.found).length}/3 fragments · ${runLabel}${best ? ` · personal best ${best}` : ''}`;
  $('result-score').textContent = `${points} PTS`;
  renderProgress();
}
function advance(dx, dy) { if (game?.status === 'playing') { game = move(game, dx, dy); render(); } }
function power() { if (game?.status === 'playing') { game = usePower(game); render(); } }
async function share() {
  const text = shareText(runRecord, nft, location.origin);
  try { await navigator.clipboard.writeText(text); $('share-btn').textContent = 'COPIED ✓'; setTimeout(() => $('share-btn').textContent = 'COPY RUN CARD ↗', 1800); }
  catch { $('share-btn').textContent = 'COPY FAILED'; }
}

function readRecords() {
  try {
    const value = JSON.parse(localStorage.getItem(progressKey(nft, mode)) || '[]');
    return Array.isArray(value) ? value : [];
  } catch { return []; }
}

function renderProgress() {
  const records = readRecords();
  $('daily-best').textContent = `${dailyBest(records, today)} PTS`;
  $('daily-streak').textContent = `${successfulStreak(records, today)} DAYS`;
  $('runs-count').textContent = String(records.length);
  const badgeList = $('badge-list');
  badgeList.replaceChildren();
  const badges = earnedBadges(records, today);
  if (!badges.length) {
    const empty = document.createElement('span'); empty.textContent = 'Complete an escape to earn your first badge.'; badgeList.append(empty);
  } else for (const name of badges) {
    const badge = document.createElement('span'); badge.className = 'earned-badge'; badge.textContent = name; badgeList.append(badge);
  }
}

function downloadCard() {
  if (!runRecord) return;
  const canvas = document.createElement('canvas');
  canvas.width = 1200; canvas.height = 630;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#0c0919'; ctx.fillRect(0, 0, 1200, 630);
  ctx.fillStyle = '#281b43'; ctx.fillRect(690, 0, 510, 630);
  ctx.strokeStyle = '#9c7aff'; ctx.lineWidth = 4; ctx.strokeRect(28, 28, 1144, 574);
  ctx.font = 'bold 24px Arial'; ctx.fillStyle = '#9c7aff'; ctx.fillText('CHOG ESCAPE PROTOCOL // DAILY SIGNAL', 70, 92);
  ctx.font = 'bold 78px Impact, Arial'; ctx.fillStyle = '#d9fa5b'; ctx.fillText(runRecord.status === 'won' ? 'SIGNAL EXTRACTED' : 'SIGNAL LOST', 70, 200);
  ctx.font = 'bold 42px Arial'; ctx.fillStyle = '#f9f5ef'; ctx.fillText(`${nft.name}  •  TOKEN #${runRecord.tokenId}`, 70, 284);
  const cardMode = runRecord.mode === 'sample' ? 'SAMPLE DATA / PREVIEW' : `${runRecord.mode.toUpperCase()} RUN`;
  ctx.font = 'bold 30px Arial'; ctx.fillText(`${runRecord.ability}  •  ${cardMode}`, 70, 345);
  ctx.font = 'bold 68px Impact, Arial'; ctx.fillStyle = '#d9fa5b'; ctx.fillText(`${runRecord.score} PTS`, 70, 455);
  ctx.font = 'bold 25px Arial'; ctx.fillStyle = '#f9f5ef'; ctx.fillText(`${runRecord.turns} TURNS  •  ${runRecord.fragments}/3 FRAGMENTS  •  ${runRecord.date}`, 70, 510);
  ctx.font = '20px Arial'; ctx.fillStyle = '#b7accb'; ctx.fillText('Browser-local result, not an onchain proof.', 70, 568);
  ctx.save(); ctx.translate(1010, 315); ctx.rotate(-Math.PI / 2); ctx.font = 'bold 28px Arial'; ctx.fillStyle = '#d9fa5b'; ctx.fillText(location.host, -225, 0); ctx.restore();
  const link = document.createElement('a');
  link.download = `chog-escape-${runRecord.tokenId}-${runRecord.date}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

$('connect-btn').addEventListener('click', connectWallet);
$('verify-btn').addEventListener('click', verifyOwnedNft);
$('token-id').addEventListener('keydown', event => { if (event.key === 'Enter') verifyOwnedNft(); });
document.querySelectorAll('.preview-choice').forEach(button => button.addEventListener('click', () => loadPreview(Number(button.dataset.preview))));
$('start-btn').addEventListener('click', startGame);
$('retry-btn').addEventListener('click', startGame);
$('share-btn').addEventListener('click', share);
$('download-btn').addEventListener('click', downloadCard);
$('power-btn').addEventListener('click', power);
$('mobile-power-btn').addEventListener('click', power);
document.querySelectorAll('[data-move]').forEach(button => button.addEventListener('click', () => advance(...button.dataset.move.split(',').map(Number))));
document.addEventListener('keydown', event => {
  if (event.target instanceof HTMLElement && ['INPUT', 'TEXTAREA'].includes(event.target.tagName)) return;
  const directions = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0], w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0] };
  if (directions[event.key]) { event.preventDefault(); advance(...directions[event.key]); }
  else if (event.code === 'Space') { event.preventDefault(); power(); }
});
if (window.ethereum?.on) window.ethereum.on('accountsChanged', accounts => {
  requestEpoch++;
  account = accounts?.[0]?.toLowerCase() || null;
  $('connect-btn').textContent = account ? `CONNECTED ${shortAddress(account)}` : 'CONNECT WALLET ↗';
  if (mode === 'verified') { setNft(nft, 'preview'); setStatus('Wallet changed. Verify ownership again to play a live run.', 'error'); }
  else setStatus('Wallet account changed. Select and verify an owned Chog to start a verified run. Preview remains available.');
});
if (window.ethereum?.on) window.ethereum.on('chainChanged', () => {
  requestEpoch++;
  if (mode === 'verified') { setNft(nft, 'preview'); setStatus('Wallet network changed. Verify ownership again to play a live run.', 'error'); }
  else setStatus('Wallet network changed. Verify your Chog again for a verified run. Preview remains available.');
});
setNft(fallback, 'sample');
loadPreview(973);
