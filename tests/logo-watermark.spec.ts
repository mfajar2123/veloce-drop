import {test,expect} from '@playwright/test';
import {Buffer} from 'node:buffer';
import {unzipSync} from 'fflate';

const baseURL=process.env.PLAYWRIGHT_BASE_URL??`http://127.0.0.1:${process.env.PLAYWRIGHT_PORT??'4321'}`;

test('batch logo retains alpha, reports errors and creates unique PNGs in ZIP',async({page})=>{
  const requests:string[]=[];page.on('request',request=>requests.push(`${request.method()} ${request.url()}`));await page.goto('/id/watermark-logo-massal/');
  const fixtures=await page.evaluate(()=>{const logo=document.createElement('canvas');logo.width=20;logo.height=20;const a=logo.getContext('2d')!;a.fillStyle='#00ff00';a.fillRect(5,5,10,10);const red=document.createElement('canvas');red.width=100;red.height=100;const b=red.getContext('2d')!;b.fillStyle='#ff0000';b.fillRect(0,0,100,100);const transparent=document.createElement('canvas');transparent.width=100;transparent.height=100;return [logo,red,transparent].map(canvas=>canvas.toDataURL().split(',')[1])});
  const inputs=page.locator('input[type=file]');await inputs.nth(0).setInputFiles({name:'logo.png',mimeType:'image/png',buffer:Buffer.from(fixtures[0],'base64')});await expect(page.getByText(/Logo siap/)).toBeVisible();
  await inputs.nth(1).setInputFiles([{name:'same.png',mimeType:'image/png',buffer:Buffer.from(fixtures[1],'base64')},{name:'same.png',mimeType:'image/png',buffer:Buffer.from(fixtures[2],'base64')},{name:'bad.png',mimeType:'image/png',buffer:Buffer.from('invalid')}]);
  await page.getByLabel('Lebar logo (%)').fill('40');await page.getByLabel('Margin (%)').fill('10');await page.getByLabel('Opasitas (%)').fill('50');
  await page.getByRole('button',{name:'Terapkan logo ke antrean'}).click();await expect(page.getByText('Format tidak didukung, rusak, atau gagal dikodekan.')).toBeVisible();
  await expect(page.getByRole('link',{name:/Unduh same-/})).toHaveCount(2);const preview=page.getByAltText('Gambar pertama dengan logo');await expect(preview).toHaveJSProperty('complete',true);
  const previewPixel=await preview.evaluate(node=>{const c=document.createElement('canvas');c.width=100;c.height=100;const ctx=c.getContext('2d')!;ctx.drawImage(node as HTMLImageElement,0,0);return [...ctx.getImageData(70,70,1,1).data]});
  expect(previewPixel[0]).toBeGreaterThanOrEqual(126);expect(previewPixel[1]).toBeGreaterThanOrEqual(126);expect(previewPixel[3]).toBe(255);
  await page.getByRole('button',{name:'Buat ZIP'}).click();
  const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('link',{name:/Unduh ZIP/}).click()]);const chunks:Buffer[]=[];for await(const chunk of await download.createReadStream())chunks.push(Buffer.from(chunk));const files=unzipSync(Buffer.concat(chunks));
  await expect(page.getByText('ZIP siap.')).toBeVisible();
  expect(Object.keys(files).sort()).toEqual(['same-001.png','same-002.png']);for(const bytes of Object.values(files))expect([...bytes.slice(0,8)]).toEqual([137,80,78,71,13,10,26,10]);
  const decoded=await page.evaluate(async values=>{async function pixels(data:string){const image=await createImageBitmap(await(await fetch(`data:image/png;base64,${data}`)).blob());const c=document.createElement('canvas');c.width=image.width;c.height=image.height;const x=c.getContext('2d')!;x.drawImage(image,0,0);return {size:[c.width,c.height],center:[...x.getImageData(70,70,1,1).data],transparentLogo:[...x.getImageData(52,52,1,1).data],corner:[...x.getImageData(5,5,1,1).data]}}return Promise.all(values.map(pixels))},[Buffer.from(files['same-001.png']).toString('base64'),Buffer.from(files['same-002.png']).toString('base64')]);
  expect(decoded[0].size).toEqual([100,100]);expect(decoded[0].corner).toEqual([255,0,0,255]);expect(decoded[0].transparentLogo).toEqual([255,0,0,255]);
  expect(decoded[0].center[0]).toBeGreaterThanOrEqual(126);expect(decoded[0].center[0]).toBeLessThanOrEqual(129);expect(decoded[0].center[1]).toBeGreaterThanOrEqual(126);expect(decoded[0].center[1]).toBeLessThanOrEqual(129);expect(decoded[0].center[3]).toBe(255);
  expect(decoded[1].corner[3]).toBe(0);expect(decoded[1].center[1]).toBeGreaterThan(240);expect(decoded[1].center[3]).toBeGreaterThanOrEqual(126);expect(decoded[1].center[3]).toBeLessThanOrEqual(129);
  await page.getByLabel('Opasitas (%)').fill('80');await expect(page.getByRole('link',{name:/Unduh same-/})).toHaveCount(0);await expect(page.getByRole('link',{name:/Unduh ZIP/})).toHaveCount(0);
  expect(requests.filter(value=>!value.startsWith('GET ')||value.includes('same.png')||value.includes('logo.png'))).toEqual([]);
  expect(requests.filter(value=>!value.startsWith(`GET ${baseURL}/`)&&!value.startsWith(`GET blob:${baseURL}/`))).toEqual([]);
});

