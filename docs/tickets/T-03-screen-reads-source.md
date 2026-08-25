# T-03 — The Screen renders from the content source

**Track A · depends on T-01 · runs in the prototype**

## Goal

Delete `PAGES` from `prototype/scene.js`. `drawScreen()` imports `MODULES` from T-01 and switches on
`kind` instead of on the presence of ad-hoc fields.

## Why

The prototype's own README lists "all content is drawn into the canvas texture" as its first
contradiction with the ADRs. This is the half of that fix that can be done before the scene moves
into `src/` — and doing it now means T-04 ports a scene that already reads from the right place
instead of one that has to be rewired mid-port.

## Build

`drawScreen()` currently branches on `P.xf`, `P.rows`, `P.steps`, else prose. Replace with a switch
on `module.kind` — `prose` | `thesis` | `table` | `steps`. Keep every measurement exactly as it is;
this is a rewiring, not a redesign of the Screen.

## Done when

- `prototype/scene.js` contains no copy. Every string on the Screen comes from `src/content/`.
- All six Modules render pixel-identically to before, checked in a browser at real size.
- Slot 4's header reads `RACK`.

## Traps

- The prototype is served by Vite from `prototype/` (`npm run prototype`). A relative import up into
  `../src/content/modules.ts` works — confirm it resolves and that the `.ts` is transformed before
  assuming it does.
- The waveform footer lights the segment for the current Module. It is indexed by `curPage`; if the
  content source becomes slot-numbered (1-based), the footer must not silently go off by one.
