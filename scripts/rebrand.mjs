import { readdir, readFile, writeFile } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';

const roots = ['src', 'tests', 'scripts', 'docs', 'public'];
const rootFiles = ['README.md', 'PRODUCT.md', 'DESIGN.md', 'IMPLEMENTATION_STATUS.md', 'ASSET_CREDITS.md', 'package.json', 'astro.config.mjs', 'netlify.toml', 'components.json'];
const extensions = new Set(['.ts', '.tsx', '.astro', '.md', '.mjs', '.json', '.svg', '.html', '.txt', '.xml', '.toml']);

const files = [...rootFiles];
async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await walk(path);
    else if (extensions.has(extname(entry.name))) files.push(path);
  }
}
for (const root of roots) await walk(root);

const replacements = [
  // Brand name, all case variants that exist in the tree.
  [/\bVeloceDrop\b/g, 'Doculven'],
  [/\bvelocedrop\b/g, 'doculven'],
  // Placeholder origin used before a real domain is configured.
  [/doculven\.example/g, 'doculven.example'],
  // Cache key and download filename prefix.
  [/__doculvenSession/g, '__doculvenSession'],
];

const changed = [];
const skipped = [];
for (const file of files) {
  if (!extensions.has(extname(file))) { skipped.push(file); continue; }
  const original = await readFile(file, 'utf8');
  let next = original;
  for (const [pattern, value] of replacements) next = next.replace(pattern, value);
  if (next === original) continue;
  await writeFile(file, next, 'utf8');
  changed.push(relative('.', file).replaceAll('\\', '/'));
}

console.log(`Updated ${changed.length} files:`);
for (const file of changed) console.log('  ' + file);
if (skipped.length) console.log(`Skipped ${skipped.length} non-text files.`);
