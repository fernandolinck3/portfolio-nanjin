# three.js is back, and its weight is accepted

The July build deliberately stripped three.js, replacing an 863 kB WebGL chunk with a 7 kB
hand-rolled renderer. That decision is reversed: the Unit needs real materials, environment
lighting, PMREM and shader access, and hand-rolling those costs more than it saves.

This is a deliberate reversal, not an oversight. Nobody should "fix" the bundle by removing three.js
again — the cost was weighed and paid.

**Consequences**: the bundle is dominated by three.js. Every other dependency must therefore justify
itself hard, which is why `lenis` was dropped and React was kept only because it owns the DOM truth
layer. Low-power and no-WebGL devices get the flat Plate instead (ADR-0008).