test('batch logo result continues to PDF without choosing the file again',async({page})=>{
  await page.goto('/id/watermark-logo-massal/');
  const data=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=30;c.height=30;const ctx=c.getContext('2d')!;ctx.fillStyle='green';ctx.fillRect(0,0,30,30);return c.toDataURL().split(',')[1]});
  const file={name:'sample.png',mimeType:'image/png',buffer:Buffer.from(data,'base64')};
  await page.locator('input[type=file]').nth(0).setInputFiles(file);await expect(page.getByText(/Logo siap/)).toBeVisible();
  await page.locator('input[type=file]').nth(1).setInputFiles(file);await page.getByRole('button',{name:'Terapkan logo ke antrean'}).click();
  await expect(page.getByRole('link',{name:'Unduh sample-001.png'})).toBeVisible();
  await page.getByRole('button',{name:'Masukkan ke PDF'}).click();
  await expect(page).toHaveURL(/foto-ke-pdf/);
  await expect(page.getByRole('button',{name:'Buat PDF',exact:true})).toBeEnabled();
});

test('cancelling an in-flight image does not produce a stale download',async({page})=>{
  await page.goto('/id/watermark-logo-massal/');const data=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=30;c.height=30;const x=c.getContext('2d')!;x.fillStyle='red';x.fillRect(0,0,30,30);return c.toDataURL().split(',')[1]});const file={name:'sample.png',mimeType:'image/png',buffer:Buffer.from(data,'base64')};
  await page.locator('input[type=file]').nth(0).setInputFiles(file);await expect(page.getByText(/Logo siap/)).toBeVisible();await page.locator('input[type=file]').nth(1).setInputFiles(file);
  await page.evaluate(()=>{const original=window.createImageBitmap;window.createImageBitmap=(async (...args:Parameters<typeof createImageBitmap>)=>{document.body.dataset.decoding='yes';const bitmap=await original.apply(window,args);return new Promise<ImageBitmap>(resolve=>setTimeout(()=>{document.body.dataset.decoded='yes';resolve(bitmap)},500))}) as typeof createImageBitmap});
  await page.getByRole('button',{name:'Terapkan logo ke antrean'}).click();await expect(page.locator('body')).toHaveAttribute('data-decoding','yes');await page.getByRole('button',{name:'Batalkan'}).click();await expect(page.locator('body')).toHaveAttribute('data-decoded','yes');
  await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));await expect(page.getByRole('link',{name:/Unduh sample-/})).toHaveCount(0);await expect(page.getByRole('button',{name:'Terapkan logo ke antrean'})).toBeEnabled();
});

