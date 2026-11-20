import { test, expect } from '@playwright/test';
import { Buffer } from 'node:buffer';

test('circle output is a PNG with transparent corners and the requested dimensions', async ({ page }) => {
  await page.goto('/id/ukuran/ubah-ukuran-gambar/');
  const source = await page.evaluate(() => { const c = document.createElement('canvas'); c.width=80; c.height=60; const x=c.getContext('2d')!; x.fillStyle='red'; x.fillRect(0,0,80,60); return c.toDataURL('image/png').split(',')[1]; });
  await page.locator('input[type=file]').setInputFiles({name:'sample.png',mimeType:'image/png',buffer:Buffer.from(source,'base64')});
  await page.getByLabel('Ukuran cepat').selectOption('whatsapp-profile');
  await page.getByRole('button',{name:'Buat gambar'}).click();
  const preview=page.getByRole('img',{name:'Pratinjau hasil resize'});
  await expect(preview).toHaveAttribute('width','640');
  await expect(preview).toHaveAttribute('height','640');
  const [download] = await Promise.all([page.waitForEvent('download'),page.getByRole('link',{name:'Unduh PNG'}).click()]);
  const chunks: Buffer[]=[]; for await (const chunk of await download.createReadStream()) chunks.push(Buffer.from(chunk));
  const bytes=Buffer.concat(chunks); expect([...bytes.subarray(0,8)]).toEqual([137,80,78,71,13,10,26,10]);
  const pixels=await page.evaluate(async base64=>{const image=await createImageBitmap(await (await fetch(`data:image/png;base64,${base64}`)).blob());const c=document.createElement('canvas');c.width=image.width;c.height=image.height;const ctx=c.getContext('2d')!;ctx.drawImage(image,0,0);return [image.width,image.height,ctx.getImageData(0,0,1,1).data[3],ctx.getImageData(320,320,1,1).data[3]]},bytes.toString('base64'));
  expect(pixels).toEqual([640,640,0,255]);
});

test('resize accepts an image dropped onto its uploader',async({page})=>{
  await page.goto('/id/ukuran/ubah-ukuran-gambar/');
  const source=await page.evaluate(()=>{const canvas=document.createElement('canvas');canvas.width=4;canvas.height=2;canvas.getContext('2d')!.fillRect(0,0,4,2);return canvas.toDataURL('image/png').split(',')[1]});
  await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));
  await page.evaluate(base64=>{const bytes=Uint8Array.from(atob(base64),character=>character.charCodeAt(0));const transfer=new DataTransfer();transfer.items.add(new File([bytes],'dropped.png',{type:'image/png'}));document.querySelector('label.drop')!.dispatchEvent(new DragEvent('drop',{bubbles:true,dataTransfer:transfer}))},source);
  await expect(page.getByText('Gambar dipilih: dropped.png')).toBeVisible();
  await expect(page.getByLabel('Pratinjau hasil crop')).toBeVisible();
});

test('international passport preset exports a 2 x 2 inch image at 300 DPI',async({page})=>{
  await page.goto('/en/resize-image/');
  await page.getByLabel('Quick size').selectOption('passport-2x2');
  await page.locator('input[type=file]').setInputFiles('tests/fixtures/portrait.jpg');
  await page.getByRole('button',{name:'Create image'}).click();
  await expect(page.locator('.result').getByText(/600.*600 px/)).toBeVisible();
  const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('link',{name:'Download PNG'}).click()]);
  const chunks:Buffer[]=[];for await(const chunk of await download.createReadStream())chunks.push(Buffer.from(chunk));
  const bytes=Buffer.concat(chunks);expect([...bytes.subarray(0,8)]).toEqual([137,80,78,71,13,10,26,10]);
  expect([bytes.readUInt32BE(16),bytes.readUInt32BE(20)]).toEqual([600,600]);
});

test('print presets export the exact dimensions and embed 300 DPI',async({page})=>{
  test.setTimeout(60_000);
  for(const [preset,expected] of [['2x3',[236,354]],['3x4',[354,472]],['4x6',[472,709]],['35x45',[413,531]],['4r',[1200,1800]],['a4',[2480,3508]]] as const){
    await page.goto('/id/ukuran/ubah-ukuran-gambar/');await page.getByLabel('Ukuran cepat').selectOption(preset);await page.locator('input[type=file]').setInputFiles('tests/fixtures/portrait.jpg');
    await expect(page.getByText('Gambar dipilih: portrait.jpg')).toBeVisible({ timeout: 20_000 });
    await page.getByRole('button',{name:'Buat gambar'}).click();
    await expect(page.locator('.result').getByText(new RegExp(`${expected[0]} × ${expected[1]} px`))).toBeVisible({ timeout: 20_000 });
    const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('link',{name:'Unduh PNG'}).click()]);
    const chunks:Buffer[]=[];for await(const chunk of await download.createReadStream())chunks.push(Buffer.from(chunk));
    const bytes=Buffer.concat(chunks);expect([...bytes.subarray(0,8)]).toEqual([137,80,78,71,13,10,26,10]);
    expect([bytes.readUInt32BE(16),bytes.readUInt32BE(20)]).toEqual(expected);
    expect(bytes.toString('ascii',37,41)).toBe('pHYs');
    expect([bytes.readUInt32BE(41),bytes.readUInt32BE(45),bytes[49]]).toEqual([11811,11811,1]);
    await expect(page.getByLabel('Lebar (px)')).toHaveCount(0);
  }
});

