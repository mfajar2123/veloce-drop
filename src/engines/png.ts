const signature = [137, 80, 78, 71, 13, 10, 26, 10];
const metadataChunks = new Set(['tEXt', 'zTXt', 'iTXt', 'eXIf', 'tIME', 'pHYs']);
const visualAncillaryChunks = new Set(['PLTE', 'tRNS', 'bKGD', 'cHRM', 'gAMA', 'iCCP', 'sRGB', 'sBIT']);

export type PngInfo = { width: number; height: number; animated: boolean; sanitized: Uint8Array };

export function inspectPng(bytes: Uint8Array): PngInfo {
  if (bytes.length < 33 || !signature.every((value, index) => bytes[index] === value)) {
    throw new Error('png-signature');
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const width = view.getUint32(16);
  const height = view.getUint32(20);
  if (!width || !height || width * height > 40_000_000) throw new Error('png-dimensions');

  const retained: Uint8Array[] = [bytes.subarray(0, 8)];
  let offset = 8;
  let animated = false;
  let foundHeader = false;
  let foundData = false;
  let foundEnd = false;
  while (offset + 12 <= bytes.length) {
    const length = view.getUint32(offset);
    const end = offset + 12 + length;
    if (end > bytes.length) throw new Error('png-chunk');
    const type = String.fromCharCode(...bytes.subarray(offset + 4, offset + 8));
    if (offset === 8 && type !== 'IHDR') throw new Error('png-structure');
    if (type === 'IHDR') foundHeader = true;
    if (type === 'IDAT') foundData = true;
    if (type === 'acTL') animated = true;
    if (type === 'IEND') {
      foundEnd = true;
      if (length !== 0 || end !== bytes.length) throw new Error('png-structure');
    }

    const critical = (bytes[offset + 4] & 0x20) === 0;
    if (!metadataChunks.has(type) && (critical || visualAncillaryChunks.has(type))) retained.push(bytes.subarray(offset, end));
    offset = end;
    if (foundEnd) break;
  }

  if (!foundHeader || !foundData || !foundEnd || offset !== bytes.length) throw new Error('png-structure');
  if (animated) throw new Error('png-animated');

  const sanitized = new Uint8Array(retained.reduce((total, chunk) => total + chunk.length, 0));
  let cursor = 0;
  for (const chunk of retained) { sanitized.set(chunk, cursor); cursor += chunk.length; }
  return { width, height, animated, sanitized };
}
