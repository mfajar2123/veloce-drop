import { test, expect } from '@playwright/test';

test('article index lists guides in both locales', async ({ page }) => {
  for (const [route, heading] of [['/en/articles/', 'Guides for everyday image and PDF work'], ['/id/articles/', 'Panduan untuk pekerjaan foto dan PDF sehari-hari']] as const) {
    await page.goto(route);
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
    expect(await page.locator('[data-article]:visible').count()).toBeGreaterThan(0);
    await expect(page.locator('[data-article-count]')).toContainText(/\d+/);
  }
});

test('article search and category filters narrow the list', async ({ page }) => {
  await page.goto('/en/articles/');
  const cards = page.locator('[data-article]');
  const total = await cards.count();
  expect(total).toBeGreaterThanOrEqual(6);

  await page.getByRole('searchbox').fill('passport');
  await expect.poll(() => page.locator('[data-article]:visible').count()).toBeLessThan(total);
  const passportCount = await page.locator('[data-article]:visible').count();
  expect(passportCount).toBeGreaterThanOrEqual(1);

  await page.getByRole('searchbox').fill('zzzz-no-match');
  await expect(page.locator('[data-article-empty]')).toBeVisible();

  await page.getByRole('searchbox').fill('');
  const beforeFilter = await page.locator('[data-article]:visible').count();
  await page.locator('[data-articles] [data-category="documents"]').first().click();
  const documentsVisible = await page.locator('[data-article]:visible').count();
  expect(documentsVisible).toBeGreaterThan(0);
  expect(documentsVisible).toBeLessThan(beforeFilter);
  const categories = await page.locator('[data-article]:visible').evaluateAll(nodes => nodes.map(node => node.getAttribute('data-category')));
  expect(categories.every(category => category === 'documents')).toBe(true);
});

test('article pagination moves between pages', async ({ page }) => {
  await page.goto('/en/articles/');
  const pagination = page.locator('[data-pagination]');
  if (await pagination.isHidden()) return;
  const firstPage = await page.locator('[data-article]:visible h2').first().innerText();
  await page.locator('[data-page-next]').click();
  await expect.poll(() => page.locator('[data-article]:visible h2').first().innerText()).not.toBe(firstPage);
  await page.locator('[data-page-prev]').click();
  await expect.poll(() => page.locator('[data-article]:visible h2').first().innerText()).toBe(firstPage);
});

test('article detail renders prose, table of contents, schema and links back to a tool', async ({ page }) => {
  await page.goto('/en/articles/why-200kb-targets-fail/');
  await expect(page.getByRole('heading', { level: 1, name: /200 KB compression target/ })).toBeVisible();
  expect(await page.locator('.article-prose h2').count()).toBeGreaterThan(5);
  expect(await page.locator('.article-toc a').count()).toBeGreaterThan(3);
  await expect(page.locator('.article-cta')).toBeVisible();

  const schemas = (await page.locator('script[type="application/ld+json"]').allTextContents()).map(value => JSON.parse(value));
  const types = schemas.map(schema => schema['@type']);
  expect(types).toContain('Article');
  expect(types).toContain('BreadcrumbList');
  const article = schemas.find(schema => schema['@type'] === 'Article');
  expect(article.headline.length).toBeGreaterThan(10);
  expect(article.inLanguage).toBe('en');

  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'article');
  await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toBeVisible();
});

test('each article has a translation in the other locale', async ({ page }) => {
  for (const [route, linkName, target] of [
    ['/en/articles/why-200kb-targets-fail/', 'Baca dalam bahasa Indonesia', '/id/articles/why-200kb-targets-fail/'],
    ['/id/articles/why-200kb-targets-fail/', 'Read in English', '/en/articles/why-200kb-targets-fail/'],
  ] as const) {
    await page.goto(route);
    const link = page.getByRole('link', { name: linkName });
    await expect(link).toBeVisible();
    await link.click();
    await expect.poll(() => new URL(page.url()).pathname).toBe(target);
  }
});

test('every article shows a self-hosted image with credit and licence', async ({ page, request }) => {
  test.setTimeout(180_000);
  const sitemap = await (await request.get('/sitemap.xml')).text();
  const paths = [...sitemap.matchAll(/<loc>([^<]*\/articles\/[^<]+)<\/loc>/g)]
    .map(match => new URL(match[1]).pathname)
    .filter(path => path.endsWith('/') && !path.endsWith('/articles/'));

  expect(paths.length).toBeGreaterThanOrEqual(30);

  for (const path of paths) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    const figure = page.locator('.article-figure');
    await expect(figure, path).toBeVisible();

    const image = figure.locator('img');
    const src = await image.getAttribute('src');
    expect(src, `${path} image must be self-hosted`).toMatch(/^\/images\/articles\/[\w-]+\.webp$/);

    await image.scrollIntoViewIfNeeded();
    await expect.poll(
      () => image.evaluate(node => (node as HTMLImageElement).naturalWidth),
      { message: `${path} image must load` },
    ).toBeGreaterThan(0);

    const alt = await image.getAttribute('alt');
    expect((alt ?? '').length, `${path} alt text`).toBeGreaterThan(10);

    const credit = await figure.locator('.article-credit').innerText();
    expect(credit, `${path} credit`).toMatch(/CC |CC0|Public Domain/i);
  }
});

test('landing page highlights recent guides with images', async ({ page }) => {
  for (const [route, heading] of [['/en/', 'Answers before you upload.'], ['/id/', 'Jawaban sebelum Anda mengunggah.']] as const) {
    await page.goto(route);
    await expect(page.getByRole('heading', { name: heading })).toBeVisible();
    const highlights = page.locator('.guide-highlight');
    await expect(highlights).toHaveCount(3);
    for (const link of await highlights.locator('a').all()) {
      await expect(link).toHaveAttribute('href', /\/articles\/[\w-]+\/$/);
    }
    // WebKit does not start native lazy loading from scrollIntoViewIfNeeded;
    // a real window scroll is what triggers the intersection observer there.
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    const highlightImages = page.locator('.guide-highlight img');
    await expect.poll(
      () => highlightImages.evaluateAll(nodes => nodes.every(node => (node as HTMLImageElement).naturalWidth > 0)),
      { timeout: 20_000 },
    ).toBe(true);
  }
});

test('every article body is substantial and unique', async ({ request }) => {
  const sitemap = await (await request.get('/sitemap.xml')).text();
  const paths = [...sitemap.matchAll(/<loc>([^<]*\/articles\/[^<]+)<\/loc>/g)].map(match => new URL(match[1]).pathname).filter(path => path.endsWith('/'));
  expect(paths.length).toBeGreaterThanOrEqual(20);

  const seen = new Set<string>();
  for (const path of paths) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
    const html = await response.text();
    const words = html.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
    expect(words, `${path} word count`).toBeGreaterThan(500);
    const start = html.indexOf('data-article-prose');
    const end = html.indexOf('</article>', start);
    const prose = start >= 0 && end > start ? html.slice(start, end) : '';
    expect(prose.length, `${path} prose block`).toBeGreaterThan(2000);
    const fingerprint = prose.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 400);
    expect(seen.has(fingerprint), `${path} duplicates another article`).toBe(false);
    seen.add(fingerprint);
  }
});
