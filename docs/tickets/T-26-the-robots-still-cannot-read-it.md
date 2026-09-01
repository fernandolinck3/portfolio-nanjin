# T-26 — The mirror reaches people, not the machines that screen him

**Track A · `SPEC.md` §6 · depends on T-18 (merged) · `vite.site.config.ts`, `prototype/mirror.js`**

## Goal

A recruiter's applicant tracking system, pasted a link to `nanj.in`, reads Fernando's name, role and
work — the same as a screen reader already does.

## The measurement

T-18 shipped the accessible mirror and it works. Measured on the live site after deploy:

| Consumer | Runs JS | Sees the content |
|---|---|---|
| screen reader | yes | **yes** |
| find-in-page | yes | **yes** |
| Google | yes | **yes** |
| ATS · LinkedIn unfurl · `curl` | **no** | **no** |

```
$ curl -s https://nanj.in    # text after stripping tags and scripts
465 characters, no <h1>, no Module content
```

The mirror is built at runtime from `modules.ts`, so every word lives in the JS bundle. `SPEC.md` §6
names the consumer explicitly:

> It is also what a recruiter's crawler, find-in-page and **applicant tracking system** see, which is
> the whole reason ADR-0002 exists.

Two of the three now hold. The third does not, and it is the one attached to the audience
`PRODUCT.md` lists first.

## Build

**Pre-render the mirror into `dist-site/index.html` at build time.** `mirror.js` already builds the
markup from `modules.ts`; run the same function in Node during the build and inline the result, so
the static HTML ships the content and the runtime code takes over from there.

This is not a second renderer — it is the *same* renderer, run earlier. If it becomes a second
renderer, the ticket is wrong.

Also: **give the page an `<h1>`.** There is not one anywhere today.

## Done when

- `curl -s https://nanj.in | wc -c` shows the Modules' text.
- The page has exactly one `<h1>` and it is Fernando's name.
- `npx vitest run` still passes and the runtime mirror still updates on navigation — pre-rendering
  must not freeze it.

## Traps

- **The workbench dials ship in the markup.** `BEVEL 10`, `TILE 1.00`, `SEED 25` and the rest are in
  the static HTML today, because `scene.js` binds each by id and throws on the first missing element.
  A non-JS reader currently sees dial readouts *as page content*. Hide them from the document
  (`hidden` + `aria-hidden`, not removal) as part of this, or the pre-render makes the noise worse.
- **The build is not the dev server.** Verify with `npm run build:site` and `curl` against the built
  output, never in `npm run prototype`. Three bugs have shipped through that exact gap.
- Do not add a framework or a static-site generator to do this. ADR-0004 stands.

## Comments

**Built 2026-09-01.** `mirrorIntoPage` in `src/content/mirror.ts` writes the mirror into the page at
build time; `vite.site.config.ts` calls it from a `transformIndexHtml` hook with `order: 'pre'`.
Same renderer, run earlier — `mirrorElementHTML()` is the only place the `<main id="mirror">` wrapper
is written, and `createMirror` adopts the node it finds rather than making a second one.

Measured against `dist-site/index.html`, scripts and styles stripped:

| | before | after |
|---|---|---|
| readable characters (tags stripped) | 469 | 5,675 |
| readable characters (honouring `hidden`) | 398 | 5,132 |
| `<h1>` | 0 | 1 — *Fernando Linck* |
| Modules in the static markup | 0 | 6 |
| item rows | 0 | 17 |

The workbench row now carries `hidden` + `aria-hidden`; the dials stay in the DOM, `?debug` still
opens them and lifts `aria-hidden` with them. `npx vitest run` is 102 tests, up from 93: nine new
ones covering the pre-render, the single heading, the hidden workbench, and — the ticket's "must not
freeze it" — that `createMirror` adopts a pre-rendered mirror and still moves `aria-current` and the
Tab stops on navigation. `npm run verify:site` asserts the same properties against the real build,
by structure and volume rather than by prose, since a sentence copied out of `modules.ts` would be
the second copy the mirror exists to prevent.
