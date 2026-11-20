import { useEffect, useRef, useState } from 'react';
import WorkflowActions from './WorkflowActions';
import {takeSessionFile} from '../engines/session-files';
import {setPngPrintDensity} from '../engines/png-density';
import {drawResized} from '../engines/resize-render';
import {readImageBlobHeader} from '../engines/image-header';
import { toolHref } from '../tool-links';

type Preset = { width: number; height: number; name: string; dpi?: number };
const presets: Record<string, Preset> = {
  custom: { width: 1080, height: 1080, name: 'Custom size' },
  '2x3': { width: 236, height: 354, name: '2 × 3 cm @ 300 DPI', dpi: 300 },
  '3x4': { width: 354, height: 472, name: '3 × 4 cm @ 300 DPI', dpi: 300 },
  '35x45': { width: 413, height: 531, name: '35 × 45 mm @ 300 DPI', dpi: 300 },
  '4x6': { width: 472, height: 709, name: '4 × 6 cm @ 300 DPI', dpi: 300 },
  '4r': { width: 1200, height: 1800, name: '4R · 4 × 6 in @ 300 DPI', dpi: 300 },
  'a4': { width: 2480, height: 3508, name: 'A4 · 210 × 297 mm @ 300 DPI', dpi: 300 },
  'passport-2x2': { width: 600, height: 600, name: '2 × 2 in @ 300 DPI', dpi: 300 },
  '1x1': { width: 1080, height: 1080, name: 'Marketplace 1:1' },
  'story': { width: 1080, height: 1920, name: 'Story 9:16' },
  'instagram-feed': { width: 1080, height: 1350, name: 'Instagram feed portrait 4:5 · 1080 × 1350 px' },
  'whatsapp-profile': { width: 640, height: 640, name: 'WhatsApp profile photo 1:1' },
  'youtube-banner': { width: 2560, height: 1440, name: 'YouTube channel banner' },
};
export default function ResizeStudio({ lang, preset = '3x4' }: { lang: string; preset?: string }) {
  const en = lang === 'en'; const initial = presets[preset] ?? presets.custom;
  const [quickPreset,setQuickPreset]=useState(presets[preset]?preset:'custom');
  const [selectedPreset,setSelectedPreset]=useState(initial);
  const [file, setFile] = useState<File | null>(null); const [widthText,setWidthText]=useState(String(initial.width));const [heightText,setHeightText]=useState(String(initial.height));
  const [sourceSize,setSourceSize]=useState<{file:File;width:number;height:number}|null>(null);
  const [mode, setMode] = useState<'crop'|'contain'>('crop');
  const [focusX,setFocusX]=useState(50);const [focusY,setFocusY]=useState(50);
  const circle=quickPreset==='whatsapp-profile';
  const [out, setOut] = useState<{ blob: Blob; url: string; width: number; height: number } | null>(null); const [error, setError] = useState('');
  const generation=useRef(0);const previewImage=useRef<ImageBitmap|null>(null);const previewCanvas=useRef<HTMLCanvasElement|null>(null);const drag=useRef<{x:number;y:number;focusX:number;focusY:number}|null>(null);
  useEffect(() => () => { generation.current++; }, []);
  useEffect(() => () => { if (out) URL.revokeObjectURL(out.url); }, [out]);
  function invalidate(){generation.current++;setOut(null);}
  function choosePreset(key:string){const next=presets[key]??presets.custom;invalidate();setQuickPreset(key);setSelectedPreset(next);if(key!=='custom'){setWidthText(String(next.width));setHeightText(String(next.height));}setFocusX(50);setFocusY(50);setError('')}
  useEffect(() => { const incoming=takeSessionFile(location.pathname); if(incoming)setFile(incoming); }, []);
  useEffect(()=>{let cancelled=false;let loaded:ImageBitmap|null=null;setSourceSize(null);if(file&&file.size<=20_000_000)void readImageBlobHeader(file).then(header=>{if(!header||header.width*header.height>40_000_000)throw new Error('pixel-limit');return createImageBitmap(file,{imageOrientation:'from-image'})}).then(image=>{if(!cancelled&&image.width*image.height<=40_000_000){loaded=image;previewImage.current=image;setSourceSize({file,width:image.width,height:image.height})}else image.close()}).catch(()=>{});return()=>{cancelled=true;if(previewImage.current===loaded)previewImage.current=null;loaded?.close()}},[file]);
  const source=sourceSize?.file===file?sourceSize:null;
  const w=Number(widthText), h=Number(heightText);
  const validSize=Number.isInteger(w)&&Number.isInteger(h)&&w>=1&&h>=1&&w<=5000&&h<=5000;
  const grows = source && validSize && (mode === 'crop' || circle ? Math.max : Math.min)(w / source.width, h / source.height) > 1.01;
  useEffect(()=>{
    const canvas=previewCanvas.current,image=previewImage.current;
    if(!canvas||!image||!source||!validSize)return;
    const scale=Math.min(1,600/Math.max(w,h));
    canvas.width=Math.max(1,Math.round(w*scale));
    canvas.height=Math.max(1,Math.round(h*scale));
    const ctx=canvas.getContext('2d');
    if(ctx)drawResized(ctx,image,canvas.width,canvas.height,{mode,circle,x:focusX,y:focusY});
  },[source,w,h,validSize,mode,circle,focusX,focusY]);
  async function render() {
    setError(''); invalidate(); const job=generation.current;
    if (!file) return;
    if (file.size > 20_000_000) { setError(en?'File exceeds 20 MB.':'Berkas melebihi 20 MB.'); return; }
    if (!validSize) { setError(en?'Enter whole dimensions between 1 and 5,000 px.':'Masukkan dimensi bulat antara 1 dan 5.000 px.'); return; }
    let bitmap: ImageBitmap|undefined;
    try {
      const bytes=new Uint8Array(await file.slice(0,12).arrayBuffer());
      const jpeg=bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff;
      const png=[137,80,78,71,13,10,26,10].every((value,index)=>bytes[index]===value);
      const webp=String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP';
      if(!jpeg&&!png&&!webp) throw new Error(en?'Choose a valid JPEG, PNG or WebP image.':'Pilih gambar JPEG, PNG, atau WebP yang valid.');
      const header=await readImageBlobHeader(file);if(!header||header.width*header.height>40_000_000)throw new Error(en?'Image exceeds 40 megapixels or has an invalid header.':'Gambar melebihi 40 megapiksel atau memiliki header yang tidak valid.');
      bitmap=await createImageBitmap(file,{imageOrientation:'from-image'});
      if(bitmap.width*bitmap.height>40_000_000) throw new Error(en?'Image exceeds 40 megapixels.':'Gambar melebihi 40 megapiksel.');
      const canvas=document.createElement('canvas'); canvas.width=w;canvas.height=h; const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Canvas unavailable');
      drawResized(ctx,bitmap,w,h,{mode,circle,x:focusX,y:focusY});
      const pngBlob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('Unable to encode image.')),'image/png'));
      const blob=selectedPreset.dpi ? await setPngPrintDensity(pngBlob,selectedPreset.dpi) : pngBlob;
      if(job===generation.current)setOut({blob,url:URL.createObjectURL(blob),width:w,height:h});
    }catch(e){if(job===generation.current)setError(e instanceof Error?e.message:'Unable to process image.');}finally{bitmap?.close();}
  }
  return <section className="panel"><p className="local">{en?'Processed on your device.':'Diproses di perangkat Anda.'}</p>{quickPreset!=='custom'&&<p className="notice">{selectedPreset.name}</p>}{quickPreset==="youtube-banner"&&<p className="notice">{en?"The outlined center area marks the YouTube banner safe zone at minimum resolution.":"Bingkai tengah menunjukkan area aman banner YouTube pada resolusi minimum."}</p>}{quickPreset==="whatsapp-profile"&&<p className="notice">{en?"WhatsApp recommends at least 192 × 192 px for profile photos. This preset outputs 640 × 640 px. Keep important details inside the circular guide because the app crops profile photos.":"WhatsApp menyarankan foto profil minimal 192 × 192 px. Preset ini menghasilkan 640 × 640 px. Letakkan detail penting di dalam panduan lingkaran karena aplikasi memotong foto profil."}</p>}<label>{en?"Quick size":"Ukuran cepat"}<select value={quickPreset} onChange={e=>choosePreset(e.target.value)}><option value="custom">{en?"Custom dimensions":"Dimensi khusus"}</option><option value="2x3">{en?"Passport photo 2 × 3 cm":"Pas foto 2 × 3 cm"}</option><option value="3x4">{en?"Passport photo 3 × 4 cm":"Pas foto 3 × 4 cm"}</option><option value="4x6">{en?"Passport photo 4 × 6 cm":"Pas foto 4 × 6 cm"}</option><option value="35x45">{en?"Passport photo 35 × 45 mm":"Pas foto 35 × 45 mm"}</option><option value="passport-2x2">{en?"Passport photo 2 × 2 in":"Paspor 2 × 2 inci"}</option><option value="4r">4R</option><option value="a4">A4</option><option value="1x1">{en?"Marketplace square 1:1":"Persegi marketplace 1:1"}</option><option value="story">Instagram Story 9:16</option><option value="instagram-feed">Instagram Feed 4:5</option><option value="whatsapp-profile">WhatsApp profile 1:1</option><option value="youtube-banner">YouTube banner</option></select></label><label className="drop">{en?'Choose an image (JPEG, PNG, WebP; max 20 MB)':'Pilih gambar (JPEG, PNG, WebP; maks. 20 MB)'}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>{invalidate();setFile(e.target.files?.[0]??null);setFocusX(50);setFocusY(50);setError('')}}/></label>{file&&<p>{en?'Selected image':'Gambar dipilih'}: {file.name}</p>}<div className="resize-workbench">
