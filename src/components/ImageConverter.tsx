import { useEffect, useRef, useState } from 'react';
import { sanitizeSvg } from '../engines/safe-svg';
import WorkflowActions from './WorkflowActions';
import {readImageBlobHeader} from '../engines/image-header';
import { toolHref } from '../tool-links';

type Format = 'image/jpeg' | 'image/png' | 'image/webp';
type Result = { url: string; blob: Blob; bytes: number; width: number; height: number; type: Format };

export default function ImageConverter({ lang, input, initialOutput }: { lang: string; input: 'png'|'webp'|'svg'; initialOutput: 'png'|'jpeg' }) {
  const en=lang==='en';
  const [file,setFile]=useState<File|null>(null); const [format,setFormat]=useState<Format>(`image/${initialOutput}`);
  const [background,setBackground]=useState('#ffffff');
  const [result,setResult]=useState<Result|null>(null); const [error,setError]=useState(''); const [busy,setBusy]=useState(false);
  const generation=useRef(0);
  useEffect(()=>()=>{if(result) URL.revokeObjectURL(result.url)},[result]);
  useEffect(()=>()=>{generation.current++},[]);
  function invalidate(){generation.current++;setResult(null);setError('')}
  async function convert(){
    if(!file||busy)return;
    const id=generation.current;setBusy(true);setResult(null);setError('');let image:ImageBitmap|HTMLImageElement|undefined;
    try{
      const maxBytes=input==='svg'?5_000_000:20_000_000;
      if(file.size>maxBytes)throw new Error(en?`The file exceeds ${input==='svg'?'5':'20'} MB.`:`Berkas melebihi ${input==='svg'?'5':'20'} MB.`);
      if(input==='svg'){
        const safe=sanitizeSvg(await file.text());
        const source=new Blob([safe.source],{type:'image/svg+xml'});const sourceUrl=URL.createObjectURL(source);
        try{image=await createImageBitmap(source)}catch{image=await new Promise<HTMLImageElement>((resolve,reject)=>{const element=new Image();element.onload=()=>resolve(element);element.onerror=()=>reject(new Error('svg-decode'));element.src=sourceUrl})}finally{URL.revokeObjectURL(sourceUrl)}
        if(image.width!==safe.width||image.height!==safe.height)throw new Error('svg-dimensions');
      }else{
        const header=await readImageBlobHeader(file);
        if(!header||header.format!==input)throw new Error(en?`Choose a valid ${input.toUpperCase()} image.`:`Pilih gambar ${input.toUpperCase()} yang valid.`);
        if(header.width*header.height>40_000_000)throw new Error(en?'Image exceeds 40 megapixels.':'Gambar melebihi 40 megapiksel.');
        image=await createImageBitmap(file,{imageOrientation:'from-image'});
      }
      if(image.width*image.height>40_000_000)throw new Error(en?'Image exceeds 40 megapixels.':'Gambar melebihi 40 megapiksel.');
      const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;
      const ctx=canvas.getContext('2d');if(!ctx)throw new Error(en?'Canvas is unavailable.':'Canvas tidak tersedia.');
      if(format==='image/jpeg'){ctx.fillStyle=background;ctx.fillRect(0,0,canvas.width,canvas.height)}
      ctx.drawImage(image,0,0);
      const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(value=>value&&value.type===format?resolve(value):reject(new Error(en?'This browser cannot encode the selected format.':'Browser ini tidak dapat membuat format yang dipilih.')),format,0.97));
      if(id===generation.current)setResult({url:URL.createObjectURL(blob),blob,bytes:blob.size,width:canvas.width,height:canvas.height,type:format});
    }catch(e){if(id===generation.current){const code=e instanceof Error?e.message:'';setError(code==='svg-content'?(en?'SVG contains unsupported or unsafe content. External references, scripts, and embedded HTML are not allowed.':'SVG berisi konten yang tidak didukung atau berbahaya. Referensi luar, script, dan HTML sematan tidak diizinkan.'):code==='svg-size'?(en?'SVG exceeds the 5 MB limit.':'SVG melebihi batas 5 MB.'):code==='svg-dimensions'?(en?'SVG dimensions are invalid or exceed the 40-megapixel limit.':'Dimensi SVG tidak valid atau melebihi batas 40 megapiksel.'):(e instanceof Error?e.message:(en?'Unable to read image.':'Gambar tidak dapat dibaca.')))}}
    finally{if(image instanceof ImageBitmap)image.close();setBusy(false)}
  }
  return <section className="panel">
    <p className="local">{en?'Processed on your device. Files are not sent for processing.':'Diproses di perangkat Anda. Berkas tidak dikirim untuk pemrosesan.'}</p>
    <label>{en?`Choose a ${input.toUpperCase()} image (up to ${input==='svg'?5:20} MB)`:`Pilih gambar ${input.toUpperCase()} (maks. ${input==='svg'?5:20} MB)`} <input type="file" accept={input==='svg'?'.svg,image/svg+xml':`image/${input}`} disabled={busy} onChange={e=>{invalidate();setFile(e.target.files?.[0]??null)}}/></label>
    <div className="controls" style={{marginTop:20}}>
      {input==='svg'?<p>{en?'Output format: PNG':'Format hasil: PNG'}</p>:<label>{en?'Output format':'Format hasil'}<select value={format} onChange={e=>{invalidate();setFormat(e.target.value as Format)}}><option value="image/jpeg">JPEG</option><option value="image/png">PNG</option><option value="image/webp">WebP</option></select></label>}
      {format==='image/jpeg'&&<label>{en?'Background color':'Warna latar'}<input type="color" value={background} onChange={e=>{invalidate();setBackground(e.target.value)}}/></label>}
      <button className="button" disabled={!file||busy} onClick={()=>void convert()}>{busy?(en?'Converting…':'Mengonversi…'):(en?'Create preview':'Buat pratinjau')}</button>
    </div>
    <p className="notice">{input==='svg'?(en?'SVG is sanitized before local rasterization. Scripts, styles, external resources, embedded HTML, and unsupported SVG features are rejected. The PNG keeps transparent areas.':'SVG disanitasi sebelum dirasterkan secara lokal. Script, style, sumber luar, HTML sematan, dan fitur SVG yang tidak didukung akan ditolak. PNG mempertahankan area transparan.'):(en?'JPEG cannot preserve transparency; transparent areas use the selected background. JPEG and WebP may reduce image quality. The preview shows the actual output.':'JPEG tidak mendukung transparansi; area transparan memakai warna latar yang dipilih. JPEG dan WebP dapat mengurangi kualitas gambar. Pratinjau menampilkan hasil sebenarnya.')}</p>
    {error&&<p className="error" role="alert">{error}</p>}
    {result&&<div className="result" aria-live="polite"><p>{result.width} × {result.height} px · {result.type.replace('image/','').toUpperCase()} · {result.bytes.toLocaleString(en?'en':'id')} bytes</p><img src={result.url} alt={en?'Converted image preview':'Pratinjau gambar hasil konversi'} width={result.width} height={result.height}/><p><a className="button download" href={result.url} download={`converted.${result.type==='image/jpeg'?'jpg':result.type.slice(6)}`}>{en?'Download image':'Unduh gambar'}</a></p><WorkflowActions lang={lang} blob={result.blob} width={result.width} height={result.height} steps={[{path:toolHref('resize-image',lang as 'id'|'en'),id:'Atur ukuran gambar',en:'Resize image'},{path:toolHref('compress-image',lang as 'id'|'en'),id:'Kompres 200 KB',en:'Compress to 200 KB'}]}/></div>}
  </section>;
}
