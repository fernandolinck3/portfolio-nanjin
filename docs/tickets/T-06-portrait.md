# T-06 — Portrait recomposes the Unit

**Track A · depends on T-04**

## Goal

On narrow screens the same 3D Unit is **recomposed**, not scaled: the camera pulls in so the Screen
fills the top, the Pads sit under the thumb at real touch size, the Decks and Crossfader move below.

## Why

ADR-0008. Scaling the desktop composition into portrait puts every control below a fingertip's width
and makes the Screen unreadable. Serving the Flat Plate to all phones was also rejected — mobile
visitors would never see the craft that is the portfolio's only proof.

## Done when

- Pads are at least 44px on a real phone, not in a resized desktop window.
- The Screen is readable at arm's length.
- Dragging to move the camera does not fight page scroll or pull-to-refresh.

## Traps

- Part layout becomes a responsive system, not fixed coordinates. If this ticket ends with a
  `if (portrait)` block full of magic numbers, it has gone wrong.
- The camera clamps still apply. Pulling in is a distance change, not permission to go past 74°.
