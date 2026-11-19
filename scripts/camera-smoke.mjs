import { createServer } from 'node:http';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { chromium } from '@playwright/test';

const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.wasm': 'application/wasm' };
const headers = new Map((await readFile('dist/_headers', 'utf8')).trim().split(/\n\n/).map(block => {
  const [path, ...lines] = block.split('\n');
  return [path, Object.fromEntries(lines.map(line => {
    const separator = line.indexOf(':');
    return [line.slice(0, separator).trim(), line.slice(separator + 1).trim()];
  }))];
}));
const server = createServer(async (request, response) => {
  const path = decodeURIComponent(new URL(request.url, 'http://x').pathname);
  let file = normalize(join('dist', path));
  if (path.endsWith('/')) file = join(file, 'index.html');
  try {
    const body = await readFile(file);
    response.writeHead(200, {
      'Content-Type': types[extname(file)] ?? 'application/octet-stream',
      ...headers.get('/*'),
      ...headers.get(path),
    });
    response.end(body);
  } catch { response.writeHead(404); response.end('nf'); }
}).listen(4398, '127.0.0.1');

const browser = await chromium.launch({
  args: [
    // Chromium's built-in fake capture device: a moving test pattern, so frames
    // really flow without any hardware or media file.
    '--use-fake-device-for-media-stream',
    '--use-fake-ui-for-media-stream',
  ],
});
const context = await browser.newContext({ permissions: ['camera'], viewport: { width: 1280, height: 960 } });
const page = await context.newPage();

const errors = [];
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });

await page.goto('http://127.0.0.1:4398/en/scan-document/');
await page.getByRole('button', { name: 'Open camera and scan' }).click();

// The video element must receive real frames, not just a stream object.
const videoState = await page.waitForFunction(() => {
  const video = document.querySelector('.scanner-stage video');
  if (!video) return null;
  if (video.readyState < 2 || !video.videoWidth) return null;
  return { width: video.videoWidth, height: video.videoHeight, playing: !video.paused };
}, undefined, { timeout: 30_000 }).then(handle => handle.jsonValue());

console.log('video:', JSON.stringify(videoState));
console.log('live capture button visible:', await page.getByRole('button', { name: 'Capture page' }).isVisible());

await page.getByRole('button', { name: 'Capture page' }).click();
await page.getByRole('button', { name: 'Save scan' }).waitFor({ timeout: 30_000 });
const cornerCount = await page.locator('.scanner-corner').count();
console.log('corners after capture:', cornerCount);
await page.getByRole('button', { name: 'Save scan' }).click();
const download = page.getByRole('link', { name: 'Download JPG' });
await download.waitFor({ timeout: 60_000 });
const href = await download.getAttribute('href');
const size = await page.evaluate(async url => {
  const buffer = await (await fetch(url)).arrayBuffer();
  return buffer.byteLength;
}, href);
console.log('exported bytes:', size);
console.log('console errors:', JSON.stringify(errors));

await browser.close();
server.close();
assert.equal(videoState.playing, true);
assert.equal(cornerCount, 4);
assert.ok(size > 1000);
assert.deepEqual(errors, []);
