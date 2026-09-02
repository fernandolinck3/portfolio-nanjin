/**
 * Os três arquivos que um buscador pede e que ninguém escreve à mão.
 *
 * `robots.txt`, `sitemap.xml` e `llms.txt` são derivados: nascem da lista de locales
 * e do conteúdo, no build, ao lado das páginas. Escrevê-los em `public/` seria
 * digitá-los, e um sitemap digitado mente no dia em que nascer uma terceira página —
 * silenciosamente, e do lado que ninguém relê, porque ninguém abre um sitemap.
 *
 * Os três eram 404 até 2026-09-02.
 */

import { LOCALES, DEFAULT_LOCALE, langFor, pathFor, type Locale } from '../content/locale'
import { SOURCE } from '../content/modules'
import { translate } from '../content/en'

const SITE = 'https://nanj.in'
const url = (locale: Locale) => SITE + pathFor(locale)

/**
 * Nada é proibido, e o sitemap tem endereço.
 *
 * A ausência de `robots.txt` já permite tudo, então este arquivo não existe para
 * liberar — existe porque é o primeiro lugar onde todo crawler procura o sitemap, e
 * porque um 404 aqui é uma requisição perdida em cada visita de robô.
 *
 * **Nada é bloqueado, inclusive os crawlers de IA.** Isso é uma decisão e não um
 * padrão: o objeto existe para ser encontrado por quem contrata, e cada vez mais isso
 * passa por uma resposta gerada em vez de uma lista de links. Bloquear GPTBot ou
 * ClaudeBot aqui trocaria alcance por um princípio que este site não tem motivo para
 * defender — ele não vende conteúdo, ele é um cartão de visita.
 */
export const robotsTxt = () => [
  'User-agent: *',
  'Allow: /',
  '',
  `Sitemap: ${SITE}/sitemap.xml`,
  '',
].join('\n')

/**
 * As duas páginas, cada uma declarando as duas.
 *
 * O `xhtml:link` dentro de cada `<url>` é o que faz o Google entender que estas não
 * são duas páginas concorrentes e sim uma coisa em dois idiomas — a mesma afirmação
 * que o `hreflang` do `<head>` faz, repetida aqui porque um sitemap é lido sem que
 * ninguém baixe o HTML.
 *
 * Sem `<lastmod>` de propósito. Uma data inventada a cada build diria "mudou" toda
 * vez que qualquer coisa é publicada, e um sitemap que grita todo dia é um sitemap
 * que o Google aprende a ignorar.
 */
export const sitemapXml = () => {
  const entries = LOCALES.map(locale => {
    const alts = LOCALES.map(l =>
      `    <xhtml:link rel="alternate" hreflang="${langFor(l)}" href="${url(l)}"/>`)
      .concat(`    <xhtml:link rel="alternate" hreflang="x-default" href="${url(DEFAULT_LOCALE)}"/>`)
      .join('\n')
    return `  <url>\n    <loc>${url(locale)}</loc>\n${alts}\n  </url>`
  }).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries}
