import { chromium } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const svg = await readFile('public/images/og-share.svg', 'utf8');
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.setContent(`<body style="margin:0"><img id="og" src="data:image/svg+xml,${encodeURIComponent(svg)}" width="1200" height="630"/></body>`);
  await page.locator('#og').screenshot({ path: 'public/images/og-share.png', animations: 'disabled' });
} finally {
  await browser.close();
}
console.log('Generated public/images/og-share.png at 1200 × 630.');
