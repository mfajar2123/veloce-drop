import { expect, test } from '@playwright/test';

test('support pages explain actual limits and retain localized routes', async ({ page }) => {
  await page.goto('/id/info/tentang/');
  await expect(page.getByRole('heading', { level: 1, name: 'Tentang VeloceDrop' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'EN', exact: true })).toHaveAttribute('href', '/en/info/about/');
  await expect(page.getByRole('contentinfo').getByRole('link', { name: 'Kontak' })).toHaveAttribute('href', '/id/info/kontak/');

  await page.goto('/en/info/help/');
  await expect(page.getByRole('heading', { name: 'Background removal model' })).toBeVisible();
  await expect(page.getByText(/40\.7 MB/)).toBeVisible();
  await expect(page.getByRole('contentinfo').getByRole('link', { name: 'Terms' })).toHaveAttribute('href', '/en/info/terms/');

  await page.goto('/id/info/kontak/');
  await expect(page.getByRole('heading', { name: 'Kontak' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'velocedrop2123@gmail.com' })).toHaveAttribute('href', 'mailto:velocedrop2123@gmail.com');
  await expect(page.getByRole('button', { name: 'Salin alamat email' })).toBeVisible();

  await page.goto('/en/info/contact/');
  await expect(page.getByRole('heading', { name: 'Contact' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'velocedrop2123@gmail.com' })).toHaveAttribute('href', 'mailto:velocedrop2123@gmail.com');
  await expect(page.getByRole('button', { name: 'Copy email address' })).toBeVisible();

  await page.goto('/en/privacy/');
  await expect(page.getByRole('heading', { name: 'Privacy' })).toBeVisible();
  await expect(page.getByText(/not a claim that loading the website is offline/i)).toBeVisible();
  await expect(page.getByText(/no advertising publisher/i)).toBeVisible();
});
