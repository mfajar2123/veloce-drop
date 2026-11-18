import {test,expect} from '@playwright/test';
import {Buffer} from 'node:buffer';

test('JPEG compression applies EXIF orientation and removes the orientation metadata',async({page})=>{
  await page.goto('/id/kompres-foto/');
  const jpeg=Buffer.from(await page.evaluate(()=>{
    const canvas=document.createElement('canvas');canvas.width=2;canvas.height=3;
    const context=canvas.getContext('2d')!;context.fillStyle='red';context.fillRect(0,0,2,1);context.fillStyle='blue';context.fillRect(0,1,2,2);
    return canvas.toDataURL('image/jpeg',.9).split(',')[1];
  }),'base64');
  const exif=Buffer.from([69,120,105,102,0,0,73,73,42,0,8,0,0,0,1,0,18,1,3,0,1,0,0,0,6,0,0,0,0,0,0,0]);
  const segment=Buffer.concat([Buffer.from([255,225,0,exif.length+2]),exif]);
  const oriented=Buffer.concat([jpeg.subarray(0,2),segment,jpeg.subarray(2)]);
  await page.locator('input[type=file]').setInputFiles({name:'orientation-6.jpg',mimeType:'image/jpeg',buffer:oriented});
  await page.getByRole('button',{name:'Kompres gambar'}).click();
  await expect(page.getByRole('link',{name:'Unduh gambar'})).toBeVisible();
  const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('link',{name:'Unduh gambar'}).click()]);
  const chunks:Buffer[]=[];
  for await(const chunk of await download.createReadStream())chunks.push(Buffer.from(chunk));
  const output=Buffer.concat(chunks);
  const dimensions=await page.evaluate(async data=>{
    const image=await createImageBitmap(await(await fetch(`data:image/jpeg;base64,${data}`)).blob());
    const result=[image.width,image.height];image.close();return result;
  },output.toString('base64'));
  expect(dimensions).toEqual([3,2]);
  expect(output.includes(Buffer.from('Exif'))).toBe(false);
});
