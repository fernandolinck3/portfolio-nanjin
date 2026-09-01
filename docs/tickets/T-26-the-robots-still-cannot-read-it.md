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
