/**
 * The built page must actually load its script.
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
 * `T-26` added the second half. The mirror is written into the page at build time
 * (`mirrorIntoPage`, wired up in `vite.site.config.ts`) so that a consumer which
 * runs no JavaScript — an applicant tracking system, a link unfurler, `curl` — reads
 * the portfolio rather than 469 characters of workbench dials. That is a
 * **build-only** property by construction: the source page has no mirror in it, and
 * `npx vitest run` proves the transform, not that Vite still calls it. This file is
 * where the two meet.
 *
 * Everything below is asserted as structure and volume, never as prose. A sentence
 * from `modules.ts` copied into this file would be exactly the second copy of the
 * content that the whole mirror is shaped to prevent.
 */
import { readFileSync } from 'node:fs'

const html = readFileSync('dist-site/index.html', 'utf8')
const live = html.replace(/<!--[\s\S]*?-->/g, '')
const fail = m => { console.error('verify:site — ' + m); process.exit(1) }

if (!/<script\b[^>]*type="module"[^>]*>/.test(live))
  fail('no module script outside comments: the built page would load nothing')

const at = html.indexOf('<meta charset=')
if (at < 0 || at > 1024)
  fail(`charset is at byte ${at}, past the 1024 the parser reads before guessing`)

/* the mirror, in the static markup, without anything having executed */
const text = live
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()

const modules = [...html.matchAll(/data-mirror-module="(\d+)"/g)].map(m => m[1])
if (modules.length !== 6)
  fail(`${modules.length} Modules in the static markup, expected 6: the mirror was not pre-rendered`)

const rows = (html.match(/data-mirror-item="/g) || []).length
if (rows < 15) fail(`only ${rows} item rows in the static markup — the mirror is there but thin`)

/* 469 was the whole of the readable page before T-26. The floor is deliberately far
   above it and far below what six Modules actually produce (~5,600). */
if (text.length < 3000)
  fail(`${text.length} readable characters — a machine that runs no JavaScript sees almost nothing`)

const h1 = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)]
if (h1.length !== 1) fail(`${h1.length} <h1> in the built page, expected exactly 1`)
if (!/Fernando Linck/.test(h1[0][1])) fail(`the page's <h1> reads "${h1[0][1].trim()}", not his name`)

/* The workbench cannot be deleted — `scene.js` binds every dial by id and throws on
   the first missing element — so it has to be hidden from the document instead, or
   the pre-render only makes `BEVEL 10 / TILE 1.00 / SEED 25` louder. */
const hud = html.match(/<div class="hud"[^>]*>/)
if (!hud) fail('no .hud row in the built page — scene.js binds its dials by id')
if (!/\bhidden\b/.test(hud[0]) || !/aria-hidden="true"/.test(hud[0]))
  fail(`the workbench row is not hidden from the document: ${hud[0]}`)

console.log('verify:site — the built page loads its script and declares its charset')
console.log(`verify:site — the mirror is in the static markup: 6 Modules, ${rows} rows, ` +
  `${text.length} readable characters, one <h1>, and the workbench hidden`)
