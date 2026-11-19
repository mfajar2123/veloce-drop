import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { chromium } from '@playwright/test';

const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.wasm': 'application/wasm' };
const server = createServer(async (request, response) => {
  const path = decodeURIComponent(new URL(request.url, 'http://x').pathname);
  let file = normalize(join('dist', path));
  if (path.endsWith('/')) file = join(file, 'index.html');
  try {
    const body = await readFile(file);
    response.writeHead(200, { 'Content-Type': types[extname(file)] ?? 'application/octet-stream' });
    response.end(body);
  } catch { response.writeHead(404); response.end('nf'); }
}).listen(4397, '127.0.0.1');

const browser = await chromium.launch({ args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] });
const context = await browser.newContext({ permissions: ['camera'], viewport: { width: 1280, height: 960 } });
const page = await context.newPage();
const logs = [];
page.on('console', message => logs.push(`${message.type()}: ${message.text()}`));

// First: does getUserMedia work at all in this browser config?
await page.goto('http://127.0.0.1:4397/en/scan-document/');
const probe = await page.evaluate(async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    const track = stream.getVideoTracks()[0];
    const result = { ok: true, label: track.label, state: track.readyState };
    stream.getTracks().forEach(item => item.stop());
    return result;
  } catch (error) {
    return { ok: false, error: error.name + ': ' + error.message };
  }
});
console.log('getUserMedia probe:', JSON.stringify(probe));

await page.getByRole('button', { name: 'Open camera and scan' }).click();
await page.waitForTimeout(3000);
const state = await page.evaluate(() => {
  const video = document.querySelector('.scanner-stage video');
  return {
    hasVideo: Boolean(video),
    readyState: video?.readyState,
    videoWidth: video?.videoWidth,
    paused: video?.paused,
    srcObject: Boolean(video?.srcObject),
    errorText: document.querySelector('.error')?.textContent ?? null,
  };
});
console.log('after click:', JSON.stringify(state));
console.log('logs:', JSON.stringify(logs.filter(line => !line.startsWith('debug')), null, 2));
await page.screenshot({ path: 'C:/Users/Fajar/AppData/Local/Temp/commandcode/E--dev-fajar-vd/73e4d36f-c534-4b8c-bbf1-36584b6e294f/scratchpad/live-debug.png' });

await browser.close();
server.close();
process.exit(0);
