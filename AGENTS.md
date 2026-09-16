# Agent operating manual

Tenebrae is Fernando Linck's portfolio at `nanj.in`: a Three.js instrument with six content Modules, a semantic HTML mirror, and Portuguese/English pages. This is a standalone repository, not an app in `creative-workspace`.

## Start here

1. Read this file and [ARCHITECTURE.md](ARCHITECTURE.md); inspect `git status`, branch and worktree before editing.
2. Read the relevant implementation, tests, ticket/spec and ADR. Use [CONTEXT.md](CONTEXT.md) for domain names and [CLAUDE.md](CLAUDE.md) for known traps. [HANDOFF.md](HANDOFF.md) contains dated, sometimes contradictory history; verify its claims against code.
3. For substantial work, establish the plan using [PLAN.md](PLAN.md) before implementation. Claim an explicit scope in [TASKS.md](TASKS.md). Small, obvious fixes may abbreviate this process.

**Agents must understand the relevant existing implementation before modifying it. Prefer fixing root causes instead of adding patches, arbitrary offsets, duplicated logic, or unnecessary abstractions. Make the smallest robust change that solves the requested problem.**

Current user instructions govern scope. Code/config describe current behavior; approved specs describe intended behavior; neither silently supersedes the other. Flag conflicts. The [room map](docs/planning/room-map-2026-09-08/PLAN.md) is a target, not proof of implemented navigation. Archived design documents are historical references.

## Stack and repository map

- Shipping: vanilla JavaScript ES modules, Three.js, canvas textures, DOM/CSS, Vite. Shared content/build helpers use strict TypeScript.
- React 19 exists in the dormant `src/App.tsx` shell; it does not own the shipping runtime. No runtime state framework or backend is present.
- `prototype/index.html` → `boot.js` → `scene.js` or `flat.js`: production entry and GPU/fallback choice.
- `prototype/scene.js`: composition root, state, input, camera arbitration and render loop; high conflict risk.
- `prototype/screen/render.js`: Screen canvas and navigation state; `screen/*` contains sprites and drawing helpers.
- `prototype/{focus,contact,mirror,flat,consent,language}.js`: DOM experiences and browser integration. `viewport-ui.js` measures notice/touch occupancy and maps visor input; frame CSS consumes those dimensions.
- `prototype/{room-baroque,room-decor,room-mobilia,trilho,post,light}.js`: room, assets, camera travel and lighting/render pipeline.
- `src/content/`: canonical content, translation, UI strings and mirror renderer. `src/build/`: localized HTML and discovery files.
- `public/`: shipped assets, `CNAME`, model credits, camera poses; `prototype/*-fit/` and `style-test/` are workbenches.
- `vite.site.config.ts`, `scripts/verify-site.mjs`, `.github/workflows/pages.yml`: actual build/deployment contract.
- `docs/adr/`, `docs/tickets/`, `docs/specs/`: historical decisions, issue tracker and feature requirements. Root decision/task files link these instead of duplicating their histories.

## Commands and verification

Use the lockfile and `npm ci` for a fresh worktree; CI uses Node 22. Do not upgrade dependencies as incidental cleanup.

| Command | Purpose and limits |
| --- | --- |
| `npm run prototype` | Shipping development server, port 5174 |
| `npm run check` | esbuild syntax/bundle check of boot, scene and Screen workbench; no frame executed |
| `npx vitest run` | Strict automated suite; prefer this for acceptance (`npm test` allows zero tests) |
| `npm run typecheck` | TypeScript `src/` and default Vite config; excludes production JS and `vite.site.config.ts` |
| `npm run build:site` | Production site into ignored `dist-site/` |
| `npm run verify:site` | Run after that build; checks localized generated HTML/discovery files, not runtime |
| `npm run preview:site` | Serve the production artifact for browser verification |

`npm run dev` / `npm run build` target the dormant React shell. They are not substitutes for shipping-site verification. There is no lint command/config; report lint as unavailable, not passed. Do not add a framework just to create a check.

Run relevant tests while developing. Integration of product changes requires all five checks above: check, Vitest, typecheck, build:site, verify:site. Documentation-only changes need link/scope/factual review; rerun product checks if their claims require fresh evidence. Add regression tests where they protect behavior, not to mirror implementation or pad coverage.

For UI/runtime changes, also inspect the built `/` and `/en/` in a browser: console/network failures, keyboard/focus, work open/close, fallback `?flat`, overflow, portrait/landscape, touch and reduced motion. Test changed experimental modes separately (`?trilho`, `?turned`, `?debug`). Use a genuinely resized viewport or same-origin iframe, and a real phone for keyboard/orientation-sensitive behavior. Never claim a browser/device check from a successful build.

Hidden tabs can throttle or stop rAF. Inspect visibility; use `window.__unit.step(t)` / `render()` for deterministic geometry inspection. These hooks are not real-time FPS measurements. Report browser/GPU/device checks as unverified when unavailable.

## Code, content and design rules

