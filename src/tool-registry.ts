export type Locale = 'id' | 'en';
type Text = Record<Locale, string>;
export type ToolCategory = 'compression' | 'resize' | 'conversion' | 'documents' | 'background' | 'watermark' | 'print';
export type ToolFaq = { question: Text; answer: Text };
export type CatalogTool = {
  id: string;
  name: Text;
  description: Text;
  path: Text;
  keywords: string;
  packages: string[];
  category?: ToolCategory;
  engine?: string;
  seo?: { title: Text; description: Text };
  faq?: ToolFaq[];
  nextSteps?: Array<{ path: Text; label: Text }>;
  presetKey?: string;
  targetKB?: number;
  inputFormat?: string;
  outputFormat?: string;
};

const localized = (id: string, en: string): Text => ({ id: `/id/${id}/`, en: `/en/${en}/` });

export const catalog: CatalogTool[] = [
  {
    id: 'compress-image',
    name: { id: 'Kompres foto', en: 'Compress image' },
    description: { id: 'Atur batas ukuran dan format JPEG atau WebP', en: 'Set a file-size target and choose JPEG or WebP' },
    path: localized('kompres-foto', 'compress-image'),
    keywords: 'jpg jpeg png webp kompres compression file size kecil kb mb',
    packages: ['applicant', 'seller', 'social'],
    targetKB: 200,
  },
  {
    id: 'batch',
    name: { id: 'Kompres foto massal', en: 'Batch image compression' },
    description: { id: 'Kompres banyak foto dan unduh satu ZIP', en: 'Compress multiple images and download one ZIP' },
    path: localized('kompres-foto-massal', 'batch-compress-images'),
    keywords: 'bulk batch banyak jpg jpeg webp ukuran produk seller',
    packages: ['seller', 'social'],
  },
  {
    id: 'resize-image',
    name: { id: 'Ubah ukuran dan crop gambar', en: 'Resize and crop images' },
    description: { id: 'Atur dimensi atau pilih ukuran foto yang umum', en: 'Set dimensions or choose a common photo size' },
    path: localized('ukuran/ubah-ukuran-gambar', 'resize-image'),
    keywords: 'resize image foto gambar crop passport pas foto instagram story square marketplace pixels dpi',
    packages: ['applicant', 'seller', 'social'],
    presetKey: '3x4',
  },
  {
    id: 'image-converter',
    name: { id: 'Konversi format gambar', en: 'Convert image formats' },
    description: { id: 'Konversi JPEG, PNG, WebP, HEIC, SVG, dan ICO di browser', en: 'Convert JPEG, PNG, WebP, HEIC, SVG, and ICO in your browser' },
    path: localized('konversi/gambar', 'convert-image'),
    keywords: 'jpg jpeg png webp heic heif svg ico convert converter konversi format iphone',
    packages: ['applicant', 'seller', 'social'],
  },
  {
    id: 'background',
    name: { id: 'Hapus latar gambar', en: 'Remove image background' },
    description: { id: 'Hapus latar potret secara lokal dan perbaiki mask', en: 'Remove a portrait background locally and refine the mask' },
    path: localized('hapus-latar', 'remove-background'),
    keywords: 'background remove remover hapus latar belakang foto portrait transparan transparent',
    packages: ['applicant', 'seller', 'social'],
  },
  {
    id: 'logo-watermark',
    name: { id: 'Tambah watermark logo', en: 'Add a logo watermark' },
    description: { id: 'Terapkan logo ke banyak foto sekaligus', en: 'Apply a logo to multiple photos at once' },
    path: localized('watermark-logo-massal', 'watermark-logo'),
    keywords: 'logo watermark batch massal produk product toko umkm',
    packages: ['seller', 'social'],
  },
  {
    id: 'photo-pdf',
    name: { id: 'Gabungkan foto ke PDF', en: 'Combine photos into a PDF' },
    description: { id: 'Susun beberapa gambar dan pilih ukuran kertas', en: 'Arrange multiple images and choose a paper size' },
    path: localized('foto-ke-pdf', 'photos-to-pdf'),
    keywords: 'jpg jpeg png webp pdf dokumen document scan gabung combine image to pdf',
    packages: ['applicant', 'seller'],
  },
  {
    id: 'pdf-jpg',
    name: { id: 'Ubah PDF ke JPG', en: 'Convert PDF to JPG' },
    description: { id: 'Pilih halaman dan unduh sebagai gambar', en: 'Select pages and download them as images' },
    path: localized('pdf-ke-jpg', 'pdf-to-jpg'),
    keywords: 'pdf jpg jpeg convert konversi gambar image pages',
    packages: ['applicant', 'seller'],
  },
  {
    id: 'pdf-500kb',
    name: { id: 'Kompres PDF', en: 'Compress PDF' },
    description: { id: 'Atur batas ukuran; halaman dirasterkan secara lokal', en: 'Set a file-size limit; pages are rasterized locally' },
    path: localized('kompres-pdf/500kb', 'compress-pdf/500kb'),
    keywords: 'pdf compress kompres ukuran size dokumen document',
    packages: ['applicant', 'seller'],
    targetKB: 500,
  },
  {
    id: 'print',
    name: { id: 'Cetak lembar foto', en: 'Print photo sheets' },
    description: { id: 'Susun beberapa foto pada kertas 4R atau A4', en: 'Arrange multiple photos on 4R or A4 paper' },
    path: localized('cetak-foto', 'print-photo-sheet'),
    keywords: 'print cetak foto photo 4r a4 pas foto passport',
    packages: ['applicant'],
  },
];

