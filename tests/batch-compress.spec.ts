import {test,expect} from '@playwright/test';
import {Buffer} from 'node:buffer';
import {unzipSync} from 'fflate';

test('batch reports individual errors and downloads distinct valid JPEG files in ZIP',async({page})=>{
  const writes:string[]=[];page.on('request',request=>{if(request.method()!=='GET')writes.push(request.url())});
  await page.goto('/id/kompres-foto-massal/');
  const data=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=100;c.height=60;const x=c.getContext('2d')!;x.fillStyle='red';x.fillRect(0,0,100,60);return c.toDataURL('image/png').split(',')[1]});
  const buffer=Buffer.from(data,'base64');
  await page.locator('input[type=file]').setInputFiles([{name:'same.png',mimeType:'image/png',buffer},{name:'same.png',mimeType:'image/png',buffer},{name:'bad.png',mimeType:'image/png',buffer:Buffer.from('bad')}]);
  await page.getByRole('button',{name:'Kompres antrean'}).click();
  await expect(page.getByText('Format tidak didukung, rusak, atau gagal dikodekan.')).toBeVisible();
  await expect(page.getByText(/Target tercapai/)).toHaveCount(2);
  const comparison=page.getByLabel('Perbandingan sebelum dan sesudah 1');await expect(comparison).toHaveValue('50');await comparison.focus();await page.keyboard.press('End');await expect(comparison).toHaveValue('100');
  await page.getByRole('button',{name:'Buat ZIP'}).click();
  const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('link',{name:/Unduh ZIP/}).click()]);
  const chunks:Buffer[]=[];for await(const chunk of await download.createReadStream())chunks.push(Buffer.from(chunk));const files=unzipSync(Buffer.concat(chunks));
  expect(Object.keys(files).sort()).toEqual(['same-001.jpg','same-002.jpg']);
  for(const image of Object.values(files)){expect([...image.slice(0,3)]).toEqual([255,216,255]);expect(image.length).toBeLessThanOrEqual(200_000)}
  const decoded=await page.evaluate(async data=>{const image=await createImageBitmap(await(await fetch(`data:image/jpeg;base64,${data}`)).blob());return [image.width,image.height]},Buffer.from(files['same-001.jpg']).toString('base64'));
  expect(decoded).toEqual([100,60]);expect(writes).toEqual([]);
  await page.getByRole('button',{name:'Masukkan ke PDF'}).first().click();
  await expect(page).toHaveURL(/foto-ke-pdf/);
  await expect(page.getByRole('button',{name:'Buat PDF',exact:true})).toBeEnabled();
});
