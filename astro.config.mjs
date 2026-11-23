// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://kinn8.com',
  integrations: [sitemap()],
  // Old addresses from the previous layout of the site.
  redirects: {
    '/blog': '/',
    '/research': '/achievements/',
    '/contact': '/about/',
    '/ctf': '/',
    '/projects/stm32-door-lock': '/projects/stm32-side-channel/',
    '/projects/huntail': '/projects/verdict/',
    '/projects/scovillain': '/projects/sieve/',
  },
  markdown: {
    shikiConfig: {
      theme: 'github-light',
    },
  },
});
