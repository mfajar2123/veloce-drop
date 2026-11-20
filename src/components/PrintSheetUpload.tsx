import { withDocuments } from './DocumentWorkspace';
import {useEffect,useRef,useState} from 'react';
import PrintSheet from './PrintSheet';
import {takeSessionFile} from '../engines/session-files';
import {readImageBlobHeader} from '../engines/image-header';

type Preview={url:string;width:number;height:number};
function PrintSheetUpload({lang}:{lang:string}){
  const en=lang==='en';const [preview,setPreview]=useState<Preview|null>(null);const [error,setError]=useState('');const [busy,setBusy]=useState(false);const [version,setVersion]=useState(0);
  const source=useRef<ImageBitmap|null>(null);const generation=useRef(0);
  useEffect(()=>()=>{if(preview)URL.revokeObjectURL(preview.url)},[preview]);
  useEffect(()=>()=>{generation.current++;source.current?.close();source.current=null},[]);
  useEffect(()=>{const incoming=takeSessionFile(location.pathname);if(incoming)void choose(incoming)},[]);
  async function choose(file?:File){
    const job=++generation.current;source.current?.close();source.current=null;setPreview(null);setError('');setVersion(v=>v+1);if(!file){setBusy(false);return}setBusy(true);let image:ImageBitmap|undefined;
    try{
      if(file.size>20_000_000)throw new Error('size');const header=await readImageBlobHeader(file);
      if(!header)throw new Error('format');if(header.width*header.height>20_000_000)throw new Error('pixels');image=await createImageBitmap(file,{imageOrientation:'from-image'});if(image.width*image.height>20_000_000)throw new Error('pixels');
      const canvas=document.createElement('canvas');const scale=Math.min(1,800/Math.max(image.width,image.height));canvas.width=Math.max(1,Math.round(image.width*scale));canvas.height=Math.max(1,Math.round(image.height*scale));
      const ctx=canvas.getContext('2d');if(!ctx)throw new Error('canvas');ctx.drawImage(image,0,0,canvas.width,canvas.height);
      const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(value=>value?.type==='image/png'?resolve(value):reject(new Error('preview')),'image/png'));canvas.width=0;canvas.height=0;
      if(job!==generation.current){image.close();return}source.current=image;image=undefined;setPreview({url:URL.createObjectURL(blob),width:source.current.width,height:source.current.height});
    }catch(cause){image?.close();if(job===generation.current){const code=cause instanceof Error?cause.message:'';setError(code==='size'?(en?'File exceeds 20 MB.':'Berkas melebihi 20 MB.'):code==='pixels'?(en?'Image exceeds 20 megapixels.':'Gambar melebihi 20 megapiksel.'):(en?'Choose a valid JPEG, PNG or WebP image.':'Pilih gambar JPEG, PNG, atau WebP yang valid.'))}}
    finally{if(job===generation.current)setBusy(false)}
  }
  return <section className="panel"><p className="local">{en?'Processed on your device. Files are not sent for processing.':'Diproses di perangkat Anda. Berkas tidak dikirim untuk pemrosesan.'}</p><label>{en?'Choose a photo (JPEG, PNG, WebP; up to 20 MB)':'Pilih foto (JPEG, PNG, WebP; maks. 20 MB)'} <input type="file" multiple accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={e=>void choose(e.target.files?.[0])}/></label><p className="notice">{en?'Maximum 20 megapixels. The photo is not checked against official requirements.':'Maksimal 20 megapiksel. Foto tidak diperiksa terhadap ketentuan resmi.'}</p>{busy&&<p aria-live="polite">{en?'Loading photo…':'Memuat foto…'}</p>}{error&&<p className="error" role="alert">{error}</p>}{preview&&<div className="result"><p>{preview.width} × {preview.height} px</p><img src={preview.url} alt={en?'Photo to print':'Foto untuk dicetak'} width={preview.width} height={preview.height}/><PrintSheet lang={lang} version={String(version)} capture={()=>{const image=source.current;if(!image)return null;const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;const ctx=canvas.getContext('2d');if(!ctx)return null;ctx.drawImage(image,0,0);return canvas}}/></div>}</section>;
}

export default withDocuments(PrintSheetUpload);
