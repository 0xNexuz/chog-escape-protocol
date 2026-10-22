import { createGame, move, usePower, visible, score, SIZE, LIMIT } from './game-core.mjs';

const $ = id => document.getElementById(id);
const today = new Date().toISOString().slice(0, 10);
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
let loading = false;

$('utc-day').textContent = today;
$('game-date').textContent = today;

function setStatus(message, kind = '') { const el = $('wallet-status'); el.textContent = message; el.className = 'status ' + kind; }
function shortAddress(address) { return address ? `${address.slice(0, 6)}…${address.slice(-4)}` : ''; }
function setNft(data, nextMode) {
  nft = data; mode = nextMode; game = null;
  $('nft-image').src = data.image || '/favicon.svg';
  $('hero-nft').src = data.image || '/favicon.svg';
  $('nft-name').textContent = data.name;
  $('hero-nft-name').textContent = data.name;
  $('explorer-link').href = data.explorer || `https://monadvision.com/token/${CONTRACT}?a=${data.id}`;
  $('source-badge').textContent = nextMode === 'verified' ? 'OWNER VERIFIED' : nextMode === 'sample' ? 'SAMPLE DATA' : 'LIVE NFT / PREVIEW';
  $('source-badge').className = 'source-badge ' + (nextMode === 'verified' ? 'verified' : 'preview');
  $('game-mode').textContent = nextMode === 'verified' ? 'VERIFIED OWNER' : 'PREVIEW MODE';
  const traitList = $('trait-list'); traitList.replaceChildren();
  for (const item of data.attributes.filter(a => ['Aura', 'Eyes', 'Body', 'Head', 'Tier', 'Skin'].includes(a.trait_type))) {
    const tag = document.createElement('span'); tag.className = 'trait';
    tag.append(document.createTextNode(item.trait_type + ' '));
    const strong = document.createElement('strong'); strong.textContent = item.value; tag.append(strong); traitList.append(tag);
  }
  resetBoard();
}

async function fetchNft(id) {
  const response = await fetch(`/api/nft?id=${encodeURIComponent(id)}`, { cache: 'no-store' });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'NFT lookup failed');
  return data;
}

async function loadPreview(id) {
  if (loading) return;
  loading = true;
  document.querySelectorAll('.preview-choice').forEach(b => b.classList.toggle('active', b.dataset.preview === String(id)));
  setStatus(`Loading public Chog #${id} metadata…`);
  try {
    const data = await fetchNft(id);
    setNft(data, 'preview');
    setStatus(`Previewing ${data.name}. Ownership is simulated; traits are real public metadata.`);
  } catch (error) {
    if (id === 973) {
      setNft(fallback, 'sample');
      setStatus('Live metadata unavailable. Showing a labeled sample for preview only.', 'error');
    } else setStatus(`Could not load this preview: ${error.message}`, 'error');
  } finally { loading = false; }
}

async function connectWallet() {
  if (!window.ethereum) { setStatus('No EVM wallet detected. Install a wallet or use preview mode.', 'error'); return; }
  try {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    if (!accounts?.[0]) throw new Error('No account returned');
    account = accounts[0].toLowerCase();
    $('connect-btn').textContent = `CONNECTED ${shortAddress(account)}`;
    setStatus(`Connected ${shortAddress(account)}. Enter your Chog Genesis token ID.`, 'success');
  } catch (error) { setStatus(`Wallet connection cancelled or failed: ${error.message}`, 'error'); }
}

async function verifyOwnedNft() {
  if (!account) { setStatus('Connect your wallet first.', 'error'); return; }
  const raw = $('token-id').value.trim();
  const id = Number(raw);
  if (!/^\d+$/.test(raw) || !Number.isSafeInteger(id) || id > 100000) { setStatus('Enter a valid numeric token ID.', 'error'); return; }
  $('verify-btn').disabled = true; setStatus('Checking live ownership on Monad…');
  try {
    const data = await fetchNft(id);
    if (data.owner.toLowerCase() !== account) throw new Error(`This token belongs to ${shortAddress(data.owner)}, not your connected wallet.`);
    setNft(data, 'verified');
    setStatus(`${data.name} verified on Monad. This NFT unlocks its own daily route.`, 'success');
  } catch (error) { setStatus(error.message, 'error'); }
  finally { $('verify-btn').disabled = false; }
}

function resetBoard() {
  const preview = createGame(nft, today);
  renderBoard(preview);
  $('board-overlay').hidden = false;
  $('start-btn').textContent = mode === 'verified' ? 'START VERIFIED RUN ↗' : 'START PREVIEW RUN ↗';
  $('run-status').textContent = 'STANDBY';
  $('hp').textContent = '—'; $('energy').textContent = '—'; $('fragments').textContent = '0 / 3'; $('turns').textContent = `0 / ${LIMIT}`;
  $('power-name').textContent = preview.build.power;
  $('power-desc').textContent = powerDescription(preview.build.power);
  $('power-btn').disabled = true;
  $('log').textContent = 'Start a run to enter the maze.';
  $('result').hidden = true;
}