test('all logo positions honor margin and aspect ratio',async({page})=>{
  await page.goto('/id/watermark-logo-massal/');
  const images=await page.evaluate(()=>[[20,10,'#00ff00'],[100,100,'#ff0000']].map(([width,height,color])=>{const c=document.createElement('canvas');c.width=width as number;c.height=height as number;const ctx=c.getContext('2d')!;ctx.fillStyle=color as string;ctx.fillRect(0,0,c.width,c.height);return c.toDataURL().split(',')[1]}));
  await page.locator('input[type=file]').nth(0).setInputFiles({name:'logo.png',mimeType:'image/png',buffer:Buffer.from(images[0],'base64')});await expect(page.getByText(/Logo siap/)).toBeVisible();
  await page.locator('input[type=file]').nth(1).setInputFiles({name:'item.png',mimeType:'image/png',buffer:Buffer.from(images[1],'base64')});
  await page.getByLabel('Lebar logo (%)').fill('40');await page.getByLabel('Margin (%)').fill('10');await page.getByLabel('Opasitas (%)').fill('100');
  for(const [position,x,y] of [['top-left',30,20],['top-right',70,20],['center',50,50],['bottom-left',30,80],['bottom-right',70,80]] as const){
    await page.getByLabel('Posisi').selectOption(position);await page.getByRole('button',{name:'Terapkan logo ke antrean'}).click();
    const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('link',{name:'Unduh item-001.png'}).click()]);const chunks:Buffer[]=[];for await(const chunk of await download.createReadStream())chunks.push(Buffer.from(chunk));
    const samples=await page.evaluate(async ({data,x,y})=>{const image=await createImageBitmap(await(await fetch(`data:image/png;base64,${data}`)).blob());const c=document.createElement('canvas');c.width=100;c.height=100;const ctx=c.getContext('2d')!;ctx.drawImage(image,0,0);return [[...ctx.getImageData(x,y,1,1).data],[...ctx.getImageData(x,y+12,1,1).data]]},{data:Buffer.concat(chunks).toString('base64'),x,y});
    expect(samples).toEqual([[0,255,0,255],[255,0,0,255]]);
  }
});

test('cancellation preserves already completed images',async({page})=>{
  test.setTimeout(60_000);
  await page.goto('/id/watermark-logo-massal/');const data=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=20;c.height=20;const ctx=c.getContext('2d')!;ctx.fillStyle='red';ctx.fillRect(0,0,20,20);return c.toDataURL().split(',')[1]});const bytes=Buffer.from(data,'base64');
  await page.locator('input[type=file]').nth(0).setInputFiles({name:'logo.png',mimeType:'image/png',buffer:bytes});await expect(page.getByText(/Logo siap/)).toBeVisible();
  await page.locator('input[type=file]').nth(1).setInputFiles([{name:'first.png',mimeType:'image/png',buffer:bytes},{name:'second.png',mimeType:'image/png',buffer:bytes}]);
  await page.evaluate(()=>{const original=window.createImageBitmap;let count=0;let releaseSecond!:()=>void;const secondGate=new Promise<void>(resolve=>{releaseSecond=resolve});Object.assign(window,{releaseSecondBitmap:releaseSecond});window.createImageBitmap=(async (...args:Parameters<typeof createImageBitmap>)=>{const bitmap=await original.apply(window,args);count++;if(count===2){document.body.dataset.second='started';await secondGate;document.body.dataset.second='finished'}return bitmap}) as typeof createImageBitmap});
  await page.getByRole('button',{name:'Terapkan logo ke antrean'}).click();await expect(page.locator('body')).toHaveAttribute('data-second','started');await expect(page.getByRole('link',{name:'Unduh first-001.png'})).toBeVisible();
  await page.getByRole('button',{name:'Batalkan'}).click();await page.evaluate(()=>{(window as Window&{releaseSecondBitmap?:()=>void}).releaseSecondBitmap?.()});await expect(page.locator('body')).toHaveAttribute('data-second','finished');
  await expect(page.getByRole('link',{name:'Unduh first-001.png'})).toBeVisible();await expect(page.getByRole('link',{name:'Unduh second-002.png'})).toHaveCount(0);await expect(page.getByRole('button',{name:'Buat ZIP'})).toBeEnabled();
});

test('batch logo controls fit a narrow viewport',async({page},testInfo)=>{
  await page.setViewportSize({width:375,height:812});await page.goto('/id/watermark-logo-massal/');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.locator('section.panel').screenshot({path:testInfo.outputPath('logo-batch-mobile.png')});
});

test('invalid logo can be replaced and English controls are available',async({page})=>{
  await page.goto('/en/watermark-logo-massal/');const input=page.locator('input[type=file]').nth(0);
  await input.setInputFiles({name:'bad.png',mimeType:'image/png',buffer:Buffer.from('invalid')});await expect(page.getByRole('alert')).toContainText('Logo must be a valid JPEG, PNG or WebP image.');
  const data=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=10;c.height=10;return c.toDataURL().split(',')[1]});
  await input.setInputFiles({name:'good.png',mimeType:'image/png',buffer:Buffer.from(data,'base64')});await expect(page.getByText(/Logo ready/)).toBeVisible();await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(page.getByRole('button',{name:'Apply logo to queue'})).toBeDisabled();
});
