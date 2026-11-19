import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const articles = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: './src/content/articles',
    generateId: ({ entry }) => entry.replace(/\.md$/, ''),
  }),
  schema: z.object({
    lang: z.enum(['id', 'en']),
    translationKey: z.string(),
    title: z.string().min(20).max(70),
    summary: z.string().min(80).max(160),
    category: z.enum(['compression', 'resize', 'conversion', 'documents', 'background', 'watermark', 'print', 'privacy']),
    toolId: z.string(),
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date().optional(),
    readingMinutes: z.number().int().min(3).max(40),
    diagram: z.string().optional(),
    diagramAlt: z.string().optional(),
    related: z.array(z.string()).default([]),
  }),
});

export const collections = { articles };
