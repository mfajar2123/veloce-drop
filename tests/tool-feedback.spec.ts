import {test,expect} from '@playwright/test';

for (const width of [320,1280]) {
  test('download feedback at '+width+'px',async({page})=>{
    await page.setViewportSize({width,height:800});
    await page.goto('/id/kompres-foto/?example=workspace');
    await page.getByRole('button',{name:'Kompres gambar'}).click();
    const toast=page.locator('[data-tool-feedback]');
    await expect(toast).toContainText('Berkas JPG siap diunduh.');
    const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('link',{name:'Unduh gambar'}).click()]);
    expect(download.suggestedFilename()).toBe('doculven.jpg');
    await expect(toast).toContainText('Unduhan dimulai.');
    await toast.getByRole('button').click();
    await expect(toast).not.toHaveAttribute('data-visible','true');
  });
}
