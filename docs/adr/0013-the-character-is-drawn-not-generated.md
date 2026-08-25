# The Wizard is drawn, not generated

Every other mark on the Unit is procedural (ADR-0004). The Wizard is not. She is a bitmap, authored
by hand as text in `prototype/screen/drawn.js` — one character per pixel, four tones.

## Why this one is different

Fernando's `character` are.na board is nine references and **not one of them is a silhouette**. The
rabbit knight in chainmail, the caped cat with the sword, the 1-bit portrait grid, the robed girl
with the cat on her back, the 2-bit schoolgirl, the chibi with the red bag — every one is *drawn*:
an outline, interior detail, hair, clothing, and a real face with pupils in it.

The procedural figure that preceded this could not get there, and no amount of tuning would have
fixed it. A profile function returns a half-width per row. It has no opinion about where a fringe
falls, how far apart the eyes sit, or what the mouth is doing — and those three things are the whole
of whether a character reads as someone rather than as a shape. Generating ornament is a good idea
because ornament is a system; generating a face is not, because a face is a set of decisions.

## What ADR-0004 was actually protecting

Not "no bitmaps". It was protecting two things: that the object stays editable by parameter, and
that the repo ships no binary assets. A text sprite keeps both — it diffs in git, it is legible in
review, and it is a few hundred bytes.

## Consequences

- The Wizard is the one thing in this repo that is authored rather than derived. Expect to edit her
  by hand, in a grid, and expect that to be the right way to change her.
- A bitmap cannot change pose the way a parameterised figure can. Poses are frames, and frames are
  drawn. The current placeholder has one, which is why the Cast makes her hop rather than raise her
  hand — the whole body acts because no part of it can.
- **The one in the repo now is a placeholder.** It exists to prove the pipeline and to show the
  difference in kind against the procedural version, which is kept beside it for exactly that
  comparison. Fernando is a designer and is already drawing the faceplate art; the real Wizard
  should be his.
- What she needs, whenever it is drawn: 28 x 40 at the current scale, four tones (transparent,
  light, mid, and the ground showing through as a drawn line), and one frame per pose — present,
  balance, craft, point, read, send, and cast.
