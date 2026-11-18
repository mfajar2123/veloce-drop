import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const projectRoot = fileURLToPath(new URL('..', import.meta.url));
const sourceRoot = join(projectRoot, 'src');
const sourceExtensions = new Set(['.astro', '.ts', '.tsx']);

async function sourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async entry => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return sourceExtensions.has(path.slice(path.lastIndexOf('.'))) ? [path] : [];
  }));
  return nested.flat();
}

test('browser source keeps user files out of storage, telemetry and outbound fetches', async () => {
  const files = await sourceFiles(sourceRoot);
  const sources = await Promise.all(files.map(async path => [path, await readFile(path, 'utf8')]));
  const forbidden = /\b(?:window|globalThis|navigator)\.(?:localStorage|sessionStorage|indexedDB|serviceWorker|sendBeacon)\b|\bnew\s+(?:XMLHttpRequest|WebSocket)\b|\bcaches\.open\s*\(/;
  const violations = sources.filter(([, source]) => forbidden.test(source)).map(([path]) => path);
  assert.deepEqual(violations, []);

  const fetches = sources.filter(([, source]) => /\bfetch\s*\(/.test(source));
  const allowed = new Set([
    join(sourceRoot, 'components/Compressor.tsx'),
    join(sourceRoot, 'workers/modnet.worker.ts'),
  ]);
  assert.deepEqual(fetches.map(([path]) => path).sort(), [...allowed].sort());
  const compressor = fetches.find(([path]) => path.endsWith('Compressor.tsx'))[1];
  const modelWorker = fetches.find(([path]) => path.endsWith('modnet.worker.ts'))[1];
  assert.match(compressor, /fetch\('\/images\/landing-workspace-sample\.webp',\s*\{\s*credentials:\s*'same-origin'\s*\}\)/);
  assert.match(modelWorker, /fetch\(path,\{credentials:'same-origin'\}\)/);
  assert.doesNotMatch(modelWorker, /body\s*:/);
});