<div className="resize-options">
  {quickPreset==='custom'&&<div className="resize-dimensions">
    <label>{en?'Width (px)':'Lebar (px)'}<input type="number" inputMode="numeric" min="1" max="5000" value={widthText} onChange={e=>{invalidate();setWidthText(e.target.value)}}/></label>
    <label>{en?'Height (px)':'Tinggi (px)'}<input type="number" inputMode="numeric" min="1" max="5000" value={heightText} onChange={e=>{invalidate();setHeightText(e.target.value)}}/></label>
  </div>}
  {source&&!circle&&<label>{en?'Fit':'Penyesuaian'}<select value={mode} onChange={e=>{invalidate();setMode(e.target.value as typeof mode)}}><option value="crop">{en?'Fill and crop':'Penuhi dan potong'}</option><option value="contain">{en?'Fit whole image':'Muat gambar utuh'}</option></select></label>}
  <p className="notice" data-resize-size>{validSize ? `${w} × ${h} px · PNG` : (en?'Enter a valid size.':'Masukkan ukuran yang valid.')}</p>
  {grows&&<p className="notice">{en?'This size enlarges the source. Use a higher resolution photo for sharper detail.':'Ukuran ini memperbesar sumber. Gunakan foto beresolusi lebih tinggi agar detail lebih tajam.'}</p>}
  <button className="button" disabled={!file||!validSize} onClick={render}>{en?'Create image':'Buat gambar'}</button>