- Follow nearby formatting; shipping JS mixes semicolon styles. No bulk formatting or speculative JS-to-TS/React migration.
- Use existing domain vocabulary: Unit, Plate, Screen, Pad, Deck, Vigil, Station, Trilho, Altar. Keep Portuguese identifiers where established; do not rename APIs for language consistency alone.
- Content belongs in `src/content/modules.ts`; English mappings in `en.ts`; UI translations in `strings.ts`. Keep both locales, canvas, mirror and flat view consistent in the same change. Never invent portfolio claims, URLs, metrics or testimonials.
- Navigation must reuse existing actions (`pressPad`, Screen selection/section setters, `screenHitEm`, mirror synchronization). Do not add an independent state store or a second content list.
- No copied English HTML page. Preserve the build's locale generation, early `<base href="../">` on `/en/`, relative asset contract and shared `asset.js` resolver where appropriate.
- The Unit is procedural; modelled scenery is permitted under ADR-0029 and its amendments. Record asset origin/license in `public/mobilia/CREDITS.md`; examine existing credits before reuse.
- Preserve the instrument's visual language and existing canvas/DOM typography. Actual styles live in `prototype/index.html`, `screen/render.js`, DOM modules and `flat-skin.js`, not a unified token package. Do not invent a new design system during an unrelated fix.
- The 3D experience is a viewport composition; the flat view intentionally scrolls. Preserve semantic mirror content and controls. Do not hide the mirror with `display:none`, `visibility:hidden` or `hidden` (the deliberately secret ECLIPSE is the existing exception).
- Portrait coarse-pointer mode rotates `#frame`; use the centralized frame coordinates and hit testing. The Work reader mounts directly inside `#frame`, above sibling scene controls; reserve notice space once. Contact, consent and mirror live outside the rotated frame on `document.body`. Check safe areas, readable targets, focus restoration, keyboard entry and overflow.
- Measure geometry/world bounds before placement changes. Correct underlying scale/coordinates rather than compensating with unexplained offsets. Three.js transforms use `.set()`/`.copy()`, not assignment to read-only transform properties.
- Keep CSS template literals syntactically safe: no unescaped backticks in their comments.

## Performance and protected systems

- Measure before adding lights, shadows, physical material features, post passes or large assets. Record device, viewport, pixel ratio, mode and method with results. [realism-budget.md](docs/realism-budget.md) contains a historical target of under 8 ms at 1512×856; its old timings are not current guarantees. The runtime aims for 60 fps; verify on the relevant device.
- Keep renderer/composer pixel ratios in sync. Remove inactive post passes from the chain; an intensity of zero is not evidence that rendering work disappeared.
- Preserve deferred imports/loading and current quality controls. Inspect draw calls, frame work, allocations, texture/material/geometry disposal and asset bytes on relevant changes. Do not create another animation loop without an explicit lifecycle owner.
- Treat scene startup order, camera ownership, shared Screen state, asset URLs, localized HTML generation, analytics consent, contact delivery and `public/CNAME` as protected contracts. No casual rewrites or removals.
- API error/null/timeout is not success: preserve failure states and report uncertainty. Contact acceptance tests must mock requests; do not send real messages merely to verify code.
- Dependencies require a concrete need, simpler alternatives, bundle/lifecycle impact and lockfile update in the established plan. No unsolicited upgrades.

## Git, worktrees and parallel agents

- Preserve all pre-existing edits and untracked files. Never auto-stash, discard, clean, reset, switch the shared checkout's branch, or stage with `git add .` across unrelated work.
- A new worktree contains committed history only. If a task depends on dirty files, the orchestrator must identify and preserve that exact baseline before branching; do not quietly use stale HEAD or commit another person's work.
- One task/branch/worktree per implementation owner, e.g. `agent/task-001-context-loss`. Check `git worktree list`; existing worktrees are not disposable scratch space.
- One owner at a time for `scene.js`, `screen/render.js`, content+translation contracts, camera poses, dependency/config files, and root coordination docs. Different files can still share a behavioral dependency.
- Agree shared interfaces before parallel work. Complete and integrate foundations before dependent branches start. No independent redesign of the same system.
- Orchestrator owns task assignments/status. Implementers return handoffs; reviewers read a fixed diff read-only; integrator alone merges approved changes. See [PLAN.md](PLAN.md) for roles and gates.
- When commits are authorized, use `[agent:<name>] feat:`, `fix:` or `chore:` with focused staging; explain technical reasoning in commit bodies. Docs/logs/commits are English; product copy is PT-BR with the existing English locale maintained.
- This repository is public. Do not commit private planning about the owner, verbatim conversation quotes, credentials or personal assessments. Record technical facts.
- A push to `lyra` triggers Pages deployment; manual workflow dispatch can deploy too. Neither is implied by local implementation/integration. Production needs explicit authorization and the user's required `agent_logs` record; no Supabase integration is configured here, so resolve logging access before production rather than inventing a log. Do not change `CNAME` or deployment workflows incidentally.

Every completed task uses the handoff template in [PLAN.md](PLAN.md), including failures and checks not performed. Code written is not DONE: acceptance, review and integration evidence are required.
