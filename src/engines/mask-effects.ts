function check(alpha:Uint8ClampedArray,width:number,height:number,radius:number){
  if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||alpha.length!==width*height||!Number.isInteger(radius)||radius<0)throw new RangeError('Invalid mask dimensions or radius');
}

function boxPass(input:Uint8ClampedArray,width:number,height:number,radius:number,horizontal:boolean){
  const output=new Uint8ClampedArray(input.length);const lines=horizontal?height:width;const length=horizontal?width:height;const window=radius*2+1;
  for(let line=0;line<lines;line++){
    const at=(position:number)=>horizontal?line*width+position:position*width+line;
    const clamp=(position:number)=>Math.max(0,Math.min(length-1,position));let sum=0;
    for(let position=-radius;position<=radius;position++)sum+=input[at(clamp(position))];
    for(let position=0;position<length;position++){
      output[at(position)]=sum/window;
      sum+=input[at(clamp(position+radius+1))]-input[at(clamp(position-radius))];
    }
  }
  return output;
}

/** Separable box blur for one channel with clamped edges. */
export function blurChannel(alpha:Uint8ClampedArray,width:number,height:number,radius:number){
  check(alpha,width,height,radius);if(!radius)return new Uint8ClampedArray(alpha);
  return boxPass(boxPass(alpha,width,height,radius,true),width,height,radius,false);
}
export const featherAlpha=blurChannel;

function maxPass(input:Uint8ClampedArray,width:number,height:number,radius:number,horizontal:boolean){
  const output=new Uint8ClampedArray(input.length);const lines=horizontal?height:width;const length=horizontal?width:height;const deque=new Int32Array(length);
  for(let line=0;line<lines;line++){
    const at=(position:number)=>horizontal?line*width+position:position*width+line;let head=0,tail=0;
    for(let position=0;position<length+radius;position++){
      if(position<length){while(tail>head&&input[at(deque[tail-1])]<=input[at(position)])tail--;deque[tail++]=position}
      const outputPosition=position-radius;
      if(outputPosition>=0&&outputPosition<length){while(head<tail&&deque[head]<outputPosition-radius)head++;output[at(outputPosition)]=input[at(deque[head])]}
    }
  }
  return output;
}

/** Square dilation for an outline, using a bounded linear-time sliding maximum. */
export function dilateAlpha(alpha:Uint8ClampedArray,width:number,height:number,radius:number){
  check(alpha,width,height,radius);if(!radius)return new Uint8ClampedArray(alpha);
  return maxPass(maxPass(alpha,width,height,radius,true),width,height,radius,false);
}
