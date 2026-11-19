import { readFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';

const limit = 100_000;
const basePath = (process.env.PUBLIC_BASE_PATH || '/').replace(/^\/*/, '/').replace(/\/*$/, '/');
const page = await readFile(new URL('../dist/id/index.html', import.meta.url), 'utf8');
const assets = [...new Set([...page.matchAll(/(?:src|href|component-url|renderer-url)="([^"]+\.js)"/g)].map((match) => match[1]))];
const results = await Promise.all(assets.map(async (asset) => {
  const pathname = new URL(asset, 'https://doculven.invalid').pathname;
  const relativeAsset = pathname.startsWith(basePath) ? pathname.slice(basePath.length) : pathname.replace(/^\/+/, '');
  const file = new URL(`../dist/${relativeAsset}`, import.meta.url);
  const bytes = await readFile(file);
  return { asset, bytes: bytes.length, gzip: gzipSync(bytes, { level: 9 }).length };
}));
const total = results.reduce((sum, asset) => sum + asset.gzip, 0);

console.log(`Landing JavaScript: ${total.toLocaleString()} gzip bytes (budget ${limit.toLocaleString()})`);
for (const asset of results) console.log(`${asset.gzip.toLocaleString()} gzip bytes · ${asset.bytes.toLocaleString()} bytes · ${asset.asset}`);

if (total > limit) process.exitCode = 1;
