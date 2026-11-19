import { test, expect } from '@playwright/test';
import { Buffer } from 'node:buffer';
import { waitForHydration } from './helpers';

test('creates a valid multi-size ICO with square PNG frames and transparency', async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto('/id/konversi/gambar/');
  await waitForHydration(page);
  await page.getByLabel('Format gambar atau tindakan').selectOption('ico');
  const data = await page.evaluate(() => {
    const canvas = document.createElement('canvas'); canvas.width = 80; canvas.height = 40;
    const context = canvas.getContext('2d')!; context.fillStyle = '#db1514'; context.fillRect(0, 0, 80, 40);
    return canvas.toDataURL('image/png').split(',')[1];
  });
  await page.locator('input[type=file]').setInputFiles({ name: 'logo.png', mimeType: 'image/png', buffer: Buffer.from(data, 'base64') });
  await page.getByRole('button', { name: 'Buat ICO' }).click();
  await expect(page.getByRole('link', { name: 'Unduh ICO' })).toBeVisible();
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('link', { name: 'Unduh ICO' }).click()]);
  const chunks: Buffer[] = []; for await (const chunk of await download.createReadStream()) chunks.push(Buffer.from(chunk));
  const output = Buffer.concat(chunks);
  const directory = await page.evaluate(async encoded => {
    const bytes = Uint8Array.from(atob(encoded), character => character.charCodeAt(0));
    const view = new DataView(bytes.buffer);
    const frames = [];
    for (let index = 0; index < view.getUint16(4, true); index++) {
      const at = 6 + index * 16; const width = bytes[at] || 256; const height = bytes[at + 1] || 256;
      const length = view.getUint32(at + 8, true); const offset = view.getUint32(at + 12, true);
      const image = await createImageBitmap(new Blob([bytes.slice(offset, offset + length)], { type: 'image/png' }));
      const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height;
      const context = canvas.getContext('2d')!; context.drawImage(image, 0, 0);
      frames.push({ width, height, decoded: [image.width, image.height], opaque: context.getImageData(Math.floor(width / 2), Math.floor(height / 2), 1, 1).data[3], clear: context.getImageData(Math.floor(width / 2), 0, 1, 1).data[3], signature: [...bytes.slice(offset, offset + 8)] });
    }
    return { header: [view.getUint16(0, true), view.getUint16(2, true), view.getUint16(4, true)], frames };
  }, output.toString('base64'));
  expect([...output.subarray(0, 6)]).toEqual([0, 0, 1, 0, 6, 0]);
  expect(directory.header).toEqual([0, 1, 6]);
  expect(directory.frames.map(frame => frame.width)).toEqual([16, 32, 48, 64, 128, 256]);
  for (const frame of directory.frames) {
    expect(frame.height).toBe(frame.width); expect(frame.decoded).toEqual([frame.width, frame.height]);
    expect(frame.opaque).toBe(255); expect(frame.clear).toBe(0);
    expect(frame.signature).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
  }
});

test('rejects corrupt raster data instead of renaming it to ICO', async ({ page }) => {
  await page.goto('/en/convert-image/');
  await waitForHydration(page);
  await page.getByLabel('Image format or action').selectOption('ico');
  await page.locator('input[type=file]').setInputFiles({ name: 'broken.png', mimeType: 'image/png', buffer: Buffer.from('not a PNG') });
  await page.getByRole('button', { name: 'Create ICO' }).click();
  await expect(page.getByRole('alert')).toContainText('Choose a valid JPEG, PNG or WebP image.');
  await expect(page.getByRole('link', { name: 'Download ICO' })).toHaveCount(0);
});
