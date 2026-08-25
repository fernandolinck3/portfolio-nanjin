# Prototype — the Tenebrae Unit, as it stood 2026-08-24

The working 3D unit that settled the direction. This is the reference the real build in `src/` is
ported from, Part by Part — not the build itself.

    node prototype/gen.mjs      # inlines three.js + scene.js into prototype/unit.html, then open it

`unit.html` is generated and gitignored. `three.js` comes from `node_modules`, so run `npm install`
first.

**It predates the decisions in `docs/adr/` and contradicts several of them.** Read it as a record of
where the object got to, not as a spec:

- the knob drives a `bend` melt shader — dead, replaced by Vigil (ADR-0006)
- there is an `INSPECT` toggle and free rotation — cut, replaced by bounded tilt (ADR-0007)
- all content is drawn into the canvas texture — reversed, the DOM is truth (ADR-0002)
- slot 4 is `CRATE`, a list of influences — now `RACK`, the tools actually used
- pointer interaction was only ever validated through headless stills, never clicked in a browser
