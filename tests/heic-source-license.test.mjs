import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { unzipSync } from 'fflate';

const require = createRequire(import.meta.url);
const projectRoot = fileURLToPath(new URL('..', import.meta.url));
const archivePath = join(projectRoot, 'public/licenses/heic-to-1.6.7-source.zip');
let packageRoot = dirname(require.resolve('heic-to'));
while (packageRoot !== dirname(packageRoot)) {
  try {
    if (JSON.parse(await readFile(join(packageRoot, 'package.json'), 'utf8')).name === 'heic-to') break;
  } catch {
    // Walk up until the installed package root is found.
  }
  packageRoot = dirname(packageRoot);
}

test('published heic-to LGPL archive contains the exact installed source and license', async () => {
  const archive = unzipSync(new Uint8Array(await readFile(archivePath)));
  const packageFiles = ['LICENSE', 'package.json', 'esbuild.mjs', 'src/index.js', 'src/worker.js', 'src/lib/libheif.js'];
  for (const file of packageFiles) {
    assert.deepEqual(archive[`heic-to-1.6.7/${file}`], new Uint8Array(await readFile(join(packageRoot, file))), file);
  }
  const metadata = JSON.parse(new TextDecoder().decode(archive['heic-to-1.6.7/package.json']));
  assert.equal(metadata.version, '1.6.7');
  assert.equal(metadata.license, 'LGPL-3.0');
  assert.match(new TextDecoder().decode(archive['heic-to-1.6.7/README.txt']), /rebuild its browser module/);
});
