import { readFile } from 'node:fs/promises';

const tool = await readFile('dist/en/compress-image/index.html', 'utf8');
const guides = [...tool.matchAll(/Read before you start[\s\S]{0,1200}?<\/div>/g)].length;
const guideLinks = [...tool.matchAll(/href="\/en\/articles\/[^"]+"/g)].map(match => match[0].slice(6, -1));
const sitemap = await readFile('dist/sitemap.xml', 'utf8');
const withLastmod = (sitemap.match(/<lastmod>/g) ?? []).length;
const totalUrls = (sitemap.match(/<loc>/g) ?? []).length;

console.log(JSON.stringify({ guideSectionFound: guides > 0, guideLinks: [...new Set(guideLinks)], withLastmod, totalUrls }, null, 2));
