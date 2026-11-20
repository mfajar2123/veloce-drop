import { withDocuments } from './DocumentWorkspace';
import { useEffect, useState } from 'react';
import { takeSessionFile } from '../engines/session-files';
import WorkflowActions from './WorkflowActions';
import { readImageHeader } from '../engines/image-header';
import { toolHref } from '../tool-links';

type Result = { url: string; blob: Blob; size: number; width: number; height: number; type: string; met: boolean; resized: boolean };
const limit = 20_000_000;

function Compressor({ lang, initialTarget = 200 }: { lang: string; initialTarget?: number }) {
  const en = lang === 'en';
  const [file, setFile] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const [target, setTarget] = useState(initialTarget);
  const [format, setFormat] = useState('image/jpeg');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [split, setSplit] = useState(50);
  useEffect(() => () => { if (result) URL.revokeObjectURL(result.url); }, [result]);
  useEffect(() => () => { if (sourceUrl) URL.revokeObjectURL(sourceUrl); }, [sourceUrl]);
  useEffect(() => {
    const incoming = takeSessionFile(location.pathname);
    if (incoming) { choose(incoming); return; }
    if (new URLSearchParams(location.search).get('example') !== 'workspace') return;
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch('/images/landing-workspace-sample.webp', { credentials: 'same-origin' });
        if (!response.ok) throw new Error('sample-unavailable');
        const blob = await response.blob();
        if (blob.type !== 'image/webp' || blob.size > limit) throw new Error('sample-invalid');
        if (!cancelled) choose(new File([blob], 'doculven.webp', { type: blob.type }));
      } catch {
        if (!cancelled) setError(en ? 'The example could not be loaded. Choose an image to continue.' : 'Foto contoh tidak dapat dimuat. Pilih gambar untuk melanjutkan.');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  function clearResult() { setResult(null); setSplit(50); }
  function choose(next?: File) {
    clearResult(); setError(''); setFile(next ?? null);
    setSourceUrl(previous => { if (previous) URL.revokeObjectURL(previous); return next ? URL.createObjectURL(next) : ''; });
  }

  async function process(allowResize = false) {
    if (!file || busy) return;
    setError(''); clearResult(); setBusy(true);
    let bitmap: ImageBitmap | undefined;
    try {
      if (file.size > limit) throw new Error(en ? 'The file exceeds 20 MB.' : 'Berkas melebihi 20 MB.');
      if (!Number.isFinite(target) || target < 1 || target > 20000) throw new Error(en ? 'Enter a target between 1 and 20,000 KB.' : 'Masukkan target antara 1 dan 20.000 KB.');
      const header = readImageHeader(new Uint8Array(await file.slice(0, 1_048_576).arrayBuffer()));
      if (!header) throw new Error(en ? 'Choose a valid JPEG, PNG or WebP image.' : 'Pilih gambar JPEG, PNG, atau WebP yang valid.');
      if (header.width * header.height > 40_000_000) throw new Error(en ? 'Image exceeds the 40 megapixel limit.' : 'Gambar melebihi batas 40 megapiksel.');
      bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
      if (bitmap.width * bitmap.height > 40_000_000) throw new Error(en ? 'Image exceeds the 40 megapixel limit.' : 'Gambar melebihi batas 40 megapiksel.');

      let best: { blob: Blob; width: number; height: number; met: boolean } | undefined;
      const attempts = allowResize ? 10 : 1;
      for (let attempt = 0; attempt < attempts; attempt++) {
        const scale = allowResize ? Math.pow(0.85, attempt) : 1;
        const width = Math.max(1, Math.round(bitmap.width * scale));
        const height = Math.max(1, Math.round(bitmap.height * scale));
        if (allowResize && (width < 96 || height < 96)) break;
        const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('Canvas unavailable');
        if (format === 'image/jpeg') { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, width, height); }
        ctx.drawImage(bitmap, 0, 0, width, height);
        const encode = (quality: number) => new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => blob && blob.type === format ? resolve(blob) : reject(new Error(en ? 'This browser cannot encode the selected format.' : 'Browser ini tidak dapat membuat format yang dipilih.')), format, quality));
        let smallest: Blob | undefined;
        let meeting: Blob | undefined;
        const qualities = [0.1, 0.25, 0.4, 0.55, 0.7, 0.85, 1];
        for (const quality of qualities) {
          const blob = await encode(quality);
          if (!smallest || blob.size < smallest.size) smallest = blob;
          if (blob.size <= target * 1000 && (!meeting || blob.size > meeting.size)) meeting = blob;
        }
        const candidate = meeting ?? smallest!;
        if (meeting) { best = { blob: candidate, width, height, met: true }; break; }
        if (!best || candidate.size < best.blob.size) best = { blob: candidate, width, height, met: false };
        canvas.width = 0; canvas.height = 0;
      }
      if (!best) throw new Error(en ? 'No usable output could be created.' : 'Tidak ada hasil yang dapat dibuat.');
      setResult({ url: URL.createObjectURL(best.blob), blob: best.blob, size: best.blob.size, width: best.width, height: best.height, type: format, met: best.met, resized: best.width !== bitmap.width || best.height !== bitmap.height });
    } catch (err) { setError(err instanceof Error ? err.message : (en ? 'Could not read this image.' : 'Gambar tidak dapat dibaca.')); }
    finally { bitmap?.close(); setBusy(false); }
  }

  const size = (n: number) => new Intl.NumberFormat(en ? 'en' : 'id', { maximumFractionDigits: 1 }).format(n / 1000) + ' KB';

  return <div className="panel"><p className="local">{en ? 'Processed on your device. Files are not sent to a server for processing.' : 'Diproses di perangkat Anda. Berkas tidak dikirim untuk pemrosesan ke server.'}</p><div className="drop" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); choose(e.dataTransfer.files[0]); }}><p><strong>{en ? 'Drop an image here or choose a file' : 'Tarik gambar ke sini atau pilih berkas'}</strong></p><p className="notice">JPEG, PNG, WebP · {en ? 'Up to 20 MB and 40 megapixels' : 'Maksimal 20 MB dan 40 megapiksel'}</p><input aria-label={en ? 'Choose image' : 'Pilih gambar'} type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={e => choose(e.target.files?.[0])}/></div>{file && <p>{file.name} · {size(file.size)}</p>}<div className="controls"><label>{en ? 'Target (KB)' : 'Target (KB)'}<input type="number" min="1" max="20000" value={target} onChange={e => { clearResult(); setTarget(Number(e.target.value)); }}/></label><label>{en ? 'Output format' : 'Format hasil'}<select value={format} onChange={e => { clearResult(); setFormat(e.target.value); }}><option value="image/jpeg">JPEG</option><option value="image/webp">WebP</option></select></label><button className="button" disabled={!file || busy} onClick={() => void process()}>{busy ? (en ? 'Processing…' : 'Memproses…') : (en ? 'Compress image' : 'Kompres gambar')}</button></div><p className="notice">{en ? '1 KB = 1,000 bytes. JPEG uses a white background for transparency. Resolution is not changed unless you choose the resize option. Re-encoding removes metadata.' : '1 KB = 1.000 byte. JPEG memakai latar putih untuk transparansi. Resolusi tidak berubah kecuali Anda memilih resize. Pengodean ulang menghapus metadata.'}</p><div aria-live="polite">{error && <p className="error" role="alert">{error}</p>}{result && <div className="result"><h2>{result.met ? (en ? 'Your image is ready' : 'Gambar siap diunduh') : (en ? 'Target not reached' : 'Target belum tercapai')}</h2><p>{result.met ? (result.resized ? (en ? 'Target reached after reducing dimensions with your approval.' : 'Target tercapai setelah dimensi dikurangi atas persetujuan Anda.') : (en ? 'The result meets your target.' : 'Hasil memenuhi target Anda.')) : (en ? 'This is the smallest result found at the current dimensions.' : 'Ini hasil terkecil pada dimensi saat ini.')}</p><p>{result.width} × {result.height} px · {result.type === 'image/jpeg' ? 'JPEG' : 'WebP'} · {size(result.size)} ({result.size.toLocaleString(en ? 'en' : 'id')} bytes)</p>
    {sourceUrl && <section className="compression-compare" aria-label={en ? 'Before and after comparison' : 'Perbandingan sebelum dan sesudah'}>
      <div className="compression-compare-stage" style={{ aspectRatio: `${result.width} / ${result.height}` }}>
        <img src={result.url} alt={en ? 'Compressed image' : 'Gambar terkompresi'} draggable={false}/>
        <img src={sourceUrl} alt={en ? 'Original image' : 'Gambar asli'} style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }} draggable={false}/>
        <span className="compression-compare-divider" style={{ left: `${split}%` }} aria-hidden="true"/>
        <span className="compression-compare-label before">{en ? 'Before' : 'Sebelum'}</span>
        <span className="compression-compare-label after">{en ? 'After' : 'Sesudah'}</span>
      </div>
      <label className="comparison-slider">{en ? 'Comparison split' : 'Pemisah perbandingan'}
        <input type="range" min="0" max="100" value={split} onChange={e => setSplit(Number(e.target.value))}/>
      </label>
    </section>}
    {!result.met && <p><button className="button secondary" disabled={busy} onClick={() => void process(true)}>{en ? 'Try smaller dimensions' : 'Coba perkecil dimensi'}</button> <span className="notice">{en ? 'This changes resolution. The current full-size result stays available until you choose this option.' : 'Opsi ini mengubah resolusi. Hasil ukuran penuh tetap tersedia sampai Anda memilihnya.'}</span></p>}
    <p><a className="button download" href={result.url} download={`doculven.${result.type === 'image/jpeg' ? 'jpg' : 'webp'}`}>{en ? 'Download image' : 'Unduh gambar'}</a></p><WorkflowActions lang={lang} blob={result.blob} width={result.width} height={result.height} steps={[{path:toolHref('photo-pdf',lang as 'id'|'en'),id:'Masukkan ke PDF',en:'Add to a PDF'},{path:toolHref('resize-image',lang as 'id'|'en'),id:'Ubah ukuran gambar',en:'Resize image'}]}/></div>}</div></div>;
}

export default withDocuments(Compressor);
