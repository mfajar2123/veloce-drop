import { useEffect, useRef, useState } from 'react';
import type { PDFDocumentLoadingTask, RenderTask } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { takeSessionFile } from '../engines/session-files';
import WorkflowActions from './WorkflowActions';

type Output = { page:number; url:string; bytes:number; width:number; height:number; blob:Blob };
type Archive = { url:string; bytes:number };
const MAX_BYTES=20_000_000, MAX_PAGES=30, MAX_PIXELS=16_000_000, MAX_OUTPUT_BYTES=100_000_000;

function parsePages(value:string,total:number):number[]{
  if(!value.trim())return Array.from({length:total},(_,i)=>i+1);
  const pages=new Set<number>();
  for(const part of value.split(',')){
    const match=part.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/);if(!match)throw new Error('pages');
    const from=Number(match[1]),to=match[2]?Number(match[2]):from;
    if(from<1||to>total||from>to)throw new Error('pages');
    for(let i=from;i<=to;i++)pages.add(i);
  }
  return [...pages].sort((a,b)=>a-b);
}

export default function PdfToImages({lang}:{lang:string}){
  const en=lang==='en';const [file,setFile]=useState<File|null>(null);const [count,setCount]=useState(0);const [pages,setPages]=useState('');
  const [dpi,setDpi]=useState(144);const [quality,setQuality]=useState(90);const [busy,setBusy]=useState(false);const [progress,setProgress]=useState('');
  const [outputs,setOutputs]=useState<Output[]>([]);const [archive,setArchive]=useState<Archive|null>(null);const [errors,setErrors]=useState<string[]>([]);
  const generation=useRef(0);const loading=useRef<PDFDocumentLoadingTask|null>(null);const rendering=useRef<RenderTask|null>(null);const alive=useRef(true);
  const outputUrls=useRef(new Set<string>());
  useEffect(()=>{const incoming=takeSessionFile(location.pathname);if(incoming)void choose(incoming)},[]);
  function clearOutputs(){for(const url of outputUrls.current)URL.revokeObjectURL(url);outputUrls.current.clear();setOutputs([]);setArchive(null)}
  useEffect(()=>{alive.current=true;return()=>{alive.current=false;generation.current++;rendering.current?.cancel();void loading.current?.destroy();for(const url of outputUrls.current)URL.revokeObjectURL(url);outputUrls.current.clear()}},[]);
  function cancel(){generation.current++;rendering.current?.cancel();void loading.current?.destroy();rendering.current=null;loading.current=null;clearOutputs();setBusy(false);setProgress(en?'Cancelled.':'Dibatalkan.');}
  async function openPdf(selected:File,id:number,onTask:(task:PDFDocumentLoadingTask)=>void){
    if(selected.size>MAX_BYTES)throw new Error('size');
    const header=new Uint8Array(await selected.slice(0,5).arrayBuffer());if(String.fromCharCode(...header)!=='%PDF-')throw new Error('format');
    const pdfjs=await import('pdfjs-dist');pdfjs.GlobalWorkerOptions.workerSrc=workerUrl;
    if(id!==generation.current)throw new Error('cancelled');
    const data=new Uint8Array(await selected.arrayBuffer());if(id!==generation.current)throw new Error('cancelled');
    const task=pdfjs.getDocument({data,enableXfa:false,disableFontFace:true,useSystemFonts:false,useWorkerFetch:true,useWasm:false,stopAtErrors:true,cMapUrl:'/pdfjs/cmaps/',cMapPacked:true,standardFontDataUrl:'/pdfjs/standard_fonts/'});
    onTask(task);loading.current=task;
    // Do not prompt for passwords; encrypted documents are reported as unsupported.
    task.onPassword=()=>{void task.destroy()};
    const doc=await task.promise;
    if(doc.numPages>MAX_PAGES)throw new Error('count');
    return {pdfjs,doc,task};
  }
  function message(error:unknown){const name=error instanceof Error?error.name:'';const code=error instanceof Error?error.message:'';
    if(code==='size')return en?'PDF exceeds 20 MB.':'PDF melebihi 20 MB.';
    if(code==='count')return en?'PDF exceeds 30 pages.':'PDF melebihi 30 halaman.';
    if(code==='format')return en?'Choose a valid PDF file.':'Pilih berkas PDF yang valid.';
    if(code==='pages')return en?'Enter valid page numbers, for example 1,3-5.':'Masukkan nomor halaman yang valid, misalnya 1,3-5.';
    if(name==='PasswordException')return en?'Encrypted PDFs are not supported.':'PDF yang dilindungi sandi belum didukung.';
    return en?'Could not read this PDF. It may be damaged or password protected.':'PDF tidak dapat dibaca. Berkas mungkin rusak atau dilindungi sandi.';
  }
  async function choose(selected?:File){
    generation.current++;const id=generation.current;rendering.current?.cancel();void loading.current?.destroy();loading.current=null;clearOutputs();setCount(0);setFile(null);setErrors([]);setProgress('');setPages('');
    if(!selected){setBusy(false);return}setBusy(true);
    let task:PDFDocumentLoadingTask|undefined;
    try{const opened=await openPdf(selected,id,value=>{task=value});if(id===generation.current){setFile(selected);setCount(opened.doc.numPages)}}
    catch(error){if(id===generation.current)setErrors([message(error)])}
    finally{await task?.destroy().catch(()=>{});if(id===generation.current){loading.current=null;setBusy(false)}}
  }
  async function convert(){
    if(!file||busy)return;let selected:number[];
    try{selected=parsePages(pages,count)}catch(error){setErrors([message(error)]);return}
    generation.current++;const id=generation.current;setBusy(true);setErrors([]);setProgress('');clearOutputs();const created:Output[]=[];const failures:string[]=[];let totalBytes=0;let task:PDFDocumentLoadingTask|undefined;
    try{
      const {pdfjs,doc}=await openPdf(file,id,value=>{task=value});
      for(let index=0;index<selected.length;index++){
        if(id!==generation.current)break;const number=selected[index];let canvas:HTMLCanvasElement|undefined;
        try{
          const page=await doc.getPage(number);const viewport=page.getViewport({scale:dpi/72});const width=Math.ceil(viewport.width),height=Math.ceil(viewport.height);
          if(width*height>MAX_PIXELS||width>8192||height>8192)throw new Error('pixels');
          canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const ctx=canvas.getContext('2d');if(!ctx)throw new Error('canvas');
          ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height);
          const render=page.render({canvas,canvasContext:ctx,viewport,annotationMode:pdfjs.AnnotationMode.DISABLE,background:'#ffffff'});rendering.current=render;await render.promise;rendering.current=null;
          const blob=await new Promise<Blob>((resolve,reject)=>canvas!.toBlob(value=>value?.type==='image/jpeg'?resolve(value):reject(new Error('encoder')),'image/jpeg',quality/100));
          page.cleanup();if(id!==generation.current)break;
          totalBytes+=blob.size;if(totalBytes>MAX_OUTPUT_BYTES)throw new Error('total');
          const url=URL.createObjectURL(blob);outputUrls.current.add(url);created.push({page:number,url,bytes:blob.size,width,height,blob});
        }catch(error){if(id!==generation.current)break;const reason=error instanceof Error&&error.message==='pixels'?(en?'page is too large at this resolution':'halaman terlalu besar pada resolusi ini'):error instanceof Error&&error.message==='total'?(en?'total output exceeds 100 MB':'total hasil melebihi 100 MB'):(en?'rendering failed':'gagal dirender');failures.push(`${en?'Page':'Halaman'} ${number}: ${reason}`);if(error instanceof Error&&error.message==='total')break}
        finally{if(canvas){canvas.width=0;canvas.height=0}rendering.current=null}
        if(id===generation.current)setProgress(`${index+1}/${selected.length}`);
      }
      if(id===generation.current&&created.length>1){
        const {zipSync}=await import('fflate');const entries:Record<string,Uint8Array>={};
        for(const item of created)entries[`page-${String(item.page).padStart(3,'0')}.jpg`]=new Uint8Array(await item.blob.arrayBuffer());
        const bytes=zipSync(entries,{level:0});if(id===generation.current){const blob=new Blob([bytes as BlobPart],{type:'application/zip'});const url=URL.createObjectURL(blob);outputUrls.current.add(url);setArchive({url,bytes:blob.size})}
      }
      if(id===generation.current){setOutputs(created);setErrors(failures)}
    }catch(error){if(id===generation.current){setOutputs(created);setErrors([...failures,message(error)])}}
    finally{await task?.destroy().catch(()=>{});if(id===generation.current){loading.current=null;rendering.current=null;setBusy(false)}}
  }
  return <section className="panel"><p className="local">{en?'Processed on your device. The PDF is not sent for processing.':'Diproses di perangkat Anda. PDF tidak dikirim untuk pemrosesan.'}</p>
    <label>{en?'Choose a PDF (up to 20 MB and 30 pages)':'Pilih PDF (maks. 20 MB dan 30 halaman)'} <input type="file" accept="application/pdf" disabled={busy} onChange={e=>void choose(e.target.files?.[0])}/></label>
    {file&&<><p>{file.name} · {count} {en?'pages':'halaman'}</p><div className="controls"><label>{en?'Pages (empty = all)':'Halaman (kosong = semua)'}<input type="text" maxLength={120} placeholder="1,3-5" value={pages} disabled={busy} onChange={e=>{setPages(e.target.value);clearOutputs()}}/></label><label>{en?'Resolution (DPI)':'Resolusi (DPI)'}<select value={dpi} disabled={busy} onChange={e=>{setDpi(Number(e.target.value));clearOutputs()}}><option value="72">72</option><option value="144">144</option><option value="200">200</option></select></label><label>{en?'JPEG quality (%)':'Kualitas JPEG (%)'}<input type="number" min="1" max="100" disabled={busy} value={quality} onChange={e=>{setQuality(Math.max(1,Math.min(100,Number(e.target.value)||1)));clearOutputs()}}/></label><button className="button" disabled={busy} onClick={()=>void convert()}>{en?'Convert pages':'Konversi halaman'}</button></div></>}
    {busy&&<button className="button secondary" style={{marginTop:16}} onClick={cancel}>{en?'Cancel':'Batalkan'}</button>}
    <p aria-live="polite">{progress}</p><p className="notice">{en?'Pages render one at a time. Annotations and interactive elements are not included. Large pages may require a lower resolution.':'Halaman dirender satu per satu. Anotasi dan elemen interaktif tidak disertakan. Halaman besar mungkin memerlukan resolusi lebih rendah.'}</p>
    {errors.length>0&&<div role="alert" className="error"><ul>{errors.map((error,index)=><li key={index}>{error}</li>)}</ul></div>}
    {outputs.length>0&&<div className="result"><h2>{en?'Converted pages':'Halaman hasil'}</h2>{archive&&<p><a className="button download" href={archive.url} download="pages.zip">{en?'Download ZIP':'Unduh ZIP'} ({archive.bytes.toLocaleString(en?'en':'id')} bytes)</a></p>}<ul>{outputs.map(item=><li key={item.page}><p>{en?'Page':'Halaman'} {item.page} · {item.width} × {item.height} px · {item.bytes.toLocaleString(en?'en':'id')} bytes</p><img src={item.url} alt={`${en?'Page':'Halaman'} ${item.page}`} loading="lazy" width={item.width} height={item.height}/><p><a className="button download" href={item.url} download={`page-${String(item.page).padStart(3,'0')}.jpg`}>{en?'Download page':'Unduh halaman'} {item.page}</a></p></li>)}</ul><WorkflowActions lang={lang} blob={outputs[0].blob} width={outputs[0].width} height={outputs[0].height} steps={[{path:en?'/en/ukuran/resize-image/':'/id/ukuran/ubah-ukuran-gambar/',id:'Atur ukuran JPG',en:'Resize this JPG'},{path:en?'/en/compress-image/':'/id/kompres-foto/',id:'Kompres JPG',en:'Compress this JPG'}]}/></div>}
  </section>;
}
