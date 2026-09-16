# Contact reliability implementation plan

Established 2026-09-15 after authorization to implement the Contact milestone. The full interactive room remains the product direction; this change makes the shared contact surface reliable wherever it is opened.

## Contract

- Outcome: keyboard users stay inside the open dialog and return to their opener; all visitors can leave a pending request, retain the draft and recover from unconfirmed delivery.
- Scope: `prototype/contact.js`, new behavioral tests in `prototype/contact.test.js`, and necessary PT/EN status strings in `src/content/strings.ts`.
- Non-goals: visual redesign, room expansion, mobile frame/camera changes, new dependencies, vendor changes, real messages, commits or deployment.
- Sources: root operating/architecture documents, current contact and work-viewer implementations, existing locale and Vitest conventions, T-36.
- Risk: medium; asynchronous requests and modal focus must not affect a newer session or background navigation.
- Production authorized: false.

## Baseline and ownership

The main `lyra` checkout remains in place. A recoverable snapshot of all tracked and nonignored untracked files was created before implementation, alongside an all-ref Git bundle, status, HEAD and SHA-256 manifest:

`~/dev/backups/portfolio-contact-20260915-213354/`

The snapshot contains 343 files and was restored/verified in `~/dev/tenebrae-contact-task004` on branch `agent/task-004-contact`, based on `46bf5e9`. It deliberately includes the existing dirty room work; it is not a commit claiming ownership of that work. Dependencies are reused through a local node_modules symlink; no lockfile update is planned.

`contact_builder` exclusively owns the three implementation files. Root owns planning/task records, browser verification and integration. A separate reviewer inspects a frozen patch against this contract. Implementation and independent browser-harness preparation can run in parallel; two agents must not edit the modal concurrently.

## Selected approach

Keep the existing body-mounted DOM form and its public callbacks. Use native focus/event and request cancellation primitives, a 15-second request deadline covering fetch and body parsing, and per-attempt/session ownership to ignore stale completions. Closing remains available while pending. Preserve entered data on error/cancellation; avoid losing edits made during sending. Clear obsolete success/hide timers when sessions change.

Cancellation stops local waiting; it cannot retract a message already accepted by the service. Timeout/cancellation copy must therefore state that delivery is unconfirmed, not assert non-delivery. No automatic retry; the visitor chooses whether to retry or use the email alternative. Keep duplicate-submit protection.

## Verification and integration

1. Implement meaningful Vitest regressions with mocked fetch: focus boundaries, restoration, duplicate submit, network/API/JSON failure, bounded waiting including body stalls, pending dismissal, reopening, stale responses and timers, draft preservation and confirmed success.
2. Freeze implementation artifacts for independent review. Address required findings and re-review before integration.
3. Run check, Vitest, typecheck, build:site and verify:site in the isolated worktree. Inspect built `/`, `/en/`, `?flat` and `/en/?flat` with intercepted requests, desktop and emulated mobile layouts. Real-device keyboard and screen-reader testing remain separate manual checks.
4. Integrate only the three allowed files after comparing their current main-checkout hashes with the baseline. Stop on concurrent changes and reconcile rather than overwrite. Preserve every unrelated tracked/untracked file.
5. Rebuild the main preview, verify the integrated artifact and update TASKS/ticket evidence. Do not commit or publish.

Rollback is a restoration of only this task's files from the saved baseline (or removal of its newly created test), after checking for intervening edits. Do not reset the repository or revert room work. Keep the snapshot and worktree for recovery.

## Handoff

TASK:
TASK-004 / T-36. Implemented in `agent/task-004-contact` and copied into main after baseline/reviewed SHA-256 comparisons. No new commit; HEAD remains `46bf5e9`.

STATUS:
DONE locally. Independent review by `contact_reviewer`: PASS.

FILES CHANGED:
Product: `prototype/contact.js`, `prototype/contact.test.js` (new), `src/content/strings.ts`. Coordination: TASKS, ARCHITECTURE, this plan, T-36, ticket board and next-ticket pointer. Pre-existing room/assets edits preserved.

WHAT CHANGED:
Contact wraps Tab/Shift+Tab and redirects external focus while open. Closed controls are inert/hidden; closing restores the connected opener. Pending fields remain readonly, Back/Escape/backdrop remain usable, and requests have a 15-second deadline covering body parsing. Attempt identity and cleared timers protect newer sessions. PT/EN timeout/cancellation copy explains unconfirmed delivery and possible duplicates on retry. Drafts survive failure/cancellation and clear only on confirmed current success.

WHY:
The existing Contact modal leaked focus and could trap the visitor indefinitely during a stalled send. The same body-mounted surface serves the instrument and text fallback, and remains reusable as room exploration expands.

VERIFICATION PERFORMED:
- Isolated worktree and integrated main: check, strict Vitest (8 files / 166 tests), typecheck, build:site, verify:site passed. Thirteen new behavioral tests cover focus, duplicate submit, failure, fetch/body stalls, cancellation, late responses, reopening and old timers.
- Independent read-only review: PASS; no required changes.
- Built Chrome: PT flat/mobile, EN flat/desktop, PT 3D/desktop and EN 3D/mobile passed focus wrapping, consent-focus containment, pending Escape/restoration, draft preservation, mocked network failure/success and old-success-timer isolation. The PT mobile test waited the actual 15-second deadline and confirmed its localized recovery message. All requests were intercepted; none reached Web3Forms.
- Contact screenshots were inspected separately from behavioral assertions; initial captures during the fade were insufficient visual evidence, so final integrated captures wait for full opacity.
- Impeccable detector on the changed UI files: no findings. No lint setup exists.
- Local evidence: `.impeccable/contact-task004/` (ignored), with logs, reviewed hashes, browser harness/results and final screenshots.

KNOWN RISKS:
Aborting cannot retract a message already accepted remotely. The existing scene bundle warning remains. An existing consent banner can overlap the mobile flat-view Write button; keyboard opening and ordinary banner dismissal allowed Contact checks to proceed. That broader layout issue remains outside this milestone. Existing malformed-response wording is categorical; broader delivery-uncertainty copy remains a possible follow-up, not a new regression.

MANUAL VERIFICATION NEEDED:
Real-device software keyboard, screen-reader announcements and live service delivery. No real delivery is claimed from mocks. Main preview remains available at `http://127.0.0.1:4173/`.

FOLLOW-UP WORK:
Review mobile framing/notice placement as a separate scoped milestone before expanding room destinations. Preserve the snapshot/worktree; no commit or publication was performed.
