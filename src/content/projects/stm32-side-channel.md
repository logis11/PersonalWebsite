---
title: STM32 Side-Channel & Fault Injection Study
tagline: Measuring what a bare-metal PIN check leaks, then trying to glitch past it
summary: A bare-metal 6-digit PIN verification system on a Nucleo-F103RB, built as a target for myself. The early-exit comparison leaks how many digits are right through its own timing; the study measures that leak, fixes it with a constant-time comparison, and now moves on to voltage fault injection.
period: Oct 2026 — present
order: 30
stack: [C, STM32F103RB, ChipWhisperer-Nano, bare metal]
facts:
  - Built a bare-metal 6-digit PIN verification system with button input and LED/UART status output, no HAL.
  - Measured PIN-comparison latency with the Cortex-M3 DWT cycle counter to show how an early-exit comparison leaks the number of correct digits.
  - Implemented a constant-time comparison and compared its timing against the original.
  - Now learning voltage fault injection with a ChipWhisperer-Nano, aiming to glitch past the PIN check (in progress).
repo: https://github.com/logis11/STM32
# Photos go in /public/projects/stm32-side-channel/ and are listed here:
# photos:
#   - { src: /projects/stm32-side-channel/bench.jpg, alt: 'Nucleo-F103RB wired to a ChipWhisperer-Nano on the bench', caption: 'The measurement setup' }
#   - { src: /projects/stm32-side-channel/soldering.jpg, alt: 'Soldering header pins onto the target board', caption: 'Bringing out the trigger line' }
---

The board grew out of a keypad door lock: four buttons, a few LEDs, and a PIN compared against a stored value.
Written bare metal, so there is no library between the code and the timing — which is the point. A comparison that
returns the moment two digits differ runs a little shorter for a wrong first digit than for a wrong last one, and
the Cortex-M3's DWT cycle counter is enough to read that difference straight off the device.

With the leak measured, the fix is the easy half: compare all six digits every time and fold the result together
at the end. The timing flattens.

The half still in progress is the physical one. A ChipWhisperer-Nano drops the supply voltage for a few
nanoseconds at a chosen moment, and if that moment lands on the branch that acts on the comparison, the check can
be skipped without ever being passed.
