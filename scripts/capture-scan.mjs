import { chromium } from '@playwright/test';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.wasm': 'application/wasm' };
createServer(async (request, response) => {
  const path = decodeURIComponent(new URL(request.url, 'http://x').pathname);
  let file = normalize(join('dist', path));
  if (path.endsWith('/')) file = join(file, 'index.html');
  try {
    const body = await readFile(file);
    response.writeHead(200, { 'Content-Type': types[extname(file)] ?? 'application/octet-stream' });
    response.end(body);
  } catch { response.writeHead(404); response.end('nf'); }
}).listen(4399, '127.0.0.1');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto('http://127.0.0.1:4399/en/scan-document/');
await page.getByLabel('Choose a document photo').setInputFiles('tests/fixtures/scan-page.png');
await page.locator('.scanner-corner').first().waitFor({ timeout: 30000 });
await page.screenshot({ path: 'C:/Users/Fajar/AppData/Local/Temp/commandcode/E--dev-fajar-vd/73e4d36f-c534-4b8c-bbf1-36584b6e294f/scratchpad/review.png' });

await page.getByRole('button', { name: 'Save scan' }).click();
const link = page.getByRole('link', { name: 'Download JPG' });
await link.waitFor({ timeout: 60000 });
const href = await link.getAttribute('href');
const dataUrl = await page.evaluate(async url => {
  const blob = await (await fetch(url)).blob();
  return await new Promise(resolve => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.readAsDataURL(blob); });
}, href);
await page.setContent(`<body style="margin:0;background:#334155"><img src="${dataUrl}" style="display:block;max-width:1280px"/></body>`);
await page.screenshot({ path: 'C:/Users/Fajar/AppData/Local/Temp/commandcode/E--dev-fajar-vd/73e4d36f-c534-4b8c-bbf1-36584b6e294f/scratchpad/scan-result.png' });
await browser.close();
console.log('captured');
process.exit(0);
