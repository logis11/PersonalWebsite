---
title: LLM-Driven Scheduler
tagline: Semantic workload recognition for CPU scheduling (3-person team)
summary: An LLM reads the names of the processes a machine is running and works out what it is being used for. That reading, never the LLM itself, configures an ordinary scheduler, measured against the behavior-watching heuristics shipping systems use today.
period: Aug 2026 — present
order: 40
stack: [C++, Python]
repo: https://github.com/logis11/LLM_driven_shceduling
---

I built the C++ discrete-event simulator and executor that plays workloads out under swappable policies, the
scheduling algorithms, and starvation protection.
