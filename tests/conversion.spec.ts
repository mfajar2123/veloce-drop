import { test, expect } from '@playwright/test';
import { Buffer } from 'node:buffer';

test('transparent PNG converts to JPEG with the chosen background', async ({page})=>{
  await page.goto('/id/konversi/gambar/');
  const data=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=80;c.height=60;const x=c.getContext('2d')!;x.fillStyle='#ff0000';x.fillRect(40,0,40,60);return c.toDataURL('image/png').split(',')[1]});
  await page.locator('input[type=file]').setInputFiles({name:'alpha.png',mimeType:'image/png',buffer:Buffer.from(data,'base64')});
  await page.getByLabel('Warna latar').fill('#00ff00');
  await page.getByRole('button',{name:'Buat pratinjau'}).click();
  const preview=page.getByAltText('Pratinjau gambar hasil konversi');
  await expect(preview).toHaveAttribute('width','80');
  await expect(preview).toHaveAttribute('height','60');
  const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('link',{name:'Unduh gambar'}).click()]);
  const chunks:Buffer[]=[];for await(const chunk of await download.createReadStream())chunks.push(Buffer.from(chunk));const output=Buffer.concat(chunks);
  expect([...output.subarray(0,3)]).toEqual([255,216,255]);
  const result=await page.evaluate(async data=>{const image=await createImageBitmap(await(await fetch(`data:image/jpeg;base64,${data}`)).blob());const c=document.createElement('canvas');c.width=image.width;c.height=image.height;const ctx=c.getContext('2d')!;ctx.drawImage(image,0,0);return {width:c.width,height:c.height,left:Array.from(ctx.getImageData(10,30,1,1).data),right:Array.from(ctx.getImageData(70,30,1,1).data)}},output.toString('base64'));
  expect([result.width,result.height]).toEqual([80,60]);expect(result.left[1]).toBeGreaterThan(240);expect(result.left[0]).toBeLessThan(15);expect(result.right[0]).toBeGreaterThan(240);expect(result.right[1]).toBeLessThan(15);
  await page.getByLabel('Warna latar').fill('#000000');await expect(page.getByRole('link',{name:'Unduh gambar'})).toHaveCount(0);
});

test('WebP to PNG retains transparency',async({page})=>{
  await page.goto('/id/konversi/gambar/');
  await page.getByLabel('Format gambar atau tindakan').selectOption('webp');
  const data=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=40;c.height=40;const x=c.getContext('2d')!;x.fillStyle='#ff0000';x.fillRect(20,0,20,40);return c.toDataURL('image/webp').split(',')[1]});
  await page.locator('input[type=file]').setInputFiles({name:'alpha.webp',mimeType:'image/webp',buffer:Buffer.from(data,'base64')});
  await page.getByRole('button',{name:'Buat pratinjau'}).click();
  const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('link',{name:'Unduh gambar'}).click()]);
  const chunks:Buffer[]=[];for await(const chunk of await download.createReadStream())chunks.push(Buffer.from(chunk));const output=Buffer.concat(chunks);
  expect([...output.subarray(0,8)]).toEqual([137,80,78,71,13,10,26,10]);
  const alpha=await page.evaluate(async data=>{const image=await createImageBitmap(await(await fetch(`data:image/png;base64,${data}`)).blob());const c=document.createElement('canvas');c.width=image.width;c.height=image.height;const ctx=c.getContext('2d')!;ctx.drawImage(image,0,0);return [ctx.getImageData(5,20,1,1).data[3],ctx.getImageData(35,20,1,1).data[3]]},output.toString('base64'));
  expect(alpha).toEqual([0,255]);
});
