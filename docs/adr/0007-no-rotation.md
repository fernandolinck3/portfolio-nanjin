# The Unit does not rotate

There is no orbit control and no INSPECT toggle. The Unit tilts a few degrees following the pointer
with damping — always on, requiring no control — and never enough to expose its sides or back.

The geometry is procedural primitives tuned to read top-down (ADR-0004); free rotation would put the
weakest surfaces of the object on screen and add modelling work on the part nobody looks at. The
bounded tilt buys the object-in-space reading that a locked overhead shot loses.

**Consequences**: the top-down composition is a constraint every Part is designed against, not a
default camera position. Do not add `OrbitControls`.
