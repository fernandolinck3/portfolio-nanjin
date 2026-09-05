/**
 * A Lyra do retrato — e ela e **a mesma Lyra do modulo PROJETOS**.
 *
 * Este arquivo errou o personagem tres vezes, e a causa foi sempre a mesma: deduzir do
 * codigo em vez de olhar o desenho.
 *
 * 1. **Um rosto inventado aqui.** Tenebrista, procedural, meu. Passou por ovo branco,
 *    nevoa e desenho de arame, e o problema nunca foi calibragem — era que havia duas
 *    Lyras. Um personagem desenhado duas vezes e a armadilha do `CLAUDE.md` em outra
 *    forma: duas listas divergem, uma nao pode.
 * 2. **`drawWizard`.** Escolhida porque e a unica figura *procedural* em
 *    `screen/figure.js`, o que nao a torna a do mostrador — e o ramo de fallback. Alem
 *    de errada, desenha pixel a pixel com custo quadratico na escala e travou o
 *    renderer ao ser pedida grande.
 * 3. **`BUST`, de `screen/drawn.js`.** Mais perto: e desenhada a mao e e um busto de
 *    verdade. Ainda errada — e o ramo `figure === 'drawn'`, que a bancada usa para
 *    comparar as duas versoes.
 *
 * O que a Unidade **ships** e `figure = 'reaction'`, e o que ela desenha e
 * `REACTION_FRAMES`: dez quadros de 28x40 gerados de `reaction.png`, ela reagindo a um
 * Deck ser girado — ergue as sobrancelhas, sorri, inclina a cabeca, pisca uma vez e
 * assenta. E a que aparece no quadrinho ao lado da lista em PROJETOS.
 *
 * O jeito de fechar isso foi ler `render.js` na linha que desenha, e nao inferir do
 * arquivo que exporta.
 *
 * ## O olhar mudou de motor, e o motivo e a arte
 *
 * Nas duas versoes anteriores o olhar era um deslocamento: a iris num plano proprio, e
 * depois o bloco do olho no sprite. Nenhum dos dois serve aqui, e nao por preguica —
 * `REACTION_FRAMES` e uma **pintura em baixa resolucao**, dithered, sem celulas de olho
 * isolaveis. Renderizada a 14x com regua, o rosto e uma massa palida com marcas
 * sutis: nao existe o par de quadrados escuros que o `BUST` tem.
 *
 * Mas o proprio nome dela diz o que fazer. Ela e uma **reacao** — a maquina de estado
 * em `screen/reaction.js` toca os quadros 1..9 quando um Deck gira e volta ao 0. No
 * retrato, quem gira e o **ponteiro**: mexer o mouse na frente dela a faz reagir. O
 * visitante continua sendo notado, que era o que a interacao valia; o que muda e que
 * ela responde com a animacao que ela tem, em vez de com um olho que ela nao tem.
 */

import { REACTION_FRAMES, REACTION_W, REACTION_H } from './screen/reaction-frames.js'
import { drawSprite } from './screen/drawn.js'
import { createKnobReaction } from './screen/reaction.js'

/* As duas paletas de `screen/render.js`, repetidas de proposito e nao importadas: la
   elas vivem em `let` de modulo que ele reescreve a cada quadro conforme o fader, e
   importar aquilo amarraria o rosto dela ao relogio de um outro mostrador. O que se
   compartilha e a decisao de cor, nao a variavel. */
const DIA   = { ink: '#E9E3D2', mid: '#8A8470', dim: '#5E5A4C', bg: '#0A0B09' }
const NOITE = { ink: '#DCD6C6', mid: '#9C5A4E', dim: '#6E1810', bg: '#08070A' }

/* Cor mistura em numeros e pinta em texto. A primeira versao guardava `rgb(...)` ja
   formatado e remisturava sobre ele: `hex()` lia `parseInt('gb', 16)` no meio da
   string e a cena morria num `addColorStop` com `rgb(NaN,NaN,2)`. */
const hex = c => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]
const mix = (A, B, k) => A.map((v, i) => v + (B[i] - v) * k)
const cor = T => `rgb(${T[0] | 0},${T[1] | 0},${T[2] | 0})`

export function criarLyra({ w = 120, h = 162 } = {}) {
  const c = document.createElement('canvas')
  c.width = w; c.height = h
  const g = c.getContext('2d')
  g.imageSmoothingEnabled = false

  /* Uma instancia propria, e nao a do mostrador: os dois reagem a coisas diferentes —
     lá o Deck, aqui o ponteiro — e compartilhar a maquina de estado faria girar o Deck
     animar o retrato do outro lado do quarto. */
  const reacao = createKnobReaction({ idle: true })

  /**
   * A escala e **inteira** de proposito: meia celula e uma borda serrilhada num
   * desenho cuja graca inteira e a celula. Com w = 120 e um sprite de 28, `S = 4` da
   * 112 de largura e sobra uma margem de 4 de cada lado.
   */
  const S = Math.max(1, Math.floor(w / (REACTION_W + 2)))
  const bx = Math.round((w - REACTION_W * S) / 2)
  const by = Math.round((h - REACTION_H * S) / 2)

  /**
   * O ponteiro faz o papel do Deck.
   *
   * `notify` recebe um valor continuo e dispara quando o percurso acumulado passa de
   * um limiar — foi escrito para o giro de um Deck e serve igual para a travessia de
   * um ponteiro. Somar os dois eixos da uma unica grandeza monotonica, que e a forma
   * que ela espera.
   */
  function ponteiro(nx, ny) { reacao.notify(nx * 2 + ny) }

  function pintar(t, { vigil = 0 } = {}) {
    const P = {}
    for (const k of ['ink', 'mid', 'dim', 'bg']) P[k] = mix(hex(DIA[k]), hex(NOITE[k]), vigil)
    const INK = cor(P.ink), MID = cor(P.mid), DEEP = cor(P.dim), BG = cor(P.bg)

    g.fillStyle = BG; g.fillRect(0, 0, w, h)
    drawSprite(g, REACTION_FRAMES[reacao.frameAt(t * 1000)], bx, by, S, INK, MID, DEEP, BG)

    /**
     * A varredura, e ela e o unico sinal de que aquilo e painel e nao pintura acesa.
     *
     * Uma linha clara descendo devagar — onze segundos para atravessar. Rapida demais
     * le como falha de sinal; parada nao le como nada. `display.js` poe a grade fixa
     * de pixel e o sangramento por cima disto; esta e a unica parte que **anda**, e
     * por isso mora aqui e nao la.
     */
    const varre = ((t / 11) % 1) * (h + 60) - 30
    const faixa = g.createLinearGradient(0, varre - 20, 0, varre + 20)
    faixa.addColorStop(0, 'rgba(255,255,255,0)')
    faixa.addColorStop(.5, 'rgba(255,255,255,.05)')
    faixa.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = faixa; g.fillRect(0, varre - 20, w, 40)
  }

  pintar(0, {})
  return { canvas: c, pintar, ponteiro, width: w, height: h }
}
