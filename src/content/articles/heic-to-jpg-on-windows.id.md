---
lang: id
translationKey: heic-to-jpg-on-windows
title: Mengonversi foto HEIC di Windows, dan kenapa tidak bisa dibuka
summary: Foto iPhone berformat HEIC. Windows sering tidak bisa membukanya. Ini penjelasan formatnya, kenapa konversi perlu, dan apa yang berubah.
category: conversion
toolId: image-converter
publishedAt: 2026-11-13
readingMinutes: 6
related:
  - jpeg-vs-webp-for-web-uploads
  - compress-image-without-losing-quality
---

Anda menyalin foto dari iPhone ke PC Windows, mengklik gandanya, dan Windows berkata tidak bisa membuka berkas itu. Ekstensinya `.heic`. Tidak ada yang rusak. Windows memang tidak menyertakan codec-nya secara default pada banyak konfigurasi.

## Apa sebenarnya HEIC

HEIC adalah singkatan dari High Efficiency Image Container. Format ini berbasis HEIF dan memakai kompresi HEVC (H.265). Dalam bahasa sederhana: teknologi yang sama keluarganya dengan video H.265, diterapkan pada gambar diam.

Tujuannya efisiensi. Apple beralih ke HEIC karena menyimpan foto pada kira-kira separuh ukuran JPEG berkualitas setara. Pada ponsel dengan penyimpanan terbatas, itu sangat berarti.

HEIC juga sebuah **wadah**, bukan satu format tunggal. Satu berkas `.heic` bisa memuat:

- gambar diam utama,
- rangkaian bingkai (Live Photo),
- data kedalaman untuk efek mode potret,
- gambar tambahan,
- metadata.

Inilah sebabnya konversi tidak selalu operasi satu-ke-satu yang bersih. Konverter harus memutuskan apa yang diambil.

## Kenapa Windows kesulitan

Dukungan JPEG sudah menyatu di Windows. HEIC memerlukan codec terpisah, yang Microsoft distribusikan sebagai ekstensi berbayar di sebagian versi dan sudah terpasang di versi lain. Hasilnya perilaku tidak konsisten: berkas yang sama terbuka di satu mesin dan tidak di mesin lain.

Browser serupa. Safari menangani HEIC di platform Apple. Chrome dan Firefox umumnya tidak, itulah sebabnya foto HEIC yang dilampirkan ke formulir web sering gagal dipratinjau.

## Apa yang berubah saat konversi

Mengonversi HEIC ke JPEG:

- **Mempertahankan** gambar utama, dimensi piksel, dan konten visual dasarnya.
- **Mempertahankan** orientasi, jika konverter menerapkan rotasi dengan benar.
- **Membuang** rangkaian Live Photo — Anda mendapat satu gambar diam.
- **Membuang** data kedalaman, sehingga blur latar mode potret menjadi gambar datar dengan blur yang sudah menyatu.
- **Membuang** sebagian besar metadata, tergantung konverter.
- **Menghilangkan** HDR pada sebagian besar kasus; berkas hasil konversi bisa tampak sedikit lebih datar daripada aslinya di layar HDR.

Poin terakhir sering mengejutkan. Jika foto tampak vivid di iPhone dan kusam setelah dikonversi, biasanya karena layar menampilkan rentang dinamis yang tidak bisa dibawa JPEG.

## Memilih format keluaran

Jika Anda butuh kompatibilitas maksimal — email, dokumen kantor, portal unggah — gunakan **JPEG**. Kualitas sekitar 90–92 secara visual tidak bisa dibedakan dari sumber untuk foto.

Jika gambar punya transparansi (jarang dari kamera, mungkin dari ekspor yang diedit), gunakan **PNG** atau **WebP**.

Jika ukuran berkas penting dan tujuan adalah browser modern, **WebP** memberi kompresi lebih baik daripada JPEG.

## Alur kerja yang mempertahankan aslinya

1. **Salin, jangan pindahkan** berkas HEIC dari ponsel. Simpan aslinya.
2. **Konversi secara massal** daripada satu per satu; biayanya sama dan pencatatannya lebih mudah.
3. **Periksa orientasi** pada satu sampel sebelum mengonversi seluruh folder. Bug rotasi jauh lebih murah ditemukan lebih awal.
4. **Pastikan satu berkas terbuka** di aplikasi tujuan sebelum mengandalkan hasil batch.
5. **Simpan JPEG hasil konversi** di folder terpisah agar tidak tertukar dengan aslinya.

## Kenapa konversi lokal penting di sini

Konversi bisa dilakukan sepenuhnya di browser, dan VeloceDrop melakukannya begitu. Dekoder HEIC berjalan di perangkat Anda; foto tidak pernah diunggah.

Itu bukan hanya preferensi privasi. Foto dokumen, KTP, dan anggota keluarga adalah tepat berkas yang seharusnya tidak diserahkan ke situs anonim. Konversi lokal menjaga byte tetap di mesin Anda, dan satu-satunya lalu lintas jaringan adalah memuat dekodernya sendiri.

## Saat konversi tidak cukup

Jika foto tidak bisa dikonversi, biasanya salah satu dari tiga hal:

- **Berkasnya bukan benar-benar HEIC.** Sebagian aplikasi mengganti nama berkas JPEG menjadi `.heic`. Header berkas akan mengungkapnya.
- **Berkas rusak atau tersalin sebagian.** Menyalin dari ponsel yang terputus di tengah proses menghasilkan persis ini.
- **Berkas memakai varian yang tidak didukung dekoder.** HEIC terenkripsi, atau konfigurasi gambar tambahan yang tidak umum.

Pesan galat yang jelas lebih berguna daripada kegagalan diam, itulah sebabnya alat membedakan "tidak dapat dibaca" dari "berhasil dikonversi".
