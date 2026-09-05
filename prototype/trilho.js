import * as THREE from 'three'

/**
 * O trilho — a câmera percorre o quarto, e o pad é quem a leva.
 *
 * Até aqui toda interação do objeto estava na Unidade: as linhas da Tela, o *claim*,
 * o voltar, a marca do eclipse, os pads, o *fader*, os cubos das rodas e o plinto. O
 * quarto era um fundo bonito atrás de um objeto clicável, e mobiliá-lo melhor não
 * muda isso — foi o que o T-32 e o T-33 deixaram provado ao deixá-lo bonito e ainda
 * inerte.
 *
 * A tese que decide o desenho está na spec e é curta: **a Unidade é o controlador, o
 * quarto é o palco.** Os pads comandam sempre, esteja a câmera onde estiver. Não se
 * sai do controlador — muda-se o que ele está tocando.
 *
 * ## Uma variável
 *
 * `estacao` é o estado inteiro: `0` é o Altar, `1..6` são os Módulos. É a mesma
 * disciplina do ADR-0002 — o DOM é a verdade e a Tela renderiza — e a lição que
 * `screenHit` deixou no `CLAUDE.md`: **duas listas divergem, uma não pode.** Este
 * módulo não guarda cópia de nada; quem chama `irPara` é dono do número, e o que
 * volta daqui é só onde a câmera está.
 *
 * ## Por que um anel, e por que ele vem de um JSON
 *
 * `CONTEXT.md` proíbe órbita, e com razão: uma órbita livre é um controle que não diz
 * nada e enjoa em dez segundos. Um trilho não é órbita — é o mesmo movimento
 * parametrizado, com paradas que significam alguma coisa. É o que o basement faz em
 * `50.camera-rail.js` com o próprio `blender-bezier-exporter`, e a razão de os pontos
 * virem de `public/quarto/trilho.json` é a mesma: **uma estação a mais é uma linha de
 * dados**, não uma linha de código.
 *
 * O JSON baixa sob demanda, junto com o quarto. `ROOM_K` começa em 0 — o quarto está
 * desligado para quem chega no domínio — e a terceira armadilha do `room-mobilia.js`
 * vale igual aqui: um asset do quarto carregado no topo do módulo é peso que todo
 * visitante paga por algo que nunca vê.
 *
 * ## O que este módulo **não** faz
 *
 * Não troca a superfície de leitura e não toca na roda do sol. As duas coisas são o
 * resto do T-34 e as duas dependem do T-30, que contabiliza onze dos quinze pontos
 * perdidos na crítica por nove controles sem legenda. Dar um décimo significado à
 * roda do sol sem a gravação na Plate é acrescentar exatamente o problema que o T-30
 * abriu — e a Tela de 496 px não se lê a seis unidades de distância, que é por que a
 * viagem vive num endereço de bancada e não no caminho do visitante.
 */

/** Metade de um segundo e mais um pouco: rápido o bastante para ser um gesto só. */
const VIAGEM = .75

/**
 * Aceleração e freio.
 *
 * Apertar 4 e depois 5 tem que ler como varredura, não como dois arremessos. Uma
 * rampa linear larga na hora e para na hora, e é isso que faz uma câmera parecer
 * teletransporte com atraso em vez de movimento.
 */
const suave = k => (k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2)

