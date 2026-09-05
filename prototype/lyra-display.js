/**
 * A Lyra do retrato — e ela e **a mesma Lyra da Tela**, nao uma segunda.
 *
 * A primeira versao deste arquivo desenhava um rosto proprio, tenebrista, inventado
 * aqui. Passou por ovo branco, nevoa e desenho de arame antes de ficar apenas
 * aceitavel, e o problema nao era a calibragem: e que havia **duas Lyras**. A do
 * mostrador da Unidade e uma maga chibi de 1 bit em `screen/figure.js` — proporcao de
 * cabeca grande, manto em sino, chapeu de aba larga com estrela na ponta, e ela ja
 * respira, ja balanca e ja pisca. Um personagem desenhado duas vezes e a mesma
 * armadilha que `screenHit` deixou no `CLAUDE.md` em outra forma: **duas listas
 * divergem, uma nao pode.**
 *
 * Entao aqui nao ha desenho. Ha um enquadramento: `drawWizard` chamada com uma altura
 * maior que a tela, de modo que os pes caiam fora e o que sobra e busto — chapeu,
 * cabeca, ombros. E a paleta da Tela, cruzada pela Vigilia, para que o painel dela e o
 * painel do instrumento sejam a mesma superficie em dois lugares.
 *
 * ## De onde saem os numeros do enquadramento
 *
 * `drawWizard` posiciona tudo a partir de `fig = { x, y: pes, h }` com `s = h / 74`.
 * Daquelas contas saem duas linhas uteis: o alto do chapeu fica em `pes - 1,013 h` e o
 * ombro em `pes - 0,30 h`. Resolvendo para a ponta do chapeu perto do topo e o ombro
 * perto da base, sai `h ~= 1,23 x altura da tela` e `pes ~= 1,30 x altura`. Nao e
 * chute: e o enquadramento resolvido para os dois pontos que importam.
 *
 * ## Por que a tela e pequena
 *
 * **`drawWizard` desenha pixel a pixel.** `disc` e um laco duplo de `fillRect(1,1)`
 * sobre o quadrado que contem o circulo, entao o custo dela cresce com o quadrado da
 * escala: a 74px de altura o raio da cabeca e 11 e sao 441 chamadas; a 400px o raio e
 * 59 e sao onze mil, e somando bracos, manto e chapeu a repintura passa de cem mil
 * `fillRect`. A primeira tentativa desenhou a 400 e **travou o renderer** — nao ficou
 * lenta, congelou.
 *
 * A resposta e a mesma que a Tela da Unidade ja usa: desenhar pequeno e ampliar. Ela
 * e desenhada com 199px de altura numa tela de 120x162, e `display.js` a leva a 3x com
 * `imageSmoothingEnabled = false`. O pixel dela aparece de proposito — e um mostrador
 * — e a conta cai de cem mil chamadas para treze mil.
 */

import { drawWizard } from './screen/figure.js'

/* As duas paletas de `screen/render.js`, repetidas de proposito e nao importadas: la
   elas vivem em `let` de modulo que ele reescreve a cada quadro conforme o fader, e
   importar aquilo amarraria o rosto dela ao relogio de um outro mostrador. O que se
   compartilha e a decisao de cor, nao a variavel. */
const DIA   = { ink: '#E9E3D2', mid: '#8A8470', dim: '#5E5A4C', bg: '#0A0B09' }
const NOITE = { ink: '#DCD6C6', mid: '#9C5A4E', dim: '#6E1810', bg: '#08070A' }

/* Cor mistura em numeros e pinta em texto. A primeira versao guardava `rgb(...)` ja
   formatado e remisturava sobre ele, e `hex()` lia `parseInt('gb', 16)` no meio da
   string: a cena inteira morria num `addColorStop` com `rgb(NaN,NaN,2)`. */
const hex = c => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]
const mix = (A, B, k) => A.map((v, i) => v + (B[i] - v) * k)
const cor = T => `rgb(${T[0] | 0},${T[1] | 0},${T[2] | 0})`

export function criarLyra({ w = 120, h = 162 } = {}) {
  const c = document.createElement('canvas')
  c.width = w; c.height = h
  const g = c.getContext('2d')
  g.imageSmoothingEnabled = false

  /* resolvido para ponta do chapeu em 15 e ombro em 300 — ver o cabecalho */
  const fig = { x: Math.round(w / 2), y: Math.round(h * 1.296), h: Math.round(h * 1.235) }

  function pintar(t, { vigil = 0, olhar = [0, 0] } = {}) {
    const P = {}
    for (const k of ['ink', 'mid', 'dim', 'bg']) P[k] = mix(hex(DIA[k]), hex(NOITE[k]), vigil)

    g.fillStyle = cor(P.bg); g.fillRect(0, 0, w, h)

    /**
     * O brilho de fosforo atras dela, e ele e **curto**.
     *
     * A versao anterior cobria o painel inteiro com um degrade a 90% de alfa. Isso e
     * um piso de preto levantado, que e a definicao de nevoa, e e o mesmo erro que o
     * ADR-0021 achou no `lift` do grade: numa imagem feita de escuridao nao existe
     * assunto claro que justifique erguer as sombras. Fica um nucleo transparente,
     * so o bastante para o painel nao ser um retangulo morto.
     */
    const halo = g.createRadialGradient(w * .42, h * .34, h * .06, w * .5, h * .40, h * .46)
    halo.addColorStop(0, `rgba(${mix(P.bg, P.dim, .5).map(v => v | 0).join(',')},.34)`)
    halo.addColorStop(1, `rgba(${P.bg.map(v => v | 0).join(',')},0)`)
    g.fillStyle = halo; g.fillRect(0, 0, w, h)

    /**
     * **Ela e desenhada em `mid`, e nao em `ink`.**
     *
     * Na Tela da Unidade a figura e creme sobre preto e isso esta certo: ela tem 74
     * pixels de altura e ocupa um canto de um mostrador pequeno. Aqui ela tem 400 e o
     * chapeu sozinho e a maior area do quadro — em creme, com o material emitindo a
     * quase 1, o painel vira lampada. Foi literalmente o primeiro erro desta cena, o
     * ovo branco, na outra ponta.
     *
     * `mid` e um degrau abaixo de `ink` na mesma paleta, e sobra `ink` para o que tem
     * de ganhar: os olhos e a estrela na ponta do chapeu.
     */
    drawWizard(g, fig, 'present', t, cor(P.mid), cor(mix(P.bg, P.dim, .5)), cor(P.bg), 0, olhar)

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
