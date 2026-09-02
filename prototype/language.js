/**
 * A outra língua, oferecida a quem provavelmente a queria.
 *
 * O site tem duas páginas desde o T-31 e, até este arquivo existir, **nenhuma rota
 * visível entre elas**. O link mora no espelho, que é recortado a 1px: um leitor de
 * tela o encontra, o Tab o revela porque o foco o tira do recorte, e um crawler o
 * segue. Quem chega de mouse não tinha nada. Ele perguntou exatamente isso — *"e como
 * o usuário recebe a versão ingles sem colocar o en"* — e a resposta era: não recebe.
 *
 * ## Sugerir, nunca trocar
 *
 * `navigator.languages` é o que a pessoa **declarou** no próprio navegador:
 * preferência dita, não inferida por IP (ADR/T-31 descartam geo por escrito). Mesmo
 * assim isto não redireciona. Um redirect automático quebra o link compartilhado —
 * alguém manda `nanj.in` para um contato e o contato cai noutro lugar — e dá ao
 * crawler duas respostas para uma URL. A página que a pessoa pediu é a página que ela
 * recebe; o que muda é que agora existe uma porta, e ela está sinalizada.
 *
 * ## Por que só aparece às vezes
 *
 * Uma barra que aparece para todo mundo é ruído para os 100% e ajuda os poucos que
 * estavam na língua errada. Esta só nasce quando o navegador **prefere a outra
 * língua** à desta página, e some para sempre quando a pessoa responde qualquer coisa
 * — inclusive indo. Recusar é um clique, e uma recusa é lembrada, como no consentimento.
 *
 * ## Por que depois do consentimento
 *
 * As duas são barras fixas no rodapé. Empilhadas, a primeira decisão que o visitante
 * enfrenta viraria duas, e a do cookie é a que trava o carregamento. `boot.js` passa
 * esta como o `onDecide` daquela, então elas são uma sequência e nunca uma pilha.
 */

import { LOCALE, other } from '../src/content/locale.ts'
import { UI } from '../src/content/strings.ts'

const KEY = 'tenebrae.lang.asked'

/** A barra veste a do consentimento: mesma família, para não parecer outra coisa. */
const CSS = `
  .lg-bar { position:fixed; left:0; right:0; bottom:0; z-index:79;
    display:flex; gap:18px; align-items:center; justify-content:center; flex-wrap:wrap;
    padding:14px 20px calc(14px + env(safe-area-inset-bottom));
    background:rgba(8,7,6,.94); border-top:1px solid #2A241C;
    backdrop-filter:blur(10px) saturate(.8);
    font:400 12px/1.6 "Azeret Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
    color:#8E8676; transform:translateY(100%); transition:transform .3s ease; }
  .lg-bar[data-up="1"] { transform:translateY(0); }
  .lg-bar p { margin:0; }
  .lg-acts { display:flex; gap:10px; flex-shrink:0; }
  .lg-acts a, .lg-acts button {
    background:rgba(20,17,14,.9); border:1px solid #5A4E34; color:#D8CFB4;
    padding:9px 20px; font:inherit; font-size:10px; letter-spacing:.22em; cursor:pointer;
    text-transform:uppercase; text-decoration:none; transition:.16s; }
  .lg-acts a:hover, .lg-acts button:hover,
  .lg-acts a:focus-visible, .lg-acts button:focus-visible {
    background:rgba(34,28,20,.95); border-color:#A8905C; color:#F4ECD4; }
  .lg-acts :focus-visible { outline:2px solid #8A7A54; outline-offset:2px; }
  @media (max-width: 620px) {
    .lg-bar { flex-direction:column; align-items:flex-start; gap:12px; font-size:11px; }
    .lg-acts { width:100%; }
    .lg-acts a, .lg-acts button { flex:1; padding:12px 0; text-align:center; }
  }
  @media (prefers-reduced-motion: reduce) { .lg-bar { transition:none; } }
`

/**
 * O navegador prefere a outra língua a esta?
 *
 * `navigator.languages` vem em ordem de preferência, então a pergunta não é "fala
 * inglês" — é **qual das duas aparece primeiro**. Alguém que lista `pt-BR, en` lê as
 * duas e escolheu português; oferecer inglês a essa pessoa seria ruído.
 */
function prefersTheOther() {
  const list = navigator.languages?.length ? navigator.languages : [navigator.language]
  const o = other(LOCALE)
  for (const tag of list) {
    const base = String(tag).toLowerCase().split('-')[0]
    if (base === LOCALE.toLowerCase().split('-')[0]) return false
    if (base === o.lang.toLowerCase().split('-')[0]) return true
  }
  return false
}

const asked = () => { try { return localStorage.getItem(KEY) === '1' } catch { return false } }
const remember = () => { try { localStorage.setItem(KEY, '1') } catch { /* bloqueado: pergunta de novo */ } }

/** @returns {boolean} se a barra chegou a existir. */
export function offerLanguage() {
  if (asked() || !prefersTheOther()) return false

  const o = other(LOCALE)

  const style = document.createElement('style')
  style.textContent = CSS
  document.head.appendChild(style)

  const bar = document.createElement('aside')
  bar.className = 'lg-bar'
  bar.setAttribute('aria-label', UI.languageLabel)
  /* A frase e o "ficar" na língua da página; o nome da língua oferecida nela mesma,
     e marcado com `lang` para que um leitor de tela o pronuncie como o que é. */
  bar.innerHTML = `
    <p>${UI.languageOffer}</p>
    <div class="lg-acts">
      <a href="${o.path}" hreflang="${o.lang}" lang="${o.lang}">${o.name}</a>
      <button type="button" data-stay>${UI.languageStay}</button>
    </div>`

  /* Mora no body e não no #frame: um telefone em pé aplica rotate(90deg) ali, e um
     elemento transformado é o bloco de contenção de tudo que está dentro. O espelho,
     o formulário e a barra de cookie chegaram aqui antes, pelo mesmo motivo. */
  document.body.appendChild(bar)

  const close = () => { remember(); bar.remove() }
  bar.querySelector('[data-stay]').addEventListener('click', close)
  /* ir também é uma resposta: quem clicou não precisa ser perguntado de novo */
  bar.querySelector('a').addEventListener('click', remember)

  /* forçar reflow em vez de rAF: rAF não dispara em aba oculta, e a barra ficaria
     transparente e permanentemente fora da tela — a mesma armadilha que o painel de
     contato encontrou. */
  void bar.offsetHeight
  bar.dataset.up = '1'
  return true
}
