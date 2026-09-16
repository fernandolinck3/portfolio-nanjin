# Planning, parallel execution and handoff

This is the process for future changes, not a plan to implement the backlog now. Read [AGENTS.md](AGENTS.md), [ARCHITECTURE.md](ARCHITECTURE.md) and relevant existing requirements first.

## Establish the plan

For any substantial request, the orchestrator must:

1. Understand the observable outcome; inspect relevant current implementation and user edits.
2. Identify constraints, affected systems, shared state/interfaces and dependencies.
3. Compare implementation options only where tradeoffs matter; prefer the smallest robust approach using existing systems.
4. Define milestones, tasks, ownership, acceptance criteria and verification.
5. Identify safe parallel tasks and work that must be serialized; establish the shared contracts first.
6. Present the execution plan before implementation begins. Resolve unanswered choices that materially affect scope; do not infer approval from silence. A clear request already authorizing the selected work does not need a redundant permission gate.

Small, obvious fixes can use a short plan with scope and verification. New visual direction follows the project's discovery/plan process and user approval before product code; a technical bootstrap does not authorize a redesign.

## Milestones and tasks

Each milestone has one user-visible outcome, dependencies, non-goals and an integration checkpoint. Tasks should be independently reviewable behavioral changes, not arbitrary line-count/file splits. Separate a shared foundation from consumers; integrate the foundation before branching dependent work.

For each task, record in `TASKS.md` or its linked milestone plan:

- Task ID and linked T-NN/spec, owner role/name, branch, worktree, exact baseline commit.
- Scope and excluded work; allowed files and shared systems requiring a single owner.
- Dependency task IDs, interface/data contracts and observable acceptance criteria.
- Tests/manual checks, performance comparison where relevant, integration order and rollback boundary.

Only the orchestrator updates the ledger. Status transitions: TODO → IN PROGRESS → REVIEW → DONE; use BLOCKED with a named missing dependency/decision. REVIEW returns to IN PROGRESS for required fixes. Dependent work waits for integrated, verified dependencies, not merely a colleague's report that code exists.

## Roles

| Role | Responsibilities |
| --- | --- |
| ORCHESTRATOR | Understand goals and architecture; establish plans/contracts, dependencies and exclusive scopes; assign work and maintain TASKS; preserve architectural consistency. Avoid feature implementation except extremely small tasks. |
| IMPLEMENTATION AGENT | Own one task; read operating/relevant architecture docs and existing code; touch necessary allowed files only; respect shared contracts; run verification and report evidence. Surface scope/architecture changes before proceeding. |
| REVIEW AGENT | Review a fixed baseline-to-result diff read-only, against the original task, acceptance criteria, AGENTS and raw verification. Check correctness, regressions, architecture, complexity, duplication, performance, responsiveness, accessibility, edge cases and scope. |
| INTEGRATION AGENT | Integrate approved work in dependency order, resolve conflicts deliberately, preserve ADRs, run full checks and cross-task runtime checks; update architecture docs when behavior changes. Coordinate ledger updates with orchestrator. |

Reviewer verdicts:

- **PASS:** required criteria/evidence satisfied; ready for integration.
- **PASS WITH CHANGES:** specific corrections required; return to implementation and re-review corrected work before integration.
- **BLOCK:** correctness, architecture, scope, unresolved conflict or missing required evidence prevents acceptance. State the exact blocker and resolution.

Report findings with severity, file/line, impact and smallest corrective action. Optional suggestions may accompany PASS and do not authorize extra work. The reviewer must disclose checks not performed. Review the changed artifact, not the author's persuasive explanation. If no independent reviewer is available, label the fresh read-only review as self-review.

## Worktrees and ownership

Recommended default: one coordinator/integration checkout, up to two implementation worktrees with non-overlapping scopes, and a read-only reviewer. Roles can run sequentially; four permanent agents/worktrees are not required. The reviewer can read a fixed branch/diff without another writable checkout; runtime/build validation should use its own disposable checkout/output if another agent is actively editing.

At bootstrap, existing worktrees were `fernando-portfolio` (`lyra`), `tenebrae-espelho` (`espelho`), `tenebrae-memoria` (`memoria`), `tenebrae-posts` (`posts`), and `tenebrae-telas` (`telas`). These are observations, not ownership assignments. Inspect their state before using them; do not remove/rebase/repurpose them implicitly.

