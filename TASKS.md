# Agent execution ledger

Orchestrator owns this file. Status vocabulary: TODO / IN PROGRESS / BLOCKED / REVIEW / DONE. A task is not assigned until Owner names one agent and the plan records its branch/worktree, baseline and allowed files. DONE requires acceptance evidence, review and integration verification; a completed patch awaiting integration stays REVIEW.

This ledger schedules bounded execution, while [docs/tickets/README.md](docs/tickets/README.md) retains product issues and requirements. Link existing T-NN tickets; do not copy their backlog or assume old statuses are current. When promoting a new finding to a product issue, create its T-NN record and board entry together under the existing tracker convention. Items below are analysis-supported candidates, not authorization to implement.

## Milestone — Resolve verification and lifecycle gaps

### TASK-001 — Guard the domain artifact in site verification

Status:
DONE

Owner:
root (Claude Code, 2026-09-16)

Dependencies:
An agreed committed baseline containing the relevant work; no dependency on room redesign.

Scope:
The site verifier currently checks localized HTML and discovery assets but never checks `CNAME`, although the Pages contract depends on it. Add the smallest deterministic artifact guard; do not change the domain or deployment setup.

Files likely involved:
`scripts/verify-site.mjs`; read `public/CNAME` and `.github/workflows/pages.yml` as contracts.

Goal:
Reject a deployment artifact with a missing or incorrect domain file.

Acceptance criteria:
- A fresh valid `build:site` passes verification.
- Missing and incorrect CNAME fixtures fail with a useful message; destructive checks use a temporary artifact copy.
- Domain source and deployment behavior are unchanged; full integration checks pass.

Progress evidence (2026-09-16):
`scripts/verify-site.mjs` takes an optional artifact path (default `dist-site`, which CI still uses unchanged) and now fails when `CNAME` is missing or differs from the host of the canonical URLs (`nanj.in`). Fresh `build:site` + `verify:site` pass (`CNAME is nanj.in`). Fixtures on copies in the session scratchpad: missing file → exit 1, "CNAME was not written — deploying this clears the custom domain"; `example.com` → exit 1, "CNAME says "example.com", expected "nanj.in"". `public/CNAME` and `pages.yml` untouched. Not independently reviewed.

### TASK-002 — Verify and bound scene lifetime after GPU loss

Status:
TODO

Owner:
unassigned

Dependencies:
Exclusive ownership of the scene lifecycle; a browser capable of exercising WebGL context loss; preserved room-work baseline.

Scope:
`boot.js` switches to the flat view on context loss, while `scene.js` recursively schedules rAF and registers global handlers without an identified teardown API. Reproduce and measure first; agree a minimal lifecycle contract before changing the scene. Do not refactor all runtime state.

Files likely involved:
`prototype/boot.js`, `prototype/context-loss.js`, `prototype/scene.js`, `prototype/flat.js`; tests only where they verify the agreed contract.

Goal:
Confirm that fallback remains usable and does not leave inappropriate render/input work running.

Acceptance criteria:
- Record a built-site context-loss reproduction and observed loop/listener behavior.
- If confirmed, bound the old scene's work/resources through one explicit lifecycle owner, without duplicate fallback UI.
- Verify initial `?flat`, normal boot, repeated loss handling, keyboard/contact interactions and both locales; full integration checks pass.
- If not reproduced, record evidence and disposition rather than introducing speculative teardown code.

### TASK-003 — Reconcile stale repository entry and status guidance

Status:
TODO

Owner:
unassigned

Dependencies:
Orchestrator/documentation ownership; verify current Git/config/source before editing historical guidance.

Scope:
The issue-tracker guide claims no remote; HANDOFF mixes old clean/deployed claims with later corrections; default package scripts point to the dormant app. Clarify current entry guidance and status pointers while preserving historical records. Related prior issue: [T-25](docs/tickets/T-25-the-documents-describe-another-object.md); its previous completion is not evidence that later drift is fixed.

Files likely involved:
`HANDOFF.md`, `docs/agents/issue-tracker.md`, `docs/tickets/README.md`; read `package.json`, configs and root architecture docs.

Goal:
Make active operational guidance consistent without assuming a React migration or changing scripts incidentally.

Acceptance criteria:
- Entry instructions point to shipping commands and distinguish current observations from dated history.
- Remote/deployment statements match inspected configuration; no claim of live deployment without evidence.
- Existing tickets/ADRs remain linked; no copied competing backlog or product implementation change.

Use the same fields for future tasks. Include evidence in Scope, explicit dependency IDs where applicable, bounded file ownership and observable acceptance criteria. Record blockers and required resolution under Dependencies; do not silently broaden Scope when implementation discovers more work.

