---
title: IP Camera Zero-Day
tagline: Pre-auth RCE to a root shell on a consumer IP camera
summary: A previously unknown bug in a consumer IP camera that gives an unauthenticated attacker on the network a root shell on the device. Reported through KISA's coordinated disclosure program; the vendor shipped a fix, rated it High severity, and paid a bounty.
period: Jun 2026 — Jul 2026
order: 15
stack: [C, Python, Embedded Linux, IoT firmware]
facts:
  - Dumped the firmware from SPI flash and recovered every socket call site by decoding PLT/BL targets, despite an encrypted main binary — narrowing 13 UDP and 9 TCP entry points to the single anonymous, LAN-reachable transport.
  - Statically decrypted the binary's XOR-stream encryption to read the transport parser, and found an unbounded match copy in its QuickLZ decompressor. With no stack canaries, the overflow reaches the return address.
  - Reported to KISA via coordinated disclosure; patched, rated High severity, and awarded a bug bounty. Assigned KVE-2026-1741.
# Photos go in /public/projects/ip-camera-0day/ and are listed here:
# photos:
#   - { src: /projects/ip-camera-0day/flash-clip.jpg, alt: 'SOIC-8 clip on the camera board's SPI flash', caption: 'Dumping the flash' }
---

The full write-up — firmware extraction, the vulnerable path, and the exploit — goes up here once the fix has had
time to reach devices. Until then it is listed on the [achievements](/achievements/) page without identifying
details.
