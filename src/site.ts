// Single place for identity and links. Edit these first.
export const SITE = {
  name: 'Kyungmin Inn',
  title: 'Kyungmin Inn',
  description:
    'Notes on binary exploitation, embedded security, and systems. Computer Engineering at the University of Michigan.',
  email: 'kinn@umich.edu',
  github: 'https://github.com/logis11',
  velog: 'https://velog.io/@sigol118',
};

// The whole site: a blog at the root plus these pages. A section with nothing published
// yet is left out of the nav by Base.astro; its page still exists.
export const NAV = [
  { href: '/about/', label: 'About' },
  { href: '/projects/', label: 'Projects' },
  { href: '/writeups/', label: 'Writeups' },
  { href: '/achievements/', label: 'Achievements' },
];
