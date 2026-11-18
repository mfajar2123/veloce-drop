import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const headersPath = fileURLToPath(new URL('../public/_headers', import.meta.url));

test('static host policy blocks active content and limits browser capabilities', async () => {
  const lines = (await readFile(headersPath, 'utf8')).split(/\r?\n/).map(line => line.trim());
  const values = new Map(lines.filter(line => line && !line.startsWith('/*') && !line.startsWith('*/')).map(line => {
    const separator = line.indexOf(':');
    return [line.slice(0, separator), line.slice(separator + 1).trim()];
  }));

  assert.equal(lines[0], '/*');
  assert(!lines.includes('*/'));
  assert.equal(values.get('X-Content-Type-Options'), 'nosniff');
  assert.equal(values.get('Referrer-Policy'), 'strict-origin-when-cross-origin');
  assert.equal(values.get('X-Frame-Options'), 'DENY');
  assert.equal(values.get('Permissions-Policy'), 'camera=(), microphone=(), geolocation=()');

  const directives = new Map(values.get('Content-Security-Policy').split(';').map(part => {
    const [name, ...sources] = part.trim().split(/\s+/);
    return [name, sources];
  }));
  assert.deepEqual(directives.get('default-src'), ["'self'"]);
  assert.deepEqual(directives.get('base-uri'), ["'self'"]);
  assert.deepEqual(directives.get('object-src'), ["'none'"]);
  assert.deepEqual(directives.get('frame-ancestors'), ["'none'"]);
  assert.deepEqual(directives.get('form-action'), ["'self'"]);
  // data: is needed so tests and the app can read locally generated image
  // blobs back through fetch without a network request.
  assert.deepEqual(directives.get('connect-src'), ["'self'", 'blob:', 'data:']);
  assert(directives.get('script-src').includes("'self'"));
  assert(directives.get('script-src').includes("'wasm-unsafe-eval'"));
  // The Emscripten-based HEIC decoder evaluates generated code at runtime and
  // fails to decode without 'unsafe-eval'. Confirm that exception stays paired
  // with the rest of the lockdown rather than widening any other directive.
  assert(directives.get('script-src').includes("'unsafe-eval'"));
  assert(![...directives.values()].flat().includes('*'));
});
