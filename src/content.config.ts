import { defineCollection } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    summary: z.string().optional(),
    tags: z.array(z.string()).default([]),
    // Thumbnail shown on the blog index and at the top of the post, e.g. '/blog/ostep.svg' (16:9).
    cover: z.string().optional(),
    coverAlt: z.string().default(''),
    draft: z.boolean().default(false),
    // Point at the original Velog post if this is a translated/edited version.
    canonical: z.string().url().optional(),
  }),
});

const ctf = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/ctf' }),
  schema: z.object({
    title: z.string(),
    // Where the challenge was used. Omit for a standalone challenge.
    event: z.string().optional(),
    date: z.coerce.date(),
    category: z.enum(['pwn', 'rev', 'web', 'crypto', 'forensics', 'misc']),
    difficulty: z.enum(['easy', 'medium', 'hard', 'insane']),
    solves: z.number().int().nonnegative().optional(),
    tags: z.array(z.string()).default([]),
    // Short prompt shown to players, as in the original challenge.
    prompt: z.string(),
    // Downloadable files: put them in /public/ctf/<slug>/ and list the paths here.
    handouts: z.array(z.object({ label: z.string(), href: z.string() })).default([]),
    // Live instance, e.g. 'nc chall.example.com 31001'. Remove when the server goes down.
    remote: z.string().optional(),
    // Optional source repo (Dockerfile, deploy scripts).
    source: z.string().url().optional(),
    // 'open' shows the writeup, 'folded' hides it behind a click, 'hidden' omits it.
    writeup: z.enum(['open', 'folded', 'hidden']).default('folded'),
    draft: z.boolean().default(false),
  }),
});

const stat = z.object({
  value: z.string(),
  label: z.string(),
  note: z.string().optional(),
  href: z.string().optional(),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    tagline: z.string().optional(), // one line under the title, e.g. 'Binary graph analysis MCP'
    summary: z.string(),
    period: z.string(), // free text, e.g. '2026 — present'
    order: z.number().default(100), // lower shows first
    stack: z.array(z.string()).default([]),
    // Headline numbers, e.g. { value: '3', label: 'solo MSRC reports', note: 'under review' }.
    // `note` is the status or source shown under the label; `href` links to the evidence.
    highlights: z.array(stat).default([]),
    // Tiles for the proof strip on the home page. Each links to this project.
    proof: z.array(stat).default([]),
    // Photo or screenshot, e.g. '/projects/stm32-door-lock/cover.jpg' (4:3). Without one, a placeholder frame is drawn.
    cover: z.string().optional(),
    coverAlt: z.string().default(''),
    // 'contain' letterboxes instead of cropping; use it for screenshots with text.
    coverFit: z.enum(['cover', 'contain']).default('cover'),
    repo: z.string().url().optional(),
    link: z.string().url().optional(),
    // Extra outbound links, e.g. an upstream bug report.
    links: z.array(z.object({ label: z.string(), href: z.string().url() })).default([]),
    draft: z.boolean().default(false),
  }),
});

// Research list is plain data, not pages. Each entry may link to a writeup or repo.
const research = defineCollection({
  loader: file('./src/data/research.json'),
  schema: z.object({
    title: z.string(),
    cve: z.string().optional(),
    target: z.string(),
    kind: z.enum(['Disclosure', '1-day reproduction', 'Analysis']),
    year: z.number().int(),
    summary: z.string(),
    link: z.string().optional(),
    // 'withheld' while under coordinated disclosure, 'soon' until a write-up exists.
    writeup: z.enum(['published', 'soon', 'withheld']).default('soon'),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog, ctf, projects, research };
