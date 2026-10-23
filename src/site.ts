// Single place for identity and links. Edit these first.
export const SITE = {
  name: 'Kyungmin Inn',
  title: 'Kyungmin Inn',
  description:
    'Vulnerability research, binary exploitation, and embedded security. Computer Engineering at the University of Michigan.',
  // TODO: fill in. Leave a value empty ('') to hide that link.
  email: '',
  github: 'https://github.com/logis11',
  velog: 'https://velog.io/@sigol118',
  pgpKeyUrl: '', // e.g. '/pgp.asc' after you put your public key in /public
  pgpFingerprint: '', // e.g. 'ABCD 1234 ...'
  cvUrl: '', // e.g. '/cv.pdf' after you put the PDF in /public
};

// `depth` is decorative: how deep (m) the backdrop's gauge reads on that section. The landing page is the descent.
export const NAV = [
  { href: '/research/', label: 'Research', depth: 1200 },
  { href: '/projects/', label: 'Projects', depth: 1600 },
  { href: '/ctf/', label: 'CTF', depth: 2000 },
  { href: '/blog/', label: 'Blog', depth: 2400 },
  { href: '/about/', label: 'About', depth: 2800 },
  { href: '/contact/', label: 'Contact', depth: 3200 },
];
