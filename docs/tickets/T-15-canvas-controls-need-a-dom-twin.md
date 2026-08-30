# T-15 — Every control the Screen draws needs a twin in the DOM

**Track A · absorbed by the accessible mirror (Open item 2)**

## Goal

A control that exists only as pixels can be operated by everyone, not only by a mouse.

## What a review found

The Screen now draws three controls and hit-tests them against boxes the draw registers
(`prototype/scene.js`, the `screenPoint`/`inBox` block):

- `◂ VOLTAR` on a detail page,
- the sky mark in the header that reopens ECLIPSE,
- `ABRIR O INSTAGRAM · @NAN._.JIN` on the seventh screen.

None has a counterpart in `prototype/index.html` — not in the `.sr` nav, not in the `.touch` row —
and the keydown handler routes only `1`–`6`, `Esc`, the arrows, and Enter/Space on a focused wheel.

**The Instagram control is the one that matters.** It is the only outbound action on the seventh
screen, it is the prize for having found the secret, and it is unreachable without a pointer.

ADR-0002: *"Pads are real `<button>` elements … so the Unit can be operated by keyboard and screen
reader"*; *"Content that exists only as pixels on a canvas texture is invisible to all of that."*

## Why this is not a quick fix

Adding three buttons would work and would be thrown away. Open item 2 — the semantic HTML mirror of
the LCD's state — is the general answer, and these three are the first concrete instances of the
class it exists to solve. Build them as part of it.

**But do not let the mirror ship without them.** A mirror that reports state and cannot act on it
leaves the prize exactly as unreachable as it is today.

## When it lands

Every control the Screen paints is reachable by Tab and Enter, and announced by a screen reader.