</div>{source&&Number.isInteger(w)&&Number.isInteger(h)&&w>=1&&h>=1&&w<=5000&&h<=5000&&<div className="crop-editor"><h2>{en?'Crop preview':'Pratinjau crop'}</h2><p className="notice">{en?'Drag the photo to reposition the crop. You can also use the arrow keys.':'Geser foto untuk mengatur potongan, atau gunakan tombol panah.'}</p><div className={`crop-preview${quickPreset==="youtube-banner"?" crop-preview-youtube":""}`} style={{touchAction:mode==='crop'||circle?'none':'auto',cursor:mode==='crop'||circle?'grab':'default'}} role="group" tabIndex={mode==="crop"||circle?0:undefined} aria-label={en?"Crop position":"Posisi crop"} onKeyDown={e=>{if(mode!=="crop"&&!circle)return;const delta={ArrowLeft:[5,0],ArrowRight:[-5,0],ArrowUp:[0,5],ArrowDown:[0,-5]}[e.key];if(!delta)return;e.preventDefault();invalidate();setFocusX(x=>Math.max(0,Math.min(100,x+delta[0])));setFocusY(y=>Math.max(0,Math.min(100,y+delta[1])));}} onPointerDown={e=>{if(mode!=='crop'&&!circle)return;drag.current={x:e.clientX,y:e.clientY,focusX,focusY};e.currentTarget.setPointerCapture(e.pointerId)}} onPointerMove={e=>{if(!drag.current||!e.currentTarget.hasPointerCapture(e.pointerId))return;const rect=e.currentTarget.getBoundingClientRect();invalidate();setFocusX(Math.max(0,Math.min(100,drag.current.focusX-(e.clientX-drag.current.x)/rect.width*100)));setFocusY(Math.max(0,Math.min(100,drag.current.focusY-(e.clientY-drag.current.y)/rect.height*100)))}} onPointerUp={e=>{drag.current=null;if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId)}} onPointerCancel={()=>{drag.current=null}}><canvas ref={previewCanvas} role="img" aria-label={en?'Crop output preview':'Pratinjau hasil crop'}/>{(mode==='crop'||circle)&&<span className={`crop-guides${quickPreset==="whatsapp-profile"?" crop-guides-circle":""}`} aria-hidden="true"/>}</div></div>}</div>{error&&<p role="alert" className="error">{error}</p>}{out&&<div className="result"><p>{out.width} × {out.height} px · PNG · {out.blob.size.toLocaleString(en?'en':'id')} bytes</p><img src={out.url} alt={en?'Resized preview':'Pratinjau hasil resize'} width={out.width} height={out.height}/><p><a className="button download" href={out.url} download="doculven.png">{en?'Download PNG':'Unduh PNG'}</a></p></div>}{out&&<WorkflowActions lang={lang} blob={out.blob} width={out.width} height={out.height} steps={[{path:toolHref('compress-image',lang as 'id'|'en'),id:'Kompres 200 KB',en:'Compress to 200 KB'},{path:toolHref('print',lang as 'id'|'en'),id:'Cetak 4R',en:'Print 4R'}]}/>}<p className="notice">{en?'Print presets store 300 DPI in the PNG. Print at actual size and check the recipient’s requirements.':'Preset cetak menyimpan 300 DPI pada PNG. Cetak pada ukuran asli dan cek ketentuan penerima.'}</p></section>;
}
