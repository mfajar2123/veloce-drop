import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import {takeSessionFile} from '../engines/session-files';
import WorkflowActions from './WorkflowActions';
import { toolHref } from '../tool-links';
import {readImageBlobHeader} from '../engines/image-header';

type Item = { id: number; file: File; preview: string; width: number; height: number; rotation: number };
type Result = { url: string; blob: Blob; bytes: number; pages: number };
const MAX_FILES=20, MAX_FILE_BYTES=20_000_000, MAX_TOTAL_BYTES=100_000_000, MAX_PIXELS=20_000_000;
const mm=(value:number)=>value*72/25.4;
const paper: Record<string,[number,number]>={a4:[mm(210),mm(297)],f4:[mm(210),mm(330)],letter:[612,792]};

async function bitmapFromFile(file:File):Promise<ImageBitmap>{
  const header=await readImageBlobHeader(file);
  if(!header)throw new Error('format');if(header.width*header.height>MAX_PIXELS)throw new Error('pixels');
  const bitmap=await createImageBitmap(file,{imageOrientation:'from-image'});
  if(bitmap.width*bitmap.height>MAX_PIXELS){bitmap.close();throw new Error('pixels')}
  return bitmap;
}
async function toBlob(canvas:HTMLCanvasElement):Promise<Blob>{return new Promise((resolve,reject)=>canvas.toBlob(value=>value?.type==='image/png'?resolve(value):reject(new Error('encode')),'image/png'))}

