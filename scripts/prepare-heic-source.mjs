import { createRequire } from 'node:module';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { zipSync } from 'fflate';

const require = createRequire(import.meta.url);
let packageRoot = dirname(require.resolve('heic-to'));
while (packageRoot !== dirname(packageRoot)) {
  let metadata;
  try {
    metadata = JSON.parse(await readFile(join(packageRoot, 'package.json'), 'utf8'));
  } catch (error) {
    if (error instanceof SyntaxError) throw error;
  }
  if (metadata?.name === 'heic-to') {
    if (metadata.version !== '1.6.7' || metadata.license !== 'LGPL-3.0') {
      throw new Error(`Update the LGPL source archive review for heic-to ${metadata.version} (${metadata.license}).`);
    }
    break;
  }
  packageRoot = dirname(packageRoot);
}

if (packageRoot === dirname(packageRoot)) throw new Error('Could not locate the installed heic-to package.');

const files = [
  'LICENSE',
  'package.json',
  'esbuild.mjs',
  'src/index.js',
  'src/worker.js',
  'src/lib/libheif.js',
];
const entries = {};
for (const file of files) {
  entries[`heic-to-1.6.7/${file}`] = new Uint8Array(await readFile(join(packageRoot, file)));
}
entries['heic-to-1.6.7/README.txt'] = new TextEncoder().encode(
  'heic-to 1.6.7 LGPL-3.0 corresponding source files\n\n' +
  'This archive contains the source files used by the Doculven browser build, including the generated libheif JavaScript module. ' +
  'The package build script uses esbuild 0.25 to rebuild its browser module. The package license is included as LICENSE. ' +
  'To rebuild in a copy of this package, install its declared development dependencies and run `node esbuild.mjs`.\n',
);

const output = resolve('public/licenses/heic-to-1.6.7-source.zip');
await writeFile(output, zipSync(entries, { level: 6 }));
console.log(`Prepared heic-to 1.6.7 LGPL source archive (${Object.keys(entries).length} files).`);
