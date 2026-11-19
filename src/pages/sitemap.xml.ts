import type { APIRoute } from 'astro';
import { catalog } from '../tool-registry';
import { getCollection } from 'astro:content';
import { articlePath } from '../articles';

export const prerender = true;

const siteUrl = new URL(import.meta.env.PUBLIC_SITE_URL || 'https://doculven.example').origin;
const basePath = (import.meta.env.BASE_URL || '/').replace(/^\/*/, '/').replace(/\/*$/, '/');
const pages = [
  '/id/', '/en/', '/id/alat/', '/en/tools/',
  '/id/articles/', '/en/articles/',
  '/id/privasi/', '/en/privacy/',
  '/id/info/tentang/', '/en/info/about/', '/id/info/bantuan/', '/en/info/help/',
  '/id/info/kontak/', '/en/info/contact/', '/id/info/ketentuan/', '/en/info/terms/',
  ...catalog.flatMap(tool => [tool.path.id, tool.path.en]),
];
const escapeXml = (value: string) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');
const day = (date: Date) => date.toISOString().slice(0, 10);

export const GET: APIRoute = async () => {
  const articles = await getCollection('articles');
  const buildDate = day(new Date());

  const entries = new Map<string, string>();
  for (const path of pages) entries.set(path, buildDate);
  for (const article of articles) {
    const updated = article.data.updatedAt ?? article.data.publishedAt;
    entries.set(articlePath(article), day(updated));
  }

  const urls = [...entries.entries()]
    .map(([path, lastmod]) => `  <url><loc>${escapeXml(new URL(`${basePath}${path.replace(/^\/+/, '')}`, `${siteUrl}/`).toString())}</loc><lastmod>${lastmod}</lastmod></url>`)
    .join('\n');

  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
