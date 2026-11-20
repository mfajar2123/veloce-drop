import { chromium } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  for (const [source, outputs] of [
    ['compress-image-without-losing-quality', [['landing-workspace-sample.webp', 0.84], ['landing-workspace-sample-768.webp', 0.82, 768], ['landing-workspace-compressed.webp', 0.42], ['landing-workspace-compressed-768.webp', 0.4, 768]]],
    ['why-local-processing-matters', [['landing-product-sample.webp', 0.8], ['landing-product-sample-768.webp', 0.78, 768]]],
  ]) {
    const base64 = (await readFile(`public/images/articles/${source}.webp`)).toString('base64');
    await page.setContent(`<img id="source" src="data:image/webp;base64,${base64}">`);
    const result = await page.evaluate(async (variants) => {
      const image = document.querySelector('#source');
      await image.decode();
      const canvas = document.createElement('canvas');
      const sourceWidth = image.naturalWidth;
      const sourceHeight = image.naturalHeight;
      const context = canvas.getContext('2d');
      const files = [];
      for (const [name, quality, targetWidth] of variants) {
        canvas.width = targetWidth ?? sourceWidth;
        canvas.height = Math.round(sourceHeight * canvas.width / sourceWidth);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const blob = await new Promise((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('WebP encoding failed')), 'image/webp', quality));
        files.push({ name, width: canvas.width, height: canvas.height, bytes: Array.from(new Uint8Array(await blob.arrayBuffer())), size: blob.size });
      }
      return files;
    }, outputs);
    for (const file of result) {
      await writeFile(`public/images/${file.name}`, Uint8Array.from(file.bytes));
      console.log(`${file.name}: ${file.width}x${file.height}, ${file.size} bytes`);
    }
  }
} finally {
  await browser.close();
}
