import { useEffect, useRef, useState } from 'react';
import { inspectPng } from '../engines/png';
import WorkflowActions from './WorkflowActions';

type Output = { blob: Blob; url: string; width: number; height: number };

export default function PngOptimizer({ lang }: { lang: string }) {
  const en = lang === 'en';
  const [file, setFile] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState('');
  const [output, setOutput] = useState<Output | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const worker = useRef<Worker | null>(null);

  useEffect(() => () => { worker.current?.terminate(); }, []);
  useEffect(() => () => { if (output) URL.revokeObjectURL(output.url); }, [output]);
  useEffect(() => {
    if (!file) { setSourceUrl(''); return; }
    const url = URL.createObjectURL(file);
    setSourceUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function clear() { worker.current?.terminate(); worker.current = null; setBusy(false); setOutput(null); setMessage(''); }

  async function optimize() {
    if (!file || busy) return;
    clear();
    setBusy(true);
    setMessage(en ? 'Optimizing PNG on this device…' : 'Mengoptimalkan PNG di perangkat ini…');
    try {
      if (file.size > 20_000_000) throw new Error('png-bytes');
      const source = new Uint8Array(await file.arrayBuffer());
      const info = inspectPng(source);
      const task = new Worker(new URL('../workers/png-optimizer.worker.ts', import.meta.url), { type: 'module' });
      worker.current = task;
      task.onmessage = (event: MessageEvent<{ ok: boolean; output?: ArrayBuffer }>) => {
        worker.current = null;
        task.terminate();
        setBusy(false);
        if (!event.data.ok || !event.data.output) {
          setMessage(en ? 'The PNG could not be optimized. Your original file is unchanged.' : 'PNG tidak dapat dioptimalkan. Berkas asli tetap utuh.');
          return;
        }
        const blob = new Blob([event.data.output], { type: 'image/png' });
        if (blob.size >= file.size) {
          setMessage(en ? `No smaller PNG was produced (${file.size.toLocaleString('en')} bytes). Your original file is unchanged.` : `Hasil tidak lebih kecil (${file.size.toLocaleString('id')} byte). Berkas asli tetap utuh.`);
          return;
        }
        setOutput({ blob, url: URL.createObjectURL(blob), width: info.width, height: info.height });
        setMessage(en ? 'A smaller, lossless PNG is ready.' : 'PNG lossless yang lebih kecil sudah siap.');
      };
      task.onerror = () => {
        worker.current = null;
        task.terminate();
        setBusy(false);
        setMessage(en ? 'PNG optimization failed. Your original file is unchanged.' : 'Optimasi PNG gagal. Berkas asli tetap utuh.');
      };
      task.postMessage(info.sanitized.buffer, [info.sanitized.buffer]);
    } catch (error) {
      setBusy(false);
      const code = error instanceof Error ? error.message : '';
      setMessage(code === 'png-bytes'
        ? (en ? 'The file exceeds the 20 MB limit.' : 'Berkas melebihi batas 20 MB.')
        : code === 'png-dimensions'
          ? (en ? 'PNG dimensions are invalid or exceed 40 megapixels.' : 'Dimensi PNG tidak valid atau melebihi 40 megapiksel.')
          : code === 'png-animated'
            ? (en ? 'Animated PNG is not supported. The original file is unchanged.' : 'PNG animasi belum didukung. Berkas asli tetap utuh.')
            : (en ? 'Choose a valid, complete PNG file. The original is unchanged.' : 'Pilih berkas PNG yang valid dan utuh. Berkas asli tetap utuh.'));
    }
  }

  return <section className="panel">
    <p className="local">{en ? 'Processing stays on your device.' : 'Pemrosesan berlangsung di perangkat Anda.'}</p>
    <label className="drop">{en ? 'Choose a PNG (up to 20 MB)' : 'Pilih PNG (maks. 20 MB)'}<input type="file" accept=".png,image/png" disabled={busy} onChange={event => { clear(); setFile(event.target.files?.[0] ?? null); }}/></label>
    {file && <p>{file.name} · {file.size.toLocaleString(en ? 'en' : 'id')} {en ? 'bytes' : 'byte'}</p>}
    <p className="notice">{en ? 'Lossless optimization keeps image pixels and transparency intact. Text, EXIF, timestamp, and physical-resolution metadata are removed. Animated PNG is not supported.' : 'Optimasi lossless mempertahankan pixel gambar dan transparansi. Metadata teks, EXIF, waktu, dan resolusi fisik dihapus. PNG animasi belum didukung.'}</p>
    <div className="controls"><button className="button" disabled={!file || busy} onClick={() => void optimize()}>{busy ? (en ? 'Optimizing…' : 'Mengoptimalkan…') : (en ? 'Optimize PNG' : 'Optimalkan PNG')}</button><button className="button secondary" disabled={!busy} onClick={() => { clear(); setMessage(en ? 'Optimization cancelled. Your original file is unchanged.' : 'Optimasi dibatalkan. Berkas asli tetap utuh.'); }}>{en ? 'Cancel' : 'Batalkan'}</button></div>
    {busy && <progress className="work-progress" aria-label={en ? 'PNG optimization in progress' : 'Optimasi PNG sedang berlangsung'}/>}
    {message && <p role="status" aria-live="polite">{message}</p>}
    {output && <div className="result"><p>{output.width} × {output.height} px · PNG · {output.blob.size.toLocaleString(en ? 'en' : 'id')} {en ? 'bytes' : 'byte'} ({Math.round((1 - output.blob.size / file!.size) * 100)}% smaller)</p><div className="png-comparison"><figure><figcaption>{en ? 'Before' : 'Sebelum'}</figcaption><img src={sourceUrl} alt={en ? 'Original PNG' : 'PNG asli'} width={output.width} height={output.height}/></figure><figure><figcaption>{en ? 'After' : 'Sesudah'}</figcaption><img src={output.url} alt={en ? 'Optimized PNG' : 'PNG teroptimasi'} width={output.width} height={output.height}/></figure></div><p><a className="button download" href={output.url} download={`${file!.name.replace(/\.png$/i, '')}-optimized.png`}>{en ? 'Download optimized PNG' : 'Unduh PNG teroptimasi'}</a></p><WorkflowActions lang={lang} blob={output.blob} width={output.width} height={output.height} steps={[{path:en?'/en/ukuran/resize-image/':'/id/ukuran/ubah-ukuran-gambar/',id:'Atur ukuran PNG',en:'Resize this PNG'},{path:en?'/en/compress-image/':'/id/kompres-foto/',id:'Kompres PNG',en:'Compress this PNG'}]}/></div>}
  </section>;
}
