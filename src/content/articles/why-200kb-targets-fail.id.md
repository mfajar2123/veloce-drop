---
lang: id
translationKey: why-200kb-targets-fail
title: Kenapa target kompresi 200 KB kadang tidak tercapai
summary: Target byte adalah permintaan, bukan janji. Ini yang sebenarnya menentukan apakah foto Anda bisa mencapai 200 KB tanpa rusak.
category: compression
toolId: compress-image
publishedAt: 2026-11-18
readingMinutes: 8
diagram: compression-curve
diagramAlt: Grafik yang menunjukkan penurunan ukuran file secara cepat saat kualitas JPEG diturunkan, lalu mendatar
image: /images/articles/why-200kb-targets-fail.webp
imageAlt: "Tampak dekat lensa kamera dan cincin diafragma"
imageCredit: "Vintage Camera Lens Macro by jcubic"
imageCreditUrl: "https://www.flickr.com/photos/56196558@N08/50132360368"
imageLicense: "by-sa 2.0"
related:
  - compress-image-without-losing-quality
  - jpeg-vs-webp-for-web-uploads
---

Anda menetapkan target 200 KB, alat berjalan, lalu hasilnya 340 KB. Tidak ada yang rusak. Alat itu sedang memberi tahu sesuatu yang benar tentang berkas Anda, dan alasannya penting dipahami karena menentukan langkah berikutnya.

## Apa yang sebenarnya diatur oleh target byte

JPEG dan WebP adalah format lossy. Saat kompresi berjalan, encoder memeriksa gambar per blok, membuang detail yang dianggap tidak akan terlihat mata, lalu menyimpan sisanya. Setelan **kualitas** memberi tahu encoder seberapa agresif ia boleh membuang.

Target ukuran bekerja terbalik. Alat tidak bisa memprediksi ukuran dari nilai kualitas, karena ukuran bergantung pada isi gambar, bukan hanya angka kualitas. Karena itu, implementasi yang hati-hati akan mengodekan gambar beberapa kali pada tingkat kualitas berbeda, mengukur tiap hasil, lalu menyimpan yang terbaik yang masih di bawah target Anda.

Pencarian itu punya batas bawah. Di bawah kualitas tertentu, gambar menjadi jelas rusak: langit bergerombol blok, garis halus di sekitar teks, warna kulit yang melebar. Alat yang bertanggung jawab berhenti sebelum titik itu, yang berarti ada **ukuran minimum yang bisa dicapai gambar Anda pada dimensi saat ini**.

## Empat hal yang menentukan batas bawah itu

**1. Dimensi piksel.** Ini faktor dominan, dan sifatnya eksponensial, bukan linear. Gambar 4000 × 3000 piksel berisi dua belas juta piksel. Pada 1200 × 900 hanya sekitar satu juta. Foto yang sama, subjek yang sama, tetapi versi kecil punya data 12 kali lebih sedikit untuk dikodekan. Tidak ada setelan kualitas yang bisa menutup selisih itu.

**2. Kepadatan detail.** Foto dinding bata, halaman teks, atau pasar yang ramai menyimpan jauh lebih banyak informasi frekuensi tinggi daripada potret dengan latar polos. Detail frekuensi tinggi adalah tepat hal yang harus dibayar mahal oleh encoder. Inilah sebabnya dua gambar dengan dimensi identik bisa berbeda empat kali lipat pada ukuran minimumnya.

**3. Tekstur halus dan noise.** Grain, noise sensor, dan gradasi halus itu mahal. Area mulus hampir tidak menghabiskan byte; langit yang berbutir sangat sulit dikompres. Foto yang diambil di cahaya redup sering jauh lebih sulit dikompres daripada pemandangan sama di siang hari.

**4. Transparansi.** PNG menyimpan kanal alpha. JPEG tidak mengenal transparansi, jadi area transparan harus diisi sesuatu, umumnya putih. Jika gambar Anda logo atau foto produk potongan, mengubahnya ke JPEG mengubah tampilan sekaligus mungkin tidak menghemat sebesar yang Anda kira.

