import { readFile } from 'node:fs/promises';

const html = await readFile('dist/en/resize-image/index.html', 'utf8');
const hreflang = [...html.matchAll(/hreflang="([^"]+)" href="([^"]+)"/g)].map(m => `${m[1]} -> ${m[2]}`);
const canonical = (html.match(/rel="canonical" href="([^"]+)"/) ?? [])[1];
const ogLocale = (html.match(/property="og:locale" content="([^"]+)"/) ?? [])[1];
const ogAlternate = [...html.matchAll(/og:locale:alternate" content="([^"]+)"/g)].map(m => m[1]);
const robots = (html.match(/name="robots" content="([^"]+)"/) ?? [])[1];

console.log(JSON.stringify({ hreflang, canonical, ogLocale, ogAlternate, robots }, null, 2));
