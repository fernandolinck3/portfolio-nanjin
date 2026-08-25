# T-12 — Fernando's faceplate artwork

**Track C · blocked on Fernando**

## Goal

Drop his artwork into `prototype/ornament/` and tune the Plate around it.

## Status

He is designing it. `prototype/ornament/README.md` states the requirements: landscape at 5.6 : 3.28
or wider, 2048px or more, high contrast, limited palette. Standing in meanwhile: De Wit's
*Planisphaerium coeleste* (1650, public domain).

## When it lands

- With art present the ornamental frame switches itself off — OBNE panels carry no border. That is
  already wired.
- `SCRIM` controls how far the art is knocked back so the Print stays legible. Tune it against his
  image, not against De Wit's.
- **Warm candlelight tints the plate art brown.** It is tolerable on a 1650 star chart, which is
  sepia anyway. It may not be tolerable on his. Watch for it specifically and be ready to give the
  art its own colour handling.
- Verify at render size: the texture is 2048px wide and the Plate draws around 590px on screen.
- Record its provenance in `SOURCES.md` like everything else, even though it is his own work. The
  portfolio's whole claim is that nothing in it is faked or unattributed.
