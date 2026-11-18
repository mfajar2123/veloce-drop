import {test,expect} from '@playwright/test';
import {Buffer} from 'node:buffer';
import {PDFArray,PDFDict,PDFDocument,PDFName,PDFNumber,PDFRawStream,decodePDFRawStream} from 'pdf-lib';

test('A4 landscape sheet respects photo quantity and has crop marks',async({page})=>{
  await page.goto('/id/cetak-foto/');
  const input=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=300;c.height=400;const x=c.getContext('2d')!;x.fillStyle='#0054a6';x.fillRect(0,0,300,400);return c.toDataURL('image/png').split(',')[1]});
  await page.locator('input[type=file]').setInputFiles({name:'sample.png',mimeType:'image/png',buffer:Buffer.from(input,'base64')});
  await expect(page.getByAltText('Foto untuk dicetak')).toBeVisible();await page.locator('summary').filter({hasText:/^Cetak lembar foto$/}).click();
  await page.getByLabel('Kertas cetak').selectOption('a4');await page.getByLabel('Ukuran foto').selectOption('4x6');
  await page.getByLabel('Orientasi kertas').selectOption('landscape');await page.getByLabel('Margin cetak (mm)').fill('10');await page.getByLabel('Jarak foto (mm)').fill('10');
  const preview=page.getByLabel('Pratinjau crop cetak');await expect.poll(()=>preview.evaluate(node=>{const c=node as HTMLCanvasElement;return [c.width,c.height,c.getContext('2d')!.getImageData(10,10,1,1).data[2]]})).toEqual([240,360,166]);
  await expect(page.getByText('Kapasitas: 5 kolom × 2 baris = 10 foto.')).toBeVisible();await page.getByLabel('Jumlah foto').fill('3');
  await page.getByRole('button',{name:'Buat PDF cetak'}).click();const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('link',{name:'Unduh PDF cetak'}).click()]);
  const chunks:Buffer[]=[];for await(const chunk of await download.createReadStream())chunks.push(Buffer.from(chunk));const pdf=await PDFDocument.load(Buffer.concat(chunks));expect(pdf.getPageCount()).toBe(1);
  const sheet=pdf.getPage(0);expect(sheet.getWidth()).toBeCloseTo(297*72/25.4,2);expect(sheet.getHeight()).toBeCloseTo(210*72/25.4,2);
  const resources=sheet.node.Resources();if(!resources)throw new Error('Missing resources');const objects=resources.lookup(PDFName.of('XObject'),PDFDict);const image=pdf.context.lookup(objects.entries()[0][1]);if(!(image instanceof PDFRawStream))throw new Error('Missing image');expect([image.dict.lookup(PDFName.of('Width'),PDFNumber).asNumber(),image.dict.lookup(PDFName.of('Height'),PDFNumber).asNumber()]).toEqual([240,360]);
  const contents=sheet.node.Contents();const streams=contents instanceof PDFArray?Array.from({length:contents.size()},(_,i)=>pdf.context.lookup(contents.get(i))):[contents];
  const commands=streams.map(stream=>{if(!(stream instanceof PDFRawStream))throw new Error('Unexpected PDF stream');return Buffer.from(decodePDFRawStream(stream).decode()).toString()}).join('\n');
  expect((commands.match(/\bDo\b/g)??[]).length).toBe(3);expect((commands.match(/\bS\b/g)??[]).length).toBe(24);
  const scales=[...commands.matchAll(/([\d.]+) 0 0 ([\d.]+) 0 0 cm/g)].map(match=>[Number(match[1]),Number(match[2])]);
  expect(scales.filter(([w,h])=>Math.abs(w-40*72/25.4)<0.01&&Math.abs(h-60*72/25.4)<0.01)).toHaveLength(3);
  const translations=[...commands.matchAll(/1 0 0 1 ([\d.]+) ([\d.]+) cm/g)].map(match=>[Number(match[1]),Number(match[2])]);
  for(const x of [10,60,110])expect(translations.some(([px,py])=>Math.abs(px-x*72/25.4)<0.01&&Math.abs(py-140*72/25.4)<0.01)).toBe(true);
  const marks=[...commands.matchAll(/([\d.]+) ([\d.]+) m\s+([\d.]+) ([\d.]+) l\s+S/g)].map(match=>match.slice(1).map(Number));expect(marks).toHaveLength(24);
  for(const [x1,y1,x2,y2] of marks){expect(Math.hypot(x2-x1,y2-y1)).toBeCloseTo(2*72/25.4,2);expect(Math.min(x1,x2,y1,y2)).toBeGreaterThanOrEqual(0);expect(Math.max(x1,x2)).toBeLessThan(sheet.getWidth());expect(Math.max(y1,y2)).toBeLessThan(sheet.getHeight())}
});

test('print-sheet crop position updates its preview and generated PDF',async({page},testInfo)=>{
  await page.goto('/id/cetak-foto/');
  const source=await page.evaluate(()=>{const canvas=document.createElement('canvas');canvas.width=300;canvas.height=100;const context=canvas.getContext('2d')!;for(const [index,color] of ['red','green','blue'].entries()){context.fillStyle=color;context.fillRect(index*100,0,100,100)}return canvas.toDataURL('image/png').split(',')[1]});
  await page.locator('input[type=file]').setInputFiles({name:'bands.png',mimeType:'image/png',buffer:Buffer.from(source,'base64')});
  await page.locator('summary').filter({hasText:/^Cetak lembar foto$/}).click();
  const preview=page.getByLabel('Pratinjau crop cetak');const centerPixel=()=>preview.evaluate(node=>[...(node as HTMLCanvasElement).getContext('2d')!.getImageData(120,160,1,1).data]);
  await expect.poll(centerPixel).toEqual([0,128,0,255]);
  const exportCropStream=async()=>{await page.getByRole('button',{name:'Buat PDF cetak'}).click();const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('link',{name:'Unduh PDF cetak'}).click()]);const chunks:Buffer[]=[];for await(const chunk of await download.createReadStream())chunks.push(Buffer.from(chunk));const pdf=await PDFDocument.load(Buffer.concat(chunks));const resources=pdf.getPage(0).node.Resources();if(!resources)throw new Error('Missing resources');const objects=resources.lookup(PDFName.of('XObject'),PDFDict);const image=pdf.context.lookup(objects.entries()[0][1]);if(!(image instanceof PDFRawStream))throw new Error('Missing embedded crop image');expect([image.dict.lookup(PDFName.of('Width'),PDFNumber).asNumber(),image.dict.lookup(PDFName.of('Height'),PDFNumber).asNumber()]).toEqual([60,80]);return Buffer.from(image.contents)};
  await page.getByLabel('Posisi crop horizontal').fill('0');await expect.poll(centerPixel).toEqual([255,0,0,255]);const leftCrop=await exportCropStream();
  await page.getByLabel('Posisi crop horizontal').fill('100');await expect.poll(centerPixel).toEqual([0,0,255,255]);const rightCrop=await exportCropStream();expect(rightCrop.equals(leftCrop)).toBe(false);
  await page.getByRole('button',{name:'Pusatkan crop'}).click();await expect.poll(centerPixel).toEqual([0,128,0,255]);
  if(testInfo.project.name==='chromium')await page.screenshot({path:testInfo.outputPath('print-sheet-positioned-crop.png'),fullPage:true});
  expect((await exportCropStream()).length).toBeGreaterThan(0);
});
