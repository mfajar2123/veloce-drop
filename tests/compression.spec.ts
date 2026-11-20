import { test, expect } from '@playwright/test';
import { Buffer } from 'node:buffer';

test('compresses a real image and downloads a decodable result', async ({ page }) => {
  await page.goto('/id/kompres-foto/');
  const data = await page.evaluate(() => {
    const canvas = document.createElement('canvas'); canvas.width = 80; canvas.height = 60;
    const ctx = canvas.getContext('2d')!; ctx.fillStyle = '#db1514'; ctx.fillRect(0, 0, 80, 60);
    return canvas.toDataURL('image/png').split(',')[1];
  });
  await page.getByLabel('Pilih gambar').setInputFiles({ name: 'sample.png', mimeType: 'image/png', buffer: Buffer.from(data, 'base64') });
  await page.getByRole('button', { name: 'Kompres gambar' }).click();
  await expect(page.getByRole('heading', { name: 'Gambar siap diunduh' })).toBeVisible();
  const split = page.getByLabel('Pemisah perbandingan');
  await expect(split).toHaveValue('50');
  await split.fill('68');
  await expect(split).toHaveValue('68');
  await expect(page.getByLabel('Zoom pratinjau')).toHaveCount(0);
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('link', { name: 'Unduh gambar' }).click()]);
  const stream = await download.createReadStream(); const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  const output = Buffer.concat(chunks);
  expect(output.length).toBeLessThanOrEqual(200_000);
  expect([...output.subarray(0, 3)]).toEqual([0xff, 0xd8, 0xff]);
  const dimensions = await page.evaluate(async data => { const blob = await (await fetch(data)).blob(); const image = await createImageBitmap(blob); return [image.width, image.height]; }, `data:image/jpeg;base64,${output.toString('base64')}`);
  expect(dimensions).toEqual([80, 60]);
});

test('offers dimension reduction only after a full-size target miss', async ({ page }) => {
  await page.goto('/id/kompres-foto/');
  const data = await page.evaluate(() => {
    const canvas = document.createElement('canvas'); canvas.width = 400; canvas.height = 300;
    const ctx = canvas.getContext('2d')!; const image = ctx.createImageData(canvas.width, canvas.height);
    let seed = 17; for (let i = 0; i < image.data.length; i += 4) { seed = (seed * 48271) % 2147483647; const value = seed % 256; image.data[i] = value; image.data[i + 1] = (value * 3) % 256; image.data[i + 2] = (value * 7) % 256; image.data[i + 3] = 255; }
    ctx.putImageData(image, 0, 0); return canvas.toDataURL('image/png').split(',')[1];
  });
  await page.getByLabel('Pilih gambar').setInputFiles({ name: 'noise.png', mimeType: 'image/png', buffer: Buffer.from(data, 'base64') });
  await page.getByLabel('Target (KB)').fill('5');
  await page.getByRole('button', { name: 'Kompres gambar' }).click();
  await expect(page.getByRole('heading', { name: 'Target belum tercapai' })).toBeVisible();
  const resolutionButton = page.getByRole('button', { name: 'Coba perkecil dimensi' });
  await expect(resolutionButton).toBeVisible();
  await resolutionButton.click();
  await expect(page.getByText(/Target tercapai setelah dimensi dikurangi/)).toBeVisible({ timeout: 30_000 });
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('link', { name: 'Unduh gambar' }).click()]);
  const stream = await download.createReadStream(); const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  const output = Buffer.concat(chunks);
  expect(output.length).toBeLessThanOrEqual(5_000);
  const dimensions = await page.evaluate(async data => { const blob = await (await fetch(data)).blob(); const image = await createImageBitmap(blob); return [image.width, image.height]; }, `data:image/jpeg;base64,${output.toString('base64')}`);
  expect(dimensions[0]).toBeLessThan(400); expect(dimensions[1]).toBeLessThan(300);
});

test('rejects a corrupt file', async ({ page }) => {
  await page.goto('/id/kompres-foto/');
  await page.getByLabel('Pilih gambar').setInputFiles({ name: 'bad.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('not an image') });
  await page.getByRole('button', { name: 'Kompres gambar' }).click();
  await expect(page.getByRole('alert')).toBeVisible();
});

test('rejects an oversized declared PNG before decoding it', async ({ page }) => {
  await page.goto('/id/kompres-foto/');
  const header = Buffer.alloc(24);
  header.set([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82]);
  header.writeUInt32BE(100_000, 16); header.writeUInt32BE(100_000, 20);
  await page.getByLabel('Pilih gambar').setInputFiles({ name: 'oversized.png', mimeType: 'image/png', buffer: header });
  await page.getByRole('button', { name: 'Kompres gambar' }).click();
  await expect(page.getByRole('alert')).toContainText('40 megapiksel');
  await expect(page.getByRole('link', { name: 'Unduh gambar' })).toHaveCount(0);
});
