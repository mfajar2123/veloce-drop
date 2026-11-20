import { withDocuments } from './DocumentWorkspace';
import { useEffect, useRef, useState, type PointerEvent } from 'react';
import PrintSheet from './PrintSheet';
import WorkflowActions from './WorkflowActions';
import { featherAlpha } from '../engines/mask-effects';
import { readImageBlobHeader } from '../engines/image-header';
import { toolHref } from '../tool-links';

type Result = { blob: Blob; url: string; bytes: number; width: number; height: number };

const MAX_FILE = 20_000_000;
// Raised from 4 MP so ordinary phone photos (12 MP) keep their original
// resolution. The mask itself is still predicted at a reduced size and scaled
// back up, which is what keeps memory predictable on a device.
const MAX_PIXELS = 16_000_000;
const TOTAL_MODEL = 40_737_492;

const swatches: Array<{ value: string; id: string; en: string }> = [
  { value: 'transparent', id: 'Transparan', en: 'Transparent' },
  { value: '#ffffff', id: 'Putih', en: 'White' },
  { value: '#000000', id: 'Hitam', en: 'Black' },
  { value: '#f1f5f9', id: 'Abu terang', en: 'Light grey' },
  { value: '#065f46', id: 'Hijau', en: 'Green' },
  { value: '#0054a6', id: 'Biru', en: 'Blue' },
  { value: '#db1514', id: 'Merah', en: 'Red' },
];

