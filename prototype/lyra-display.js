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
 *
 * ## O oraculo, e por que ele nao e uma bola de cristal
 *
 * A pose fechada punha o visitante a dois metros da cara dela sem nada para fazer, e
 * QUEM ja era o unico Modulo onde nada se opera — o proprio comentario da fala dela em
 * `modules.ts` diz isso: QUEM nao tem lista, entao nem a LUA nem o SOL fazem nada ali.
 * Quatro perguntas no painel fecham as duas coisas de uma vez.
 *
 * Duas decisoes seguram isso de ser brinquedo:
 *
 * 1. **A pergunta e boba e a resposta e verdadeira.** Uma frase sorteada de um saco de
 *    frases gasta a atencao de quem clicou e nao devolve nada. Se a resposta e uma
 *    afirmacao real sobre como o trabalho e feito, a pergunta boba e so a porta.
 * 2. **A resposta e lida da Vigilia, nao sorteada.** As tres respostas de cada pergunta
 *    sao dia, meio e noite, na direcao do fader. Perguntar duas vezes com o fader
 *    parado da a mesma resposta; o que da resposta nova e **mexer no fader**. O
 *    Crossfader ganha um sentido que nao tinha, e o registro astrologico que a ideia
 *    pede ja estava no objeto — a carta celeste da Plate, o ciclo dia e noite.
 *
 * O texto mora em `src/content/modules.ts` como campo do Modulo QUEM, com entrada em
 * `en.ts` e cobertura no espelho. Este arquivo desenha; ele nao escreve.
 */

import { REACTION_FRAMES, REACTION_W, REACTION_H } from './screen/reaction-frames.js'
import { drawSprite } from './screen/drawn.js'
import { createKnobReaction } from './screen/reaction.js'
import { ORACLE } from '../src/content/modules.ts'

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

/**
 * A caixa de dialogo, medida e nao escolhida.
 *
 * Quatro linhas porque sao quatro perguntas, e `LH = 14` porque a fonte e a mesma
 * `11px VT323` do balao da Tela e catorze e o menor passo em que duas linhas dela nao
 * se tocam. O resto do painel e da figura: o que sobra acima da caixa divide por 40 —
 * a altura do sprite — e a escala e o quociente inteiro. **Meia celula e uma borda
 * serrilhada num desenho cuja graca inteira e a celula.**
 *
 * A 240 x 324 a conta fecha: 248 de folga acima, escala 6, 168 x 240 de figura, e ela
 * para quatro pixels antes da caixa. Trocar o tamanho do painel refaz a conta sozinha.
 */
const CAIXA = { linhas: 4, lh: 14, pad: 6, base: 8 }
const FONTE = '11px VT323, monospace'

/** Dia, meio, noite — a mesma direcao do fader. */
const bandaDe = vigil => (vigil < 1 / 3 ? 0 : vigil < 2 / 3 ? 1 : 2)

/** Quebra por largura medida, e nao por contagem de caracteres: VT323 nao e mono. */
function quebrar(g, texto, largura) {
  const saida = []
  let linha = ''
  for (const palavra of texto.split(' ')) {
    const tenta = linha ? linha + ' ' + palavra : palavra
    if (linha && g.measureText(tenta).width > largura) { saida.push(linha); linha = palavra }
    else linha = tenta
  }
  if (linha) saida.push(linha)
  return saida
}

