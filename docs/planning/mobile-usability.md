# Mobile usability before room expansion

## Outcome and evidence

TASK-005 / T-37 preserves the intentionally rotated instrument on coarse-pointer portrait devices while making its existing controls usable. Built Chrome at 390×844 confirms the frame and renderer correctly use 844×390. The auxiliary visor instead uses 820×474 CSS pixels and extends past the physical viewport. Its hit test assumes an unrotated rectangle. The notice stack measures 153 px while the flat mirror reserves only 100 px. The rotation hint is suppressed by a later CSS rule. The case reader uses physical viewport units inside the rotated frame.

## Selected approach

Use the current vanilla DOM/CSS/Three.js stack. Size overlays against their containing frame, correct pointer conversion, and expose measured notice occupancy to affected layouts. Preserve camera poses, room geometry, six Modules, content, translations and Contact delivery behavior. Avoid a camera rewrite or a new responsive framework. Any shared coordinate/notice helper must have a single owner and focused behavioral tests.

## Ownership and order

1. Root preserves the current working tree and records acceptance; read-only diagnosis can run independently.
2. `mobile_builder` exclusively owns affected UI/coordinate code in `~/dev/tenebrae-mobile-task005`, branch `agent/task-005-mobile`. Allowed files: `prototype/{index.html,boot.js,scene.js,focus.js,flat-skin.js,consent.js,language.js}`, Contact only if notice integration requires it, and a small shared viewport helper/test if justified. Inspect existing code first. No content, assets, dependencies or deployment edits.
3. Root verifies built-browser behavior while an independent reviewer inspects the frozen baseline-to-result diff. Corrections return to the builder before re-review.
4. Root alone integrates reviewed paths after checking baseline/result hashes, runs the complete verification suite, and updates records.

Baseline: HEAD `46bf5e9` plus 346 tracked/untracked working files in `~/dev/backups/portfolio-mobile-20260915-215854/`, with tar archive, SHA-256 manifest and Git bundle. The implementation worktree was restored and verified against that manifest. Unrelated dirty room work and completed Contact changes must remain byte-for-byte intact outside the approved diff.

## Acceptance and verification

- The visor fits its actual frame without clipping; its visible touch coordinates invoke the corresponding existing Screen actions in rotated and unrotated modes.
- Consent and language choices remain available; visitors can reach touch controls, room Back, flat Write and Contact without being forced to dismiss a notice.
- Case reader content and Back remain reachable in portrait/landscape, including a resize while open. Flat mode has no irrelevant rotation prompt.
- Preserve desktop composition, explicit `?turned`, both locales, shared navigation and mocked Contact behavior. Inspect experimental room navigation separately.
- Run check, strict Vitest, typecheck, build:site, verify:site; inspect browser errors, overflow and control bounds. No real form sends.
- Browser emulation is not a real-device keyboard/safe-area or screen-reader check; disclose those limits. No performance or FPS claim from headless rendering.

## Integration and rollback

Integrate only frozen reviewed product paths. Preserve the snapshot and baseline/result diff so the task can be reversed without discarding unrelated work. No commit, push or deployment is implied. Source-only layout fixes do not authorize a visual redesign or room expansion.

## Handoff

TASK:
TASK-005 / T-37, `agent/task-005-mobile`, integrated locally into the preserved `lyra` working tree. No commit created. Baseline and ownership are recorded above.

STATUS:
DONE. `mobile_reviewer`: PASS after corrections; root integrated the fixed reviewed hashes.

FILES CHANGED:
Product: `prototype/{index.html,boot.js,scene.js,focus.js,flat-skin.js,contact.js,consent.js,language.js,viewport-ui.js,viewport-ui.test.js}`. Coordination: AGENTS, ARCHITECTURE, DECISIONS (ADR-033), TASKS, this plan, T-37, ticket board and next-ticket pointer. Pre-existing room/assets/Contact work retained.

WHAT CHANGED:
Measured notice/touch occupancy drives frame-aware controls and default visor bounds. Visor input inverts rotation. The reader uses actual frame dimensions and mounts above sibling controls; image arrows reserve notice occupancy once. Contact height and flat scrolling clear the notices. Rotation hint works in 3D and stays hidden in flat.

WHY:
Actual mobile geometry exposed a physical-viewport CSS rule inside a rotated frame, unrotated hit mapping and unreserved notice space. Independent review/browser interaction also exposed reader stacking and duplicate arrow insets; both were corrected before acceptance.

VERIFICATION PERFORMED:
`npm run check`, `npx vitest run` (170 tests / 9 files), `npm run typecheck`, `npm run build:site`, `npm run verify:site`: all passed in implementation and again in main. Seven built Chrome scenarios passed (PT portrait, EN landscape, PT flat, EN flat landscape, EN desktop, forced portrait, experimental room). Actual touchscreen taps selected Graecus, image Next changed the source, full case scrolling and Back worked on portrait/landscape/320px and room mode. Room Back returned from a station. Contact opened above notices before consent dismissal. Consent-to-language transitions and reader resize were checked. No real form sends; requests intercepted. Existing scene transition stepping was used for deterministic browser inspection where software WebGL was slow.

Local ignored evidence: `.impeccable/mobile-task005/` holds logs, reviewed patch/hashes, detector report, browser scripts/results and screenshots. The detector's three inherited findings were existing CRT glow, work-rail width transition and an initially hidden image populated on open. Initial failed arrow/HUD checks led to the corrected final candidate; the final results replace those failures.

KNOWN RISKS:
Existing production scene chunk warning remains (~1,019 kB minified). Alternative experimental visor ornament dimensions were not redesigned or accepted as part of default tela checks. No FPS/GPU performance claim. No lint configuration exists.

MANUAL VERIFICATION NEEDED:
Real-phone keyboard, browser chrome and safe-area behavior; screen-reader interaction. Browser emulation does not establish these.

FOLLOW-UP WORK:
No additional implementation required for this local milestone. Real-device verification remains before publishing. Room expansion remains a separate planned milestone; no camera or geometry redesign was performed.
