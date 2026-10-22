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

export async function getNft(id) {
  if (!Number.isSafeInteger(id) || id < 0 || id > 100000) throw new Error('Invalid token ID');
  const encoded = id.toString(16).padStart(64, '0');
  const [ownerHex, uriHex] = await Promise.all([
    rpcCall('0x6352211e' + encoded),
    rpcCall('0xc87b56dd' + encoded)
  ]);
  if (!/^0x[0-9a-f]{64}$/i.test(ownerHex)) throw new Error('Invalid owner response');
  const owner = '0x' + ownerHex.slice(-40).toLowerCase();
  const uri = decodeAbiString(uriHex);
  const response = await fetch(ipfsHttp(uri), { signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error('NFT metadata unavailable');
  const data = await response.json();
  if (!Array.isArray(data.attributes)) throw new Error('NFT traits unavailable');
  const attributes = data.attributes
    .filter(a => typeof a.trait_type === 'string' && ['Aura', 'Eyes', 'Body', 'Head', 'Tier', 'Skin', 'Mouth', 'Background'].includes(a.trait_type))
    .map(a => ({ trait_type: a.trait_type.slice(0, 32), value: String(a.value).slice(0, 64) }));
  return {
    id,
    owner,
    name: String(data.name || `CHOG #${id}`).slice(0, 80),
    image: ipfsHttp(data.image),
    attributes,
    chainId: 143,
    contract: CONTRACT,
    explorer: `https://monadvision.com/token/${CONTRACT}?a=${id}`
  };
}

export default async function handler(request, response) {
  if (request.method !== 'GET') return response.status(405).json({ error: 'Method not allowed' });
  const id = Number(request.query?.id);
  try {
    const nft = await getNft(id);
    response.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=30');
    return response.status(200).json(nft);
  } catch (error) {
    const status = /Invalid token ID/.test(error.message) ? 400 : /not found/.test(error.message) ? 404 : 502;
    return response.status(status).json({ error: error.message });
  }
}
