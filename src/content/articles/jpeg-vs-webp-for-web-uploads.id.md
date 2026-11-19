---
lang: id
translationKey: jpeg-vs-webp-for-web-uploads
title: JPEG atau WebP untuk unggahan web?
summary: Kedua format bekerja di semua tempat penting sekarang. Pertanyaannya hanya mana yang diterima sistem penerima dan apa dampaknya pada transparansi.
category: compression
toolId: image-converter
publishedAt: 2026-11-16
readingMinutes: 6
related:
  - compress-image-without-losing-quality
  - why-200kb-targets-fail
---

Pertanyaan JPEG versus WebP jauh lebih sering diajukan daripada yang seharusnya. Dalam praktik, jawabannya ditentukan dua hal: apakah sistem penerima Anda menerima WebP, dan apakah gambar Anda punya transparansi. Sisanya adalah selisih kecil.

## Versi singkat

Pakai **WebP** jika Anda mengendalikan ke mana gambar itu pergi — situs sendiri, marketplace modern, platform sosial. Format ini menghasilkan berkas lebih kecil pada kualitas visual setara.

Pakai **JPEG** jika formulir, portal, atau perangkat lunak harus menerimanya dan Anda tidak bisa mengujinya lebih dulu. Kegagalan kompatibilitas muncul sebagai galat "tipe berkas tidak valid" yang tidak bisa didiagnosis pengguna.

Pakai **PNG** jika gambar punya transparansi atau bukan fotografis — tangkapan layar, logo, diagram.

## Apa yang sebenarnya berbeda

JPEG dan WebP sama-sama lossy pada setelan umum. Bedanya adalah seberapa efisien mereka membelanjakan byte.

**Ukuran berkas.** Untuk konten fotografis, WebP pada kualitas visual setara umumnya 25–35% lebih kecil daripada JPEG. Penghematan itu berarti, dan sering menentukan apakah Anda bisa memenuhi batas ukuran tanpa mengurangi dimensi.

**Transparansi.** JPEG tidak punya. Area transparan diisi warna, biasanya putih. WebP mendukung kanal alpha, sehingga foto produk potongan mempertahankan latar transparan.

**Dukungan browser.** Semua browser saat ini membaca WebP — Chrome, Firefox, Safari, Edge. Safari mendukungnya sejak versi 14, dirilis 2020. Untuk situs web, ini bukan lagi kekhawatiran praktis.

**Dukungan perangkat lunak.** Inilah titik lemahnya. Aplikasi desktop lama, sebagian penyunting gambar, sebagian alur cetak, dan jumlah portal unggah pemerintah yang mengejutkan masih mengharapkan `.jpg`. Berkas yang terbuka sempurna di browser bisa ditolak sistem dokumen kantor.

**Metadata.** Mengodekan ulang ke format mana pun menghapus sebagian besar data EXIF, termasuk koordinat GPS. Keduanya baik dalam hal itu.

## Kenapa JPEG masih ada

JPEG dipakai sejak 1992. Sejarahnya adalah intinya: ia satu-satunya format gambar yang bisa dibaca hampir setiap perangkat, aplikasi, dan formulir unggah di dunia. Saat Anda tidak tahu sistem penerimanya, JPEG adalah pilihan aman bukan karena lebih baik, tetapi karena tidak pernah salah.

WebP secara teknis lebih unggul dan secara operasional lebih berisiko tepat pada satu skenario: target unggah yang belum diuji.

## Jebakan transparansi

Mengubah PNG dengan latar transparan menjadi JPEG tidak gagal secara berisik. Ia menghasilkan berkas yang tampak benar kecuali bahwa area transparan kini berwarna putih padat. Jika gambar itu diletakkan di halaman berwarna, kotak putihnya menjadi jelas belakangan.

Jika Anda butuh JPEG dari gambar potongan, pilih warna latar dengan sengaja — samakan dengan latar tujuan. VeloceDrop menanyakan warna itu daripada mengasumsikan putih, karena alasan ini.

## Alur kerja yang menghindari pertanyaan

1. **Tentukan aturan tujuan lebih dulu.** Baca tipe berkas yang diterima formulir. Jika tertulis "JPG, PNG", jangan kirim WebP.
2. **Sesuaikan dengan jenis konten.** Foto → JPEG atau WebP. Tangkapan layar atau logo → PNG.
3. **Jika tujuan tidak diketahui**, hasilkan JPEG. Itu pilihan paling rendah risiko.
4. **Jika ukuran adalah batasan mengikat**, coba WebP dulu, lalu kembali ke JPEG dengan dimensi lebih kecil.
5. **Verifikasi hasilnya** dengan membuka berkas yang diunduh, bukan hanya membaca pesan sukses.

## Yang sebaiknya tidak dilakukan

Jangan mengubah JPEG ke WebP lalu kembali ke JPEG sebagai cara "mengoptimalkan". Setiap perjalanan lossy menambah artefak tanpa memulihkan kualitas apa pun. Selalu mulai dari berkas asli.

Jangan mengasumsikan berkas yang lebih kecil otomatis lebih baik. Gambar 40 KB yang tampak melebar di layar retina lebih buruk daripada gambar 180 KB yang tampak bersih. Target yang benar adalah berkas terkecil yang masih tampak tepat pada ukuran tampilannya.
