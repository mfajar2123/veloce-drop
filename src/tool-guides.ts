import { getCollection } from 'astro:content';
import type { Locale } from './tool-registry';
import { articlePath } from './articles';

// Tool id to the guides that explain its trade-offs. Slugs are the published
// article files, so these links can never drift out of sync silently: the test
// suite checks that every mapped slug resolves to a real article.
export const toolGuides: Record<string, string[]> = {
  'compress-image': ['compress-image-without-losing-quality', 'why-200kb-targets-fail', 'jpeg-vs-webp-for-web-uploads'],
  batch: ['batch-processing-workflow', 'why-200kb-targets-fail'],
  'resize-image': ['passport-photo-sizes-explained', 'social-media-image-sizes'],
  'image-converter': ['heic-to-jpg-on-windows', 'image-formats-explained'],
  background: ['background-removal-limits', 'why-local-processing-matters'],
  'logo-watermark': ['watermark-that-survives-resizing', 'batch-processing-workflow'],
  'photo-pdf': ['photos-to-pdf-page-order'],
  'pdf-jpg': ['pdf-to-jpg-resolution'],
  'pdf-500kb': ['pdf-compression-and-lost-text'],
  print: ['print-photo-sheet-layouts', 'passport-photo-sizes-explained'],
  'document-scanner': ['photos-to-pdf-page-order', 'why-local-processing-matters'],
};

export type GuideLink = { path: string; title: string };

export async function relatedGuides(toolId: string, lang: Locale): Promise<GuideLink[]> {
  const slugs = toolGuides[toolId];
  if (!slugs?.length) return [];
  const entries = await getCollection('articles', entry => entry.data.lang === lang);
  return slugs
    .map(slug => entries.find(entry => entry.data.translationKey === slug))
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
    .map(entry => ({ path: articlePath(entry), title: entry.data.title }));
}
