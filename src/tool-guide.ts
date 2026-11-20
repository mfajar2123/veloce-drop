import type { Locale } from './tool-registry';

type Section = { heading: Record<Locale, string>; body: Record<Locale, string> };

// Per-tool explanatory copy. Each entry describes what this specific workspace
// does and where its limits are; none of it is generic filler, and every claim
// matches the component beside it.
export const toolGuide: Record<string, Section[]> = {
  'compress-image': [
    {
      heading: { id: 'Bagaimana target KB dicari', en: 'How the KB target is found' },
      body: {
        id: 'Alat mengodekan gambar beberapa kali pada tingkat kualitas berbeda, mengukur setiap hasil, lalu menyimpan yang terbesar yang masih di bawah target. Karena ukuran bergantung pada isi gambar, bukan hanya angka kualitas, hasil Anda bisa berbeda dengan foto lain walau target dan dimensinya sama.',
        en: 'The tool encodes the image several times at different quality levels, measures each result, and keeps the largest one that still fits under your target. Size depends on image content rather than the quality number alone, so two photos can land on different results at the same target and dimensions.',
      },
    },
    {
      heading: { id: 'Kapan target tidak tercapai', en: 'When the target cannot be reached' },
      body: {
        id: 'Di bawah kualitas tertentu gambar mulai rusak terlihat: blok di area datar dan halo di sekitar teks. Alat berhenti sebelum itu dan melaporkan hasil terkecil yang bisa dibuat pada dimensi asli. Jika Anda setuju menurunkan resolusi, opsi perkecil dimensi mencoba lagi dengan piksel lebih sedikit.',
        en: 'Below a certain quality the image visibly breaks down: blocking in flat areas and halos around text. The tool stops before that point and reports the smallest result it can produce at full dimensions. If you accept a lower resolution, the reduce-dimensions option retries with fewer pixels.',
      },
    },
  ],
  batch: [
    {
      heading: { id: 'Batas antrean', en: 'Queue limits' },
      body: {
        id: 'Satu antrean menerima hingga 25 gambar, 20 MB dan 20 megapiksel per gambar, dengan total masukan 100 MB. Gambar diproses berurutan dan memori dilepas di antara item, supaya tab tidak kehabisan memori pada set besar.',
        en: 'One queue accepts up to 25 images, 20 MB and 20 megapixels each, with 100 MB total input. Images are processed one at a time and memory is released between items, so a large set does not exhaust the tab.',
      },
    },
    {
      heading: { id: 'Hasil yang gagal tidak menghentikan sisanya', en: 'A failed item does not stop the rest' },
      body: {
        id: 'Berkas rusak atau format yang tidak didukung ditandai per item, dan hasil lain tetap bisa diunduh. ZIP mempertahankan nama berkas, dan nama duplikat dibedakan dengan akhiran agar tidak saling menimpa.',
        en: 'A corrupt file or unsupported format is flagged per item and the other results stay downloadable. The ZIP keeps original filenames, and duplicate names are disambiguated with a suffix instead of overwriting each other.',
      },
    },
  ],
  'resize-image': [
    {
      heading: { id: 'DPI dan ukuran fisik', en: 'DPI and physical size' },
      body: {
        id: 'Preset pas foto memakai konversi 300 DPI: 1 mm sekitar 11,81 piksel. Jadi 3x4 cm menjadi 354 x 472 piksel dan 35x45 mm menjadi 413 x 531 piksel. Preset mengatur rasio dan dimensi, tetapi tidak memeriksa latar, pose, atau aturan instansi.',
        en: 'Photo presets assume 300 DPI, where 1 mm is about 11.81 pixels. That makes 3x4 cm equal 354 x 472 pixels and 35x45 mm equal 413 x 531 pixels. A preset sets the ratio and pixel size but cannot check background, pose or an authority rule.',
      },
    },
    {
      heading: { id: 'Penyesuaian memotong atau memuat utuh', en: 'Fill-and-crop versus contain' },
      body: {
        id: 'Mode penuhi dan potong menutupi seluruh bingkai dan membuang tepi gambar. Mode muat utuh menampilkan seluruh gambar dengan ruang kosong di dua sisi. Untuk dokumen seperti KTP, muat utuh lebih aman karena tidak ada konten yang hilang.',
        en: 'Fill-and-crop covers the whole frame and discards edges. Contain keeps the entire image with empty space on two sides. For documents such as an ID card, contain is safer because nothing is cut away.',
      },
    },
  ],
  'image-converter': [
    {
      heading: { id: 'Mengubah JFIF ke JPG', en: 'Convert JFIF to JPG' },
      body: { id: 'Pilih JFIF sebagai format sumber, buka foto, lalu pilih JPEG dan buat pratinjau. Unduhan JPG mempertahankan isi gambar dan metadata asli.', en: 'Select JFIF as the source, open your photo, then choose JPEG and create a preview. Download the JPG to keep the original image data and metadata.' },
    },
    {
      heading: { id: 'HEIC dari iPhone', en: 'HEIC from an iPhone' },
      body: {
        id: 'Dekoder HEIC dimuat dari situs ini saat konversi dimulai, dan hanya gambar diam utama yang diekspor. Rangkaian Live Photo serta data kedalaman atau potret tambahan tidak disertakan, jadi efek blur mode potret menjadi gambar datar.',
        en: 'The HEIC decoder loads from this site when conversion starts, and only the primary still is exported. Live Photo sequences plus auxiliary depth or portrait data are not included, so a portrait-mode blur becomes a flat image.',
      },
    },
    {
      heading: { id: 'Transparansi per format', en: 'Transparency per format' },
      body: {
        id: 'PNG dan WebP menyimpan kanal alpha; JPEG tidak. Saat membuat JPEG, area transparan diisi warna latar yang Anda pilih, sehingga hasilnya tidak akan tampak transparan di halaman berwarna lain. SVG disanitasi lebih dulu: skrip dan sumber luar ditolak.',
        en: 'PNG and WebP keep an alpha channel; JPEG cannot. When producing a JPEG the transparent area is filled with the background colour you choose, so it will not look transparent on a differently coloured page. SVG is sanitised first: scripts and external references are rejected.',
      },
    },
  ],
  background: [
    {
      heading: { id: 'Model dimuat otomatis', en: 'The model loads automatically' },
      body: {
        id: 'Model potret dan runtime sekitar 40,7 MB mulai dimuat begitu halaman dibuka, jadi Anda bisa langsung memilih foto. Setelah termuat, model tetap di memori sehingga foto berikutnya diproses tanpa mengunduh ulang.',
        en: 'The portrait model and runtime, about 40.7 MB, start loading as soon as the page opens so you can choose a photo immediately. Once loaded the model stays in memory, so the next photo is processed without downloading it again.',
      },
    },
    {
      heading: { id: 'Warna latar dan resolusi hasil', en: 'Background colour and output resolution' },
      body: {
        id: 'Biarkan latar transparan, pilih warna yang tersedia, atau gunakan pemilih warna. PNG mempertahankan dimensi piksel foto asli.',
        en: 'Keep the background transparent, select a swatch, or use the colour picker. The PNG keeps the source photo’s pixel dimensions.',
      },
    },
  ],
  'logo-watermark': [
    {
      heading: { id: 'Ukuran logo relatif, bukan piksel', en: 'Logo size is relative, not pixels' },
      body: {
        id: 'Lebar logo diatur sebagai persentase lebar gambar (5 sampai 50 persen), jadi tanda yang sama tetap proporsional pada set foto dengan dimensi berbeda. Margin memakai sisi gambar yang lebih pendek dan opasitas berkisar 10 sampai 100 persen.',
        en: 'Logo width is a percentage of image width, from 5 to 50 percent, so the same mark stays proportional across a set with different dimensions. Margin uses the shorter image side and opacity ranges from 10 to 100 percent.',
      },
    },
    {
      heading: { id: 'Batas perlindungan watermark', en: 'What a watermark does not protect' },
      body: {
        id: 'Watermark terlihat mencegah pemakaian ulang sembarangan, tetapi bisa dipotong atau dihapus dengan usaha cukup. Ia tidak menggantikan lisensi atau pemberitahuan hak cipta. Pengodean ulang memang menghapus metadata, bukan informasi yang terlihat.',
        en: 'A visible watermark discourages casual reuse but can be cropped or removed with enough effort. It does not replace a licence or a copyright notice. Re-encoding removes metadata, not visible information.',
      },
    },
  ],
  'photo-pdf': [
    {
      heading: { id: 'Urutan halaman', en: 'Page order' },
      body: {
        id: 'Setiap gambar menjadi satu halaman di tengah. Urutan mengikuti antrean, jadi periksa daftar sebelum membuat PDF: pengurutan nama berkas alfabetis bisa menaruh IMG_999 sebelum IMG_1000.',
        en: 'Each image becomes one centred page. Order follows the queue, so check the list before creating the PDF: alphabetical filename sorting can place IMG_999 before IMG_1000.',
      },
    },
    {
      heading: { id: 'Ukuran kertas dan margin', en: 'Paper size and margins' },
      body: {
        id: 'Pilih ikuti gambar, A4, F4, atau Letter. A4 adalah default internasional paling aman; F4 dipakai untuk dokumen administratif di sebagian Asia Tenggara. Margin minimal 10 mm disarankan jika PDF akan dicetak, karena printer tidak mencetak sampai tepi.',
        en: 'Choose follow-the-image, A4, F4 or Letter. A4 is the safest international default; F4 is used for administrative documents in parts of Southeast Asia. Allow at least 10 mm margin if the PDF will be printed, since printers cannot reach the paper edge.',
      },
    },
  ],
  'pdf-jpg': [
    {
      heading: { id: 'Memilih resolusi', en: 'Choosing a resolution' },
      body: {
        id: '72 DPI cocok untuk pratinjau ukuran minimum dan membuat teks lembut. 144 DPI tajam di layar dan dapat diterima untuk cetak pada ukuran asli. 200 DPI dipakai bila hasil akan dicetak atau diproses pengenalan teks, dengan berkas jauh lebih besar.',
        en: '72 DPI suits minimum-size previews and leaves text soft. 144 DPI is sharp on screen and acceptable when printed at original size. 200 DPI is for output that will be printed or run through text recognition, at a much larger file size.',
      },
    },
    {
      heading: { id: 'Yang hilang setelah dikonversi', en: 'What conversion removes' },
      body: {
        id: 'Halaman menjadi gambar, sehingga teks tidak lagi bisa dipilih, dicari, atau disalin. Tautan tidak berfungsi dan anotasi tidak disertakan. Jika Anda masih membutuhkan teks, jangan konversi ke JPG.',
        en: 'A page becomes a picture, so text can no longer be selected, searched or copied. Links stop working and annotations are not included. If you still need the text, do not convert to JPG.',
      },
    },
  ],
  'pdf-500kb': [
    {
      heading: { id: 'Kenapa teks hilang', en: 'Why the text disappears' },
      body: {
        id: 'Untuk mencapai target kecil, halaman dirasterkan menjadi gambar lalu dikodekan ulang sebagai JPEG. Hasilnya lebih kecil, tetapi teks tidak lagi dapat dicari atau dipilih dan kolom formulir serta tautan tidak berfungsi. Simpan berkas asli.',
        en: 'To reach a small target, pages are rasterized into images and re-encoded as JPEG. The result is smaller, but text is no longer searchable or selectable and form fields plus links stop working. Keep the original file.',
      },
    },
    {
      heading: { id: 'Kalau target tidak tercapai', en: 'If the target is not reached' },
      body: {
        id: 'Ukuran akhir bergantung jumlah halaman, isi, resolusi, dan kualitas. Bila hasil terkecil masih di atas target, alat mengatakannya. Coba target lebih besar atau DPI lebih rendah daripada mengompres berulang kali dari berkas yang sudah terkompresi.',
        en: 'Final size depends on page count, content, resolution and quality. If the smallest result is still above the target, the tool says so. Try a larger target or a lower DPI rather than compressing an already-compressed file again.',
      },
    },
  ],
  print: [
    {
      heading: { id: 'Menghitung kapasitas lembar', en: 'Working out sheet capacity' },
      body: {
        id: 'Pilih ukuran kertas, ukuran foto, dan orientasi. Tata letak memakai margin 5 mm dan jarak antarfoto 6 mm. Kapasitas terlihat sebelum ekspor.',
        en: 'Choose the paper size, photo size and orientation. The layout uses 5 mm margins and 6 mm gaps between photos. Capacity is shown before export.',
      },
    },
    {
      heading: { id: 'Cetak pada 100 persen', en: 'Print at 100 percent' },
      body: {
        id: 'PDF memakai ukuran halaman fisik, tetapi driver printer dapat mengecilkan halaman agar muat margin. Cetak pada skala 100 persen atau ukuran sebenarnya, lalu ukur satu foto dengan penggaris untuk memastikan 30 mm benar-benar 30 mm.',
        en: 'The PDF uses physical page dimensions, but a printer driver can shrink the page to fit its margins. Print at 100 percent or actual size, then measure one photo with a ruler to confirm 30 mm really is 30 mm.',
      },
    },
  ],
  'document-scanner': [
    {heading:{id:'Scan beberapa halaman',en:'Scan multiple pages'},body:{id:'Periksa pratinjau, lalu pilih Tambah halaman berikutnya. PDF A4 menyimpan halaman dalam urutan pindai. Untuk JPG, beberapa halaman diunduh bersama sebagai ZIP. Batas sesi adalah 20 halaman dan 64 MB hasil pindai.',en:'Check the preview and choose Add another page. An A4 PDF keeps scan order. Multiple JPG pages download together in a ZIP. A session supports up to 20 pages and 64 MB of scan data.'}},
    {
      heading: { id: 'Cara tepi dokumen dideteksi', en: 'How the page outline is found' },
      body: {
        id: 'Pemindai mencari batas kertas pada keempat sisi. Calon tepi dinilai dari luas halaman dan seberapa utuh garis di setiap sisi. Jika batasnya kurang jelas, geser sudut pada pratinjau sesuai kertas.',
        en: 'The scanner looks for the paper boundary on all four sides. It scores each candidate by page area and how well each edge is defined. If the boundary is unclear, drag the preview handles to the corners of the paper.',
      },
    },
    {
      heading: { id: 'Kenapa hasilnya tegak, bukan miring', en: 'Why the result is squared, not slanted' },
      body: {
        id: 'Setelah keempat sudut diketahui, halaman diproyeksikan ulang dengan transformasi homografi. Setiap piksel hasil dipetakan balik ke foto asli, jadi sudut kertas yang miring menjadi sudut kotak yang tegak. Ukuran hasil mengikuti panjang tepi rata-rata, sehingga detail tetap setajam foto aslinya dan tidak diperbesar dari tebakan.',
        en: 'Once the four corners are known, the page is reprojected with a homography. Each output pixel is mapped back into the original photo, so a slanted paper corner becomes a square corner. The output size follows the average edge length, so detail stays as sharp as the source photo instead of being upscaled from a guess.',
      },
    },
    {
      heading: { id: 'Pencahayaan dan warna', en: 'Lighting and colour' },
      body: {
        id: 'Opsi pencahayaan mencerahkan kertas yang redup dengan penyesuaian yang sama pada setiap kanal warna. Periksa pratinjau untuk memastikan cap dan tanda tangan tetap jelas. Matikan opsi jika ingin mempertahankan pencahayaan sumber.',
        en: 'The lighting option brightens dim paper with the same adjustment on each colour channel. Check the preview for faint stamps and signatures. Turn the option off to keep the source lighting.',
      },
    },
  ],
};
