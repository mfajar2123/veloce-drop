import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { chromium } from '@playwright/test';

const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2', '.wasm': 'application/wasm', '.jpg': 'image/jpeg' };
createServer(async (request, response) => {
  const path = decodeURIComponent(new URL(request.url, 'http://x').pathname);
  let file = normalize(join('dist', path));
  if (path.endsWith('/')) file = join(file, 'index.html');
  try {
    const body = await readFile(file);
    response.writeHead(200, { 'Content-Type': types[extname(file)] ?? 'application/octet-stream' });
    response.end(body);
  } catch { response.writeHead(404); response.end('nf'); }
}).listen(4321, '127.0.0.1');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

await page.goto('http://127.0.0.1:4321/en/compress-image/');
await page.waitForTimeout(500);
await page.locator('input[type=file]').setInputFiles('tests/fixtures/portrait.jpg');
await page.getByRole('button', { name: 'Compress image' }).click();
await page.getByRole('link', { name: 'Download image' }).waitFor({ timeout: 60000 });
await page.waitForTimeout(1500);

const view = await page.evaluate(() => {
  const link = Array.from(document.querySelectorAll('main a')).find(node => /Download/.test(node.textContent ?? ''));
  const rect = link?.getBoundingClientRect();
  return {
    scrollY: Math.round(window.scrollY),
    downloadTopInViewport: rect ? Math.round(rect.top) : -1,
    linkVisible: rect ? rect.top >= 0 && rect.bottom <= window.innerHeight : false,
  };
});
console.log('after result:', JSON.stringify(view));

await browser.close();
process.exit(0);