The main checkout contains dirty room/assets work. A new worktree from HEAD excludes those edits. Before assigning dependent work, agree a preserved baseline: owner-authorized focused commit(s), or a documented isolated snapshot/patch including required untracked assets. Record its identity and provenance. Never auto-commit another session's changes or pretend HEAD contains them. Integration must not target a dirty shared checkout by default.

Use task branches such as `agent/task-001-domain-check`; never share a writable worktree. Pick distinct dev-server ports. Do not concurrently rewrite lockfiles, generated output or shared documentation. Commit/merge only within the user's authorized scope. Freeze the result commit for review; changes after review require review of the new diff.

## Parallel boundaries

| Work | Safe separation, given fixed contracts | Serialization / hazards |
| --- | --- | --- |
| Artifact verification | `scripts/verify-site.mjs` vs isolated visual asset research | Coordinate with locale/config changes; one owner for build contract |
| Content and translation | One owner for `modules.ts` + `en.ts` + related mirror tests; room work may proceed if schema stays fixed | Never split content schema, translation or mirror semantics across independent redesigns |
| Standalone texture/art workbench | Separate artwork module/asset directory with agreed dimensions/export and licensing | Scene wiring and shared CREDITS updates have one owner; imagery still needs final-scene review |
| DOM contact/consent | Separate modules if UI strings, event APIs and layering contracts are frozen | Shared strings, body overlays, focus handling and tracking need integration review |
| Scene/room/camera | Independent read-only measurement or asset preparation | `scene.js`, room geometry, poses, lighting and hit tests are behaviorally coupled even across different files |
| Documentation | Analysis can run in parallel | Orchestrator serializes TASKS/PLAN/ADR edits and identifier allocation |

In particular, do not run camera/Trilho redesign, room repositioning and frame/input changes independently. Do not migrate the scene into `src/` while room work depends on its current layout. Shared interface changes must be agreed and recorded before consumers proceed; architectural changes go into DECISIONS with links to prior ADRs.

## Integration and verification

1. Check task scope and user edits; record baseline/result commits and independent review verdict.
2. Integrate only accepted tasks, foundations first, in an integration branch/worktree based on the agreed baseline. Prefer focused commits and ordinary merges/cherry-picks over history rewriting.
3. Resolve conflicts by inspecting both implementations and acceptance criteria, never by accepting all of one side. Semantic conflicts can exist without Git conflict markers.
4. Run `npm run check`, `npx vitest run`, `npm run typecheck`, `npm run build:site`, then `npm run verify:site`. No lint exists; report that limitation.
5. Inspect built runtime where affected: `/`, `/en/`, `?flat`, relevant experimental mode, console/network, contact failure/success using mocks, keyboard/focus, portrait/landscape, overflow and accessibility. Use a real device for orientation/keyboard/touch acceptance when required. Review changed animation/loading/resource lifetime and rendering cost with recorded conditions. Static tests do not render WebGL.
6. Review interactions between tasks: content schema vs rendering, translated strings vs overlays, geometry vs camera/hit tests, resource lifecycle vs fallback. Repeat only affected checks after fixes; do not mark unverified criteria as passed.
7. Update architecture/decisions/glossary if their contracts changed, reconcile linked ticket status, and let the orchestrator mark DONE with evidence. Local integration does not authorize deployment.

## Rollback

Keep changes small enough to revert as a task. Record previous integration SHA, dependency order and any asset/config consequences. Use a targeted revert on a reviewed branch rather than resetting a dirty checkout or force-pushing history. Reverting a foundation may require reverting its consumers; verify the resulting artifact again. Asset/license files must travel together. A production rollback is still production: explicit authorization, the required action log, preserved domain configuration and deployment verification apply. No production action is part of this bootstrap.

## Required handoff

Every agent completing a task supplies this report. Use exact commands/results; include baseline/result commit and branch/worktree under TASK where available. Never hide failures or uncertainty.

```text
TASK:
<ID, scope, branch/worktree, baseline/result>

STATUS:
<TODO / IN PROGRESS / BLOCKED / REVIEW / DONE; reviewer verdict if applicable>

FILES CHANGED:
<paths; distinguish pre-existing edits>

WHAT CHANGED:
<observable changes>

WHY:
<requirement or evidence>

VERIFICATION PERFORMED:
<commands, outcomes, runtime conditions; failed/unavailable checks explicitly>

KNOWN RISKS:
<remaining risks or none identified; uncertainty is not success>

MANUAL VERIFICATION NEEDED:
<device/browser/interaction checks, or none with evidence>

FOLLOW-UP WORK:
<linked tasks, blockers, integration needs; no silent scope expansion>
```
