// The Achievements page is this file: assigned vulnerability IDs only. Everything that has a
// project page of its own is described there, not here. Add new entries at the top of their group.
export type Item = {
  id: string; // the KVE/CVE identifier
  title: string;
  detail?: string;
  href?: string; // internal path or external URL
};
export type Group = { heading: string; note?: string; items: Item[] };

export const ACHIEVEMENTS: Group[] = [
  {
    heading: 'Assigned to my findings',
    items: [
      {
        id: 'CVE-2026-112979',
        title: 'Windows State Repository Service tampering',
        detail:
          'Weak authentication in the Windows State Repository Service lets an authorized local attacker tamper with state (CWE-1390, CVSS 5.5). Found with Verdict and co-reported with a teammate; published 10 Nov 2026.',
        href: 'https://msrc.microsoft.com/update-guide/vulnerability/CVE-2026-112979',
      },
      {
        id: 'KVE-2026-1741',
        title: 'IP camera pre-auth RCE to root',
        detail:
          'Unbounded match copy in the transport parser of a consumer IP camera, reachable without credentials from the LAN. Reported to KISA via coordinated disclosure; patched, rated High severity, and awarded a bug bounty.',
        href: '/projects/ip-camera-0day/',
      },
    ],
  },
  {
    heading: 'Reproduced from the advisory',
    note: 'Other people’s bugs, rebuilt end to end on real targets.',
    items: [
      {
        id: 'CVE-2025-55423',
        title: 'ipTIME UPnP command injection',
        detail:
          'Diffed the vulnerable and patched binaries in Ghidra, traced attacker input to the shell command, and ran it under a QEMU user-mode harness with fake SSDP/HTTP services for remote command execution.',
        href: 'https://github.com/logis11/CVE-2025-55423-analysis-and-reproduction',
      },
      {
        id: 'CVE-2026-2005',
        title: 'PostgreSQL pgcrypto heap overflow',
        detail:
          'Integer overflow in PGP session-key parsing leading to a heap overflow; built a working exploit from the advisory.',
      },
      {
        id: 'CVE-2023-42115',
        title: 'Exim SMTP AUTH out-of-bounds write',
        detail:
          'Unauthenticated out-of-bounds write in the SMTP AUTH handler; reproduced the bug and the path to code execution.',
      },
    ],
  },
];
