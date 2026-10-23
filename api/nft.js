const CONTRACT = '0xc96d31f8626c6d03fae5dcd3d61e3fb9f4a73763';
const RPC = 'https://rpc.monad.xyz';
const GATEWAY = 'https://gateway.pinata.cloud/ipfs/';

function decodeAbiString(hex) {
  if (!/^0x[0-9a-f]*$/i.test(hex) || hex.length < 130) throw new Error('Invalid token metadata response');
  const length = Number.parseInt(hex.slice(66, 130), 16);
  if (!Number.isSafeInteger(length) || length > 4096) throw new Error('Invalid metadata length');
  const data = hex.slice(130, 130 + length * 2);
  if (data.length !== length * 2) throw new Error('Truncated metadata');
  return Buffer.from(data, 'hex').toString('utf8');
}

function ipfsHttp(uri) {
  if (typeof uri !== 'string' || !/^ipfs:\/\/[a-zA-Z0-9/._-]+$/.test(uri)) throw new Error('Unsupported metadata URI');
  return GATEWAY + uri.slice(7);
}

async function rpcCall(data) {
  const response = await fetch(RPC, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_call', params: [{ to: CONTRACT, data }, 'latest'] }),
    signal: AbortSignal.timeout(9000)
  });
  if (!response.ok) throw new Error('Monad RPC unavailable');
  const payload = await response.json();
  if (payload.error || typeof payload.result !== 'string') throw new Error('Token not found on Monad');
  return payload.result;
}

export async function getOwner(id) {
  if (!Number.isSafeInteger(id) || id < 0 || id > 100000) throw new Error('Invalid token ID');
  const encoded = id.toString(16).padStart(64, '0');
  const ownerHex = await rpcCall('0x6352211e' + encoded);
  if (!/^0x[0-9a-f]{64}$/i.test(ownerHex)) throw new Error('Invalid owner response');
  return '0x' + ownerHex.slice(-40).toLowerCase();
}

export async function getNft(id) {
  if (!Number.isSafeInteger(id) || id < 0 || id > 100000) throw new Error('Invalid token ID');
  const encoded = id.toString(16).padStart(64, '0');
  const [owner, uriHex] = await Promise.all([
    getOwner(id),
    rpcCall('0xc87b56dd' + encoded)
  ]);
  const uri = decodeAbiString(uriHex);
  const response = await fetch(ipfsHttp(uri), { signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error('NFT metadata unavailable');
  if (Number(response.headers.get('content-length')) > 200000) throw new Error('NFT metadata too large');
  const data = await response.json();
  if (!data || !Array.isArray(data.attributes) || data.attributes.length > 64) throw new Error('NFT traits unavailable');
  const attributes = data.attributes
    .filter(a => a && typeof a.trait_type === 'string' && ['Aura', 'Eyes', 'Body', 'Head', 'Tier', 'Skin', 'Mouth', 'Background'].includes(a.trait_type))
    .map(a => ({ trait_type: a.trait_type.slice(0, 32), value: String(a.value).slice(0, 64) }));
  return {
    id,
    owner,
    name: (typeof data.name === 'string' ? data.name : `CHOG #${id}`).slice(0, 80),
    image: ipfsHttp(data.image),
    attributes,
    chainId: 143,
    contract: CONTRACT,
    explorer: `https://monadvision.com/token/${CONTRACT}?a=${id}`
  };
}

export default async function handler(request, response) {
  if (request.method !== 'GET') return response.status(405).json({ error: 'Method not allowed' });
  const raw = request.query?.id;
  if (typeof raw !== 'string' || !/^(0|[1-9]\d{0,5})$/.test(raw) || Number(raw) > 100000) return response.status(400).json({ error: 'Invalid token ID' });
  const id = Number(raw);
  try {
    if (request.query?.ownerOnly === '1') {
      const owner = await getOwner(id);
      response.setHeader('Cache-Control', 'no-store');
      return response.status(200).json({ id, owner, chainId: 143, contract: CONTRACT });
    }
    const nft = await getNft(id);
    response.setHeader('Cache-Control', 'no-store');
    return response.status(200).json(nft);
  } catch (error) {
    const status = /Invalid token ID/.test(error.message) ? 400 : /not found/.test(error.message) ? 404 : 502;
    return response.status(status).json({ error: error.message });
  }
}