export function criarLyra({ w = 240, h = 324 } = {}) {
  const c = document.createElement('canvas')
  c.width = w; c.height = h
  const g = c.getContext('2d')
  g.imageSmoothingEnabled = false

  /* Uma instancia propria, e nao a do mostrador: os dois reagem a coisas diferentes —
     lá o Deck, aqui o ponteiro — e compartilhar a maquina de estado faria girar o Deck
     animar o retrato do outro lado do quarto. */
  const reacao = createKnobReaction({ idle: true })

  const CX_H = CAIXA.pad * 2 + CAIXA.linhas * CAIXA.lh
  const CX_Y = h - CX_H - CAIXA.base
  const S = Math.max(1, Math.floor(Math.min((CX_Y - 4) / REACTION_H, w / (REACTION_W + 2))))
  const bx = Math.round((w - REACTION_W * S) / 2)
  const by = Math.max(2, Math.round(CX_Y - 4 - REACTION_H * S))

  /* -1 e a lista de perguntas; 0..3 e a resposta daquela. `sobre` e a linha sob o
     ponteiro, e existe para que a caixa tenha o mesmo retorno que um botao tem. */
  let escolha = -1
  let sobre = -1

  /**
   * O ponteiro faz o papel do Deck.
   *
   * `notify` recebe um valor continuo e dispara quando o percurso acumulado passa de
   * um limiar — foi escrito para o giro de um Deck e serve igual para a travessia de
   * um ponteiro. Somar os dois eixos da uma unica grandeza monotonica, que e a forma
   * que ela espera.
   */
  function ponteiro(nx, ny) { reacao.notify(nx * 2 + ny) }

  /**
   * De pixel do painel para linha da caixa, e `-1` para tudo o que nao e a caixa.
   *
   * Recebe pixel e nao UV de proposito: quem tem o UV e o raycast, e quem sabe onde a
   * caixa esta e este arquivo. Devolver `-1` fora dela e o que faz o clique na cara
   * dela continuar sendo um clique no retrato, e nao numa opcao invisivel.
   */
  function linhaEm(px, py) {
    if (py < CX_Y + CAIXA.pad || py > CX_Y + CX_H - CAIXA.pad) return -1
    if (px < CAIXA.pad || px > w - CAIXA.pad) return -1
    const i = Math.floor((py - CX_Y - CAIXA.pad) / CAIXA.lh)
    return i >= 0 && i < CAIXA.linhas ? i : -1
  }

  /** O ponteiro sobre a caixa. Devolve se ha algo sob ele, para o cursor da pagina. */
  function apontar(px, py) {
    const i = linhaEm(px, py)
    sobre = escolha < 0 && i < ORACLE.length ? i : -1
    return escolha >= 0 ? linhaEm(px, py) >= 0 : sobre >= 0
  }

  /**
   * Um clique na caixa. `true` quando ele foi consumido aqui.
   *
   * Com uma resposta aberta, qualquer linha da caixa volta para as perguntas: quem leu
   * a resposta quer a lista de novo, e um controle de voltar separado numa caixa de
   * quatro linhas gastaria um quarto dela para dizer o obvio.
   */
  function clicar(px, py) {
    const i = linhaEm(px, py)
    if (i < 0) return false
    if (escolha >= 0) { escolha = -1; return true }
    if (i >= ORACLE.length) return false
    escolha = i
    reacao.trigger()
    return true
  }

  function limpar() { escolha = -1; sobre = -1 }

  /** A caixa: as quatro perguntas, ou a resposta que a Vigilia escolheu. */
  function caixa(vigil, INK, MID, DEEP, BG) {
    if (!ORACLE.length) return
    g.fillStyle = BG
    g.fillRect(0, CX_Y, w, CX_H)
    /* uma regua e nao um contorno: a caixa e o fundo do painel, nao uma janela sobre
       ele, e quatro lados desenhariam uma janela */
    g.fillStyle = DEEP
    g.fillRect(CAIXA.pad, CX_Y, w - CAIXA.pad * 2, 1)

    g.font = FONTE
    g.textAlign = 'left'
    const x = CAIXA.pad + 2
    const linha = i => CX_Y + CAIXA.pad + 11 + i * CAIXA.lh
    const util = w - CAIXA.pad * 2 - 12

    if (escolha < 0) {
      for (let i = 0; i < Math.min(CAIXA.linhas, ORACLE.length); i++) {
        g.fillStyle = i === sobre ? INK : MID
        g.fillText((i === sobre ? '\u203a ' : '  ') + ORACLE[i].q, x, linha(i))
      }
      return
    }

    const { q, a } = ORACLE[escolha]
    g.fillStyle = DEEP
    g.fillText('  ' + q, x, linha(0))
    g.fillStyle = INK
    const resposta = quebrar(g, a[bandaDe(vigil)], util)
    for (let i = 0; i < Math.min(CAIXA.linhas - 1, resposta.length); i++) {
      g.fillText('  ' + resposta[i], x, linha(1 + i))
    }
  }

  function pintar(t, { vigil = 0 } = {}) {
    const P = {}
    for (const k of ['ink', 'mid', 'dim', 'bg']) P[k] = mix(hex(DIA[k]), hex(NOITE[k]), vigil)
    const INK = cor(P.ink), MID = cor(P.mid), DEEP = cor(P.dim), BG = cor(P.bg)

    g.fillStyle = BG; g.fillRect(0, 0, w, h)
    drawSprite(g, REACTION_FRAMES[reacao.frameAt(t * 1000)], bx, by, S, INK, MID, DEEP, BG)
    caixa(vigil, INK, MID, DEEP, BG)

    /**
     * A varredura, e ela e o unico sinal de que aquilo e painel e nao pintura acesa.
     *
     * Uma linha clara descendo devagar — onze segundos para atravessar. Rapida demais
     * le como falha de sinal; parada nao le como nada. `display.js` poe a grade fixa
     * de pixel e o sangramento por cima disto; esta e a unica parte que **anda**, e
     * por isso mora aqui e nao la.
     *
     * Passa por cima da caixa de dialogo de proposito: a caixa e do painel, nao uma
     * camada de interface sobre ele, e uma varredura que desviasse do texto diria que
     * o texto esta em outro lugar.
     */
    const varre = ((t / 11) % 1) * (h + 60) - 30
    const faixa = g.createLinearGradient(0, varre - 20, 0, varre + 20)
    faixa.addColorStop(0, 'rgba(255,255,255,0)')
    faixa.addColorStop(.5, 'rgba(255,255,255,.05)')
    faixa.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = faixa; g.fillRect(0, varre - 20, w, 40)
  }

  pintar(0, {})
  return {
    canvas: c, pintar, ponteiro, apontar, clicar, limpar, linhaEm,
    get escolha() { return escolha },
    width: w, height: h,
  }
}
