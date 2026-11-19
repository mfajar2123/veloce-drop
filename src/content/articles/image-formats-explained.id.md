---
lang: id
translationKey: image-formats-explained
title: PNG, JPEG, WebP, HEIC, SVG, ICO — kapan memakai yang mana
summary: Enam format, enam tujuan berbeda. Sebagian besar masalah konversi muncul karena memakai alat yang tepat untuk pekerjaan yang salah.
category: conversion
toolId: image-converter
publishedAt: 2026-11-07
readingMinutes: 8
related:
  - jpeg-vs-webp-for-web-uploads
  - heic-to-jpg-on-windows
---

Format gambar bukan wadah yang bisa saling ditukar. Masing-masing dirancang untuk masalah tertentu, dan memilih yang salah menghasilkan gejala yang akrab: teks kabur, berkas besar, transparansi hilang, atau berkas yang tidak bisa dibuka.

## JPEG — foto, dan hanya foto

JPEG memakai kompresi lossy berdasarkan sistem visual manusia. Ia sangat baik untuk foto dan sangat buruk untuk apa pun yang punya tepi tajam.

**Pakai untuk:** foto, foto produk, apa pun dengan nada kontinu.
**Hindari untuk:** teks, tangkapan layar, logo, gambar garis, apa pun dengan transparansi.
**Ukuran tipikal:** kecil untuk foto.

Kesalahan klasiknya adalah mengambil tangkapan layar kode, menyimpannya sebagai JPEG, lalu heran kenapa teksnya kabur. Kompresi berbasis blok JPEG membelanjakan presisinya pada gradasi dan menghancurkan tepi berkontras tinggi — kebalikan dari yang dibutuhkan teks.

## PNG — lossless, dengan transparansi

PNG menyimpan setiap piksel secara persis, opsional dengan kanal alpha. Kompresinya lossless: berkas lebih kecil dari data mentah, tetapi tidak ada informasi yang dibuang.

**Pakai untuk:** tangkapan layar, logo, ikon, diagram, apa pun dengan transparansi, gambar yang akan diedit lagi.
**Hindari untuk:** foto besar, yang menghasilkan berkas sangat besar.
**Ukuran tipikal:** besar untuk foto, kecil dan tajam untuk grafik.

Foto 4000 × 3000 sebagai PNG bisa melebihi 20 MB. Foto yang sama sebagai JPEG sekitar 2 MB. Untuk grafik dengan area datar, PNG sering lebih kecil *dan* lebih tajam.

## WebP — default modern untuk web

WebP melakukan kompresi lossy maupun lossless, mendukung transparansi, dan umumnya mengalahkan JPEG sebesar 25–35% pada kualitas visual setara.

**Pakai untuk:** gambar situs web, apa pun di mana ukuran penting dan tujuannya browser.
**Hindari untuk:** sistem yang hanya menerima JPEG — portal unggah lama, sebagian perangkat lunak desktop.
**Ukuran tipikal:** terkecil di antara ketiganya untuk kualitas setara.

Dukungan browser universal pada versi saat ini. Kendalanya bukan browser, melainkan perangkat lunak warisan.

## HEIC — yang dihasilkan iPhone

HEIC memakai kompresi HEVC di dalam wadah yang bisa memuat gambar diam, rangkaian Live Photo, dan data kedalaman. Ukurannya kira-kira separuh JPEG berkualitas setara.

**Pakai untuk:** tidak ada yang dipilih — itu yang dihasilkan kamera.
**Hindari untuk:** berbagi dengan sistem non-Apple, mengunggah ke formulir web.
**Ukuran tipikal:** sangat kecil untuk kualitasnya.

Masalahnya kompatibilitas, bukan kualitas. Konversi ke JPEG untuk jangkauan maksimal, WebP untuk efisiensi.

## SVG — vektor, bukan raster

SVG bukan gambar dalam pengertian piksel. Ia sekumpulan instruksi: gambar lingkaran di sini, path di sana. Ia diskalakan ke resolusi apa pun tanpa kehilangan karena tidak ada piksel sampai dirender.

**Pakai untuk:** logo, ikon, ilustrasi, apa pun yang harus diskalakan.
**Hindari untuk:** foto. SVG dari foto biasanya pembungkus gambar raster sematan, tidak memberi keuntungan apa pun.
**Ukuran tipikal:** sangat kecil untuk bentuk sederhana.

SVG bisa memuat skrip, referensi eksternal, dan HTML sematan, yang menjadikannya masalah keamanan. Sanitasi sebelum rasterisasi bukan opsional — SVG berbahaya bisa mengeksekusi skrip dalam beberapa konteks. VeloceDrop menolak berkas SVG yang berisi skrip atau sumber eksternal daripada mencoba membersihkannya.

## ICO — ikon Windows

ICO adalah wadah yang memuat beberapa resolusi dari satu ikon, sehingga Windows bisa memilih ukuran yang tepat untuk taskbar, desktop, atau daftar berkas.

**Pakai untuk:** ikon aplikasi Windows, favicon dalam beberapa konteks.
**Hindari untuk:** apa pun selain itu.
**Ukuran tipikal:** kecil, karena ikon memang kecil.

ICO yang benar memuat beberapa bingkai — umumnya 16, 32, 48, 64, 128, dan 256 piksel. ICO resolusi tunggal tampak salah pada sebagian ukuran.

## Tabel keputusan

| Konten | Format | Alasan |
| --- | --- | --- |
| Foto untuk web | WebP, cadangan JPEG | Terkecil pada kualitas baik |
| Foto untuk cetak | JPEG kualitas tinggi, atau TIFF | Kompatibilitas, kualitas |
| Tangkapan layar berteks | PNG | Tepi tajam, lossless |
| Logo dengan transparansi | SVG atau PNG | Skalabilitas, alpha |
| Foto ponsel untuk dibagikan | JPEG | Universal |
| Ikon Windows | ICO | Wadah multi-resolusi |
| Ikon web | PNG atau SVG | Dukungan browser |

## Konversi tidak gratis

Setiap konversi lossy ke lossy kehilangan kualitas. JPEG → WebP → JPEG menumpuk artefak pada setiap langkah. Selalu konversi dari sumber asli bila memungkinkan, dan simpan aslinya.

Mengonversi JPEG ke PNG tidak memulihkan kualitas — itu hanya menghentikan kehilangan lebih lanjut. Berkas menjadi lebih besar tanpa lebih tajam.

Perbedaan itu sering menangkap orang: mengonversi foto yang sudah dikompres ke format "lebih baik" tidak bisa membatalkan kompresi yang sudah terjadi.
