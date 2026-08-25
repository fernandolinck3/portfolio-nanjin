# T-11 — The Deck faces become real volvelle rings

**Track B · blocked on a source image**

## Goal

Replace the hand-drawn `sunFace()` and `moonFace()` with faces built from a genuine volvelle — a
17th-century rotating paper instrument, which is literally a jog wheel.

## Why

The Decks are the Vigil's face (ADR-0009): the light is depicted on the two Parts that control it.
The current faces are hand-drawn rays and phases — competent, but invented, and the rest of the Plate
is built on genuine period engraving.

## Blocked on

The **Calendarium Perpetuum**, a 17th-century Nuremberg broadsheet on Fernando's `engravings` are.na
board. Confirmed genuine and public domain. **Not yet sourced at high resolution** — that is the
first step of this ticket, and until it is done there is nothing to build from.

## Build

- Source the plate at 2048px or better from a holding institution, not from the are.na thumbnail.
- Record it in `prototype/ornament/SOURCES.md` with publisher, date, institution, shelfmark and
  licence, the way `plate.jpg` is recorded, **before** using it.
- Cut the volvelle's concentric rings into the Sun and Moon faces: albedo plus bump, as `deckFace()`
  already produces.

## Traps

- **Check provenance before praising a reference.** Two images on that same board are unusable — one
  carries a Dreamstime watermark, one is a signed contemporary illustration. Both were recommended
  before being looked at properly. Look first.
- The Decks turn continuously. A volvelle with legible text will strobe; favour the rings and figures
  over the lettering.
