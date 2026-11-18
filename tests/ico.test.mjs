import test from 'node:test';
import assert from 'node:assert/strict';
import { encodeIco } from '../src/engines/ico.ts';

const png = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10, 0]);

test('writes ICO header and PNG directory entries with valid offsets', async () => {
  const blob = encodeIco([{ size: 16, png }, { size: 256, png }]);
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const view = new DataView(bytes.buffer);
  assert.equal(blob.type, 'image/x-icon');
  assert.deepEqual([view.getUint16(0, true), view.getUint16(2, true), view.getUint16(4, true)], [0, 1, 2]);
  assert.deepEqual([bytes[6], bytes[7], view.getUint16(10, true), view.getUint16(12, true)], [16, 16, 1, 32]);
  assert.deepEqual([bytes[22], bytes[23], view.getUint16(26, true), view.getUint16(28, true)], [0, 0, 1, 32]);
  for (const index of [0, 1]) {
    const at = 6 + index * 16;
    const size = view.getUint32(at + 8, true);
    const offset = view.getUint32(at + 12, true);
    assert.equal(size, png.length);
    assert.ok(offset >= 38 && offset + size <= bytes.length);
    assert.deepEqual([...bytes.subarray(offset, offset + 8)], [...png.subarray(0, 8)]);
  }
});

test('rejects invalid or duplicate ICO frame sizes and non-PNG payloads', () => {
  assert.throws(() => encodeIco([]), RangeError);
  assert.throws(() => encodeIco([{ size: 16, png }, { size: 16, png }]), RangeError);
  assert.throws(() => encodeIco([{ size: 512, png }]), RangeError);
  assert.throws(() => encodeIco([{ size: 16, png: new Uint8Array(8) }]), TypeError);
});
