---
lang: id
translationKey: batch-processing-workflow
title: Alur kerja batch untuk mengompres dan memberi watermark satu set foto
summary: Memproses lima puluh foto produk satu per satu membuang waktu. Ini cara melakukannya dalam beberapa putaran tanpa kehilangan jejak berkas.
category: compression
toolId: batch
publishedAt: 2026-11-05
readingMinutes: 6
image: /images/articles/batch-processing-workflow.webp
imageAlt: "Kumpulan foto kecil yang disusun bersama"
imageCredit: "Wrapping It Up by jeff_golden"
imageCreditUrl: "https://www.flickr.com/photos/46868900@N00/4231395515"
imageLicense: "by-sa 2.0"
related:
  - watermark-that-survives-resizing
  - compress-image-without-losing-quality
---

Tugas satu gambar selesai dalam hitungan detik. Tugas yang sama diulang pada seratus berkas memakan waktu satu sore dan menghasilkan kesalahan. Bedanya bukan kecepatan, melainkan pencatatan: tahu berkas mana yang mana, dan tahu bahwa item yang gagal tidak lolos diam-diam.

## Rapikan penamaan sebelum apa pun

Kesalahan termahal dalam kerja batch adalah kehilangan pemetaan antara masukan dan keluaran.

Jika berkas Anda bernama `IMG_2841.jpg` sampai `IMG_2890.jpg`, keluaran bernama `compressed-1.jpg` sampai `compressed-50.jpg` menghancurkan pemetaan itu. Anda tidak lagi tahu hasil mana milik produk mana.

Dua solusi:

- **Pertahankan nama asli.** Sebagian besar alat batch, termasuk VeloceDrop, mempertahankan nama berkas masukan pada keluarannya.
- **Ganti nama dengan sengaja lebih dulu.** Jika nama hanya pengenal kamera tanpa makna, ganti menjadi sesuatu yang bermakna — `kemeja-biru-depan.jpg` — sebelum diproses, memakai fitur ganti nama massal di pengelola berkas.

Nama berkas duplikat adalah bahaya nyata. Dua folder yang masing-masing berisi `foto.jpg` akan bertabrakan di ZIP. Alat yang baik membedakannya dengan akhiran daripada menimpa.

## Putaran satu: tentukan target sebelum menyentuh apa pun

Untuk satu set produk, tanyakan:

- Apa tujuannya — marketplace, situs sendiri, email?
- Batas ukuran berkas apa yang berlaku?
- Pada dimensi berapa marketplace menampilkannya?

Marketplace biasanya mengubah ukuran ke standar mereka. Mengirim gambar 4000 piksel di mana yang ditampilkan 1500 membuang bandwidth saat unggah dan tidak memberi keuntungan pada daftar. Mengirim gambar 400 piksel di mana yang ditampilkan 1500 akan tampak lembut.

Pilih satu ukuran target dan satu kualitas, lalu terapkan ke semuanya. Konsistensi dalam satu set produk lebih penting daripada optimasi per gambar.

## Putaran dua: kompres dalam satu batch

Tambahkan seluruh set, setel target sekali, dan biarkan berjalan.

Perhatikan tiga hal pada hasilnya:

- **Item yang gagal.** Berkas rusak atau format yang tidak didukung akan gagal satu per satu. Alat yang baik melaporkan status per item daripada membatalkan seluruh batch.
- **Item yang meleset dari target.** Jika lima dari lima puluh tidak bisa mencapai target pada dimensi penuh, putuskan sekali apakah kelimanya harus diperkecil, daripada menanganinya sebagai kasus khusus satu per satu.
- **Peringatan tentang kualitas.** Jika batch mengompres semuanya ke kualitas minimum untuk mencapai target, gambarnya akan tampak buruk. Naikkan target daripada mengirim foto yang rusak.

Unduh sebagai ZIP daripada mengklik setiap berkas. ZIP mempertahankan nama dan menjaga set tetap bersama.

## Putaran tiga: watermark, jika perlu

Jika gambar butuh logo, lakukan sebagai putaran terpisah pada keluaran terkompresi, bukan sebelumnya. Dua alasan:

- Memberi watermark lebih dulu berarti watermark itu sendiri ikut dikompres, yang melembutkannya.
- Jika setelan watermark ternyata salah, Anda bisa mengulanginya dari set terkompresi tanpa mengompres ulang.

Setel lebar logo sebagai **persentase**, bukan piksel, agar tetap proporsional pada set dengan dimensi bervariasi. Uji opasitas pada satu gambar di ukuran tampilan sebelum menerapkan ke kelima puluh.

## Putaran empat: verifikasi sampel

Jangan mengirim batch yang belum Anda periksa. Buka tiga berkas:

1. **Yang pertama.**
2. **Berkas sumber terbesar.** Paling mungkin meleset dari target.
3. **Satu acak dari tengah.**

Periksa bahwa berkas terbuka, dimensinya sesuai harapan, dan kualitas visualnya dapat diterima. Batch yang berhasil untuk 47 dari 50 berkas dan diam-diam gagal pada tiga lebih buruk daripada batch yang melaporkan tiga kegagalan.

## Yang harus disimpan

Simpan berkas asli. Kompresi batch adalah transformasi satu arah, dan kadang Anda perlu mengulanginya dengan setelan berbeda setelah melihat hasil di platform sebenarnya.

Susun sebagai: `asli/`, `terkompresi/`, `berwatermark/`. Menimpa di tempat menghilangkan kemampuan Anda untuk kembali.

## Batas yang perlu diketahui

Alat batch membatasi konkurensi dan ukuran total dengan alasan bagus — memori. Seratus gambar 20 megapiksel tidak bisa semuanya didekode bersamaan di mesin normal mana pun.

VeloceDrop membatasi satu batch hingga 25 gambar, 20 MB per gambar, 100 MB total, dan memprosesnya berurutan, melepaskan memori antar item. Jika Anda punya dua ratus berkas, jalankan batch delapan kali daripada memaksa semuanya sekaligus. Itu pertukaran yang disengaja agar tab tidak crash.
