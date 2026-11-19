import {test,expect} from '@playwright/test';
import {Buffer} from 'node:buffer';

test('HEIC primary image converts locally to a valid JPEG',async({page})=>{
  const requests:string[]=[];
  page.on('request',request=>{if(request.method()!=='GET')requests.push(request.url())});
  await page.goto('/id/konversi/gambar/');
  await page.getByLabel('Format gambar atau tindakan').selectOption('heic');
  await page.locator('input[type=file]').setInputFiles('tests/fixtures/basic-8bit-srgb.heic');
  await page.getByRole('button',{name:'Konversi ke JPG'}).click();
  await expect(page.getByText(/1600 × 1200 px · JPEG/)).toBeVisible({timeout:30_000});
  const preview=page.getByAltText('Pratinjau HEIC hasil konversi');
  await expect(preview).toBeVisible();
  await expect(preview).toHaveAttribute('width','1600');
  await expect(preview).toHaveAttribute('height','1200');
  const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('link',{name:'Unduh JPG'}).click()]);
  const chunks:Buffer[]=[];
  for await(const chunk of await download.createReadStream())chunks.push(Buffer.from(chunk));
  const jpeg=Buffer.concat(chunks);
  expect([...jpeg.subarray(0,3)]).toEqual([255,216,255]);
  expect(jpeg.length).toBeGreaterThan(10_000);
  const dimensions=await page.evaluate(async data=>{
    const image=await createImageBitmap(await(await fetch(`data:image/jpeg;base64,${data}`)).blob());
    const result=[image.width,image.height];image.close();return result;
  },jpeg.toString('base64'));
  expect(dimensions).toEqual([1600,1200]);
  expect(requests).toEqual([]);
});

test('invalid HEIC input reports an error without offering a download',async({page})=>{
  await page.goto('/en/convert-image/');
  await page.getByLabel('Image format or action').selectOption('heic');
  await page.locator('input[type=file]').setInputFiles({name:'broken.heic',mimeType:'image/heic',buffer:Buffer.from('not an HEIC')});
  await page.getByRole('button',{name:'Convert to JPG'}).click();
  await expect(page.getByRole('alert')).toContainText('not a supported HEIC/HEIF file');
  await expect(page.getByRole('link',{name:'Download JPG'})).toHaveCount(0);
});