test('changing resize settings clears the old download and next steps',async({page})=>{
  await page.goto('/id/ukuran/ubah-ukuran-gambar/');
  await page.locator('input[type=file]').setInputFiles('tests/fixtures/portrait.jpg');
  await expect(page.getByText('Gambar dipilih: portrait.jpg')).toBeVisible();
  await page.getByRole('button',{name:'Buat gambar'}).click();
  await expect(page.getByRole('link',{name:'Unduh PNG'})).toBeVisible();
  await page.getByLabel('Ukuran cepat').selectOption('custom');
  await page.getByLabel('Lebar (px)').fill('300');
  await expect(page.getByRole('link',{name:'Unduh PNG'})).toHaveCount(0);
  await expect(page.getByRole('button',{name:'Kompres 200 KB'})).toHaveCount(0);
  await page.getByRole('button',{name:'Buat gambar'}).click();
  await expect(page.locator('.result').getByText(/300 × 472 px/)).toBeVisible();
  await page.getByLabel('Penyesuaian').selectOption('contain');
  await expect(page.getByRole('link',{name:'Unduh PNG'})).toHaveCount(0);
});

test('an obsolete render cannot restore an old result',async({page})=>{
  await page.goto('/id/ukuran/ubah-ukuran-gambar/');
  await page.locator('input[type=file]').setInputFiles('tests/fixtures/portrait.jpg');
  await page.evaluate(()=>{const original=HTMLCanvasElement.prototype.toBlob;HTMLCanvasElement.prototype.toBlob=function(callback,...args){document.body.dataset.encoding='yes';return original.call(this,blob=>setTimeout(()=>{callback(blob);document.body.dataset.encoded='yes'},500),...args)}});
  await page.getByRole('button',{name:'Buat gambar'}).click();
  await expect(page.locator('body')).toHaveAttribute('data-encoding','yes');
  await page.getByLabel('Ukuran cepat').selectOption('custom');
  await page.getByLabel('Lebar (px)').fill('300');
  await expect(page.locator('body')).toHaveAttribute('data-encoded','yes');
  await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));
  await expect(page.getByRole('link',{name:'Unduh PNG'})).toHaveCount(0);
});

test('size controls remain usable on a narrow viewport',async({page},testInfo)=>{
  await page.setViewportSize({width:375,height:812});await page.goto('/id/ukuran/ubah-ukuran-gambar/');
  const sizes = page.getByLabel('Ukuran cepat');
  await expect(sizes).toBeVisible();
  const sizeBox = await sizes.boundingBox();
  const uploadBox = await page.locator('label.drop').boundingBox();
  expect(uploadBox!.y - (sizeBox!.y + sizeBox!.height)).toBeGreaterThanOrEqual(12);
  await page.locator('input[type=file]').setInputFiles('tests/fixtures/portrait.jpg');await expect(page.getByLabel('Pratinjau hasil crop')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  await page.locator('section.panel').screenshot({path:testInfo.outputPath('resize-mobile.png')});
});

test('keyboard crop position matches exported pixels',async({page})=>{
  await page.goto('/id/ukuran/ubah-ukuran-gambar/');
  const image=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=300;c.height=100;const x=c.getContext('2d')!;['red','green','blue'].forEach((color,i)=>{x.fillStyle=color;x.fillRect(i*100,0,100,100)});x.fillStyle='black';x.fillRect(120,0,20,100);return c.toDataURL().split(',')[1]});
  await page.locator('input[type=file]').setInputFiles({name:'stripes.png',mimeType:'image/png',buffer:Buffer.from(image,'base64')});
  await page.getByLabel('Ukuran cepat').selectOption('custom');
  await page.getByLabel('Lebar (px)').fill('100');await page.getByLabel('Tinggi (px)').fill('100');
  const preview=page.getByLabel('Pratinjau hasil crop');await expect(preview).toBeVisible();
  const pixel=()=>preview.evaluate(node=>[...(node as HTMLCanvasElement).getContext('2d')!.getImageData(50,50,1,1).data]);
  const edgePixel=()=>preview.evaluate(node=>[...(node as HTMLCanvasElement).getContext('2d')!.getImageData(0,50,1,1).data]);
  await expect.poll(edgePixel).toEqual([0,128,0,255]);
  const crop = page.getByLabel('Posisi crop', { exact: true });
  await crop.focus();
  for (let step = 0; step < 10; step++) await page.keyboard.press('ArrowLeft');
  await expect.poll(pixel).toEqual([0,0,255,255]);
  await expect(page.getByLabel('Zoom crop (%)')).toHaveCount(0);
  await page.getByRole('button',{name:'Buat gambar'}).click();const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('link',{name:'Unduh PNG'}).click()]);
  const chunks:Buffer[]=[];for await(const chunk of await download.createReadStream())chunks.push(Buffer.from(chunk));
  const exported=await page.evaluate(async data=>{const image=await createImageBitmap(await(await fetch(`data:image/png;base64,${data}`)).blob());const c=document.createElement('canvas');c.width=image.width;c.height=image.height;const x=c.getContext('2d')!;x.drawImage(image,0,0);return [...x.getImageData(50,50,1,1).data]},Buffer.concat(chunks).toString('base64'));
  expect(exported).toEqual([0,0,255,255]);
});
