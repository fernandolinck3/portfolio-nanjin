/**
 * A Lyra do retrato — e ela e **a mesma Lyra da Tela**, nao uma segunda.
 *
 * Este arquivo errou o personagem duas vezes antes de acertar, e as duas valem
 * registro porque a causa foi a mesma: deduzir do codigo em vez de olhar o desenho.
 *
 * 1. **Um rosto inventado aqui.** Tenebrista, procedural, meu. Passou por ovo branco,
 *    nevoa e desenho de arame antes de ficar apenas aceitavel — e o problema nunca foi
 *    calibragem, era que havia duas Lyras. Um personagem desenhado duas vezes e a
 *    armadilha do `CLAUDE.md` em outra forma: duas listas divergem, uma nao pode.
 * 2. **`drawWizard`, de `screen/figure.js`.** Achei que fosse a do mostrador porque e
 *    a unica figura *procedural* la. Nao e: e o ramo de fallback. Alem de errada, ela
 *    desenha pixel a pixel com custo quadratico na escala e **travou o renderer** ao
 *    ser pedida grande.
 *
 * O que a Unidade mostra e `BUST`, de `screen/drawn.js` — 28x32 desenhada a mao em
 * quatro tons, com chapeu de aba, massa de cabelo enquadrando o rosto, e os olhos que
 * o cabecalho de la diz serem o ponto: *dois quadrados escuros leem como mascara; dois
 * quadrados escuros com um pixel aceso leem como alguem olhando para voce.*
 *
 * A forma de descobrir isso nao foi ler mais codigo — foi **renderizar os candidatos
 * em PNG e olhar**. Tres desenhos, tres imagens, um segundo de decisao.
 *
 * ## O olhar, sem redesenhar a arte
 *
 * O sprite e uma grade de caracteres, entao os olhos sao **celulas com endereco**:
 * colunas 9-11 e 15-17, linhas 15-17. Para ela olhar, o bloco de cada olho e recortado
 * na carga, o buraco e tapado com o tom do rosto, e o bloco e redesenhado deslocado em
 * ate uma celula. Uma celula, a esta escala, e uma dezena de pixels de tela.
 *
 * Recortar em vez de escrever os glifos a mao e o que faz isso sobreviver a arte
 * mudar: se ela for redesenhada e os olhos continuarem nesses retangulos, nada aqui
 * precisa ser tocado.
 */

import { BUST, drawSprite } from './screen/drawn.js'
import { drawRobe } from './screen/figure.js'

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

/** Onde os olhos moram no sprite. Medido em `BUST`, nao chutado. */
const OLHOS = [{ c: 9, r: 15 }, { c: 15, r: 15 }]
const OLHO_W = 3, OLHO_H = 3

/* O rosto sem os olhos, e os dois olhos soltos — recortados uma vez na carga. */
const ROSTO = BUST.map(r => r.split(''))
const RECORTES = OLHOS.map(({ c, r }) => {
  const bloco = []
  for (let j = 0; j < OLHO_H; j++) {
    bloco.push(ROSTO[r + j].slice(c, c + OLHO_W).join(''))
    for (let i = 0; i < OLHO_W; i++) ROSTO[r + j][c + i] = '#'   // o tom do rosto
  }
  return bloco
})
const SEM_OLHOS = ROSTO.map(r => r.join(''))

export function criarLyra({ w = 120, h = 162 } = {}) {
  const c = document.createElement('canvas')
  c.width = w; c.height = h
  const g = c.getContext('2d')
  g.imageSmoothingEnabled = false

  /**
   * O enquadramento, e ele e aritmetica inteira de proposito.
   *
   * O sprite tem 28 celulas de largura. `S` e quantos pixels de fonte cada celula
   * ocupa, e tem de ser **inteiro**: meia celula e uma borda serrilhada num desenho
   * cuja graca inteira e a celula. Com w = 120, S = 4 da 112 de largura e sobra uma
   * margem de 4 de cada lado.
   */
  const S = Math.max(1, Math.floor(w / (BUST[0].length + 2)))
  const bx = Math.round((w - BUST[0].length * S) / 2)
  const by = Math.max(0, Math.round(h * .04))
  const baixo = by + BUST.length * S

  function pintar(t, { vigil = 0, olhar = [0, 0] } = {}) {
    const P = {}
    for (const k of ['ink', 'mid', 'dim', 'bg']) P[k] = mix(hex(DIA[k]), hex(NOITE[k]), vigil)
    const INK = cor(P.ink), MID = cor(P.mid), DEEP = cor(P.dim), BG = cor(P.bg)

    g.fillStyle = BG; g.fillRect(0, 0, w, h)

    /**
     * O manto continua o busto, e nao e desenhado a mao — `drawn.js` diz por que:
     * *um rosto e um conjunto de decisoes e tem de ser desenhado; um manto e uma
     * forma.* E a mesma divisao que a Tela da Unidade usa, com o mesmo `drawRobe`, e e
     * a parte dela que balanca.
     */
    if (baixo < h) drawRobe(g, Math.round(w / 2), baixo - S, h + S, S, 'present', t, INK, MID, DEEP, BG)

    drawSprite(g, SEM_OLHOS, bx, by, S, INK, MID, DEEP, BG)

    /* Uma celula de curso em cada eixo. Mais que isso e estrabismo. */
    const gx = Math.round(Math.max(-1, Math.min(1, olhar[0])))
    const gy = Math.round(Math.max(-1, Math.min(1, olhar[1])))
    RECORTES.forEach((bloco, i) => {
      const o = OLHOS[i]
      drawSprite(g, bloco, bx + (o.c + gx) * S, by + (o.r - gy) * S, S, INK, MID, DEEP, BG)
    })

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
  return { canvas: c, pintar, width: w, height: h }
}