## Milestone — Dependable Contact before room expansion

### TASK-004 — Contain Contact focus and bound delivery attempts

Status:
DONE

Owner:
contact_builder (implementation); contact_reviewer (independent review: PASS); root (orchestration/integration).

Dependencies:
Preserved baseline complete: HEAD `46bf5e9` plus the 343-file working-tree snapshot in `~/dev/backups/portfolio-contact-20260915-213354/`. Archive, SHA-256 manifest and all-ref Git bundle retained. Implementation worktree `~/dev/tenebrae-contact-task004`, branch `agent/task-004-contact`; snapshot restored and hashes verified. No other task dependency.

Scope:
[T-36](docs/tickets/T-36-contact-reliability.md), implemented under the [Contact plan](docs/planning/contact-reliability.md). Fix keyboard containment/restoration and bounded, cancellable request lifecycle. Preserve design, content claims and unfinished room work.

Files likely involved:
`prototype/contact.js`, `prototype/contact.test.js`, `src/content/strings.ts`; orchestration records are owned by root.

Goal:
Visitors can write, recover from interrupted delivery, and leave Contact without losing an unsent draft or becoming stuck.

Acceptance criteria:
- Tab/Shift+Tab remain in the open dialog; closing restores the opener and removes hidden controls from keyboard navigation.
- Back, Escape and backdrop dismiss pending requests while preserving the draft; a 15-second deadline covers response and body reading.
- Timeout/cancellation do not claim that delivery failed or succeeded when it is unknown; PT/EN recovery copy remains accurate.
- Duplicate submits, late responses and old timers cannot overwrite a newer attempt/session/draft.
- Mocked automated and built-browser checks cover success, failure, pending cancellation and timeout across both locales and 3D/flat entry paths. No real message is sent.
- Independent review and the full integration checks pass; real-device/assistive-technology limits remain explicit.

