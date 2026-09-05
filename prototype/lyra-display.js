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
import { ORACLE, MODULES } from '../src/content/modules.ts'
import { UI } from '../src/content/strings.ts'

/**
 * A bio, e ela nao e conteudo novo — e o Modulo QUEM lido de onde ele ja mora.
 *
 * `name`, `role` e `disciplines` sao os mesmos campos que a Tela desenha e que o
 * espelho publica; nada disto precisa de entrada em `en.ts` nem de teste novo, porque
 * ja tem os dois. O painel do retrato passa a ser mais um leitor deles.
 */
const QUEM = MODULES.find(m => m.id === 'identity') || null

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
 * Cinco linhas, e a quinta e o preco de a bio vir primeiro: quatro perguntas mais uma
 * linha que diz para onde o clique leva. Sem ela um dos tres estados da caixa seria
 * uma rua sem saida. `LH = 14` porque a fonte e a mesma `11px VT323` do balao da Tela
 * e catorze e o menor passo em que duas linhas dela nao se tocam.
 *
 * A escala do desenho e inteira — **meia celula e uma borda serrilhada num desenho
 * cuja graca inteira e a celula** — e sai de quanto ha acima da caixa. `barra` e o
 * quanto do desenho a caixa **pode** cobrir: doze pixels de origem, que na figura sao
 * duas celulas da barra do manto e nada mais. Sem essa folga a quinta linha custaria
 * uma escala inteira (de 6 para 5, 17% dela) para nao encostar na bainha de um manto.
 * E o que uma visual novel faz: a caixa de texto pousa sobre a arte, nao ao lado.
 *
 * A 240 x 324 a conta fecha em escala 6 — 168 x 240 de figura, do pixel 6 ao 246,
 * com a caixa comecando em 234. Trocar o tamanho do painel refaz tudo sozinho.
 */
const CAIXA = { linhas: 5, lh: 14, pad: 6, base: 8, barra: 12 }
const FONTE = '11px VT323, monospace'

/** Dia, meio, noite — a mesma direcao do fader. */
const bandaDe = vigil => (vigil < 1 / 3 ? 0 : vigil < 2 / 3 ? 1 : 2)

/**
 * Corta a pergunta que nao cabe, e nao a quebra.
 *
 * A caixa tem quatro linhas porque sao quatro perguntas: uma pergunta que quebrasse em
 * duas empurraria a quarta para fora e o oraculo perderia um quarto de si em silencio.
 * Cortar com reticencias mostra o problema para quem reescrever o texto, em vez de
 * escondê-lo — o texto mora em `modules.ts` e quem o edita nao le este arquivo.
 */
function encurtar(g, texto, largura) {
  if (g.measureText(texto).width <= largura) return texto
  let s = texto
  while (s.length > 1 && g.measureText(s + '\u2026').width > largura) s = s.slice(0, -1)
  return s + '\u2026'
}

/**
 * Uma lista em linhas, quebrada **por item** e nao por palavra.
 *
 * `quebrar` corta onde ha espaco, e num texto de itens separados por ponto medio o
 * espaco antes do separador e um lugar legal de cortar: as cinco disciplinas saiam
 * como `ESTRATEGIA · MENSAGEM · DESIGN · FRONT-END ·` e `ANALISE`, com o separador
 * pendurado no fim de uma linha apontando para nada. Empacotar por item nunca deixa
 * um separador orfao e ainda equilibra melhor — tres e dois em vez de quatro e um.
 */
