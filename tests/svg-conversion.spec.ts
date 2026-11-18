import { test, expect } from '@playwright/test';
import { Buffer } from 'node:buffer';
import { waitForHydration } from './helpers';

const baseURL=process.env.PLAYWRIGHT_BASE_URL??`http://127.0.0.1:${process.env.PLAYWRIGHT_PORT??'4321'}`;

test('sanitizes and rasterizes SVG to a transparent PNG', async ({ page }) => {
  await page.goto('/id/konversi/gambar/');
  await waitForHydration(page);
  await page.getByLabel('Format gambar atau tindakan').selectOption('svg');
  const source = '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="32" viewBox="0 0 64 32"><rect x="4" y="4" width="24" height="24" rx="4" fill="#db1514"/><circle cx="48" cy="16" r="10" fill="#0054a6"/></svg>';
  await page.locator('input[type=file]').setInputFiles({ name: 'shape.svg', mimeType: 'image/svg+xml', buffer: Buffer.from(source) });
  await page.getByRole('button', { name: 'Buat pratinjau' }).click();
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('link', { name: 'Unduh gambar' }).click()]);
  const chunks: Buffer[] = []; for await (const chunk of await download.createReadStream()) chunks.push(Buffer.from(chunk));
  const output = Buffer.concat(chunks);
  expect([...output.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
  const pixels = await page.evaluate(async data => {
    const image = await createImageBitmap(await (await fetch(`data:image/png;base64,${data}`)).blob());
    const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height;
    const context = canvas.getContext('2d')!; context.drawImage(image, 0, 0);
    return { size: [image.width, image.height], red: [...context.getImageData(12, 16, 1, 1).data], blue: [...context.getImageData(48, 16, 1, 1).data], clear: [...context.getImageData(60, 30, 1, 1).data] };
  }, output.toString('base64'));
  expect(pixels.size).toEqual([64, 32]); expect(pixels.red[0]).toBeGreaterThan(180); expect(pixels.blue[2]).toBeGreaterThan(120); expect(pixels.clear[3]).toBe(0);
});

test('rejects active and external SVG content without making a request', async ({ page }) => {
  const requests: string[] = []; page.on('request', request => requests.push(request.url()));
  await page.goto('/en/konversi/image/');
  await waitForHydration(page);
  await page.getByLabel('Image format or action').selectOption('svg');
  const source = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><script>alert(1)</script><image href="https://example.invalid/pixel.png" width="1" height="1"/></svg>';
  await page.locator('input[type=file]').setInputFiles({ name: 'unsafe.svg', mimeType: 'image/svg+xml', buffer: Buffer.from(source) });
  await page.getByRole('button', { name: 'Create preview' }).click();
  await expect(page.getByRole('alert')).toContainText('unsupported or unsafe content');
  await expect(page.getByRole('link', { name: 'Download image' })).toHaveCount(0);
  expect(requests.filter(url => !url.startsWith(`${baseURL}/`))).toEqual([]);
});

test('rejects malformed and oversized SVG dimensions before rasterization', async ({ page }) => {
  await page.goto('/id/konversi/gambar/');
  await waitForHydration(page);
  await page.getByLabel('Format gambar atau tindakan').selectOption('svg');
  for (const [name, source] of [['relative.svg', '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="24"><rect width="10" height="10"/></svg>'], ['huge.svg', '<svg xmlns="http://www.w3.org/2000/svg" width="6001" height="6001"><rect width="6001" height="6001"/></svg>']]) {
    await page.locator('input[type=file]').setInputFiles({ name, mimeType: 'image/svg+xml', buffer: Buffer.from(source) });
    await page.getByRole('button', { name: 'Buat pratinjau' }).click();
    await expect(page.getByRole('alert')).toContainText(/dimensi SVG tidak valid/i);
  }
});
