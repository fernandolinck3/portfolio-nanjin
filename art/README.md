# art

Where your drawings go before they become sprites.

Draw wherever you like — Aseprite, Piskel, Photoshop, or an image out of a pixel-art
generator — export a PNG here, then:

    node prototype/screen/sprite-from-png.mjs art/bust.png --size 28x40 --trim --write

That snaps the image to the sprite grid, quantises it to the Screen's four tones,
prints her as blocks so you can check her, and writes the array into `drawn.js`.
Drop `--write` to look without changing anything.

## The PNGs here are not committed

`.gitignore` keeps this folder's images out of the repo. ADR-0004's constraint is
that the repo ships **no binary assets**, and the text array in `drawn.js` is the
committed artefact — it diffs in review, and it is a few hundred bytes.

**So these files exist only on your Mac.** Given that this repo lives in an
iCloud-synced folder, keep a copy of anything you would hate to redraw somewhere
you trust. If you would rather have the source art versioned in git, that is a
reasonable change — but it reverses ADR-0004, so it wants a written amendment
rather than a quiet `git add -f`.

## Tones

Draw against these four and the conversion is exact. Draw in any other palette and
it still works — matching is by **how light each mark is**, not by hue.

| | Hex | Is |
|---|---|---|
| `#` | `#E9E3D2` | lit skin, highlights |
| `-` | `#8A8470` | half-light |
| `=` | `#5E5A4C` | hair, hat, shadow |
| `o` | `#0A0B09` | black — lashes, eyes, mouth |
| `.` | transparent | nothing |

## Size

`--size 28x40` is what ADR-0013 specifies. The current sprite is 28x32, and the
converter will **warn you** if a new height would shrink her on screen — her scale
is derived from the sprite's height (`spriteBox()` in `screen.js`), so a taller
source makes her smaller unless the `.58` constant moves with it. The warning tells
you what to change it to.
