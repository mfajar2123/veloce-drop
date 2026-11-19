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

const routes = [
  'compress-image', 'batch-compress-images', 'resize-image', 'convert-image', 'remove-background',
  'watermark-logo', 'photos-to-pdf', 'pdf-to-jpg', 'compress-pdf/500kb', 'print-photo-sheet',
];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const rows = [];

for (const route of routes) {
  await page.goto(`http://127.0.0.1:4321/en/${route}/`);
  await page.waitForTimeout(700);
  const metrics = await page.evaluate(() => {
    const doc = document.documentElement;
    const visible = (node) => {
      const rect = node.getBoundingClientRect();
      return rect.height > 0 && rect.top < window.innerHeight && rect.bottom > 0;
    };
    const primary = Array.from(document.querySelectorAll('main button, main input[type=file], main select'))
      .filter(node => visible(node)).length;
    const firstControl = document.querySelector('main input[type=file], main button, main select');
    const firstControlTop = firstControl ? Math.round(firstControl.getBoundingClientRect().top) : -1;
    return {
      scrollHeight: doc.scrollHeight,
      viewport: window.innerHeight,
      screens: Number((doc.scrollHeight / window.innerHeight).toFixed(2)),
      controlsInFirstScreen: primary,
      firstControlTop,
    };
  });
  rows.push({ route, ...metrics });
}

// After a result exists, how far down is the download action? Use compression as the probe.
await page.goto('http://127.0.0.1:4321/en/compress-image/');
await page.waitForTimeout(500);
await page.locator('input[type=file]').setInputFiles('tests/fixtures/portrait.jpg');
await page.getByRole('button', { name: 'Compress image' }).click();
await page.getByRole('link', { name: 'Download image' }).waitFor({ timeout: 60000 });
const afterResult = await page.evaluate(() => {
  const link = Array.from(document.querySelectorAll('main a')).find(node => /Download/.test(node.textContent ?? ''));
  const rect = link?.getBoundingClientRect();
  return { downloadTop: rect ? Math.round(rect.top) : -1, scrollHeight: document.documentElement.scrollHeight, viewport: window.innerHeight };
});

await browser.close();
console.log(JSON.stringify({ rows, afterResult }, null, 2));
process.exit(0);