function emLinhas(g, itens, largura, sep = ' \u00b7 ') {
  const larg = a => g.measureText(a.join(sep)).width
  if (!itens.length) return []
  if (larg(itens) <= largura) return [itens.join(sep)]

  /* Duas linhas equilibradas em vez de gulosas. O guloso enche a primeira e sobra uma
     palavra sozinha na segunda — cinco disciplinas saiam quatro e uma, e "ANALISE"
     pendurada embaixo le como erro de digitacao. Sao quatro cortes possiveis numa
     lista de cinco: testar todos e ficar com o que deixa a linha mais larga menos
     larga custa nada e le como uma linha escrita, nao como uma sobra. */
  let melhor = null
  for (let k = 1; k < itens.length; k++) {
    const a = itens.slice(0, k), b = itens.slice(k)
    const wa = larg(a), wb = larg(b)
    if (wa > largura || wb > largura) continue
    const pior = Math.max(wa, wb)
    if (!melhor || pior < melhor.pior) melhor = { pior, linhas: [a.join(sep), b.join(sep)] }
  }
  if (melhor) return melhor.linhas

  /* nao coube em duas: guloso, que ao menos nao perde item nenhum */
  const fora = []
  let linha = ''
  for (const item of itens) {
    const tenta = linha ? linha + sep + item : item
    if (linha && g.measureText(tenta).width > largura) { fora.push(linha); linha = item }
    else linha = tenta
  }
  if (linha) fora.push(linha)
  return fora
}

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
  const S = Math.max(1, Math.floor(Math.min((CX_Y + CAIXA.barra) / REACTION_H, w / (REACTION_W + 2))))
  const bx = Math.round((w - REACTION_W * S) / 2)
  const by = Math.max(2, Math.round(CX_Y + CAIXA.barra - REACTION_H * S))

  /**
   * Os tres estados da caixa, e por que a bio e o primeiro.
   *
   * A estacao do retrato **e** o Modulo QUEM. Com as perguntas na chegada, a coisa
   * principal da estacao de quem ele e passava a ser uma piada, e o nome dele ficava
   * num visor de 347 por 219 no canto — que na pose fechada nem existe, porque ela
   * apaga o visor. A bio na chegada devolve a estacao ao seu assunto e poe o oraculo
   * onde ele pertence: **atras de um clique, e nao na frente do nome dele.**
   *
   * Nenhum estado e rua sem saida. `bio` abre as perguntas, `perguntas` volta para a
   * bio, `resposta` volta para as perguntas — e sair de perto reseta tudo.
   */
  const BIO = 'bio', PERGUNTAS = 'perguntas', RESPOSTA = 'resposta'
  let estado = BIO
  let escolha = -1
  /* a linha sob o ponteiro: e o que da a uma linha o retorno que um botao tem */
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
   * As linhas da caixa, montadas para o estado corrente.
   *
   * Uma funcao so, e ela devolve a mesma forma nos tres estados: `{ txt, cor, alvo }`
   * por linha, onde `alvo` diz o que um clique naquela linha faz. Desenhar e acertar
   * o clique passam a ler a **mesma** lista, entao uma linha nao pode existir para o
   * olho e nao para o ponteiro — que e a classe de bug que separa quem desenha de quem
   * testa o acerto.
   */
  function linhas(g, INK, MID, DEEP, util) {
    const fora = []
    if (estado === BIO) {
      if (QUEM?.name) fora.push({ txt: QUEM.name, cor: INK })
      if (QUEM?.role) fora.push({ txt: QUEM.role, cor: MID })
      for (const l of emLinhas(g, QUEM?.disciplines || [], util)) {
        if (fora.length < CAIXA.linhas - 1) fora.push({ txt: l, cor: DEEP })
      }
      while (fora.length < CAIXA.linhas - 1) fora.push({ txt: '', cor: MID })
      if (ORACLE.length) fora.push({ txt: UI.perguntar, cor: MID, alvo: 'abrir' })
      return fora
    }
    if (estado === PERGUNTAS) {
      for (let i = 0; i < Math.min(CAIXA.linhas - 1, ORACLE.length); i++) {
        fora.push({ txt: ORACLE[i].q, cor: MID, alvo: i })
      }
      while (fora.length < CAIXA.linhas - 1) fora.push({ txt: '', cor: MID })
      fora.push({ txt: UI.voltarPainel, cor: MID, alvo: 'bio' })
      return fora
    }
    const { q, a } = ORACLE[escolha]
    fora.push({ txt: q, cor: DEEP })
    for (const l of quebrar(g, a[bandaDe(vigilAtual)], util)) {
      if (fora.length < CAIXA.linhas - 1) fora.push({ txt: l, cor: INK })
    }
    while (fora.length < CAIXA.linhas - 1) fora.push({ txt: '', cor: MID })
    fora.push({ txt: UI.outraPergunta, cor: MID, alvo: 'perguntas' })
    return fora
  }

  /* A Vigilia do ultimo quadro pintado. A resposta e lida dela e o acerto do clique
     precisa da mesma lista que o desenho montou, entao os dois leem daqui. */
  let vigilAtual = 0

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

  /** A linha em `px, py` **se ela fizer alguma coisa**; senao `-1`. */
  function alvoEm(px, py) {
    const i = linhaEm(px, py)
    if (i < 0) return -1
    const L = linhas(medida(), '', '', '', util())
    return L[i] && L[i].alvo !== undefined ? i : -1
  }

  /* um contexto so para medir: `quebrar` mede, e medir no contexto que esta pintando
     obrigaria a montar a lista no meio do desenho */
  const cm = document.createElement('canvas').getContext('2d')
  const medida = () => { cm.font = FONTE; return cm }
  const util = () => w - CAIXA.pad * 2 - 12

  /** O ponteiro sobre a caixa. Devolve se ha algo clicavel sob ele, para o cursor. */
  function apontar(px, py) {
    sobre = alvoEm(px, py)
    return sobre >= 0
  }

  /** Um clique na caixa. `true` quando ele foi consumido aqui. */
  function clicar(px, py) {
    const i = alvoEm(px, py)
    if (i < 0) return false
    const alvo = linhas(medida(), '', '', '', util())[i].alvo
    if (alvo === 'abrir') { estado = PERGUNTAS; reacao.trigger() }
    else if (alvo === 'bio') { estado = BIO; escolha = -1 }
    else if (alvo === 'perguntas') { estado = PERGUNTAS; escolha = -1 }
    else { escolha = alvo; estado = RESPOSTA; reacao.trigger() }
    sobre = -1
    return true
  }

  /** Volta ao comeco. Sair de perto nao deve guardar uma consulta pela metade. */
  function limpar() { estado = BIO; escolha = -1; sobre = -1 }

  /** A caixa: a bio, as quatro perguntas, ou a resposta que a Vigilia escolheu. */
  function caixa(INK, MID, DEEP, BG) {
    g.fillStyle = BG
    g.fillRect(0, CX_Y, w, CX_H)
    /* uma regua e nao um contorno: a caixa e o rodape do painel, nao uma janela sobre
       ele, e quatro lados desenhariam uma janela */
    g.fillStyle = DEEP
    g.fillRect(CAIXA.pad, CX_Y, w - CAIXA.pad * 2, 1)

    g.font = FONTE
    g.textAlign = 'left'
    const x = CAIXA.pad + 2
    const U = util()
    const L = linhas(g, INK, MID, DEEP, U)
    for (let i = 0; i < L.length; i++) {
      if (!L[i].txt) continue
      const clicavel = L[i].alvo !== undefined
      g.fillStyle = clicavel && i === sobre ? INK : L[i].cor
      const marca = clicavel && typeof L[i].alvo === 'number' ? (i === sobre ? '\u203a ' : '  ') : ''
      /* o orcamento e o que sobra DEPOIS da marca: cortar o texto para 216 e depois
         somar a seta a poe fora da caixa, que e o corte silencioso ao contrario */
      const cabe = U - (marca ? g.measureText(marca).width : 0)
      g.fillText(marca + encurtar(g, L[i].txt, cabe), x, CX_Y + CAIXA.pad + 11 + i * CAIXA.lh)
    }
  }

  function pintar(t, { vigil = 0 } = {}) {
    const P = {}
    for (const k of ['ink', 'mid', 'dim', 'bg']) P[k] = mix(hex(DIA[k]), hex(NOITE[k]), vigil)
    const INK = cor(P.ink), MID = cor(P.mid), DEEP = cor(P.dim), BG = cor(P.bg)

    vigilAtual = vigil
    g.fillStyle = BG; g.fillRect(0, 0, w, h)
    drawSprite(g, REACTION_FRAMES[reacao.frameAt(t * 1000)], bx, by, S, INK, MID, DEEP, BG)
    caixa(INK, MID, DEEP, BG)

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
    /* e ela não desenha com um relógio quebrado: `createLinearGradient` **lança** com
       um valor não-finito, e uma exceção aqui derruba o quadro inteiro. O painel é a
       última coisa acesa do quarto na Vigília cheia; ele pode ficar sem varredura, não
       pode apagar a cena. */
    if (!Number.isFinite(t)) return
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
