// The Achievements page is this file. Add an entry at the top of its group; `when` is free text.
export type Item = {
  when: string;
  title: string;
  detail?: string;
  href?: string; // internal path or external URL
};
export type Group = { heading: string; note?: string; items: Item[] };

export const ACHIEVEMENTS: Group[] = [
  {
    heading: 'Vulnerability research',
    items: [
      {
        when: '2026',
        title: 'IP camera zero-day — pre-auth RCE to root',
        detail:
          'Unbounded match copy in the transport parser of a consumer IP camera, reachable without credentials from the LAN. Reported to KISA via coordinated disclosure; patched, rated High severity, and awarded a bug bounty.',
        href: '/projects/ip-camera-0day/',
      },
      {
        when: '2026',
        title: '7 vulnerability reports to Microsoft (MSRC)',
        detail:
          'Found with my Windows kernel driver pipeline. One, co-reported with a teammate, was confirmed and assigned a CVE (pending publication).',
        href: '/projects/huntail/',
      },
      {
        when: '2026',
        title: 'virtio-win viosock bind/close race condition',
        detail:
          'Bound ports stay stranded until the guest reboots. Confirmed by the maintainers, with a fix in development.',
        href: 'https://github.com/virtio-win/kvm-guest-drivers-windows/issues/1686',
      },
    ],
  },
  {
    heading: '1-day reproductions',
    note: 'Public bugs rebuilt end to end from the advisory, on real targets.',
    items: [
      {
        when: '2026',
        title: 'CVE-2025-55423 — ipTIME UPnP command injection',
        detail:
          'Diffed the vulnerable and patched binaries in Ghidra, traced attacker input to the shell command, and ran it under a QEMU user-mode harness with fake SSDP/HTTP services for remote command execution.',
        href: 'https://github.com/logis11/CVE-2025-55423-analysis-and-reproduction',
      },
      {
        when: '2026',
        title: 'CVE-2026-2005 — PostgreSQL pgcrypto heap overflow',
        detail: 'Integer overflow in PGP session-key parsing leading to a heap overflow; built a working exploit from the advisory.',
      },
      {
        when: '2026',
        title: 'CVE-2023-42115 — Exim SMTP AUTH out-of-bounds write',
        detail: 'Unauthenticated out-of-bounds write in the SMTP AUTH handler; reproduced the bug and the path to code execution.',
      },
    ],
  },
  {
    heading: 'Academic',
    items: [
      { when: '2024', title: 'James B. Angell Scholar', detail: 'University of Michigan.' },
      { when: '2023 – 2024', title: "Dean's List", detail: 'University of Michigan, College of Engineering.' },
      { when: '—', title: 'GPA 3.96 / 4.00', detail: 'B.S.E. Computer Engineering, expected May 2029.' },
    ],
  },
  {
    heading: 'Other',
    items: [
      {
        when: 'Nov 2026',
        title: 'MC for POC2026',
        detail: 'Selected to host POC, an international security conference in Seoul.',
      },
      {
        when: '2024 – 2026',
        title: 'Outstanding Soldier',
        detail: 'Recognized by the company commander; completed the full term of service as Sergeant, ROK Army.',
      },
      {
        when: '—',
        title: 'Baekjoon Online Judge — top 6%',
        detail: "100+ problems solved on Korea's largest online judge.",
      },
      {
        when: '—',
        title: '150+ posts on security and systems',
        detail: 'Korean-language technical blog.',
        href: 'https://velog.io/@sigol118',
      },
    ],
  },
];
