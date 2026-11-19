import { readFile, writeFile } from 'node:fs/promises';

const path = 'README.md';
let source = await readFile(path, 'utf8');
const before = source;

source = source.replace(
  'Doculven is a bilingual static site with 10 image and document tools processed in the browser.',
  'Doculven is a bilingual static site with 11 image and document tools processed in the browser, including a camera document scanner.',
);

source = source.replace(
  '`netlify.toml` holds the build command (`pnpm build`), the `dist` publish directory, the `/` to `/id/` redirect, and long-lived caching for hashed assets.',
  '`netlify.toml` holds the build command (`pnpm build`), the `dist` publish directory, the `/` to `/en/` redirect, and long-lived caching for hashed assets. Camera access is denied site-wide by `Permissions-Policy` and re-enabled only for the two scanner routes, in `public/_headers`.',
);

await writeFile(path, source, 'utf8');
console.log('changed:', source !== before);
