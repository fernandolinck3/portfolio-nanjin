import { defineConfig, type Plugin } from 'vite'
import { localizePage } from './src/content/page'
import { DEFAULT_LOCALE, LOCALES } from './src/content/locale'

/**
 * The shipping build — and, since 2026-08-28, the dev server as well.
 *
 * `npm run prototype` used to be a bare `vite prototype`, with no config at all,
 * which meant Vite took `publicDir` to be `prototype/public`. That directory does
 * not exist. **Nothing under `public/` had ever resolved in dev** — the Work stills
 * on the Screen 404ed to the SPA fallback and came back as `index.html` wearing an
 * `.png` name, and it went unnoticed because the built site, which has the override
 * below, was fine. Exactly the trap this file was written to close, running the
 * other way round. One config for both now, so dev and the build cannot disagree.
 *
 * `vite.config.ts` builds the root `index.html`, which mounts `src/App.tsx` — a
 * component that is eleven lines long and renders an empty `<main>`. So the
 * production build has been an empty page for the life of this project while the
 * actual Unit lived in `prototype/` and was only ever served by `npm run dev`.
 *
 * This points the build at the thing that exists. Two details it needs:
 *
 * - **`publicDir` is the repo's**, not the root's. Vite would look for
 *   `prototype/public`; the Works live in `public/works/` at the top and are
 *   referenced from `modules.ts` as `/works/…`, so they have to be copied from
 *   there or every image 404s in the build and only in the build.
 * - **`base: './'`** so the output works from a subdirectory as well as a domain
 *   root — the difference between deploying anywhere and deploying to one place.
 *
 * The workbench dials are still in the built DOM; `prototype/index.html` hides
 * them unless the URL asks, and since `T-26` with `hidden` + `aria-hidden` so a
 * consumer that reads the markup does not take `BEVEL 10` for page content. They
 * cannot simply be deleted — `scene.js` binds to each one by id and would throw on
 * the first missing element.
 */

/**
 * Write the mirror into the page at build time — `T-26`.
 *
 * `T-18` shipped the mirror and it works for a screen reader, for find-in-page and
 * for Google, because all three run JavaScript. An **applicant tracking system does
 * not**, and it is attached to the audience `PRODUCT.md` lists first. Measured on
 * the built page before this plugin existed: 469 characters, all of it control
 * labels and dial readouts, no `<h1>` and not one word of a Module.
 *
 * `mirrorIntoPage` is the *same* renderer `prototype/mirror.js` uses, called here
 * in node instead of in a browser. `createMirror` then finds the `<main>` already
 * in the document and adopts it, so navigation still moves it — nothing is frozen
 * and nothing is drawn twice.
 *
 * `order: 'pre'` so the source arrives verbatim, before Vite has injected the module
 * script or rewritten a single asset URL, which is what makes the two anchors
 * (`</style>`, end of file) predictable.
 *
 * The guard on the path matters: `prototype/` also holds `deck-fit/index.html` and
 * `style-test/`, which the dev server serves and which have no reason to carry a
 * portfolio.
 */
/**
 * Uma fonte, duas páginas — ver `src/content/page.ts`.
 *
 * O `transformIndexHtml` continua fazendo a página **padrão**, porque é ela que o
 * Vite conhece e cujos assets ele injeta. As outras línguas são emitidas em
 * `generateBundle`, a partir do HTML já processado: nesse ponto o script do módulo
 * e as URLs de asset já estão dentro, que é exatamente o que uma segunda página
 * precisa e o que uma cópia da fonte não teria.
 *
 * `draft` marca as línguas ainda não traduzidas com `noindex`. A lista está aqui e
 * não em `page.ts` porque é estado do projeto e não da função: quando o inglês
 * estiver traduzido, isto vira um array vazio e some.
 */
const DRAFT: readonly string[] = ['en']

function localizedPages(): Plugin {
  return {
    name: 'tenebrae:localized-pages',
    /**
     * Tudo acontece em `generateBundle`, e não em `transformIndexHtml`, de propósito.
     *
     * A primeira tentativa injetava o espelho em `transformIndexHtml` e depois
     * *removia* o espelho português por regex para reescrevê-lo em inglês. Isso é
     * um analisador de HTML escrito com expressão regular, que é a categoria de
     * código que funciona até o dia em que não funciona — e falharia calado, com
     * uma página servindo dois espelhos ou nenhum.
     *
     * Aqui a página já saiu do Vite com o script do módulo e as URLs de asset
     * dentro, e nenhuma língua foi escrita ainda. Cada idioma parte do **mesmo**
     * HTML limpo. Nada é desfeito porque nada foi feito duas vezes.
     */
    /* `order: 'post'` não é detalhe: o `index.html` é emitido pelo próprio plugin de
       HTML do Vite dentro de `generateBundle`, então um hook sem ordem roda antes de
       a página existir e não acha nada. */
    generateBundle: { order: 'post', handler(_options, bundle) {
      const main = bundle['index.html']
      if (!main || main.type !== 'asset') {
        throw new Error('localizedPages: index.html não saiu do build — saiu ' + Object.keys(bundle).filter(k => k.endsWith('.html')).join(', '))
      }
      const bare = String(main.source)

      for (const locale of LOCALES) {
        const html = localizePage(bare, locale, { draft: DRAFT.includes(locale) })
        if (locale === DEFAULT_LOCALE) { main.source = html; continue }
        this.emitFile({ type: 'asset', fileName: `${locale}/index.html`, source: html })
      }
    } },
  }
}

export default defineConfig({
  plugins: [localizedPages()],
  root: 'prototype',
  publicDir: '../public',
  base: './',
  build: {
    outDir: '../dist-site',
    emptyOutDir: true,
    /* the Plate's textures are built at runtime from canvas, so the only heavy
       asset here is three itself — no point splitting it out of a single-page
       object that needs all of it before it can draw anything */
    chunkSizeWarningLimit: 900,
  },
})
