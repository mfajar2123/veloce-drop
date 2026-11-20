import {useEffect, useRef, useState, type ComponentType, type ReactNode} from 'react';

type Entry = {id:number; name:string; source?:File; opened:boolean};
const limit = 4;

function FilePanel({source,children}:{source?:File;children:ReactNode}) {
  const container = useRef<HTMLDivElement>(null);
  const loaded = useRef(false);
  useEffect(() => {
    if (!source || loaded.current) return;
    const input = container.current?.querySelector<HTMLInputElement>('input[type=file]');
    if (!input) return;
    const transfer = new DataTransfer();
    transfer.items.add(source);
    input.files = transfer.files;
    loaded.current = true;
    input.dispatchEvent(new Event('change',{bubbles:true}));
  },[source]);
  return <div ref={container}>{children}</div>;
}

export function withDocuments<P extends {lang:string}>(Editor:ComponentType<P>) {
  return function DocumentWorkspace(props:P) {
    const en = props.lang === 'en';
    const next = useRef(1);
    const [entries,setEntries] = useState<Entry[]>([{id:0,name:'',opened:true}]);
    const [active,setActive] = useState(0);
    const [warning,setWarning] = useState('');
    function open(id:number) {
      setEntries(list=>list.map(entry=>entry.id===id?{...entry,opened:true}:entry));
      setActive(id);
    }
    function remove(id:number) {
      const rest = entries.filter(entry=>entry.id!==id);
      setEntries(rest);
      if(active===id)open(rest[0].id);
      setWarning('');
    }
    return <div>
      <p className="notice">{en?'Choose up to four files. Each file has its own settings, preview and download.':'Pilih hingga empat berkas. Setiap berkas memiliki pengaturan, pratinjau, dan unduhan sendiri.'}</p>
      {entries.length>1 && <div className="document-list">{entries.map((entry,index)=><button type="button" key={entry.id} aria-pressed={entry.id===active} onClick={()=>open(entry.id)}>{index+1}. {entry.name || (en?'New file':'Berkas baru')}</button>)}</div>}
      {warning && <p role="alert">{warning}</p>}
      {entries.map(entry=><div key={entry.id} hidden={active!==entry.id} onDropCapture={event=>{
        const files=event.dataTransfer.files;
        if(files.length<2)return;
        const input=event.currentTarget.querySelector<HTMLInputElement>('input[type=file]');
        if(!input || input.disabled)return;
        event.preventDefault();
        event.stopPropagation();
        input.files=files;
        input.dispatchEvent(new Event('change',{bubbles:true}));
      }} onChangeCapture={event=>{
        const input=event.target;
        if(!(input instanceof HTMLInputElement) || input.type!=='file' || !input.files?.length)return;
        const [first,...others]=Array.from(input.files);
        if(others.length>limit-entries.length){
          event.stopPropagation();input.value='';
          setWarning(en?'Too many files. Select fewer or remove a file first.':'Terlalu banyak berkas. Pilih lebih sedikit atau hapus berkas dahulu.');return;
        }
        setWarning('');
        const additional=others.map(file=>({id:next.current++,source:file,name:file.name,opened:false}));
        setEntries(list=>[...list.map(item=>item.id===entry.id?{...item,name:first.name}:item),...additional]);
      }}>
        {entry.opened && <FilePanel source={entry.source}><Editor {...props}/></FilePanel>}
      </div>)}
      <div className="controls">
        {entries.length<limit && <button type="button" className="button secondary" onClick={()=>{
          const id=next.current++;setEntries(list=>[...list,{id,name:'',opened:true}]);setActive(id);setWarning('');
        }}>{en?'Add another file':'Tambah berkas lain'}</button>}
        {entries.length>1 && <button type="button" className="button secondary" onClick={()=>remove(active)}>{en?'Remove current file':'Hapus berkas aktif'}</button>}
      </div>
    </div>;
  };
}
