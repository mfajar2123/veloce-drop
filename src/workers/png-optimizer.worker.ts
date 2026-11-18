import optimise from '@jsquash/oxipng/optimise';

self.onmessage = async (event: MessageEvent<ArrayBuffer>) => {
  try {
    const output = await optimise(event.data, { level: 4, interlace: false, optimiseAlpha: false });
    self.postMessage({ ok: true, output }, { transfer: [output] });
  } catch {
    self.postMessage({ ok: false });
  }
};