function powerDescription(power) {
  return power === 'FIRESTORM' ? 'Fire aura clears nearby traps and stuns drones.' : power === 'LASER' ? 'Laser eyes clear the facing lane and stun drones.' : 'Phase two tiles ahead, skipping a trap or wall.';
}
function startGame() { game = createGame(nft, today); $('board-overlay').hidden = true; $('result').hidden = true; render(); $('arena').scrollIntoView({ behavior: 'smooth', block: 'start' }); }
function renderBoard(current) {
  const board = $('board'); board.replaceChildren();
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
  $('run-status').textContent = game.status === 'playing' ? 'IN FILTRATION' : game.status.toUpperCase();
  $('hp').textContent = '♥'.repeat(Math.max(0, game.hp)) + '♡'.repeat(Math.max(0, game.build.health - game.hp));
  $('energy').textContent = `${game.energy} / ${game.build.energy}`;
  $('fragments').textContent = `${game.relics.filter(r => r.found).length} / 3`;
  $('turns').textContent = `${game.turns} / ${LIMIT}`;
  $('power-name').textContent = game.build.power;
  $('power-btn').disabled = game.status !== 'playing' || game.energy <= 0;
  $('log').textContent = game.log;
  if (game.status !== 'playing') showResult();
}
function showResult() {
  $('result').hidden = false;
  const won = game.status === 'won';
  $('result-title').textContent = won ? 'SIGNAL EXTRACTED.' : 'SIGNAL LOST.';
  const points = score(game);
  const key = `chogescape:${today}:${nft.id}:${mode}`;
  let best = 0;
  try { best = Number(localStorage.getItem(key)) || 0; if (points > best) { localStorage.setItem(key, String(points)); best = points; } } catch {}
  $('result-copy').textContent = `${nft.name} · ${game.turns} turns · ${game.relics.filter(r => r.found).length}/3 fragments · ${mode === 'verified' ? 'owner verified at run start' : 'preview run'}${best ? ` · personal best ${best}` : ''}`;
  $('result-score').textContent = `${points} PTS`;
}
function advance(dx, dy) { if (game?.status === 'playing') { game = move(game, dx, dy); render(); } }
function power() { if (game?.status === 'playing') { game = usePower(game); render(); } }
async function share() {
  const text = `CHOG ESCAPE PROTOCOL // ${today}\n${nft.name} · ${mode === 'verified' ? 'OWNER VERIFIED' : 'PREVIEW'}\n${game.status === 'won' ? 'ESCAPED' : 'CAUGHT'} · ${score(game)} PTS · ${game.turns} TURNS\nMy NFT is the game. #Chogathon\n${location.origin}`;
  try { await navigator.clipboard.writeText(text); $('share-btn').textContent = 'COPIED ✓'; setTimeout(() => $('share-btn').textContent = 'COPY RUN CARD ↗', 1800); }
  catch { $('share-btn').textContent = 'COPY FAILED'; }
}

$('connect-btn').addEventListener('click', connectWallet);
$('verify-btn').addEventListener('click', verifyOwnedNft);
$('token-id').addEventListener('keydown', event => { if (event.key === 'Enter') verifyOwnedNft(); });
document.querySelectorAll('.preview-choice').forEach(button => button.addEventListener('click', () => loadPreview(Number(button.dataset.preview))));
$('start-btn').addEventListener('click', startGame);
$('retry-btn').addEventListener('click', startGame);
$('share-btn').addEventListener('click', share);
$('power-btn').addEventListener('click', power);
document.querySelectorAll('[data-move]').forEach(button => button.addEventListener('click', () => advance(...button.dataset.move.split(',').map(Number))));
document.addEventListener('keydown', event => {
  if (event.target instanceof HTMLElement && ['INPUT', 'TEXTAREA'].includes(event.target.tagName)) return;
  const directions = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0], w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0] };
  if (directions[event.key]) { event.preventDefault(); advance(...directions[event.key]); }
  else if (event.code === 'Space') { event.preventDefault(); power(); }
});
if (window.ethereum?.on) window.ethereum.on('accountsChanged', accounts => {
  account = accounts?.[0]?.toLowerCase() || null;
  $('connect-btn').textContent = account ? `CONNECTED ${shortAddress(account)}` : 'CONNECT WALLET ↗';
  if (mode === 'verified') { setNft(nft, 'preview'); setStatus('Wallet changed. Verify ownership again to play a live run.', 'error'); }
});
setNft(fallback, 'sample');
loadPreview(973);
