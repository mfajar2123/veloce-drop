import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { readImageHeader } from '../engines/image-header';
import BatchCompare from './BatchCompare';
import WorkflowActions from './WorkflowActions';
import { toolHref } from '../tool-links';

type Output={blob:Blob;url:string;width:number;height:number;met:boolean;name:string};
type Item={id:number;file:File;sourceUrl:string;quality:number;status:'ready'|'processing'|'success'|'error';output?:Output;error?:string};
type Archive={url:string;bytes:number};
const MAX_FILES=25,MAX_FILE=20_000_000,MAX_TOTAL=100_000_000,MAX_PIXELS=20_000_000,MAX_OUTPUT=100_000_000;
function clean(value:string){return value.replace(/[\\/:*?"<>|\p{Cc}]/gu,'_').replace(/^\.+|[. ]+$/g,'').trim().slice(0,60)}
function outputName(item:Item,index:number,format:string,prefix:string,suffix:string){
  const original=item.file.name.replace(/\.[^.]*$/,'');const base=clean(original)||'image';
  return `${clean(prefix)}${base}${clean(suffix)}-${String(index+1).padStart(3,'0')}.${format==='image/jpeg'?'jpg':'webp'}`;
}
async function imageFrom(file:File){
  const header=readImageHeader(new Uint8Array(await file.slice(0,1_048_576).arrayBuffer()));
  if(!header)throw new Error('format');
  if(header.width*header.height>MAX_PIXELS)throw new Error('pixels');
  const image=await createImageBitmap(file,{imageOrientation:'from-image'});if(image.width*image.height>MAX_PIXELS){image.close();throw new Error('pixels')}return image;
}
export default function BatchCompressor({lang}:{lang:string}){
  const en=lang==='en';const [items,setItems]=useState<Item[]>([]);const [target,setTarget]=useState(200);const [format,setFormat]=useState('image/jpeg');
  const [prefix,setPrefix]=useState('');const [suffix,setSuffix]=useState('');const [busy,setBusy]=useState(false);const [progress,setProgress]=useState('');const [error,setError]=useState('');const [archive,setArchive]=useState<Archive|null>(null);
  const id=useRef(0);const generation=useRef(0);const urls=useRef(new Set<string>());const alive=useRef(true);
  useEffect(()=>{alive.current=true;return()=>{alive.current=false;generation.current++;for(const url of urls.current)URL.revokeObjectURL(url);urls.current.clear()}},[]);
  function revoke(url?:string){if(url){URL.revokeObjectURL(url);urls.current.delete(url)}}
  function clearArchive(){if(archive)revoke(archive.url);setArchive(null)}
  function resetOutputs(){for(const item of items)revoke(item.output?.url);clearArchive();setItems(previous=>previous.map(item=>({...item,status:'ready',output:undefined,error:undefined})));setProgress('');setError('')}
  function add(event:ChangeEvent<HTMLInputElement>){
    const selected=Array.from(event.target.files??[]);event.target.value='';let remaining=MAX_TOTAL-items.reduce((sum,item)=>sum+item.file.size,0);const added:Item[]=[];const problems:string[]=[];
    for(const file of selected){if(items.length+added.length>=MAX_FILES){problems.push(en?'Maximum 25 images.':'Maksimal 25 gambar.');break}if(file.size>MAX_FILE||file.size>remaining){problems.push(`${file.name}: ${en?'size exceeds the limit':'ukuran melebihi batas'}`);continue}const sourceUrl=URL.createObjectURL(file);urls.current.add(sourceUrl);added.push({id:++id.current,file,sourceUrl,quality:90,status:'ready'});remaining-=file.size}
    setItems(previous=>[...previous,...added]);setError(problems.join(' '));clearArchive();
  }
  function cancel(){generation.current++;setBusy(false);setProgress(en?'Cancelled. Completed results remain available.':'Dibatalkan. Hasil yang sudah selesai tetap tersedia.');setItems(previous=>previous.map(item=>item.status==='processing'?{...item,status:'ready'}:item))}
  async function process(){
    if(busy||!items.length)return;if(!Number.isInteger(target)||target<1||target>20000){setError(en?'Enter a target from 1 to 20,000 KB.':'Masukkan target antara 1 dan 20.000 KB.');return}
    for(const item of items)revoke(item.output?.url);clearArchive();setError('');setBusy(true);const job=++generation.current;
    setItems(previous=>previous.map(item=>({...item,status:'ready',output:undefined,error:undefined})));
    let totalOutput=0;
    try{
      for(let index=0;index<items.length;index++){
        if(job!==generation.current)break;const item=items[index];setItems(previous=>previous.map(value=>value.id===item.id?{...value,status:'processing'}:value));
        let image:ImageBitmap|undefined;let canvas:HTMLCanvasElement|undefined;
        try{
          image=await imageFrom(item.file);if(job!==generation.current)break;
          canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;const ctx=canvas.getContext('2d');if(!ctx)throw new Error('canvas');
          if(format==='image/jpeg'){ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height)}ctx.drawImage(image,0,0);
          let best:Blob|undefined,smallest:Blob|undefined;const max=item.quality/100;const samples:number[]=[];
          for(let q=.1;q<max;q+=.1)samples.push(Math.round(q*100)/100);samples.push(max);
          for(const quality of samples){if(job!==generation.current)break;const blob=await new Promise<Blob>((resolve,reject)=>canvas!.toBlob(value=>value?.type===format?resolve(value):reject(new Error('encoder')),format,quality));if(!smallest||blob.size<smallest.size)smallest=blob;if(blob.size<=target*1000)best=blob}
          if(job!==generation.current)break;const blob=best??smallest;if(!blob)throw new Error('encoder');totalOutput+=blob.size;if(totalOutput>MAX_OUTPUT)throw new Error('total');
          const url=URL.createObjectURL(blob);urls.current.add(url);const output={blob,url,width:canvas.width,height:canvas.height,met:!!best,name:outputName(item,index,format,prefix,suffix)};
          setItems(previous=>previous.map(value=>value.id===item.id?{...value,status:'success',output,error:undefined}:value));
        }catch(cause){if(job!==generation.current)break;const code=cause instanceof Error?cause.message:'';const message=code==='pixels'?(en?'Exceeds 20 megapixels.':'Melebihi 20 megapiksel.'):code==='total'?(en?'Total output exceeds 100 MB.':'Total hasil melebihi 100 MB.'):(en?'Unsupported, corrupt, or encoding failed.':'Format tidak didukung, rusak, atau gagal dikodekan.');setItems(previous=>previous.map(value=>value.id===item.id?{...value,status:'error',error:message}:value));}
        finally{image?.close();if(canvas){canvas.width=0;canvas.height=0}}
        if(job===generation.current)setProgress(`${index+1}/${items.length}`);
      }
    }finally{if(job===generation.current&&alive.current)setBusy(false)}
  }
  async function makeZip(){
    const ready=items.filter((item):item is Item&{output:Output}=>!!item.output);if(!ready.length||busy)return;setBusy(true);setError('');clearArchive();const job=++generation.current;
    try{const {zipSync}=await import('fflate');const entries:Record<string,Uint8Array>={};for(const item of ready){if(job!==generation.current)return;entries[item.output.name]=new Uint8Array(await item.output.blob.arrayBuffer())}
      const bytes=zipSync(entries,{level:0});if(job!==generation.current)return;const blob=new Blob([bytes as BlobPart],{type:'application/zip'});const url=URL.createObjectURL(blob);urls.current.add(url);setArchive({url,bytes:blob.size});
    }catch{if(job===generation.current)setError(en?'Could not create ZIP.':'ZIP tidak dapat dibuat.')}finally{if(job===generation.current&&alive.current)setBusy(false)}
  }
  const size=(bytes:number)=>new Intl.NumberFormat(en?'en':'id',{maximumFractionDigits:1}).format(bytes/1000)+' KB';
  return <section className="panel"><p className="local">{en?'Processed on your device. Files are not sent for processing.':'Diproses di perangkat Anda. Berkas tidak dikirim untuk pemrosesan.'}</p>
    <label>{en?'Add JPEG, PNG or WebP images':'Tambah gambar JPEG, PNG, atau WebP'} <input type="file" multiple accept="image/jpeg,image/png,image/webp" disabled={busy||items.length>=MAX_FILES} onChange={add}/></label>
    <p className="notice">{en?'Up to 25 images, 20 MB and 20 megapixels each, 100 MB total. 1 KB = 1,000 bytes.':'Maksimal 25 gambar, 20 MB dan 20 megapiksel per gambar, total 100 MB. 1 KB = 1.000 byte.'}</p>
    <div className="controls"><label>{en?'Target per image (KB)':'Target per gambar (KB)'}<input type="number" min="1" max="20000" disabled={busy} value={target} onChange={e=>{resetOutputs();setTarget(Number(e.target.value))}}/></label><label>{en?'Output format':'Format hasil'}<select value={format} disabled={busy} onChange={e=>{resetOutputs();setFormat(e.target.value)}}><option value="image/jpeg">JPEG</option><option value="image/webp">WebP</option></select></label><button className="button" disabled={busy||!items.length} onClick={()=>void process()}>{en?'Compress queue':'Kompres antrean'}</button>{busy&&<button className="button secondary" onClick={cancel}>{en?'Cancel':'Batalkan'}</button>}</div>
    <details style={{marginTop:20}}><summary>{en?'Output names':'Nama hasil'}</summary><div className="controls"><label>{en?'Prefix':'Awalan'}<input type="text" maxLength={30} disabled={busy} value={prefix} onChange={e=>{resetOutputs();setPrefix(e.target.value)}}/></label><label>{en?'Suffix':'Akhiran'}<input type="text" maxLength={30} disabled={busy} value={suffix} onChange={e=>{resetOutputs();setSuffix(e.target.value)}}/></label></div></details>
    <p className="notice">{en?'JPEG uses a white background for transparency. Re-encoding removes metadata; visible information is not hidden. Dimensions are not reduced.':'JPEG memakai latar putih untuk transparansi. Pengodean ulang menghapus metadata; informasi yang terlihat tidak disembunyikan. Dimensi tidak dikurangi.'}</p>
    <p aria-live="polite">{progress}</p>{error&&<p role="alert" className="error">{error}</p>}
    {items.length>0&&<ol>{items.map((item,index)=><li key={item.id} style={{padding:'16px 0',borderBottom:'1px solid #e2e8f0'}}><strong>{item.file.name}</strong> · {size(item.file.size)}
      <div className="controls" style={{marginTop:8}}><label>{en?'Maximum quality (%)':'Kualitas maksimum (%)'}<input aria-label={`${en?'Maximum quality':'Kualitas maksimum'} ${index+1}`} type="number" min="10" max="100" value={item.quality} disabled={busy} onChange={e=>{revoke(item.output?.url);clearArchive();setItems(previous=>previous.map(value=>value.id===item.id?{...value,quality:Math.max(10,Math.min(100,Number(e.target.value)||10)),status:'ready',output:undefined,error:undefined}:value))}}/></label><button className="button secondary" disabled={busy} aria-label={`${en?'Remove':'Hapus'} ${index+1}`} onClick={()=>{revoke(item.output?.url);revoke(item.sourceUrl);clearArchive();setItems(previous=>previous.filter(value=>value.id!==item.id))}}>{en?'Remove':'Hapus'}</button></div>
      {item.status==='processing'&&<p>{en?'Processing…':'Memproses…'}</p>}{item.error&&<p className="error">{item.error}</p>}{item.output&&<div><p>{item.output.met?(en?'Target reached':'Target tercapai'):(en?'Target not reached':'Target belum tercapai')} · {item.output.width} × {item.output.height} px · {size(item.file.size)} → {size(item.output.blob.size)} · {new Intl.NumberFormat(en?'en':'id',{maximumFractionDigits:1}).format((1-item.output.blob.size/item.file.size)*100)}%</p><a className="button download" href={item.output.url} download={item.output.name}>{en?'Download':'Unduh'} {item.output.name}</a><WorkflowActions lang={lang} blob={item.output.blob} width={item.output.width} height={item.output.height} steps={[{path:toolHref('photo-pdf',lang as 'id'|'en'),id:'Masukkan ke PDF',en:'Add to a PDF'},{path:toolHref('resize-image',lang as 'id'|'en'),id:'Atur ukuran foto',en:'Resize this image'}]}/></div>}
      {item.output&&<BatchCompare before={item.sourceUrl} after={item.output.url} width={item.output.width} height={item.output.height} index={index+1} lang={lang}/>}
    </li>)}</ol>}
    {items.some(item=>item.output)&&<div className="controls"><button className="button secondary" disabled={busy} onClick={()=>void makeZip()}>{en?'Create ZIP':'Buat ZIP'}</button>{archive&&<a className="button download" href={archive.url} download="velocedrop-images.zip">{en?'Download ZIP':'Unduh ZIP'} ({size(archive.bytes)})</a>}</div>}
  </section>
}
