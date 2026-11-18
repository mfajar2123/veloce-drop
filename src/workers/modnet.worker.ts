import * as ort from 'onnxruntime-web/wasm';

const MODEL_BYTES=25_888_640, WASM_BYTES=14_848_852;
let session:ort.InferenceSession|undefined;

async function fetchBytes(path:string,expected:number,offset:number){
  const response=await fetch(path,{credentials:'same-origin'});if(!response.ok||!response.body)throw new Error('download');
  const reader=response.body.getReader();const chunks:Uint8Array[]=[];let received=0;
  while(true){const {done,value}=await reader.read();if(done)break;if(value){received+=value.length;if(received>expected)throw new Error('size');chunks.push(value);self.postMessage({type:'progress',received:offset+received,total:MODEL_BYTES+WASM_BYTES})}}
  if(received!==expected)throw new Error('size');const result=new Uint8Array(received);let position=0;for(const chunk of chunks){result.set(chunk,position);position+=chunk.length}return result;
}
self.onmessage=async(event:MessageEvent)=>{
  try{
    if(event.data.type==='init'){
      const wasm=await fetchBytes('/ort/ort-wasm-simd-threaded.wasm',WASM_BYTES,0);
      const model=await fetchBytes('/models/modnet.onnx',MODEL_BYTES,WASM_BYTES);
      ort.env.wasm.numThreads=1;ort.env.wasm.wasmBinary=wasm;
      session=await ort.InferenceSession.create(model,{executionProviders:['wasm'],graphOptimizationLevel:'all'});
      self.postMessage({type:'ready'});
    }else if(event.data.type==='segment'){
      if(!session)throw new Error('model');const {data,width,height}=event.data as {data:Float32Array;width:number;height:number};
      const tensor=new ort.Tensor('float32',data,[1,3,height,width]);const result=await session.run({input:tensor});const mask=result.output;
      if(!mask||mask.type!=='float32'||mask.dims.length!==4||mask.dims[2]!==height||mask.dims[3]!==width)throw new Error('shape');
      const values=Float32Array.from(mask.data as Float32Array);self.postMessage({type:'mask',data:values,width,height},{transfer:[values.buffer]});
    }
  }catch(error){self.postMessage({type:'error',message:error instanceof Error?error.message:'unknown'})}
};
