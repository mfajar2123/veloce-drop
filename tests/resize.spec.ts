import { test, expect } from '@playwright/test';
import { Buffer } from 'node:buffer';

test('circle output is a PNG with transparent corners and the requested dimensions', async ({ page }) => {
  await page.goto('/id/ukuran/ubah-ukuran-gambar/');
  const source = await page.evaluate(() => { const c = document.createElement('canvas'); c.width=80; c.height=60; const x=c.getContext('2d')!; x.fillStyle='red'; x.fillRect(0,0,80,60); return c.toDataURL('image/png').split(',')[1]; });
  await page.locator('input[type=file]').setInputFiles({name:'sample.png',mimeType:'image/png',buffer:Buffer.from(source,'base64')});
  await page.getByLabel('Lebar (px)').fill('100'); await page.getByLabel('Tinggi (px)').fill('100');
  await page.getByLabel('Potong lingkaran (PNG transparan)').check();
  await page.getByRole('button',{name:'Buat gambar'}).click();
  const preview=page.getByRole('img',{name:'Pratinjau hasil resize'});
  await expect(preview).toHaveAttribute('width','100');
  await expect(preview).toHaveAttribute('height','100');
  const [download] = await Promise.all([page.waitForEvent('download'),page.getByRole('link',{name:'Unduh PNG'}).click()]);
  const chunks: Buffer[]=[]; for await (const chunk of await download.createReadStream()) chunks.push(Buffer.from(chunk));
  const bytes=Buffer.concat(chunks); expect([...bytes.subarray(0,8)]).toEqual([137,80,78,71,13,10,26,10]);
  const pixels=await page.evaluate(async base64=>{const image=await createImageBitmap(await (await fetch(`data:image/png;base64,${base64}`)).blob());const c=document.createElement('canvas');c.width=image.width;c.height=image.height;const ctx=c.getContext('2d')!;ctx.drawImage(image,0,0);return [image.width,image.height,ctx.getImageData(0,0,1,1).data[3],ctx.getImageData(50,50,1,1).data[3]]},bytes.toString('base64'));
  expect(pixels).toEqual([100,100,0,255]);
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
  await page.goto('/en/ukuran/resize-image/');
  await page.getByLabel('Quick size').selectOption('passport-2x2');
  await page.locator('input[type=file]').setInputFiles('tests/fixtures/portrait.jpg');
  await page.getByRole('button',{name:'Create image'}).click();
  await expect(page.getByText(/600.*600 px/)).toBeVisible();
  const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('link',{name:'Download PNG'}).click()]);
  const chunks:Buffer[]=[];for await(const chunk of await download.createReadStream())chunks.push(Buffer.from(chunk));
  const bytes=Buffer.concat(chunks);expect([...bytes.subarray(0,8)]).toEqual([137,80,78,71,13,10,26,10]);
  expect([bytes.readUInt32BE(16),bytes.readUInt32BE(20)]).toEqual([600,600]);
});

test('4R and A4 presets export the stated 300 DPI pixel dimensions',async({page})=>{
  test.setTimeout(60_000);
  for(const [preset,expected] of [['4r',[1200,1800]],['a4',[2480,3508]]] as const){
    await page.goto('/id/ukuran/ubah-ukuran-gambar/');await page.getByLabel('Ukuran cepat').selectOption(preset);await page.locator('input[type=file]').setInputFiles('tests/fixtures/portrait.jpg');
    await expect(page.getByText('Gambar dipilih: portrait.jpg')).toBeVisible({ timeout: 20_000 });
    await page.getByRole('button',{name:'Buat gambar'}).click();
    await expect(page.getByText(new RegExp(`${expected[0]} × ${expected[1]} px`))).toBeVisible({ timeout: 20_000 });
    const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('link',{name:'Unduh PNG'}).click()]);
    const chunks:Buffer[]=[];for await(const chunk of await download.createReadStream())chunks.push(Buffer.from(chunk));
    const bytes=Buffer.concat(chunks);expect([...bytes.subarray(0,8)]).toEqual([137,80,78,71,13,10,26,10]);
    expect([bytes.readUInt32BE(16),bytes.readUInt32BE(20)]).toEqual(expected);
  }
});

