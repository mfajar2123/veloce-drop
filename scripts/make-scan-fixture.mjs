import { chromium } from '@playwright/test';

// A synthetic "photo of a page": a bright, slightly rotated sheet with printed
// lines on a darker desk. Deterministic, so browser tests assert real behaviour
// instead of depending on a hand-picked photograph.
const width = 900;
const height = 1200;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <rect width="${width}" height="${height}" fill="#3f3f46"/>
  <g transform="rotate(-4 450 620)">
    <rect x="95" y="120" width="700" height="1000" fill="#f7f7f2"/>
    <g fill="#1f2937">
      ${Array.from({ length: 26 }, (_, line) => {
        const y = 190 + line * 34;
        const inset = line % 5 === 4 ? 300 : 0;
        return `<rect x="${130 + inset}" y="${y}" width="${560 - inset}" height="12" rx="2"/>`;
      }).join('')}
    </g>
  </g>
</svg>`;

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  await page.setContent(`<body style="margin:0"><img id="page" src="data:image/svg+xml,${encodeURIComponent(svg)}" width="${width}" height="${height}"/></body>`);
  await page.locator('#page').screenshot({ path: 'tests/fixtures/scan-page.png', animations: 'disabled' });
} finally {
  await browser.close();
}
console.log('Wrote tests/fixtures/scan-page.png');
