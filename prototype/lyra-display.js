/**
 * A Lyra como **mostrador**, e não como quadro a óleo.
 *
 * O `CONTEXT.md` a chama de a Maga que habita a Tela. Até aqui isso era metáfora: ela
 * era uma pintura procedural pendurada na parede, declarada arte provisória no
 * ADR-0013, esperando uma versão à mão que alguém teria de pintar. Uma tela dentro da
 * moldura torna a frase literal — e dissolve duas dependências de uma vez: não há mais
 * óleo a encomendar, e não há mais a exigência de que a arte final chegasse com as
 * íris em camada separada para o olhar sobreviver. Num desenho, o olho é desenhado.
 *
 * ## Por que ela fala a paleta da Tela
 *
 * `screen/render.js` tem duas paletas e cruza entre elas conforme a Vigília: de dia
 * osso sobre preto, de noite brasa sobre preto. Elas estão repetidas aqui de
 * propósito, e não importadas: `render.js` as guarda em `let` de módulo que ele
 * reescreve a cada quadro conforme o fader, e importar aquilo seria amarrar o rosto
 * dela ao relógio de um outro mostrador. O que se compartilha é a **decisão de cor**,
 * não a variável.
 *
 * ## O que anda
 *
 * Quatro coisas, e nenhuma delas é a figura inteira: um retrato que se mexe muito lê
 * como avatar, não como quadro. O olhar segue quem chama; a pálpebra fecha de vez em
 * quando; a figura respira um pixel; e uma varredura desce devagar, que é o único
 * sinal de que aquilo é um painel e não uma pintura iluminada.
 */

const DIA   = { ink: '#E9E3D2', mid: '#8A8470', dim: '#5E5A4C', bg: '#0A0B09', gold: '#C9BE96' }
const NOITE = { ink: '#DCD6C6', mid: '#9C5A4E', dim: '#6E1810', bg: '#08070A', gold: '#F03A22' }

/**
 * A paleta anda em **triplas**, e a string CSS sai so na borda.
 *
 * A primeira versao guardava as cores como `rgb(...)` ja formatado e depois chamava a
 * mistura de novo sobre elas — para escurecer o manto, para clarear a pele. `hex()`
 * entao lia `parseInt('gb', 16)` no meio de `rgb(10,11,9)` e devolvia `NaN`, e a cena
 * inteira morria num `addColorStop` com `rgb(NaN,NaN,2)`. Uma cor que ainda vai ser
 * misturada nao pode ser uma string; quem mistura trabalha em numeros e quem pinta
 * recebe texto.
 */
const hex = c => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]
const mix = (A, B, k) => A.map((v, i) => v + (B[i] - v) * k)
const cor = T => `rgb(${T[0] | 0},${T[1] | 0},${T[2] | 0})`
const corA = (T, a) => `rgba(${T[0] | 0},${T[1] | 0},${T[2] | 0},${a})`

/**
 * A anatomia, em frações da largura.
 *
 * Escrita como fração e não em pixels porque o tamanho do painel é uma decisão de
 * quem monta — a abertura da moldura tem 0,742 de proporção e o número de pixels que
 * cabe ali é orçamento, não desenho.
 */
const A = {
  cx: .50,
  cabecaY: .38, cabecaR: .152,          // centro e raio da cabeça
  olhoDX: .34, olhoDY: .06,             // deslocamento do olho, em raios de cabeça
  orbitaX: .19, orbitaY: .115,          // a órbita, em raios de cabeça
  iris: .068,
  passeioX: .105, passeioY: .038,       // quanto a íris anda dentro da órbita
}

