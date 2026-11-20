import { chromium } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const svg = await readFile('public/favicon.svg', 'utf8');
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 200, height: 200 }, deviceScaleFactor: 1 });
  await page.setContent(`<img id="icon" src="data:image/svg+xml,${encodeURIComponent(svg)}" width="96" height="96" />`);
  await page.locator('#icon').screenshot({ path: 'public/favicon-96.png', animations: 'disabled' });
  await page.locator("#icon").evaluate(img => { img.width = 180; img.height = 180; });
  await page.locator("#icon").screenshot({ path: "public/apple-touch-icon.png", animations: "disabled" });
} finally {
  await browser.close();
}

const png = await readFile('public/favicon-96.png');
if (png.readUInt32BE(16) !== 96 || png.readUInt32BE(20) !== 96) {
  throw new Error('Generated favicon must be exactly 96 × 96 pixels.');
}
console.log(`Generated ${pathToFileURL(process.cwd() + '/public/favicon-96.png').pathname}`);
