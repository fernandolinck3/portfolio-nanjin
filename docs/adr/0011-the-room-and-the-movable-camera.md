# The room, and giving the camera back to the visitor

The Unit stands on a walnut table in a chapel-like room: stone floor, plaster walls, and a leaded
window in the far wall with a moon behind it. The visitor moves the camera by dragging anywhere that
is not a control — pulling the view up from near-overhead until the Unit lies flat and the room and
its window come into frame.

**This reverses ADR-0007's ban on orbit.** That ban existed because the geometry was procedural
primitives tuned to read top-down and would not survive other angles. Tilting to 28° for the Altar
(ADR-0010) showed it holds up further than assumed, and a room the visitor cannot look at is not
worth building. What survives from ADR-0007: the Unit itself never rotates, and there is no INSPECT
control — the visitor moves, the object does not.

The camera is clamped rather than free: roughly 4°–74° off vertical and ±42° of yaw. It can never
get behind or beneath the Unit, where the geometry still does not hold.

**The window earns its place twice.** It gives the Moon deck a referent, and it gives the Vigil a
second act: moonlight is the one source the Vigil does not extinguish, so as the Candles die the room
does not simply go black — it goes cold and blue, lit by the moon and the Screen alone.

**Consequences**: the Unit is no longer the only thing that has to hold up visually. The table, the
floor, the walls and the window are all now part of the work, and every one of them is procedural.
