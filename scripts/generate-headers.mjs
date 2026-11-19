import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

async function collectHtml(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collectHtml(path));
    else if (entry.name.endsWith('.html')) files.push(path);
  }
  return files;
}

const htmlFiles = await collectHtml('dist');
const scriptHashes = new Set();

for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');
  const meta = html.match(/<meta[^>]*http-equiv="content-security-policy"[^>]*content="([^"]+)"/i);
  if (!meta) continue;
  const scriptSrc = meta[1].split(';').map(part => part.trim()).find(part => part.startsWith('script-src'));
  for (const match of scriptSrc?.matchAll(/'sha(?:256|384|512)-[^']+'/g) ?? []) scriptHashes.add(match[0]);
}

if (scriptHashes.size === 0) {
  throw new Error('No script hashes found; Astro security.csp must stay enabled or inline scripts will be blocked.');
}

const sourceHeaders = await readFile('public/_headers', 'utf8');
const [globalHeaders, ...routeHeaders] = sourceHeaders.trim().split(/\r?\n\r?\n/);
const permissions = /^\s*Permissions-Policy: (.+)$/m;
const defaultPolicy = globalHeaders.match(permissions)?.[1].trim();
if (!defaultPolicy) throw new Error('Missing default Permissions-Policy.');
const routePolicies = new Map(routeHeaders.map(block => {
  const route = block.split(/\r?\n/, 1)[0].replace(/\*$/, '');
  const policy = block.match(permissions)?.[1].trim();
  if (!policy) throw new Error(`Missing Permissions-Policy for ${route}.`);
  return [route, policy];
}));
const output = [];
for (const line of globalHeaders.split(/\r?\n/)) {
  if (permissions.test(line)) continue;
  if (!line.trim().startsWith('Content-Security-Policy:')) {
    output.push(line);
    continue;
  }
  const policy = line.slice(line.indexOf(':') + 1).trim();
  const directives = policy.split(';').map(part => part.trim()).filter(Boolean);
  const merged = directives.map(directive => {
    if (!directive.startsWith('script-src')) return directive;
    const sources = directive.split(/\s+/).slice(1).filter(source => !source.startsWith("'sha"));
    return ['script-src', ...sources, ...scriptHashes].join(' ');
  });
  output.push(`  Content-Security-Policy: ${merged.join('; ')}`);
}

for (const file of htmlFiles.sort()) {
  const url = '/' + relative('dist', file).replaceAll('\\', '/');
  const route = url.replace(/index\.html$/, '');
  const policy = routePolicies.get(route) ?? defaultPolicy;
  const paths = new Set([route, url]);
  if (route !== '/' && route.endsWith('/')) paths.add(route.slice(0, -1));
  for (const path of paths) output.push('', path, `  Permissions-Policy: ${policy}`);
}

await writeFile('dist/_headers', output.join('\n'), 'utf8');
console.log(`Wrote dist/_headers with ${scriptHashes.size} script hashes from ${htmlFiles.length} pages.`);
