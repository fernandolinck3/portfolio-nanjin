# Portrait reframes the Unit rather than shrinking it

On narrow screens the same 3D Unit is recomposed rather than scaled: the camera pulls in so the
Screen fills the top, the Pads sit under the thumb at real touch size, and the Jog and Vigil move
below. Devices that cannot carry it — no WebGL, low power, `prefers-reduced-motion` — get the flat
Plate, rendered from the DOM truth layer (ADR-0002) as a printed silkscreen in CSS.

Scaling the desktop composition into portrait was rejected: it puts every control below a
fingertip's width and makes the Screen unreadable. Serving the flat Plate to all phones was
rejected because mobile visitors would never see the craft that is the portfolio's only proof.

**Consequences**: Part layout is a responsive system, not fixed coordinates. The flat Plate is a
real deliverable with its own design pass, not a graceful-degradation afterthought.
