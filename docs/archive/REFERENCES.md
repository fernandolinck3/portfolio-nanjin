> **Superseded 2026-08-24 — kept as anti-reference.**
> This document belongs to the July "Divine Machinery" / "Monument" direction, which was
> abandoned. It is preserved because the reasoning is still worth reading and because knowing
> what was rejected is part of the record. Current truth: `PRODUCT.md`, `CONTEXT.md`,
> `docs/adr/`.

# Reference Analysis — Divine Machinery

These references guide the revised direction. They are not templates to reproduce.

Each entry separates the **mechanic** (a general technique, fair to use) from the **signature** (the thing that makes the reference recognizably itself, never to be reproduced).

## 1. Harry Vincent

- **Source:** https://www.harryvincent.com/
- **Role:** Palette discipline, pacing, restraint.
- **Observed:** A near-black field occupying almost the entire viewport. Navigation reduced to small text at the extreme perimeter — a compact label top-right, a small mark bottom-left. One accent colour, used only at that perimeter. Enormous negative space around a single isolated central event.
- **Mechanic to use:** Perimeter-only navigation at small scale, one scarce accent, and the discipline of a single dominant event per screen.
- **Signature to avoid:** The wordmark, the shop and cart framing, the specific accent orange, and the project imagery.
- **Adapt:** Keep the architectural layout, hold the field near-black, and let the single red identify active states and technical annotations only.

## 2. Bizarro

- **Source:** https://bizar.ro/
- **Role:** Header system, identity scale.
- **Observed:** The personal name set small at top-left. Two metadata labels spread across the top edge at wide intervals. A stacked two-line number offset toward the right of centre, isolated, with nothing around it. Below all of it, a monumental custom wordmark spanning edge to edge and cropping against the viewport. Pure black and white with no colour at all. Body copy below the fold in a plain grotesk, left-aligned, in short paragraphs.
- **Mechanic to use:** The system header — name, spread metadata labels, offset stacked index number — above a monumental cropped identity.
- **Signature to avoid:** The Bizarro wordmark and its specific letterforms, the star symbol, the `™`, the birth-date treatment, the client claims, and the portfolio content.
- **Adapt:** Present `FER BITTENCOURT` as the dominant authored identity in original letterforms, with current practice, next direction, and Project 001 behaving as precise system data.

## 3. Trionn

- **Source:** https://trionn.com/
- **Role:** Scroll mechanic only.
- **Observed:** A Next.js build with a full-viewport WebGL canvas. The document body is held at `overflow: hidden` while a virtual scroller transforms content, so native `scrollY` stays at zero. Roughly 5,500px of scroll drives continuous section transitions rather than discrete page changes.
- **Mechanic to use:** Virtual smooth scroll with scroll-progress-driven section transitions. This is a general technique, implemented here with Lenis and project-owned transition code.
- **Signature to avoid:** Everything else — the composition, the studio branding, the colour system, the copy, the interactive logo model, and the section content.
- **Adapt:** Apply the scroll mechanic to Fernando's own six-section journey, with transitions expressed through the monument's decay rather than through Trionn's visual language.

## Removed reference

The previous "Electronic panel system" entry — PX Push and the supplied vintage stereo photographs in `car-radio-portfolio/references/` — is retired. The LED signal panel it informed has been removed from the direction. Those images are no longer inputs to this project.
