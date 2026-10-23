---
title: Huntail
tagline: Autonomous vulnerability finding for Windows kernel drivers
summary: An agent harness that finds real bugs in shipping Windows kernel drivers. It maps a driver's attack surface deterministically, then every candidate has to survive an adversarial panel that only confirms what verifies against the binary. Its findings have gone to MSRC and upstream maintainers.
period: Sep 2026 — present
order: 10
highlights:
  - { value: '3', label: 'solo MSRC reports' }
  - { value: '4', label: 'team MSRC reports' }
  - { value: '1', label: 'upstream bug (virtio-win)' }
stack: [Python, Claude Agent SDK, PE32+, WDM/KMDF]
repo: https://github.com/logis11/Huntail
links:
  - { label: 'virtio-win #1686', href: 'https://github.com/virtio-win/kvm-guest-drivers-windows/issues/1686' }
---

## Results

- **MSRC:** 3 solo reports and 4 team reports, under review.
- **Upstream:** [virtio-win #1686](https://github.com/virtio-win/kvm-guest-drivers-windows/issues/1686).
  In the `viosock` driver, a `CloseHandle` racing `bind()` leaves the socket in the bound list for good, so a
  non-administrator can strand a port that nobody, administrators included, can bind again until reboot. Labeled
  a bug by the maintainers, who found the race wider than reported.

## How it works

Frontier models already find most bugs; what they cannot do is stop reporting ones that are not there. So every
gate in Huntail pushes the same way: it makes a confirmation harder to reach.

- **Deterministic substrate.** PE parsing, `.pdata` function bounds and cross-build anchor relocation are plain
  Python. The model only judges.
- **Anchor gate.** A confirmation must cite instructions (`0xADDR mnem ops`) that verify against the measured
  build.
- **Adversarial panel.** A refuter (kill when unsure), an interrogator (break the rejection when unsure) and an
  escalator each see only the claim and its evidence. An adjudicator is the only member that ends a row.
- **Ledger outside the context.** An exhaustive table of confirmed, rejected and unanalysed rows, so coverage
  cannot be faked by forgetting.

Its tool layer is [Scovillain](/projects/scovillain/).
