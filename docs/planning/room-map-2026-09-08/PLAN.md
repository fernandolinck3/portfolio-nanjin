# Room exploration map

Date: 2026-09-08
Status: experience map approved in conversation; spatial composition and framing are pending visual review. Planning only; no runtime changes in this delivery.

## Approved experience

- Extend the existing portfolio and its fictional, baroque, magical world.
- The instrument remains the primary, complete portfolio experience. Room exploration is optional.
- Provide a whole-room overview as a destination in its own right.
- Clicking a destination moves the camera to a fixed composition. No free walking or orbit.
- Visible adjacent destinations can be selected directly. Visibility must be verified in the actual frame; physical proximity alone does not establish a navigation link.
- Provide consistent returns to the overview and instrument, preserving content and lighting state.
- Retain the existing six content modules. Physical destinations do not require one-to-one correspondence with modules.

## Approved destination map

| Destination | Existing foundation | First-release action | Production dependency |
|---|---|---|---|
| Overview | Experimental panorama | Select visible destinations; return to instrument | Whole-room composition, clear targets and non-obstructing controls |
| Altar | Instrument and its controls | Preserve existing portfolio operations; offer exploration | Entry/return integration and a legible fixed close view |
| Acervo | Credenza, imported player, work sleeves | Open existing work content through sleeves | Final material/light treatment and open/close visual validation |
| Retrato | Lyra, frame and question interaction | Preserve and polish existing questions | Reconcile existing approach/detail poses with the fixed-scene contract |
| Leitura | Shelf and chair | A prominent grimoire opens existing criteria content | Grimoire asset, readable content presentation and click feedback |
| Lareira | Fireplace, sofa and rug | Ambient fire; no new content mechanic required | Fireplace quality, coherent seating and a proposed decorative mirror |
| Oficina | Workbench and simple equipment | A principal artifact opens existing skills content | Select the artifact and appropriate model; make its role visually legible |

The door remains architecture, not a first-release destination. Contact stays available through the instrument and a discreet exploration control. Trajectory remains accessible through the instrument. Do not remove the implemented door station or rewire module selection until the new navigation mapping is implemented deliberately.

Deferred: mirror apparition, alternate room, portals, puzzles, playable equipment, new audio interactions. These are not prerequisites for the first release. A decorative mirror at the fireplace is a placement proposal, not an existing verified asset placement.

## Source snapshot and known gaps

The current prototype exposes exploration through `?trilho`. It still contains a door station and maps station navigation to module pads. The approved map is therefore a target, not a description of deployed behavior.

Sources: `prototype/scene.js`, `prototype/trilho.js`, `prototype/room-mobilia.js`, `prototype/room-decor.js`, `prototype/room-baroque.js`, `public/quarto/trilho.json`.

The diagram in `index.html` is a schematic top view based on current x/z anchors. It is not a construction drawing, final layout, visibility test or new render. Furniture footprints and labels are illustrative. Colored numbered markers identify existing camera x/z positions, with arrows to their targets. Altar is represented by its central anchor rather than an inferred camera.

The right workbench currently sits at x=10.75, z=1.8; the shelf sits at x=11, z=3.6; the fireplace anchor is x=11.42, z=-1. These nearby anchors identify a joint composition question, not proof of mesh intersection.

## Framing acceptance, before modeling the next area

1. Overview: instrument is recognizable, destinations are discoverable, and ceiling/floor/side walls form a coherent space.
2. Altar: instrument stays readable and operable; exploration entry is clear without dominating it.
3. Acervo: sleeve selection, case opening and return are coherent; furnishings do not obscure targets.
4. Retrato: frame and questions fit; decide whether to consolidate the current two viewing distances. Content reading may use an overlay without introducing free camera movement.
5. Leitura: grimoire has a clear place and accessible click area; shelf, chair and lamp form a group.
6. Lareira: fire and seating define the composition; decorative mirror has a credible surface and scale.
7. Oficina: work artifact is the subject; no obstruction from fireplace furniture or reading area.

All destination links must be based on actual visible targets. Confirm a non-hover affordance for touch and keyboard. Test destination-to-destination camera paths; the prior review required returning through Altar to capture intended poses, so screenshots alone do not validate transition behavior.

## Execution sequence

1. Review this schematic and the captured current frames together. Choose right-wall grouping and the overview composition before moving assets.
2. Produce a spatial blockout only for those approved adjustments. Compare the same seven frames; no blanket camera retuning.
3. Finish Acervo as the pilot: models, surfaces, lighting, sleeve action, readable case and return. Show actual before/after evidence.
4. Integrate optional entry, overview, independent destination mapping and persistent return behavior.
5. Finish remaining areas with an explicit asset list before implementation. Each task names the selected model or records an unresolved production dependency.
6. Validate the whole experience on agreed desktop/mobile targets, including lighting states, loading, keyboard, reduced motion and readable content access.

Use one bounded implementation task at a time. Each handoff includes approved scope, relevant files, selected assets, required before/after views and a stopping condition. A test pass establishes code behavior only; aesthetic acceptance requires reviewing the render. Preserve existing worktree changes. No commit or deployment is included.
