import type { Page } from '@playwright/test';

export async function waitForHydration(page: Page) {
  await page.waitForFunction(() => {
    const islands = Array.from(document.querySelectorAll('astro-island'));
    return islands.every(island => !island.hasAttribute('ssr'));
  });
}
