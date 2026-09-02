/**
 * The built pages must actually load their script — and there are two of them now.
 *
 * Vite injects the module tag straight after the first literal occurrence of the
 * root element's tag in the source. When a comment above it contained that tag, the
 * script was injected *inside the comment*: the deployed page loaded nothing, with
 * no console error and no build warning, and the dev server could never show it
 * because nothing is injected there. It reached production once.
 *
 * So the check is the thing that actually matters — strip the comments, and see
 * whether a module script is still there. And the charset has to survive inside the
 * first 1024 bytes, which is the other property a growing comment can quietly break.
 *
 * `T-26` added the second half. The mirror is written into the page at build time so
 * that a consumer which runs no JavaScript — an applicant tracking system, a link
 * unfurler, `curl` — reads the portfolio rather than 469 characters of workbench
 * dials. That is a **build-only** property by construction: the source page has no
 * mirror in it, and `npx vitest run` proves the transform, not that Vite still calls
 * it. This file is where the two meet.
 *
 * `T-31` added the third. One source now produces `/` and `/en/`, and the second
 * page has a failure mode the first cannot have: `base: './'` makes every asset URL
 * relative, so a page one directory down needs `../assets/…` or it loads **nothing**
 * — no scene, no script, a static mirror and a dead object. Nothing in the test
 * suite can see that, because it is a property of where the file was written.
 *
 * Everything below is asserted as structure and volume, never as prose. A sentence
 * from `modules.ts` copied into this file would be exactly the second copy of the
 * content that the whole mirror is shaped to prevent.
 */
import { readFileSync } from 'node:fs'

const fail = m => { console.error('verify:site — ' + m); process.exit(1) }

/** The pages the build is expected to have written, and what makes each one itself. */
const PAGES = [
  { file: 'dist-site/index.html', name: '/', lang: 'pt-BR', canonical: 'https://nanj.in/',
    assets: './assets/', other: '/en/', draft: false },
  { file: 'dist-site/en/index.html', name: '/en/', lang: 'en', canonical: 'https://nanj.in/en/',
    assets: '../assets/', other: '/', draft: true },
]

for (const page of PAGES) {
  let html
  try { html = readFileSync(page.file, 'utf8') }
  catch { fail(`${page.name} was not written — the build produced no ${page.file}`) }
  const live = html.replace(/<!--[\s\S]*?-->/g, '')
  const bad = m => fail(`${page.name}: ${m}`)

  if (!/<script\b[^>]*type="module"[^>]*>/.test(live))
    bad('no module script outside comments — the page would load nothing')

  const at = html.indexOf('<meta charset=')
  if (at < 0 || at > 1024)
    bad(`charset is at byte ${at}, past the 1024 the parser reads before guessing`)

  /* The one failure only the second page can have. A page in a subdirectory that
     keeps `./assets/` looks perfect in the markup and loads nothing at all. */
  const script = live.match(/<script\b[^>]*type="module"[^>]*src="([^"]+)"/)
  if (!script) bad('the module script has no src')
  if (!script[1].startsWith(page.assets))
    bad(`the script is at "${script[1]}" but this page needs "${page.assets}…" — it would 404`)

  const lang = html.match(/<html[^>]*\blang="([^"]*)"/)
  if (!lang || lang[1] !== page.lang) bad(`lang is "${lang?.[1]}", expected "${page.lang}"`)

  const canon = html.match(/<link rel="canonical"[^>]*href="([^"]*)"/)
  if (!canon || canon[1] !== page.canonical)
    bad(`canonical is "${canon?.[1]}", expected "${page.canonical}"`)

  /* Both pages carry the same three alternates. A page that names only itself tells
     Google the other one is unrelated, which is the whole thing hreflang prevents. */
  for (const tag of ['pt-BR', 'en', 'x-default']) {
    if (!html.includes(`hreflang="${tag}"`)) bad(`no hreflang="${tag}" alternate`)
  }

  const noindex = /<meta name="robots"[^>]*content="[^"]*noindex/.test(html)
  if (page.draft && !noindex)
    bad('this page is still a draft and must not be indexed, but carries no noindex')
  if (!page.draft && noindex)
    bad('this page is not a draft and must be indexable, but carries noindex')

  /* the mirror, in the static markup, without anything having executed */
  const text = live
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  const modules = [...html.matchAll(/data-mirror-module="(\d+)"/g)].map(m => m[1])
  if (modules.length !== 6)
    bad(`${modules.length} Modules in the static markup, expected 6 — the mirror was not pre-rendered`)

  const rows = (html.match(/data-mirror-item="/g) || []).length
  if (rows < 15) bad(`only ${rows} item rows in the static markup — the mirror is there but thin`)

  /* 469 was the whole of the readable page before T-26. The floor is deliberately far
     above it and far below what six Modules actually produce (~5,600). */
  if (text.length < 3000)
    bad(`${text.length} readable characters — a machine that runs no JavaScript sees almost nothing`)

  const h1 = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)]
  if (h1.length !== 1) bad(`${h1.length} <h1>, expected exactly 1`)
  if (!/Fernando Linck/.test(h1[0][1])) bad(`the <h1> reads "${h1[0][1].trim()}", not his name`)

  /* The route to the other language has to be a real href, or it reaches neither a
     crawler nor anyone reading the page without running scripts — which is half the
     reason a second page exists at all. */
  const link = html.match(/data-mirror-lang[^>]*href="([^"]*)"/)
  if (!link) bad('no language link in the mirror — the other version is unreachable without JS')
  if (link[1] !== page.other) bad(`the language link points at "${link[1]}", expected "${page.other}"`)

  /* The workbench cannot be deleted — `scene.js` binds every dial by id and throws on
     the first missing element — so it has to be hidden from the document instead, or
     the pre-render only makes `BEVEL 10 / TILE 1.00 / SEED 25` louder. */
  const hud = html.match(/<div class="hud"[^>]*>/)
  if (!hud) bad('no .hud row — scene.js binds its dials by id')
  if (!/\bhidden\b/.test(hud[0]) || !/aria-hidden="true"/.test(hud[0]))
    bad(`the workbench row is not hidden from the document: ${hud[0]}`)

  console.log(`verify:site — ${page.name} lang=${page.lang}, assets ${page.assets}…, ` +
    `6 Modules, ${rows} rows, ${text.length} readable characters, one <h1>` +
    (page.draft ? ', noindex (draft)' : ''))
}

console.log(`verify:site — ${PAGES.length} pages, each reciprocal in hreflang`)