export function criarLyra({ w = 240, h = 324 } = {}) {
  const c = document.createElement('canvas')
  c.width = w; c.height = h
  const g = c.getContext('2d')
  g.imageSmoothingEnabled = false

  /* A piscada não é periódica. Um olho que fecha a cada N segundos é um pisca-pisca;
     o que lê como vivo é um intervalo sorteado entre dois e sete segundos, com a
     pálpebra levando 120 ms para descer e subir. */
  let proximaPiscada = 2 + Math.random() * 5
  let piscando = -1

  function pintar(t, { vigil = 0, olhar = [0, 0], dt = 0 } = {}) {
    const P = {}
    for (const k of ['ink', 'mid', 'dim', 'bg', 'gold']) P[k] = mix(hex(DIA[k]), hex(NOITE[k]), vigil)

    if (piscando >= 0) { piscando += dt; if (piscando > .24) piscando = -1 }
    else { proximaPiscada -= dt; if (proximaPiscada <= 0) { piscando = 0; proximaPiscada = 2 + Math.random() * 5 } }
    /* 0 aberto, 1 fechado — sobe e desce em meio ciclo de seno */
    const palpebra = piscando < 0 ? 0 : Math.sin((piscando / .24) * Math.PI)

    /* a respiração: um pixel, devagar. Menos que isso não se vê e mais vira balanço */
    const resp = Math.sin(t * .55) * (h * .003)

    const cx = w * A.cx, r = w * A.cabecaR, cy = h * A.cabecaY + resp

    g.fillStyle = cor(P.bg); g.fillRect(0, 0, w, h)

    /**
     * **Um foco, e o resto engolido.**
     *
     * A primeira montagem pintou o rosto como uma elipse clara inteira e o resultado
     * foi um ovo branco: a superficie e emissiva, entao um tom medio que parece
     * discreto numa tela de desenho vira lampada quando o material a emite a 0,9. O
     * mostrador da Unidade nao tem esse problema porque e quase todo preto com letra
     * clara em cima — quatro quintos de escuridao e uma escolha, nao um acidente.
     *
     * Entao aqui vale a mesma regra do quarto: **uma fonte em cima e a esquerda, e
     * tudo o mais afogado.** O rosto tem base quase preta e recebe luz so onde a luz
     * bate, por um degrade recortado dentro da propria silhueta.
     */
    const luz = { x: cx - r * .52, y: cy - r * .78 }

    /**
     * O brilho de fosforo atras dela — **apertado, e fraco.**
     *
     * A primeira versao cobria o painel inteiro com um degrade que comecava em 90% de
     * alfa sobre um cinza. Isso e um **piso de preto levantado**, que e a definicao de
     * nevoa, e e o mesmo erro que o ADR-0021 achou no `lift` do grade: numa imagem
     * feita de escuridao nao existe assunto claro que justifique erguer as sombras, e
     * o resultado le como neblina por cima de tudo. Ficou um nucleo curto e
     * transparente: o suficiente para a silhueta do chapeu ter contra o que aparecer,
     * e nada alem.
     */
    const halo = g.createRadialGradient(luz.x, luz.y, r * .1, cx, cy + r * .1, h * .30)
    halo.addColorStop(0, corA(mix(P.bg, P.dim, .55), .40))
    halo.addColorStop(.55, corA(mix(P.bg, P.dim, .20), .22))
    halo.addColorStop(1, corA(P.bg, 0))
    g.fillStyle = halo; g.fillRect(0, 0, w, h)

    /**
     * **Num painel escuro a forma se le pela borda, nao pelo preenchimento.**
     *
     * A rodada anterior afogou o fundo corretamente e com isso perdeu o chapeu: uma
     * massa escura contra um fundo escuro nao tem silhueta, e sobrou a fita de ouro
     * flutuando sozinha como uma auréola. Preenchimento nao resolve — clarear o
     * chapeu para ele aparecer traz a nevoa de volta.
     *
     * O que resolve e o que a pintura tenebrista faz: **um fio de luz na aresta virada
     * para a fonte.** Custa um `stroke` por forma, mantem o corpo da forma no preto, e
     * e o unico jeito de um objeto escuro existir num quadro escuro.
     */
    const borda = (traco, forca = .55, larg = 1.6) => {
      g.save()
      g.strokeStyle = corA(mix(P.bg, P.mid, forca), .9)
      g.lineWidth = Math.max(1.2, w * .0055 * larg)
      g.beginPath(); traco(); g.stroke()
      g.restore()
    }

    /* o manto: a massa mais escura, e a base de tudo */
    g.fillStyle = cor(mix(P.bg, P.dim, .24))
    g.beginPath()
    g.moveTo(cx - r * 2.6, h)
    g.quadraticCurveTo(cx - r * 1.5, cy + r * 1.5, cx - r * .70, cy + r * 1.02)
    g.lineTo(cx + r * .70, cy + r * 1.02)
    g.quadraticCurveTo(cx + r * 1.5, cy + r * 1.5, cx + r * 2.6, h)
    g.closePath(); g.fill()


    /* o cabelo, caindo dos dois lados e passando do queixo */
    g.fillStyle = cor(mix(P.bg, P.dim, .17))
    for (const s of [-1, 1]) {
      g.beginPath()
      g.moveTo(cx + s * r * 1.00, cy - r * .2)
      g.quadraticCurveTo(cx + s * r * 1.30, cy + r * 1.9, cx + s * r * .76, cy + r * 2.4)
      g.lineTo(cx + s * r * .30, cy + r * 2.2)
      g.quadraticCurveTo(cx + s * r * .88, cy + r * .9, cx + s * r * .80, cy)
      g.closePath(); g.fill()
      if (s < 0) borda(() => {
        g.moveTo(cx - r * 1.00, cy - r * .2)
        g.quadraticCurveTo(cx - r * 1.30, cy + r * 1.9, cx - r * .76, cy + r * 2.4)
      }, .30)
    }

    /* ---- o rosto: base afogada, luz recortada dentro dele ---- */
    const rostoY = cy + r * .12, rostoRX = r * .72, rostoRY = r * 1.00
    g.fillStyle = cor(mix(P.bg, P.dim, .34))
    g.beginPath(); g.ellipse(cx, rostoY, rostoRX, rostoRY, 0, 0, 6.2832); g.fill()
    g.save()
    g.beginPath(); g.ellipse(cx, rostoY, rostoRX, rostoRY, 0, 0, 6.2832); g.clip()
    const face = g.createRadialGradient(luz.x, luz.y, r * .08, luz.x, luz.y, r * 1.9)
    face.addColorStop(0, corA(mix(P.mid, P.ink, .10), .86))
    face.addColorStop(.34, corA(P.mid, .38))
    face.addColorStop(1, corA(P.mid, 0))
    g.fillStyle = face; g.fillRect(cx - r, rostoY - r * 1.2, r * 2, r * 2.4)
    g.restore()

    /* ---- os olhos ---- */
    const passX = r * A.passeioX, passY = r * A.passeioY
    const gx = Math.max(-1, Math.min(1, olhar[0])) * passX
    const gy = Math.max(-1, Math.min(1, olhar[1])) * passY
    for (const s of [-1, 1]) {
      const ex = cx + s * r * A.olhoDX, ey = cy + r * A.olhoDY
      /* a orbita vai **abaixo** do fundo: e o que faz o olho ser uma cavidade e nao
         um adesivo colado na cara */
      g.fillStyle = cor(mix(P.bg, P.dim, -.10))
      g.beginPath(); g.ellipse(ex, ey, r * A.orbitaX, r * A.orbitaY, 0, 0, 6.2832); g.fill()
      if (palpebra < .82) {
        g.save()
        g.beginPath(); g.ellipse(ex, ey, r * A.orbitaX * .96, r * A.orbitaY * .94, 0, 0, 6.2832); g.clip()
        /* a iris: ouro, porque e a nota que ela divide com a fita do chapeu e com a
           moldura em volta — a unica cor saturada do quadro inteiro */
        g.fillStyle = cor(mix(P.bg, P.gold, .26))
        g.beginPath(); g.arc(ex + gx, ey - gy, r * A.iris * 1.26, 0, 6.2832); g.fill()
        g.fillStyle = cor(mix(P.bg, P.gold, .60))
        g.beginPath(); g.arc(ex + gx, ey - gy, r * A.iris, 0, 6.2832); g.fill()
        /* a pupila, e ela e o preto do painel */
        g.fillStyle = cor(P.bg)
        g.beginPath(); g.arc(ex + gx, ey - gy, r * A.iris * .44, 0, 6.2832); g.fill()
        /* o brilho, pequeno e do lado da luz */
        g.fillStyle = corA(P.ink, .92)
        g.beginPath(); g.arc(ex + gx - r * .028, ey - gy - r * .030, r * .019, 0, 6.2832); g.fill()
        g.restore()
      }
      /* a palpebra desce por cima, na cor da pele no escuro — fechar um olho e
         cobri-lo, e nao apaga-lo: um olho apagado vira um buraco na cara */
      if (palpebra > 0) {
        g.fillStyle = cor(mix(P.bg, P.mid, .34))
        g.beginPath()
        g.ellipse(ex, ey - r * A.orbitaY * (1 - palpebra), r * A.orbitaX * 1.04, r * A.orbitaY * palpebra * 1.08, 0, 0, 6.2832)
        g.fill()
      }
    }

    /* ---- o chapeu: a aba e a silhueta mais larga do desenho, e e ela que diz maga ---- */
    g.fillStyle = cor(mix(P.bg, P.dim, .21))
    g.beginPath()
    g.ellipse(cx - r * .06, cy - r * .86, r * 1.74, r * .33, -.06, 0, 6.2832); g.fill()
    g.beginPath()
    g.moveTo(cx - r * .64, cy - r * .92)
    g.quadraticCurveTo(cx - r * .30, cy - r * 2.5, cx + r * .46, cy - r * 1.90)
    g.quadraticCurveTo(cx + r * .68, cy - r * 1.20, cx + r * .64, cy - r * .88)
    g.closePath(); g.fill()
    /* a aresta de cima da aba: a linha mais longa do desenho, e a que diz "chapeu de
       aba larga" antes de qualquer outra coisa ser legivel */
    borda(() => g.ellipse(cx - r * .06, cy - r * .86, r * 1.74, r * .33, -.06, Math.PI * 1.02, Math.PI * 1.98), .48, 1.0)
    /* e a copa, so do lado da luz */
    borda(() => {
      g.moveTo(cx - r * .64, cy - r * .92)
      g.quadraticCurveTo(cx - r * .30, cy - r * 2.5, cx + r * .30, cy - r * 2.02)
    }, .36)
    /* a fita: sai do lado da luz e some do outro, como tudo aqui */
    const fita = g.createLinearGradient(cx - r * .6, 0, cx + r * .6, 0)
    fita.addColorStop(0, corA(P.gold, .85))
    fita.addColorStop(.55, corA(P.gold, .40))
    fita.addColorStop(1, corA(P.gold, .06))
    g.strokeStyle = fita; g.lineWidth = Math.max(2, w * .011)
    g.beginPath()
    g.moveTo(cx - r * .60, cy - r * .98)
    g.quadraticCurveTo(cx, cy - r * 1.24, cx + r * .62, cy - r * .96)
    g.stroke()

    /**
     * A varredura, e ela é o que separa mostrador de pintura iluminada.
     *
     * Uma linha só, clara, descendo devagar — 11 segundos para atravessar. Rápida
     * demais lê como falha de sinal; parada não lê como nada. `display.js` já põe a
     * grade fixa de pixels e o brilho por cima disto; esta é a única parte do painel
     * que **anda**, e por isso mora aqui e não lá.
     */
    const varre = ((t / 11) % 1) * (h + 60) - 30
    const faixa = g.createLinearGradient(0, varre - 22, 0, varre + 22)
    faixa.addColorStop(0, 'rgba(255,255,255,0)')
    faixa.addColorStop(.5, 'rgba(255,255,255,.055)')
    faixa.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = faixa; g.fillRect(0, varre - 22, w, 44)

    /* a queda nas bordas: o painel não acende até o canto */
    const vig = g.createRadialGradient(w / 2, h * .42, h * .14, w / 2, h * .42, h * .70)
    vig.addColorStop(0, 'rgba(0,0,0,0)')
    vig.addColorStop(1, 'rgba(0,0,0,.86)')
    g.fillStyle = vig; g.fillRect(0, 0, w, h)
  }

  pintar(0, {})
  return { canvas: c, pintar, width: w, height: h }
}
