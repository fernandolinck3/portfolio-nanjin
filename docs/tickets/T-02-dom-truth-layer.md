# T-02 — The DOM truth layer

**Track A · depends on T-01 · the centre of the build**

## Goal

`src/` renders all six Modules as real semantic HTML and the six Pads as real `<button>`s, and owns
the three pieces of shared state. No three.js in this ticket at all.

## Why

ADR-0002. The primary audience is recruiters: they use find-in-page, paste into applicant tracking
systems, share links that need previews, and sometimes use assistive technology. Content that exists
only as pixels on a canvas texture is invisible to every one of those. The DOM layer is where the
content lives — it is not a fallback bolted on afterwards.

## Build

- **State**: `module: 0..5`, `crossfade: 0..1`, `vigil: 0..1` (`SPEC.md §2`). One hook or context,
  exported so the scene can subscribe in T-04. `camera` does **not** belong here.
- **Markup**: all six Modules present in the document at once. The live one is exposed; the other
  five are visually hidden but selectable, focusable and crawlable — `clip-path` / offscreen, never
  `display:none` and never `hidden`, either of which takes them out of find-in-page.
- **Pads**: six `<button>`s, one per Module, in a `<nav>`. `aria-current` on the live one. They are
  the only navigation (ADR-0009) — no links, no routes, no keyboard shortcut that browses.
- **Crossfader**: `<input type="range">`, labelled, driving `crossfade`.
- **Decks**: the Vigil needs a keyboard path too. Two controls, Moon and Sun, that move `vigil` down
  and up. `prototype/index.html` has a single range slider standing in for this; do better.

## Done when

- Find-in-page finds a string from every Module, including the five that are not live.
- The whole Unit is operable by keyboard alone, with visible focus.
- A screen reader announces which Module is live when a Pad is pressed.
- Tests cover: six Pads render, pressing one changes the live Module, all six Modules' text is in the
  document at all times.

## Traps

- `visibility:hidden` and `display:none` both hide content from find-in-page. Use the visually-hidden
  clip pattern.
- The Pads are the *only* navigation. Resist adding arrow-key cycling through Modules — that is the
  browsing control ADR-0009 removed.
