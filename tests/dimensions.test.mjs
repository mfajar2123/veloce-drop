import test from 'node:test';
import assert from 'node:assert/strict';
import {toPixels,fromPixels} from '../src/engines/dimensions.ts';

test('physical and relative dimensions convert in both directions',()=>{
  assert.equal(Math.round(toPixels(3,'cm',300,0)),354);
  assert.equal(Math.round(toPixels(40,'mm',300,0)),472);
  assert.equal(toPixels(2,'in',72,0),144);
  assert.equal(toPixels(50,'%',300,800),400);
  for(const unit of ['px','cm','mm','in','%']){
    const pixels=toPixels(23,unit,300,800);
    assert.ok(Math.abs(fromPixels(pixels,unit,300,800)-23)<1e-9);
  }
});
