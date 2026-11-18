import {test,expect} from '@playwright/test';
import {Buffer} from 'node:buffer';
import {waitForHydration} from './helpers';

test('background result continues to 3x4 and compression without selecting files again',async({page})=>{
  test.setTimeout(180_000);
  await page.goto('/id/hapus-latar/');
  await waitForHydration(page);
  await page.getByRole('button',{name:'Unduh dan muat model'}).click();
  await expect(page.getByText('Model siap di perangkat ini.')).toBeVisible({timeout:120_000});
  const sample = await page.evaluate(() => {
    const canvas = document.createElement('canvas'); canvas.width = 64; canvas.height = 64;
    const context = canvas.getContext('2d')!;
    context.fillStyle = '#d9e8ed'; context.fillRect(0, 0, 64, 64);
    context.fillStyle = '#243b53'; context.beginPath(); context.ellipse(32, 18, 9, 11, 0, 0, Math.PI * 2); context.fill();
    context.beginPath(); context.ellipse(32, 54, 23, 30, 0, 0, Math.PI * 2); context.fill();
    return canvas.toDataURL('image/png').split(',')[1];
  });
  await page.locator('input[type=file]').setInputFiles({name:'synthetic-portrait.png',mimeType:'image/png',buffer:Buffer.from(sample,'base64')});
  await page.getByRole('button',{name:'Hapus latar',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Perbaiki mask'})).toBeVisible({timeout:120_000});
  await page.getByRole('button',{name:'Buat PNG'}).click();
  await page.getByRole('button',{name:'Buat pas foto 3x4'}).click();
  await expect(page).toHaveURL(/ubah-ukuran-gambar/);
  await expect(page.getByText(/Gambar dipilih: velocedrop\.png/)).toBeVisible();
  await expect(page.getByRole('heading',{name:'Pratinjau crop'})).toBeVisible({timeout:30_000});
  await expect(page.getByRole('button',{name:'Buat gambar'})).toBeEnabled();
  await page.getByRole('button',{name:'Buat gambar'}).click();
  await page.getByRole('button',{name:'Kompres 200 KB'}).click();
  await expect(page.getByRole('button',{name:'Kompres gambar'})).toBeEnabled();
  await page.getByRole('button',{name:'Kompres gambar'}).click();
  await expect(page.getByRole('link',{name:'Unduh gambar'})).toBeVisible();
});
