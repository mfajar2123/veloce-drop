import { siteConfig } from './site-config';
import type { Locale } from './tool-registry';

export type InfoSection = { title: string; body?: string; items?: string[]; copyEmail?: boolean };
export type InfoPage = { lang: Locale; topic: string; title: string; intro: string; sections: InfoSection[] };

export const infoPages: InfoPage[] = [
  { lang: 'id', topic: 'tentang', title: 'Tentang Doculven', intro: 'Doculven membantu menyiapkan foto dan dokumen untuk lamaran, toko online, cetak, serta kebutuhan sehari-hari.', sections: [
    { title: 'Alat yang bisa digunakan', body: 'Kompres foto satu per satu atau massal, ubah ukuran, konversi format, hapus latar potret, tambahkan watermark logo, susun foto ke PDF, ubah PDF ke JPG, kompres PDF, atau siapkan lembar cetak. Format dan batas dijelaskan pada setiap alat.' },
    { title: 'Pemrosesan di perangkat', body: 'Berkas diproses oleh browser pada perangkat Anda. Memuat situs, font, model lokal yang Anda setujui, dan aset publik tetap memakai jaringan. Kami tidak menyediakan akun atau server unggah dalam versi ini.' },
    { title: 'Batas yang perlu diketahui', body: 'Hasil bergantung pada kemampuan browser, memori, format berkas, dan ukuran gambar. Preset dimensi bukan jaminan diterima oleh instansi atau platform. Simpan salinan asli sebelum mengedit.' },
  ] },
  { lang: 'en', topic: 'about', title: 'About Doculven', intro: 'Doculven helps prepare photos and documents for applications, online shops, printing, and everyday tasks.', sections: [
    { title: 'Available tools', body: 'Compress single or multiple photos, resize images, convert formats, remove portrait backgrounds, add logo watermarks, arrange photos into PDFs, convert PDF pages to JPG, compress PDFs, or prepare photo sheets. Each tool explains its formats and limits.' },
    { title: 'Processing on your device', body: 'Your browser processes files on your device. Loading the site, fonts, a local model you approve, and public assets still uses a network connection. This version has no account or file-upload server.' },
    { title: 'Know the limits', body: 'Results depend on browser support, memory, file format, and image dimensions. Size presets do not guarantee acceptance by an institution or platform. Keep an original copy before editing.' },
  ] },
  { lang: 'id', topic: 'bantuan', title: 'Bantuan', intro: 'Format dan batas berbeda menurut alat. Pesan pada halaman alat menunjukkan ketentuan yang berlaku sebelum Anda memilih berkas.', sections: [
    { title: 'Format dan batas', body: 'Kompresi dan resize menerima JPEG, PNG, atau WebP hingga 20 MB; resize juga membatasi hasil dekode hingga 40 megapiksel. Alat PDF, SVG, ICO, dan HEIC memiliki format khusus. Baca label pada alat yang dipilih.' },
    { title: 'Model penghapus latar', body: 'Model potret lokal dimuat otomatis saat halaman alat dibuka, jadi Anda bisa langsung memilih foto. Model dan runtime berukuran sekitar 40,7 MB dan disimpan setelah dimuat, sehingga foto berikutnya tidak mengunduh ulang. Hasil segmentasi dapat memerlukan perbaikan manual.' },
    { title: 'Jika proses gagal', items: ['Pastikan format dan ukuran sesuai batas alat.', 'Coba ekspor ulang gambar sebagai PNG atau JPEG jika header berkas tidak terbaca.', 'Tutup tab berat lain dan coba kembali jika browser kehabisan memori.', 'Muat ulang halaman bila kontrol tidak pulih; hasil dalam sesi aplikasi akan hilang setelah reload.'] },
    { title: 'Saat melaporkan masalah', body: 'Sebutkan browser, sistem operasi, alat, langkah yang dilakukan, dan pesan kesalahan. Jangan sertakan foto identitas, tanda tangan, nama file sensitif, atau dokumen asli.' },
  ] },
  { lang: 'en', topic: 'help', title: 'Help', intro: 'Formats and limits vary by tool. The tool page states its requirements before you choose a file.', sections: [
    { title: 'Formats and limits', body: 'Compression and resize accept JPEG, PNG, or WebP up to 20 MB; resize also limits decoded output to 40 megapixels. PDF, SVG, ICO, and HEIC tools have their own format requirements. Check the selected tool.' },
    { title: 'Background removal model', body: 'The local portrait model loads automatically when the tool page opens, so you can choose a photo right away. The model and runtime total about 40.7 MB and stay loaded, so a second photo does not download them again. Segmentation may need manual touch-up.' },
    { title: 'If processing fails', items: ['Check the selected tool’s format and file-size limit.', 'Try exporting an unreadable image again as PNG or JPEG.', 'Close other memory-heavy tabs and retry if the browser runs low on memory.', 'Reload the page if controls do not recover; in-app session results are cleared on reload.'] },
    { title: 'Reporting a problem', body: 'Include your browser, operating system, tool, steps taken, and error message. Do not attach identity photos, signatures, sensitive filenames, or original documents.' },
  ] },
  { lang: 'id', topic: 'ketentuan', title: 'Ketentuan penggunaan', intro: 'Gunakan alat untuk berkas yang Anda miliki atau berkas yang penggunaannya telah Anda izinkan.', sections: [
    { title: 'Hak dan tanggung jawab', body: 'Anda bertanggung jawab atas hak cipta, izin, persetujuan, dan isi berkas yang diproses. Periksa hasil unduhan sebelum mengirim atau mencetaknya.' },
    { title: 'Batas layanan', body: 'Fitur berjalan di browser dan dapat berbeda menurut perangkat. Kami tidak menjamin setiap berkas dapat dibaca, target byte selalu tercapai, hasil segmentasi sempurna, atau preset sesuai persyaratan pihak lain.' },
    { title: 'Ukuran foto', body: 'Preset foto hanya membantu ukuran awal; verifikasi persyaratan penerima.' },
    { title: 'Salinan berkas', body: 'Simpan sumber asli sebelum mengedit. Unduhan berada di bawah pengaturan browser Anda.' },
  ] },
  { lang: 'en', topic: 'terms', title: 'Terms of use', intro: 'Use Doculven’s image and PDF tools only with files you own or have permission to process. Check rights and review each result before sharing or printing it.', sections: [
    { title: 'Rights and responsibility', body: 'You are responsible for copyright, permission, consent, and the contents of files you process. Review the downloaded result before sending or printing it.' },
    { title: 'Service limits', body: 'Tools run in your browser and may vary by device. We do not guarantee that every file can be read, every byte target will be reached, segmentation will be perfect, or presets will meet another party’s requirements.' },
    { title: 'Photo sizes', body: 'Photo presets provide a starting size; confirm the recipient requirements before using the result.' },
    { title: 'File copies', body: 'Keep an original before editing. Downloads follow your browser settings.' },
  ] },
  { lang: 'id', topic: 'kontak', title: 'Kontak', intro: 'Ada pertanyaan, laporan masalah, atau masukan tentang Doculven? Kirim email ke alamat di bawah ini.', sections: [
    { title: 'Pengelola', body: `${siteConfig.contact.team} · ${siteConfig.contact.region}` },
    { title: 'Email', body: siteConfig.contact.email, copyEmail: true },
    { title: 'Cara menghubungi', body: 'Tulis tujuan Anda pada subjek email. Sertakan nama alat yang dipakai bila Anda melaporkan masalah. Situs ini dikelola perorangan, jadi tidak ada dukungan langsung 24 jam.' },
    { title: 'Informasi yang perlu disertakan', body: 'Sebutkan browser, sistem operasi, nama alat, langkah yang dilakukan, dan pesan kesalahan yang muncul. Tangkapan layar membantu, selama tidak memuat data pribadi.' },
    { title: 'Yang sebaiknya tidak dikirim', body: 'Jangan lampirkan foto identitas, tanda tangan, dokumen asli, atau nama file sensitif. Berkas Anda diproses di perangkat sendiri, jadi kami tidak memerlukannya untuk menelusuri masalah.' },
  ] },
  { lang: 'en', topic: 'contact', title: 'Contact', intro: 'Have a question, a problem to report, or feedback about Doculven? Send an email to the address below.', sections: [
    { title: 'Operator', body: `${siteConfig.contact.team} · ${siteConfig.contact.region}` },
    { title: 'Email', body: siteConfig.contact.email, copyEmail: true },
    { title: 'How to reach us', body: 'State your purpose in the subject line. Mention the tool you were using if you are reporting a problem. The site is run by one person, so there is no live 24-hour support.' },
    { title: 'What to include', body: 'Include your browser, operating system, tool name, steps taken, and the error message shown. A screenshot helps, as long as it contains no personal data.' },
    { title: 'What not to send', body: 'Do not attach identity photos, signatures, original documents, or sensitive filenames. Your files are processed on your own device, so we do not need them to investigate a problem.' },
  ] },
];
