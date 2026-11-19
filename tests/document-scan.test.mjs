import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile('src/engines/document-scan.ts', 'utf8');

// The engine imports nothing and only uses types, so the module body can be
// stripped of type annotations by Node's experimental type stripping.
const { detectDocumentQuad, warpQuad } = await import('../src/engines/document-scan.ts');

function makeFrame(width, height, quad) {
  const data = new Uint8ClampedArray(width * height * 4);
  const inside = (x, y) => {
    // Even-odd point-in-polygon test, the same rule a fill would use.
    let hit = false;
    for (let i = 0, j = quad.length - 1; i < quad.length; j = i++) {
      const [xi, yi] = quad[i];
      const [xj, yj] = quad[j];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
    }
    return hit;
  };
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const value = inside(x, y) ? 245 : 35;
      const index = (y * width + x) * 4;
      data[index] = value;
      data[index + 1] = value;
      data[index + 2] = value;
      data[index + 3] = 255;
    }
  }
  return { data, width, height };
}

const cornerDistance = (detected, expected) => Math.max(...detected.map((point, index) => Math.hypot(point.x - expected[index].x, point.y - expected[index].y)));

test('detects an upright page and returns its four corners in order', () => {
  const expected = [
    { x: 100, y: 80 },
    { x: 520, y: 80 },
    { x: 520, y: 700 },
    { x: 100, y: 700 },
  ];
  const frame = makeFrame(700, 800, expected.map(point => [point.x, point.y]));
  const quad = detectDocumentQuad(frame.data, frame.width, frame.height);
  assert.ok(quad, 'a clear white page on a dark background must be detected');
  assert.ok(cornerDistance(quad, expected) < 45, `corners were off: ${JSON.stringify(quad)}`);
  assert.deepEqual(quad.map(point => point.x < 350 ? 'left' : 'right'), ['left', 'right', 'right', 'left']);
});

test('detects a tilted page, which is the case that matters for a camera', () => {
  const expected = [
    { x: 190, y: 130 },
    { x: 610, y: 70 },
    { x: 655, y: 640 },
    { x: 235, y: 700 },
  ];
  const frame = makeFrame(760, 780, expected.map(point => [point.x, point.y]));
  const quad = detectDocumentQuad(frame.data, frame.width, frame.height);
  assert.ok(quad, 'a tilted page must still be detected');
  assert.ok(cornerDistance(quad, expected) < 60, `corners were off: ${JSON.stringify(quad)}`);
});

test('refuses to invent a page when the frame is empty', () => {
  const frame = makeFrame(400, 400, [[0, 0], [0, 0], [0, 0], [0, 0]]).data;
  // Uniform dark frame: no gradient, so nothing should be claimed.
  frame.fill(30);
  for (let index = 3; index < frame.length; index += 4) frame[index] = 255;
  assert.equal(detectDocumentQuad(frame, 400, 400), null);
});

test('rejects a page that covers far too little of the frame', () => {
  const tiny = [[190, 180], [215, 180], [215, 205], [190, 205]];
  const frame = makeFrame(400, 400, tiny);
  assert.equal(detectDocumentQuad(frame.data, frame.width, frame.height), null);
});

test('the engine stays free of DOM globals in its detection path', () => {
  const detection = source.slice(0, source.indexOf('type Matrix'));
  assert.ok(!/document\.|window\./.test(detection), 'detection must be pure so it can run in a worker or a test');
});

test('warps a tilted page into an upright rectangle with the paper, not the desk, in frame', () => {
  // Minimal ImageData stand-in: warpQuad only needs width, height and data.
  globalThis.ImageData ??= class {
    constructor(width, height) { this.width = width; this.height = height; this.data = new Uint8ClampedArray(width * height * 4); }
  };

  const tilted = [
    { x: 120, y: 90 },
    { x: 520, y: 150 },
    { x: 470, y: 640 },
    { x: 90, y: 560 },
  ];
  const frame = makeFrame(640, 720, tilted.map(point => [point.x, point.y]));
  const quad = detectDocumentQuad(frame.data, frame.width, frame.height);
  assert.ok(quad, 'tilted page should be detected before warping');

  const warped = warpQuad({ data: frame.data, width: frame.width, height: frame.height }, quad, { maxLongSide: 400 });
  assert.ok(warped.width > 200 && warped.height > 200, `unexpected output size ${warped.width}x${warped.height}`);

  // Three of the four corners sit on the dark desk, so a correct warp must
  // sample almost only paper. A wrong homography would drag the desk inside.
  const luminanceAt = (x, y) => {
    const index = (y * warped.width + x) * 4;
    return (warped.data[index] + warped.data[index + 1] + warped.data[index + 2]) / 3;
  };
  const inset = 6;
  const samples = [
    luminanceAt(inset, inset),
    luminanceAt(warped.width - inset - 1, inset),
    luminanceAt(warped.width - inset - 1, warped.height - inset - 1),
    luminanceAt(inset, warped.height - inset - 1),
  ];
  for (const sample of samples) assert.ok(sample > 200, `a corner of the warp landed on the background (${sample})`);
});
