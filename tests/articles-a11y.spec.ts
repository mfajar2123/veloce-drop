import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const routes = [
  ['English guides index', '/en/articles/'],
  ['Indonesian guides index', '/id/articles/'],
  ['English guide article', '/en/articles/why-200kb-targets-fail/'],
  ['Indonesian guide article', '/id/articles/why-200kb-targets-fail/'],
] as const;

for (const [name, route] of routes) {
  test(`${name} has no WCAG 2.2 A/AA axe violations`, async ({ page }) => {
    await page.goto(route);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(
      results.violations.map(({ id, impact, help, nodes }) => ({ id, impact, help, targets: nodes.map(({ target }) => target) })),
    ).toEqual([]);
  });
}

test('guides index reflows without horizontal overflow', async ({ page }) => {
  await page.goto('/en/articles/');
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 820 });
    const dimensions = await page.evaluate(() => ({ client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
    expect(dimensions, `layout at ${width}px`).toEqual({ client: width, scroll: width });
  }
});

test('guide article reflows without horizontal overflow', async ({ page }) => {
  await page.goto('/id/articles/passport-photo-sizes-explained/');
  for (const width of [320, 768, 1440]) {
    await page.setViewportSize({ width, height: 820 });
    const dimensions = await page.evaluate(() => ({ client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
    expect(dimensions, `layout at ${width}px`).toEqual({ client: width, scroll: width });
  }
});
