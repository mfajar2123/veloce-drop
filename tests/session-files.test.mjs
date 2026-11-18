import test from 'node:test';
import assert from 'node:assert/strict';
import {addSessionFile, clearSessionFiles, handoffSessionFile, listSessionFiles, removeSessionFile, takeSessionFile} from '../src/engines/session-files.ts';

test('session evicts oldest items, respects byte limit and consumes handoff only at the target',()=>{
  globalThis.window={};
  const blob=new Blob(['image'],{type:'image/png'});
  const ids=Array.from({length:6},()=>addSessionFile(blob,10,20));
  assert.equal(listSessionFiles().length,5);
  assert.equal(listSessionFiles().some(item=>item.id===ids[0]),false);
  assert.equal(handoffSessionFile(ids[5],'/target/'),true);
  assert.equal(takeSessionFile('/other/'),null);
  assert.equal(takeSessionFile('/target/').size,5);
  assert.equal(takeSessionFile('/target/'),null);
  removeSessionFile(ids[5]);assert.equal(listSessionFiles().length,4);
  const large=new Blob([new Uint8Array(50_000_001)]);
  assert.equal(addSessionFile(large,1,1),null);
  clearSessionFiles();assert.equal(listSessionFiles().length,0);
});

test('expired items and their pending handoff are discarded',()=>{
  globalThis.window={};
  const id=addSessionFile(new Blob(['x'],{type:'image/png'}),1,1);
  handoffSessionFile(id,'/target/');
  window.__veloceSession.files[0].created=Date.now()-31*60*1000;
  assert.equal(listSessionFiles().length,0);
  assert.equal(takeSessionFile('/target/'),null);
  clearSessionFiles();
});

test('aggregate byte limit evicts oldest files',()=>{
  globalThis.window={};
  const first=addSessionFile(new Blob([new Uint8Array(30_000_000)]),1,1);
  const second=addSessionFile(new Blob([new Uint8Array(25_000_000)]),1,1);
  assert.deepEqual(listSessionFiles().map(item=>item.id),[second]);
  assert.equal(handoffSessionFile(first,'/target/'),false);
  clearSessionFiles();
});

test('handoff filenames keep the Blob format extension',()=>{
  globalThis.window={};
  for(const [type,extension] of [['image/jpeg','jpg'],['image/webp','webp'],['application/pdf','pdf'],['application/zip','zip']]){
    const blob=new Blob(['file'],{type});
    const id=addSessionFile(blob,10,20);
    assert.equal(handoffSessionFile(id,'/format/'),true);
    const file=takeSessionFile('/format/');
    assert.equal(file.name,`velocedrop.${extension}`);
    assert.equal(file.type,type);
  }
  clearSessionFiles();
});
