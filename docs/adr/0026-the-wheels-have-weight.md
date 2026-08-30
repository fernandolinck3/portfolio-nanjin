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

3. **A thrown wheel coasts — and the coast is visual only.** The hand's angular velocity is handed
   to the Deck on release and bleeds off against friction, so a heavy platter keeps turning. It does
   **not** spend detents while it does.

   *This part was written the other way and shipped that way for an afternoon.* Selecting on
   momentum is what walked a small flick to the end of a list, which is most of what "the jogs don't
   navigate right" turned out to mean. The hand chooses; the mass only carries the picture.

4. **The hand's travel is the only thing the platter shows.** Each Deck holds `turn` (where the
   platter is), `carry` (how far past the last detent the selection has come) and `spin`. The
   displayed angle is `turn`, full stop.

   *This part was also written the other way.* It said `turn - PULL * carry`, so the platter lagged
   the hand between notches and caught up as each was spent — a detent you could see. That is how a
   detent feels under a finger and not how it looks on a screen, where the only visible part is the
   wheel failing to keep up with the cursor: **"remove the snaps please its looking laggy."** On a
   screen the pointer *is* the hand, and anything that lags it is lag. There is no `PULL` constant.

## Amended the same day it was written

Parts 3 and 4 above describe what shipped; the struck-through reasoning inside them is what this ADR
originally decided, hours earlier. Both were undone by watching the object rather than reasoning
about it — the coast overshot, and the visible detent read as lag. Kept in place rather than quietly
rewritten, because a decision that survived three hours is worth knowing about before someone
reinvents it.

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
