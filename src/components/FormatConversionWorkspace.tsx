import { lazy, Suspense, useState } from 'react';
import IconConverter from './IconConverter';
import ImageConverter from './ImageConverter';
import PngOptimizer from './PngOptimizer';

type Mode = 'jfif' | 'png' | 'webp' | 'heic' | 'svg' | 'ico' | 'optimize-png';
const HeicConverter = lazy(() => import('./HeicConverter'));

export default function FormatConversionWorkspace({ lang }: { lang: string }) {
  const en = lang === 'en';
  const [mode, setMode] = useState<Mode>('png');
  return <div>
    <p className="local">{en ? 'Choose the source format. Conversion runs in this browser.' : 'Pilih format sumber. Konversi berlangsung di browser ini.'}</p>
    <label>{en ? 'Image format or action' : 'Format gambar atau tindakan'}
      <select value={mode} onChange={event => setMode(event.target.value as Mode)}>
        <option value="png">{en ? 'PNG to JPEG, PNG, or WebP' : 'PNG ke JPEG, PNG, atau WebP'}</option>
        <option value="jfif">{en ? 'JPG / JFIF to JPG, PNG or WebP' : 'JPG / JFIF ke JPG, PNG atau WebP'}</option>
        <option value="webp">{en ? 'WebP to JPEG, PNG, or WebP' : 'WebP ke JPEG, PNG, atau WebP'}</option>
        <option value="heic">{en ? 'HEIC/HEIF to JPEG' : 'HEIC/HEIF ke JPEG'}</option>
        <option value="svg">{en ? 'SVG to PNG' : 'SVG ke PNG'}</option>
        <option value="ico">{en ? 'Create ICO icon' : 'Buat ikon ICO'}</option>
        <option value="optimize-png">{en ? 'Lossless PNG optimization' : 'Optimasi PNG lossless'}</option>
      </select>
    </label>
    <div key={mode}>
      {mode === 'png' && <ImageConverter lang={lang} input="png" initialOutput="jpeg" />}
      {mode === 'jfif' && <ImageConverter lang={lang} input="jfif" initialOutput="jpeg" />}
      {mode === 'webp' && <ImageConverter lang={lang} input="webp" initialOutput="png" />}
      {mode === 'heic' && <Suspense fallback={<p className="notice" role="status">{en ? 'Loading HEIC conversion…' : 'Memuat konverter HEIC…'}</p>}><HeicConverter lang={lang} /></Suspense>}
      {mode === 'svg' && <ImageConverter lang={lang} input="svg" initialOutput="png" />}
      {mode === 'ico' && <IconConverter lang={lang} />}
      {mode === 'optimize-png' && <PngOptimizer lang={lang} />}
    </div>
  </div>;
}
