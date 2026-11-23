---
title: Verdict
tagline: Autonomous vulnerability finding on Windows, from kernel drivers to user-mode services
summary: An agent harness that finds real bugs in shipping Windows code. It maps a target's attack surface deterministically, then every candidate has to survive an adversarial panel that only confirms what verifies against the binary. Built against kernel drivers first, now pointed at user-mode services as well. Its findings have gone to MSRC and upstream maintainers.
period: Jul 2026 — present
order: 10
stack: [Python, Claude Agent SDK, MCP, PE32+, WDM/KMDF]
facts:
  - 7 vulnerability reports submitted to Microsoft (MSRC); one, co-reported with a teammate, is published as CVE-2026-112979.
  - One upstream bug in virtio-win's viosock driver (issue #1686), confirmed by the maintainers with a fix in development.
repo: https://github.com/logis11/Verdict
links:
  - { label: 'virtio-win #1686', href: 'https://github.com/virtio-win/kvm-guest-drivers-windows/issues/1686' }
# Photos go in /public/projects/verdict/ and are listed here:
# photos:
#   - { src: /projects/verdict/bench.jpg, alt: 'Debugging a driver over WinDbg on two machines', caption: 'Kernel debugging setup' }
---

## Results

- **MSRC:** 7 reports. One, co-reported with a teammate, is published as
  [CVE-2026-112979](https://msrc.microsoft.com/update-guide/vulnerability/CVE-2026-112979): weak authentication in
  the Windows State Repository Service, letting an authorized local attacker tamper with state.
- **Upstream:** [virtio-win #1686](https://github.com/virtio-win/kvm-guest-drivers-windows/issues/1686).
  In the `viosock` driver, a `CloseHandle` racing `bind()` leaves the socket in the bound list for good, so a
  non-administrator can strand a port that nobody, administrators included, can bind again until reboot. Labeled
  a bug by the maintainers, who found the race wider than reported.

## How it works

Frontier models already find most bugs; what they cannot do is stop reporting ones that are not there. So every
gate in Verdict pushes the same way: it makes a confirmation harder to reach.

- **Deterministic substrate.** PE parsing, `.pdata` function bounds and cross-build anchor relocation are plain
  Python. The model only judges.
- **Anchor gate.** A confirmation must cite instructions (`0xADDR mnem ops`) that verify against the measured
  build — every candidate has to be backed by static-analysis evidence, not by the model's say-so.
- **Adversarial panel.** A refuter (kill when unsure), an interrogator (break the rejection when unsure) and an
  escalator each see only the claim and its evidence. An adjudicator is the only member that ends a row.
- **Ledger outside the context.** An exhaustive JSON table of confirmed, rejected and unanalysed rows, checked by
  SDK hooks before a run is allowed to finish, so coverage cannot be faked by forgetting.

Kernel drivers were the first surface because the entry points are enumerable: a dispatch table, a set of IOCTLs,
and a boundary that is written down. The same gates hold wherever input crosses a trust boundary, so user-mode
services are next.

Analysis tools reach the agent over MCP; the tool layer is [Sieve](/projects/sieve/).
