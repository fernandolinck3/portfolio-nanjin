# Prompts for generating the Wizard

For exploring her identity in a pixel-art generator (Retro Diffusion, PixelLab) — **as reference,
not as shipped pixels**. ADR-0013's argument is that a face is a set of decisions and therefore gets
drawn; a generated image used as a reference is the same thing as pinning one to the `character`
board. If generated pixels ever ship as her face, that ADR needs a written reversal first.

Everything below is derived from `CONTEXT.md`'s Wizard entry, ADR-0013, and the notes at the top of
`drawn.js`. If you change her here, change her there too.

---

## The palette — copy this exactly

| Role | Hex | In the sprite grid |
|---|---|---|
| Lit skin, highlights | `#E9E3D2` | `#` |
| Half-light | `#8A8470` | `-` |
| Hair, hat, shadow | `#5E5A4C` | `=` |
| Ground / lashes, eyes, mouth | `#0A0B09` | `o` and `.` |

Four tones is not a stylistic preference, it is the Screen's actual palette (`screen.js:61`).
Anything with more tones has to be quantised down to these, and quantising a soft-shaded face to
four tones is what makes it read as mud.

---

## 1. The bust — start here

This is the piece that drops into the current pipeline. The split is at the neck: hat, hair, face,
jaw and collar are drawn; everything below the shoulders is generated (ADR-0013). So the bust is the
whole ask, and poses do not matter yet.

> Pixel art bust portrait of a young sorceress, front facing, centred, head and shoulders only.
> Long narrow face with a pointed chin. Tall almond eyes with heavy dark lash lines and a single
> bright highlight pixel in each pupil. Heavy straight fringe breaking into points over the brow.
> Dark hair falling in continuous locks well past the jaw. Wide-brimmed pointed witch hat leaning to
> one side, its brim an ellipse with a dark underside lifting it off the forehead. High stiff standing
> collar. Hard-edged shadow covering one side of the face with no gradient — a single terminator line
> that widens over the brow and cheekbone and closes in along the jaw. Limited four-colour palette:
> bone white, olive grey, dark olive, near-black background. Crisp square pixels, no anti-aliasing.

**Negative prompt:**

> chibi, big head, cute, round face, soft shading, gradients, anti-aliasing, blur, glow, drop shadow,
> outline, modern anime, 3d render, painterly, photo, watermark, signature, text, multiple characters,
> extra limbs, full body, background scenery

The negative prompt is doing more work than the positive one. `chibi` and `soft shading` are the two
failure modes that have actually happened here — she was chibi for three commits before being taken
out of it, and every soft gradient dies in the four-tone quantise.

---

## 2. Full figure, seven poses — the richer endpoint

ADR-0013's stated destination is one drawn frame per pose instead of one bitmap with a generated body
swinging arms underneath it. Only worth generating once the bust is settled, and **lock her identity
with reference images first** — Retro Diffusion takes up to nine, PixelLab takes a concept image plus
a reference sprite. Without that lock she will not be the same person twice.

Prefix each with the bust prompt's identity clause, then:

| Module | Pose | Clause to append |
|---|---|---|
| Ident | `present` | full body, one arm extended outward with the palm turned up, presenting |
| Now / Next | `balance` | full body, both arms out wide and clear of the robe, a glowing orb held in each hand, weighing them against each other |
| Project 001 | `craft` | full body, both hands together in front of her holding a small rectangular device with a lit screen |
| Rack | `point` | full body, one arm raised high and out, pointing away from her body |
| Method | `read` | full body, both hands in front holding an open book, head inclined toward it |
| Out | `send` | full body, one arm raised high, releasing a raven into the air |
| — | `cast` | full body, casting arm thrown forward and up, palm open, light breaking from the hand |

Constant across all seven: a tall staff with a four-point star finial held on her outboard side, and
a raven perched on the brim of her hat. Long robe falling to the floor as a soft bell with three
small four-point stars scattered on it.

---

## 3. Settings

- **Generate large, derive small.** Ask for 128×128 or 192×192 for the bust. Generating straight to
  28×40 will disappoint — at that size every pixel is a decision, which is the whole reason ADR-0013
  says she gets drawn. The generated image is a target to draw against, not the sprite.
- **Force the palette** if the tool exposes it. Retro Diffusion and PixelLab both do.
- **Lock her with references** before generating any pose. This is the single setting that decides
  whether you get one character or seven strangers.
- **Vary one thing at a time.** Same seed, one clause changed, so a difference is attributable.

## 4. Getting it into the Unit

Export the PNG into `art/`, then:

    node prototype/screen/sprite-from-png.mjs art/bust.png --size 28x40 --trim --write

It snaps the image to the sprite grid, quantises to the four tones above, prints her as blocks so
you can check her before committing to anything, and writes the array into `drawn.js`. Drop
`--write` to look without changing the file. Matching is by **how light each mark is**, not by hue,
so a drawing in the wrong colours still converts — only the values have to be right.

See `art/README.md`. The PNG stays out of git; the text array is what gets committed.

## 5. How to check a candidate

Not on the generated image — on the Screen, at 1×. `spriteBox()` scales her by `fh * .58 / SPRITE_H`,
which lands on scale 2 for most Modules and **scale 1 for Now/Next**, where she draws at her raw
28 px width with a 12 px face. Now/Next is the module that kills candidates. Check it first.