</urlset>
`
}

/**
 * O portfólio dito em texto puro, para um motor generativo.
 *
 * `llms.txt` é a convenção emergente para o que um modelo lê quando alguém pergunta
 * "quem é Fernando Linck". A pergunta que ele responde é diferente da do `sitemap`:
 * um crawler quer **onde** as coisas estão, um modelo quer **o que** elas são, numa
 * forma que não custe interpretar.
 *
 * Por que este site precisa dele mais do que a média: tudo aqui é desenhado num
 * canvas. O espelho (T-18, T-26) resolveu o HTML, mas o HTML de um portfólio-objeto
 * ainda é marcação de instrumento — rótulos de controle, estados, uma tela. Isto é a
 * mesma informação sem o instrumento em volta.
 *
 * **É gerado, nunca escrito.** Um resumo digitado à mão seria a segunda cópia do
 * conteúdo que o `CLAUDE.md` inteiro existe para impedir, e envelheceria na primeira
 * vez que ele mudasse um projeto.
 */
export const llmsTxt = (locale: Locale = DEFAULT_LOCALE) => {
  const pick = <T,>(v: T): T => (locale === DEFAULT_LOCALE ? v : translate(v))
  const mods = pick(SOURCE.modules)
  const works = pick(SOURCE.works)
  const ident = mods.find(m => m.id === 'identity')
  const en = locale !== DEFAULT_LOCALE

  const head = [
    `# ${ident?.name ?? ''}`,
    '',
    `> ${ident?.entity?.jobTitle ?? ident?.role ?? ''}. ${ident?.lead?.[0] ?? ''}`,
    '',
    en
      ? 'A portfolio built as a 3D instrument. Everything below is also on the page itself, as real HTML — this file is the same content without the instrument around it.'
      : 'Um portfólio construído como um instrumento em 3D. Tudo abaixo também está na própria página, como HTML de verdade — este arquivo é o mesmo conteúdo sem o instrumento em volta.',
    '',
  ]

  const about = ident?.entity ? [
    `## ${en ? 'About' : 'Sobre'}`,
    '',
    `- ${en ? 'Based in' : 'Fica em'}: ${ident.entity.locality}, ${ident.entity.region}, ${ident.entity.country}`,
    `- ${en ? 'Works with' : 'Trabalha com'}: ${ident.entity.knowsAbout.join(', ')}`,
    ...ident.entity.worksFor.map(w => `- ${w.name} (${w.from}–${w.to})`),
    '',
  ] : []

  const projects = [
    `## ${en ? 'Projects' : 'Projetos'}`,
    '',
    ...works.flatMap(w => [
      `### ${w.title} — ${w.kind}`,
      '',
      w.blurb.join(' '),
      '',
      ...pick(SOURCE.caseOf(w.id)).flatMap(sec =>
        sec.lines.length ? [`**${sec.heading}** ${sec.lines.join(' ')}`, ''] : []),
    ]),
  ]

  /* Os Módulos que não são projeto: trajeto, critérios, habilidades. Cada item com o
     que ele diz, na ordem em que a LUA os percorre. */
  const rest = mods
    .filter(m => m.items?.length && m.id !== 'projects' && m.id !== 'contact')
    .flatMap(m => [
      `## ${m.title}`,
      '',
      ...(m.items ?? []).flatMap(it => [
        `### ${it.label}${it.meta ? ` — ${it.meta}` : ''}`,
        '',
        ...it.sections.flatMap(sec =>
          sec.lines.length ? [`**${sec.heading}** ${sec.lines.join(' ')}`, ''] : []),
      ]),
    ])

  const contact = mods.find(m => m.id === 'contact')
  const routes = (contact?.items ?? []).flatMap(it => {
    if (it.act?.kind === 'mail') return [`- ${en ? 'Email' : 'E-mail'}: ${it.act.value}`]
    if (it.act?.kind === 'url') return [`- ${it.meta ?? it.label}: ${it.act.value}`]
    return []
  })

  return [
    ...head, ...about, ...projects, ...rest,
    `## ${en ? 'Contact' : 'Contato'}`, '', ...routes, '',
  ].join('\n')
}

/** Tudo o que o build escreve além das páginas, como `caminho → conteúdo`. */
export function generatedFiles(): Record<string, string> {
  const out: Record<string, string> = {
    'robots.txt': robotsTxt(),
    'sitemap.xml': sitemapXml(),
  }
  /* Um `llms.txt` por idioma. A raiz leva o padrão, porque é onde um modelo procura. */
  for (const locale of LOCALES) {
    const at = locale === DEFAULT_LOCALE ? 'llms.txt' : `${pathFor(locale).replace(/\//g, '')}/llms.txt`
    out[at] = llmsTxt(locale)
  }
  return out
}
