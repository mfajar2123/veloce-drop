import {useEffect,useRef,useState} from 'react';
import WorkflowActions from './WorkflowActions';
import { toolHref } from '../tool-links';

type Output={url:string;blob:Blob;bytes:number;count:number};
const papers:Record<string,[number,number]>={ '4r':[101.6,152.4],a4:[210,297] };
const photos:Record<string,[number,number]>={ '2x3':[20,30],'3x4':[30,40],'4x6':[40,60] };
const points=(mm:number)=>mm*72/25.4;
function cropRect(width:number,height:number,aspect:number,x=50,y=50){let w=width,h=height;if(w/h>aspect)w=h*aspect;else h=w/aspect;return {x:(width-w)*x/100,y:(height-h)*y/100,width:w,height:h}}

export default function PrintSheet({lang,version,capture}:{lang:string;version:string;capture:()=>HTMLCanvasElement|null}){
  const en=lang==='en';const [paper,setPaper]=useState('4r');const [photo,setPhoto]=useState('3x4');const [orientation,setOrientation]=useState('portrait');
  const margin=5, gap=6;const [requested,setRequested]=useState(0);const [busy,setBusy]=useState(false);
  const [cropX,setCropX]=useState(50);const [cropY,setCropY]=useState(50);const drag=useRef<{x:number;y:number;cropX:number;cropY:number}|null>(null);
  const [result,setResult]=useState<Output|null>(null);const [error,setError]=useState('');const [expanded,setExpanded]=useState(false);const generation=useRef(0);const alive=useRef(true);const cropPreview=useRef<HTMLCanvasElement|null>(null);
  const dimensions=papers[paper],page=orientation==='portrait'?dimensions:[dimensions[1],dimensions[0]];const [photoWidth,photoHeight]=photos[photo];
  const columns=Math.max(0,Math.floor((page[0]-2*margin+gap)/(photoWidth+gap)));const rows=Math.max(0,Math.floor((page[1]-2*margin+gap)/(photoHeight+gap)));
  const capacity=Math.min(100,columns*rows);const quantity=requested===0?capacity:Math.min(requested,capacity);
  useEffect(()=>()=>{if(result)URL.revokeObjectURL(result.url)},[result]);
  useEffect(()=>{generation.current++;setResult(null);setError('')},[version,paper,photo,orientation,margin,gap,requested,cropX,cropY]);
  useEffect(()=>{alive.current=true;return()=>{alive.current=false;generation.current++}},[]);
  useEffect(()=>{
    if(!expanded)return;const frame=requestAnimationFrame(()=>{const source=capture(),node=cropPreview.current;if(!source)return;if(!node){source.width=0;source.height=0;return}const area=cropRect(source.width,source.height,photoWidth/photoHeight,cropX,cropY);node.width=240;node.height=Math.round(240*photoHeight/photoWidth);const ctx=node.getContext('2d');if(ctx)ctx.drawImage(source,area.x,area.y,area.width,area.height,0,0,node.width,node.height);source.width=0;source.height=0});
    return()=>cancelAnimationFrame(frame);
  },[version,photo,expanded,cropX,cropY]);
  async function create(){
    if(!capacity||busy)return;const job=generation.current;setBusy(true);setError('');setResult(null);let source:HTMLCanvasElement|null=null;let cropped:HTMLCanvasElement|null=null;
    try{
      source=capture();if(!source||!source.width||!source.height)throw new Error('image');
      const area=cropRect(source.width,source.height,photoWidth/photoHeight,cropX,cropY);
      cropped=document.createElement('canvas');cropped.width=Math.max(1,Math.round(area.width));cropped.height=Math.max(1,Math.round(area.height));const ctx=cropped.getContext('2d');if(!ctx)throw new Error('canvas');
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(source,area.x,area.y,area.width,area.height,0,0,cropped.width,cropped.height);
      const blob=await new Promise<Blob>((resolve,reject)=>cropped!.toBlob(value=>value?.type==='image/png'?resolve(value):reject(new Error('png')),'image/png'));
      const {PDFDocument,rgb}=await import('pdf-lib');const pdf=await PDFDocument.create();const embedded=await pdf.embedPng(await blob.arrayBuffer());
      const sheet=pdf.addPage([points(page[0]),points(page[1])]);const markGap=points(1),markLength=points(2),line=points(.15);
      for(let index=0;index<quantity;index++){
        const column=index%columns,row=Math.floor(index/columns);const x=points(margin+column*(photoWidth+gap));const y=points(page[1]-margin-photoHeight-row*(photoHeight+gap));const w=points(photoWidth),h=points(photoHeight);
        sheet.drawImage(embedded,{x,y,width:w,height:h});
        for(const cornerX of [x,x+w])for(const cornerY of [y,y+h]){
          const sx=cornerX===x?-1:1,sy=cornerY===y?-1:1;
          sheet.drawLine({start:{x:cornerX+sx*markGap,y:cornerY},end:{x:cornerX+sx*(markGap+markLength),y:cornerY},thickness:line,color:rgb(0,0,0)});
          sheet.drawLine({start:{x:cornerX,y:cornerY+sy*markGap},end:{x:cornerX,y:cornerY+sy*(markGap+markLength)},thickness:line,color:rgb(0,0,0)});
        }
      }
      const bytes=await pdf.save();if(job!==generation.current)return;const output=new Blob([bytes as BlobPart],{type:'application/pdf'});setResult({url:URL.createObjectURL(output),blob:output,bytes:output.size,count:quantity});
    }catch{if(job===generation.current)setError(en?'Could not create the print sheet. Try again.':'Lembar cetak tidak dapat dibuat. Coba lagi.')}
    finally{if(source){source.width=0;source.height=0}if(cropped){cropped.width=0;cropped.height=0}if(alive.current)setBusy(false)}
  }
  return <details style={{marginTop:24}} onToggle={e=>setExpanded(e.currentTarget.open)}><summary>{en?'Print photo sheet':'Cetak lembar foto'}</summary><p className="notice">{en?'The image is center-cropped to the chosen photo ratio. Check the crop and official photo requirements before printing. Print at 100% scale.':'Gambar dipotong dari tengah sesuai rasio foto. Periksa hasil dan ketentuan instansi sebelum mencetak. Cetak pada skala 100%.'}</p>
    <canvas ref={cropPreview} aria-label={en?'Print crop preview':'Pratinjau crop cetak'} onPointerDown={event=>{drag.current={x:event.clientX,y:event.clientY,cropX,cropY};event.currentTarget.setPointerCapture(event.pointerId)}} onPointerMove={event=>{const start=drag.current;if(!start||!event.currentTarget.hasPointerCapture(event.pointerId))return;const rect=event.currentTarget.getBoundingClientRect();setCropX(Math.max(0,Math.min(100,start.cropX-(event.clientX-start.x)/rect.width*100)));setCropY(Math.max(0,Math.min(100,start.cropY-(event.clientY-start.y)/rect.height*100)))}} onPointerUp={event=>{drag.current=null;if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId)}} onPointerCancel={()=>{drag.current=null}} style={{display:'block',maxWidth:'100%',height:'auto',background:'#e2e8f0',marginBottom:16,touchAction:'none',cursor:'grab'}}/>
    <p className="notice">{en?'Drag the preview or use the crop position controls.':'Geser pratinjau atau gunakan kontrol posisi crop.'}</p>
    <div className="controls"><label>{en?'Print paper':'Kertas cetak'}<select value={paper} disabled={busy} onChange={e=>{setPaper(e.target.value);setRequested(0)}}><option value="4r">4R (101.6 × 152.4 mm)</option><option value="a4">A4 (210 × 297 mm)</option></select></label>
      <label>{en?'Photo size':'Ukuran foto'}<select value={photo} disabled={busy} onChange={e=>{setPhoto(e.target.value);setRequested(0)}}><option value="2x3">2 × 3 cm</option><option value="3x4">3 × 4 cm</option><option value="4x6">4 × 6 cm</option></select></label>
      <label>{en?'Paper orientation':'Orientasi kertas'}<select value={orientation} disabled={busy} onChange={e=>{setOrientation(e.target.value);setRequested(0)}}><option value="portrait">Portrait</option><option value="landscape">Landscape</option></select></label>
      <label>{en?'Horizontal crop position':'Posisi crop horizontal'}<input aria-label={en?'Horizontal crop position':'Posisi crop horizontal'} type="range" min="0" max="100" value={cropX} disabled={busy} onChange={e=>setCropX(Number(e.target.value))}/></label>
      <label>{en?'Vertical crop position':'Posisi crop vertikal'}<input aria-label={en?'Vertical crop position':'Posisi crop vertikal'} type="range" min="0" max="100" value={cropY} disabled={busy} onChange={e=>setCropY(Number(e.target.value))}/></label>
      <button type="button" className="button secondary" disabled={busy||cropX===50&&cropY===50} onClick={()=>{setCropX(50);setCropY(50)}}>{en?'Center crop':'Pusatkan crop'}</button>
      <label>{en?'Number of photos':'Jumlah foto'}<input type="number" min="1" max={capacity} value={quantity} disabled={busy||!capacity} onChange={e=>setRequested(Math.max(1,Math.min(capacity,Math.floor(Number(e.target.value)||1))))}/></label>
      <button className="button" disabled={!capacity||busy} onClick={()=>void create()}>{busy?(en?'Creating…':'Membuat…'):(en?'Create print PDF':'Buat PDF cetak')}</button>
    </div>
    <p aria-live="polite">{en?`Capacity: ${columns} columns × ${rows} rows = ${capacity} photos.`:`Kapasitas: ${columns} kolom × ${rows} baris = ${capacity} foto.`}</p>
    <p className="notice">{en?'Cut marks extend 2 mm with a 1 mm gap from each photo. Printer margins can vary.':'Tanda potong sepanjang 2 mm berjarak 1 mm dari foto. Margin printer dapat berbeda.'}</p>
    {error&&<p role="alert" className="error">{error}</p>}{result&&<div aria-live="polite"><p>PDF · {result.count} {en?'photos':'foto'} · {result.bytes.toLocaleString(en?'en':'id')} bytes</p><a className="button download" href={result.url} download="photo-sheet.pdf">{en?'Download print PDF':'Unduh PDF cetak'}</a><WorkflowActions lang={lang} blob={result.blob} steps={[{path:toolHref('pdf-jpg',lang as 'id'|'en'),id:'Ubah PDF ke JPG',en:'Convert PDF to JPG'},{path:toolHref('pdf-500kb',lang as 'id'|'en'),id:'Kompres PDF',en:'Compress PDF'}]}/></div>}
  </details>;
}
