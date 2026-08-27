# The room is a corner, not a backdrop

The room is **staged**, not arranged: the ceiling is at head height, the side walls are inside the
camera's reach, and the furniture stands **against the sides**, running away from the viewer and
**overlapping** what is behind it. The mirror symmetry is gone.

## The complaint

Fernando, on the room as built: *"right now the room doesnt look great."*

He was right, and the reason I had not seen it is worth recording: **every screenshot taken of this
project had been at the default camera**, `tilt: 28`, where the arithmetic in ADR-0018 already showed
the visible band of the far wall lands entirely *below the floor*. Four sessions of work went into a
room that nobody — me least of all — had ever actually looked at. The first thing to do with a
complaint about how something looks is to look at it.

## What was wrong

Not the objects. The **staging**.

- **30 wide, 11.5 deep, 12 tall**, with the side walls at `x = ±15` — outside `CAM_LIMITS` at every
  angle. So the room had no corner, and no wall ever converged.
- Everything hung on **one plane at one distance**: panels, window, portrait, curtain, credenza,
  pedal cabinet, monitors. Nothing occluded anything.
- **Three panels each side, mirrored**, a credenza at `x=-9.4` and a pedal cabinet at `x=+8.6`, both
  square-on to the camera.
- Eight units of empty dark wall **above** everything, because the ceiling was at 9.05 and the tallest
  object topped out at 2.2.

A flat, evenly-lit, bilaterally symmetric plane is a stage flat. The fix was never going to be
bevels: **a chamfer on a card is still a card.**

## What the reference actually does

Its left wall is **in frame and receding**, and that convergence is the strongest depth cue in the
picture. Its furniture stands against the sides and **overlaps the panels behind it**. Occlusion and
convergence are what the eye reads as depth — not thickness, and not detail.

## The change

- Ceiling **12 → 7.4**, and the room closes overhead so the far corners have something to be dark
  against.
- Side walls **±15 → ±11.6**, plus a real floor and ceiling bounded to the room rather than a 70×70
  field.
- Each side gets a **bay**: a group parked against its wall and turned a quarter turn, contents built
  in local coordinates. Rotating the group rather than every mesh is what keeps it readable — local
  `+x` runs along the wall, local `+z` comes out of it.
- Panels go **two on the left, three on the right**, at slightly different heights. Six in two
  mirrored threes was the loudest thing saying "arranged, not lived in".
- Monitors are **staggered in depth**, not mirrored.

## A third directional that could not be confined

The `rake` — "grazing phosphor spill", meant for the Plate alone — is a `DirectionalLight`, so as the
Vigil rose it raked the **walls, floor and ceiling** phosphor green.

That is the third instance of one bug: `skyLight` flooding the back wall (ADR-0018's correction), the
key flooding the floor (ADR-0019), and now this. **A directional light cannot be aimed *at* anything.**
It has no position and no falloff; it is a direction, and it hits everything facing that way.

Fixed with **layers** rather than a cone, which keeps the grazing character exactly: a light only
illuminates objects whose layers it shares, so the rake and the Plate share layer 2 and nothing else
does.

**Rule: before adding a `DirectionalLight`, say out loud what stops it at the edge of its subject.**
If the answer is "nothing", it is the wrong instrument — use a spot, a point, or layers.

## Consequences

- The shell change **broke things sized for a 12-unit wall**: the portrait grew through the ceiling,
  the curtain's hem ran below the floorboards, the window sprang above head height. Anything added
  from here should be sized against `CEIL_Y`, not against a number that looked right once.
- `skyLight` demoted from 3.2 to real moonlight at 0.45 means the **globe lamps are now the room's
  daylight**, at 5.2 with a 16-unit reach. Being point lights they do it in pools that fall off,
  which is the point.
- Still open: the Altar is the largest surface in frame and holds nothing but three candlesticks; the
  panels are still flat-lit dead-on; and the default camera still cannot see any of this.
