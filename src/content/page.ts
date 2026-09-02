/**
 * Uma fonte, duas páginas.
 *
 * `prototype/index.html` é escrito uma vez, em português. Este arquivo é o que o
 * transforma na página de um idioma qualquer: troca o `lang`, o título, a descrição,
 * o `canonical` e o bloco Open Graph, costura as duas versões com `hreflang`, e
 * chama o espelho no idioma certo.
 *
 * **Não existe um segundo `index.html` no disco**, e não pode existir. Uma cópia é a
 * segunda fonte que o `CLAUDE.md` inteiro existe para impedir: ela divergiria na
 * primeira mudança, e a divergência apareceria só na língua que ninguém relê.
 *
 * ## A armadilha que quase passou
 *
 * `vite.site.config.ts` usa `base: './'`, e por um bom motivo — é o que faz a mesma
 * saída funcionar tanto na raiz de um domínio quanto num subcaminho tipo
 * `/tenebrae/`. Mas os assets saem como `./assets/index-xxxx.js`, e uma página em
 * `/en/index.html` resolveria isso para `/en/assets/…`, que não existe. A página em
 * inglês carregaria **nada**: sem cena, sem script, um espelho estático e mais nada.
 *
 * `descend()` reescreve `="./` para `="../` nessa página, e só nela. Continua
 * relativo — a propriedade do subcaminho sobrevive — e passa a apontar um nível
 * acima, que é onde os assets de fato estão. Isto vale para **um** nível de
 * profundidade; um dia com `/pt/` e `/en/` irmãos, a conta continua a mesma, mas se
 * alguma língua ganhar duas pastas de profundidade isto tem de crescer junto.
 */

import { mirrorIntoPage } from './mirror'
import { DEFAULT_LOCALE, langFor, other, pathFor, type Locale } from './locale'
import { stringsFor } from './strings'

const SITE = 'https://nanj.in'

const esc = (s: string) => s
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** Troca o valor de um atributo numa tag identificada por um trecho literal. */
function setAttr(html: string, find: string, attr: string, value: string): string {
  const i = html.indexOf(find)
  if (i < 0) throw new Error(`localizePage: não achei ${JSON.stringify(find)} na página`)
  const end = html.indexOf('>', i)
  const tag = html.slice(i, end)
  const re = new RegExp(`(${attr}=")[^"]*(")`)
  if (!re.test(tag)) throw new Error(`localizePage: ${find} não tem ${attr}`)
  return html.slice(0, i) + tag.replace(re, `$1${esc(value)}$2`) + html.slice(end)
}

/** Sobe um nível em toda URL relativa da página. Ver a armadilha no topo. */
const descend = (html: string) => html.replace(/="\.\//g, '="../')

/**
 * As duas versões apontando uma para a outra, mais `x-default`.
 *
 * `x-default` é o português: é a página que existe em `/`, é a que já está indexada,
 * e é a escolha certa para quem chega sem preferência declarada. Um `x-default`
 * apontando para o inglês diria ao Google que a versão canônica mudou, o que não é
 * verdade e não é a decisão de ninguém aqui.
 */
function hreflangHTML(): string {
  return [
    `<link rel="alternate" hreflang="pt-BR" href="${SITE}/">`,
    `<link rel="alternate" hreflang="en" href="${SITE}/en/">`,
    `<link rel="alternate" hreflang="x-default" href="${SITE}/">`,
  ].join('\n')
}

/**
 * A página inteira, no idioma pedido.
 *
 * `draft` põe `noindex` na página. Ele existe porque a máquina das duas páginas fica
 * pronta antes da tradução: uma página em `/en/` servindo texto em português seria,
 * para o Google, conteúdo duplicado — e para um recrutador que clicou "English",
 * uma mentira. Enquanto o conteúdo não estiver traduzido a página existe, é
 * verificável e **não é indexada**. Tirar o `draft` é o commit que declara a
 * tradução pronta, e é de propósito que isso seja um ato explícito.
 */
export function localizePage(html: string, locale: Locale, opts: { draft?: boolean } = {}): string {
  const s = stringsFor(locale)
  const o = other(locale)
  const path = pathFor(locale)

  let out = mirrorIntoPage(html, locale)

  out = setAttr(out, '<html', 'lang', langFor(locale))
  out = setAttr(out, '<meta name="description"', 'content', s.pageDescription)
  out = setAttr(out, '<link rel="canonical"', 'href', SITE + path)
  out = setAttr(out, '<meta property="og:locale"', 'content', langFor(locale).replace('-', '_'))
  out = setAttr(out, '<meta property="og:url"', 'content', SITE + path)
  out = setAttr(out, '<meta property="og:title"', 'content', s.pageTitle)
  out = setAttr(out, '<meta property="og:description"', 'content', s.ogDescription)

  const title = out.match(/<title>[^<]*<\/title>/)
  if (!title) throw new Error('localizePage: a página não tem <title>')
  out = out.replace(title[0], `<title>${esc(s.pageTitle)}</title>`)

  out = out.replace('<link rel="canonical"', hreflangHTML() + '\n<link rel="canonical"')

  if (opts.draft) {
    out = out.replace('<link rel="canonical"',
      '<meta name="robots" content="noindex,follow">\n<link rel="canonical"')
  }

  /* a página raiz fica onde os assets estão; qualquer outra está um nível abaixo */
  return locale === DEFAULT_LOCALE ? out : descend(out)
}

/** Onde cada página é escrita, relativo à raiz do build. */
export const fileFor = (locale: Locale): string =>
  locale === DEFAULT_LOCALE ? 'index.html' : `${o_dir(locale)}/index.html`

const o_dir = (locale: Locale) => pathFor(locale).replace(/^\/|\/$/g, '')

/** Só para o `hreflang` recíproco não precisar ser digitado duas vezes. */
export const alternateOf = other
