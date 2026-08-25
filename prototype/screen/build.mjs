/* Bundles the Screen workbench into one self-contained Screens.html at the repo
   root — no dev server, no module loading, nothing to keep alive. Open the file.
   `npm run screens` builds it and opens it. */
import { build } from 'esbuild'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '../..')

const out = await build({
  entryPoints: [resolve(here, 'screen.js')],
  bundle: true, format: 'iife', write: false, loader: { '.ts': 'ts' },
})

const html = readFileSync(resolve(here, 'index.html'), 'utf8').replace(
  '<script type="module" src="./screen.js"></script>',
  '<script>\n' + out.outputFiles[0].text + '\n</script>',
)
writeFileSync(resolve(root, 'Screens.html'), html)
console.log('Screens.html — ' + (html.length / 1024).toFixed(0) + ' kB')
