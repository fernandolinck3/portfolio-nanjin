# Issue tracker: Local Markdown (`docs/tickets/`)

Issues for this repo live as markdown files in `docs/tickets/`. This repo had a
working board before these skills were installed, so the conventions below
describe **what is already there** — they are not a new scheme to migrate to.

## Conventions

- One ticket per file: `docs/tickets/T-NN-<slug>.md`, numbered from `T-01`.
  Numbering is continuous across the whole repo, not per feature. **The next free
  number is T-15.**
- **The board is `docs/tickets/README.md`** — a dependency graph and an ordered
  table. A ticket that is not on the board does not exist. Adding a ticket means
  editing the board in the same commit.
- Each ticket states its own traps, so it can be picked up by an agent with fresh
  context without reading the whole thread.
- Blocking edges live in two places and both must agree: the `Depends on` column
  in the board, and a `Blocked by: T-NN, T-NN` line near the top of the ticket
  file.
- Triage state is a `Status:` line near the top of each ticket file (see
  `triage-labels.md` for the role strings). The board's own `State` column stays
  human-readable ("ready", "blocked on Fernando", "later") and is not the same
  thing.
- Comments and conversation history append to the bottom under `## Comments`.

## Specs

The root `SPEC.md` is the whole-product spec; `docs/tickets/` was split out of
it. Specs for new features go at `docs/specs/<feature-slug>.md`.

## When a skill says "publish to the issue tracker"

Create `docs/tickets/T-NN-<slug>.md` with the next free number, then add its row
and its edges to `docs/tickets/README.md`.

## When a skill says "fetch the relevant ticket"

Read `docs/tickets/T-NN-<slug>.md`. Fernando will normally pass the ticket number
directly.

## Wayfinding operations

Used by `/wayfinder`. An effort gets its own directory so it does not disturb the
flat `T-NN` files.

- **Map**: `docs/tickets/<effort>/map.md` — the Notes / Decisions-so-far / Fog body.
- **Child ticket**: `docs/tickets/<effort>/NN-<slug>.md`, numbered from `01`, with
  the question in the body. A `Type:` line records the ticket type
  (`research`/`prototype`/`grilling`/`task`); a `Status:` line records
  `claimed`/`resolved`.
- **Blocking**: a `Blocked by: NN, NN` line near the top. A ticket is unblocked
  when every file it lists is `resolved`.
- **Frontier**: scan `docs/tickets/<effort>/` for files that are open, unblocked
  and unclaimed; first by number wins.
- **Claim**: set `Status: claimed` and save before any work.
- **Resolve**: append the answer under an `## Answer` heading, set
  `Status: resolved`, then append a context pointer (gist + link) to the map's
  Decisions-so-far in `map.md`.

## PRs as a request surface

Off. This repo has no remote — publishing it is T-14, and still Fernando's call.
