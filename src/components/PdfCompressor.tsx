import { useEffect, useRef, useState } from 'react';
import type { PDFDocumentLoadingTask, RenderTask } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { takeSessionFile } from '../engines/session-files';
import WorkflowActions from './WorkflowActions';
import { toolHref } from '../tool-links';

type Result = { url:string; blob:Blob; bytes:number; pages:number; met:boolean; quality:number; originalBytes:number };
const MAX_INPUT=20_000_000, MAX_PAGES=20, MAX_PIXELS=12_000_000, MAX_OUTPUT=100_000_000;
const qualities=[0.9,0.8,0.7,0.6,0.5,0.4,0.3,0.2];

export default function PdfCompressor({lang,initialTarget}:{lang:string;initialTarget:number}){
  const en=lang==='en';const [file,setFile]=useState<File|null>(null);const [target,setTarget]=useState(initialTarget);const [dpi,setDpi]=useState(96);
  const [consent,setConsent]=useState(false);const [busy,setBusy]=useState(false);const [progress,setProgress]=useState('');const [error,setError]=useState('');const [result,setResult]=useState<Result|null>(null);
  const generation=useRef(0);const loading=useRef<PDFDocumentLoadingTask|null>(null);const rendering=useRef<RenderTask|null>(null);
  useEffect(()=>{const incoming=takeSessionFile(location.pathname);if(incoming)setFile(incoming)},[]);
  useEffect(()=>()=>{if(result)URL.revokeObjectURL(result.url)},[result]);
  useEffect(()=>()=>{generation.current++;rendering.current?.cancel();void loading.current?.destroy()},[]);
  function invalidate(){generation.current++;setResult(null);setError('');setProgress('')}
  function cancel(){generation.current++;rendering.current?.cancel();void loading.current?.destroy();loading.current=null;rendering.current=null;setBusy(false);setProgress(en?'Cancelled.':'Dibatalkan.')}
  function reason(error:unknown){const code=error instanceof Error?error.message:'';
    if(code==='format')return en?'Choose a valid PDF file.':'Pilih berkas PDF yang valid.';
    if(code==='size')return en?'PDF exceeds 20 MB.':'PDF melebihi 20 MB.';
    if(code==='pages')return en?'PDF must have 1–20 pages.':'PDF harus memiliki 1–20 halaman.';
    if(code==='pixels')return en?'A page is too large at this resolution. Try a lower DPI.':'Halaman terlalu besar pada resolusi ini. Coba DPI lebih rendah.';
    if(code==='output')return en?'Output exceeds the 100 MB safety limit.':'Hasil melebihi batas 100 MB.';
    return en?'Could not process the PDF. It may be damaged, encrypted, or use unsupported features.':'PDF tidak dapat diproses. Berkas mungkin rusak, dilindungi sandi, atau memakai fitur yang belum didukung.';
  }
  async function compress(){
    if(!file||busy||!consent)return;
    if(!Number.isInteger(target)||target<1||target>20000){setError(en?'Enter a target from 1 to 20,000 KB.':'Masukkan target antara 1 dan 20.000 KB.');return}
    const id=++generation.current;setBusy(true);setError('');setResult(null);setProgress('');let task:PDFDocumentLoadingTask|undefined;
    try{
      if(file.size>MAX_INPUT)throw new Error('size');
      if(String.fromCharCode(...new Uint8Array(await file.slice(0,5).arrayBuffer()))!=='%PDF-')throw new Error('format');
      const [pdfjs,{PDFDocument}]=await Promise.all([import('pdfjs-dist'),import('pdf-lib')]);
      const data=new Uint8Array(await file.arrayBuffer());if(id!==generation.current)return;
      pdfjs.GlobalWorkerOptions.workerSrc=workerUrl;
      task=pdfjs.getDocument({data,enableXfa:false,disableFontFace:true,useSystemFonts:false,useWorkerFetch:true,useWasm:false,stopAtErrors:true,cMapUrl:'/pdfjs/cmaps/',cMapPacked:true,standardFontDataUrl:'/pdfjs/standard_fonts/'});
      loading.current=task;task.onPassword=()=>{void task?.destroy()};const source=await task.promise;
      if(source.numPages<1||source.numPages>MAX_PAGES)throw new Error('pages');
      let best:{bytes:Uint8Array;quality:number}|undefined;let smallest:{bytes:Uint8Array;quality:number}|undefined;
      for(let attempt=0;attempt<qualities.length;attempt++){
        if(id!==generation.current)return;const quality=qualities[attempt];const pdf=await PDFDocument.create();
        for(let number=1;number<=source.numPages;number++){
          if(id!==generation.current)return;const page=await source.getPage(number);const physical=page.getViewport({scale:1});const viewport=page.getViewport({scale:dpi/72});
          const width=Math.ceil(viewport.width),height=Math.ceil(viewport.height);
          if(width*height>MAX_PIXELS||width>8192||height>8192)throw new Error('pixels');
          const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;let renderTask:RenderTask|undefined;
          try{
            const ctx=canvas.getContext('2d');if(!ctx)throw new Error('canvas');ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height);
            renderTask=page.render({canvas,canvasContext:ctx,viewport,annotationMode:pdfjs.AnnotationMode.DISABLE,background:'#ffffff'});rendering.current=renderTask;await renderTask.promise;if(rendering.current===renderTask)rendering.current=null;
            const jpeg=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(value=>value?.type==='image/jpeg'?resolve(value):reject(new Error('encoder')),'image/jpeg',quality));
            if(id!==generation.current)return;const embedded=await pdf.embedJpg(await jpeg.arrayBuffer());const outputPage=pdf.addPage([physical.width,physical.height]);
            outputPage.drawImage(embedded,{x:0,y:0,width:physical.width,height:physical.height});
            setProgress(`${en?'Quality':'Kualitas'} ${Math.round(quality*100)}% · ${en?'page':'halaman'} ${number}/${source.numPages} · ${attempt+1}/${qualities.length}`);
          }finally{canvas.width=0;canvas.height=0;page.cleanup();if(rendering.current===renderTask)rendering.current=null}
        }
        const bytes=await pdf.save();if(bytes.byteLength>MAX_OUTPUT)throw new Error('output');
        if(!smallest||bytes.byteLength<smallest.bytes.byteLength)smallest={bytes,quality};
        if(bytes.byteLength<=target*1000&&(!best||quality>best.quality))best={bytes,quality};
      }
      if(id!==generation.current)return;const output=best??smallest;if(!output)throw new Error('empty');
      const blob=new Blob([output.bytes as BlobPart],{type:'application/pdf'});setResult({url:URL.createObjectURL(blob),blob,bytes:blob.size,pages:source.numPages,met:!!best,quality:output.quality,originalBytes:file.size});
      setProgress(en?'Finished.':'Selesai.');
    }catch(e){if(id===generation.current)setError(reason(e))}
    finally{await task?.destroy().catch(()=>{});if(id===generation.current){loading.current=null;rendering.current=null;setBusy(false)}}
  }
  return <section className="panel">
    <p className="local">{en?'Processed on your device. The PDF is not sent for processing.':'Diproses di perangkat Anda. PDF tidak dikirim untuk pemrosesan.'}</p>
    <label>{en?'Choose a PDF (up to 20 MB and 20 pages)':'Pilih PDF (maks. 20 MB dan 20 halaman)'} <input type="file" accept="application/pdf" disabled={busy} onChange={e=>{invalidate();setFile(e.target.files?.[0]??null);setConsent(false)}}/></label>
    <p className="notice">{en?'The output is rebuilt from page images. Searchable text, vectors, forms, links and annotations are removed. Keep the original PDF.':'Hasil dibuat ulang dari gambar halaman. Teks yang dapat dicari, vektor, formulir, tautan, dan anotasi akan hilang. Simpan PDF asli.'}</p>
    <label><input type="checkbox" checked={consent} disabled={busy} onChange={e=>{invalidate();setConsent(e.target.checked)}}/> {en?'I understand the PDF will be rasterized.':'Saya memahami PDF akan diubah menjadi gambar.'}</label>
    <div className="controls" style={{marginTop:20}}><label>{en?'Target (KB)':'Target (KB)'}<input type="number" min="1" max="20000" value={target} disabled={busy} onChange={e=>{invalidate();setTarget(Number(e.target.value))}}/></label><label>{en?'Resolution (DPI)':'Resolusi (DPI)'}<select value={dpi} disabled={busy} onChange={e=>{invalidate();setDpi(Number(e.target.value))}}><option value="72">72</option><option value="96">96</option><option value="144">144</option></select></label><button className="button" disabled={!file||!consent||busy} onClick={()=>void compress()}>{en?'Compress PDF':'Kompres PDF'}</button>{busy&&<button className="button secondary" onClick={cancel}>{en?'Cancel':'Batalkan'}</button>}</div>
    <p className="notice">{en?'1 KB = 1,000 bytes. The tool tries eight JPEG qualities at the selected resolution; it does not guarantee the target.':'1 KB = 1.000 byte. Alat mencoba delapan kualitas JPEG pada resolusi yang dipilih; target tidak selalu dapat dicapai.'}</p><p aria-live="polite">{progress}</p>
    {error&&<p role="alert" className="error">{error}</p>}
    {result&&<div className="result" aria-live="polite"><h2>{result.met?(en?'Target reached':'Target tercapai'):(en?'Target not reached':'Target belum tercapai')}</h2><p>{en?'Original':'Asli'}: {result.originalBytes.toLocaleString(en?'en':'id')} bytes → {result.bytes.toLocaleString(en?'en':'id')} bytes · {result.pages} {en?'pages':'halaman'} · JPEG {Math.round(result.quality*100)}%</p>{!result.met&&<p>{en?'This is the smallest result found at the chosen resolution. Try a larger target or lower DPI.':'Ini hasil terkecil yang ditemukan pada resolusi yang dipilih. Coba target lebih besar atau DPI lebih rendah.'}</p>}<p><a className="button download" href={result.url} download="compressed.pdf">{en?'Download PDF':'Unduh PDF'}</a></p><WorkflowActions lang={lang} blob={result.blob} steps={[{path:toolHref('pdf-jpg',lang as 'id'|'en'),id:'Ubah PDF ke JPG',en:'Convert PDF to JPG'}]}/></div>}
  </section>;
}
