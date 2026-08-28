# ADR-0026 — The wheels have weight, and no button in them

**Date:** 2026-08-28 · **Status:** accepted · **Amends:** the navigation model of 2026-08-28
**Supersedes in part:** ADR-0009 (the Decks are no longer the Vigil, and are no longer inert)

## Context

The navigation rewrite earlier the same day made each Deck a **detented selector**: one notch, one
item, no coasting, and the painted boss at the centre a button — Moon-centre for Back, Sun-centre to
open. The reasoning was that a wheel which chooses an item must not keep choosing after the hand
stops, and it was written into `scene.js` at length.

Two of those calls did not survive contact.

> remova a necessidade de clique das jogs por enquanto e quaisquer menções
>
> devem girar sozinhos (sol está certo mas lua não)
>
> ele deve girar progressivamente aos poucos e mudando as opções […] se a pessoa girar com uma certa
> força, o jog nao pode simplesmente parar, deve existir uma pequena inercia

## Decision

**A Deck turns. That is all it does, and it does it like a mass.**

Four parts, and they only make sense together:

1. **No button.** The hub press is gone from both wheels, along with every mention of it in the copy,
   the help note and the Screen. A control that does two unrelated jobs depending on the radius you
   grab it at is a control that has to be explained, and the explanation was taking up the one line
   of instruction the visitor gets. Back is `Esc`, the touch row, and a click anywhere on the Unit
   while a Work is open. Opening is a click on the row in the Screen, `Enter` on the focused SUN, and
   the touch row.

2. **Both platters drift.** They used to drift against the Vigil, which made the Moon perfectly still
   in daylight. Both turn now; the Vigil decides only which one leads.

3. **A thrown wheel coasts, and keeps selecting while it does.** The hand's own angular velocity is
   handed to the Deck on release and bleeds off against friction, spending detents the whole way
   down.

4. **The detent is visible.** Each Deck holds `turn` (where the platter is), `carry` (how far past
   the last detent the selection has come) and `spin`. The displayed angle is `turn - PULL * carry`,
   so between two notches the platter lags the hand and catches up the instant the notch is spent —
   that is the snap. When the coast dies the carry is eased to zero, which walks the wheel the last
   few degrees onto its detent; draining the carry *is* the settle, and nothing else needs to know.

## What survives from the decision it amends

The principle was never "no momentum" — it was **no uncontrolled selection**, and that stands:

- the coast is the hand's own velocity decaying, not a flywheel inventing travel;
- `SPIN_MAX` caps a violent flick, so a wheel may run on and may not run away through a Module;
- **the idle drift feeds `turn` and never `carry`.** A Unit left alone turns its wheels and selects
  nothing. This is the line between an object that looks alive and an object that browses itself.

## Consequences

- `group.rotation.y` is written in exactly one place. Anything that wants to move a Deck moves
  `turn`.
- The ECLIPSE lost the position that opened it. The seventh detent past the end of the MOON's list
  was reachable only by someone who already knew it was there, and Fernando could not find it:
  *"não consegui fazer o eclipse funcionar."* The six lamps now **arm** it and the **light fires**
  it — taking the fader all the way across, with the direction choosing the face: night → day gives
  the SUN, day → night gives the MOON. The middle of the fader is not a band, so drifting around
  twilight cannot trip it.
- That also removed a trap rather than papering over it: closing ECLIPSE used to leave the cursor on
  the very position that reopened it.
- `SUN_NOTCH` stays at nearly double `NOTCH` (ADR-0025): one SUN notch is a page.
