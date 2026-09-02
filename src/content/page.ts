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
 * ## A armadilha, e por que a primeira correção não bastou
 *
 * `vite.site.config.ts` usa `base: './'`, e por um bom motivo — é o que faz a mesma
 * saída funcionar tanto na raiz de um domínio quanto num subcaminho tipo
 * `/tenebrae/`. Mas os assets saem como `./assets/index-xxxx.js`, e uma página em
 * `/en/index.html` resolveria isso para `/en/assets/…`, que não existe.
 *
 * A primeira correção reescreveu `="./` para `="../` no HTML dessa página. Consertou
 * o script e **não consertou o objeto**: `scene.js` faz `fetch('ornament/plate.png')`
 * e `deck-faces.js` monta `./decks/<face>.png` em JavaScript, onde nenhuma reescrita
 * de marcação chega. A página carregava, desenhava, e vinha sem a gravura da Plate e
 * sem as faces dos Decks — *"the texturas arent loading"*.
 *
 * Reescrever marcação só alcança marcação. `<base href="../">` alcança tudo: o
 * script, o `fetch`, a `<img>` que alguém criar amanhã. É o mecanismo que existe
 * exatamente para isto, e por isso a reescrita saiu — as duas juntas se cancelariam,
 * com `../assets/` resolvido contra `../` virando `/../assets/`.
 *
 * Ele entra logo depois do `<meta charset>`, que é a primeira coisa do arquivo. A
 * posição é obrigatória e não estética: uma URL é resolvida quando o parser a
 * encontra, então um `<base>` depois do script não alcança o script.
 *
 * Uma âncora interna (`href="#…"`) passaria a apontar para a outra página. Não há
 * nenhuma no documento, e `verify:site` falha se aparecer.
 */

import { mirrorIntoPage } from './mirror'
import { DEFAULT_LOCALE, langFor, other, pathFor, type Locale } from './locale'
import { stringsFor, type Strings } from './strings'

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

/** A raiz do site, vista de uma página um nível abaixo. Ver a armadilha no topo. */
const BASE_TAG = '<base href="../">'

function rootBase(html: string): string {
  const at = html.indexOf('<meta charset')
  if (at < 0) throw new Error('localizePage: sem <meta charset> para ancorar o <base>')
  const end = html.indexOf('>', at) + 1
  return html.slice(0, end) + '\n' + BASE_TAG + html.slice(end)
}

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
 * As strings que estão escritas à mão no `index.html`, e não montadas por script.
 *
 * A fileira de toque e o aviso de virar o aparelho são marcação estática: existem
 * antes de qualquer script rodar, que é metade do motivo de existirem. Os cinco
 * arquivos que montam DOM em JavaScript (`consent`, `contact`, `flat`, `focus` e o
 * espelho) leem `UI` e se traduzem sozinhos, porque `LOCALE` sai do `<html lang>`
 * que esta função acabou de escrever. Estes não podem.
 *
 * A troca é literal: pega o que a chave diz em português, exige que esteja na
 * página, e põe o que ela diz na outra língua. **Exige** é a parte que importa —
 * se alguém editar o texto no `index.html` sem editar `strings.ts`, o build quebra
 * aqui em vez de publicar uma página em inglês com quatro botões em português.
 */
const CHROME: readonly (keyof Strings)[] = [
  'touchPrev', 'touchNext', 'touchOpen', 'touchBack',
  'touchPrevLabel', 'touchNextLabel', 'touchOpenLabel', 'touchBackLabel',
  'touchRowLabel', 'turnPhone',
]

function swapChrome(html: string, locale: Locale): string {
  const from = stringsFor(DEFAULT_LOCALE)
  const to = stringsFor(locale)
  let out = html
  for (const key of CHROME) {
    const pt = String(from[key])
    const en = String(to[key])

    /* Casar o elemento ou o atributo inteiro, nunca a substring solta.
       A primeira versão fazia `split(pt).join(en)` na página toda, e "ABRIR" —
       o rótulo de uma das quatro teclas de toque — trocou também **dentro** de
       "ABRIR O INSTAGRAM · @NAN._.JIN", o prêmio do eclipse, que virou "OPEN O
       INSTAGRAM". Um rótulo curto é substring de alguma frase mais longa; é só
       questão de qual. */
    const attr = `aria-label="${pt}"`
    const text = `>${pt}<`
    if (out.includes(attr)) { out = out.split(attr).join(`aria-label="${en}"`); continue }
    if (out.includes(text)) { out = out.split(text).join(`>${en}<`); continue }

    /* O aviso de virar o aparelho é texto solto entre um `<svg>` e o fim do `<p>`,
       então não casa nenhuma das duas formas. É longo o bastante para não ser
       substring de nada, e a checagem abaixo prova que ele existe. */
    if (out.includes(pt)) { out = out.split(pt).join(en); continue }

    throw new Error(
      `localizePage: "${pt}" (${key}) não está no index.html. ` +
      'A marcação e strings.ts divergiram — conserte os dois, não remova a checagem.',
    )
  }
  return out
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

  let out = swapChrome(mirrorIntoPage(html, locale), locale)

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

  /* a página raiz já está onde tudo está; qualquer outra precisa dizer onde é a raiz */
  return locale === DEFAULT_LOCALE ? out : rootBase(out)
}

/** Onde cada página é escrita, relativo à raiz do build. */
export const fileFor = (locale: Locale): string =>
  locale === DEFAULT_LOCALE ? 'index.html' : `${o_dir(locale)}/index.html`

const o_dir = (locale: Locale) => pathFor(locale).replace(/^\/|\/$/g, '')

/** Só para o `hreflang` recíproco não precisar ser digitado duas vezes. */
export const alternateOf = other
