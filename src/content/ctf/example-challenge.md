---
# Template. Copy this file, rename it (the file name becomes the URL), and set draft: false.
title: Example challenge
event: Example CTF 2026
date: 2026-10-01
category: pwn
difficulty: medium
solves: 7
tags: [heap, tcache]
prompt: |
  A tiny note service. It only lets you have three notes at a time, so what could go wrong?
remote: nc chall.example.com 31001
handouts:
  - label: chall.tar.gz
    href: /ctf/example-challenge/chall.tar.gz
writeup: folded
draft: true
---

## Intended solution

Explain the bug first, then the primitive it gives, then how you turn that into code execution.

```c
// the vulnerable function
void delete_note(int idx) {
    free(notes[idx]);   // pointer not cleared
}
```

## Unintended solutions

Worth keeping. Players who broke your challenge in a way you didn't plan are the most interesting part of a writeup.