test('changing resize settings clears the old download and next steps',async({page})=>{
  await page.goto('/id/ukuran/ubah-ukuran-gambar/');
  await page.locator('input[type=file]').setInputFiles('tests/fixtures/portrait.jpg');
  await expect(page.getByText('Gambar dipilih: portrait.jpg')).toBeVisible();
  await page.getByRole('button',{name:'Buat gambar'}).click();
  await expect(page.getByRole('link',{name:'Unduh PNG'})).toBeVisible();
  await page.getByLabel('Lebar (px)').fill('300');
  await expect(page.getByRole('link',{name:'Unduh PNG'})).toHaveCount(0);
  await expect(page.getByRole('button',{name:'Kompres 200 KB'})).toHaveCount(0);
  await page.getByRole('button',{name:'Buat gambar'}).click();
  await expect(page.getByText(/300 × 472 px/)).toBeVisible();
  await page.getByLabel('Penyesuaian').selectOption('contain');
  await expect(page.getByRole('link',{name:'Unduh PNG'})).toHaveCount(0);
});

test('an obsolete render cannot restore an old result',async({page})=>{
  await page.goto('/id/ukuran/ubah-ukuran-gambar/');
  await page.locator('input[type=file]').setInputFiles('tests/fixtures/portrait.jpg');
  await page.evaluate(()=>{const original=HTMLCanvasElement.prototype.toBlob;HTMLCanvasElement.prototype.toBlob=function(callback,...args){document.body.dataset.encoding='yes';return original.call(this,blob=>setTimeout(()=>{callback(blob);document.body.dataset.encoded='yes'},500),...args)}});
  await page.getByRole('button',{name:'Buat gambar'}).click();
  await expect(page.locator('body')).toHaveAttribute('data-encoding','yes');
  await page.getByLabel('Lebar (px)').fill('300');
  await expect(page.locator('body')).toHaveAttribute('data-encoded','yes');
  await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));
  await expect(page.getByRole('link',{name:'Unduh PNG'})).toHaveCount(0);
});

test('physical dimensions use DPI and exported pixels match',async({page})=>{
  await page.goto('/id/ukuran/ubah-ukuran-gambar/');
  await page.locator('input[type=file]').setInputFiles('tests/fixtures/portrait.jpg');
  await page.getByLabel('Satuan').selectOption('cm');
  await page.getByLabel('DPI').fill('300');
  await page.getByLabel('Lebar (cm)').fill('3');await page.getByLabel('Tinggi (cm)').fill('4');
  await page.getByRole('button',{name:'Buat gambar'}).click();
  const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('link',{name:'Unduh PNG'}).click()]);
  const chunks:Buffer[]=[];for await(const chunk of await download.createReadStream())chunks.push(Buffer.from(chunk));
  const size=await page.evaluate(async data=>{const bitmap=await createImageBitmap(await(await fetch(`data:image/png;base64,${data}`)).blob());return [bitmap.width,bitmap.height]},Buffer.concat(chunks).toString('base64'));
  expect(size).toEqual([354,472]);
  await page.getByLabel('DPI').fill('72');await expect(page.getByRole('link',{name:'Unduh PNG'})).toHaveCount(0);
  await page.getByRole('button',{name:'Buat gambar'}).click();await expect(page.getByText(/85 × 113 px/)).toBeVisible();
  await page.getByLabel('Satuan').selectOption('mm');await page.getByLabel('DPI').fill('300');
  await page.getByLabel('Lebar (mm)').fill('30');await page.getByLabel('Tinggi (mm)').fill('40');
  await page.getByRole('button',{name:'Buat gambar'}).click();await expect(page.getByText(/354 × 472 px/)).toBeVisible();
  await page.getByLabel('Satuan').selectOption('in');await page.getByLabel('DPI').fill('72');
  await page.getByLabel('Lebar (in)').fill('1');await page.getByLabel('Tinggi (in)').fill('1');
  await page.getByRole('button',{name:'Buat gambar'}).click();await expect(page.getByText(/72 × 72 px/)).toBeVisible();
  await page.getByLabel('DPI').fill('35');await page.getByRole('button',{name:'Buat gambar'}).click();await expect(page.getByRole('alert')).toContainText('DPI harus antara 36 dan 1.200.');
});

test('percent dimensions use the source and ratio lock updates the other dimension',async({page})=>{
  await page.goto('/id/ukuran/ubah-ukuran-gambar/');await page.locator('input[type=file]').setInputFiles('tests/fixtures/portrait.jpg');
  await expect(page.locator('option[value="%"]')).not.toHaveAttribute('disabled','');await page.getByLabel('Satuan').selectOption('%');
  await page.getByLabel('Lebar (%)').fill('50');await page.getByLabel('Tinggi (%)').fill('50');
  await page.getByLabel('Kunci rasio').check();await page.getByLabel('Lebar (%)').fill('25');
  await expect(page.getByLabel('Tinggi (%)')).toHaveValue('25');
  await page.getByRole('button',{name:'Buat gambar'}).click();await expect(page.getByText(/192 × 288 px/)).toBeVisible();
});

