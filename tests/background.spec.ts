import {test,expect} from '@playwright/test';
import {Buffer} from 'node:buffer';
import {PDFArray,PDFDocument,PDFRawStream,decodePDFRawStream} from 'pdf-lib';

const baseURL=process.env.PLAYWRIGHT_BASE_URL??`http://127.0.0.1:${process.env.PLAYWRIGHT_PORT??'4321'}`;

test('portrait model runs locally and exports an alpha mask',async({page},testInfo)=>{
  test.setTimeout(180_000);
  await page.setViewportSize({width:1440,height:1000});
  const requests:string[]=[];page.on('request',request=>requests.push(`${request.method()} ${request.url()}`));
  await page.goto('/id/hapus-latar/');
  // The model now downloads on page open, so wait for that request instead of
  // clicking a load button.
  await expect.poll(() => requests.some(url => url.includes('/models/modnet.onnx')), { timeout: 30_000 }).toBe(true);
  await expect(page.getByText(/Model siap|Siap diunduh/)).toBeVisible({timeout:120_000});
  await page.locator('input[type=file]').setInputFiles('tests/fixtures/portrait.jpg');
  await expect(page.getByRole('application',{name:'Pratinjau penyuntingan mask'})).toBeVisible({timeout:120_000});
  await page.screenshot({path:testInfo.outputPath('portrait-mask.png'),fullPage:true});
  const preview=page.getByLabel('Pratinjau penyuntingan mask');await preview.scrollIntoViewIfNeeded();const box=await preview.boundingBox();if(!box)throw new Error('Missing preview');
  const before=await preview.evaluate(node=>{const c=node as HTMLCanvasElement;return c.getContext('2d')!.getImageData(Math.floor(c.width*.52),Math.floor(c.height*.35),1,1).data[3]});
  await page.mouse.move(box.x+box.width*.52,box.y+box.height*.35);await page.mouse.down();await page.mouse.move(box.x+box.width*.53,box.y+box.height*.35,{steps:3});await page.mouse.up();
  await expect.poll(()=>preview.evaluate(node=>{const c=node as HTMLCanvasElement;return c.getContext('2d')!.getImageData(Math.floor(c.width*.52),Math.floor(c.height*.35),1,1).data[3]})).toBeLessThan(before);
  await page.getByRole('button',{name:'Urungkan'}).click();await expect.poll(()=>preview.evaluate(node=>{const c=node as HTMLCanvasElement;return c.getContext('2d')!.getImageData(Math.floor(c.width*.52),Math.floor(c.height*.35),1,1).data[3]})).toBe(before);
  const centerBefore=await preview.evaluate(node=>{const c=node as HTMLCanvasElement;return c.getContext('2d')!.getImageData(Math.floor(c.width*.5),Math.floor(c.height*.5),1,1).data[3]});expect(centerBefore).toBeGreaterThan(0);
  await preview.focus();await page.keyboard.press('Enter');await expect.poll(()=>preview.evaluate(node=>{const c=node as HTMLCanvasElement;return c.getContext('2d')!.getImageData(Math.floor(c.width*.5),Math.floor(c.height*.5),1,1).data[3]})).toBeLessThan(centerBefore);
  await page.getByRole('button',{name:'Urungkan'}).click();
  const softnessControl=page.getByLabel('Kelembutan kuas');await softnessControl.fill('100');await expect(softnessControl).toHaveValue('100');
  await preview.scrollIntoViewIfNeeded();
  const softBox=await preview.boundingBox();if(!softBox)throw new Error('Missing soft brush preview');
  const point=await preview.evaluate(node=>{const c=node as HTMLCanvasElement,ctx=c.getContext('2d')!;for(let y=Math.floor(c.height*.2);y<c.height*.4;y+=4)for(let x=Math.floor(c.width*.4);x<c.width*.65;x+=4){if(ctx.getImageData(x,y,1,1).data[3]>200&&ctx.getImageData(x+4,y,1,1).data[3]>200)return{x:x/c.width,y:y/c.height,alpha:ctx.getImageData(x,y,1,1).data[3],edgeAlpha:ctx.getImageData(x+4,y,1,1).data[3]}}throw new Error('No solid foreground area for soft brush check')});
  const beforeRegion=await preview.evaluate((node,p)=>{const c=node as HTMLCanvasElement,ctx=c.getContext('2d')!,x=Math.floor(c.width*p.x),y=Math.floor(c.height*p.y);return ctx.getImageData(Math.max(0,x-20),Math.max(0,y-20),40,40).data.filter((_,i)=>i%4===3)},point);
  await page.mouse.move(softBox.x+softBox.width*point.x,softBox.y+softBox.height*point.y);await page.mouse.down();await page.mouse.move(softBox.x+softBox.width*(point.x+.01),softBox.y+softBox.height*point.y,{steps:3});await page.mouse.up();
  await expect(page.getByRole('button',{name:'Urungkan'})).toBeEnabled();
  const partialPixels=()=>preview.evaluate((node,args)=>{const c=node as HTMLCanvasElement,ctx=c.getContext('2d')!;const data=ctx.getImageData(0,0,c.width,c.height).data,x0=Math.max(0,Math.floor(c.width*args.point.x)-20),y0=Math.max(0,Math.floor(c.height*args.point.y)-20);let partial=0;for(let y=0;y<40;y++)for(let x=0;x<40;x++){const i=((y0+y)*c.width+x0+x)*4+3;if(args.before[y*40+x]>200&&data[i]>0&&data[i]<args.before[y*40+x]-5)partial++}return partial},{before:Array.from(beforeRegion),point});
  await expect.poll(partialPixels).toBeGreaterThan(0);
  await page.getByRole('button',{name:'Urungkan'}).click();
  await page.getByLabel('Zoom pratinjau mask').fill('2');
  await page.getByRole('button',{name:'Geser tampilan'}).click();
  await preview.focus();const beforePan=await preview.getAttribute('style');await page.keyboard.press('ArrowRight');await expect.poll(()=>preview.getAttribute('style')).not.toBe(beforePan);
  await page.getByRole('button',{name:'Reset tampilan'}).click();await expect(page.getByLabel('Zoom pratinjau mask')).toHaveValue('1');
  await page.getByRole('button',{name:'Mode geser aktif'}).click();
  await page.getByRole('button',{name:'Pratinjau hasil'}).click();
  const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('link',{name:'Unduh PNG'}).click()]);
  const chunks:Buffer[]=[];for await(const chunk of await download.createReadStream())chunks.push(Buffer.from(chunk));const output=Buffer.concat(chunks);
  expect([...output.subarray(0,8)]).toEqual([137,80,78,71,13,10,26,10]);
  const alpha=await page.evaluate(async data=>{const image=await createImageBitmap(await(await fetch(`data:image/png;base64,${data}`)).blob());const c=document.createElement('canvas');c.width=image.width;c.height=image.height;const x=c.getContext('2d')!;x.drawImage(image,0,0);return {width:c.width,height:c.height,corner:x.getImageData(20,20,1,1).data[3],subject:x.getImageData(Math.floor(c.width*.52),Math.floor(c.height*.35),1,1).data[3]}},output.toString('base64'));
  expect(alpha.width).toBe(768);expect(alpha.height).toBeGreaterThan(768);expect(alpha.corner).toBeLessThan(100);expect(alpha.subject).toBeGreaterThan(150);
  await page.locator('summary').filter({hasText:'Tepi dan bayangan'}).click();
  await page.getByLabel('Bayangan produk').check();
  await page.getByLabel('Opasitas bayangan').fill('60');await page.getByLabel('Blur bayangan').fill('30');await page.getByLabel('Offset bayangan horizontal').fill('24');await page.getByLabel('Offset bayangan vertikal').fill('32');
  const shadowDelta=await preview.evaluate(async(node,source)=>{const c=node as HTMLCanvasElement,ctx=c.getContext('2d')!,image=await createImageBitmap(await(await fetch(`data:image/png;base64,${source}`)).blob()),before=document.createElement('canvas');before.width=c.width;before.height=c.height;before.getContext('2d')!.drawImage(image,0,0,c.width,c.height);const a=before.getContext('2d')!.getImageData(0,0,c.width,c.height).data,b=ctx.getImageData(0,0,c.width,c.height).data;let count=0;for(let i=0;i<b.length;i+=4)if(a[i+3]<10&&b[i+3]>30)count++;return count},output.toString('base64'));
  expect(shadowDelta).toBeGreaterThan(20);
  await page.getByRole('button',{name:'Pratinjau hasil'}).click();const [shadowDownload]=await Promise.all([page.waitForEvent('download'),page.getByRole('link',{name:'Unduh PNG'}).click()]);const shadowChunks:Buffer[]=[];for await(const chunk of await shadowDownload.createReadStream())shadowChunks.push(Buffer.from(chunk));
  expect([...Buffer.concat(shadowChunks).subarray(0,8)]).toEqual([137,80,78,71,13,10,26,10]);
  await page.getByLabel('Kehalusan tepi (px)').fill('4');await page.getByLabel('Outline (px)').fill('12');await page.getByLabel('Warna outline').fill('#ff0000');
  await expect(page.getByRole('link',{name:'Unduh PNG'})).toHaveCount(0);
  await expect.poll(()=>preview.evaluate(node=>{const c=node as HTMLCanvasElement;const data=c.getContext('2d')!.getImageData(0,0,c.width,c.height).data;let count=0;for(let i=0;i<data.length;i+=4)if(data[i]>200&&data[i+1]<50&&data[i+2]<50&&data[i+3]>50)count++;return count})).toBeGreaterThan(50);
  await page.getByRole('button',{name:'Pratinjau hasil'}).click();const [effectDownload]=await Promise.all([page.waitForEvent('download'),page.getByRole('link',{name:'Unduh PNG'}).click()]);
  const effectChunks:Buffer[]=[];for await(const chunk of await effectDownload.createReadStream())effectChunks.push(Buffer.from(chunk));
  const outlinePixels=await page.evaluate(async ([before,after])=>{async function pixels(data:string){const image=await createImageBitmap(await(await fetch(`data:image/png;base64,${data}`)).blob());const c=document.createElement('canvas');c.width=image.width;c.height=image.height;const ctx=c.getContext('2d')!;ctx.drawImage(image,0,0);return ctx.getImageData(0,0,c.width,c.height).data}const a=await pixels(before),b=await pixels(after);let count=0;for(let i=0;i<b.length;i+=4)if(a[i+3]<20&&b[i+3]>50&&b[i]>200&&b[i+1]<50&&b[i+2]<50)count++;return count},[output.toString('base64'),Buffer.concat(effectChunks).toString('base64')]);
  expect(outlinePixels).toBeGreaterThan(50);
  await page.locator('details > summary').filter({hasText:/^Cetak lembar foto$/}).click();await expect(page.getByText('Kapasitas: 2 kolom × 3 baris = 6 foto.')).toBeVisible();
  await page.getByRole('button',{name:'Buat PDF cetak'}).click();
  const [sheetDownload]=await Promise.all([page.waitForEvent('download'),page.getByRole('link',{name:'Unduh PDF cetak'}).click()]);
  const sheetChunks:Buffer[]=[];for await(const chunk of await sheetDownload.createReadStream())sheetChunks.push(Buffer.from(chunk));
  const pdf=await PDFDocument.load(Buffer.concat(sheetChunks));expect(pdf.getPageCount()).toBe(1);const pdfPage=pdf.getPage(0);expect(pdfPage.getWidth()).toBeCloseTo(288,2);expect(pdfPage.getHeight()).toBeCloseTo(432,2);
  const contents=pdfPage.node.Contents();const streams=contents instanceof PDFArray?Array.from({length:contents.size()},(_,i)=>pdf.context.lookup(contents.get(i))):[contents];
  const operations=streams.map(stream=>{if(!(stream instanceof PDFRawStream))throw new Error('Unexpected PDF stream');return Buffer.from(decodePDFRawStream(stream).decode()).toString()}).join('\n');
  expect((operations.match(/\bDo\b/g)??[]).length).toBe(6);expect((operations.match(/\bS\b/g)??[]).length).toBe(48);
  expect(requests.filter(value=>!value.startsWith('GET ')||value.includes('portrait.jpg'))).toEqual([]);
  expect(requests.filter(value=>!value.startsWith(`GET ${baseURL}/`)&&!value.startsWith(`GET blob:${baseURL}/`))).toEqual([]);
  expect(requests.some(value=>value.includes('/models/modnet.onnx'))).toBe(true);
  // The model loads on page open and stays resident, so a second photo is
  // processed without another 40 MB download. Pick a new file through the
  // hidden input used by the drop zone.
  const modelRequests=requests.filter(value=>value.includes('/models/modnet.onnx')).length;
  await page.getByLabel('Pilih foto lain').setInputFiles('tests/fixtures/portrait.jpg');
  await expect(page.getByRole('application',{name:'Pratinjau penyuntingan mask'})).toBeVisible({timeout:120_000});
  expect(requests.filter(value=>value.includes('/models/modnet.onnx')).length).toBe(modelRequests);
});
