import { describe, it, expect } from 'vitest'
import {
  chamaPixels, brilhoPixels, chamaGeo,
  CHAMA_W, CHAMA_H, BRILHO_N,
} from './chama.js'

/**
 * A chama, e a regra que ficou anos sem teste.
 *
 * O defeito que `chama.js` corrige não era um erro de código — nada lançava, nada
 * ficava vermelho. Era **uma afirmação falsa sobre uma cor**: as duas chamas da peça
 * eram cor chapada sem branco nela, e por isso não podiam ter núcleo em nenhuma
 * intensidade. O lustre lia como dezesseis velas apagadas por dois motivos somados —
 * o teto no grade (terceira emenda do ADR-0021) e este.
 *
 * O que estes testes travam é justamente o que uma revisão de código não pega: se
 * alguém trocar o mapa por uma cor sólida, reajustar o corte do branco para cima, ou
 * mover o pivô da geometria, um destes fica vermelho. Sem eles a correção é um desejo,
 * que é a regra do `CLAUDE.md`.
 *
 * Roda em node, sem documento, porque `chamaPixels` e `brilhoPixels` devolvem o buffer
 * cru — essa separação existe para que este arquivo possa existir.
 */

/** @returns {[number,number,number]} o RGB de um texel */
const rgb = (px, w, x, y) => {
  const i = (y * w + x) * 4
  return [px[i], px[i + 1], px[i + 2]]
}

describe('a gota da chama', () => {
  const px = chamaPixels()

  it('tem um núcleo branco, que é a coisa que a cor chapada não conseguia ter', () => {
    let brancos = 0
    for (let i = 0; i < px.length; i += 4) {
      if (px[i] >= 250 && px[i + 1] >= 250 && px[i + 2] >= 250) brancos++
    }
    expect(brancos).toBeGreaterThan(0)
  })

  it('tem núcleo largo o bastante para sobreviver à minificação', () => {
    /* Medido: a 0.74 o corte punha 454 amostras do quadro acima de luminância 240 e o
       centro branco era dissolvido antes de chegar à tela; a 0.40 são 789. Uma chama
       tem uns treze pixels de largura no enquadramento entregue, então o núcleo tem de
       ser uma fração *grande* do desenho e não um ponto no meio dele. */
    let acesos = 0, nucleo = 0
    for (let i = 0; i < px.length; i += 4) {
      if (px[i] + px[i + 1] + px[i + 2] > 12) acesos++
      if (px[i] >= 250 && px[i + 1] >= 250 && px[i + 2] >= 250) nucleo++
    }
    /* medido: 1,52% dos texels acesos são branco puro no desenho entregue. O piso é
       um pouco abaixo disso, para pegar o núcleo desaparecendo e não uma afinação. */
    expect(nucleo / acesos).toBeGreaterThan(.012)
  })

  it('mantém o manto laranja em volta do núcleo', () => {
    /* a franja de uma vela é laranja; se o mapa inteiro empalidecer o manto vai com
       ele, e aí a chama deixa de ser uma chama e passa a ser um borrão claro */
    let quentes = 0
    for (let i = 0; i < px.length; i += 4) {
      const [r, g, b] = [px[i], px[i + 1], px[i + 2]]
      if (r < 60 || r >= 250) continue          // fora o rim escuro e fora o núcleo
      if (r > g && g > b && r - b > 30) quentes++
    }
    expect(quentes).toBeGreaterThan(200)
  })

  it('vai a zero nos lados e no topo, que é onde está a silhueta', () => {
    /* A silhueta é a própria queda da textura — não há mapa de alfa nem recorte, e é
       por isso que a mistura é aditiva. Se um lado não for preto, a mistura aditiva
       desenha uma linha clara ao longo da borda do quad.
       A **base** é a exceção, e o teste abaixo é que cuida dela. */
    for (let x = 0; x < CHAMA_W; x++) expect(rgb(px, CHAMA_W, x, 0)).toEqual([0, 0, 0])
    for (let y = 0; y < CHAMA_H; y++) {
      expect(rgb(px, CHAMA_W, 0, y)).toEqual([0, 0, 0])
      expect(rgb(px, CHAMA_W, CHAMA_W - 1, y)).toEqual([0, 0, 0])
    }
  })

  it('acende a base só numa faixa estreita no meio: é a raiz da chama, não um vazamento', () => {
    /* A primeira versão deste teste exigia preto nos quatro lados e ficou vermelha na
       base, com 119 no centro. O número está certo e a regra estava errada: ali é onde
       o pavio está, e a raiz de uma chama é acesa. O que seria defeito é a base acender
       *inteira* — isso desenharia uma linha atravessando o pé do quad. */
    const y = CHAMA_H - 1
    let acesos = 0
    for (let x = 0; x < CHAMA_W; x++) if (px[(y * CHAMA_W + x) * 4] > 2) acesos++
    expect(acesos).toBeGreaterThan(0)
    expect(acesos).toBeLessThan(CHAMA_W * .12)
  })

  it('é mais quente logo acima do pavio, e não no meio', () => {
    /* a parte clara de uma vela fica baixa; um gradiente centrado desenha um losango
       e não uma chama */
    const brilhoNaLinha = y => {
      let s = 0
      for (let x = 0; x < CHAMA_W; x++) s += px[(y * CHAMA_W + x) * 4 + 1]
      return s
    }
    /* y cresce para baixo na imagem, e o pavio está embaixo */
    let melhor = 0, top = -1
    for (let y = 0; y < CHAMA_H; y++) { const s = brilhoNaLinha(y); if (s > melhor) { melhor = s; top = y } }
    expect(top).toBeGreaterThan(CHAMA_H * .55)
  })
})

