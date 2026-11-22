import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    summary: z.string().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    // Point at the original Velog post if this is a translated/edited version.
    canonical: z.string().url().optional(),
  }),
});

// A photo or screenshot: put the file in /public/projects/<slug>/ and reference it by path.
const photo = z.object({
  src: z.string(),
  alt: z.string(),
  caption: z.string().optional(),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    tagline: z.string().optional(), // one line under the title
    summary: z.string(),
    period: z.string(), // free text, e.g. 'Oct 2026 - present'
    order: z.number().default(100), // lower shows first
    stack: z.array(z.string()).default([]),
    // Short factual lines shown under the summary, e.g. 'Reported to KISA; patched, rated High.'
    facts: z.array(z.string()).default([]),
    repo: z.string().url().optional(),
    link: z.string().url().optional(),
    links: z.array(z.object({ label: z.string(), href: z.string().url() })).default([]),
    // Work photos (soldering, bench setup, boards). Empty until the files exist.
    photos: z.array(photo).default([]),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog, projects };
