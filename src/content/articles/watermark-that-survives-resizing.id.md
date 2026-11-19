---
lang: id
translationKey: watermark-that-survives-resizing
title: Memasang watermark logo yang tetap tepat setelah diubah ukurannya
summary: Watermark berukuran piksel rusak begitu gambar diubah ukurannya. Ukuran relatif, margin, dan opasitas adalah yang membuatnya bertahan.
category: watermark
toolId: watermark-logo
publishedAt: 2026-11-09
readingMinutes: 5
image: /images/articles/watermark-that-survives-resizing.webp
imageAlt: "Label cetak klasik dengan huruf dan ornamen"
imageCredit: "From Harpel's Typograph by Double--M"
imageCreditUrl: "https://www.flickr.com/photos/49879584@N00/4619270851"
imageLicense: "by 2.0"
related:
  - background-removal-limits
  - compress-image-without-losing-quality
---

Watermark punya satu tugas: tetap berada di gambar, terbaca, tanpa merusaknya. Melakukannya pada sekumpulan foto berukuran berbeda menuntut pemilihan satuan ukur yang tepat.

## Ukuran dalam piksel adalah satuan yang salah

Jika Anda menempatkan logo selebar 200 piksel pada foto 4000 piksel, ia menempati 5% lebar. Pada thumbnail 1000 piksel, 200 piksel yang sama menempati 20% — lima kali lebih dominan secara visual.

Inilah sebabnya alat watermark profesional mengukur logo **relatif terhadap lebar gambar**. Setel 15% dan ia tetap 15% apakah fotonya 800 piksel atau 8000. VeloceDrop memakai lebar relatif karena alasan ini, dalam rentang 5–50%.

Logika yang sama berlaku untuk posisi: margin yang dinyatakan dalam piksel bergeser secara visual saat dimensi berubah. Margin yang dinyatakan sebagai persentase sisi terpendek tetap proporsional.

## Memilih posisi

Lima posisi standar — empat sudut dan tengah — mencakup sebagian besar kebutuhan:

- **Kanan bawah** adalah pilihan konvensional. Terbaca sebagai tanda tangan tanpa menghalangi subjek pada sebagian besar komposisi.
- **Kiri bawah** bekerja saat kanan bawah ramai secara visual.
- **Sudut atas** kurang umum tetapi berguna saat subjek berada di bawah bingkai.
- **Tengah** memaksimalkan perlindungan sekaligus memaksimalkan kerusakan visual. Pakai hanya untuk proof yang tidak ingin dipakai ulang.

Untuk e-commerce, tanda kecil di sudut biasanya cukup. Pembeli menganggap watermark besar di tengah mengganggu, dan itu bisa memicu aturan marketplace tentang pelapisan gambar produk.

## Opasitas: terlihat tetapi tidak mengganggu

Opasitas penuh tampak seperti stiker yang ditempel. Opasitas sangat rendah menghilang setelah satu kali kompresi ulang.

Rentang praktis adalah **40–70%** untuk latar terang dan **60–85%** untuk latar gelap. Uji pada satu gambar pada ukuran tampilan sebenarnya sebelum menerapkan ke seluruh batch.

Ingat bahwa kompresi JPEG pada kualitas rendah bisa menghapus watermark samar sepenuhnya. Jika gambar akan dikompres setelahnya, condong ke opasitas lebih tinggi.

## Persiapan logo

Logo sumber sama pentingnya dengan setelannya:

- **Gunakan PNG dengan transparansi.** Logo pada persegi panjang putih menciptakan kotak yang terlihat.
- **Gunakan versi berkontras tinggi.** Logo yang hampir menyatu dengan nada foto akan hilang pada opasitas moderat.
- **Jaga kesederhanaan.** Detail halus pada tanda kecil menjadi kabur setelah pengubahan ukuran dan kompresi.
- **Perhatikan rasio aspek.** Alat menskalakan berdasarkan lebar; logo yang sangat tinggi bisa menjadi terlalu kecil untuk terbaca.

Kesalahan umum adalah mengekspor logo 4000 piksel lalu membiarkan alat mengecilkannya. Lebih baik menyediakan pada ukuran yang akan benar-benar dipakai, agar artefak pengecilan tidak menumpuk.

## Apa yang dilakukan dan tidak dilakukan watermark

Jujur soal ini: watermark terlihat adalah pencegah, bukan perlindungan. Ia bisa dipotong, ditimpa, atau dihapus dengan tingkat kesulitan berbeda. Siapa pun yang cukup berniat akan menghapusnya.

Yang ia lakukan dengan baik:

- Mencegah penggunaan ulang sembarangan pada gambar pratinjau.
- Menetapkan asal-usul saat gambar dibagikan tanpa atribusi.
- Menandakan "ini proof" untuk tinjauan klien.

Yang tidak ia lakukan:

- Mencegah pencurian.
- Bertahan terhadap penyuntingan yang gigih.
- Menggantikan lisensi yang tepat atau pemberitahuan hak cipta.

Dokumentasi VeloceDrop menyatakan hal ini daripada menjual fiturnya secara berlebihan.

## Alur kerja batch

1. **Uji pada satu gambar lebih dulu.** Posisi, ukuran, dan opasitas berinteraksi dengan kontennya.
2. **Terapkan ke batch** dan tinjau tiga hasil pertama.
3. **Waspadai kasus khusus** — gambar di mana sudut terpilih ditempati subjek.
4. **Ekspor sebagai PNG** jika transparansi harus dipertahankan, atau JPEG untuk berkas lebih kecil.

Alat melaporkan hasil setiap berkas secara terpisah, sehingga satu kegagalan tidak menghalangi sisanya.
