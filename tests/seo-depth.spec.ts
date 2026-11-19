import { expect, test } from '@playwright/test';

const tools = [
  'compress-image', 'batch-compress-images', 'resize-image', 'convert-image', 'remove-background',
  'watermark-logo', 'photos-to-pdf', 'pdf-to-jpg', 'compress-pdf/500kb', 'print-photo-sheet',
];

test('every tool page carries explanatory copy beyond the FAQ', async ({ request }) => {
  for (const tool of tools) {
    const response = await request.get(`/en/${tool}/`);
    expect(response.status(), tool).toBe(200);
    const html = await response.text();

    const headings = [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g)].map(match => match[1].replace(/<[^>]+>/g, '').trim());
    // Two guide sections, the FAQ heading and the related-tools heading.
    expect(headings.length, `${tool} h2 count`).toBeGreaterThanOrEqual(4);

    const body = html.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ');
    const words = body.split(/\s+/).filter(Boolean).length;
    expect(words, `${tool} word count`).toBeGreaterThanOrEqual(280);

    const title = (html.match(/<title>([^<]+)<\/title>/) ?? [])[1] ?? '';
    expect(title.length, `${tool} title length`).toBeLessThanOrEqual(70);
    expect(title.length, `${tool} title is descriptive`).toBeGreaterThanOrEqual(35);
  }
});

test('tool pages remain usable without scrolling once a result exists', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/en/compress-image/');
  await page.getByLabel('Choose image').setInputFiles('tests/fixtures/portrait.jpg');
  await page.getByRole('button', { name: 'Compress image' }).click();

  const download = page.getByRole('link', { name: 'Download image' });
  await download.waitFor({ timeout: 60_000 });
  await expect.poll(async () => {
    const box = await download.boundingBox();
    return box ? box.y >= 0 && box.y + box.height <= 900 : false;
  }, { timeout: 15_000 }).toBe(true);
});

test('every guide linked from a page actually exists', async ({ request }) => {
  const sitemap = await request.get('/sitemap.xml');
  expect(sitemap.status()).toBe(200);
  const urls = [...(await sitemap.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => new URL(match[1]).pathname);

  const guideLinks = new Set<string>();
  for (const url of urls) {
    if (/\/articles\//.test(url)) continue;
    const response = await request.get(url);
    if (response.status() !== 200) continue;
    const html = await response.text();
    for (const match of html.matchAll(/href="(\/[a-z]{2}\/articles\/[^"#]+)"/g)) guideLinks.add(match[1]);
  }

  expect(guideLinks.size, 'tool and info pages should link to guides').toBeGreaterThan(5);
  for (const href of guideLinks) {
    const check = await request.get(href);
    expect(check.status(), `dead guide link ${href}`).toBe(200);
  }
});
