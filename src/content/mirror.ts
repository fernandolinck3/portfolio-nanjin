/**
 * O espelho — a Tela dita em marcação.
 *
 * `ADR-0002` diz que o DOM é a verdade e a Tela é uma renderização dele. Durante
 * toda a vida deste projeto isso valeu para os *controles* e para nada mais: um
 * leitor de tela encontrava seis botões com nome de Módulo e depois silêncio. O
 * conteúdo — quem é Fernando, quais são os projetos, o que diz um case — existia
 * somente como pixels numa textura de 320x180.
 *
 * Este arquivo é a outra metade. Ele monta, **a partir de `modules.ts` e de mais
 * nada**, a mesma coisa que a Tela desenha: títulos, aberturas, listas, cases,
 * lacunas declaradas. A Tela continua soberana para o olho; isto é o mesmo estado
 * dito uma segunda vez, para tudo que não é um olho.
 *
 * ## Por que ele devolve uma string
 *
 * Porque assim o teste de deriva roda em `node`, sem jsdom, no mesmo arquivo que já
 * guarda as afirmações sobre o conteúdo — e um teste barato é um teste que continua
 * sendo rodado. A camada que precisa de um navegador (o nó, o `sync`, a região viva)
 * é `prototype/mirror.js` e não sabe nada sobre o texto.
 *
 * ## A regra que impede a deriva
 *
 * **Não há um segundo conteúdo aqui.** Toda string pública abaixo vem de `MODULES`,
 * `WORKS` ou `ECLIPSE`. O que este arquivo escreve por conta própria são rótulos de
 * operação — "Voltar", "de", "Estado" — que descrevem o instrumento, não o portfólio.
 * Acrescentar um Módulo, um item ou uma seção em `modules.ts` faz os dois
 * aparecerem sem que ninguém precise lembrar de nada. É a única camada que de fato
 * previne a deriva; o teste em `modules.test.ts` só pega o que escapar dela.
 */
import { ECLIPSE, GAP, MODULES, WORKS, type Item, type Module } from './modules'

/** Texto vira texto, nunca marcação — o conteúdo tem `&`, `<` e aspas. */
const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/**
 * Os ganchos que a camada de DOM procura.
 *
 * Um lugar só para os dois lados: quem escreve a marcação e quem a atualiza. Um
 * seletor digitado à mão nos dois arquivos é a mesma deriva de sempre, em miniatura.
 */
export const HOOK = {
  /** A `<section>` de um Módulo, pelo índice 0-based. */
  module: 'data-mirror-module',
  /** O botão de um item, como `"<módulo>.<item>"`. */
  item: 'data-mirror-item',
  /** O bloco de seções de um item, como `"<módulo>.<item>"`. */
  case: 'data-mirror-case',
  /** A região viva. Só o anúncio mora aqui — nunca o conteúdo. */
  live: 'data-mirror-live',
  status: 'data-mirror-status',
  lyra: 'data-mirror-lyra',
  light: 'data-mirror-light',
  position: 'data-mirror-position',
  back: 'data-mirror-back',
  reopen: 'data-mirror-reopen',
  claim: 'data-mirror-claim',
  eclipse: 'data-mirror-eclipse',
} as const

/** `"1.0"` — o endereço de um item, e a única forma dele nos dois arquivos. */
export const itemKey = (m: number, i: number) => `${m}.${i}`

const para = (lines: readonly string[]) => `<p>${esc(lines.join(' '))}</p>`

/**
 * As seções de um item, como títulos e parágrafos.
 *
 * `lines` vazio é uma lacuna **registrada** (ver `GAP` em `modules.ts`), e ela
 * aparece aqui exatamente como aparece na Tela. Uma lacuna que o espelho silencia
 * vira uma ausência, que é a única coisa que ela não pode ser.
 */
const sectionsOf = (m: number, i: number, item: Item) => `
      <div ${HOOK.case}="${itemKey(m, i)}">
${item.sections.map(s => `        <h4>${esc(s.heading)}</h4>
        ${s.lines.length ? para(s.lines) : `<p>${esc(GAP)}</p>`}`).join('\n')}
      </div>`

/**
 * Um item: um título que também é o controle que o abre.
 *
 * O botão dentro do `<h3>` serve aos dois modos de leitura que um leitor de tela
 * oferece — pular de título em título para varrer, e pular de controle em controle
 * para operar — sem precisar de dois elementos que possam discordar.
 *
 * `tabindex="-1"` em tudo que não é o Módulo vivo: os dezessete itens continuam no
 * documento, encontráveis pela busca da página e alcançáveis pela navegação do
 * leitor de tela, sem virar dezessete paradas de Tab para quem enxerga. A camada de
 * DOM acende o Módulo vivo.
 */
const itemHTML = (mod: Module, m: number, item: Item, i: number) => {
  const work = mod.id === 'projects' ? WORKS.find(w => w.id === item.id) : undefined
  return `
    <li>
      <h3><button type="button" ${HOOK.item}="${itemKey(m, i)}" tabindex="-1">${esc(item.label)}</button></h3>
${item.meta ? `      <p>${esc(item.meta)}</p>` : ''}
${work ? `      <p>${esc([work.kind, work.client, work.year].filter(Boolean).join(' · '))}</p>
${para(work.blurb)}` : ''}
${sectionsOf(m, i, item)}
    </li>`
}

