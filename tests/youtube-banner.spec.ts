import { test, expect } from '@playwright/test';

test('YouTube banner preset exports the selected dimensions on mobile', async ({ page }, testInfo) => {
  await page.goto('/id/ukuran/ubah-ukuran-gambar/');
  await page.getByLabel('Ukuran cepat').selectOption('youtube-banner');
  await page.setViewportSize({ width: 375, height: 812 });
  await page.locator('input[type=file]').setInputFiles('tests/fixtures/portrait.jpg');

  const preview = page.getByLabel('Pratinjau hasil crop');
  await expect(preview).toBeVisible();
  await expect(page.getByText(/Bingkai tengah menunjukkan area aman/)).toBeVisible();
  await expect.poll(() => preview.evaluate(canvas => getComputedStyle(canvas.parentElement!, '::after').borderTopStyle)).toBe('dashed');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('youtube-banner-mobile.png'), fullPage: true });

  await page.getByRole('button', { name: 'Buat gambar' }).click();
  await expect(page.locator('.result').getByText(/2560 × 1440 px · PNG/)).toBeVisible();
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('link', { name: 'Unduh PNG' }).click(),
  ]);
  const chunks: Buffer[] = [];
  for await (const chunk of await download.createReadStream()) chunks.push(Buffer.from(chunk));
  const png = Buffer.concat(chunks);
  expect([...png.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
  expect(png.readUInt32BE(16)).toBe(2560);
  expect(png.readUInt32BE(20)).toBe(1440);
});