test('percentage dimensions follow a replacement image and can be reset if it is corrupt',async({page})=>{
  await page.goto('/id/ukuran/ubah-ukuran-gambar/');await page.locator('input[type=file]').setInputFiles('tests/fixtures/portrait.jpg');
  await expect(page.locator('option[value="%"]')).not.toHaveAttribute('disabled','');await page.getByLabel('Satuan').selectOption('%');
  await page.getByLabel('Lebar (%)').fill('50');await page.getByLabel('Tinggi (%)').fill('50');
  const data=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=100;c.height=200;return c.toDataURL('image/png').split(',')[1]});
  await page.locator('input[type=file]').setInputFiles({name:'new.png',mimeType:'image/png',buffer:Buffer.from(data,'base64')});
  await expect(page.getByText('Gambar dipilih: new.png')).toBeVisible();await expect(page.locator('option[value="%"]')).not.toHaveAttribute('disabled','');
  await page.getByRole('button',{name:'Buat gambar'}).click();await expect(page.getByText(/50 × 100 px/)).toBeVisible();
  await page.locator('input[type=file]').setInputFiles({name:'bad.png',mimeType:'image/png',buffer:Buffer.from('invalid')});
  await expect(page.getByText('Gambar dipilih: bad.png')).toBeVisible();await expect(page.locator('option[value="%"]')).toHaveAttribute('disabled','');
  await page.getByLabel('Satuan').selectOption('px');await expect(page.getByLabel('Lebar (px)')).toHaveValue('');
});

test('size controls remain usable on a narrow viewport',async({page},testInfo)=>{
  await page.setViewportSize({width:375,height:812});await page.goto('/id/ukuran/ubah-ukuran-gambar/');
  await expect(page.getByLabel('Satuan')).toBeVisible();
  await page.locator('input[type=file]').setInputFiles('tests/fixtures/portrait.jpg');await expect(page.getByLabel('Pratinjau hasil crop')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  await page.locator('section.panel').screenshot({path:testInfo.outputPath('resize-mobile.png')});
});

test('crop position and rotation affect both preview and exported pixels',async({page})=>{
  await page.goto('/id/ukuran/ubah-ukuran-gambar/');
  const image=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=300;c.height=100;const x=c.getContext('2d')!;['red','green','blue'].forEach((color,i)=>{x.fillStyle=color;x.fillRect(i*100,0,100,100)});x.fillStyle='black';x.fillRect(120,0,20,100);return c.toDataURL().split(',')[1]});
  await page.locator('input[type=file]').setInputFiles({name:'stripes.png',mimeType:'image/png',buffer:Buffer.from(image,'base64')});
  await page.getByLabel('Lebar (px)').fill('100');await page.getByLabel('Tinggi (px)').fill('100');
  const preview=page.getByLabel('Pratinjau hasil crop');await expect(preview).toBeVisible();
  const pixel=()=>preview.evaluate(node=>[...(node as HTMLCanvasElement).getContext('2d')!.getImageData(50,50,1,1).data]);
  const edgePixel=()=>preview.evaluate(node=>[...(node as HTMLCanvasElement).getContext('2d')!.getImageData(0,50,1,1).data]);
  await expect.poll(edgePixel).toEqual([0,128,0,255]);
  const zoom=page.getByLabel('Zoom crop (%)');await zoom.focus();for(let step=0;step<10;step++)await page.keyboard.press('ArrowRight');
  await expect(zoom).toHaveValue('200');await expect.poll(edgePixel).toEqual([0,0,0,255]);await zoom.focus();await page.keyboard.press('Home');await expect.poll(edgePixel).toEqual([0,128,0,255]);
  await page.getByLabel('Posisi crop horizontal').fill('0');await expect.poll(pixel).toEqual([255,0,0,255]);
  await page.getByLabel('Posisi crop horizontal').fill('100');await expect.poll(pixel).toEqual([0,0,255,255]);
  await page.getByRole('button',{name:'Buat gambar'}).click();const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('link',{name:'Unduh PNG'}).click()]);
  const chunks:Buffer[]=[];for await(const chunk of await download.createReadStream())chunks.push(Buffer.from(chunk));
  const exported=await page.evaluate(async data=>{const image=await createImageBitmap(await(await fetch(`data:image/png;base64,${data}`)).blob());const c=document.createElement('canvas');c.width=image.width;c.height=image.height;const x=c.getContext('2d')!;x.drawImage(image,0,0);return [...x.getImageData(50,50,1,1).data]},Buffer.concat(chunks).toString('base64'));
  expect(exported).toEqual([0,0,255,255]);
  await page.getByRole('button',{name:/Putar 90 derajat/}).click();await expect(page.getByRole('link',{name:'Unduh PNG'})).toHaveCount(0);
  await page.getByLabel('Tinggi (px)').fill('300');
  await expect.poll(()=>preview.evaluate(node=>[...(node as HTMLCanvasElement).getContext('2d')!.getImageData(50,50,1,1).data])).toEqual([255,0,0,255]);
  await expect.poll(()=>preview.evaluate(node=>[...(node as HTMLCanvasElement).getContext('2d')!.getImageData(50,250,1,1).data])).toEqual([0,0,255,255]);
  await page.getByRole('button',{name:'Buat gambar'}).click();const [rotatedDownload]=await Promise.all([page.waitForEvent('download'),page.getByRole('link',{name:'Unduh PNG'}).click()]);
  const rotatedChunks:Buffer[]=[];for await(const chunk of await rotatedDownload.createReadStream())rotatedChunks.push(Buffer.from(chunk));
  const rotatedPixels=await page.evaluate(async data=>{const image=await createImageBitmap(await(await fetch(`data:image/png;base64,${data}`)).blob());const c=document.createElement('canvas');c.width=image.width;c.height=image.height;const x=c.getContext('2d')!;x.drawImage(image,0,0);return [[...x.getImageData(50,50,1,1).data],[...x.getImageData(50,250,1,1).data]]},Buffer.concat(rotatedChunks).toString('base64'));
  expect(rotatedPixels).toEqual([[255,0,0,255],[0,0,255,255]]);
  await page.getByRole('button',{name:'Atur ulang crop'}).click();await expect(page.getByLabel('Posisi crop horizontal')).toHaveValue('50');
  await expect(zoom).toHaveValue('100');
  await expect(page.getByRole('button',{name:/Putar 90 derajat/})).toContainText('(0)');
  await page.getByLabel('Tinggi (px)').fill('100');await preview.scrollIntoViewIfNeeded();const box=await preview.boundingBox();if(!box)throw Error('Missing preview');
  await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width*.75,box.y+box.height/2,{steps:3});await page.mouse.up();
  await expect.poll(async()=>Number(await page.getByLabel('Posisi crop horizontal').inputValue())).toBeLessThan(50);
  await page.getByLabel('Posisi crop horizontal').focus();await page.keyboard.press('Home');
  await expect(page.getByLabel('Posisi crop horizontal')).toHaveValue('0');await expect.poll(pixel).toEqual([255,0,0,255]);
  await page.getByLabel('Lebar (px)').fill('0');await expect(preview).toHaveCount(0);
  await page.getByLabel('Lebar (px)').fill('100');await expect(preview).toBeVisible();
});

