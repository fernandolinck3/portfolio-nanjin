/**
 * O objeto faz som — seis vozes, oito passos, e nenhum byte baixado.
 *
 * Um quarto só de navegação com propósito é um menu com paredes. O que faz alguém
 * ficar é a parte que não serve para nada, e num portfólio em forma de CDJ a parte
 * que não serve para nada é usar o objeto **como instrumento**. É a única ideia da
 * lista que fecha a piada.
 *
 * ## A regra dura
 *
 * **Nada de placar.** Sem pontuação, sem tempo, sem ranking, sem tela de resultado. O
 * momento em que isto vira jogo com objetivo é o momento em que passa a competir com
 * o portfólio em vez de segurar alguém nele. Não é uma preferência: é a única regra
 * dura do T-35, e ela é o que separa um instrumento de um brinquedo com fim.
 *
 * Consequência prática: **o espelho não fala em som.** Nada que sai daqui é conteúdo,
 * então nada disto entra em `modules.ts` nem no espelho do DOM. Se um dia parecer que
 * precisa entrar, é sinal de que virou conteúdo e a regra do placar foi quebrada.
 *
 * ## Zero assets
 *
 * Osciladores e envelopes. Um bumbo, um estalo, dois tons e dois ruídos filtrados — as
 * seis vozes cabem em oitenta linhas de matemática e o projeto não baixa um arquivo de
 * áudio. Para escala: a trilha do basement pesa 2,36 MB, contra 915 KB da cena inteira
 * deste objeto. Um eixo novo inteiro entra aqui sem custar um quilobyte de rede.
 *
 * O ruído é a única coisa que se paga uma vez: meio segundo de branco num buffer, ~22
 * mil amostras, gerado na primeira nota e reusado por todas as outras.
 *
 * ## O contexto nasce no primeiro toque
 *
 * Não é concessão à política de *autoplay*, é o que ela exige — e um pad já é o gesto.
 * Antes do primeiro toque não existe `AudioContext`, não existe laço e não existe
 * custo. Som que chega sem ser pedido é o jeito mais rápido de perder alguém.
 */

/** Oito passos em colcheias a 96 — o laço fecha em 2,5 s, que é a respiração da sala. */
const BPM = 96
const PASSOS = 8
const DUR = 60 / BPM / 2

/* o agendador olha 120 ms à frente e acorda a cada 25: `setTimeout` erra dezenas de
   milissegundos e o relógio do áudio não erra, então quem marca o tempo é ele */
const OLHAR = .12
const ACORDAR = 25

