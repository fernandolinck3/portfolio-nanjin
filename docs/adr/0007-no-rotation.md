# The Unit does not rotate

There is no orbit control and no INSPECT toggle, and the Unit does not move at all. It is a heavy
object resting on a table, not something that follows a cursor.

**Amended 2026-08-25.** This originally specified a few degrees of damped pointer lean. That was
removed: with the Unit standing on the Altar (ADR-0010) the lean read as the object sliding around
on the desk rather than as parallax, and a physical instrument that drifts under the pointer feels
weightless. The camera angle itself moved off vertical — see ADR-0010.

The geometry is procedural primitives tuned to read top-down (ADR-0004); free rotation would put the
weakest surfaces of the object on screen and add modelling work on the part nobody looks at. The
bounded tilt buys the object-in-space reading that a locked overhead shot loses.

**Consequences**: the top-down composition is a constraint every Part is designed against, not a
default camera position. Do not add `OrbitControls`.
