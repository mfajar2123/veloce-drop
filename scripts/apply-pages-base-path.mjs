import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const basePath = (process.env.PUBLIC_BASE_PATH || '/').replace(/^\/*/, '/').replace(/\/*$/, '/');

const roots = '(?:id/|en/|images/|favicon\\.svg|models/|ort/|pdfjs/|licenses/|sitemap\\.xml|robots\\.txt)';
const rootedPath = new RegExp("(^|[\\\"'`(=:{\\s])\\/(" + roots + ")", 'g');
const textExtensions = new Set(['.html', '.js', '.css', '.xml', '.txt', '.json', '.webmanifest', '.map']);

async function rewrite(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      await rewrite(path);
    } else if ([...textExtensions].some(extension => entry.name.endsWith(extension))) {
      const contents = await readFile(path, 'utf8');
      const updated = contents.replace(rootedPath, (_match, before, route) => `${before}${basePath}${route}`);
      if (updated !== contents) await writeFile(path, updated, 'utf8');
    }
  }
}

await rewrite('dist');
console.log(`Applied GitHub Pages base path ${basePath} to static routes and assets.`);
