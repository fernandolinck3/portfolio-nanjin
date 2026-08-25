# T-01 — The content source

**Track A · depends on nothing · ready**

## Goal

`src/content/modules.ts` — the six Modules as typed data, exported once and consumed by both the DOM
truth layer and the Screen renderer. No markup, no canvas calls, no React.

## Why

Today the copy lives inside `drawScreen()` in `prototype/scene.js` as a `PAGES` array of raw strings
mixed with the drawing code. ADR-0002 makes the DOM canonical, which means two consumers need the
same strings, which means the strings cannot live inside either one.

## Shape

Four kinds, discriminated (`SPEC.md §3`):

```ts
export type Side   = { heading: string; lines: string[] }
export type Row    = readonly [title: string, type: string, year: string]

export type Module =
  | { slot: number; id: string; title: string; kind: 'prose';  lines: string[]; dim?: string[]; mail?: string }
  | { slot: number; id: string; title: string; kind: 'thesis'; a: Side; b: Side }
  | { slot: number; id: string; title: string; kind: 'table';  head: readonly [string,string,string]; rows: Row[] }
  | { slot: number; id: string; title: string; kind: 'steps';  steps: string[] }

export const MODULES: readonly Module[]   // exactly six
```

Port the copy from `PAGES` verbatim, with two corrections:

- slot 4's title is **`RACK`**, not `CRATE` (`CONTEXT.md`). Its rows are still the wrong content —
  that is T-13, not this ticket. Leave them and leave a comment saying so.
- slot 2 (`NOW / NEXT`) currently has its two sides hard-coded inside the `P.xf` branch of
  `drawScreen()`. Lift them into `a` and `b`.

## Done when

- `MODULES` has six entries, slots 1–6, and the type makes a seventh awkward to add.
- A test asserts the Screen budget from `SPEC.md §3.1` — 4 prose lines, 2 dim, 5 rows, 6 steps, and
  the per-line character caps. This is the guard that keeps "nothing scrolls" true; without it the
  rule is a sentence in a document that the next copy edit quietly breaks.
- `npm run typecheck` and `npm test` pass.

## Traps

- The contact email in slot 6 is Fernando's real address. Keep it in the source file, keep it out of
  test fixtures, snapshots and logs.
- Do not soften the Next-side copy into something that reads as experience. `SPEC.md §3.2`.
