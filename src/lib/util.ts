import type { CollectionEntry } from 'astro:content';

export const fmtDate = (d: Date) =>
  d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });

export const fmtMonth = (d: Date) =>
  d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', timeZone: 'UTC' });

// Drafts are visible in `npm run dev`, hidden in production builds.
export const published = <T extends { data: { draft?: boolean } }>(e: T) =>
  import.meta.env.DEV || !e.data.draft;

export const byDateDesc = (a: { data: { date: Date } }, b: { data: { date: Date } }) =>
  b.data.date.valueOf() - a.data.date.valueOf();

export type Research = CollectionEntry<'research'>;
