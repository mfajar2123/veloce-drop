import { useEffect, useState } from 'react';
import { encodeIco, type IcoFrame } from '../engines/ico';
import {readImageBlobHeader} from '../engines/image-header';

type Result = { url: string; preview: string; bytes: number; frames: number[] };
const sizes = [16, 32, 48, 64, 128, 256];
const maxBytes = 20_000_000;
const maxPixels = 40_000_000;

export default function IconConverter({ lang }: { lang: string }) {
  const en = lang === 'en';
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');
  useEffect(() => () => { if (result) { URL.revokeObjectURL(result.url); URL.revokeObjectURL(result.preview); } }, [result]);
  function choose(next?: File) { setFile(next ?? null); setError(''); setResult(null); }

  async function convert() {
    if (!file || busy) return;
    setBusy(true); setError(''); setResult(null); setProgress(en ? 'Preparing image…' : 'Menyiapkan gambar…');
    let bitmap: ImageBitmap | undefined;
    try {
      if (file.size > maxBytes) throw new Error(en ? 'File exceeds 20 MB.' : 'Berkas melebihi 20 MB.');
      const header = await readImageBlobHeader(file);
      if (!header) throw new Error(en ? 'Choose a valid JPEG, PNG or WebP image.' : 'Pilih gambar JPEG, PNG, atau WebP yang valid.');
      if (header.width * header.height > maxPixels) throw new Error(en ? 'Image exceeds 40 megapixels.' : 'Gambar melebihi 40 megapiksel.');
      bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
      if (bitmap.width * bitmap.height > maxPixels) throw new Error(en ? 'Image exceeds 40 megapixels.' : 'Gambar melebihi 40 megapiksel.');
      const frames: IcoFrame[] = [];
      let previewBlob: Blob | undefined;
      for (const [index, size] of sizes.entries()) {
        const canvas = document.createElement('canvas'); canvas.width = size; canvas.height = size;
        const context = canvas.getContext('2d'); if (!context) throw new Error('canvas');
        const scale = Math.min(size / bitmap.width, size / bitmap.height);
        const width = Math.max(1, bitmap.width * scale), height = Math.max(1, bitmap.height * scale);
        context.drawImage(bitmap, (size - width) / 2, (size - height) / 2, width, height);
        const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value?.type === 'image/png' ? resolve(value) : reject(new Error('encoder')), 'image/png'));
        frames.push({ size, png: new Uint8Array(await blob.arrayBuffer()) });
        if (size === 256) previewBlob = blob;
        canvas.width = 0; canvas.height = 0;
        setProgress(`${index + 1}/${sizes.length} · ${size} px`);
      }
      if (!previewBlob) throw new Error('encoder');
      const blob = encodeIco(frames);
      setResult({ url: URL.createObjectURL(blob), preview: URL.createObjectURL(previewBlob), bytes: blob.size, frames: sizes });
    } catch (cause) {
      const code = cause instanceof Error ? cause.message : '';
      setError(code === 'canvas' || code === 'encoder' ? (en ? 'This browser could not create the icon.' : 'Browser ini tidak dapat membuat ikon.') : (cause instanceof Error ? cause.message : (en ? 'Could not read this image.' : 'Gambar tidak dapat dibaca.')));
    } finally { bitmap?.close(); setBusy(false); }
  }

  return <section className="panel">
    <p className="local">{en ? 'Processed on your device. Files are not sent for processing.' : 'Diproses di perangkat Anda. Berkas tidak dikirim untuk pemrosesan.'}</p>
    <label>{en ? 'Choose a JPEG, PNG or WebP image (up to 20 MB)' : 'Pilih gambar JPEG, PNG, atau WebP (maks. 20 MB)'} <input type="file" accept="image/jpeg,image/png,image/webp" onChange={event => choose(event.target.files?.[0])}/></label>
    <p className="notice">{en ? 'Creates a valid ICO directory with six square PNG images: 16, 32, 48, 64, 128 and 256 px. Images keep their aspect ratio and transparency; empty space is transparent.' : 'Membuat direktori ICO valid dengan enam PNG persegi: 16, 32, 48, 64, 128, dan 256 px. Rasio dan transparansi gambar dipertahankan; ruang kosong tetap transparan.'}</p>
    <div className="controls"><button className="button" disabled={!file || busy} onClick={() => void convert()}>{busy ? (en ? 'Creating icon…' : 'Membuat ikon…') : (en ? 'Create ICO' : 'Buat ICO')}</button></div>
    {busy && <p aria-live="polite">{progress}</p>}
    {error && <p className="error" role="alert">{error}</p>}
    {result && <div className="result" aria-live="polite"><p>{result.frames.join(', ')} px · ICO · {result.bytes.toLocaleString(en ? 'en' : 'id')} bytes</p><img src={result.preview} alt={en ? 'Largest icon image preview' : 'Pratinjau ukuran ikon terbesar'} width="256" height="256" style={{ width: 'min(256px, 100%)', height: 'auto', imageRendering: 'pixelated', background: '#e2e8f0' }}/><p><a className="button download" href={result.url} download="converted.ico">{en ? 'Download ICO' : 'Unduh ICO'}</a></p></div>}
  </section>;
}
