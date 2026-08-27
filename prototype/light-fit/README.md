# Fitting the room's light

Nobody working on this can see the scene. These four scripts are how the light rig in ADR-0018 was
decided without eyes, and they are the way to re-decide it if anything moves.

`roomexample.png` is Fernando's reference, kept here so the numbers stay reproducible.

```
node measure.mjs   # tonal histogram, percentiles, vignette and named swatches
node grid.mjs      # a 16x9 luminance map — the four pools, at a glance
node fit2.mjs      # solve the rig against twelve luminances measured off the reference
node verify.mjs    # read the constants back out of scene.js and predict the result
```

`verify.mjs` is the one to run after touching a light. It **parses the intensities out of the source
files** rather than taking them on trust, so it cannot drift from what actually ships. Give any of
them a path to compare against a different reference:

```
node measure.mjs ~/Downloads/some-other-room.png
```

## What they know and what they do not

The model is **diffuse only** — Lambert, three.js's own distance falloff, ACES and sRGB. It has no
specular, no shadows and no bounce. So it is trustworthy about *level* and *falloff* and silent about
gloss. Two known blind spots are recorded in ADR-0018: the monitor fronts and the middle of the far
wall both read darker here than in the reference, and at least part of that is highlights this cannot
see.

Arithmetic is the only verification available in this repo. It is not the same as looking.