test('blur padding fills empty space while keeping the source sharp',async({page})=>{
  await page.goto('/id/ukuran/ubah-ukuran-gambar/');
  const image=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=100;c.height=40;const x=c.getContext('2d')!;x.fillStyle='red';x.fillRect(0,0,50,40);x.fillStyle='blue';x.fillRect(50,0,50,40);return c.toDataURL().split(',')[1]});
  await page.locator('input[type=file]').setInputFiles({name:'bands.png',mimeType:'image/png',buffer:Buffer.from(image,'base64')});
  await page.getByLabel('Lebar (px)').fill('100');await page.getByLabel('Tinggi (px)').fill('100');
  await page.getByLabel('Penyesuaian').selectOption('pad');await page.getByLabel('Latar pad').selectOption('blur');
  const preview=page.getByLabel('Pratinjau hasil crop');await expect.poll(()=>preview.evaluate(node=>[...(node as HTMLCanvasElement).getContext('2d')!.getImageData(50,10,1,1).data])).toEqual(expect.arrayContaining([255]));
  await page.getByRole('button',{name:'Buat gambar'}).click();const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('link',{name:'Unduh PNG'}).click()]);
  const chunks:Buffer[]=[];for await(const chunk of await download.createReadStream())chunks.push(Buffer.from(chunk));
  const pixels=await page.evaluate(async data=>{const image=await createImageBitmap(await(await fetch(`data:image/png;base64,${data}`)).blob());const c=document.createElement('canvas');c.width=image.width;c.height=image.height;const x=c.getContext('2d')!;x.drawImage(image,0,0);return {pad:[...x.getImageData(50,10,1,1).data],subject:[...x.getImageData(20,50,1,1).data]}},Buffer.concat(chunks).toString('base64'));
  expect(pixels.pad[0]).toBeGreaterThan(20);expect(pixels.pad[2]).toBeGreaterThan(20);expect(pixels.pad[3]).toBe(255);expect(pixels.subject).toEqual([255,0,0,255]);
});
