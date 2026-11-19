import { expect, test } from '@playwright/test';
import { Buffer } from 'node:buffer';
import { waitForHydration } from './helpers';

test.setTimeout(240_000);

async function openStudio(page: import('@playwright/test').Page) {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/en/remove-background/');
  await waitForHydration(page);
  await expect(page.getByText(/Model ready/)).toBeVisible({ timeout: 120_000 });
  await page.getByLabel('Choose a portrait').setInputFiles('tests/fixtures/portrait.jpg');
  await expect(page.getByRole('application', { name: 'Mask editing preview' })).toBeVisible({ timeout: 120_000 });
}

async function download(page: import('@playwright/test').Page) {
  const [event] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Download PNG', exact: true }).click()]);
  const chunks: Buffer[] = [];
  for await (const chunk of await event.createReadStream()) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks);
}

test('RGB fields and swatches both drive the exported background colour', async ({ page }) => {
  await openStudio(page);

  // Set an exact colour through the numeric RGB inputs.
  await page.getByLabel('Red green blue R').fill('12');
  await page.getByLabel('Red green blue G').fill('140');
  await page.getByLabel('Red green blue B').fill('220');
  await page.waitForTimeout(400);
  const rgbPng = await download(page);

  const corner = await page.evaluate(async data => {
    const image = await createImageBitmap(await (await fetch(`data:image/png;base64,${data}`)).blob());
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext('2d')!;
    context.drawImage(image, 0, 0);
    const pixel = context.getImageData(4, 4, 1, 1).data;
    return { r: pixel[0], g: pixel[1], b: pixel[2], a: pixel[3], width: canvas.width, height: canvas.height };
  }, rgbPng.toString('base64'));

  expect(corner.r).toBeCloseTo(12, 0);
  expect(corner.g).toBeCloseTo(140, 0);
  expect(corner.b).toBeCloseTo(220, 0);
  expect(corner.a).toBe(255);
});

test('exported PNG keeps the original pixel dimensions', async ({ page }) => {
  await openStudio(page);

  // The fixture is 768 px wide. The preview canvas is scaled to fit the screen,
  // so the export must match the decoded source, not the preview.
  const png = await download(page);
  const size = await page.evaluate(async data => {
    const image = await createImageBitmap(await (await fetch(`data:image/png;base64,${data}`)).blob());
    const preview = document.querySelector<HTMLCanvasElement>('canvas[aria-label="Mask editing preview"]');
    return { width: image.width, height: image.height, previewWidth: preview?.width ?? 0 };
  }, png.toString('base64'));

  expect(size.width).toBeGreaterThanOrEqual(760);
  expect(size.height).toBeGreaterThan(size.width);
  // The preview is smaller than the export on a 1440 px viewport.
  expect(size.previewWidth).toBeLessThan(size.width);
});

test('transparent swatch produces alpha zero on the background', async ({ page }) => {
  await openStudio(page);
  await page.getByLabel('Transparent').click();
  await page.waitForTimeout(400);
  const png = await download(page);
  const alpha = await page.evaluate(async data => {
    const image = await createImageBitmap(await (await fetch(`data:image/png;base64,${data}`)).blob());
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext('2d')!;
    context.drawImage(image, 0, 0);
    return context.getImageData(4, 4, 1, 1).data[3];
  }, png.toString('base64'));
  expect(alpha).toBeLessThan(40);
});
