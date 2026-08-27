# The Works are real, and the Screen shows them

Six Works, all Fernando's own, replace the four stamped PLACEHOLDER stand-ins. Selecting one **flies
the camera until the Screen fills the frame and then hands the Work to the DOM**, where it is a real
HTML panel with a full-resolution image.

**This reverses ADR-0017**, which sent a Work out to a plinth.

## The Works

From a folder Fernando pointed at; every file was opened and titled from what is actually on it
rather than from its filename.

| № | work | |
|---|---|---|
| 002 | Bandas de Bollinger · Nelogica · 2025 | launch campaign, feed and story |
| 003 | R U MINE? · Classic Reeboks · 2023 | an Arctic Monkeys night, two passes at the same bill |
| 004 | Rifa Handbanners · 2025 | a fan raffle sheet |
| 005 | Graecus · 2026 | agency carousels |
| 006 | Parize Imóveis · 2024 | listings and seasonal posts |

Paired pieces group under one entry — two stills behind one row reads as range; two rows reads as
padding. Web-sized in `public/works/`: **2.8MB**, down from 500MB of PSDs and PDFs.

## Why the plinth had to go

ADR-0017's reasoning still holds about the *buffer*:

> *"A Work is an image and the Screen is a 590px inset — it cannot carry one."*

320x180 upscaled to fill a viewport is roughly 4.7x. That is beautiful for the Grimoire's pixel art
and mush for a photograph of a poster — and photographs of posters are what the Works actually are.

So the camera performs the move and the **DOM holds the content**. The fly-in lands with the Screen
filling the frame; at that moment a real HTML panel cross-fades over it, at full resolution.

That is not a compromise, it is **ADR-0002: the DOM is truth**. It also means the Works are
indexable, readable by a screen reader, and reachable on a phone that never runs the WebGL scene.

Four ways back, because one was not enough: click anywhere off the Work, a RETURN control, Escape,
and arrows to browse without flying out and back in. The first of those is `summon.js`'s own instinct
— *"while a Work is up, the Screen is the way back"* — arrived at from the other direction.

## The Modules, corrected

- **IDENT** claimed *"No agency. No client case studies yet."* It was true when written and is not
  now. Copy that undersells is as inaccurate as copy that oversells.
- **OUT** said São Paulo. The CV says Porto Alegre, and so does every role in it.
- **RACK** was a PLACEHOLDER list of influences that blocked T-13 for three sessions. It is **PATH**
  now, and every row is checkable — which is the bar `CONTEXT.md` sets for the Rack and the reason
  the influences never met it. **This renames a glossary term and wants Fernando's word.**
- The Pads are labelled on the Plate. Six identical squares were the one row left to guess at.

Found on the way: **the table renderer never drew its middle column** — only `[0]` and `[2]` reached
the Screen, so every row's "where" had been invisible for as long as the Module existed.

## Consequences

- `summon.js` and the plinth still exist and still work. Nothing was deleted until Fernando has
  chosen, because this ADR is the reversal and not yet the demolition.
- **Fernando's CV is deliberately not published.** It carries a phone number and a personal address.
  Its *content* informs PATH; the file itself is his to publish or not.
- LinkedIn renders as text, not a link: he gave a name, and guessing a slug from a name is the kind
  of invention PRODUCT.md forbids.
