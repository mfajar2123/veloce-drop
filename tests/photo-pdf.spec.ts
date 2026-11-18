import {test,expect} from '@playwright/test';
import {Buffer} from 'node:buffer';
import {PDFDocument,PDFName,PDFDict,PDFRawStream,PDFNumber} from 'pdf-lib';

test('photo PDF preserves reordered and rotated pages with A4 MediaBoxes',async({page},testInfo)=>{
  await page.goto('/id/foto-ke-pdf/');
  const images=await page.evaluate(()=>[[80,40,'red'],[30,60,'blue']].map(([w,h,color])=>{const c=document.createElement('canvas');c.width=w as number;c.height=h as number;const ctx=c.getContext('2d')!;ctx.fillStyle=color as string;ctx.fillRect(0,0,c.width,c.height);return c.toDataURL('image/png').split(',')[1]}));
  await page.locator('input[type=file]').setInputFiles([{name:'first.png',mimeType:'image/png',buffer:Buffer.from(images[0],'base64')},{name:'second.png',mimeType:'image/png',buffer:Buffer.from(images[1],'base64')}]);
  await expect(page.locator('ol').getByText('second.png', {exact:false})).toBeVisible();
  const pagePreviews=page.locator('[data-pdf-page-preview]');await expect(pagePreviews).toHaveCount(2);await expect(pagePreviews.nth(0)).toContainText('first.png');await expect(pagePreviews.nth(1)).toContainText('second.png');
  const portraitRatio=await pagePreviews.first().locator(':scope > div').evaluate(node=>{const rect=node.getBoundingClientRect();return rect.width/rect.height});expect(portraitRatio).toBeCloseTo(210/297,1);
  await page.getByRole('button',{name:'Naikkan second.png'}).click();
  await page.getByRole('button',{name:'Putar second.png'}).click();
  await expect(pagePreviews.nth(0)).toContainText('second.png');await expect(pagePreviews.first().locator('[data-page-image-preview]')).toHaveAttribute('data-rotation','90');
  await page.getByLabel('Orientasi').selectOption('landscape');const landscapeRatio=await pagePreviews.first().locator(':scope > div').evaluate(node=>{const rect=node.getBoundingClientRect();return rect.width/rect.height});expect(landscapeRatio).toBeGreaterThan(1);
  if(testInfo.project.name==='chromium'){await page.screenshot({path:testInfo.outputPath('photo-pdf-preview-desktop.png'),fullPage:true});await page.setViewportSize({width:375,height:812});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:testInfo.outputPath('photo-pdf-preview-mobile.png'),fullPage:true})}
  await page.getByRole('button',{name:'Buat PDF'}).click();
  const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('link',{name:'Unduh PDF'}).click()]);
  const chunks:Buffer[]=[];for await(const chunk of await download.createReadStream())chunks.push(Buffer.from(chunk));const bytes=Buffer.concat(chunks);
  expect(bytes.subarray(0,5).toString()).toBe('%PDF-');const pdf=await PDFDocument.load(bytes);expect(pdf.getPageCount()).toBe(2);
  for(const p of pdf.getPages()){expect(p.getWidth()).toBeCloseTo(297*72/25.4,2);expect(p.getHeight()).toBeCloseTo(210*72/25.4,2)}
  const dimensions=pdf.getPages().map(p=>{const resources=p.node.Resources();if(!resources)throw new Error('Missing resources');const objects=resources.lookup(PDFName.of('XObject'),PDFDict);const ref=objects.entries()[0][1];const image=pdf.context.lookup(ref);if(!(image instanceof PDFRawStream))throw new Error('Missing image stream');return [image.dict.lookup(PDFName.of('Width'),PDFNumber).asNumber(),image.dict.lookup(PDFName.of('Height'),PDFNumber).asNumber()]});
  expect(dimensions).toEqual([[60,30],[80,40]]);
});

test('photo organizer accepts drag reordering',async({page})=>{
  await page.goto('/id/foto-ke-pdf/');
  const images=await page.evaluate(()=>['red','blue'].map(color=>{const c=document.createElement('canvas');c.width=40;c.height=30;const x=c.getContext('2d')!;x.fillStyle=color;x.fillRect(0,0,40,30);return c.toDataURL('image/png').split(',')[1]}));
  await page.locator('input[type=file]').setInputFiles([{name:'first.png',mimeType:'image/png',buffer:Buffer.from(images[0],'base64')},{name:'second.png',mimeType:'image/png',buffer:Buffer.from(images[1],'base64')}]);
  const rows=page.locator('ol').filter({hasText:'first.png'}).locator('li');await expect(rows).toHaveCount(2,{timeout:10_000});await rows.nth(0).dragTo(rows.nth(1));
  await expect(rows.first()).toContainText('second.png');
});

test('photo organizer accepts a file dropped onto its uploader',async({page})=>{
  await page.goto('/id/foto-ke-pdf/');
  const image=await page.evaluate(()=>{const canvas=document.createElement('canvas');canvas.width=4;canvas.height=2;canvas.getContext('2d')!.fillRect(0,0,4,2);return canvas.toDataURL('image/png').split(',')[1]});
  await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));
  await page.evaluate(base64=>{const bytes=Uint8Array.from(atob(base64),character=>character.charCodeAt(0));const transfer=new DataTransfer();transfer.items.add(new File([bytes],'photo-drop.png',{type:'image/png'}));const input=document.querySelector<HTMLInputElement>('input[type="file"]')!;input.closest('label')!.dispatchEvent(new DragEvent('drop',{bubbles:true,dataTransfer:transfer}))},image);
  await expect(page.locator('ol').getByText('photo-drop.png',{exact:false})).toBeVisible();
});

test('photo PDF exports F4 and Letter MediaBoxes',async({page})=>{
  test.setTimeout(60_000);
  await page.goto('/id/foto-ke-pdf/');await page.locator('input[type=file]').setInputFiles('tests/fixtures/portrait.jpg');
  await expect(page.getByRole('listitem').filter({hasText:'portrait.jpg'})).toBeVisible({timeout:20_000});
  for(const [paper,width,height] of [['f4',210*72/25.4,330*72/25.4],['letter',612,792]] as const){
    await page.getByLabel('Ukuran kertas').selectOption(paper);await page.getByRole('button',{name:'Buat PDF'}).click();
    const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('link',{name:'Unduh PDF'}).click()]);
    const chunks:Buffer[]=[];for await(const chunk of await download.createReadStream())chunks.push(Buffer.from(chunk));
    const pdf=await PDFDocument.load(Buffer.concat(chunks));expect(pdf.getPageCount()).toBe(1);expect(pdf.getPage(0).getWidth()).toBeCloseTo(width,2);expect(pdf.getPage(0).getHeight()).toBeCloseTo(height,2);
  }
});
