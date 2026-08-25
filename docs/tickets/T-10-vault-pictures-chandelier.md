# T-10 — The vault, the pictures and the chandelier

**Track B · depends on T-07**

## Goal

The three things the reference study has and the room does not: a painted vault overhead, pictures on
the panelling, and a chandelier.

## Why

ADR-0011 made the room part of the work. As the camera comes up toward 74° the ceiling enters frame
and there is nothing there. The pictures give the panelled walls a reason to be panelled.

## Build

Procedural, like everything else (ADR-0004). Budget is the constraint — three.js already dominates
the bundle (ADR-0003), so this is canvas-generated texture on simple geometry, not modelled detail.

- **Vault.** Ribs and a painted field. Only visible at high tilt, so it can be cheap, but it must not
  be *obviously* cheap at 74°.
- **Pictures.** Dark frames, dim canvases. They read as mass and gilt, not as images — do not put
  anything recognisable or borrowed in a frame.
- **Chandelier.** Unlit or barely lit. It is not a fourth Candle and must not compete with the Vigil,
  which is the object's central mechanic.

## Done when

- Tilting to 74° reveals a ceiling worth having tilted for.
- The Vigil still reads. If the chandelier keeps the room lit at `vigil = 1`, it is wrong.

## Traps

- Depends on T-07 because a chandelier without a shadow is a decal.
- Provenance applies to anything put in a picture frame. `prototype/ornament/SOURCES.md` records why.
