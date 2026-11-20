import {test,expect} from '@playwright/test';

test('WhatsApp profile preset exports a square image with a circular safe area',async({page})=>{
  await page.setViewportSize({width:375,height:812});
  await page.goto('/id/ukuran/ubah-ukuran-gambar/');
  await page.getByLabel('Ukuran cepat').selectOption('whatsapp-profile');
  await expect(page.getByText(/foto profil minimal 192/)).toBeVisible();
  await page.locator('input[type=file]').setInputFiles('tests/fixtures/portrait.jpg');
  const preview=page.getByLabel('Pratinjau hasil crop');
  await expect(preview).toBeVisible();
  const guide=await preview.evaluate(node=>getComputedStyle(node.parentElement!.querySelector('.crop-guides-circle')!, '::after').borderRadius);
  expect(guide).toBe('50%');
  await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  await page.getByRole('button',{name:'Buat gambar'}).click();
  const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('link',{name:'Unduh PNG'}).click()]);
  const chunks:Buffer[]=[];
  for await(const chunk of await download.createReadStream())chunks.push(Buffer.from(chunk));
  const png=Buffer.concat(chunks);
  expect(png.subarray(0,8)).toEqual(Buffer.from([137,80,78,71,13,10,26,10]));
  expect(png.readUInt32BE(16)).toBe(640);
  expect(png.readUInt32BE(20)).toBe(640);
});
