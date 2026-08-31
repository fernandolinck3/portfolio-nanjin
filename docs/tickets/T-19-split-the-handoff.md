# T-19 — Split the handoff, and move the traps somewhere cheap

**Track A · no dependency · branch `memoria` · docs only, touches no code**

## Goal

Starting a session on this project costs less, and the traps that keep costing time are in the file
that is loaded for free instead of the one that has to be read.

## The measurement

```
HANDOFF.md      78 KB   ~19.700 tokens   read at the start of every session
CONTEXT.md      11 KB    ~2.700
SPEC.md          8 KB    ~2.100
CLAUDE.md      0,6 KB      ~155          loaded automatically, effectively free
```

`HANDOFF.md` grew 18 KB in one session (2026-08-31) and has **six** dated "What changed" sections.
It is three files wearing one name: the current state, the traps, and a diary.

The diary is the part that grows without bound and is the least useful a week later. It is also
about 60% of the file.

## Build

**1. `HANDOFF.md` keeps only what a new session needs to act.** Read this first, the goal, the state
of the object, *Open*, *Blocked on Fernando*, *Cautions*, and what you can verify with. Target: under
25 KB. It should be possible to read it and start working without opening anything else.

**2. The dated sections move to `docs/log/`,** one file per month — `docs/log/2026-08.md` — newest
first inside it, in the order they already have. **Move, do not summarise.** The value of those
sections is the specific wrong diagnosis next to the right one, and a summary destroys exactly that.
`HANDOFF.md` gets one line pointing at the log.

**3. The recurring traps go into `CLAUDE.md`,** which is loaded automatically. Not all of them — the
ones that have cost time more than once, or that will cost time to anyone who touches this repo:

- **`rAF` fires zero times in an automated tab.** Drive with `__unit.step(t)` then `__unit.render()`;
  read state with `__unit.nav()`.
- **The build is not the dev server.** Three shipped bugs were invisible in `npm run prototype`. Run
  `npm run build:site` and `npm run verify:site` before believing anything.
- **No backtick inside a CSS template literal.** `focus.js` builds its stylesheet inside a template
  string; a backtick in a CSS comment closes the string. This broke the build **three times in one
  session**, each time with an error pointing at an unrelated line.
- **Resizing the browser window does not reach the page.** To test a mobile breakpoint, load the site
  in a same-origin `<iframe>` sized 402×874 — that gets a real viewport and real media queries.
- **Measure before optimising**, and **build and show** rather than describe.
- **`public/CNAME` holds the domain.** A deploy without it clears the custom domain silently.

Keep `CLAUDE.md` short. It is loaded every time, so every line in it is a line everyone pays for —
earn each one. Under 3 KB.

**4. Stop the duplication.** Reasoning is currently written twice, in `HANDOFF.md` and in the commit
message. Pick the commit: `git log --oneline` is cheap and nobody loads a commit body into context.
`HANDOFF.md` keeps *state and decisions*, not narrative. Say this in `CLAUDE.md` so the next session
does not restart the habit.

## Done when

- `HANDOFF.md` is under 25 KB and a cold session can act from it alone.
- `docs/log/2026-08.md` holds every dated section, moved verbatim, and `HANDOFF.md` links to it.
- `CLAUDE.md` carries the traps above and stays under 3 KB.
- No fact is lost. `git log -p` on this commit should show text moving, not text disappearing.

## Traps

- **Do not edit anything outside `HANDOFF.md`, `CLAUDE.md`, `CONTEXT.md` and `docs/log/`.** Two other
  branches are live: `espelho` (T-18) and `posts` (T-20). **This branch owns `HANDOFF.md` and
  `CLAUDE.md`** — nobody else may touch them, and you must not touch their files.
- **Losing a caution is the failure mode.** Several were written after a whole session was spent
  rediscovering them. When unsure whether something is still true, move it and mark it, never drop it.
- The *Open* list is the standing brief and is quoted in other tickets. Renumbering it breaks those
  references — keep the numbers.
