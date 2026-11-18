import { access, readFile, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';

const root = 'dist';
const basePath = (process.env.PUBLIC_BASE_PATH || '/').replace(/^\/*/, '/').replace(/\/*$/, '/');
const requiredFiles = [
  'index.html',
  '404.html',
  'id/index.html',
  'en/index.html',
  'favicon.svg',
  'favicon-96.png',
  'images/og-share.png',
  'images/landing-workspace-sample.webp',
  'images/landing-product-sample.webp',
  'models/modnet.onnx',
  'ort/ort-wasm-simd-threaded.wasm',
  'robots.txt',
  'sitemap.xml',
];

for (const file of requiredFiles) await access(join(root, file));

const favicon = await readFile(join(root, 'favicon-96.png'));
if (favicon.readUInt32BE(16) !== 96 || favicon.readUInt32BE(20) !== 96) {
  throw new Error('Google Search favicon must be a 96 × 96 PNG.');
}

const html = await readFile(join(root, 'id/index.html'), 'utf8');
const rootIndex = await readFile(join(root, 'index.html'), 'utf8');
if (!html.includes('rel="icon"') || !html.includes('canonical')) {
  throw new Error('Landing page is missing its favicon or canonical URL.');
}
for (const expected of [`${basePath}favicon-96.png`, `${basePath}images/landing-workspace-sample.webp`, `${basePath}id/`]) {
  if (!html.includes(expected)) throw new Error(`Landing HTML is missing base-prefixed reference: ${expected}`);
}
for (const expected of [`${basePath}favicon-96.png`, `${basePath}id/`]) {
  if (!rootIndex.includes(expected)) throw new Error(`Root redirect page is missing base-prefixed reference: ${expected}`);
}

const notFound = await readFile(join(root, '404.html'), 'utf8');
for (const expected of [`${basePath}favicon-96.png`, `${basePath}id/`, `${basePath}en/`, `${basePath}id/alat/`]) {
  if (!notFound.includes(expected)) throw new Error(`404 page is missing base-prefixed reference: ${expected}`);
}

async function collectHtml(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collectHtml(path));
    else if (entry.name.endsWith('.html')) files.push(path);
  }
  return files;
}

const htmlFiles = await collectHtml(root);
for (const file of htmlFiles) {
  const source = await readFile(file, 'utf8');
  const pagePath = file.slice(root.length).replaceAll('\\', '/').replace(/^\/+/, '');
  const pageUrl = new URL(`${basePath}${pagePath}`, 'https://pages.invalid');
  for (const [, reference] of source.matchAll(/(?:src|href)="([^"]+)"/g)) {
    if (!reference || /^(?:#|[a-z][a-z\d+.-]*:|\/\/)/i.test(reference)) continue;
    const assetUrl = new URL(reference, pageUrl);
    if (!assetUrl.pathname.startsWith(basePath)) {
      throw new Error(`${file.replaceAll('\\', '/')} contains a local reference outside the Pages base path: ${reference}`);
    }
    let relativePath = assetUrl.pathname.slice(basePath.length);
    if (relativePath.endsWith('/')) relativePath += 'index.html';
    else if (!relativePath.split('/').at(-1)?.includes('.')) relativePath += '/index.html';
    try {
      await access(join(root, decodeURIComponent(relativePath)));
    } catch {
      throw new Error(`${file.replaceAll('\\', '/')} references a missing Pages file: ${reference}`);
    }
  }
}

const localizedPages = [];
for (const locale of ['id', 'en']) localizedPages.push(...await collectHtml(join(root, locale)));
const pageTitles = new Map();
const pageDescriptions = new Map();
const canonicals = new Map();
for (const file of localizedPages) {
  const source = await readFile(file, 'utf8');
  const page = file.replaceAll('\\', '/');
  for (const [label, pattern] of [
    ['title', /<title>[^<]+<\/title>/],
    ['meta description', /<meta name="description" content="[^"]+"/],
    ['canonical', /<link rel="canonical" href="https?:\/\//],
    ['Indonesian alternate', /hreflang="id"/],
    ['English alternate', /hreflang="en"/],
    ['Open Graph title', /property="og:title" content="[^"]+"/],
    ['Open Graph description', /property="og:description" content="[^"]+"/],
    ['Open Graph URL', /property="og:url" content="https?:\/\//],
    ['Open Graph image', /property="og:image" content="https?:\/\//],
    ['Twitter card', /name="twitter:card" content="summary_large_image"/],
  ]) {
    if (!pattern.test(source)) throw new Error(`${page} is missing its ${label}.`);
  }
  for (const [label, pattern, index] of [
    ['title', /<title>([^<]+)<\/title>/, pageTitles],
    ['meta description', /<meta name="description" content="([^"]+)"/, pageDescriptions],
    ['canonical', /<link rel="canonical" href="([^"]+)"/, canonicals],
  ]) {
    const value = source.match(pattern)?.[1];
    if (!value) throw new Error(`${page} is missing its ${label} value.`);
    if (label === 'title' && value.length > 70) throw new Error(`${page} has an overlong title (${value.length} characters).`);
    if (label === 'meta description' && (value.length < 60 || value.length > 160)) {
      throw new Error(`${page} has an unhelpful meta description length (${value.length} characters).`);
    }
    const previous = index.get(value);
    if (previous) throw new Error(`${page} duplicates ${label} from ${previous}: ${value}`);
    index.set(value, page);
  }
  if (/rel="canonical" href="https?:\/\/[^" ]*velocedrop\.example/.test(source)) {
    throw new Error(`${page} still uses the placeholder canonical domain.`);
  }
  const isHome = /\/(?:id|en)\/index\.html$/.test(page);
  if (!isHome) {
    const schemas = [...source.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
      .map(([, value]) => JSON.parse(value));
    const breadcrumb = schemas.find(schema => schema['@type'] === 'BreadcrumbList');
    if (!breadcrumb || breadcrumb.itemListElement?.length < 2) {
      throw new Error(`${page} is missing a valid breadcrumb trail.`);
    }
    const positions = breadcrumb.itemListElement.map(item => item.position);
    if (positions.some((position, index) => position !== index + 1)) {
      throw new Error(`${page} has invalid breadcrumb positions.`);
    }
  }
}

const sitemap = await readFile(join(root, 'sitemap.xml'), 'utf8');
if (!sitemap.includes(`${basePath}id/`) || !sitemap.includes(`${basePath}en/`)) {
  throw new Error('Sitemap URLs do not include the configured base path.');
}

const robots = await readFile(join(root, 'robots.txt'), 'utf8');
if (!robots.includes(`${basePath}sitemap.xml`)) throw new Error('robots.txt points to the wrong sitemap URL.');

const assetStats = await Promise.all(['models/modnet.onnx', 'ort/ort-wasm-simd-threaded.wasm'].map(file => stat(join(root, file))));
if (assetStats.some(file => file.size < 100_000)) {
  throw new Error('A required large inference asset is unexpectedly small.');
}

console.log(`Static output verified (${requiredFiles.length} required paths and ${localizedPages.length} localized page metadata sets).`);
