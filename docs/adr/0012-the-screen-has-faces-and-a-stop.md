# The Screen has switchable Faces, and the visitor changes them

The Screen is not one design. It has several **Faces** — complete visual treatments of the same six
Modules — and the visitor switches between them with a control on the Unit. Two are drawn:
**Grimoire** (1-bit, dithered ornament, blackletter, type-on text) and **Cracktro** (blackletter over
copper bars, centred credit column, sine scroller). A third, **Instrument** (VFD phosphor, tab strip,
spectrum analyser), exists and is kept.

Fernando picked the first two off the `display` are.na board and then asked for the choice itself to
be a control: *"it can be a switch on the cdj and the user can change the design."*

## Why this is not scope creep

The Unit's whole claim is that every control does something real, and that the object is the proof of
craft because there are no case studies yet (ADR-0001). A visitor who can change the Screen's entire
visual language and find that all six Modules still work, still fit, and still say the same things
has been shown something a static portfolio cannot show: that the content and its presentation are
genuinely separate, which is exactly what ADR-0002 claims.

It also costs almost nothing. Every Face reads the same content source and draws into the same
320x180 buffer. A Face is one function.

## The control

Proposed name: the **Stop** — the draw-knob beside the Screen, after the organ stop that selects an
instrument's voice. It is in register, it is a real physical control, and it is not "mode", "theme"
or "skin". **The name is a proposal and is not yet in `CONTEXT.md` as settled.**

It is not a Pad. The six Pads carry navigation alone (ADR-0009) and that stays true — the Stop
changes how a Module looks, never which Module is live.

## Consequences

- Every Module layout must be authored per Face. Adding a Face is real work, not a palette swap:
  the Rack's dotted leaders and Now/Next's trading columns are Grimoire's answers, not the Screen's.
- The Face is visitor state, so it belongs with `module` / `crossfade` / `vigil` in the DOM truth
  layer (`SPEC.md` §2), not in the scene.
- The Flat Plate (ADR-0008) needs a position on this. Most likely it carries exactly one Face and
  does not offer the Stop.
- Content that only reads in one Face is a bug in that content. Now/Next is already the test case —
  its copy is too long for the Screen and only survives because Grimoire trades detail between the
  two sides rather than showing both.
