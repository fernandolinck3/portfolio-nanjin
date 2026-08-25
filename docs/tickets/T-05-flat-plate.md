# T-05 — The Flat Plate

**Track A · depends on T-02**

## Goal

The Unit rendered as a printed silkscreen in CSS from the DOM truth layer, served where the 3D cannot
be carried: no WebGL, low power, `prefers-reduced-motion`.

## Why

ADR-0008. It is a designed deliverable with its own design pass — not a fallback, not a degraded
screenshot. It is also what crawlers and link previews see, so it is the version most recruiters
encounter before they ever load the 3D.

## Build

The same six Modules, the same six Pads, the same Crossfader — laid out as the Plate is laid out,
drawn in CSS. Print colours only, no relief, no attempt to fake the metal. It should read as the
object's technical drawing rather than as a photograph of it.

Selection: no WebGL context, `prefers-reduced-motion: reduce`, low `deviceMemory` /
`hardwareConcurrency`, or a genuine context loss at runtime.

## Done when

- Every Module reads correctly with JavaScript's 3D path never loading.
- It looks deliberate. Show it to Fernando as a render, not as a description — descriptions do not
  land, and this one is a design decision he will have opinions about.
- Switching to it at runtime after context loss does not lose the live Module or the Vigil state.

## Traps

- `prefers-reduced-motion` means reduce motion, not remove the portfolio. The Flat Plate is the good
  outcome for that user, so design it for them, not around them.
