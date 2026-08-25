# Prototype — the Tenebrae Unit

The working 3D unit that settled the direction, and where Parts get tuned before they are ported
into `src/`. Not the real build.

    npm run prototype        # http://localhost:5174

`window.__unit` is a workbench hook: `screenOf(mesh)` projects a Part to page coordinates,
`pads()` / `parts()` return the control meshes, `render()` forces a frame. It exists so a browser
session can drive and verify the controls without guessing pixel positions — rAF is throttled in a
background tab, so never trust the last painted frame's matrices.

## Verified in a real browser, 2026-08-25

Pads select Modules; the Crossfader drags and jumps to Now/Next; the knob raises the Vigil and stays
in sync with the HUD; the Jog turns and pages. Previously all of this was only ever checked through
headless stills, which cannot click.

## Engraving workbench

The Plate's engraving is parametric: `BAND`, `DENSITY`, `WEIGHT` and `GROUND` dials in the HUD
redraw it live, and `window.__unit.setEng({band, waves, lw, hatch})` does the same from the console. `?title=` swaps
the display face (`unifraktur` is the chosen one; `pirata`, `grenze`, `archivo` also available).

The field is worked edge to edge; the Parts and the Print are then cut back out of it as reserves
(`RESERVES` and `PRINT_RESERVES` in `scene.js`, in texture coordinates derived from world space).
The ground lives mostly in the height map rather than in colour, so it catches raking light without
turning the Plate into noise or fighting the labels.

## Still contradicts the ADRs

- the Jog steps between Modules — it should dig *inside* the live one, which needs Modules with
  more than one Screen's worth of content first
- all content is drawn into the canvas texture — reversed, the DOM is truth (ADR-0002)
- slot 4 still renders as `CRATE` — it is `RACK` now, content not yet rewritten
- geometry is hand-written primitives, convincing top-down only

## Already in line

Vigil replaced the Bend (ADR-0006). INSPECT and free rotation were cut for bounded pointer tilt
(ADR-0007). The Print is phosphorescent, so labels stay legible at full Vigil.
