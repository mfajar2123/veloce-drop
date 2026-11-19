import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { catalog } from '../src/tool-registry';

const routes = [
  ['Indonesian landing', '/id/'],
  ['English tool catalog', '/en/tools/'],
  ['image compression tool', '/id/kompres-foto/'],
  ['background removal studio', '/id/hapus-latar/'],
  ['photo to PDF tool', '/id/foto-ke-pdf/'],
  ['document scanner', '/id/scan-dokumen/'],
  ['English help page', '/en/info/help/'],
] as const;

for (const [name, route] of routes) {
  test(`${name} has no WCAG 2.2 A/AA axe violations`, async ({ page }) => {
    await page.goto(route);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(
      results.violations.map(({ id, impact, help, nodes }) => ({
        id,
        impact,
        help,
        targets: nodes.map(({ target }) => target),
      })),
    ).toEqual([]);
  });
}

for (const lang of ['id', 'en'] as const) {
  test(`${lang} tool workspaces have no WCAG 2.2 A/AA axe violations`, async ({ page }) => {
    test.setTimeout(300_000);
    const catalogPath = lang === 'en' ? '/en/tools/' : '/id/alat/';
    await page.goto(catalogPath);
    const paths = await page.locator('[data-tool-list] a').evaluateAll((links) =>
      links.map((link) => (link as HTMLAnchorElement).getAttribute('href')).filter((path): path is string => Boolean(path)),
    );
    expect(paths).toHaveLength(catalog.length);
    for (const path of paths) {
      await page.goto(path);
      await expect(page.locator('main h1')).toBeVisible();
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();
      expect(
        results.violations.map(({ id, impact, help, nodes }) => ({
          id,
          impact,
          help,
          targets: nodes.map(({ target }) => target),
        })),
        `${lang} ${path}`,
      ).toEqual([]);
    }
  });
}

test('landing reflows without horizontal overflow at supported target widths', async ({ page }) => {
  await page.goto('/id/');

  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 820 });
    const dimensions = await page.evaluate(() => ({
      client: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth,
    }));
    expect(dimensions, `layout at ${width}px`).toEqual({ client: width, scroll: width });
  }
});

test('landing respects reduced motion preferences', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/id/');
  const transitionDurations = await page.getByRole('button').first().evaluate((element) =>
    getComputedStyle(element).transitionDuration.split(',').map((duration) => Number.parseFloat(duration)),
  );

  expect(transitionDurations.every((duration) => duration <= 0.00002)).toBe(true);
});

test('enabled controls expose a pointer cursor and disabled controls expose a disabled cursor', async ({ page }) => {
  for (const [, route] of routes) {
    await page.goto(route);
    const affordances = await page.evaluate(() =>
      Array.from(document.querySelectorAll<HTMLElement>(
        'a[href], button, summary, select, input[type="file"], input[type="checkbox"], input[type="radio"], input[type="range"], input[type="color"], label',
      ))
        .filter((element) => element.getClientRects().length > 0)
        .map((element) => {
          const disabled = element.matches(':disabled, [aria-disabled="true"]')
            || (element.matches('label') && Boolean(element.querySelector('input:disabled, select:disabled, textarea:disabled')));
          return {
            name: element.getAttribute('aria-label') || element.textContent?.trim() || element.tagName,
            expected: disabled ? 'not-allowed' : 'pointer',
            actual: getComputedStyle(element).cursor,
          };
        }),
    );

    expect(affordances.filter(({ actual, expected }) => actual !== expected), route).toEqual([]);
  }
});