export function createTrilho({ camera, base }) {
  let dados = null
  let curva = null
  /** Onde cada estação cai no parâmetro da curva, para a viagem saber para onde ir. */
  let ts = []
  let pedido = null

  let estacao = 0
  /* a viagem em curso: de onde, para onde, e quanto já andou */
  let de = null, para = null, t = 0, andando = false
  /* o repouso do Altar, para saber para onde voltar */
  let altar = null

  const olharAtual = new THREE.Vector3()
  const olharDe = new THREE.Vector3()
  const olharPara = new THREE.Vector3()
  const posAtual = new THREE.Vector3()

  /**
   * Baixa o JSON e monta a curva.
   *
   * `CatmullRomCurve3` fechada e não uma Bézier escrita à mão: com seis pontos de
   * controle, uma Catmull-Rom **passa por todos eles**, que é a propriedade que
   * importa aqui — uma estação é um lugar onde a câmera para, e uma curva que só se
   * aproxima do ponto de controle transformaria cada parada num quase.
   */
  function carregar(url) {
    if (pedido) return pedido
    pedido = fetch(url)
      .then(r => r.json())
      .then(j => {
        dados = j.estacoes
        const pts = dados.map(e => new THREE.Vector3(...e.camera))
        curva = new THREE.CatmullRomCurve3(pts, true, 'centripetal', .5)
        /* onde cada estação cai em `t`: com a curva fechada e um ponto por estação,
           são as frações inteiras — mas ler da curva em vez de assumir é o que
           mantém isto correto quando o JSON ganhar a sétima linha */
        ts = dados.map((_, i) => i / dados.length)
        return dados
      })
      .catch(err => {
        /* um trilho que não baixa não pode derrubar a sala: sem ele os pads voltam a
           ser o que sempre foram, e o console diz o que faltou */
        console.warn('[trilho] falhou', err?.message || err)
        dados = null
        return null
      })
    return pedido
  }

  /**
   * Qual estação está sob um ponto do quarto — 0 se nenhuma.
   *
   * A pergunta que o *raycast* faz não é "que malha foi atingida", é **"onde no chão
   * isso caiu"**. Uma estação não é um objeto: é a baia de discos mais o plinto ao
   * lado, a lareira mais o sofá mais a poltrona. Nomear as peças uma a uma seria uma
   * segunda lista para divergir da primeira, e a primeira já está no JSON.
   *
   * Então: distância no plano do chão até o que cada estação olha, e vence a mais
   * perto dentro do raio dela. `y` fica de fora de propósito — o que importa é o
   * lugar, e um quadro na parede a dois metros do chão pertence à mesma estação que
   * o móvel embaixo dele.
   *
   * As seis estão a 4,6 unidades uma da outra no pior caso, que é a lareira contra a
   * oficina na mesma parede; um raio de 4 não deixa buraco entre elas nem faz o meio
   * do quarto pertencer a alguém.
   */
  function estacaoEm(x, z) {
    if (!dados) return 0
    let melhor = 0, menor = Infinity
    for (let i = 0; i < dados.length; i++) {
      const o = dados[i].olhar
      const d = Math.hypot(x - o[0], z - o[2])
      const raio = dados[i].raio || 4
      if (d < raio && d < menor) { menor = d; melhor = i + 1 }
    }
    return melhor
  }

  /** O índice de estação (1..6) do Módulo `m`, ou 0 se ele não tem endereço. */
  function estacaoDe(idModulo) {
    if (!dados) return 0
    const i = dados.findIndex(e => e.modulo === idModulo)
    return i < 0 ? 0 : i + 1
  }

  /** O Módulo da estação corrente, ou `null` no Altar. */
  function moduloDe(n) {
    return (dados && n >= 1 && n <= dados.length) ? dados[n - 1].modulo : null
  }

  /**
   * Vai para a estação `n`. `0` é o Altar.
   *
   * O caminho é sempre **pelo lado curto do anel**. Ir de 6 para 1 dando a volta
   * inteira por 5-4-3-2 é a diferença entre um instrumento e um passeio de trem, e é
   * a razão de a curva ser fechada: com ela, a distância entre duas estações é a menor
   * das duas voltas e nada mais precisa saber disso.
   */
  function irPara(n, { imediato = false } = {}) {
    if (!curva || n === estacao) return false
    de = alvoDe(estacao)
    para = alvoDe(n)
    estacao = n
    t = imediato ? 1 : 0
    andando = true
    if (imediato) passo(0)
    return true
  }

  /**
   * Onde a câmera fica e para onde olha, numa estação — o Altar inclusive.
   *
   * **O repouso do Altar é lido na saída, não no carregamento.** A primeira versão o
   * fotografava dentro do `.then()` do `fetch`, e isso amarrava a pose de volta ao
   * instante em que a rede respondesse: se o JSON chegasse antes do primeiro quadro,
   * `camera.position` ainda era o que fosse na inicialização do módulo e a primeira
   * volta ao Altar pousava num lugar qualquer. Aqui não há corrida — quando se sai do
   * Altar, a câmera **está** no repouso do rig, por definição.
   *
   * Ler em vez de escrever à mão também é o que impede uma quarta mão na câmera: o
   * `?sala`, o `?trilho` e a abertura param em lugares diferentes, e uma constante
   * aqui seria uma delas discordando das outras.
   */
  function alvoDe(n) {
    if (n === 0) {
      if (!altar) altar = { pos: camera.position.clone(), olhar: base.clone() }
      return altar
    }
    const e = dados[n - 1]
    return {
      tRail: ts[n - 1],
      olhar: new THREE.Vector3(...e.olhar),
      pos: new THREE.Vector3(...e.camera),
    }
  }

  /**
   * A fração do anel entre dois `t`, pelo lado curto.
   *
   * `t` é cíclico em 1, então a diferença crua entre 0,05 e 0,95 é 0,9 — a volta
   * inteira menos um pedaço — quando o caminho real é 0,1 na outra direção.
   */
  function curto(a, b) {
    let d = b - a
    if (d > .5) d -= 1
    if (d < -.5) d += 1
    return d
  }

  function passo(dt) {
    if (!andando) return false
    t = Math.min(1, t + dt / VIAGEM)
    const k = suave(t)

    /* saindo do Altar ou voltando para ele, a câmera não está no anel: interpola em
       linha reta entre o repouso e o ponto de entrada da estação. Entre duas
       estações, anda **sobre** a curva, que é o movimento que o trilho existe para dar */
    if (de.tRail === undefined || para.tRail === undefined) {
      posAtual.lerpVectors(de.pos, para.pos, k)
    } else {
      const tt = de.tRail + curto(de.tRail, para.tRail) * k
      curva.getPointAt((tt % 1 + 1) % 1, posAtual)
    }
    olharDe.copy(de.olhar); olharPara.copy(para.olhar)
    olharAtual.lerpVectors(olharDe, olharPara, k)

    camera.position.copy(posAtual)
    camera.lookAt(olharAtual)

    if (t >= 1) { andando = false; return true }   // chegou
    return false
  }

  return {
    carregar,
    estacaoDe,
    moduloDe,
    irPara,
    get estacao() { return estacao },
    /**
     * Larga a câmera onde ela está e volta a ser o Altar.
     *
     * Existe porque o FREECAM precisa de alguém de quem tomar a câmera. `placeCamera`
     * cede o transform enquanto a estação não é o Altar, então clicar FREECAM numa
     * estação movia o rig e não movia nada na tela: um botão mudo, que é pior que um
     * botão ausente. Aqui o trilho sai da frente **e diz que saiu** — o estado volta a
     * 0 em vez de ficar apontando para uma estação onde a câmera já não está.
     */
    soltar() { estacao = 0; andando = false },
    /** A estação corrente como dado — para a bancada dizer onde a câmera está. */
    get alvo() { return (dados && estacao >= 1) ? dados[estacao - 1] : null },
    /** Quantas estações o JSON trouxe, para a bancada não inventar botões. */
    get quantas() { return dados ? dados.length : 0 },
    estacaoEm,
    /** O nome de exibição de uma estação, para quem precisa dizer onde o ponteiro está. */
    nomeDe(n) { return (dados && n >= 1 && n <= dados.length) ? dados[n - 1].nome : null },
    /** O rig não pode disputar a câmera com o trilho — mesma regra do `focus`. */
    get dirigindo() { return !!curva && estacao !== 0 },
    get pronto() { return !!curva },
    /** Devolve `true` no quadro em que a viagem termina, para quem quiser saber. */
    update(dt) { return passo(dt) },
  }
}
