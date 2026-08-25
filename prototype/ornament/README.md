# Ornament source

Drop the pattern here as **`pattern.svg`** (preferred) or **`pattern.png`** (transparent, ideally
2048px or wider).

What the pipeline expects:

- **One tileable unit, or one complete plate.** Either works — `TILE` controls the repeat.
- **Solid shapes, not strokes-only.** The relief is built from filled mass; hairline outlines with no
  fill produce a scratch, not a cut.
- **Black on transparent** (or black on white). Colour is ignored — only coverage matters, because
  the pattern becomes a height field, not a picture.

If no file is present the pipeline falls back to the procedural vine, so the scene keeps working.
