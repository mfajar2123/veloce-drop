---
lang: id
translationKey: pdf-to-jpg-resolution
title: Memilih resolusi yang tepat saat mengubah halaman PDF ke JPG
summary: 72, 144, atau 200 DPI menentukan apakah hasilnya terbaca, bisa dicetak, atau terlalu besar. Pilihannya bergantung pada satu pertanyaan.
category: documents
toolId: pdf-jpg
publishedAt: 2026-11-04
readingMinutes: 5
image: /images/articles/pdf-to-jpg-resolution.webp
imageAlt: "Pemindai flatbed dengan penutup terbuka"
imageCredit: "Flatbed Scanner by askhpnl"
imageCreditUrl: "https://www.flickr.com/photos/25896822@N06/7408052878"
imageLicense: "by 2.0"
related:
  - pdf-compression-and-lost-text
  - photos-to-pdf-page-order
---

Mengubah halaman PDF menjadi gambar memerlukan setelan resolusi, dan sebagian besar orang memilihnya tanpa tahu apa yang diubah. Ia mengubah dua hal yang saling bertukar langsung: seberapa terbaca teksnya, dan seberapa besar berkasnya.

## Apa arti DPI di sini

DPI adalah titik per inci. Dalam konteks ini artinya: berapa banyak piksel mewakili satu inci halaman asli.

A4 berukuran 210 × 297 mm, sekitar 8,27 × 11,69 inci. Pada:

- **72 DPI** → 595 × 842 piksel
- **144 DPI** → 1191 × 1684 piksel
- **200 DPI** → 1654 × 2339 piksel

Setiap langkah kira-kira menggandakan jumlah piksel di tiap arah, yang berarti sekitar empat kali piksel dan ukuran berkas.

## Tiga pilihan praktis

**72 DPI — untuk pratinjau dan ukuran minimum.**

Teks lembut. Huruf kecil sulit dibaca, dan garis tipis sering terputus. Setelan ini tepat ketika gambar hanya akan dilihat sekilas, atau ketika batas ukuran berkas yang ketat memaksa.

**144 DPI — jawaban serbaguna.**

Teks tajam di layar dan dapat diterima saat dicetak pada ukuran halaman asli. Ini pilihan ketika Anda tidak tahu penggunaan yang dimaksud. Default yang wajar untuk dokumen yang akan diemail atau diunggah.

**200 DPI — saat akan dicetak atau di-OCR.**

Teks tajam, tetapi berkas besar. Dokumen 10 halaman pada 200 DPI mudah menghasilkan 15 MB JPEG. Pilih ini ketika hasilnya akan dicetak, atau ketika gambar akan diproses pengenalan teks.

## Kenapa lebih tinggi tidak selalu lebih baik

Di atas sekitar 300 DPI, Anda menangkap detail yang sudah berada di batas resolusi PDF aslinya. Berkas membesar dan hasil visual tidak membaik. Untuk PDF yang dibuat dari pindaian 150 DPI, ekspor pada 200 DPI hampir tidak memberi keuntungan dibanding 150.

Batas lainnya adalah memori. Halaman sangat besar pada DPI tinggi bisa melewati anggaran piksel yang nyaman, itulah sebabnya alat menerapkan batas piksel per halaman daripada membiarkan konversi 200 DPI pada halaman kebesaran menghabiskan tab.

## Apa yang hilang terlepas dari resolusinya

Mengubah halaman PDF menjadi JPG menghasilkan gambar dari sebuah halaman. Artinya:

- **Teks bukan lagi teks.** Tidak bisa dipilih, dicari, atau disalin.
- **Tautan tidak berfungsi.** Hyperlink dalam PDF menjadi gambar hyperlink.
- **Anotasi tidak disertakan.** Komentar dan kolom formulir tidak dirender sebagai elemen interaktif.
- **Konten vektor dirasterisasi.** Garis, diagram, dan teks menjadi piksel, sehingga memperbesar menampilkan kelembutan bukan tepi tajam.

Jika salah satunya penting, mengubah ke gambar adalah operasi yang salah. Ekstrak teksnya dengan alat ekstraksi teks, atau simpan dokumen sebagai PDF.

## Memilih halaman

Sebagian besar konversi hanya butuh beberapa halaman. Laporan 40 halaman di mana Anda butuh halaman 3 dan 7 seharusnya tidak menghasilkan 40 gambar.

Pemilihan halaman biasanya menerima daftar dan rentang: `1,3-5,8` berarti halaman 1, halaman 3 sampai 5, dan halaman 8. Mengetiknya sekali lebih cepat daripada ekstraksi berulang per halaman.

## Kualitas versus ukuran, setelahnya

Kualitas JPG dan DPI adalah kontrol terpisah. DPI menentukan berapa banyak piksel; kualitas menentukan seberapa agresif piksel itu dikompres. Menurunkan kualitas menghemat ukuran tanpa mengurangi dimensi, tetapi menimbulkan artefak blok di sekitar teks — terlihat sebagai halo persegi di sekitar huruf.

Untuk gambar dokumen, pertahankan kualitas tinggi (90 ke atas) dan kendalikan ukuran lewat DPI. Teks bereaksi buruk terhadap kompresi JPEG agresif karena teks seluruhnya tersusun dari tepi berkontras tinggi yang tajam.

## Daftar periksa praktis

1. **Tanyakan untuk apa gambarnya.** Dibaca di layar, dicetak, atau pengenalan teks.
2. **Pilih DPI sesuai itu.** 72, 144, atau 200.
3. **Pilih hanya halaman yang Anda butuhkan.**
4. **Periksa satu halaman** sebelum mengonversi sisanya.
5. **Terima bahwa teksnya kini gambar** — jika itu tidak dapat diterima, berhenti dan pakai pendekatan lain.
