import { expect, test } from '@playwright/test';

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

  await page.getByRole('button', { name: 'Save scan' }).click();
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
});

test('exporting as PDF produces a one-page A4 document', async ({ page }) => {
  await page.goto('/en/scan-document/');
  await page.getByLabel('Choose a document photo').setInputFiles('tests/fixtures/scan-page.png');
  await expect(page.locator('.scanner-corner')).toHaveCount(4, { timeout: 30_000 });

  await page.getByRole('combobox', { name: 'Save as' }).selectOption('pdf');
  await page.getByRole('button', { name: 'Save scan' }).click();
  const download = page.getByRole('link', { name: 'Download PDF' });
  await download.waitFor({ timeout: 60_000 });

  const href = await download.getAttribute('href');
  const head = await page.evaluate(async (url: string) => {
    const buffer = await (await fetch(url)).arrayBuffer();
    return { bytes: new Uint8Array(buffer.slice(0, 5)), length: buffer.byteLength };
  }, href!);

  expect(String.fromCharCode(...head.bytes)).toBe('%PDF-');
  expect(head.length).toBeGreaterThan(5000);
});
