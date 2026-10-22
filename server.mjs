import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import handler from './api/nft.js';

const root = process.cwd();
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml' };
createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/api/nft') {
    const reply = { status(code) { res.statusCode = code; return this; }, setHeader(...args) { res.setHeader(...args); }, json(data) { res.setHeader('content-type', 'application/json'); res.end(JSON.stringify(data)); } };
    return handler({ method: req.method, query: Object.fromEntries(url.searchParams) }, reply);
  }
  const file = resolve(root, '.' + (url.pathname === '/' ? '/index.html' : url.pathname));
  if (!file.startsWith(root + sep)) { res.writeHead(403); return res.end(); }
  try {
    const body = await readFile(file);
    res.setHeader('content-type', mime[extname(file)] || 'application/octet-stream');
    res.end(body);
  } catch { res.writeHead(404); res.end('Not found'); }
}).listen(Number(process.env.PORT || 3000), () => console.log('Chog Escape running on http://localhost:' + (process.env.PORT || 3000)));
