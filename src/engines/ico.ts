export type IcoFrame = { size: number; png: Uint8Array };
const signature = [137, 80, 78, 71, 13, 10, 26, 10];

export function encodeIco(frames: IcoFrame[]) {
  if (!frames.length || frames.length > 32) throw new RangeError('Invalid ICO frame count');
  const sizes = new Set<number>();
  for (const frame of frames) {
    if (!Number.isInteger(frame.size) || frame.size < 1 || frame.size > 256 || sizes.has(frame.size)) throw new RangeError('Invalid ICO frame size');
    if (frame.png.length < 8 || !signature.every((byte, index) => frame.png[index] === byte)) throw new TypeError('ICO frames must contain PNG images');
    sizes.add(frame.size);
  }
  const directoryBytes = 6 + frames.length * 16;
  const totalBytes = directoryBytes + frames.reduce((sum, frame) => sum + frame.png.length, 0);
  if (totalBytes > 100_000_000) throw new RangeError('ICO exceeds the 100 MB output limit');
  const output = new Uint8Array(totalBytes);
  const view = new DataView(output.buffer);
  view.setUint16(0, 0, true);
  view.setUint16(2, 1, true);
  view.setUint16(4, frames.length, true);
  let offset = directoryBytes;
  frames.forEach((frame, index) => {
    const at = 6 + index * 16;
    output[at] = frame.size === 256 ? 0 : frame.size;
    output[at + 1] = frame.size === 256 ? 0 : frame.size;
    output[at + 2] = 0;
    output[at + 3] = 0;
    view.setUint16(at + 4, 1, true);
    view.setUint16(at + 6, 32, true);
    view.setUint32(at + 8, frame.png.length, true);
    view.setUint32(at + 12, offset, true);
    output.set(frame.png, offset);
    offset += frame.png.length;
  });
  return new Blob([output], { type: 'image/x-icon' });
}
