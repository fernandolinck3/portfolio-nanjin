# T-37 — Mobile overlays and notice obstruction

Status: ready-for-agent
Resolution: done locally — independent PASS, 170 tests and built-browser checks; not published.
Execution: [TASK-005](../../TASKS.md)
Plan: [Mobile usability](../planning/mobile-usability.md)

At 390×844 coarse portrait, the correctly rotated 844×390 frame contains an auxiliary visor sized 820×474 by a physical-viewport media query. It clips beyond the viewport, and its input conversion ignores rotation. Consent occupies 153 px over a flat page reserving only 100 px. Reader dimensions and rotation-hint cascade need coordinated correction.

Preserve the instrument, room ambition, camera poses, content and translations. Fix the existing layout/input contracts; do not redesign the room. The plan defines ownership, acceptance and verification. No deployment or real Contact submission is authorized by this ticket.
