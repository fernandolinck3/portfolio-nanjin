# ADR-0024 — The Screen scrolls, and the Sun is what scrolls it

**Date:** 2026-08-28 · **Status:** superseded by [ADR-0025](0025-pages-not-scrolling.md) · **Reverses:** ADR-0009 in part

> **Superseded the day it was written.** Scrolling shipped in one build and was rejected: it read
> the cramped body as too little length when it was too little width. Kept as written, because the
> reasoning below is what a plausible wrong diagnosis looks like, and ADR-0025 is only legible next
> to it.

## Context

ADR-0009 killed browsing. Nothing scrolled, no control paged, and every Module was cut to fit the
Screen exactly — a constraint enforced by `SCREEN_BUDGET` and asserted in `modules.test.ts`. It was
a good decision and it bought the object its whole character: six Pads that go somewhere, and text
that is *finished* rather than merely begun.

Two things then happened to the content.

It moved to Portuguese, which runs longer for the same idea. And it grew a case per project —
overview, motive, references, construction, interaction — because a portfolio that cannot describe
its own work is not doing its job. `Section` paging was the answer to that: the Sun stepped through
one page at a time, so only one was ever on screen.

Paging is not free, though. It cuts continuous prose into slides at points chosen by the writer
rather than by the reader, and it hides how much is left. Fernando, on the first Portuguese build:

> o texto tá muito cluttered também, podemos ter um scroll e um indicador de mais texto sem problemas

## Decision

**The body scrolls, and the Sun is the control that scrolls it.**

Sections stay as the *structure* of a case — they are how the writing is organised and how the
footer reports where you are — but they are no longer separate screens. They flow as one column
with their headings in place, and the Sun moves a continuous offset through it.

Three inputs scroll, and they are the same gesture reaching the same state:

1. the mouse wheel anywhere over the object;
2. dragging the Sun, which is the physical version of the same thing;
3. the mouse wheel while the pointer is over the Sun.

The Moon is untouched. It still selects the item, by drag or by wheel over the Moon, and its centre
still goes back.

**An indicator is mandatory, not decorative.** A column that scrolls without saying so is a column
that reads as finished when it is not, which is a worse failure than the clutter this replaces —
the visitor does not know they have stopped early. The Screen shows how far down the column is and
that there is more below.

## What ADR-0009 keeps

The part worth keeping was never "no scrolling" — it was **no browsing**. That stands:

- the six Pads still own Module navigation, and nothing else selects a Module;
- there is still no next/previous control for Modules;
- every Module still opens on a `lead` that needs no wheel at all, so the essential information is
  never behind a scroll.

`SCREEN_BUDGET` therefore still binds the `lead`, and stops binding the `section`. A lead that
overflows is still a bug; a case that runs long is now allowed to.

## Consequences

- `SCREEN_BUDGET.section` becomes advisory rather than a hard cap, and the test relaxes with it.
- The Sun's centre keeps its meaning — open, enter, activate — because scrolling is a turn and
  opening is a press, and they were never the same gesture.
- The footer reports the section under the reader rather than the page they turned to.
- A visitor who never touches a wheel still gets every Module's overview, which is the promise
  ADR-0009 actually made.
