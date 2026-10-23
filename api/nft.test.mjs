import test from 'node:test';
import assert from 'node:assert/strict';
import handler, { getNft } from './nft.js';

const owner = '0xc5932967e2ada3d1abe420eec27b4e85a954a993';
const abiString = value => {
  const bytes = Buffer.from(value).toString('hex');
  return '0x' + '20'.padStart(64, '0') + (bytes.length / 2).toString(16).padStart(64, '0') + bytes.padEnd(Math.ceil(bytes.length / 64) * 64, '0');
};
const reply = () => ({ code: 200, headers: {}, status(code) { this.code = code; return this; }, setHeader(key, value) { this.headers[key] = value; }, json(body) { this.body = body; return this; } });

test('NFT lookup reads ownerOf and tokenURI and allows only public IPFS metadata', async () => {
  const original = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options });
    if (url === 'https://rpc.monad.xyz') {
      const data = JSON.parse(options.body).params[0].data;
      const result = data.startsWith('0x6352211e') ? '0x' + owner.slice(2).padStart(64, '0') : abiString('ipfs://bafytest/465.json');
      return Response.json({ jsonrpc: '2.0', result, id: 1 });
    }
    return Response.json({ name: 'CHOG #465', image: 'ipfs://bafytest/465.webp', attributes: [{ trait_type: 'Aura', value: 'Fire' }, { trait_type: 'Unknown', value: 'ignore' }] });
  };
  try {
    const nft = await getNft(973);
    assert.equal(nft.owner, owner);
    assert.equal(nft.chainId, 143);
    assert.equal(nft.attributes.length, 1);
    assert.equal(nft.image, 'https://gateway.pinata.cloud/ipfs/bafytest/465.webp');
    assert.equal(calls.length, 3);
  } finally { globalThis.fetch = original; }
});

test('owner-only recheck avoids IPFS and never caches ownership', async () => {
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => { calls++; return Response.json({ result: '0x' + owner.slice(2).padStart(64, '0') }); };
  try {
    const response = reply();
    await handler({ method: 'GET', query: { id: '973', ownerOnly: '1' } }, response);
    assert.equal(response.code, 200);
    assert.equal(response.body.owner, owner);
    assert.equal(response.headers['Cache-Control'], 'no-store');
    assert.equal(calls, 1);
  } finally { globalThis.fetch = original; }
});

test('invalid requests and unavailable providers fail without sample metadata', async () => {
  for (const query of [{}, { id: '' }, { id: '-1' }, { id: '100001' }]) {
    const response = reply();
    await handler({ method: 'GET', query }, response);
    assert.equal(response.code, 400);
  }
  const original = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error('RPC unavailable'); };
  try {
    const response = reply();
    await handler({ method: 'GET', query: { id: '973' } }, response);
    assert.equal(response.code, 502);
    assert.deepEqual(response.body, { error: 'RPC unavailable' });
  } finally { globalThis.fetch = original; }
});
