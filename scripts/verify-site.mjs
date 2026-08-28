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

console.log('verify:site — the built page loads its script and declares its charset')
