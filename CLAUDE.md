# Tenebrae — Fernando Linck portfolio

`HANDOFF.md` carries the state of the work and the decisions already settled — read it first.
`docs/log/` is the diary and is optional. This file carries only the traps that have cost time more
than once, because it is loaded automatically and every line in it is a line everyone pays for.

**Write reasoning in the commit message, not in `HANDOFF.md`.** `git log --oneline` is cheap and
nobody loads a commit body into context. `HANDOFF.md` keeps state and decisions; the dated narrative
goes to `docs/log/<year>-<month>.md`.

## Traps

- **`rAF` fires zero times in an automated tab** — it is a hidden tab. The scene freezes after a few
  frames and a blank Screen is not a bug. Drive it with `__unit.step(t)` then `__unit.render()`, and
  read state with `__unit.nav()`.
- **The build is not the dev server.** Three shipped bugs were invisible in `npm run prototype`. Run
  `npm run build:site` and `npm run verify:site` before believing anything.
- **No backtick inside a CSS template literal.** `focus.js` builds its stylesheet inside a template
  string, so a backtick in a CSS comment closes the string. This broke the build three times in one
  session, each time with an error pointing at an unrelated line.
- **Resizing the browser window does not reach the page.** To test a mobile breakpoint, load the site
  in a same-origin `<iframe>` sized 402×874 — that gets a real viewport and real media queries.
- **`public/CNAME` holds the domain.** A deploy that arrives without it clears the custom domain
  silently.
- **Measure before optimising**, and **build and show** rather than describe. Every decision that
  stuck was settled by a render or a number, never by a paragraph.

## The mirror — read this before changing anything the Screen shows

Everything the Screen displays also exists in the DOM, as semantic HTML, kept in step
with the canvas. That is **the mirror** (`CONTEXT.md` carries the word).

**Anything that changes what the Screen displays changes the mirror in the same
commit.** The way to obey that without remembering it is the way it is already built:
the content lives in `src/content/modules.ts` and *both* read it — the Screen through
`prototype/screen/render.js`, the mirror through `src/content/mirror.ts`. Add a
Module, an item or a case section there and it appears in both without anyone doing
anything. Write content anywhere else and you have made a second copy.

Two consequences worth knowing before you edit:

- `src/content/modules.test.ts` fails if the mirror stops covering a field. It is not
  a style test — a rule with no test is a wish.
- Never hide mirror content with `display:none`, `visibility:hidden` or `hidden`. Each
  removes it from find-in-page, which is half of why it exists. ECLIPSE is the single
  deliberate exception, because a secret Ctrl+F hands over is not a secret.

## Agent skills

### Issue tracker

Issues live as markdown files under `docs/tickets/`, with the board at
`docs/tickets/README.md`. See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical roles, unchanged. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` at the root, ADRs in `docs/adr/`.
See `docs/agents/domain.md`.