describe('o brilho em volta', () => {
  const px = brilhoPixels()

  it('cai a zero na borda, porque um brilho é a única coisa que não pode ter borda', () => {
    /* era uma esfera de cor chapada em mistura aditiva, que desenha um disco de borda
       dura — o anel laranja que aparecia atrás das Velas do Altar */
    for (let x = 0; x < BRILHO_N; x++) {
      expect(rgb(px, BRILHO_N, x, 0)).toEqual([0, 0, 0])
      expect(rgb(px, BRILHO_N, x, BRILHO_N - 1)).toEqual([0, 0, 0])
    }
  })

  it('cai sem degrau do centro para a borda', () => {
    const meio = BRILHO_N >> 1
    let anterior = Infinity
    for (let x = meio; x < BRILHO_N; x++) {
      const v = px[(meio * BRILHO_N + x) * 4 + 1]
      expect(v).toBeLessThanOrEqual(anterior)
      anterior = v
    }
  })

  it('é mais forte no centro do que a meio caminho da borda', () => {
    const meio = BRILHO_N >> 1
    const centro = px[(meio * BRILHO_N + meio) * 4 + 1]
    const meioCaminho = px[(meio * BRILHO_N + meio + (BRILHO_N >> 2)) * 4 + 1]
    expect(centro).toBeGreaterThan(meioCaminho * 2)
  })
})

describe('a geometria da chama', () => {
  it('são dois quadriláteros cruzados num só buffer, e não dois objetos', () => {
    const g = chamaGeo(.15, .15)
    expect(g.getAttribute('position').count).toBe(8)
    expect(g.getIndex().count).toBe(12)
  })

  it('fica centrada na origem, porque as duas animações escalam a chama', () => {
    /* Um pivô na base mudaria a posição de repouso de todas as chamas da peça — o que
       seria uma correção de enquadramento disfarçada de correção de material. A esfera
       que isto substituiu era centrada. */
    const g = chamaGeo(.15, .3)
    g.computeBoundingBox()
    const { min, max } = g.boundingBox
    expect(min.y).toBeCloseTo(-max.y, 6)
    expect(min.x).toBeCloseTo(-max.x, 6)
    expect(max.y).toBeCloseTo(.15, 6)
  })

  it('tem UV cobrindo o mapa inteiro nos dois quadriláteros', () => {
    const uv = chamaGeo(1, 1).getAttribute('uv')
    expect(uv.count).toBe(8)
    for (const q of [0, 4]) {
      expect([uv.getX(q + 0), uv.getY(q + 0)]).toEqual([0, 0])
      expect([uv.getX(q + 2), uv.getY(q + 2)]).toEqual([1, 1])
    }
  })
})
