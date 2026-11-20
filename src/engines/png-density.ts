export async function setPngPrintDensity(blob: Blob, dpi: number): Promise<Blob> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const view = new DataView(bytes.buffer);
  const chunk = new Uint8Array(21);
  const fields = new DataView(chunk.buffer);
  fields.setUint32(0, 9);
  chunk.set([112, 72, 89, 115], 4);
  const pixelsPerMeter = Math.round(dpi / 0.0254);
  fields.setUint32(8, pixelsPerMeter);
  fields.setUint32(12, pixelsPerMeter);
  chunk[16] = 1;
  let crc = 0xffffffff;
  for (const byte of chunk.subarray(4, 17)) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  fields.setUint32(17, crc ^ 0xffffffff);

  const parts: BlobPart[] = [bytes.slice(0, 33), chunk];
  for (let offset = 33; offset + 12 <= bytes.length;) {
    const end = offset + 12 + view.getUint32(offset);
    if (view.getUint32(offset + 4) !== 0x70485973) parts.push(bytes.slice(offset, end));
    offset = end;
  }
  return new Blob(parts, { type: 'image/png' });
}
