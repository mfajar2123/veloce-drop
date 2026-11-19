import {test,expect} from '@playwright/test';

test('resize result continues to compression and session is cleared on reload',async({page})=>{
  await page.goto('/id/ukuran/ubah-ukuran-gambar/');
  await page.locator('input[type=file]').setInputFiles('tests/fixtures/portrait.jpg');
  await page.getByRole('button',{name:'Buat gambar'}).click();
  await expect(page.getByRole('link',{name:'Unduh PNG'})).toBeVisible();
  await page.getByRole('button',{name:'Berkas sesi (1)'}).click();
  await expect(page.getByRole('button',{name:'Hapus hasil 1'})).toBeVisible();
  const [sessionDownload]=await Promise.all([page.waitForEvent('download'),page.getByRole('link',{name:'Unduh',exact:true}).click()]);
  expect(sessionDownload.suggestedFilename()).toBe('doculven.png');
  await page.getByRole('button',{name:'Berkas sesi (1)'}).click();
  await page.getByRole('button',{name:'Kompres 200 KB'}).click();
  await expect(page).toHaveURL(/kompres-foto/);
  await expect(page.getByRole('button',{name:'Kompres gambar'})).toBeEnabled();
  await page.getByRole('button',{name:'Kompres gambar'}).click();
  await expect(page.getByRole('link',{name:'Unduh gambar'})).toBeVisible({timeout:20_000});
  await expect(page.getByRole('button',{name:'Berkas sesi (2)'})).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button',{name:'Berkas sesi (0)'})).toBeVisible();
});

test('photo PDF continues to PDF-to-JPG without opening a file picker',async({page})=>{
  await page.goto('/id/foto-ke-pdf/');
  await page.locator('input[type=file]').setInputFiles('tests/fixtures/portrait.jpg');
  await page.getByRole('button',{name:'Buat PDF'}).click();
  await expect(page.getByRole('link',{name:'Unduh PDF'})).toBeVisible({timeout:20_000});
  await page.getByRole('button',{name:'Ubah PDF ke JPG'}).click();
  await expect(page).toHaveURL(/pdf-ke-jpg/);
  await expect(page.getByText(/doculven\.pdf.*1 halaman/)).toBeVisible();
  await page.getByRole('button',{name:'Konversi halaman'}).click();
  await expect(page.getByRole('heading',{name:'Halaman hasil'})).toBeVisible();
  const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('link',{name:'Unduh halaman 1'}).click()]);
  expect(download.suggestedFilename()).toBe('page-001.jpg');
});

test('session keeps five results and can clear them',async({page})=>{
  await page.goto('/id/ukuran/ubah-ukuran-gambar/');
  await page.locator('input[type=file]').setInputFiles('tests/fixtures/portrait.jpg');
  let previous='';
  for(let i=1;i<=6;i++){
    await page.getByRole('button',{name:'Buat gambar'}).click();
    const image=page.getByAltText('Pratinjau hasil resize');
    await expect.poll(async()=>await image.getAttribute('src')).not.toBe(previous);
    previous=(await image.getAttribute('src'))!;
    await expect(page.getByRole('button',{name:`Berkas sesi (${Math.min(i,5)})`})).toBeVisible();
  }
  await page.getByRole('button',{name:'Berkas sesi (5)'}).click();
  await page.getByRole('button',{name:'Bersihkan semua'}).click();
  await expect(page.getByRole('button',{name:'Berkas sesi (0)'})).toBeVisible();
});
