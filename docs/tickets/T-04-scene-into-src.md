# T-04 — The scene moves into `src/`

**Track A · depends on T-02, T-03, and track B being quiet · the merge point**

## Goal

The real build renders the Unit. `prototype/scene.js` becomes an enhancement layer mounted over the
DOM truth layer, split into modules under `src/scene/`.

## Why

This is where the two tracks meet and the portfolio becomes the actual deliverable rather than two
half-builds. It is deliberately late: porting a 1,500-line file is only worth doing once, so
everything that would force a re-port should land first.

## Build

- Split `scene.js` by Part, not by three.js concept: `chassis`, `plate`, `screen`, `pads`, `decks`,
  `crossfader`, `altar`, `room`, `vigil`, `camera`. The Parts are the axis the build is organised
  along (`CONTEXT.md`).
- The scene **subscribes** to `module` / `crossfade` / `vigil` from T-02 and writes back when a 3D
  control is dragged. It never holds the truth.
- Keep `camera` scene-local.
- Register the context-loss handler that already exists at `src/components/webglContext.ts` — on
  genuine loss, fall through to the Flat Plate (T-05).
- The HUD dials do not ship. Keep them behind a dev-only flag or leave them in the prototype; the
  visitor never sees `SEED`.

## Done when

- `npm run build` produces a working Unit at `/`.
- Pressing a DOM Pad lamps the 3D pad, and pressing the 3D pad updates `aria-current` on the DOM one.
  One state, two faces.
- Killing WebGL support serves the Flat Plate instead of a black screen.
- `window.__unit` survives in dev only.

## Traps

- `registerContextLossHandler` returns an unregister function that **must** run before any deliberate
  teardown — releasing the context ourselves also fires `webglcontextlost`, and treating that as a
  failure permanently disables the enhancement. The file says so; read it.
- React StrictMode double-invokes effects in dev. A scene that builds itself twice will leak a
  renderer and two rAF loops.
- Do not start this while a track B ticket is open in `prototype/scene.js`.
