import {test,expect} from '@playwright/test';
import {PDFDocument} from 'pdf-lib';
import {unzipSync} from 'fflate';
import {readFile} from 'node:fs/promises';

for(const format of ['pdf','jpeg']){
  test('two scanned sheets export as '+format,async({page})=>{
    await page.goto('/en/scan-document/');
    for(let i=0;i<2;i++){
      await page.getByLabel('Choose a document photo').setInputFiles('tests/fixtures/scan-page.png');
      await page.getByLabel('Save as').selectOption(format);
      await page.getByRole('button',{name:'Preview scan'}).click();
      if(i===0)await page.getByRole('button',{name:'Add another page'}).click();
    }
    const link=page.getByRole('link',{name:format==='pdf'?'Download PDF':'Download ZIP'});
    const [download]=await Promise.all([page.waitForEvent('download'),link.click()]);
    const bytes=await readFile((await download.path())!);
    if(format==='pdf')expect((await PDFDocument.load(bytes)).getPageCount()).toBe(2);
    else expect(Object.keys(unzipSync(bytes))).toEqual(['scan-01.jpg','scan-02.jpg']);
  });
}
test('switching files preserves each crop result',async({page})=>{
  await page.goto('/en/resize-image/');
  await page.locator('input[type=file]').setInputFiles(['tests/fixtures/portrait.jpg','tests/fixtures/scan-page.png']);
  await page.getByRole('button',{name:'Create image'}).click();
  const link=page.getByRole('link',{name:'Download PNG'});
  await expect(link).toBeVisible();
  const first=await link.getAttribute('href');
  await page.getByRole('button',{name:'2. scan-page.png'}).click();
  await page.getByRole('button',{name:'Create image'}).click();
  await expect(link).toBeVisible();
  expect(await link.getAttribute('href')).not.toBe(first);
  await page.getByRole('button',{name:'1. portrait.jpg'}).click();
  await expect(link).toHaveAttribute('href',first!);
});
