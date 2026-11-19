import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { toolHref } from '../tool-links';
import { takeSessionFile } from '../engines/session-files';
import { canvasToBlob, detectDocumentQuad, enhanceDocument, imageDataToCanvas, warpQuad, type Point, type Quad } from '../engines/document-scan';
import WorkflowActions from './WorkflowActions';

type Stage = 'idle' | 'live' | 'review' | 'result';
type Output = { url: string; preview: string; blob: Blob; width: number; height: number };

const MAX_INPUT_PIXELS = 24_000_000;
const LIVE_INTERVAL = 350;
const CORNER_LABELS = ['top-left', 'top-right', 'bottom-right', 'bottom-left'];

const fullQuad = (width: number, height: number): Quad => [
  { x: 0, y: 0 },
  { x: width, y: 0 },
  { x: width, y: height },
  { x: 0, y: height },
];

export default function DocumentScanner({ lang }: { lang: string }) {
  const en = lang === 'en';
  const [stage, setStage] = useState<Stage>('idle');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [corners, setCorners] = useState<Quad | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [detected, setDetected] = useState(false);
  const [frame, setFrame] = useState<{ width: number; height: number } | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [outputs, setOutputs] = useState<Output[]>([]);
  const [resultPreviewReady, setResultPreviewReady] = useState(false);
  const [format, setFormat] = useState<'jpeg' | 'pdf'>('jpeg');
  const [enhance, setEnhance] = useState(true);
  const [dragging, setDragging] = useState<number | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const captureRef = useRef<HTMLCanvasElement | null>(null);
  const sourceRef = useRef<ImageData | null>(null);
  const sourceUrlRef = useRef('');
  const urlsRef = useRef(new Set<string>());
  const aliveRef = useRef(true);
  const timerRef = useRef<number | null>(null);

  const releaseOutputs = useCallback(() => {
    for (const url of urlsRef.current) URL.revokeObjectURL(url);
    urlsRef.current.clear();
    setOutputs([]);
    setResultPreviewReady(false);
  }, []);

  const stopCamera = useCallback(() => {
    if (timerRef.current !== null) { window.clearInterval(timerRef.current); timerRef.current = null; }
    const stream = streamRef.current;
    streamRef.current = null;
    if (stream) for (const track of stream.getTracks()) track.stop();
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraStream(null);
    setCameraReady(false);
    setStage(current => (current === 'live' ? 'idle' : current));
  }, []);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
      if (timerRef.current !== null) window.clearInterval(timerRef.current);
      const stream = streamRef.current;
      if (stream) for (const track of stream.getTracks()) track.stop();
      for (const url of urlsRef.current) URL.revokeObjectURL(url);
      if (sourceUrlRef.current) URL.revokeObjectURL(sourceUrlRef.current);
    };
  }, []);

  useEffect(() => {
    const incoming = takeSessionFile(location.pathname);
    if (incoming) void loadFile(incoming);
  }, []);

  // --- edge detection from the live preview ---------------------------------

  const grabFrame = useCallback((): ImageData | null => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return null;
    const scale = Math.min(1, 480 / Math.max(video.videoWidth, video.videoHeight));
    const width = Math.max(2, Math.round(video.videoWidth * scale));
    const height = Math.max(2, Math.round(video.videoHeight * scale));
    const canvas = captureRef.current ?? document.createElement('canvas');
    captureRef.current = canvas;
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return null;
    context.drawImage(video, 0, 0, width, height);
    return context.getImageData(0, 0, width, height);
  }, []);

  const detectLive = useCallback(() => {
    const image = grabFrame();
    if (!image || !aliveRef.current) return;
    // The frame size must always be recorded, including the "nothing found"
    // case: capture() scales the preview corners against it, and a missing
    // frame would silently squash every corner into the top of the page.
    setFrame({ width: image.width, height: image.height });
    const quad = detectDocumentQuad(image.data, image.width, image.height);
    if (!quad) {
      setDetected(false);
      setCorners(fullQuad(image.width, image.height));
      return;
    }
    setDetected(true);
    setCorners(quad);
  }, [grabFrame]);

  const startCamera = useCallback(async () => {
    setError('');
    setNotice('');
    if (!navigator.mediaDevices?.getUserMedia) {
      setError(en ? 'This browser cannot open the camera here. Use the file option instead.' : 'Browser ini tidak bisa membuka kamera di sini. Gunakan pilihan berkas.');
      return;
    }
    setBusy(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      if (!aliveRef.current) {
        for (const track of stream.getTracks()) track.stop();
        return;
      }
      streamRef.current = stream;
      setStage('live');
      setCameraStream(stream);
      window.setTimeout(detectLive, 400);
      timerRef.current = window.setInterval(detectLive, LIVE_INTERVAL);
    } catch {
      if (aliveRef.current) setError(en
        ? 'Camera access was blocked. Allow the camera in your browser, or choose a photo instead.'
        : 'Akses kamera diblokir. Izinkan kamera di browser, atau pilih foto sebagai gantinya.');
    } finally {
      if (aliveRef.current) setBusy(false);
    }
  }, [detectLive, en]);

  // The <video> element only exists once the stage becomes "live", so the stream
  // has to be attached after that render. Assigning it inside startCamera ran
  // before React had mounted the element and silently left srcObject null.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !cameraStream) return;
    if (video.srcObject !== cameraStream) {
      video.srcObject = cameraStream;
      void video.play().catch(() => undefined);
    }
  }, [cameraStream, stage]);

  // --- still image path ------------------------------------------------------

  function replaceSourcePreview(blob?: Blob) {
    if (sourceUrlRef.current) URL.revokeObjectURL(sourceUrlRef.current);
    sourceUrlRef.current = blob ? URL.createObjectURL(blob) : '';
    setPreviewUrl(sourceUrlRef.current);
  }

  async function loadFile(file: File) {
    setError('');
    setNotice('');
    releaseOutputs();
    setStage('review');
    setBusy(true);
    setDetected(false);
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
      if (bitmap.width * bitmap.height > MAX_INPUT_PIXELS) {
        bitmap.close();
        throw new Error('pixels');
      }
      const canvas = captureRef.current ?? document.createElement('canvas');
      captureRef.current = canvas;
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context) {
        bitmap.close();
        throw new Error('canvas');
      }
      context.drawImage(bitmap, 0, 0);
      const image = context.getImageData(0, 0, canvas.width, canvas.height);
      bitmap.close();
      if (!aliveRef.current) return;

      sourceRef.current = image;
      setFrame({ width: image.width, height: image.height });
      const quad = detectDocumentQuad(image.data, image.width, image.height);
      setDetected(Boolean(quad));
      setCorners(quad ?? fullQuad(image.width, image.height));
      replaceSourcePreview(file);
      if (!quad) {
        setNotice(en
          ? 'No page outline was found, so the full frame is selected. Drag the corners to mark the paper yourself.'
          : 'Tepi dokumen tidak terdeteksi, jadi seluruh bingkai dipilih. Geser sudutnya untuk menandai kertas sendiri.');
      }
    } catch (cause) {
      setStage('idle');
      setError(cause instanceof Error && cause.message === 'pixels'
        ? (en ? 'That image exceeds 24 megapixels.' : 'Gambar melebihi 24 megapiksel.')
        : (en ? 'That file could not be read as an image.' : 'Berkas itu tidak dapat dibaca sebagai gambar.'));
    } finally {
      if (aliveRef.current) setBusy(false);
    }
  }

  function choose(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) void loadFile(file);
  }

  async function capture() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    setBusy(true);
    setError('');
    try {
      const canvas = captureRef.current ?? document.createElement('canvas');
      captureRef.current = canvas;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context) throw new Error('canvas');
      context.drawImage(video, 0, 0);

      // Re-detect at full resolution; the preview showed a downscaled frame, so
      // any manual corners must be scaled up by the same factor.
      const fullWidth = canvas.width;
      const fullHeight = canvas.height;
      const image = context.getImageData(0, 0, fullWidth, fullHeight);
      const detectedQuad = detectDocumentQuad(image.data, fullWidth, fullHeight);
      const previousFrame = frame;
      const scaleX = previousFrame ? fullWidth / previousFrame.width : 1;
      const scaleY = previousFrame ? fullHeight / previousFrame.height : 1;

      const blob = await canvasToBlob(canvas, 'image/jpeg', 0.92);
      if (!aliveRef.current) return;
      stopCamera();
      sourceRef.current = image;
      setFrame({ width: fullWidth, height: fullHeight });
      setDetected(Boolean(detectedQuad));
      if (detectedQuad) {
        setCorners(detectedQuad);
      } else if (corners) {
        setCorners(corners.map(point => ({ x: point.x * scaleX, y: point.y * scaleY })) as Quad);
      } else {
        setCorners(fullQuad(fullWidth, fullHeight));
      }
      replaceSourcePreview(blob);
      setStage('review');
      if (!detectedQuad) {
        setNotice(en
          ? 'The page outline was not detected clearly. Drag the corners to match the paper, then preview the scan.'
          : 'Tepi halaman kurang jelas. Geser sudut ke tepi kertas, lalu lihat pratinjau.');
      }
    } catch {
      setError(en ? 'The frame could not be captured.' : 'Bingkai tidak dapat diambil.');
    } finally {
      if (aliveRef.current) setBusy(false);
    }
  }

  // --- corner editing --------------------------------------------------------

  const previewBox = useMemo(() => {
    if (!frame) return null;
    const aspect = frame.width / frame.height;
    return { aspect };
  }, [frame]);

  function moveCorner(index: number, event: React.PointerEvent<HTMLButtonElement>) {
    const container = overlayRef.current;
    if (!container || !frame) return;
    const rect = container.getBoundingClientRect();
    const x = Math.round(((event.clientX - rect.left) / rect.width) * frame.width);
    const y = Math.round(((event.clientY - rect.top) / rect.height) * frame.height);
    setCorners(previous => {
      if (!previous) return previous;
      const next = [...previous] as Quad;
      next[index] = { x: Math.max(0, Math.min(frame.width, x)), y: Math.max(0, Math.min(frame.height, y)) };
      return next;
    });
    setDetected(false);
  }

  function cornerFromKeyboard(index: number, event: React.KeyboardEvent<HTMLButtonElement>) {
    if (!frame) return;
    const step = event.shiftKey ? 20 : 5;
    const delta: Record<string, Point> = {
      ArrowLeft: { x: -step, y: 0 },
      ArrowRight: { x: step, y: 0 },
      ArrowUp: { x: 0, y: -step },
      ArrowDown: { x: 0, y: step },
    };
    const change = delta[event.key];
    if (!change) return;
    event.preventDefault();
    setCorners(previous => {
      if (!previous) return previous;
      const next = [...previous] as Quad;
      const point = next[index];
      next[index] = {
        x: Math.max(0, Math.min(frame.width, point.x + change.x)),
        y: Math.max(0, Math.min(frame.height, point.y + change.y)),
      };
      return next;
    });
    setDetected(false);
  }

  // --- save ------------------------------------------------------------------

  async function save() {
    const image = sourceRef.current;
    if (!image || !corners) return;
    setBusy(true);
    setError('');
    try {
      const warped = warpQuad(image, corners, { maxLongSide: 2600 });
      const processed = enhance ? enhanceDocument(warped) : warped;
      const canvas = imageDataToCanvas(processed);
      const blob = format === 'jpeg'
        ? await canvasToBlob(canvas, 'image/jpeg', 0.92)
        : await buildPdf(canvas);
      const previewBlob = format === 'pdf' ? await canvasToBlob(canvas, 'image/jpeg', 0.88) : blob;

      if (!aliveRef.current) return;
      releaseOutputs();
      const url = URL.createObjectURL(blob);
      const preview = previewBlob === blob ? url : URL.createObjectURL(previewBlob);
      urlsRef.current.add(url).add(preview);
      setOutputs([{ url, preview, blob, width: processed.width, height: processed.height }]);
      setStage('result');
    } catch (cause) {
      setError(cause instanceof Error && cause.message === 'empty'
        ? (en ? 'The selected corners are too small to make a page.' : 'Sudut yang dipilih terlalu kecil untuk membuat halaman.')
        : (en ? 'The page could not be exported. Try again or reset the corners.' : 'Halaman tidak dapat diekspor. Coba lagi atau atur ulang sudutnya.'));
    } finally {
      if (aliveRef.current) setBusy(false);
    }
  }

  async function buildPdf(canvas: HTMLCanvasElement): Promise<Blob> {
    const { PDFDocument } = await import('pdf-lib');
    const document = await PDFDocument.create();
    const encoded = await canvasToBlob(canvas, 'image/png', 1);
    const embedded = await document.embedPng(await encoded.arrayBuffer());
    // A4 in points, then fit the page inside it with a 10 mm margin.
    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const margin = (10 * 72) / 25.4;
    const scale = Math.min((pageWidth - margin * 2) / canvas.width, (pageHeight - margin * 2) / canvas.height);
    const width = canvas.width * scale;
    const height = canvas.height * scale;
    const page = document.addPage([pageWidth, pageHeight]);
    page.drawImage(embedded, { x: (page.getWidth() - width) / 2, y: (page.getHeight() - height) / 2, width, height });
    const bytes = await document.save();
    return new Blob([bytes as BlobPart], { type: 'application/pdf' });
  }

  function reset() {
    stopCamera();
    releaseOutputs();
    sourceRef.current = null;
    setCorners(null);
    setFrame(null);
    setDetected(false);
    replaceSourcePreview();
    setNotice('');
    setError('');
    setStage('idle');
  }

  const sizeLabel = (bytes: number) => `${new Intl.NumberFormat(en ? 'en' : 'id', { maximumFractionDigits: 1 }).format(bytes / 1000)} KB`;
  const cornerStyle = (point: Point) => frame
    ? { left: `${(point.x / frame.width) * 100}%`, top: `${(point.y / frame.height) * 100}%` }
    : undefined;

  return <div className="panel scanner-panel">
    <p className="local">{en ? 'The camera frame and the scan stay on this device. Nothing is uploaded.' : 'Bingkai kamera dan hasil scan tetap di perangkat ini. Tidak ada yang diunggah.'}</p>

    {stage === 'result' && outputs.length > 0
      ? <div className="result scanner-result">
          <figure className="scanner-result-preview">
            <img
              src={outputs[0].preview}
              width={outputs[0].width}
              height={outputs[0].height}
              alt={en ? 'Corrected document scan' : 'Pratinjau dokumen yang sudah diluruskan'}
              onLoad={() => setResultPreviewReady(true)}
              onError={() => setError(en ? 'The preview could not open. Adjust the corners and try again.' : 'Pratinjau tidak bisa dibuka. Atur sudutnya dan coba lagi.')}
            />
          </figure>
          <div className="scanner-result-actions">
            <h2>{en ? 'Scan preview' : 'Pratinjau hasil scan'}</h2>
            <p>{format === 'pdf'
              ? (en ? 'One A4 PDF page with at least 10 mm of margin.' : 'Satu halaman PDF A4 dengan margin minimal 10 mm.')
              : `${outputs[0].width} × ${outputs[0].height} px · JPEG · ${sizeLabel(outputs[0].blob.size)}`}</p>
            {error && <p className="error" role="alert">{error}</p>}
            {resultPreviewReady && <p><a className="button download" href={outputs[0].url} download={`scan.${format === 'pdf' ? 'pdf' : 'jpg'}`}>{en ? `Download ${format === 'pdf' ? 'PDF' : 'JPG'}` : `Unduh ${format === 'pdf' ? 'PDF' : 'JPG'}`}</a></p>}
            <div className="controls">
              <button className="button secondary" type="button" onClick={() => { setError(''); setStage('review'); releaseOutputs(); }}>{en ? 'Adjust corners' : 'Perbaiki sudut'}</button>
              <button className="button secondary" type="button" onClick={reset}>{en ? 'Scan another page' : 'Scan halaman lain'}</button>
            </div>
            {resultPreviewReady && format === 'jpeg' && <WorkflowActions lang={lang} blob={outputs[0].blob} width={outputs[0].width} height={outputs[0].height} steps={[{ path: toolHref('photo-pdf', lang as 'id' | 'en'), id: 'Gabungkan ke PDF', en: 'Combine into a PDF' }, { path: toolHref('compress-image', lang as 'id' | 'en'), id: 'Kompres hasil scan', en: 'Compress the scan' }]} />}
          </div>
        </div>
      : <div className="scanner-workspace" data-stage={stage}>
          <div className="scanner-view">
            <div className="scanner-stage" ref={overlayRef} style={previewBox ? { aspectRatio: `${previewBox.aspect}` } : undefined}>
              {stage === 'live' && <video ref={videoRef} playsInline muted onCanPlay={() => setCameraReady(true)} aria-label={en ? 'Camera preview' : 'Pratinjau kamera'} />}
              {stage === 'review' && previewUrl && <img src={previewUrl} alt={en ? 'Document to scan' : 'Dokumen yang akan dipindai'} />}
              {stage === 'idle' && <div className="scanner-empty">
                <p>{en ? 'Point your camera at a page.' : 'Arahkan kamera ke halaman.'}</p>
                <p className="notice">{en ? 'The page edge is detected for you, then straightened.' : 'Tepi halaman dideteksi otomatis, lalu diluruskan.'}</p>
              </div>}

              {corners && frame && ((stage === 'live' && detected) || stage === 'review') && <svg className="scanner-quad" viewBox={`0 0 ${frame.width} ${frame.height}`} preserveAspectRatio="none" aria-hidden="true">
                <polygon points={corners.map(point => `${point.x},${point.y}`).join(' ')} />
              </svg>}

              {corners && stage === 'review' && corners.map((point, index) => <button
                key={index}
                type="button"
                className="scanner-corner"
                style={cornerStyle(point)}
                aria-label={en ? `Corner ${CORNER_LABELS[index]}, use arrow keys to move` : `Sudut ${CORNER_LABELS[index]}, gunakan tombol panah untuk menggeser`}
                onPointerDown={event => { event.currentTarget.setPointerCapture(event.pointerId); setDragging(index); }}
                onPointerMove={event => { if (dragging === index) moveCorner(index, event); }}
                onPointerUp={event => { if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); setDragging(null); }}
                onPointerCancel={() => setDragging(null)}
                onKeyDown={event => cornerFromKeyboard(index, event)}
              ><span aria-hidden="true">{index + 1}</span></button>)}
            </div>
            {notice && stage !== 'idle' && <p className="notice scanner-notice">{notice}</p>}
            {error && <p className="error" role="alert">{error}</p>}
          </div>

          <div className="scanner-side">
            {stage === 'idle' && <>
              <button className="button" type="button" disabled={busy} onClick={() => void startCamera()}>{en ? 'Open camera and scan' : 'Buka kamera dan scan'}</button>
              <label className="scanner-file">
                <span>{en ? 'Choose an existing photo' : 'Pilih foto yang sudah ada'}</span>
                <input aria-label={en ? 'Choose a document photo' : 'Pilih foto dokumen'} type="file" accept="image/jpeg,image/png,image/webp,image/heic" onChange={choose} disabled={busy} />
              </label>
              <p className="notice">{en ? 'Works with the rear camera on a phone. The page is straightened automatically, and you can drag the corners before saving.' : 'Bekerja dengan kamera belakang di ponsel. Halaman diluruskan otomatis, dan Anda bisa menggeser sudutnya sebelum menyimpan.'}</p>
            </>}

            {stage === 'live' && <>
              <button className="button" type="button" disabled={busy || !cameraReady} onClick={() => void capture()}>{en ? 'Capture page' : 'Ambil halaman'}</button>
              <button className="button secondary" type="button" disabled={busy} onClick={stopCamera}>{en ? 'Stop camera' : 'Hentikan kamera'}</button>
              <p className="notice">{detected
                ? (en ? 'Page detected. Hold still and capture.' : 'Halaman terdeteksi. Tahan diam lalu ambil.')
                : (en ? 'Fill the frame with the paper.' : 'Penuhi bingkai dengan kertas.')}</p>
            </>}

            {stage === 'review' && <>
              <button className="button" type="button" disabled={busy} onClick={() => void save()}>{busy ? (en ? 'Preparing…' : 'Menyiapkan…') : (en ? 'Preview scan' : 'Lihat pratinjau')}</button>
              <label className="scanner-field">{en ? 'Save as' : 'Simpan sebagai'}
                <select value={format} onChange={event => setFormat(event.target.value as 'jpeg' | 'pdf')} disabled={busy}>
                  <option value="jpeg">JPG</option>
                  <option value="pdf">PDF (A4)</option>
                </select>
              </label>
              <label className="scanner-check"><input type="checkbox" checked={enhance} onChange={event => setEnhance(event.target.checked)} disabled={busy} /> {en ? 'Brighten and balance colour' : 'Cerahkan dan seimbangkan warna'}</label>
              <p className="notice">{detected
                ? (en ? 'The outline was detected automatically. Drag any corner to correct it.' : 'Tepi terdeteksi otomatis. Geser sudut mana pun untuk mengoreksinya.')
                : (en ? 'Drag the four corners onto the paper corners.' : 'Geser keempat sudut ke sudut kertas.')}</p>
              <button className="button secondary" type="button" disabled={busy} onClick={reset}>{en ? 'Start over' : 'Mulai ulang'}</button>
            </>}
          </div>
        </div>}
  </div>;
}