/** Um Módulo inteiro. Os seis estão sempre no documento; só um está vivo. */
const moduleHTML = (mod: Module, m: number) => `
  <section ${HOOK.module}="${m}" aria-labelledby="mirror-m${m}">
    <h2 id="mirror-m${m}">${esc(mod.title)}</h2>
${mod.name ? `    <p>${esc(mod.name)}</p>` : ''}
${mod.role ? `    <p>${esc(mod.role)}</p>` : ''}
${mod.disciplines?.length ? `    <ul>${mod.disciplines.map(d => `<li>${esc(d)}</li>`).join('')}</ul>` : ''}
${mod.lead?.length ? mod.lead.map(l => `    <p>${esc(l)}</p>`).join('\n') : ''}
${mod.items?.length ? `    <ul>${mod.items.map((it, i) => itemHTML(mod, m, it, i)).join('')}
    </ul>` : ''}
${mod.dim?.length ? `    <p>${esc(mod.dim.join(' '))}</p>` : ''}
  </section>`

/**
 * A sétima tela, e a única coisa neste arquivo que começa escondida de verdade.
 *
 * ECLIPSE não é um Módulo (`ADR-0001`) e a regra "todo texto no documento o tempo
 * todo" não o alcança: ele é o prêmio por ter atravessado o objeto, e um prêmio que
 * a busca da página entrega antes da primeira tecla não é um prêmio. Então este
 * bloco — e só ele — usa `hidden`, que é exatamente a propriedade que o tira da
 * busca. A camada de DOM o revela quando o instrumento o revela.
 *
 * **O link do Instagram não mora aqui.** Ele é o controle que a Tela pinta e que
 * ninguém sem um ponteiro alcançava — `T-15` — e deixá-lo no fim desta seção, que é
 * o fim do documento, obrigaria quem abriu o eclipse a passar por dezessete itens de
 * Tab para chegar ao prêmio. Prosa fica aqui; o controle fica com os outros
 * controles, logo no alto. Ver `stateHTML`.
 */
const eclipseHTML = () => `
  <section ${HOOK.eclipse} hidden aria-labelledby="mirror-eclipse">
    <h2 id="mirror-eclipse">${esc(ECLIPSE.moon.tag)} · ${esc(ECLIPSE.sun.tag)}</h2>
    <p>${esc(ECLIPSE.found)}</p>
    ${para(ECLIPSE.moon.lines)}
    ${para(ECLIPSE.sun.lines)}
    ${para(ECLIPSE.note)}
  </section>`

/**
 * O cabeçalho: quem, e como se opera isto.
 *
 * O nome e o posicionamento saem do Módulo de identidade — não são uma segunda
 * cópia, são o mesmo campo lido de novo. A frase de operação é a única prosa
 * autoral do arquivo, e fala do instrumento, nunca do portfólio: sem ela um leitor
 * de tela encontra um punhado de botões chamados "Roda da Lua" e nenhuma pista de
 * que eles percorrem a lista logo abaixo.
 */
const headHTML = () => {
  const id = MODULES.find(m => m.layout === 'identity')
  return `
  <h1>${esc(id?.name || '')}</h1>
${id?.role ? `  <p>${esc(id.role)}</p>` : ''}
  <p>Portfólio apresentado como um instrumento. As seis teclas acima escolhem o
  módulo, a LUA percorre a lista e o SOL abre o que estiver selecionado. Tudo que a
  tela do instrumento mostra está escrito abaixo, e os seis módulos estão sempre
  aqui — inclusive os que não estão acesos.</p>`
}

/**
 * O painel de estado, e os dois controles que só existem em certos momentos.
 *
 * A região viva vem primeiro e **está vazia**: `aria-live` relê o que muda dentro
 * dela, então trocar o conteúdo inteiro de uma região que contém a tela relê a tela
 * a cada detente. Aqui dentro entra só o anúncio; o conteúdo fica de fora, na mesma
 * página, imóvel.
 *
 * Os três controles que só existem em certos momentos moram juntos, e **no alto**.
 * Os dois primeiros a Tela desenha como caixas que o traço testa; o terceiro é o
 * prêmio do eclipse. Um prêmio a dezessete paradas de Tab de distância é um prêmio
 * que ninguém alcança, e alcançá-lo sem um ponteiro é a metade de `T-15` que mais
 * importa — daí ele estar aqui e não no fim da sétima tela.
 */
const stateHTML = () => `
  <p ${HOOK.live} role="status" aria-live="polite" aria-atomic="true"></p>
  <dl>
    <dt>Estado</dt><dd ${HOOK.status}></dd>
    <dt>Posição</dt><dd ${HOOK.position}></dd>
    <dt>Luz</dt><dd ${HOOK.light}></dd>
    <dt>LYRA</dt><dd ${HOOK.lyra}></dd>
  </dl>
  <p>
    <button type="button" ${HOOK.back} hidden>Voltar um nível</button>
    <button type="button" ${HOOK.reopen} hidden>Reabrir o eclipse</button>
    <a ${HOOK.claim} hidden href="${esc(ECLIPSE.claim.url)}" rel="noopener" target="_blank">${esc(ECLIPSE.claim.label)}</a>
  </p>`

/**
 * O espelho inteiro, como o conteúdo de um `<main>`.
 *
 * Devolve marcação e não um nó: quem chama decide onde ela mora, e o teste de
 * deriva pode lê-la sem um navegador.
 */
export function mirrorHTML(): string {
  return [
    headHTML(),
    stateHTML(),
    MODULES.map((m, i) => moduleHTML(m, i)).join('\n'),
    eclipseHTML(),
  ].join('\n')
}