export default function PhotoPdfStudio({lang}:{lang:string}){
  const en=lang==='en';const [items,setItems]=useState<Item[]>([]);const [errors,setErrors]=useState<string[]>([]);
  const [size,setSize]=useState('a4');const [orientation,setOrientation]=useState('portrait');const margin=10;
  const [result,setResult]=useState<Result|null>(null);const [busy,setBusy]=useState(false);const [progress,setProgress]=useState(0);
  const previews=useRef(new Set<string>());const nextId=useRef(0);const dragId=useRef<number|null>(null);const alive=useRef(true);
  useEffect(()=>{alive.current=true;return()=>{alive.current=false;for(const url of previews.current)URL.revokeObjectURL(url);previews.current.clear()}},[]);
  useEffect(()=>()=>{if(result)URL.revokeObjectURL(result.url)},[result]);
  function invalidate(){setResult(null)}
  useEffect(()=>{const incoming=takeSessionFile(location.pathname);if(incoming)void addFiles([incoming])},[]);
  async function add(event:ChangeEvent<HTMLInputElement>){const selected=Array.from(event.target.files??[]);event.target.value='';await addFiles(selected)}
  async function addFiles(selected:File[]){
    if(!selected.length||busy)return;
    setBusy(true);setErrors([]);invalidate();const added:Item[]=[];const problems:string[]=[];
    let total=items.reduce((sum,item)=>sum+item.file.size,0);
    try{
      for(const file of selected){
        if(items.length+added.length>=MAX_FILES){problems.push(en?'Maximum 20 images.':'Maksimal 20 gambar.');break}
        if(file.size>MAX_FILE_BYTES||total+file.size>MAX_TOTAL_BYTES){problems.push(`${file.name}: ${en?'file or total size exceeds limit':'ukuran berkas atau total melebihi batas'}`);continue}
        let bitmap:ImageBitmap|undefined;
        try{
          bitmap=await bitmapFromFile(file);const canvas=document.createElement('canvas');const scale=Math.min(1,160/Math.max(bitmap.width,bitmap.height));
          canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
          const ctx=canvas.getContext('2d');if(!ctx)throw new Error('canvas');ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
          const thumbnail=await toBlob(canvas);if(!alive.current)break;const url=URL.createObjectURL(thumbnail);previews.current.add(url);
          added.push({id:++nextId.current,file,preview:url,width:bitmap.width,height:bitmap.height,rotation:0});total+=file.size;
        }catch{problems.push(`${file.name}: ${en?'unsupported, corrupt, or exceeds 20 megapixels':'format tidak didukung, rusak, atau melebihi 20 megapiksel'}`)}finally{bitmap?.close()}
      }
      if(alive.current){setItems(previous=>[...previous,...added]);setErrors(problems)}
    }finally{if(alive.current)setBusy(false)}
  }
  function remove(id:number){const item=items.find(value=>value.id===id);if(item){URL.revokeObjectURL(item.preview);previews.current.delete(item.preview)}setItems(previous=>previous.filter(value=>value.id!==id));invalidate()}
  function move(index:number,offset:number){const target=index+offset;if(target<0||target>=items.length)return;const next=[...items];[next[index],next[target]]=[next[target],next[index]];setItems(next);invalidate()}
  function reorder(from:number,to:number){if(from===to||from<0||to<0)return;const next=[...items];const [item]=next.splice(from,1);next.splice(to,0,item);setItems(next);invalidate()}
  async function create(){
    if(!items.length||busy)return;setBusy(true);setProgress(0);setErrors([]);invalidate();
    try{
      const {PDFDocument}=await import('pdf-lib');const pdf=await PDFDocument.create();
      for(let index=0;index<items.length;index++){
        if(!alive.current)return;
        const item=items[index];const image=await bitmapFromFile(item.file);
        try{
          const rotated=item.rotation%180!==0;const canvas=document.createElement('canvas');canvas.width=rotated?image.height:image.width;canvas.height=rotated?image.width:image.height;
          const ctx=canvas.getContext('2d');if(!ctx)throw new Error('canvas');ctx.translate(canvas.width/2,canvas.height/2);ctx.rotate(item.rotation*Math.PI/180);ctx.drawImage(image,-image.width/2,-image.height/2);
          const png=await toBlob(canvas);const embedded=await pdf.embedPng(await png.arrayBuffer());
          let pageWidth:number,pageHeight:number;
          if(size==='image'){pageWidth=canvas.width*0.75;pageHeight=canvas.height*0.75;}
          else {const [short,long]=paper[size];[pageWidth,pageHeight]=orientation==='landscape'?[long,short]:[short,long]}
          const padding=mm(margin);if(pageWidth<=2*padding||pageHeight<=2*padding)throw new Error('margin');
          const scale=Math.min((pageWidth-2*padding)/canvas.width,(pageHeight-2*padding)/canvas.height);
          const width=canvas.width*scale,height=canvas.height*scale;const page=pdf.addPage([pageWidth,pageHeight]);
          page.drawImage(embedded,{x:(pageWidth-width)/2,y:(pageHeight-height)/2,width,height});if(alive.current)setProgress(index+1);
        }finally{image.close()}
      }
      const bytes=await pdf.save();if(alive.current){const blob=new Blob([bytes as BlobPart],{type:'application/pdf'});setResult({url:URL.createObjectURL(blob),blob,bytes:blob.size,pages:items.length})}
    }catch(error){if(alive.current)setErrors([error instanceof Error&&error.message==='margin'?(en?'Margin is too large for this page.':'Margin terlalu besar untuk halaman ini.'):(en?'Could not create the PDF. Check the images and try again.':'PDF tidak dapat dibuat. Periksa gambar dan coba lagi.')])}
    finally{if(alive.current)setBusy(false)}
  }
  return <section className="panel">
    <p className="local">{en?'Processed on your device. Files are not sent for processing.':'Diproses di perangkat Anda. Berkas tidak dikirim untuk pemrosesan.'}</p>
    <label>{en?'Add JPEG, PNG or WebP images':'Tambah gambar JPEG, PNG, atau WebP'} <input type="file" multiple accept="image/jpeg,image/png,image/webp" disabled={busy||items.length>=MAX_FILES} onChange={event=>void add(event)}/></label>
    <p className="notice">{en?'Up to 20 images, 20 MB and 20 megapixels each, 100 MB total.':'Maksimal 20 gambar, 20 MB dan 20 megapiksel per gambar, total 100 MB.'}</p>
    {items.length>0&&<ol style={{paddingLeft:24}}>{items.map((item,index)=><li key={item.id} draggable={!busy} onDragStart={()=>{dragId.current=item.id}} onDragOver={event=>event.preventDefault()} onDrop={event=>{event.preventDefault();reorder(items.findIndex(value=>value.id===dragId.current),index);dragId.current=null}} style={{padding:'12px 0',borderBottom:'1px solid #e2e8f0'}}>
      <img src={item.preview} width="80" height="80" alt="" style={{objectFit:'contain',verticalAlign:'middle',marginRight:12,transform:`rotate(${item.rotation}deg)`}}/><span>{item.file.name} · {item.width} × {item.height} px · {item.rotation}°</span>
      <div className="controls" style={{marginTop:8}}><button className="button secondary" disabled={busy||index===0} onClick={()=>move(index,-1)} aria-label={`${en?'Move up':'Naikkan'} ${item.file.name}`}>{en?'Up':'Naik'}</button><button className="button secondary" disabled={busy||index===items.length-1} onClick={()=>move(index,1)} aria-label={`${en?'Move down':'Turunkan'} ${item.file.name}`}>{en?'Down':'Turun'}</button><button className="button secondary" disabled={busy} onClick={()=>{setItems(previous=>previous.map(value=>value.id===item.id?{...value,rotation:(value.rotation+90)%360}:value));invalidate()}} aria-label={`${en?'Rotate':'Putar'} ${item.file.name}`}>{en?'Rotate':'Putar'}</button><button className="button secondary" disabled={busy} onClick={()=>remove(item.id)} aria-label={`${en?'Remove':'Hapus'} ${item.file.name}`}>{en?'Remove':'Hapus'}</button></div>
    </li>)}</ol>}
    <div className="controls" style={{marginTop:20}}><label>{en?'Paper size':'Ukuran kertas'}<select value={size} disabled={busy} onChange={e=>{setSize(e.target.value);invalidate()}}><option value="a4">A4 (210 × 297 mm)</option><option value="f4">F4 (210 × 330 mm)</option><option value="letter">Letter (8.5 × 11 in)</option><option value="image">{en?'Match image (96 pixels/in)':'Ikuti gambar (96 piksel/in)'}</option></select></label>
      {size!=='image'&&<label>{en?'Orientation':'Orientasi'}<select value={orientation} disabled={busy} onChange={e=>{setOrientation(e.target.value);invalidate()}}><option value="portrait">Portrait</option><option value="landscape">Landscape</option></select></label>}
      <button className="button" disabled={!items.length||busy} onClick={()=>void create()}>{busy?(en?`Processing ${progress}/${items.length}`:`Memproses ${progress}/${items.length}`):(en?'Create PDF':'Buat PDF')}</button>
    </div>
    {items.length>0&&<section aria-label={en?'PDF page layout preview':'Pratinjau tata letak halaman PDF'} style={{marginTop:28}}><h2>{en?'Page layout preview':'Pratinjau tata letak halaman'}</h2><p className="notice">{en?'Each image becomes one centered page. The preview follows the selected paper, orientation, margin, order and rotation.':'Setiap gambar menjadi satu halaman dengan posisi di tengah. Pratinjau mengikuti ukuran kertas, orientasi, margin, urutan, dan rotasi yang dipilih.'}</p><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,180px),1fr))',gap:16}}>{items.map((item,index)=>{
      const rotated=item.rotation%180!==0;let pageWidth:number,pageHeight:number;
      if(size==='image'){pageWidth=(rotated?item.height:item.width)*.75;pageHeight=(rotated?item.width:item.height)*.75}
      else {const [short,long]=paper[size];[pageWidth,pageHeight]=orientation==='landscape'?[long,short]:[short,long]}
      const padding=mm(margin);const innerWidth=Math.max(0,pageWidth-2*padding);const innerHeight=Math.max(0,pageHeight-2*padding);
      const imageWidth=rotated?item.height:item.width;const imageHeight=rotated?item.width:item.height;
      const scale=Math.min(innerWidth/imageWidth,innerHeight/imageHeight);const visualWidth=imageWidth*scale;const visualHeight=imageHeight*scale;
      const previewWidth=rotated?visualHeight:visualWidth;const previewHeight=rotated?visualWidth:visualHeight;
      return <figure key={item.id} data-pdf-page-preview style={{margin:0}}><div style={{position:'relative',aspectRatio:`${pageWidth}/${pageHeight}`,background:'#fff',border:'1px solid #94a3b8',boxShadow:'0 2px 8px rgb(15 23 42 / 10%)'}}><div style={{position:'absolute',left:`${padding/pageWidth*100}%`,right:`${padding/pageWidth*100}%`,top:`${padding/pageHeight*100}%`,bottom:`${padding/pageHeight*100}%`}}><img data-page-image-preview data-rotation={item.rotation} src={item.preview} alt="" style={{position:'absolute',left:'50%',top:'50%',width:`${innerWidth?previewWidth/innerWidth*100:0}%`,height:`${innerHeight?previewHeight/innerHeight*100:0}%`,objectFit:'fill',transform:`translate(-50%,-50%) rotate(${item.rotation}deg)`}}/></div></div><figcaption>{en?'Page':'Halaman'} {index+1} · {item.file.name} · {pageWidth.toFixed(1)} × {pageHeight.toFixed(1)} pt</figcaption></figure>
    })}</div></section>}
    {errors.length>0&&<div role="alert" className="error"><ul>{errors.map((error,index)=><li key={index}>{error}</li>)}</ul></div>}
    {result&&<div className="result" aria-live="polite"><p>PDF · {result.pages} {en?'pages':'halaman'} · {result.bytes.toLocaleString(en?'en':'id')} bytes</p><p><a href={result.url} className="button download" download="photos.pdf">{en?'Download PDF':'Unduh PDF'}</a></p><WorkflowActions lang={lang} blob={result.blob} steps={[{path:toolHref('pdf-jpg',lang as 'id'|'en'),id:'Ubah PDF ke JPG',en:'Convert PDF to JPG'},{path:toolHref('pdf-500kb',lang as 'id'|'en'),id:'Kompres PDF',en:'Compress PDF'}]}/></div>}
  </section>
}
