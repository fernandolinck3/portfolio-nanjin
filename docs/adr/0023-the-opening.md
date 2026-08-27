# The opening, and the one angle that ships

The visitor arrives on a raked view of the Unit, the Screen powers on inside its own buffer, and the
camera settles to straight down over three seconds. **That is the only camera move that ships**: the
orbit is closed.

## One angle

`CAM_LIMITS` opened a 70-degree arc of tilt and 84 of yaw. That freedom is how a room came to be
built that the default view could never see — four sessions of work on walls, panels, furniture and
light that were, at `tilt: 28`, entirely below the bottom of the frame.

The Plate is the object and top-down is the angle it is designed to be read at, so the orbit is off
and `REST` is `tilt 6, dist 5.6`. Dragging skips the intro; it no longer moves the view.

## The move

`OPEN` is `tilt 18, dist 6.4, yaw 0`, and both numbers were found by **projecting the frame**, not by
eye:

- At `tilt 38` the top of frame landed at `z = -4.46` against a desk back edge of `-4.3`. The arrival
  was looking past the wood into the emptiness where the room used to be.
- At `tilt 26` the void was gone and the back candlestick's top still projected to **ndc.y 0.97**,
  with the frame edge at 1.0 — inside by three hundredths. Precisely the miss that eyeballing
  produces.
- `18` clears both with margin.

`yaw` is 0 because at -9 the move swung sideways as well as down and the Unit appeared to rotate
under the camera. Squared up, the opening is a single axis: the view tips forward onto the Plate and
nothing else changes.

## Two clocks, not one

The Screen's power-on was originally driven off the camera's own progress, so every request to change
one changed the other — slowing the move to let the self-test count itself also made the flight
ponderous. They are separate now: the camera settles in **3.0s**, the machine takes **5.2s**. The
view comes to rest and then the last of the self-test runs in front of you, which is the better order.

## The loading is inside the display

An overlay div fading over the page said *"this website is loading"*. The page is the room the Unit
sits in; the Unit is the thing that switches on. So the boot is drawn in the Screen's own 320x180
buffer — a scan line snapping open, the aperture easing out of it, the name typed out by a cursor,
a self-test, and a bar.

It wears the **Module's own chrome**: the same double rule, the four foliate `corner()` ornaments,
blackletter where Modules put their titles, the header rule at y=44, the leader dots the PATH rows
use, and the boot percentage in the place a Module says `MOD 03/06`. Same components, different
content — which is what makes it read as the same device rather than a lookalike.

The name is typed rather than dissolved: at 320x180 a dissolve is mush, and a cursor eating along a
line is legible at any size and is what a terminal actually does.

## Three bugs this uncovered

- **The Screen showed the Module before it showed the boot.** `render.js` defaults `boot` to 1 — a
  Screen already on — and the Unit paints the buffer several times during setup, long before
  `intro.js` exists to say otherwise. `setBoot(0)` now runs at the top of `scene.js`, before a single
  pixel is drawn.
- **The intro only played once per session.** A `sessionStorage` guard meant to spare returning
  visitors also meant nobody building the thing ever saw it again after their first load. It plays
  every time; a click skips it.
- **The Plate arrived in three versions.** It was rebuilt procedurally, again when the faceplate
  artwork landed, and again when the webfonts did — four textures, ~30MB, swapped each time.
  Coalescing them into one was necessary and not sufficient, because a single late swap is still a
  visible swap. **Nothing is built at load now**: `faceMat` opens as bare dark metal and the
  engraving is assigned when the assets land. A faceplate whose printing appears as the unit powers
  on is what the boot is for, and it makes the first frame honest — the Plate really does have
  nothing on it yet.
