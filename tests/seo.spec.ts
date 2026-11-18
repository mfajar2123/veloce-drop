import { test, expect } from '@playwright/test';

const appBase = (process.env.PLAYWRIGHT_APP_BASE ?? '').replace(/\/$/, '');

test('tool metadata declares canonical, bilingual alternates and structured data', async ({ page }) => {
  await page.goto('/id/konversi/gambar/');
  await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href', /\/id\/konversi\/gambar\/$/);
  await expect(page.locator('link[hreflang=id]')).toHaveAttribute('href', /\/id\/konversi\/gambar\/$/);
  await expect(page.locator('link[hreflang=en]')).toHaveAttribute('href', /\/en\/konversi\/image\/$/);
  await expect(page.locator('link[hreflang=x-default]')).toHaveAttribute('href', /\/id\/konversi\/gambar\/$/);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /\/images\/og-share\.png$/);
  const schemas = await page.locator('script[type="application/ld+json"]').allTextContents();
  expect(schemas.map(value => JSON.parse(value)['@type'])).toEqual(['WebSite', 'WebApplication', 'BreadcrumbList']);
  const breadcrumb = JSON.parse(schemas[2]);
  expect(breadcrumb.itemListElement.map((item: { name: string }) => item.name)).toEqual(['Beranda', 'Alat', 'Konversi format gambar']);
  await expect(page.locator('.tool-reference-faq summary')).toHaveCount(2);
  await expect(page.locator('.tool-reference-faq summary').first()).toHaveText('Format apa yang bisa dikonversi?');
  await expect(page.getByRole('navigation', { name: 'Jejak navigasi' }).getByRole('link', { name: 'Alat' })).toHaveAttribute('href', `${appBase}/id/alat/`);
});

test('catalog and information routes have localized visible and structured breadcrumbs', async ({ page }) => {
  for (const [route, label, breadcrumbNames] of [
    ['/id/alat/', 'Alat gambar dan dokumen', ['Beranda', 'Alat Kompres Foto, Resize, dan PDF']],
    ['/en/info/help/', 'Help', ['Home', 'Help']],
  ] as const) {
    await page.goto(route);
    await expect(page.getByRole('heading', { name: label })).toBeVisible();
    const crumbs = page.getByRole('navigation', { name: route.startsWith('/en/') ? 'Breadcrumb' : 'Jejak navigasi' });
    await expect(crumbs.getByText(breadcrumbNames.at(-1)!, { exact: true })).toBeVisible();
    const schemas = await page.locator('script[type="application/ld+json"]').allTextContents();
    const breadcrumb = schemas.map(value => JSON.parse(value)).find(value => value['@type'] === 'BreadcrumbList');
    expect(breadcrumb.itemListElement.map((item: { name: string }) => item.name)).toEqual(breadcrumbNames);
  }
});

test('privacy metadata describes privacy in both locales, not the shared compression route', async ({ page }) => {
  for (const [route, expected] of [['/id/privasi/', 'memori sesi'], ['/en/privacy/', 'session memory']] as const) {
    await page.goto(route);
    const description = await page.locator('meta[name="description"]').getAttribute('content');
    expect(description).toContain(expected);
    expect(description).not.toContain('200 KB');
  }
});

test('sitemap includes catalog routes and robots points to the sitemap', async ({ request }) => {
  const sitemap = await request.get('/sitemap.xml');
  expect(sitemap.status()).toBe(200);
  const xml = await sitemap.text();
  expect(xml).toContain('/id/konversi/gambar/');
  expect(xml).toContain('/en/konversi/image/');
  expect(xml).toContain('/en/tools/');
  expect(xml).not.toContain('/en/alat/');
  expect(xml).not.toContain('/id/poster-a4/');
  const robots = await request.get('/robots.txt');
  expect(robots.status()).toBe(200);
  expect(await robots.text()).toMatch(/Sitemap: https?:\/\/[^\s]+\/sitemap\.xml/);
});

test('root path redirects visitors to the Indonesian homepage', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/id\/$/, { timeout: 5000 });
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', `${appBase}/favicon-96.png`);
});

test('404 page explains the missing route and links to both homepages', async ({ page }) => {
  const response = await page.goto('/missing-tool-route/');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: 'Halaman tidak ditemukan' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', `${appBase}/favicon-96.png`);
  await expect(page.getByRole('link', { name: 'English home' })).toHaveAttribute('href', `${appBase}/en/`);
});
