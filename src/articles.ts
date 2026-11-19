import { getCollection, type CollectionEntry } from 'astro:content';
import type { Locale } from './tool-registry';

export type Article = CollectionEntry<'articles'>;

export const articleSlug = (entry: Article): string => entry.id.replace(/\.(en|id)$/, '');

export const slugOf = (id: string): string => id.replace(/\.(en|id)$/, '');

export const articlePath = (entry: Article): string => `/${entry.data.lang}/articles/${articleSlug(entry)}/`;

export async function articlesFor(lang: Locale): Promise<Article[]> {
  const entries = await getCollection('articles', entry => entry.data.lang === lang);
  return entries.sort((a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime());
}

export async function findTranslation(entry: Article): Promise<Article | undefined> {
  const target: Locale = entry.data.lang === 'en' ? 'id' : 'en';
  const entries = await getCollection('articles', candidate => candidate.data.lang === target);
  return entries.find(candidate => candidate.data.translationKey === entry.data.translationKey);
}

export const categoryLabel: Record<string, { id: string; en: string }> = {
  compression: { id: 'Kompresi', en: 'Compression' },
  resize: { id: 'Ukuran & crop', en: 'Resize & crop' },
  conversion: { id: 'Konversi format', en: 'Format conversion' },
  documents: { id: 'PDF & dokumen', en: 'PDF & documents' },
  background: { id: 'Hapus latar', en: 'Background removal' },
  watermark: { id: 'Watermark', en: 'Watermark' },
  print: { id: 'Cetak', en: 'Printing' },
  privacy: { id: 'Privasi', en: 'Privacy' },
};
