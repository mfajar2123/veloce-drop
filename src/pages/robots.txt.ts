import type { APIRoute } from 'astro';

export const prerender = true;

export const GET: APIRoute = () => {
  const siteUrl = new URL(import.meta.env.PUBLIC_SITE_URL || 'https://velocedrop.example').origin;
  const basePath = (import.meta.env.BASE_URL || '/').replace(/^\/*/, '/').replace(/\/*$/, '/');
  return new Response(`User-agent: *\nAllow: /\nSitemap: ${siteUrl}${basePath}sitemap.xml\n`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
