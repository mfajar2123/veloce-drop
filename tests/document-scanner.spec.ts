import { expect, test } from '@playwright/test';
import { PDFDocument } from 'pdf-lib';

const routes = ['/en/scan-document/', '/id/scan-dokumen/'];

for (const route of routes) {
  test(`${route} offers both a camera and a file path`, async ({ page }) => {
    await page.goto(route);
    await expect(page.locator('main h1')).toBeVisible();
    await expect(page.getByRole('button', { name: /Open camera|Buka kamera/ })).toBeVisible();
    await expect(page.getByLabel(/Choose a document photo|Pilih foto dokumen/)).toBeVisible();
  });
}

test('a chosen photo is detected, squared into a page, and exported as JPG', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/en/scan-document/');

  await page.getByLabel('Choose a document photo').setInputFiles('tests/fixtures/scan-page.png');

  // Four draggable corners appear once the still image is loaded.
  await expect(page.locator('.scanner-corner')).toHaveCount(4, { timeout: 30_000 });
  await expect(page.getByRole('combobox', { name: 'Save as' })).toBeVisible();

  await page.getByRole('button', { name: 'Preview scan' }).click();
  const download = page.getByRole('link', { name: 'Download JPG' });
  await download.waitFor({ timeout: 60_000 });

  const href = await download.getAttribute('href');
  expect(href).toMatch(/^blob:/);

  // The saved page must be a real JPEG and must be upright, not the tilted input.
  const result = await page.evaluate(async (url: string) => {
    const response = await fetch(url);
    const blob = await response.blob();
    const bitmap = await createImageBitmap(blob);
    const { width, height } = bitmap;
    bitmap.close();
    return { type: blob.type, size: blob.size, width, height };
  }, href!);

  expect(result.type).toBe('image/jpeg');
  expect(result.size).toBeGreaterThan(1000);
  // The fixture page is portrait, so a correct warp returns a taller image.
  expect(result.height).toBeGreaterThan(result.width);

  await page.getByRole('button', { name: 'Adjust corners' }).click();
  const original = page.getByRole('img', { name: 'Document to scan' });
  await expect.poll(() => original.evaluate(image => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
});

test('exporting as PDF produces a one-page A4 document', async ({ page }) => {
  test.setTimeout(75_000);
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/en/scan-document/');
  await page.getByRole('link', { name: 'Bahasa Indonesia' }).click();
  await expect(page).toHaveURL(/\/id\/scan-dokumen\/$/);
  await page.getByRole('link', { name: 'English' }).click();
  await expect(page).toHaveURL(/\/en\/scan-document\/$/);
  const fitsViewport = () => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
  expect(await fitsViewport()).toBe(true);
  await page.getByLabel('Choose a document photo').setInputFiles('tests/fixtures/scan-page.png');
  await expect(page.locator('.scanner-corner')).toHaveCount(4, { timeout: 30_000 });
  expect(await fitsViewport()).toBe(true);

  await page.getByRole('combobox', { name: 'Save as' }).selectOption('pdf');
  await page.getByRole('button', { name: 'Preview scan' }).click();
  const download = page.getByRole('link', { name: 'Download PDF' });
  await download.waitFor({ timeout: 60_000 });
  const preview = page.getByRole('img', { name: 'Corrected document scan' });
  await expect(preview).toBeVisible();
  await expect.poll(() => preview.evaluate(image => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  expect((await preview.boundingBox())!.y).toBeLessThan((await download.boundingBox())!.y);
  expect(await fitsViewport()).toBe(true);

  const [file] = await Promise.all([page.waitForEvent('download'), download.click()]);
  const chunks: Buffer[] = [];
  for await (const chunk of await file.createReadStream()) chunks.push(Buffer.from(chunk));
  const bytes = Buffer.concat(chunks);
  expect(bytes.toString('ascii', 0, 5)).toBe('%PDF-');
  const pdf = await PDFDocument.load(bytes);
  expect(pdf.getPageCount()).toBe(1);
  expect(pdf.getPage(0).getWidth()).toBeCloseTo(595.28);
  expect(pdf.getPage(0).getHeight()).toBeCloseTo(841.89);
});
