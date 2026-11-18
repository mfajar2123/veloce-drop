import test from 'node:test';
import assert from 'node:assert/strict';
import { readImageHeader } from '../src/engines/image-header.ts';

function jpegFrame(marker = 0xc0, width = 640, height = 480) {
  return new Uint8Array([0xff, 0xd8, 0xff, marker, 0, 17, 8, height >> 8, height & 255, width >> 8, width & 255, 3, 1, 0x11, 0, 2, 0x11, 0, 3, 0x11, 0, 0xff, 0xd9]);
}

function png(width = 320, height = 240) {
  const bytes = new Uint8Array(24);
  bytes.set([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82]);
  const view = new DataView(bytes.buffer);
  view.setUint32(16, width); view.setUint32(20, height);
  return bytes;
}

test('reads PNG, baseline/progressive JPEG and WebP dimensions before decode', () => {
  assert.deepEqual(readImageHeader(png()), { format: 'png', width: 320, height: 240 });
  assert.deepEqual(readImageHeader(jpegFrame()), { format: 'jpeg', width: 640, height: 480 });
  assert.deepEqual(readImageHeader(jpegFrame(0xc2, 1280, 720)), { format: 'jpeg', width: 1280, height: 720 });

  const extended = new Uint8Array(30);
  extended.set([82, 73, 70, 70, 22, 0, 0, 0, 87, 69, 66, 80, 86, 80, 56, 88]);
  extended.set([0, 0, 0, 0, 43, 1, 0, 199, 0, 0], 20);
  assert.deepEqual(readImageHeader(extended), { format: 'webp', width: 300, height: 200 });

  const lossy = new Uint8Array(30);
  lossy.set([82, 73, 70, 70, 22, 0, 0, 0, 87, 69, 66, 80, 86, 80, 56, 32]);
  lossy.set([0x9d, 0x01, 0x2a, 0x2c, 0x01, 0x90, 0x00], 23);
  assert.deepEqual(readImageHeader(lossy), { format: 'webp', width: 300, height: 144 });
});

test('rejects incomplete markers, zero dimensions, and unsupported headers', () => {
  assert.equal(readImageHeader(new Uint8Array([0xff, 0xd8, 0xff, 0xc0, 0, 17])), null);
  assert.equal(readImageHeader(png(0, 1)), null);
  assert.equal(readImageHeader(new Uint8Array([1, 2, 3, 4])), null);
});