## Kenapa WebP sering mencapai target saat JPEG tidak

WebP umumnya menghasilkan berkas lebih kecil pada kualitas visual setara, di kisaran 25–35% untuk konten fotografis. WebP juga mendukung transparansi, sehingga Anda tidak perlu meratakan gambar potongan menjadi putih.

Jika target 200 KB adalah syarat keras — portal lamaran kerja yang menolak berkas lebih besar, formulir dengan batas ketat — mengubah format keluaran ke WebP sering menjadi langkah paling efektif. Imbalannya adalah kompatibilitas: semua browser modern membaca WebP, tetapi sebagian sistem unggah lama, dan sebagian aplikasi desktop, masih mengharapkan JPEG.

## Langkah yang benar-benar bekerja: kurangi dimensi

Saat penurunan kualitas saja tidak cukup, pengurangan dimensi bisa. Memangkas lebar dan tinggi menjadi separuh mengurangi jumlah piksel menjadi seperempat, yang biasanya memotong ukuran berkas pada orde serupa.

Persoalannya, ini benar-benar mengubah gambar Anda. Foto selebar 4000 piksel yang diperkecil ke 1500 piksel layak untuk unggahan web dan tidak layak untuk cetak. Doculven memperlakukan ini sebagai tindakan terpisah dan eksplisit, bukan diam-diam, itulah sebabnya alat menawarkan "coba perkecil dimensi" sebagai pilihan setelah melaporkan bahwa target tidak tercapai.

Sebelum menerimanya, tanyakan untuk apa berkas itu:

- **Unggah ke formulir atau portal:** dimensi hampir tidak penting. Perkecil.
- **Lampiran email:** umumnya dilihat di layar. Perkecil.
- **Cetak A4:** Anda butuh sekitar 2480 × 3508 piksel pada 300 DPI. Jangan perkecil.
- **Daftar produk marketplace:** marketplace akan mengubah ukurannya sendiri. Cukup penuhi batas berkas dan pertahankan rasio.

## Urutan praktis

Saat target terasa mustahil, kerjakan dengan urutan ini:

1. **Pastikan targetnya benar-benar 200 KB**, bukan 200 KiB. Sebagian sistem memakai KiB (1024 byte) sementara yang lain KB (1000 byte); selisihnya kecil tetapi kadang menentukan tepat di batas.
2. **Ukur berkas asli.** Asli 12 MB menjadi 200 KB berarti pengurangan 98%, itu permintaan besar. Asli 900 KB menjadi 200 KB itu rutin.
3. **Coba WebP** jika sistem penerima menerimanya.
4. **Kurangi dimensi** hanya bila penggunaan mengizinkan, dan simpan berkas asli.
5. **Periksa hasilnya**, bukan hanya ukuran berkas. Berkas yang mencapai 200 KB tetapi tampak melebar bukan keberhasilan.

## Kenapa laporan alat itu penting

Saat Doculven tidak bisa mencapai target, ia mengatakannya dan menunjukkan hasil terkecil yang bisa dibuat pada dimensi penuh, beserta ukuran sebenarnya. Angka itu berguna: ia memberi tahu seberapa jauh Anda dari target, yang menunjukkan apakah perubahan format saja cukup atau dimensi harus berubah.

Alat yang diam-diam mengembalikan berkas 340 KB sambil menampilkan "200 KB" jauh lebih buruk daripada tidak berguna. Kegagalan yang jujur adalah fiturnya.

## Saat masalahnya bukan ukuran

Jika sistem penerima menolak berkas Anda, baca pesan kesalahannya dengan teliti. Sebagian portal menolak karena **dimensi** bukan byte, sebagian karena rasio aspek, sebagian karena profil warna, dan sebagian karena penamaan berkas. Mengompres lebih jauh tidak akan memperbaiki aturan yang sejak awal tidak Anda langgar.
