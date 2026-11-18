import test from 'node:test';
import assert from 'node:assert/strict';
import {dilateAlpha,featherAlpha} from '../src/engines/mask-effects.ts';

test('feather preserves uniform alpha and softens a hard edge',()=>{
  assert.deepEqual([...featherAlpha(new Uint8ClampedArray(9).fill(255),3,3,2)],Array(9).fill(255));
  const edge=new Uint8ClampedArray([0,0,255,255,255]);const result=featherAlpha(edge,5,1,1);
  assert.deepEqual([...result],[0,85,170,255,255]);assert.deepEqual([...edge],[0,0,255,255,255]);
});
test('linear dilation agrees with a simple reference for multiple shapes and radii',()=>{
  for(const [width,height] of [[1,1],[2,7],[7,2],[7,5]])for(const radius of [0,1,2,8]){
    const input=Uint8ClampedArray.from({length:width*height},(_,i)=>(i*73+19)%256);const expected=[];
    for(let y=0;y<height;y++)for(let x=0;x<width;x++){let maximum=0;for(let dy=-radius;dy<=radius;dy++)for(let dx=-radius;dx<=radius;dx++){const px=x+dx,py=y+dy;if(px>=0&&px<width&&py>=0&&py<height)maximum=Math.max(maximum,input[py*width+px])}expected.push(maximum)}
    assert.deepEqual([...dilateAlpha(input,width,height,radius)],expected);
  }
});
test('invalid dimensions do not silently produce a mask',()=>{assert.throws(()=>featherAlpha(new Uint8ClampedArray(3),2,2,1),RangeError)});