Completion evidence:
Integrated only the three reviewed product files after checking main against baseline hashes and implementation against reviewed hashes. All five checks passed again in main: 166 tests across eight files. Isolated Chrome passed mocked behavioral checks on PT/EN, 3D/flat, desktop/mobile; actual 15-second timeout verified. No real messages, commits or deployment. Evidence and residual manual checks: [handoff](docs/planning/contact-reliability.md#handoff).


## Milestone — Usable mobile controls before room expansion

### TASK-005 — Correct rotated overlays and notice obstruction

Status:
DONE

Owner:
mobile_builder (implementation); root (orchestration/integration); mobile_reviewer (independent review: PASS).

Dependencies:
TASK-004 integrated. Exact dirty baseline preserved in `~/dev/backups/portfolio-mobile-20260915-215854/`; isolated branch `agent/task-005-mobile` in `~/dev/tenebrae-mobile-task005`.

Scope:
[T-37](docs/tickets/T-37-mobile-usability.md), under the [mobile usability plan](docs/planning/mobile-usability.md). Browser-confirmed oversized rotated visor, incorrect visor touch mapping, notice obstruction, and reader/frame sizing. Preserve room and camera design.

Files likely involved:
`prototype/{index.html,boot.js,scene.js,focus.js,flat-skin.js,consent.js,language.js}`, a focused layout helper/test if needed, Contact layout only if necessary. Root owns documentation.

Goal:
Existing portfolio navigation and reading remain usable on mobile before expanding the room.

Acceptance criteria:
- Visor fits and touch hits agree with its visible surface in both orientations.
- Notice choices and existing controls remain reachable, including flat Write and room Back.
- Reader Back/content stay reachable and flat mode has no rotation hint.
- PT/EN, desktop/mobile, resizing and relevant experimental modes receive browser verification; Contact remains usable with mocked requests only.
- Independent review and full integration checks pass; real-device verification limits are stated.

Completion evidence:
Independent source review PASS after correcting duplicate arrow offsets and moving the reader out of the stage stacking context. All five checks passed again after integration: 170 tests across nine files. Seven built-browser scenarios passed across locales, modes and orientation changes; actual touch checks opened the correct project and exercised image navigation, scroll and Back at 390px/320px portrait and landscape. Experimental room Back passed. Source integrated only after baseline/review hash comparisons. No real messages, commits or deployment. See [handoff](docs/planning/mobile-usability.md#handoff) for evidence and limits.


## Milestone — Separate default portfolio behavior from room experiments

### TASK-006 — Prevent default project openings from targeting hidden room sleeves

Status:
DONE

Owner:
root (bounded fix and verification); runtime_boundary_review (independent source review: PASS).

Dependencies:
TASK-005 integrated. Preserve all room work and inspect its actual route boundary.

Scope:
[T-38](docs/tickets/T-38-room-boundary-and-mobile-performance.md). Browser reproduction compared direct instrument focus with the normal project-opening control: camera positions differed by 9.98 scene units despite room being off. Gate wall-sleeve lookup on existing ROOM_K, leaving room modes intact.

Files likely involved:
`prototype/scene.js`; root coordination docs. No asset/config/quality changes.

Goal:
Default portfolio Work opening stays at the instrument; enabled room Work opening retains wall targeting.

Acceptance criteria:
- Actual default opening matches the instrument target (previously failed); enabled-room target remains at wall.
- Reader Back works; five verification commands pass; independent source review passes.
- Existing dirty room/assets changes remain intact.

### TASK-007 — Diagnose physical-phone rendering lag

Status:
IN PROGRESS

Owner:
root; awaiting device/browser details and phone measurement.

Dependencies:
A reproduction on the affected phone. Host GPU emulation does not establish mobile performance.

Scope:
[T-38](docs/tickets/T-38-room-boundary-and-mobile-performance.md). User reports lag. Local M1 Pro Chrome at 390×844, DPR3 (render cap1.5), default route measured median16.7ms and p95 16.8ms; no mobile-lag reproduction on host. Temporary ignored local diagnostic offers current/quality0 comparison and reload reset; no product quality change or telemetry service.

Files likely involved:
Ignored local browser evidence/diagnostic first. Product-file scope will be established after physical reproduction identifies cost.

Goal:
Reproduce and reduce the reported phone lag with before/after evidence, preserving usable content and explicit room separation.

Acceptance criteria:
- Record device, browser, route, warmup and foreground frame timings from the affected phone.
- Test ranked, measurable causes before changing production quality defaults.
- Verify improvement on that phone and preserve appearance/interaction; no claim of success from host-only results.

Progress evidence (2026-09-16):
Device: iPhone 13 Pro, Safari, over LAN against `build:site`. User reports lag improved; faceplate texture slow to appear. Host measurement: `ornament/plate.png` (2.7 MB) was requested only after `scene.js` evaluated (GET 4.8 s → 8.8 s in the automated tab). Added `plate.webp` (q92, 486 KB), tried first, plus `<link rel="preload">` in `prototype/index.html`: download now 19 → 63 ms and reused by the loader. PNG kept as fallback. Not yet re-checked on the phone; `regenFace()` canvas cost on the phone is unmeasured.
User then confirmed the faceplate improved, but loading still takes seconds. Host timing of `scene.js` module evaluation (markers before each top-level block, built site): 3.25 s, of which 1.66 s was the seven wall sleeves in `room-decor.js`, drawn at load although the room is off by default. Sleeves now drawn on first `setRoom(true)`; their halftone is a pattern fill (max pixel diff 4/255 against the loop). Result: 1.53 s evaluation, and the five `works/*-home.jpg` sleeve downloads no longer happen on `/`. `?trilho` still draws all seven sleeves with captures. Remaining largest blocks are each under 250 ms. Not yet re-checked on the phone.


### TASK-008 — Keep the auxiliary room display off the default instrument

Status:
REVIEW

Owner:
root (small visibility fix and verification); independent reviewer pending.

Dependencies:
TASK-006; preserve existing room implementation.

Scope:
[T-39](docs/tickets/T-39-default-display-duplication.md). Built-browser reproduction at390×844 found the auxiliary visor visible on both `/` and `/en/`; user confirms it duplicates the CDJ screen. Restrict its existing projection policy to enabled room mode.

Files likely involved:
`prototype/scene.js` and coordination records. No camera, asset or quality changes.

Goal:
Default portfolio shows the instrument display only; room exploration retains its auxiliary display.

Acceptance criteria:
- Browser default PT/EN reports visor hidden while `?trilho` retains visibility.
- Ordinary instrument controls open/read/close projects without relying on visor.
- Full checks and independent review pass; shader/startup work remains explicitly separate under TASK-007.

Progress evidence (2026-09-16, after the Codex session ended):
Fix present in `scene.js` (`visorDeveAparecer` returns false when `ROOM_K === 0`). `npm run check`, `npx vitest run` (170 tests), `build:site` and `verify:site` pass. Built-browser check in a 390×844 iframe: visor hidden on `/` and `/en/`. **Not conclusive:** a control build without the gate also kept the visor hidden in that harness (automated tab is hidden and throttles rAF), so the red state was not reproduced here and `?trilho` visibility was not confirmed. Remaining: check on the user's phone over LAN, and independent review.
