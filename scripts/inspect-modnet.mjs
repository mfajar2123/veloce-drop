import * as ort from 'onnxruntime-web/wasm';
import { readFile } from 'node:fs/promises';
ort.env.wasm.numThreads = 1;
const session = await ort.InferenceSession.create(new Uint8Array(await readFile('public/models/modnet.onnx')), { executionProviders: ['wasm'] });
process.stdout.write(JSON.stringify({ inputs: session.inputNames, inputMetadata: session.inputMetadata, outputs: session.outputNames, outputMetadata: session.outputMetadata }, null, 2));
await session.release();
