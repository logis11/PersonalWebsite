---
title: IP Camera 0-day
tagline: Pre-auth RCE to a root shell on a consumer IP camera
summary: A previously unknown bug in a consumer IP camera that gives an unauthenticated attacker on the network a root shell on the device. Reported to KISA; the vendor and details stay private until coordinated disclosure ends.
period: '2026'
order: 15
highlights:
  - { value: '0-day', label: 'previously unknown' }
  - { value: 'Pre-auth', label: 'no credentials' }
  - { value: 'root', label: 'shell on the device' }
stack: [Embedded Linux, IoT firmware]
---

The full write-up (firmware extraction, the vulnerable path, and the exploit) goes up here once the vendor ships a
fix. Until then it is listed on the [research](/research/) page without identifying details.
