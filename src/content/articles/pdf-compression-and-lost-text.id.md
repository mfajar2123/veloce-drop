---
lang: id
translationKey: pdf-compression-and-lost-text
title: Mengompres PDF biasanya menghilangkan teksnya
summary: Sebagian besar kompresor PDF cepat, termasuk alat ini, merasterisasi halaman. Artinya teks berhenti menjadi teks — tidak bisa dipilih, dicari, atau disalin.
category: documents
toolId: pdf-500kb
publishedAt: 2026-11-14
readingMinutes: 7
image: /images/articles/pdf-compression-and-lost-text.webp
imageAlt: "Tumpukan koran hitam putih dengan teks tercetak"
imageCredit: "Newspapers B&W (5) by NS Newsflash"
imageCreditUrl: "https://www.flickr.com/photos/62693815@N03/6277209256"
imageLicense: "by 2.0"
related:
  - photos-to-pdf-page-order
  - passport-photo-sizes-explained
---

Anda mengompres PDF agar muat batas unggah, dan sekarang penerima tidak bisa memilih atau mencari teksnya. Tidak ada yang rusak. Ini perilaku yang diharapkan dari metode kompresi paling umum, dan itu penting diketahui sebelum menekan tombol, bukan sesudahnya.

## Dua jenis PDF yang sangat berbeda

**PDF berbasis teks** menyimpan karakter, referensi font, dan instruksi posisi. Kontrak 40 halaman bisa di bawah 200 KB karena isinya sebagian besar instruksi, bukan gambar. Anda bisa memilih teks, mencari, dan menyalinnya. Pembaca layar bisa membacanya.

**PDF hasil pindai** adalah foto halaman yang dibungkus wadah PDF. Setiap halaman adalah satu gambar besar. Pindaian 40 halaman mudah mencapai 20 MB, dan teksnya bukan teks sama sekali.

Sebagian besar dokumen nyata adalah campuran: teks dengan gambar sematan, logo, dan kadang halaman hasil pindai.

## Apa yang dilakukan "kompres" pada masing-masing

Ada dua strategi kompresi, dan perilakunya sangat berbeda.

**Kompresi struktural lossless** menghapus redundansi di dalam PDF — subset font ganda, objek tak terpakai, stream yang tidak efisien. Teks tetap teks. Penghematannya nyata tetapi moderat, biasanya 5–25%. Tidak ada yang berubah secara visual.

**Rasterisasi** merender setiap halaman menjadi gambar pada resolusi tertentu, lalu mengodekan ulang gambar itu sebagai JPEG pada kualitas tertentu. Inilah yang dilakukan sebagian besar alat "kompres PDF ke X KB", dan itulah sebabnya mereka bisa mencapai target agresif.

Rasterisasi punya konsekuensi yang permanen:

- Teks bukan lagi teks. Tidak bisa dipilih, dicari, atau disalin.
- Tautan, kolom formulir, dan anotasi hilang.
- Pembaca layar melihat gambar tanpa teks alternatif.
- Kualitas bergantung DPI yang Anda pilih. Teks pada 72 DPI terlihat jelas lembut.
- Ukuran berkas bergantung jumlah halaman, karena setiap halaman menjadi gambar terpisah.

Doculven memakai rasterisasi dan menyatakannya di halaman alat. Itulah sebabnya entri FAQ menjelaskan pertukarannya daripada menyembunyikannya.

## Memilih resolusi

Jika Anda harus merasterisasi, DPI menentukan keseimbangan kualitas dan ukuran:

| DPI | Tampak seperti | Cocok untuk |
| --- | --- | --- |
| 72 | Teks lembut, kabur pada cetakan kecil | Lampiran email ukuran minimum |
| 96 | Terbaca di layar, lembut saat dicetak | Hanya dibaca di layar |
| 144 | Tajam di layar, dapat diterima untuk cetak | Keperluan umum |
| 200+ | Tajam, tetapi berkas besar | Dokumen yang mungkin dicetak |

DPI lebih tinggi berarti lebih banyak piksel per halaman, yang berarti berkas lebih besar. Jika target Anda kecil dan jumlah halaman banyak, Anda akan terpaksa turun apakah Anda suka atau tidak.

## Yang sebaiknya dilakukan, saat teks penting

Jika dokumen harus tetap bisa dicari, aksesibel, atau diedit, jangan rasterisasi. Pilihan, berurutan dari yang paling disukai:

1. **Cetak ulang ke PDF** dari aplikasi sumber dengan opsi "kompres gambar" — banyak aplikasi bisa menurunkan resolusi gambar sematan sambil mempertahankan teks.
2. **Kurangi hanya gambarnya** di dalam PDF, dengan mempertahankan lapisan teks.
3. **Pecah dokumen** menjadi bagian lebih kecil jika batasnya per berkas.
4. **Tanyakan apakah batasnya nyata.** Sebagian portal menyebut batas tetapi menerima berkas lebih besar; sebagian akan mengompres di sisi server.

Jika tidak ada yang berhasil dan Anda harus merasterisasi, simpan berkas asli. Berkas terkompresi adalah turunan, bukan pengganti.

## Daftar periksa sebelum mengompres

- Apakah penerima perlu mencari, memilih, atau menyalin teks?
- Apakah dokumen ini akan dibaca pembaca layar?
- Apakah ada kolom formulir atau tautan yang harus tetap berfungsi?
- Apakah ada yang akan mencetaknya?
- Apakah berkas asli tersimpan aman?

Jika tiga pertanyaan pertama dijawab tidak dan yang terakhir ya, rasterisasi masuk akal. Jika tidak, pertimbangkan ulang.

## Catatan tentang mencapai target tertentu

Target byte adalah permintaan, bukan jaminan. Alat mencoba sekumpulan kualitas JPEG pada resolusi terpilih dan melaporkan apakah target tercapai. Saat tidak bisa, ia memberi tahu hasil terkecil yang dihasilkan — angka itu memberi tahu Anda apakah harus menurunkan DPI, menaikkan target, atau menerima bahwa dokumen ini butuh pendekatan lain.