function BackgroundStudio({ lang }: { lang: string }) {
  const en = lang === 'en';
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'processing'>('idle');
  const [loaded, setLoaded] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [hasMask, setHasMask] = useState(false);
  const [background, setBackground] = useState('transparent');
  const [custom, setCustom] = useState('#ffffff');
  const [mode, setMode] = useState<'erase' | 'restore'>('erase');
  const [brush, setBrush] = useState(30);
  const [feather, setFeather] = useState(1);
  const [softness, setSoftness] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [panMode, setPanMode] = useState(false);
  const [revision, setRevision] = useState(0);
  const [undoCount, setUndoCount] = useState(0);
  const [redoCount, setRedoCount] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [previewSize, setPreviewSize] = useState({ width: 1, height: 1 });
  const [keyboardCursor, setKeyboardCursor] = useState({ x: 50, y: 50 });

  const worker = useRef<Worker | null>(null);
  const original = useRef<ImageBitmap | null>(null);
  const mask = useRef<HTMLCanvasElement | null>(null);
  const preview = useRef<HTMLCanvasElement | null>(null);
  const viewport = useRef<HTMLDivElement | null>(null);
  const undo = useRef<ImageData[]>([]);
  const redo = useRef<ImageData[]>([]);
  const drawing = useRef(false);
  const strokeLayer = useRef<HTMLCanvasElement | null>(null);
  const last = useRef<{ x: number; y: number } | null>(null);
  const panStart = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const generation = useRef(0);
  const started = useRef(false);
  const processedFile = useRef<File | null>(null);

  useEffect(() => () => {
    generation.current += 1;
    worker.current?.terminate();
    original.current?.close();
  }, []);

  useEffect(() => () => {
    if (result) URL.revokeObjectURL(result.url);
  }, [result]);

  function resetImage() {
    generation.current += 1;
    original.current?.close();
    original.current = null;
    mask.current = null;
    undo.current = [];
    redo.current = [];
    processedFile.current = null;
    setUndoCount(0);
    setRedoCount(0);
    setHasMask(false);
    setPreviewSize({ width: 1, height: 1 });
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setResult(null);
    setError('');
  }

  function startWorker() {
    if (started.current) return;
    started.current = true;
    setError('');
    setLoaded(0);
    setStatus('loading');
    const instance = new Worker(new URL('../workers/modnet.worker.ts', import.meta.url), { type: 'module' });
    worker.current = instance;
    instance.onmessage = event => {
      if (worker.current !== instance) return;
      const message = event.data;
      if (message.type === 'progress') setLoaded(message.received);
      else if (message.type === 'ready') setStatus('ready');
      else if (message.type === 'error') {
        setError(en ? 'The model could not start or process the image. Try again.' : 'Model gagal dimulai atau memproses gambar. Coba lagi.');
        instance.terminate();
        worker.current = null;
        started.current = false;
        setStatus('idle');
      } else if (message.type === 'mask') {
        const source = original.current;
        if (!source) { setStatus('ready'); return; }
        const small = document.createElement('canvas');
        small.width = message.width;
        small.height = message.height;
        const context = small.getContext('2d');
        if (!context) { setError('Canvas unavailable'); setStatus('ready'); return; }
        const pixels = context.createImageData(small.width, small.height);
        const values = message.data as Float32Array;
        for (let i = 0; i < values.length; i += 1) {
          pixels.data[i * 4] = 255;
          pixels.data[i * 4 + 1] = 255;
          pixels.data[i * 4 + 2] = 255;
          pixels.data[i * 4 + 3] = Math.round(Math.max(0, Math.min(1, values[i])) * 255);
        }
        context.putImageData(pixels, 0, 0);
        const full = document.createElement('canvas');
        full.width = source.width;
        full.height = source.height;
        const fullContext = full.getContext('2d');
        if (!fullContext) { setError('Canvas unavailable'); setStatus('ready'); return; }
        fullContext.drawImage(small, 0, 0, full.width, full.height);
        small.width = 0;
        small.height = 0;
        mask.current = full;
        undo.current = [];
        redo.current = [];
        setUndoCount(0);
        setRedoCount(0);
        setHasMask(true);
        setRevision(value => value + 1);
        // Keep the worker and its loaded model alive so a second photo is
        // processed immediately instead of re-downloading 40 MB.
        setStatus('ready');
      }
    };
    instance.onerror = () => {
      if (worker.current !== instance) return;
      setError(en ? 'The model worker could not start.' : 'Worker model tidak dapat dimulai.');
      instance.terminate();
      worker.current = null;
      started.current = false;
      setStatus('idle');
    };
    instance.postMessage({ type: 'init' });
  }

  // The model now loads as soon as the tool opens. The upload control is
  // usable immediately, so a visitor never waits for a button that only
  // starts a 40 MB download.
  useEffect(() => { startWorker(); }, []);

  async function segment() {
    const workerInstance = worker.current;
    if (!file || status !== 'ready' || !workerInstance) return;
    const requested = file;
    resetImage();
    processedFile.current = requested;
    const job = generation.current;
    setStatus('processing');
    let image: ImageBitmap | undefined;
    try {
      if (file.size > MAX_FILE) throw new Error('size');
      const header = await readImageBlobHeader(file);
      if (!header) throw new Error('format');
      if (header.width * header.height > MAX_PIXELS) throw new Error('pixels');
      image = await createImageBitmap(file, { imageOrientation: 'from-image' });
      if (job !== generation.current) { image.close(); return; }
      if (image.width * image.height > MAX_PIXELS) throw new Error('pixels');
      const scale = Math.min(512 / Math.min(image.width, image.height), 1024 / Math.max(image.width, image.height));
      const width = Math.max(32, Math.round(image.width * scale / 32) * 32);
      const height = Math.max(32, Math.round(image.height * scale / 32) * 32);
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('canvas');
      context.fillStyle = '#fff';
      context.fillRect(0, 0, width, height);
      context.drawImage(image, 0, 0, width, height);
      const rgba = context.getImageData(0, 0, width, height).data;
      const plane = width * height;
      const data = new Float32Array(plane * 3);
      for (let i = 0; i < plane; i += 1) {
        data[i] = rgba[i * 4] / 127.5 - 1;
        data[plane + i] = rgba[i * 4 + 1] / 127.5 - 1;
        data[plane * 2 + i] = rgba[i * 4 + 2] / 127.5 - 1;
      }
      canvas.width = 0;
      canvas.height = 0;
      original.current = image;
      image = undefined;
      workerInstance.postMessage({ type: 'segment', data, width, height }, [data.buffer]);
    } catch (cause) {
      image?.close();
      if (job === generation.current) {
        const code = cause instanceof Error ? cause.message : '';
        setError(code === 'size'
          ? (en ? 'File exceeds 20 MB.' : 'Berkas melebihi 20 MB.')
          : code === 'pixels'
            ? (en ? 'Image exceeds 16 megapixels.' : 'Gambar melebihi 16 megapiksel.')
            : (en ? 'Choose a valid JPEG, PNG or WebP image.' : 'Pilih gambar JPEG, PNG, atau WebP yang valid.'));
        setStatus('ready');
      }
    }
  }

  // Runs segmentation automatically once both a file and the model are ready.
  useEffect(() => {
    if (status !== 'ready') return;
    if (!file || hasMask) return;
    if (processedFile.current === file) return;
    void segment();
  }, [status, file, hasMask]);

  function drawComposite(canvas: HTMLCanvasElement, width: number, height: number) {
    const source = original.current;
    const alphaMask = mask.current;
    if (!source || !alphaMask) return;
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.clearRect(0, 0, width, height);
    context.drawImage(source, 0, 0, width, height);
    context.globalCompositeOperation = 'destination-in';
    if (feather) {
      const temporary = document.createElement('canvas');
      temporary.width = width;
      temporary.height = height;
      const temp = temporary.getContext('2d');
      if (!temp) throw new Error('Canvas unavailable');
      temp.drawImage(alphaMask, 0, 0, width, height);
      const pixels = temp.getImageData(0, 0, width, height);
      const alpha = new Uint8ClampedArray(width * height);
      for (let i = 0; i < alpha.length; i += 1) alpha[i] = pixels.data[i * 4 + 3];
      const softened = featherAlpha(alpha, width, height, Math.max(1, Math.round(feather * width / source.width)));
      for (let i = 0; i < alpha.length; i += 1) pixels.data[i * 4 + 3] = softened[i];
      temp.putImageData(pixels, 0, 0);
      context.drawImage(temporary, 0, 0);
      temporary.width = 0;
      temporary.height = 0;
    } else {
      context.drawImage(alphaMask, 0, 0, width, height);
    }
    context.globalCompositeOperation = 'source-over';
    context.globalCompositeOperation = 'destination-over';
    if (background !== 'transparent') {
      context.fillStyle = background === 'custom' ? custom : background;
      context.fillRect(0, 0, width, height);
    }
    context.globalCompositeOperation = 'source-over';
  }

  useEffect(() => {
    const source = original.current;
    const node = preview.current;
    if (!hasMask || !source || !node) return;
    // Fit the preview inside the first screen so the whole workflow, including
    // the download button, is reachable without scrolling.
    const sideColumn = window.innerWidth > 900 ? 400 : 0;
    const maxWidth = Math.max(280, Math.min(900, window.innerWidth - sideColumn - 96));
    const maxHeight = Math.max(260, window.innerHeight - 300);
    const scale = Math.min(1, maxWidth / source.width, maxHeight / source.height);
    const width = Math.max(1, Math.round(source.width * scale));
    const height = Math.max(1, Math.round(source.height * scale));
    drawComposite(node, width, height);
    setPreviewSize({ width, height });
  }, [hasMask, revision, background, custom, feather]);

  function snapshot() {
    const current = mask.current;
    if (!current) return;
    const context = current.getContext('2d');
    if (!context) return;
    undo.current.push(context.getImageData(0, 0, current.width, current.height));
    if (undo.current.length > 5) undo.current.shift();
    redo.current = [];
    setUndoCount(undo.current.length);
    setRedoCount(0);
  }

  function history(which: 'undo' | 'redo') {
    const current = mask.current;
    const context = current?.getContext('2d');
    if (!current || !context) return;
    const from = which === 'undo' ? undo.current : redo.current;
    const to = which === 'undo' ? redo.current : undo.current;
    const state = from.pop();
    if (!state) return;
    generation.current += 1;
    to.push(context.getImageData(0, 0, current.width, current.height));
    if (to.length > 5) to.shift();
    context.putImageData(state, 0, 0);
    setUndoCount(undo.current.length);
    setRedoCount(redo.current.length);
    setResult(null);
    setRevision(value => value + 1);
  }

  function position(event: PointerEvent<HTMLCanvasElement>) {
    const rect = viewport.current?.getBoundingClientRect();
    const current = mask.current;
    const canvas = preview.current;
    if (!rect || !canvas || !current) return { x: 0, y: 0 };
    const logicalWidth = (event.clientX - rect.left - pan.x - rect.width / 2) / zoom + rect.width / 2;
    const logicalHeight = (event.clientY - rect.top - pan.y - rect.height / 2) / zoom + rect.height / 2;
    return {
      x: Math.max(0, Math.min(current.width, logicalWidth / rect.width * current.width)),
      y: Math.max(0, Math.min(current.height, logicalHeight / rect.height * current.height)),
    };
  }

  function beginStroke(point: { x: number; y: number }) {
    const current = mask.current;
    if (!current) return;
    snapshot();
    const layer = document.createElement('canvas');
    layer.width = current.width;
    layer.height = current.height;
    const context = layer.getContext('2d');
    if (!context) return;
    context.strokeStyle = '#fff';
    context.lineWidth = Math.max(1, brush * Math.max(current.width, current.height) / 800);
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.beginPath();
    context.moveTo(point.x, point.y);
    context.lineTo(point.x + 0.01, point.y);
    context.stroke();
    strokeLayer.current = layer;
    last.current = point;
    drawing.current = true;
  }

  function extendStroke(point: { x: number; y: number }) {
    const layer = strokeLayer.current;
    const context = layer?.getContext('2d');
    if (!context || !last.current) return;
    context.lineTo(point.x, point.y);
    context.stroke();
    last.current = point;
  }

  function softenLayer(layer: HTMLCanvasElement, radius: number) {
    if (radius < 1) return;
    const context = layer.getContext('2d');
    if (!context) return;
    const image = context.getImageData(0, 0, layer.width, layer.height);
    const alpha = new Uint8ClampedArray(layer.width * layer.height);
    for (let i = 0; i < alpha.length; i += 1) alpha[i] = image.data[i * 4 + 3];
    const softened = featherAlpha(alpha, layer.width, layer.height, radius);
    for (let i = 0; i < softened.length; i += 1) image.data[i * 4 + 3] = softened[i];
    context.putImageData(image, 0, 0);
  }

  function applyStroke(layer: HTMLCanvasElement) {
    const current = mask.current;
    const context = current?.getContext('2d');
    if (!current || !context) return;
    generation.current += 1;
    const radius = Math.round(brush * Math.max(current.width, current.height) / 1600 * softness / 100);
    softenLayer(layer, radius);
    context.save();
    context.globalCompositeOperation = mode === 'erase' ? 'destination-out' : 'source-over';
    context.drawImage(layer, 0, 0);
    context.restore();
    layer.width = 0;
    layer.height = 0;
    setResult(null);
    setRevision(value => value + 1);
  }

  function finishStroke() {
    const layer = strokeLayer.current;
    if (!layer) return;
    applyStroke(layer);
    strokeLayer.current = null;
    drawing.current = false;
    last.current = null;
  }

  function keyboardMark() {
    const current = mask.current;
    if (!current) return;
    snapshot();
    const layer = document.createElement('canvas');
    layer.width = current.width;
    layer.height = current.height;
    const context = layer.getContext('2d');
    if (!context) return;
    const radius = Math.max(1, brush * Math.max(current.width, current.height) / 1600);
    context.fillStyle = '#fff';
    context.beginPath();
    context.arc(keyboardCursor.x * current.width / 100, keyboardCursor.y * current.height / 100, radius, 0, Math.PI * 2);
    context.fill();
    applyStroke(layer);
  }

  async function buildResult() {
    const source = original.current;
    if (!source || !mask.current) return null;
    const scale = 1;
    const width = Math.round(source.width * scale);
    const height = Math.round(source.height * scale);
    const canvas = document.createElement('canvas');
    try {
      drawComposite(canvas, width, height);
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value?.type === 'image/png' ? resolve(value) : reject(new Error('encode')), 'image/png'));
      return { blob, url: URL.createObjectURL(blob), bytes: blob.size, width, height };
    } finally {
      canvas.width = 0;
      canvas.height = 0;
    }
  }

  async function createPng() {
    const job = generation.current;
    setBusy(en ? 'Preparing PNG…' : 'Menyiapkan PNG…');
    setError('');
    try {
      const next = await buildResult();
      if (next && job === generation.current) setResult(next);
    } catch {
      setError(en ? 'Could not create PNG.' : 'PNG tidak dapat dibuat.');
    } finally {
      setBusy('');
    }
  }

  async function downloadPng() {
    const job = generation.current;
    setBusy(en ? 'Preparing PNG…' : 'Menyiapkan PNG…');
    setError('');
    try {
      const next = await buildResult();
      if (!next) return;
      if (job === generation.current) setResult(next);
      const anchor = document.createElement('a');
      anchor.href = next.url;
      anchor.download = 'background-removed.png';
      anchor.click();
      document.dispatchEvent(new CustomEvent("tool-download", { detail: anchor }));
    } catch {
      setError(en ? 'Could not create PNG.' : 'PNG tidak dapat dibuat.');
    } finally {
      setBusy('');
    }
  }


  const statusText = status === 'loading'
    ? `${en ? 'Preparing model' : 'Menyiapkan model'} ${Math.min(100, Math.round(loaded / TOTAL_MODEL * 100))}%`
    : status === 'processing'
      ? (en ? 'Removing background…' : 'Menghapus latar…')
      : hasMask
        ? (en ? 'Ready to download' : 'Siap diunduh')
        : (en ? 'Model ready' : 'Model siap');

  return <section className={`bg-studio${hasMask ? ' has-result' : ''}`}>
    <div className="bg-top">
      <p className="bg-eyebrow">{en ? 'Background remover' : 'Penghapus latar'}</p>
      <p className={`bg-status${status === 'loading' || status === 'processing' ? ' is-busy' : ''}`} aria-live="polite">{statusText}</p>
    </div>

    <div className="bg-workspace">
      <div className="bg-stage">
        {!hasMask && <label className="bg-drop">
          <span className="bg-drop-icon" aria-hidden="true">↑</span>
          <strong>{status === 'processing' ? (en ? 'Removing background…' : 'Menghapus latar…') : (en ? 'Choose a photo' : 'Pilih foto')}</strong>
          <span>{en ? 'JPEG, PNG or WebP · up to 20 MB · original resolution kept' : 'JPEG, PNG, atau WebP · maks. 20 MB · resolusi asli dipertahankan'}</span>
          <input aria-label={en ? 'Choose a portrait' : 'Pilih potret'} type="file" multiple accept="image/jpeg,image/png,image/webp" disabled={status === 'processing'} onChange={event => {
            const next = event.target.files?.[0] ?? null;
            resetImage();
            setFile(next);
          }} />
        </label>}

        {hasMask && <div className="bg-canvas-wrap">
          <div ref={viewport} className="mask-preview-viewport bg-viewport" style={{ width: Math.min(900, previewSize.width), aspectRatio: `${previewSize.width}/${previewSize.height}` }}>
            <canvas ref={preview} tabIndex={0} role="application" aria-label={en ? 'Mask editing preview' : 'Pratinjau penyuntingan mask'} aria-describedby="mask-keyboard-help" style={{ display: 'block', width: '100%', height: '100%', touchAction: 'none', background: 'repeating-conic-gradient(#e2e8f0 0% 25%, #f8fafc 0% 50%) 50% / 20px 20px', transform: `translate(${pan.x}px,${pan.y}px) scale(${zoom})`, transformOrigin: 'center' }}
              onKeyDown={event => {
                const step = event.shiftKey ? 20 : 5;
                if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
                  event.preventDefault();
                  if (panMode) setPan(previous => ({ x: previous.x + (event.key === 'ArrowRight' ? step : event.key === 'ArrowLeft' ? -step : 0), y: previous.y + (event.key === 'ArrowDown' ? step : event.key === 'ArrowUp' ? -step : 0) }));
                  else setKeyboardCursor(previous => ({ x: Math.max(0, Math.min(100, previous.x + (event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0))), y: Math.max(0, Math.min(100, previous.y + (event.key === 'ArrowDown' ? 1 : event.key === 'ArrowUp' ? -1 : 0))) }));
                } else if (event.key === '+' || event.key === '=') setZoom(value => Math.min(4, value + 0.25));
                else if (event.key === '-') setZoom(value => Math.max(1, value - 0.25));
                else if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); if (!panMode) keyboardMark(); }
              }}
              onWheel={event => { if (event.ctrlKey || event.metaKey) { event.preventDefault(); setZoom(value => Math.max(1, Math.min(4, value + (event.deltaY < 0 ? 0.2 : -0.2)))); } }}
              onPointerDown={event => {
                if (!mask.current) return;
                event.currentTarget.setPointerCapture(event.pointerId);
                if (panMode) { panStart.current = { x: event.clientX, y: event.clientY, panX: pan.x, panY: pan.y }; return; }
                beginStroke(position(event));
              }}
              onPointerMove={event => {
                if (panStart.current && event.currentTarget.hasPointerCapture(event.pointerId)) { setPan({ x: panStart.current.panX + event.clientX - panStart.current.x, y: panStart.current.panY + event.clientY - panStart.current.y }); return; }
                if (drawing.current && event.currentTarget.hasPointerCapture(event.pointerId)) extendStroke(position(event));
              }}
              onPointerUp={event => { if (drawing.current) finishStroke(); panStart.current = null; if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }}
              onPointerCancel={() => { if (drawing.current) finishStroke(); panStart.current = null; }}
            />
          </div>
          <p id="mask-keyboard-help" className="notice bg-hint">{en ? 'Paint to erase or restore edges. Arrow keys move the marker, Enter paints, +/− zooms.' : 'Gambar untuk menghapus atau memulihkan tepi. Tombol panah menggeser penanda, Enter menggambar, +/− untuk zoom.'}</p>
          <div className="bg-toolbar">
            <label>{en ? 'Brush' : 'Kuas'}
              <select value={mode} onChange={event => setMode(event.target.value as typeof mode)}>
                <option value="erase">{en ? 'Erase' : 'Hapus'}</option>
                <option value="restore">{en ? 'Restore' : 'Pulihkan'}</option>
              </select>
            </label>
            <label>{en ? 'Size' : 'Ukuran'}
              <input aria-label={en ? 'Brush size' : 'Ukuran kuas'} type="range" min="5" max="120" value={brush} onChange={event => setBrush(Number(event.target.value))} />
            </label>
            <label>{en ? 'Softness' : 'Kelembutan'}
              <input aria-label={en ? 'Brush softness' : 'Kelembutan kuas'} type="range" min="0" max="100" value={softness} onChange={event => setSoftness(Number(event.target.value))} />
            </label>
            <label>{en ? 'Zoom' : 'Zoom'}
              <input aria-label={en ? 'Mask preview zoom' : 'Zoom pratinjau mask'} type="range" min="1" max="4" step="0.1" value={zoom} onChange={event => { const value = Number(event.target.value); setZoom(value); if (value === 1) setPan({ x: 0, y: 0 }); }} />
            </label>
            <div className="bg-toolbar-buttons">
              <button type="button" className="button secondary" disabled={!undoCount} onClick={() => history('undo')}>{en ? 'Undo' : 'Urungkan'}</button>
              <button type="button" className="button secondary" disabled={!redoCount} onClick={() => history('redo')}>{en ? 'Redo' : 'Ulangi'}</button>
              <button type="button" className="button secondary" aria-pressed={panMode} onClick={() => setPanMode(value => !value)}>{panMode ? (en ? 'Pan mode on' : 'Mode geser aktif') : (en ? 'Pan view' : 'Geser tampilan')}</button>
              <button type="button" className="button secondary" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} disabled={zoom === 1 && pan.x === 0 && pan.y === 0}>{en ? 'Reset view' : 'Reset tampilan'}</button>
            </div>
          </div>
        </div>}

        {error && <p role="alert" className="error">{error}</p>}
      </div>

      <aside className="bg-side">
        <div className="bg-block bg-actions">
          <button className="button" type="button" disabled={!hasMask || Boolean(busy)} onClick={() => void downloadPng()}>{busy || (en ? 'Download PNG' : 'Unduh PNG')}</button>
          <button className="button secondary" type="button" disabled={!hasMask || Boolean(busy)} onClick={() => void createPng()}>{en ? 'Preview result' : 'Pratinjau hasil'}</button>
          {result && <p className="notice">PNG · {result.width} × {result.height} px · {result.bytes.toLocaleString(en ? 'en' : 'id')} bytes</p>}
          {result && <a className="button download" href={result.url} download="background-removed.png">{en ? 'Download PNG' : 'Unduh PNG'}</a>}
        </div>
        {hasMask && <div className="bg-block">
          <label className="bg-replace">{en ? 'Use another photo' : 'Gunakan foto lain'}
            <input aria-label={en ? 'Choose another photo' : 'Pilih foto lain'} type="file" multiple accept="image/jpeg,image/png,image/webp" disabled={status === 'processing'} onChange={event => {
              const next = event.target.files?.[0] ?? null;
              event.target.value = '';
              resetImage();
              setFile(next);
            }} />
          </label>
        </div>}
        <div className="bg-block">
          <h2>{en ? 'Background' : 'Latar'}</h2>
          <div className="bg-swatches" role="group" aria-label={en ? 'Background colour' : 'Warna latar'}>
            {swatches.map(item => <button key={item.value} type="button" aria-pressed={background === item.value} aria-label={item[lang === 'en' ? 'en' : 'id']} data-swatch={item.value} onClick={() => { generation.current += 1; setBackground(item.value); setResult(null); }}>
              <span style={item.value === 'transparent' ? {} : { background: item.value }} className={item.value === 'transparent' ? 'is-transparent' : ''} />
              <em>{item[lang === 'en' ? 'en' : 'id']}</em>
            </button>)}
            <button type="button" aria-pressed={background === 'custom'} aria-label={en ? 'Custom colour' : 'Warna pilihan'} onClick={() => { generation.current += 1; setBackground('custom'); setResult(null); }}>
              <span style={{ background: `conic-gradient(#ef4444,#eab308,#22c55e,#3b82f6,#a855f7,#ef4444)` }} />
              <em>{en ? 'Custom' : 'Pilihan'}</em>
            </button>
          </div>
          {background === 'custom' && <div className="bg-rgb">
            <label>{en ? 'Pick colour' : 'Pilih warna'}<input aria-label={en ? 'Background colour picker' : 'Pemilih warna latar'} type="color" value={custom} onChange={event => { generation.current += 1; setCustom(event.target.value); setBackground('custom'); setResult(null); }} /></label>

          </div>}
        </div>



        {hasMask && <label className="bg-edge">{en ? 'Soften edges' : 'Haluskan tepi'}<input type="range" min="0" max="6" value={feather} onChange={event => { generation.current += 1; setFeather(Number(event.target.value)); setResult(null); }} /></label>}
        {result && <WorkflowActions lang={lang} blob={result.blob} width={result.width} height={result.height} onBeforeNavigate={async () => {
          worker.current?.terminate();
          worker.current = null;
          started.current = false;
          original.current?.close();
          original.current = null;
          if (mask.current) { mask.current.width = 0; mask.current.height = 0; mask.current = null; }
          if (preview.current) { preview.current.width = 0; preview.current.height = 0; }
          undo.current = [];
          redo.current = [];
          await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
        }} steps={[{ path: toolHref('resize-image', lang as 'id' | 'en'), id: 'Buat pas foto 3x4', en: 'Make a 3x4 photo' }]} />}

        {hasMask && <PrintSheet lang={lang} version={`${revision}:${background}:${custom}:${feather}`} capture={() => {
          const source = original.current;
          if (!source || !mask.current) return null;
          const canvas = document.createElement('canvas');
          drawComposite(canvas, source.width, source.height);
          return canvas;
        }} />}
      </aside>
    </div>
  </section>;
}

export default withDocuments(BackgroundStudio);
