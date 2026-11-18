import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectPng } from '../src/engines/png.ts';

const signature = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]);
function chunk(type, data = new Uint8Array()) {
  const bytes = new Uint8Array(12 + data.length);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, data.length);
  bytes.set(new TextEncoder().encode(type), 4);
  bytes.set(data, 8);
  return bytes;
}
function png(extra = []) {
  const ihdr = new Uint8Array(13);
  new DataView(ihdr.buffer).setUint32(0, 16);
  new DataView(ihdr.buffer).setUint32(4, 8);
  const chunks = [chunk('IHDR', ihdr), ...extra, chunk('IDAT', Uint8Array.of(0)), chunk('IEND')];
  return Buffer.concat([Buffer.from(signature), ...chunks.map(Buffer.from)]);
}

test('PNG inspection strips private metadata while keeping image and alpha chunks', () => {
  const input = png([chunk('tEXt', new TextEncoder().encode('Comment\0sensitive note')), chunk('tRNS', Uint8Array.of(0))]);
  const result = inspectPng(input);
  const output = Buffer.from(result.sanitized);
  assert.equal(result.width, 16);
  assert.equal(result.height, 8);
  assert.equal(output.includes(Buffer.from('sensitive note')), false);
  assert.equal(output.includes(Buffer.from('tRNS')), true);
  assert.equal(output.includes(Buffer.from('IDAT')), true);
});

test('PNG inspection rejects malformed, oversized, and animated files', () => {
  assert.throws(() => inspectPng(new Uint8Array(20)), /png-signature/);
  const huge = png();
  const view = new DataView(huge.buffer, huge.byteOffset, huge.byteLength);
  view.setUint32(16, 7000);
  view.setUint32(20, 7000);
  assert.throws(() => inspectPng(huge), /png-dimensions/);
  assert.throws(() => inspectPng(png([chunk('acTL', new Uint8Array(8))])), /png-animated/);
});
