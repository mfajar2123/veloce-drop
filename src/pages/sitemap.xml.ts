import type { APIRoute } from 'astro';
import { catalog } from '../tool-registry';

export const prerender = true;

const siteUrl = new URL(import.meta.env.PUBLIC_SITE_URL || 'https://velocedrop.example').origin;
const basePath = (import.meta.env.BASE_URL || '/').replace(/^\/*/, '/').replace(/\/*$/, '/');
const pages = [
  '/id/', '/en/', '/id/alat/', '/en/tools/',
  '/id/privasi/', '/en/privacy/',
  '/id/info/tentang/', '/en/info/about/', '/id/info/bantuan/', '/en/info/help/',
  '/id/info/kontak/', '/en/info/contact/', '/id/info/ketentuan/', '/en/info/terms/',
  ...catalog.flatMap(tool => [tool.path.id, tool.path.en]),
];
const escapeXml = (value: string) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');

export const GET: APIRoute = () => {
  const urls = [...new Set(pages)].map(path => `  <url><loc>${escapeXml(new URL(`${basePath}${path.replace(/^\/+/, '')}`, `${siteUrl}/`).toString())}</loc></url>`).join('\n');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
