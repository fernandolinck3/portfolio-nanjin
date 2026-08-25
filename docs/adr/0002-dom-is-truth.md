# The DOM is the canonical content; the canvas is a render

Every Module's copy exists as real semantic HTML — visually hidden but selectable, focusable and
crawlable — and the Screen texture renders those same strings. Pads are real `<button>` elements
layered over the 3D controls, so the Unit can be operated by keyboard and screen reader.

The primary audience is recruiters, who use find-in-page, paste into applicant tracking systems,
share links that need previews, and sometimes use assistive technology. Content that exists only as
pixels on a canvas texture is invisible to all of that.

**Consequences**: one content source, two consumers, and a sync discipline that must not be allowed
to drift. The DOM layer is not a fallback bolted on afterwards — it is where the content lives, and
the scene reads from it.
