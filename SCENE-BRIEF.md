# Scene Brief — The Monument

## Status

Approved 2026-07-27. Supersedes the previous "Threshold Signal Panel" brief, which described an electronic display panel that has been removed from the direction entirely.

## Purpose

Make Fernando's name the single interactive artifact of the page.

The visitor should feel that the name is an object with weight and history rather than text sitting on a background. The scene is evidence of frontend craft and the source of the page's atmosphere. It is not decoration beside the introduction — it *is* the introduction.

## Why WebGL

The wordmark must respond to the visitor continuously and must degrade under scroll into the section transitions. Phosphor bloom, chromatic separation, and signal dropout applied per-pixel to live vector geometry are not reproducible in CSS at acceptable quality.

A static fallback must still carry the concept. If the interaction does not communicate more than a CSS treatment during visual review, the WebGL version is removed.

## Scene

- **Subject:** The `FER BITTENCOURT` wordmark as original constructed vector geometry, converted to renderable form. No imported 3D model, no font file, no figurative object.
- **Material:** Procedural phosphor light, scanlines, chromatic drift, grain, and intermittent signal loss applied to the letterforms.
- **Light:** Off-white emission with a single signal-red component. No second hue. No rainbow, no spectrum.
- **Camera:** Stable and shallow. No free orbit, no first-person movement, no cinematic flight.
- **Composition:** The monument crops against the viewport edges. It dominates the lower two thirds of the opening screen, beneath the system header.

## Interaction timeline

- **Load:** The static wordmark is visible immediately as SVG. WebGL replaces or overlays it only once ready.
- **Idle:** Very slow phosphor drift and occasional dropout suggest a signal still alive.
- **Pointer:** Restrained displacement, chromatic separation, and light shift follow normalized pointer position with damping.
- **Touch:** Touch position may influence the field. No gesture is required to understand the page.
- **Scroll:** Scroll progress drives the monument's decay and recession as the visitor leaves the Threshold. It must not trap scrolling.

## Relationship to content

Fernando's name is also present as real, selectable, screen-reader-available text. The rendered monument is an enhancement layered over accessible markup, never a replacement for it.

The header, current practice, status, navigation, and CTA remain semantic HTML outside the canvas.

## Fallback and failure behaviour

- Provide the wordmark as inline SVG with a CSS phosphor treatment. This is the baseline, not an afterthought.
- With `prefers-reduced-motion`, render a still monument and disable the smooth-scroll layer.
- If WebGL is unavailable, initialization fails, or context is lost, keep the SVG and preserve the complete page.
- The canvas must not intercept navigation, keyboard focus, or text selection.

## Assets and rights

Use only original constructed geometry and project-owned code. No licensed display font is used for the wordmark. No film stills, album artwork, photography, third-party textures, or downloaded models.

The letterforms are drawn for this project and belong to Fernando.

## Device and performance approach

- Cap renderer pixel density based on measured device behaviour.
- Pause rendering when the Threshold is not visible or the document is hidden.
- Avoid post-processing until the base scene is measured and reviewed.
- The previous build's WebGL chunk reached 863 kB minified. That is the ceiling to beat, not a budget to spend.
- Test real bundle size, resize behaviour, and browser performance before accepting the scene.

## Visual acceptance

- The monument reads first as a name, second as an object.
- It feels reverent and decayed rather than futuristic or technological.
- Nothing in it suggests audio, playback, equalization, or live data.
- Pointer response is discoverable by feel but never distracting.
- The static SVG fallback preserves the concept and composition.

## Technical acceptance

- No essential content exists only in WebGL.
- The name is selectable text or has an accessible equivalent.
- Resize and cleanup are correct.
- Reduced-motion behaviour is observable and disables smooth scroll.
- The SVG fallback remains visible on initialization or runtime failure.
- Scroll, keyboard navigation, and find-in-page continue to work.