export function createSom({ aoPasso } = {}) {
  let ctx = null, saida = null, ruido = null
  let tocando = false, passo = 0, quando = 0, timer = 0
  let mudo = false
  try { mudo = localStorage.getItem('tenebrae.mudo') === '1' } catch { /* modo privado */ }

  /** `padrao[voz][passo]` — seis pistas de oito. */
  const padrao = Array.from({ length: 6 }, () => new Array(PASSOS).fill(0))
  /** quais vozes estão gravando agora, porque um pad está sendo segurado */
  const gravando = new Set()

  function nascer() {
    if (ctx) return ctx
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    ctx = new AC()
    saida = ctx.createGain()
    /* headroom: seis vozes somadas em fase estouram o barramento, e um clipe digital
       num objeto que se apresenta como instrumento é a pior nota que ele pode dar */
    saida.gain.value = .22
    saida.connect(ctx.destination)
    const n = Math.floor(ctx.sampleRate * .5)
    ruido = ctx.createBuffer(1, n, ctx.sampleRate)
    const d = ruido.getChannelData(0)
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1
    return ctx
  }

  /* ------------------------------------------------------------------ *
   * As seis vozes
   * ------------------------------------------------------------------ */

  /** Envelope de percussão: sobe em 3 ms e cai exponencialmente. */
  function env(g, t, pico, queda) {
    g.gain.setValueAtTime(.0001, t)
    g.gain.exponentialRampToValueAtTime(pico, t + .003)
    g.gain.exponentialRampToValueAtTime(.0001, t + queda)
  }

  /** Bumbo: seno com a altura caindo — é o corpo do golpe, não o timbre. */
  function bumbo(t) {
    const o = ctx.createOscillator(), g = ctx.createGain()
    o.type = 'sine'
    o.frequency.setValueAtTime(132, t)
    o.frequency.exponentialRampToValueAtTime(44, t + .09)
    env(g, t, .9, .34)
    o.connect(g); g.connect(saida); o.start(t); o.stop(t + .4)
  }

  /** Estalo: ruído em passa-faixa estreito e curto, como madeira. */
  function estalo(t) {
    const s = ctx.createBufferSource(); s.buffer = ruido
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1750; f.Q.value = 6
    const g = ctx.createGain(); env(g, t, .55, .09)
    s.connect(f); f.connect(g); g.connect(saida); s.start(t); s.stop(t + .12)
  }

  /**
   * Os dois tons, e eles são as duas Faces.
   *
   * A Lua é triangular e grave, o Sol é dente-de-serra e uma quinta acima: as duas
   * vozes que carregam altura são as duas metades que o crossfader já percorre, e dar
   * a elas a mesma relação que a Vigília tem é de graça.
   */
  function tom(t, hz, tipo) {
    const o = ctx.createOscillator(), g = ctx.createGain()
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 2200
    o.type = tipo; o.frequency.value = hz
    env(g, t, .34, .30)
    o.connect(f); f.connect(g); g.connect(saida); o.start(t); o.stop(t + .36)
  }

  /** Os dois ruídos: um curto e agudo, um longo e aberto. */
  function chiado(t, hz, queda, q) {
    const s = ctx.createBufferSource(); s.buffer = ruido
    const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hz; f.Q.value = q
    const g = ctx.createGain(); env(g, t, .26, queda)
    s.connect(f); f.connect(g); g.connect(saida); s.start(t); s.stop(t + queda + .04)
  }

  const VOZES = [
    t => bumbo(t),                        // QUEM — o corpo
    t => estalo(t),                       // PROJETOS — o estalo
    t => tom(t, 174.6, 'triangle'),       // TRAJETO — a Lua
    t => tom(t, 261.6, 'sawtooth'),       // CRITÉRIOS — o Sol
    t => chiado(t, 6200, .30, .8),        // HABILIDADES — o aberto
    t => chiado(t, 9000, .05, 1.4),       // CONTATO — o fechado
  ]

  /* ------------------------------------------------------------------ *
   * O transporte
   * ------------------------------------------------------------------ */

  function agendar() {
    while (quando < ctx.currentTime + OLHAR) {
      const hits = []
      for (let v = 0; v < 6; v++) {
        /* uma voz que está sendo segurada escreve **e** soa: gravar sem ouvir o que
           se grava é escrever no escuro */
        if (gravando.has(v)) padrao[v][passo] = 1
        if (padrao[v][passo]) hits.push(v)
      }
      if (hits.length && !mudo) for (const v of hits) VOZES[v](quando)
      /* o quarto responde no tempo, e responde mesmo mudo: o pulso é a batida, não o
         som — quem desligou o som não pediu para desligar o objeto */
      if (hits.length) aoPasso?.(passo, hits, quando - ctx.currentTime)
      quando += DUR
      passo = (passo + 1) % PASSOS
    }
  }

  function comecar() {
    if (!nascer()) return
    ctx.resume?.()
    if (tocando) return
    tocando = true
    passo = 0
    quando = ctx.currentTime + .06
    timer = setInterval(agendar, ACORDAR)
  }

  return {
    /**
     * Um toque no pad: soa a voz agora, e liga o transporte se ele ainda não existe.
     *
     * O toque **não** grava. Navegar e gravar seriam o mesmo gesto, e aí não existiria
     * como andar pelo quarto sem escrever no laço — o passeio viraria uma gravação que
     * ninguém pediu.
     */
    tocar(v) {
      comecar()
      if (!ctx || mudo) return
      VOZES[v]?.(ctx.currentTime + .005)
    },
    /** Segurar o pad grava a voz nos passos que passarem enquanto ele estiver embaixo. */
    gravar(v) { comecar(); gravando.add(v) },
    soltar(v) { gravando.delete(v) },
    /** Um toque duplo apaga a pista — desfazer é metade de um instrumento. */
    limpar(v) { padrao[v].fill(0) },
    limparTudo() { for (const p of padrao) p.fill(0) },
    get mudo() { return mudo },
    setMudo(m) {
      mudo = !!m
      try { localStorage.setItem('tenebrae.mudo', mudo ? '1' : '0') } catch { /* modo privado */ }
      return mudo
    },
    get tocando() { return tocando },
    /** O padrão como texto, para a bancada dizer o que está no laço. */
    linhas() { return padrao.map(p => p.map(x => (x ? '■' : '·')).join('')) },
    /**
     * Um passo à mão, sem tocar nada — o `__unit.step()` do laço.
     *
     * O `AudioContext` só sai de `suspended` com um gesto de verdade, e uma aba
     * dirigida por ferramenta não produz um: o relógio do áudio fica congelado, o
     * agendador nunca passa do primeiro passo e **qualquer teste do padrão mede zero e
     * chama de funcionando**. É a mesma armadilha que o `rAF` já armou neste projeto,
     * e a saída é a mesma que o `CLAUDE.md` já escreve: dirigir na mão.
     *
     * Anda a máquina de estados e só ela. Não agenda som e não mexe no relógio, então
     * o que ele prova é o padrão — que é o que precisa de prova.
     */
    avancar(n = 1) {
      for (let i = 0; i < n; i++) {
        for (const v of gravando) padrao[v][passo] = 1
        const hits = []
        for (let v = 0; v < 6; v++) if (padrao[v][passo]) hits.push(v)
        if (hits.length) aoPasso?.(passo, hits, 0)
        passo = (passo + 1) % PASSOS
      }
      return passo
    },
    /** O que o navegador diz do contexto: `suspended` é a resposta honesta num teste. */
    get estado() { return ctx ? ctx.state : 'sem contexto' },
    /** Para o teste: o relógio do áudio, que é o único que não mente. */
    get relogio() { return ctx ? ctx.currentTime : 0 },
    get passo() { return passo },
    parar() { clearInterval(timer); timer = 0; tocando = false },
  }
}
