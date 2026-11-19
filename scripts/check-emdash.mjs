import { readFile } from 'node:fs/promises';

for (const page of ['dist/en/convert-image/index.html', 'dist/en/resize-image/index.html']) {
  const html = await readFile(page, 'utf8');
  const stripped = html.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ');
  const match = stripped.match(/.{0,90}—.{0,90}/);
  console.log(page, '=>', match ? `EM DASH: ${match[0].replace(/\s+/g, ' ')}` : 'clean');
}
