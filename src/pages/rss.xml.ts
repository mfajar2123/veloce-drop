import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { articlePath } from '../articles';

export const prerender = true;

const siteUrl = new URL(import.meta.env.PUBLIC_SITE_URL || 'https://velocedrop.example').origin;
const basePath = (import.meta.env.BASE_URL || '/').replace(/^\/*/, '/').replace(/\/*$/, '/');
const escapeXml = (value: string) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');

export const GET: APIRoute = async () => {
  const articles = await getCollection('articles', entry => entry.data.lang === 'en');
  const sorted = articles.sort((a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime()).slice(0, 30);
  const items = sorted.map(entry => {
    const url = new URL(`${basePath}${articlePath(entry).replace(/^\/+/, '')}`, `${siteUrl}/`).toString();
    return [
      '    <item>',
      `      <title>${escapeXml(entry.data.title)}</title>`,
      `      <link>${escapeXml(url)}</link>`,
      `      <guid isPermaLink="true">${escapeXml(url)}</guid>`,
      `      <pubDate>${entry.data.publishedAt.toUTCString()}</pubDate>`,
      `      <description>${escapeXml(entry.data.summary)}</description>`,
      '    </item>',
    ].join('\n');
  }).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n  <channel>\n    <title>VeloceDrop guides</title>\n    <link>${escapeXml(new URL(`${basePath}en/articles/`, `${siteUrl}/`).toString())}</link>\n    <description>Practical guides on compressing, resizing, converting and preparing images and PDFs.</description>\n    <language>en</language>\n${items}\n  </channel>\n</rss>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
};
