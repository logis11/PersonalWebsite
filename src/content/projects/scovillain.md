---
title: Scovillain
tagline: Falsification oracle for binary bug hunting (MCP)
summary: Huntail's tool layer. It turns each candidate sink into a reachability query over a graph of the binary and answers one question, whether attacker input can actually reach it. A negative is sound, so the agent can drop false positives without burying a real bug.
period: Sep 2026 — present
order: 20
stack: [Python, MCP, NetworkX]
repo: https://github.com/logis11/Scovillain
---

Scovillain is a service, not a scanner: it does not hunt for bugs, it refutes candidates that something else
already found. Every verdict names its own confidence.

- **`REFUTED`**: provably no path, and every dispatch on the frontier is resolved. Safe to delete.
- **`REFUTED_MODULO`**: no path found, but K unresolved indirect calls remain. Advisory only.
- **`NOT_REFUTED`**: a path exists, or may through unresolved dispatch. The candidate survives.

That makes indirect-call resolution the core problem: it decides how many false positives can be killed safely.
Queries run cheap before expensive, structural reachability first, then dataflow along the surviving paths.

Built as the tool layer for [Huntail](/projects/huntail/).
