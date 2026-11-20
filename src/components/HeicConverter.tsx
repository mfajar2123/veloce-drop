import { withDocuments } from './DocumentWorkspace';
import {useEffect,useRef,useState} from 'react';
import WorkflowActions from './WorkflowActions';
import { toolHref } from '../tool-links';

type Result={blob:Blob;url:string;width:number;height:number};
const MAX_FILE=20_000_000,MAX_PIXELS=20_000_000;

function HeicConverter({lang}:{lang:string}){
  const en=lang==='en';
  const [file,setFile]=useState<File|null>(null);
  const [result,setResult]=useState<Result|null>(null);
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  const generation=useRef(0);
  useEffect(()=>()=>{generation.current++;if(result)URL.revokeObjectURL(result.url)},[result]);

  function reset(){generation.current++;setResult(null);setError('');setBusy(false)}

  async function convert(){
    if(!file||busy)return;
    const job=++generation.current;
    setBusy(true);setResult(null);setError('');
    try{
      if(file.size>MAX_FILE)throw new Error('size');
      const {heicTo,isHeic}=await import('heic-to');
      if(!await isHeic(file))throw new Error('format');
      const blob=await heicTo({blob:file,type:'image/jpeg',quality:.92});
      if(blob.type!=='image/jpeg'||!blob.size)throw new Error('encoder');
      const image=await createImageBitmap(blob);
      try{
        if(image.width*image.height>MAX_PIXELS)throw new Error('pixels');
        if(job===generation.current)setResult({blob,url:URL.createObjectURL(blob),width:image.width,height:image.height});
      }finally{image.close()}
    }catch(cause){
      if(job!==generation.current)return;
      const code=cause instanceof Error?cause.message:String(cause);
      setError(code==='size'?(en?'File exceeds 20 MB.':'Berkas melebihi 20 MB.'):
        code==='pixels'?(en?'Decoded image exceeds 20 megapixels.':'Gambar hasil dekode melebihi 20 megapiksel.'):
        code==='format'?(en?'This is not a supported HEIC/HEIF file. Choose a valid HEVC image; AVIF and other codecs are not supported.':'Berkas ini bukan HEIC/HEIF yang didukung. Pilih gambar HEVC yang valid; AVIF dan codec lain tidak didukung.'):
        (en?'Could not decode this HEIC/HEIF file. It may be damaged, encrypted, or use an unsupported image variant.':'Berkas HEIC/HEIF tidak dapat dibaca. Berkas mungkin rusak, terenkripsi, atau memakai varian gambar yang tidak didukung.'));
    }finally{if(job===generation.current)setBusy(false)}
  }

  return <section className="panel">
    <p className="local">{en?'Processed on your device. Files are not sent for processing.':'Diproses di perangkat Anda. Berkas tidak dikirim untuk pemrosesan.'}</p>
    <label>{en?'Choose a HEIC or HEIF image (max 20 MB)':'Pilih gambar HEIC atau HEIF (maks. 20 MB)'} <input type="file" multiple accept=".heic,.heif,image/heic,image/heif" disabled={busy} onChange={event=>{reset();setFile(event.target.files?.[0]??null)}}/></label>
    <p className="notice">{en?'The decoder is loaded from this site when you convert. Only the primary still image is exported; motion sequences and auxiliary depth or portrait data are not retained. Output is JPEG at quality 92 with metadata removed.':'Dekoder dimuat dari situs ini saat konversi dimulai. Hanya gambar diam utama yang diekspor; rangkaian gerak serta data kedalaman atau potret tambahan tidak disertakan. Hasilnya JPEG kualitas 92 tanpa metadata.'}</p>
    <div className="controls"><button className="button" disabled={!file||busy} onClick={()=>void convert()}>{busy?(en?'Converting HEIC…':'Mengonversi HEIC…'):(en?'Convert to JPG':'Konversi ke JPG')}</button></div>
    {error&&<p className="error" role="alert">{error}</p>}
    {result&&<div className="result" aria-live="polite"><p>{result.width} × {result.height} px · JPEG · {result.blob.size.toLocaleString(en?'en':'id')} bytes</p><img src={result.url} alt={en?'Converted HEIC preview':'Pratinjau HEIC hasil konversi'} width={result.width} height={result.height}/><p><a className="button download" href={result.url} download="converted.jpg">{en?'Download JPG':'Unduh JPG'}</a></p><WorkflowActions lang={lang} blob={result.blob} width={result.width} height={result.height} steps={[{path:toolHref('resize-image',lang as 'id'|'en'),id:'Atur ukuran foto',en:'Resize image'},{path:toolHref('compress-image',lang as 'id'|'en'),id:'Kompres 200 KB',en:'Compress to 200 KB'}]}/></div>}
  </section>;
}

export default withDocuments(HeicConverter);
