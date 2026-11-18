import {test,expect} from '@playwright/test';
import {PDFDocument,PDFName,PDFDict,PDFRawStream,PDFNumber,rgb} from 'pdf-lib';
import {Buffer} from 'node:buffer';

test('rasterized PDF preserves page sizes and reports the actual target result',async({page})=>{
  test.setTimeout(90_000);
  const source=await PDFDocument.create();source.addPage([144,72]).drawRectangle({x:0,y:0,width:144,height:72,color:rgb(1,0,0)});source.addPage([72,144]).drawRectangle({x:0,y:0,width:72,height:144,color:rgb(0,0,1)});
  await page.goto('/id/kompres-pdf/500kb/');await page.locator('input[type=file]').setInputFiles({name:'example.pdf',mimeType:'application/pdf',buffer:Buffer.from(await source.save())});
  await expect(page.getByRole('button',{name:'Kompres PDF'})).toBeDisabled();await page.getByLabel('Saya memahami PDF akan diubah menjadi gambar.').check();
  await page.getByLabel('Resolusi (DPI)').selectOption('72');await page.getByRole('button',{name:'Kompres PDF'}).click();
  await expect(page.getByRole('heading',{name:'Target tercapai'})).toBeVisible();
  const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('link',{name:'Unduh PDF'}).click()]);
  const chunks:Buffer[]=[];for await(const chunk of await download.createReadStream())chunks.push(Buffer.from(chunk));const output=Buffer.concat(chunks);
  expect(output.length).toBeLessThanOrEqual(500_000);await expect(page.getByText(new RegExp(output.length.toLocaleString('id')+' bytes'))).toBeVisible();
  const pdf=await PDFDocument.load(output);expect(pdf.getPageCount()).toBe(2);expect(pdf.getPages().map(p=>[p.getWidth(),p.getHeight()])).toEqual([[144,72],[72,144]]);
  const images=pdf.getPages().map(p=>{const resources=p.node.Resources();if(!resources)throw new Error('Missing resources');const objects=resources.lookup(PDFName.of('XObject'),PDFDict);const image=pdf.context.lookup(objects.entries()[0][1]);if(!(image instanceof PDFRawStream))throw new Error('Missing image');return [image.dict.lookup(PDFName.of('Width'),PDFNumber).asNumber(),image.dict.lookup(PDFName.of('Height'),PDFNumber).asNumber(),image.dict.get(PDFName.of('Filter'))?.toString()]});
  expect(images).toEqual([[144,72,'/DCTDecode'],[72,144,'/DCTDecode']]);
  await page.getByLabel('Target (KB)').fill('1');await page.getByRole('button',{name:'Kompres PDF'}).click();await expect(page.getByRole('heading',{name:'Target belum tercapai'})).toBeVisible();
});
