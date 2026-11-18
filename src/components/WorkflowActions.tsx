import {useEffect, useState} from 'react';
import {navigate} from 'astro:transitions/client';
import {addSessionFile, handoffSessionFile, listSessionFiles} from '../engines/session-files';

export default function WorkflowActions({lang,blob,width,height,steps,onBeforeNavigate}:{lang:string;blob:Blob;width?:number;height?:number;steps:{path:string;id:string;en:string}[];onBeforeNavigate?:()=>void|Promise<void>}) {
  const en=lang==='en'; const [id,setId]=useState<string|null>(null); const [error,setError]=useState(false);
  useEffect(()=>{setId(addSessionFile(blob,width,height));setError(false)},[blob,width,height]);
  async function go(path:string) {
    let next=id;
    if(!next || !listSessionFiles().some(item=>item.id===next)) next=addSessionFile(blob,width,height);
    if(!next || !handoffSessionFile(next,path)){setError(true);return}
    await onBeforeNavigate?.();
    await navigate(path);
  }
  return <div><p>{en?'Continue editing without uploading again:':'Lanjut edit tanpa unggah ulang:'}</p><div className="controls">{steps.map(step=><button key={step.path} className="button secondary" onClick={()=>void go(step.path)}>{en?step.en:step.id}</button>)}</div>{error&&<p role="alert" className="error">{en?'This result is too large for the session. Download it and choose it in the next tool.':'Hasil terlalu besar untuk sesi. Unduh dan pilih kembali di alat berikutnya.'}</p>}</div>;
}
