import {test,expect} from '@playwright/test';
import {PDFDocument,rgb} from 'pdf-lib';
import {unzipSync} from 'fflate';
import {Buffer} from 'node:buffer';

test('renders selected PDF pages to JPEG and ZIP in order',async({page})=>{
  const pdf=await PDFDocument.create();pdf.addPage([144,72]).drawRectangle({x:0,y:0,width:144,height:72,color:rgb(1,0,0)});pdf.addPage([72,144]).drawRectangle({x:0,y:0,width:72,height:144,color:rgb(0,0,1)});
  const data=Buffer.from(await pdf.save());const unsafeRequests:string[]=[];
  page.on('request',request=>{if(request.method()!=='GET'||request.url().includes('sensitive.pdf'))unsafeRequests.push(request.url())});
  await page.goto('/id/pdf-ke-jpg/');await page.locator('input[type=file]').setInputFiles({name:'sensitive.pdf',mimeType:'application/pdf',buffer:data});
  await expect(page.getByText('sensitive.pdf · 2 halaman')).toBeVisible();await page.getByLabel('Halaman (kosong = semua)').fill('1-2');
  await page.getByLabel('Resolusi (DPI)').selectOption('72');await page.getByRole('button',{name:'Konversi halaman'}).click();
  const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('link',{name:/Unduh ZIP/}).click()]);
  const chunks:Buffer[]=[];for await(const chunk of await download.createReadStream())chunks.push(Buffer.from(chunk));const archive=unzipSync(Buffer.concat(chunks));
  expect(Object.keys(archive).sort()).toEqual(['page-001.jpg','page-002.jpg']);
  for(const item of Object.values(archive))expect([...item.slice(0,3)]).toEqual([255,216,255]);
  const images=await page.evaluate(async data=>Promise.all(data.map(async item=>{const image=await createImageBitmap(await(await fetch(`data:image/jpeg;base64,${item}`)).blob());const c=document.createElement('canvas');c.width=image.width;c.height=image.height;const ctx=c.getContext('2d')!;ctx.drawImage(image,0,0);return {size:[image.width,image.height],pixel:Array.from(ctx.getImageData(10,10,1,1).data)}})),Object.values(archive).map(item=>Buffer.from(item).toString('base64')));
  expect(images[0].size).toEqual([144,72]);expect(images[1].size).toEqual([72,144]);expect(images[0].pixel[0]).toBeGreaterThan(240);expect(images[1].pixel[2]).toBeGreaterThan(240);expect(unsafeRequests).toEqual([]);
});

test('invalid files produce an error without offering a download',async({page})=>{
  await page.goto('/id/pdf-ke-jpg/');await page.locator('input[type=file]').setInputFiles({name:'bad.pdf',mimeType:'application/pdf',buffer:Buffer.from('not a pdf')});
  await expect(page.getByRole('alert')).toBeVisible();await expect(page.getByRole('link',{name:/Unduh/})).toHaveCount(0);
});
