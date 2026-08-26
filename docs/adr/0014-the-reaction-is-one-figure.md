# The reaction frames are one whole figure, and the split at the neck is off for them

ADR-0013 splits the Wizard at the neck: her bust is drawn by hand, everything below the shoulders is
generated, and the reason given is that a face is a set of decisions and a robe is a system. That
split is what gives a hand-drawn character poses — arms out for Now/Next, together for Project 001,
raised for a Cast.

The knob-reaction animation does not use it. Its ten frames are **one figure each**, 28x40, hat to
hem, drawn as a run rather than assembled.

## Why this one is different

The animation is a performance, not a pose. She raises her brows, smiles, tilts her head, blinks, and
settles — and every one of those is a decision about a face, which is exactly the category ADR-0013
says gets drawn. But the tilt carries her shoulders and her hat with it. A drawn head tilting on a
generated body that cannot tilt reads as a head coming loose. The split survives a *pose*, where the
body is doing something the head is not; it does not survive a *motion* that runs through both.

Fernando chose the full figure over a bust crop after seeing all six crops rendered side by side at
1x. The tighter crops kept ADR-0013 intact and gave her more pixels for the face; he picked the whole
figure anyway.

## Consequences

- **In `figure: 'reaction'` there are no poses and nothing held.** No orb for Now/Next, no book for
  Method, no Unit for Project 001, no Cast arm. One bitmap does the whole job, so the same figure
  appears in all six Modules. This is a real loss and it was made knowingly.
- **ADR-0013 still governs `figure: 'drawn'`.** The bust, the generated robe, the seven poses and the
  held things are untouched and remain the default. This ADR narrows ADR-0013 to that mode rather
  than reversing it, and the two figures sit side by side in the workbench the way the procedural and
  drawn ones already do.
- **Her scale is derived differently.** The bust is the top ~58% of her, so `spriteBox()` divides
  `fh * .58` by the sprite height. The reaction sprite is all of her, so `reactionBox()` divides `fh`
  directly. Reusing the bust's constant would have rendered her at just over half size.
- Whoever draws the real Wizard now has two targets, not one: a bust for the posed modes and a run of
  whole figures for anything that moves through her body. If that proves to be one target too many,
  the resolution is to drop the posed mode, not to bolt a tilting head onto a still body.

## What is not decided here

Whether the reaction figure should eventually replace the bust everywhere. It should not be decided
until the real Wizard is drawn — the placeholder's quality is not evidence about the design.
