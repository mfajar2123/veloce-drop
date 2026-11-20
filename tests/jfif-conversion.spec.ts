import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('JFIF input without a MIME type exports unchanged JPG or newly encoded PNG and WebP', async ({ page }) => {
  const bytes = await readFile('public/examples/converted.jpg');
  expect(bytes.subarray(6, 10).toString()).toBe('JFIF');
  await page.goto('/en/convert-image/');
  await page.getByLabel('Image format or action').selectOption('jfif');
  await page.locator('input[type=file]').setInputFiles({name:'photo.JFIF',mimeType:'',buffer:bytes});
  for (const format of ['jpeg','png','webp']) {
    await page.getByLabel('Output format').selectOption('image/'+format);
    await page.getByRole('button',{name:'Create preview'}).click();
    const link = page.getByRole('link',{name:'Download image'});
    await expect(link).toBeVisible();
    const href = await link.getAttribute('href');
    const output = await page.evaluate(async url => {
      const blob = await (await fetch(url!)).blob();
      const image = await createImageBitmap(blob);
      return { type:blob.type,width:image.width,height:image.height };
    }, href);
    expect(output).toEqual({type:'image/'+format,width:1600,height:1200});
    if (format === 'jpeg') {
      const [file] = await Promise.all([page.waitForEvent('download'),link.click()]);
      expect(file.suggestedFilename()).toBe('converted.jpg');
      expect(await readFile((await file.path())!)).toEqual(bytes);
    }
  }
});