for (const tool of catalog) {
  if (tool.id === 'resize-image') tool.category = 'resize';
  else if (tool.id === 'background') tool.category = 'background';
  else if (tool.id === 'logo-watermark') tool.category = 'watermark';
  else if (tool.id === 'photo-pdf' || tool.id === 'pdf-jpg' || tool.id.startsWith('pdf-')) tool.category = 'documents';
  else if (tool.id === 'print') tool.category = 'print';
  else if (tool.id === 'image-converter') tool.category = 'conversion';
  else tool.category = 'compression';

  tool.engine = tool.category === 'background' ? 'local-onnx-worker'
    : tool.category === 'documents' ? 'local-pdf'
      : tool.category === 'compression' ? 'browser-image-encoder'
        : tool.category === 'resize' ? 'browser-canvas'
          : tool.category === 'watermark' ? 'browser-canvas-and-zip'
            : tool.category === 'print' ? 'local-pdf-layout'
              : 'local-format-converter';

  const seoCopy: Record<string, { title: Text; description: Text }> = {
    'compress-image': {
      title: { id: 'Kompres Foto Online hingga 200 KB', en: 'Compress Images Online to 200 KB' },
      description: { id: 'Kompres JPG, PNG, atau WebP ke ukuran yang ditargetkan. Atur kualitas dan unduh langsung dari browser.', en: 'Compress JPG, PNG, or WebP to a target file size. Adjust quality and download directly from your browser.' },
    },
    batch: {
      title: { id: 'Kompres Banyak Foto Sekaligus', en: 'Batch Image Compressor Online' },
      description: { id: 'Kecilkan ukuran banyak foto sekaligus, atur target, lalu unduh hasilnya dalam satu file ZIP.', en: 'Reduce the size of multiple images at once, set a target, and download the results in one ZIP.' },
    },
    'resize-image': {
      title: { id: 'Ubah Ukuran Foto dan Crop Online', en: 'Resize and Crop Images Online' },
      description: { id: 'Ubah dimensi foto atau crop ke ukuran pas foto, 3×4, 4×6, Instagram, dan kebutuhan cetak.', en: 'Resize photos or crop to passport, 3×4, 4×6, Instagram, and print dimensions.' },
    },
    'image-converter': {
      title: { id: 'Konverter JPG, PNG, WebP, HEIC Online', en: 'JPG, PNG, WebP and HEIC Converter' },
      description: { id: 'Konversi format foto JPG, PNG, WebP, HEIC, SVG, atau ICO langsung di browser.', en: 'Convert JPG, PNG, WebP, HEIC, SVG, or ICO images directly in your browser.' },
    },
    background: {
      title: { id: 'Hapus Background Foto Online', en: 'Remove Image Background Online' },
      description: { id: 'Hapus latar belakang potret secara lokal, periksa hasilnya, dan rapikan mask sebelum mengunduh.', en: 'Remove a portrait background locally, inspect the result, and refine the mask before downloading.' },
    },
    'logo-watermark': {
      title: { id: 'Tambah Watermark Logo ke Banyak Foto', en: 'Add a Logo Watermark to Images' },
      description: { id: 'Pasang logo sebagai watermark pada banyak foto sekaligus. Atur posisi, ukuran, margin, dan opasitas.', en: 'Add a logo watermark to multiple photos at once. Set its position, size, margin, and opacity.' },
    },
    'photo-pdf': {
      title: { id: 'Gabungkan Foto Menjadi PDF Online', en: 'Combine Photos into a PDF Online' },
      description: { id: 'Susun beberapa foto JPG, PNG, atau WebP menjadi PDF. Pilih urutan, ukuran kertas, dan margin.', en: 'Arrange JPG, PNG, or WebP photos into a PDF. Choose page order, paper size, and margins.' },
    },
    'pdf-jpg': {
      title: { id: 'Konversi PDF ke JPG per Halaman', en: 'Convert PDF Pages to JPG Images' },
      description: { id: 'Pilih halaman PDF, atur resolusi, lalu unduh halaman terpilih sebagai gambar JPG.', en: 'Select PDF pages, set resolution, and download the chosen pages as JPG images.' },
    },
    'pdf-500kb': {
      title: { id: 'Kompres PDF hingga 500 KB', en: 'Compress PDF to 500 KB' },
      description: { id: 'Atur target ukuran PDF hingga 500 KB. Halaman dirasterkan secara lokal; tinjau batas kualitas sebelum ekspor.', en: 'Set a PDF size target up to 500 KB. Pages are rasterized locally; review the quality tradeoff before export.' },
    },
    print: {
      title: { id: 'Buat Lembar Cetak Foto 4R dan A4', en: 'Create 4R and A4 Photo Print Sheets' },
      description: { id: 'Susun beberapa foto dalam lembar cetak ukuran 4R atau A4, lalu unduh sebagai PDF.', en: 'Arrange multiple photos on a 4R or A4 print sheet, then download it as a PDF.' },
    },
  };
  tool.seo = seoCopy[tool.id];
  const faqCopy: Record<string, ToolFaq[]> = {
    'compress-image': [
      { question: { id: 'Mengapa hasil kompresi belum mencapai target KB?', en: 'Why is the compressed image still above my KB target?' }, answer: { id: 'Target bergantung pada detail gambar dan format keluaran. Jika ukuran terkecil pada kualitas yang tersedia masih terlalu besar, alat memberi tahu bahwa target belum tercapai; Anda bisa mencoba WebP atau memakai alat resize untuk mengurangi dimensi.', en: 'The target depends on image detail and output format. If the smallest result at the available quality is still too large, the tool reports that the target was not met. Try WebP or use the resize tool to reduce dimensions.' } },
      { question: { id: 'Apakah kompres foto mengubah resolusi atau transparansi?', en: 'Does compression change image dimensions or transparency?' }, answer: { id: 'Resolusi tetap sama kecuali Anda menyetujui tawaran pengurangan dimensi. JPEG mengisi area transparan dengan putih; WebP dapat mempertahankannya. Pengodean ulang menghapus metadata.', en: 'Dimensions stay the same unless you approve the offered reduction. JPEG fills transparent areas with white; WebP can retain them. Re-encoding removes metadata.' } },
    ],
    batch: [
      { question: { id: 'Berapa banyak foto yang bisa dikompres sekaligus?', en: 'How many images can I compress at once?' }, answer: { id: 'Antrean menerima hingga 25 gambar JPEG, PNG, atau WebP, maksimal 20 MB per gambar dan 100 MB total. Hasil yang berhasil dapat diunduh bersama sebagai ZIP.', en: 'The queue accepts up to 25 JPEG, PNG, or WebP images, with a 20 MB per-image limit and 100 MB total. Successful results can be downloaded together as a ZIP.' } },
      { question: { id: 'Apakah ukuran target pasti tercapai untuk setiap foto?', en: 'Will every image meet its target size?' }, answer: { id: 'Tidak selalu. Target berlaku per gambar; detail, dimensi, dan kualitas minimum yang dipilih memengaruhi ukuran akhir. Hasil yang gagal diproses ditandai sendiri dan tidak menghalangi unduhan hasil lain yang berhasil.', en: 'Not always. The target applies to each image, and detail, dimensions, and the chosen minimum quality affect the final size. Failed items are identified separately and do not prevent downloading other successful results.' } },
    ],
    'resize-image': [
      { question: { id: 'Ukuran pas foto apa yang tersedia?', en: 'Which photo sizes are available?' }, answer: { id: 'Preset mencakup 2×3, 3×4, dan 4×6 cm, paspor 2×2 inci, 4R, A4, persegi marketplace, Instagram Story dan Feed, WhatsApp, serta banner YouTube. Anda juga dapat memasukkan dimensi sendiri.', en: 'Presets include 2×3, 3×4, and 4×6 cm, 2×2 inch passport, 4R, A4, marketplace square, Instagram Story and Feed, WhatsApp, and YouTube banner. You can also enter custom dimensions.' } },
      { question: { id: 'Apakah preset menjamin foto sesuai aturan instansi?', en: 'Do the presets guarantee compliance with official photo rules?' }, answer: { id: 'Tidak. Preset mengatur rasio dan dimensi piksel, tetapi tidak memeriksa latar, pose, atau ketentuan instansi. Periksa hasil crop dan panduan penerima sebelum digunakan.', en: 'No. A preset sets the aspect ratio and pixel dimensions, but does not check background, pose, or official requirements. Review the crop and the recipient’s rules before using the image.' } },
    ],
    'image-converter': [
      { question: { id: 'Format apa yang bisa dikonversi?', en: 'Which formats can I convert?' }, answer: { id: 'Konverter mendukung JPEG, PNG, WebP, HEIC/HEIF, SVG, dan ICO sesuai pilihan alat. SVG dirasterkan menjadi PNG; berkas SVG dengan script, sumber luar, atau fitur yang tidak didukung akan ditolak.', en: 'The converter supports JPEG, PNG, WebP, HEIC/HEIF, SVG, and ICO as offered in the tool. SVG is rasterized to PNG; SVG files with scripts, external resources, or unsupported features are rejected.' } },
      { question: { id: 'Apakah format JPEG mempertahankan transparansi?', en: 'Does JPEG keep transparent areas?' }, answer: { id: 'Tidak. Pilih warna latar untuk mengisi area transparan saat membuat JPEG. Gunakan PNG atau WebP jika transparansi perlu dipertahankan; hasil juga bergantung pada dukungan encoder browser.', en: 'No. Choose a background color to fill transparent areas when making a JPEG. Use PNG or WebP when transparency must remain; output also depends on browser encoder support.' } },
    ],
    background: [
      { question: { id: 'Foto seperti apa yang paling mudah dihapus latarnya?', en: 'Which images work best for background removal?' }, answer: { id: 'Potret dengan subjek dan latar yang cukup berbeda biasanya lebih mudah diproses. Rambut, kacamata, tepi produk, dan warna yang menyatu dengan latar mungkin memerlukan perbaikan mask manual.', en: 'Portraits with clear separation between subject and background are usually easier to process. Hair, glasses, product edges, and colors that blend into the background may need manual mask refinement.' } },
      { question: { id: 'Apakah foto diunggah untuk menghapus latar?', en: 'Is my photo uploaded for background removal?' }, answer: { id: 'Tidak. Inferensi gambar berjalan di perangkat melalui worker lokal. Model pemrosesan dimuat otomatis dari aset situs saat halaman dibuka, jadi proses pertama mungkin menunggu unduhan model dan membutuhkan memori perangkat.', en: 'No. Image inference runs on your device through a local worker. The processing model loads automatically from site assets when the page opens, so the first run may wait for the model download and needs device memory.' } },
    ],
    'logo-watermark': [
      { question: { id: 'Berapa foto yang dapat diberi watermark sekaligus?', en: 'How many images can receive a watermark at once?' }, answer: { id: 'Maksimal 25 foto JPEG, PNG, atau WebP; 20 MB dan 20 megapiksel per foto, dengan total masukan 100 MB. Logo dibatasi 5 MB dan 4 megapiksel, dan hasil diekspor sebagai PNG dalam ZIP.', en: 'Up to 25 JPEG, PNG, or WebP photos are accepted, at 20 MB and 20 megapixels each with 100 MB total input. The logo limit is 5 MB and 4 megapixels; outputs are PNG files in a ZIP.' } },
      { question: { id: 'Bagaimana mengatur posisi dan ukuran logo?', en: 'How do I position and size the logo?' }, answer: { id: 'Pilih satu dari lima posisi, lalu atur lebar relatif 5–50%, margin 0–25%, dan opasitas 10–100%. Watermark dapat dihapus dan tidak menggantikan perlindungan hak cipta.', en: 'Choose one of five positions, then set relative width from 5–50%, margin from 0–25%, and opacity from 10–100%. A watermark can be removed and does not replace copyright protection.' } },
    ],
    'photo-pdf': [
      { question: { id: 'Bagaimana foto disusun di dalam PDF?', en: 'How are photos arranged in the PDF?' }, answer: { id: 'Setiap gambar menjadi satu halaman dan diletakkan di tengah. Urutan antrean, orientasi, ukuran kertas, dan margin dapat diatur sebelum PDF dibuat.', en: 'Each image becomes one centered page. Queue order, orientation, paper size, and margins can be adjusted before creating the PDF.' } },
      { question: { id: 'Berapa batas foto untuk satu PDF?', en: 'What are the limits for one PDF?' }, answer: { id: 'Maksimal 20 gambar JPEG, PNG, atau WebP; masing-masing 20 MB dan 20 megapiksel, dengan total masukan 100 MB. Anda dapat memilih ukuran halaman dari gambar, A4, F4, atau Letter.', en: 'Up to 20 JPEG, PNG, or WebP images are accepted, at 20 MB and 20 megapixels each with 100 MB total input. Page size can follow the image or use A4, F4, or Letter.' } },
    ],
    'pdf-jpg': [
      { question: { id: 'Bisakah saya mengubah halaman tertentu saja?', en: 'Can I convert only selected pages?' }, answer: { id: 'Ya. Masukkan nomor halaman atau rentang, misalnya 1,3-5. Kosongkan kolom untuk memilih semua halaman; PDF dibatasi 20 MB dan 30 halaman.', en: 'Yes. Enter page numbers or ranges, such as 1,3-5. Leave the field empty to select all pages. PDFs are limited to 20 MB and 30 pages.' } },
      { question: { id: 'Apa yang dilakukan pengaturan DPI?', en: 'What does the DPI setting change?' }, answer: { id: 'Pilih 72, 144, atau 200 DPI untuk mengatur resolusi raster JPG. Resolusi yang lebih tinggi membutuhkan lebih banyak memori dan dapat melewati batas 16 megapiksel per halaman; anotasi dan elemen interaktif tidak dirender.', en: 'Choose 72, 144, or 200 DPI to set the JPG raster resolution. Higher resolution uses more memory and can exceed the 16-megapixel per-page limit; annotations and interactive elements are not rendered.' } },
    ],
    'pdf-500kb': [
      { question: { id: 'Mengapa teks PDF hasil kompresi tidak bisa dipilih?', en: 'Why can’t I select text in the compressed PDF?' }, answer: { id: 'Halaman dirasterkan menjadi gambar untuk mengurangi ukuran, sehingga teks tidak lagi menjadi teks PDF yang dapat dicari atau dipilih. Simpan salinan asli jika Anda memerlukan teks yang dapat ditelusuri.', en: 'Pages are rasterized into images to reduce size, so text is no longer searchable or selectable PDF text. Keep the original if you need searchable text.' } },
      { question: { id: 'Apakah target 500 KB selalu tercapai?', en: 'Will the 500 KB target always be reached?' }, answer: { id: 'Tidak. Hasil bergantung pada jumlah halaman, konten, resolusi, dan kualitas. Jika ukuran terkecil pada pengaturan tersebut masih melebihi target, alat menampilkan bahwa target belum tercapai; coba target lebih besar atau DPI lebih rendah.', en: 'No. The result depends on page count, content, resolution, and quality. If the smallest result at those settings is still over target, the tool reports that it was not met; try a larger target or lower DPI.' } },
    ],
    print: [
      { question: { id: 'Berapa pas foto yang muat dalam satu lembar?', en: 'How many passport photos fit on one sheet?' }, answer: { id: 'Jumlah dihitung dari ukuran kertas 4R atau A4, ukuran foto 2×3, 3×4, atau 4×6 cm, margin, jarak, dan orientasi yang dipilih. Kapasitas yang tersedia ditampilkan sebelum ekspor.', en: 'Capacity is calculated from the selected 4R or A4 paper, 2×3, 3×4, or 4×6 cm photo size, margins, spacing, and orientation. The available count is shown before export.' } },
      { question: { id: 'Apakah ukuran cetak pasti akurat di printer saya?', en: 'Will the print size be exact on my printer?' }, answer: { id: 'PDF memakai ukuran halaman fisik, tetapi driver printer dapat menambahkan margin atau mengecilkan halaman. Cetak pada skala 100% dan periksa pengaturan printer; aplikasi tidak memverifikasi aturan resmi foto.', en: 'The PDF uses physical page dimensions, but printer drivers may add margins or scale the page down. Print at 100% and check printer settings; the tool does not verify official photo requirements.' } },
    ],
  };
  tool.faq = faqCopy[tool.id];
}

const nextToolIds: Record<string, string[]> = {
  'compress-image': ['resize-image', 'photo-pdf'],
  batch: ['logo-watermark', 'photo-pdf'],
  'resize-image': ['compress-image', 'print'],
  'image-converter': ['resize-image', 'compress-image'],
  background: ['resize-image', 'print'],
  'logo-watermark': ['resize-image', 'photo-pdf'],
  'photo-pdf': ['pdf-jpg', 'pdf-500kb'],
  'pdf-jpg': ['photo-pdf', 'compress-image'],
  'pdf-500kb': ['photo-pdf', 'pdf-jpg'],
  print: ['resize-image', 'photo-pdf'],
};

for (const tool of catalog) {
  tool.nextSteps = (nextToolIds[tool.id] ?? ['compress-image'])
    .map(id => catalog.find(candidate => candidate.id === id))
    .filter((candidate): candidate is CatalogTool => Boolean(candidate))
    .map(candidate => ({ path: candidate.path, label: candidate.name }));
}
