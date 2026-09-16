# Architecture decision log

This is the entry point for decisions, not a replacement history. Existing ADR-0001 through ADR-0031 remain canonical in [docs/adr/](docs/adr/); their original dates, alternatives and amendments are not reconstructed here. Numeric identifiers share one sequence regardless of zero padding. The next entry after this bootstrap is ADR-033; check both locations before allocating an ID. New architectural decisions use the format below in this file; a long supporting document may be linked instead of duplicated.

## Existing decisions to consult

| Subject | Original record | Reading note |
| --- | --- | --- |
| Portfolio as instrument | [ADR-0001](docs/adr/0001-unit-not-page.md) | Preserve the core product shape |
| Shared semantic content | [ADR-0002](docs/adr/0002-dom-is-truth.md) | Actual content is in `src/content`, with DOM and canvas consumers |
| Three.js weight | [ADR-0003](docs/adr/0003-threejs-weight-accepted.md) | Do not reinterpret as an unlimited performance budget |
| Procedural Unit / modelled scenery | [ADR-0004](docs/adr/0004-procedural-not-modelled.md), [ADR-0029](docs/adr/0029-the-unit-is-written-the-scenery-is-modelled.md) | Read the latter's 2026-09-08 door amendment |
| Light cost / post-processing | [ADR-0019](docs/adr/0019-the-light-count-was-the-cost.md), [ADR-0021](docs/adr/0021-post-processing-and-its-ceiling.md) | Historical measurements, not current benchmarks |
| Work presentation | [ADR-0022](docs/adr/0022-the-works-are-real-and-the-screen-shows-them.md), [ADR-0031](docs/adr/0031-a-parede-de-capas-e-a-vitrola.md) | Read alongside earlier ADR-0017; do not reinstate superseded behavior |
| Screen pagination | [ADR-0025](docs/adr/0025-pages-not-scrolling.md) | Supersedes ADR-0024 scrolling |
| External contact delivery | [ADR-0027](docs/adr/0027-the-form-speaks-to-an-outside-endpoint.md), [ADR-0030](docs/adr/0030-a-chave-do-formulario-fica-exposta.md) | Includes intentional public submission key |

## ADR-032 — One coordination layer over existing project records

Context:
The repository has existing ADRs, tickets, a glossary and dated handoff notes. A multi-agent bootstrap needs clear ownership and verification without duplicating product history or modifying unfinished runtime work.

Decision:
Use root `AGENTS.md` as the agent operating manual, `ARCHITECTURE.md` for verified current structure, this file for new decisions, `TASKS.md` for execution assignments, and `PLAN.md` for planning/review/integration. Keep existing `docs/tickets/` as the issue/specification tracker and link its T-NN records from execution tasks. The orchestrator owns coordination-file edits. Establish substantial-change plans before implementation; isolate task branches and integrate dependency foundations before dependents.

Reason:
This implements the requested working system while retaining established context. Explicit ownership and fixed review baselines reduce simultaneous edits to shared runtime and documentation.

Alternatives considered:
Replace all historical documentation; rejected because it would erase context and expand scope. Maintain two complete ADR/ticket histories; rejected because their status and requirements would drift. Rely solely on dated handoffs; rejected because current files already contain conflicting historical state.

Consequences:
New tasks link their source requirement instead of copying it. Legacy ticket status is reconciled when related work is planned/completed, not blindly imported. Review must distinguish implemented behavior, intended behavior and historical claims. No product architecture migration or new dependency is authorized by this operating decision.

Date:
2026-09-15 — established by this requested documentation bootstrap.

## ADR-033 — Reserve notice space in DOM frame coordinates

Context:
TASK-005 measured a correctly rotated portrait renderer but an oversized auxiliary visor, unrotated visor hit conversion and controls obscured by body-mounted notices. Reader stacking inside the stage also allowed sibling HUD/touch controls to intercept its controls.

Decision:
Keep the existing camera/renderer composition and portrait quarter-turn. A small `viewport-ui.js` helper measures notice/touch occupancy with ResizeObserver and converts visor coordinates. Frame CSS maps notice height to its bottom edge normally and right edge when rotated. Mount the reader directly inside the frame so it shares the intended overlay stacking order. Contact stays upright on the body; flat content reserves scroll space.

Reason:
These are DOM sizing, input conversion and stacking errors. Correcting their shared geometry avoids arbitrary per-device offsets and unnecessary changes to the camera, scene or navigation state.

Alternatives considered:
Reframe the camera or remove portrait rotation; rejected because the measured renderer already follows the intended contract. Hard-coded banner offsets; rejected because language, width and consent transitions change occupied height. A viewport framework; unnecessary for two observed elements and one inverse transform.

Consequences:
Notice updates require no animation loop, dependency or renderer resize. Frame overlays consume the shared CSS dimensions; body overlays consume physical notice height. Reader descendants must reserve notice space only once. Future room work must preserve this coordinate and stacking contract. Experimental visor ornament variants retain separate sizing and are outside the default-screen acceptance scope.

Date:
2026-09-15 — established during TASK-005, not an inferred historical decision.

## Observations that are not historical decisions

- **Inferred from current implementation:** the shipping site is owned by `prototype/`, with shared TypeScript content/build helpers. The root React app is dormant. This observation does not approve the migration in T-02/T-04 or close HANDOFF's unresolved architecture discussion.
- **Inferred from current implementation:** navigation state is split between `scene.js` and `screen/render.js`; there is no global store library. This is not a mandate to retain every coupling forever.
- **Inferred from current implementation:** body-mounted DOM and frame-space coordinates are part of the current portrait behavior. Changing that contract requires coordinated input/layout verification.

For a future entry, use `## ADR-NNN — Decision name` followed by `Context:`, `Decision:`, `Reason:`, `Alternatives considered:`, `Consequences:`, and `Date:`. State proposed/accepted/superseded status in Decision; link superseded records. Label implementation inferences explicitly and use the observation date, never an invented historical date.
