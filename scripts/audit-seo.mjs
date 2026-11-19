import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

async function collect(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collect(path));
    else if (entry.name === 'index.html') files.push(path);
  }
  return files;
}

const files = (await collect('dist/en')).filter(file => !file.includes('articles'));
const rows = [];

for (const file of files) {
  const html = await readFile(file, 'utf8');
  const route = '/' + file.replace(/\\/g, '/').split('dist/en/')[1].replace('/index.html', '') + '/';
  const title = (html.match(/<title>([^<]+)<\/title>/) ?? [])[1] ?? '';
  const description = (html.match(/<meta name="description" content="([^"]+)"/) ?? [])[1] ?? '';
  const h1 = (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) ?? [])[1]?.replace(/<[^>]+>/g, '').trim() ?? '';
  const h2s = [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g)].map(m => m[1].replace(/<[^>]+>/g, '').trim());
  const words = html.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  const schemas = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => JSON.parse(m[1])['@type']);
  rows.push({ route, titleLen: title.length, descLen: description.length, h1, h2Count: h2s.length, words, schemas: schemas.join(',') });
}

for (const row of rows) console.log(JSON.stringify(row));
