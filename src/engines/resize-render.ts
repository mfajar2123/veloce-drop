import {blurChannel} from './mask-effects';

type Options={mode:'crop'|'contain'|'pad';circle:boolean;background:string;blur:boolean;rotation:number;x:number;y:number;zoom?:number};

function place(ctx:CanvasRenderingContext2D,image:ImageBitmap,x:number,y:number,width:number,height:number,fill:boolean,rotation:number,focusX:number,focusY:number,zoom=1){
  const quarter=rotation%180!==0;const rotatedWidth=quarter?image.height:image.width,rotatedHeight=quarter?image.width:image.height;
  const scale=(fill?Math.max(width/rotatedWidth,height/rotatedHeight):Math.min(width/rotatedWidth,height/rotatedHeight))*(fill?zoom:1);
  const drawWidth=rotatedWidth*scale,drawHeight=rotatedHeight*scale;
  const left=x+(fill?(width-drawWidth)*focusX/100:(width-drawWidth)/2);
  const top=y+(fill?(height-drawHeight)*focusY/100:(height-drawHeight)/2);
  ctx.save();ctx.beginPath();ctx.rect(x,y,width,height);ctx.clip();ctx.translate(left+drawWidth/2,top+drawHeight/2);ctx.rotate(rotation*Math.PI/180);
  ctx.drawImage(image,-image.width*scale/2,-image.height*scale/2,image.width*scale,image.height*scale);ctx.restore();
}

function blurredBackground(ctx:CanvasRenderingContext2D,image:ImageBitmap,width:number,height:number,rotation:number){
  const factor=Math.min(1,256/Math.max(width,height));const small=document.createElement('canvas');small.width=Math.max(1,Math.round(width*factor));small.height=Math.max(1,Math.round(height*factor));
  const temp=small.getContext('2d');if(!temp)throw new Error('Canvas unavailable');temp.fillStyle='#fff';temp.fillRect(0,0,small.width,small.height);
  place(temp,image,0,0,small.width,small.height,true,rotation,50,50);
  const pixels=temp.getImageData(0,0,small.width,small.height);const count=small.width*small.height;const radius=Math.max(1,Math.round(Math.max(small.width,small.height)*0.035));
  for(let channel=0;channel<3;channel++){const values=new Uint8ClampedArray(count);for(let i=0;i<count;i++)values[i]=pixels.data[i*4+channel];const blurred=blurChannel(values,small.width,small.height,radius);for(let i=0;i<count;i++)pixels.data[i*4+channel]=blurred[i]}
  temp.putImageData(pixels,0,0);ctx.drawImage(small,0,0,width,height);small.width=0;small.height=0;
}

export function drawResized(ctx:CanvasRenderingContext2D,image:ImageBitmap,width:number,height:number,options:Options){
  ctx.clearRect(0,0,width,height);
  if(options.circle){const side=Math.min(width,height);ctx.save();ctx.beginPath();ctx.arc(width/2,height/2,side/2,0,Math.PI*2);ctx.clip();place(ctx,image,(width-side)/2,(height-side)/2,side,side,true,options.rotation,options.x,options.y,options.zoom);ctx.restore();return}
  if(options.mode==='pad'){if(options.blur)blurredBackground(ctx,image,width,height,options.rotation);else{ctx.fillStyle=options.background;ctx.fillRect(0,0,width,height)}}
  place(ctx,image,0,0,width,height,options.mode==='crop',options.rotation,options.x,options.y,options.zoom);
}
