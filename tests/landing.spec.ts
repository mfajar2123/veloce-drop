import { expect, test } from '@playwright/test';
import { catalog } from '../src/tool-registry';

async function renderBelowFold(page: import('@playwright/test').Page) {
  const sections = page.locator('.landing-page > section');
  for (let index = 1; index < await sections.count(); index++) {
    await sections.nth(index).scrollIntoViewIfNeeded();
    await page.waitForTimeout(100);
  }
  await page.evaluate(() => {
    document.querySelectorAll<HTMLElement>('.landing-page > section').forEach(section => {
      section.style.contentVisibility = 'visible';
    });
    window.scrollTo({ top: 0, behavior: 'instant' });
  });
}

test('landing shows a working before/after demo and all six sections', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto('/id/');
  await expect(page.getByRole('heading', { level: 1, name: /Berkas beres/ })).toBeVisible();
  await expect(page.getByRole('img', { name: 'Tebing batu merah Sedona sebelum dikompres' })).toBeVisible();
  await expect(page.getByText(/103,9 KB → 44,9 KB · 57% lebih kecil/)).toBeVisible();
  await expect(page.locator('.landing-page > section')).toHaveCount(6);
  await expect(page.getByRole('slider', { name: 'Perbandingan sebelum dan sesudah' })).toBeVisible();
  await renderBelowFold(page);
  await page.screenshot({ path: `test-results/landing-${testInfo.project.name}-desktop.png`, fullPage: true });
  await page.locator('#how').scrollIntoViewIfNeeded();
  await expect(page.getByRole('heading', { name: 'Browser Anda yang mengolah berkas.' })).toBeVisible();
  await page.screenshot({ path: `test-results/landing-${testInfo.project.name}-privacy-desktop.png` });

  await page.setViewportSize({ width: 320, height: 780 });
  await expect(page.locator('body')).toHaveJSProperty('scrollWidth', 320);
  await renderBelowFold(page);
  await page.screenshot({ path: `test-results/landing-${testInfo.project.name}-mobile.png`, fullPage: true });
  await page.locator('#how').scrollIntoViewIfNeeded();
  await expect(page.getByRole('heading', { name: 'Browser Anda yang mengolah berkas.' })).toBeVisible();
  await page.screenshot({ path: `test-results/landing-${testInfo.project.name}-privacy-mobile.png` });
});

test('landing tool search and use-case choices navigate to the selected tools', async ({ page }) => {
  await page.goto('/id/');
  await expect(page.locator('.home-tool-row:visible')).toHaveCount(6);
  await page.getByRole('button', { name: /Tampilkan \d+ alat lain/ }).click();
  await expect(page.locator('.home-tool-row:visible')).toHaveCount(catalog.length);
  await expect(page.getByRole('button', { name: 'Tampilkan lebih sedikit' })).toHaveAttribute('aria-expanded', 'true');
  await page.getByRole('searchbox', { name: 'Cari alat' }).fill('HEIC');
  await expect(page.locator('.home-tool-row:visible')).toHaveCount(1);
  await expect(page.getByRole('link', { name: 'Konversi format gambar' })).toHaveAttribute('href', '/id/konversi/gambar/');

  await page.getByRole('button', { name: 'Menyiapkan foto produk' }).click();
  await expect(page.getByRole('heading', { name: 'Menyiapkan foto produk' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Resize & watermark logo' })).toHaveAttribute('href', '/id/watermark-logo-massal/');

  await page.getByRole('button', { name: 'Merapikan foto untuk dibagikan' }).click();
  await expect(page.getByRole('link', { name: 'Ukuran gambar sosial' })).toHaveAttribute('href', '/id/ukuran/ubah-ukuran-gambar/');
});

test('sample handoff opens compression with the local example and exports a real image', async ({ page }) => {
  await page.goto('/id/');
  await page.getByRole('button', { name: 'Coba foto contoh' }).click();
  await expect(page).toHaveURL(/kompres-foto/);
  await expect(page.getByText(/doculven\.webp/)).toBeVisible();
  await page.getByRole('button', { name: 'Kompres gambar' }).click();
  const downloadLink = page.getByRole('link', { name: 'Unduh gambar' });
  await expect(downloadLink).toBeVisible({ timeout: 30_000 });
  const downloadPromise = page.waitForEvent('download');
  await downloadLink.click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('doculven.jpg');
});
