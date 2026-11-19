import { test, expect } from '@playwright/test';
import { inspectPng } from '../src/engines/png';

function crc32(bytes: Buffer) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

async function pngWithPrivateText(page: import('@playwright/test').Page) {
  const dataUrl = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 16; canvas.height = 8;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#e02020'; ctx.fillRect(0, 0, 8, 8);
    return canvas.toDataURL('image/png');
  });
  const source = Buffer.from(dataUrl.split(',')[1], 'base64');
  const end = source.indexOf(Buffer.from('IEND')) - 4;
  const text = Buffer.from(`Comment\0private fixture ${'x'.repeat(2048)}`);
  const type = Buffer.from('tEXt');
  const payload = Buffer.concat([type, text]);
  const ancillary = Buffer.alloc(text.length + 12);
  ancillary.writeUInt32BE(text.length, 0);
  payload.copy(ancillary, 4);
  ancillary.writeUInt32BE(crc32(payload), ancillary.length - 4);
  const input = Buffer.concat([source.subarray(0, end), ancillary, source.subarray(end)]);
  expect(inspectPng(input).width).toBe(16);
  return input;
}

test('lossless PNG optimization removes metadata and keeps pixels and transparency', async ({ page }, testInfo) => {
  await page.goto('/id/konversi/gambar/');
  await page.getByLabel('Format gambar atau tindakan').selectOption('optimize-png');
  await page.setViewportSize({ width: 375, height: 812 });
  const input = await pngWithPrivateText(page);
  await page.getByLabel('Pilih PNG (maks. 20 MB)').setInputFiles({ name: 'sample.png', mimeType: 'image/png', buffer: input });
  await page.getByRole('button', { name: 'Optimalkan PNG' }).click();
  await expect(page.getByRole('status')).toContainText('lebih kecil');

  const preview = page.getByRole('img', { name: 'PNG teroptimasi' });
  await expect(preview).toBeVisible();
  await expect(page.getByRole('img', { name: 'PNG asli' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('png-optimizer-mobile.png'), fullPage: true });
  const pixels = await preview.evaluate(image => {
    const source = image as HTMLImageElement;
    const canvas = document.createElement('canvas'); canvas.width = 16; canvas.height = 8;
    const ctx = canvas.getContext('2d')!; ctx.drawImage(source, 0, 0);
    return [...ctx.getImageData(2, 4, 1, 1).data, ...ctx.getImageData(12, 4, 1, 1).data];
  });
  expect(pixels.slice(0, 4)).toEqual([224, 32, 32, 255]);
  expect(pixels[7]).toBe(0);

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('link', { name: 'Unduh PNG teroptimasi' }).click(),
  ]);
  const chunks: Buffer[] = [];
  for await (const chunk of await download.createReadStream()) chunks.push(Buffer.from(chunk));
  const output = Buffer.concat(chunks);
  expect(output.length).toBeLessThan(input.length);
  expect(output.indexOf(Buffer.from('private fixture'))).toBe(-1);
  expect([...output.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
  expect(output.readUInt32BE(16)).toBe(16);
  expect(output.readUInt32BE(20)).toBe(8);
});

test('corrupt PNG input is rejected clearly', async ({ page }) => {
  await page.goto('/en/convert-image/');
  await page.getByLabel('Image format or action').selectOption('optimize-png');
  await page.getByLabel('Choose a PNG (up to 20 MB)').setInputFiles({ name: 'broken.png', mimeType: 'image/png', buffer: Buffer.from([1, 2, 3]) });
  await page.getByRole('button', { name: 'Optimize PNG' }).click();
  await expect(page.getByRole('status')).toContainText('valid, complete PNG');
});
