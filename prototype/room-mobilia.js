import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

/**
 * A mobília da sala — e a primeira geometria deste repositório que não foi escrita.
 *
 * ADR-0004 diz que **a Unidade** é gerada em código: chassi, plate, gravação, jog e
 * controles. Ela não fala do cenário, e a diferença importa. O objeto é a prova de
 * ofício do portfólio e continua procedural; um sofá encostado na parede não prova
 * nada sobre ninguém, e construí-lo à mão custou, medido em sessão, mais tempo do que
 * o quarto inteiro tinha para gastar. Um Chesterfield é uma superfície contínua com
 * capitonê — caixas deformadas empilhadas chegam perto e param, e "perto e para" é o
 * pior lugar para um móvel estar.
 *
 * Então: **a Unidade é escrita, o cenário é modelado.** Ver `docs/adr/0029`.
 *
 * Os arquivos vêm da Poly Haven sob CC0, ficam em `public/mobilia/` com a procedência
 * ao lado deles, e somam 2,3 MB — contra os 11 MB que `public/` já carrega em HDRI,
 * texturas, arte de deck e Works. Não existe teto de peso escrito neste projeto; o
 * orçamento de `docs/realism-budget.md` é de draw calls, luzes e megapixels, e oito
 * malhas estáticas com um mapa de cor cada não mexem em nenhum dos três.
 *
 * ## Por que `MeshStandardMaterial` e não o bake nos vértices
 *
 * Os exercícios em `~/dev/estetica-ps1` assam Lambert + falloff na CPU e trocam tudo
 * por `MeshBasicMaterial`: zero luz em tempo real, que é o truque do basement. Aqui
 * isso quebraria a Vigília. `applyVigil` caminha `key`, `pictureLight`, as Velas e o
 * `environmentIntensity` de acordo com o fader, e um móvel assado ficaria aceso
 * exatamente como foi assado enquanto o quarto inteiro apaga em volta dele. O bake é
 * decisão da etapa de luz, no ambiente final, com a Vigília na mesa — não um efeito
 * colateral de importar um sofá.
 *
 * ## Escala
 *
 * A sala não usa metros, e o Altar não serve de régua: ele tem 15,2 por 9 de tampo e é
 * monumental de propósito. A régua é a **porta** de `room-baroque.js` — 3,4 por 6,6 —
 * porque uma porta é o único objeto de escala humana que a sala já tem e ninguém a
 * desenha monumental sem perceber. 6,6 para os 2,05 m de uma porta dá 3,2 unidades por
 * metro, e é esse o número.
 *
 * Cada peça declara a altura **em metros** do móvel real, não um valor achado no olho.
 * É o que faz uma cadeira e um armário terem entre si a relação que teriam num quarto,
 * em vez da relação que teriam numa lista de números escolhidos um a um.
 */
const POR_METRO = 3.2

/** o mapa de cor vem com a peça; o resto do PBR ficou no servidor de propósito */
const ASSET = p => (import.meta.env?.BASE_URL || '/') + 'mobilia/' + p

/**
 * Sombra de contato, e ela é geometria — não é um shadow map.
 *
 * `castOnly(unit, altar, summoning.group)` em `scene.js` existe porque um caster é um
 * segundo desenho por quadro e o único spot da cena está enquadrado justo na Unidade.
 * Nada disso muda por causa da mobília. O que faz um móvel pousar no chão em vez de
 * pairar sobre ele é a mancha escura sob a base, e ela custa um plano.
 */
const HALO = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 128
  const g = c.getContext('2d')
  const r = g.createRadialGradient(64, 64, 0, 64, 64, 64)
  r.addColorStop(0, 'rgba(255,255,255,1)')
  r.addColorStop(.45, 'rgba(255,255,255,.72)')
  r.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = r; g.fillRect(0, 0, 128, 128)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
})()

/* ------------------------------------------------------------------ *
 * Os livros da estante
 * ------------------------------------------------------------------ */

/**
 * Onde ficam as prateleiras de um modelo que ninguém desenhou aqui.
 *
 * Chutar as alturas é o caminho curto para livros flutuando dez centímetros acima da
 * tábua, e a diferença não aparece na câmera de trabalho — aparece quando alguém
 * chega perto. Então mede-se: um histograma dos `y` dos vértices, arredondados a um
 * décimo. Uma tábua horizontal deposita dezenas de vértices exatamente no mesmo plano
 * e um montante vertical não deposita nenhum, então os picos do histograma **são** as
 * prateleiras. Ficam as faces de cima, que é onde um livro se apoia: de cada par
 * topo/base separado por menos que a espessura de uma tábua, o maior.
 */
function prateleiras(raiz) {
  const hist = new Map()
  raiz.updateMatrixWorld(true)
  raiz.traverse(o => {
    if (!o.isMesh) return
    const p = o.geometry.attributes.position
    const v = new THREE.Vector3()
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i).applyMatrix4(o.matrixWorld)
      const k = Math.round(v.y * 10) / 10
      hist.set(k, (hist.get(k) || 0) + 1)
    }
  })
  /* um plano é prateleira quando concentra pelo menos um terço do pico */
  const pico = Math.max(...hist.values())
  const planos = [...hist.entries()]
    .filter(([, n]) => n >= pico / 3)
    .map(([y]) => y)
    .sort((a, b) => a - b)

  /* topo/base da mesma tábua vêm colados; fica o de cima */
  const niveis = []
  for (const y of planos) {
    if (niveis.length && y - niveis[niveis.length - 1] < .22) niveis[niveis.length - 1] = y
    else niveis.push(y)
  }
  /* a última é o topo do móvel, não uma prateleira com vão em cima */
  return niveis.slice(0, -1)
}

/* lombadas: a única cor arbitrária desta sala além dos discos da baia esquerda, e
   pela mesma razão — uma biblioteca de um tom só é papel de parede */
const LOMBADAS = [0x5A2321, 0x2E4750, 0x6B5A3A, 0x3A2E26, 0x7A4A2C, 0x243038, 0x4A3A52]

/**
 * Enche uma estante modelada com volumes escritos, e sai **uma malha só**.
 *
 * Quarenta livros soltos são quarenta draw calls por uma estante que ocupa 3% do
 * quadro, e o orçamento deste projeto é contado em draw calls desde ADR-0019. Cada
 * volume entra como uma caixa transformada, a cor vai no atributo `color` e
 * `mergeGeometries` junta tudo: um desenho, um material.
 *
 * A variação é o ponto. Uma fileira de caixas iguais lê como serrilha, não como
 * livros — o que faz a estante parecer usada é altura desigual, profundidade
 * desigual, um volume tombado onde o vizinho saiu, pilhas deitadas nos vãos e falhas.
 */
function encher(raiz, semente) {
  const niveis = prateleiras(raiz)
  if (!niveis.length) return null

  const cx = new THREE.Box3().setFromObject(raiz)
  /* o eixo curto da caixa é a profundidade da estante; o longo é a fileira */
  const t = cx.getSize(new THREE.Vector3())
  const fundoX = t.x < t.z
  const larg = fundoX ? t.z : t.x          // ao longo da fileira
  const prof = fundoX ? t.x : t.z          // para dentro da estante
  const meio = cx.getCenter(new THREE.Vector3())

  let e = semente
  const r = () => (e = (e * 1664525 + 1013904223) >>> 0) / 4294967296

  const partes = []
  const cor = new THREE.Color()
  const pintar = (g, hex) => {
    cor.setHex(hex)
    const n = g.attributes.position.count
    const c = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) { c[i * 3] = cor.r; c[i * 3 + 1] = cor.g; c[i * 3 + 2] = cor.b }
    g.setAttribute('color', new THREE.BufferAttribute(c, 3))
    return g
  }
  /**
   * A caixa, nos eixos da estante e não nos do `BoxGeometry`.
   *
   * `BoxGeometry(w, h, d)` é largura em **x**, e a fileira desta estante corre em
   * **z**, porque ela está encostada na parede direita e girada um quarto de volta.
   * A primeira versão passou a espessura da lombada como `w` e a profundidade da
   * página como `d` sem olhar para isso, e a estante inteira saiu com os livros
   * deitados de lado. `aoLongo` é ao longo da fileira, `aFundo` é para dentro da
   * estante, e quem decide qual eixo é qual é a própria caixa envolvente do móvel.
   */
  const caixa = (aoLongo, alt, aFundo) => fundoX
    ? new THREE.BoxGeometry(aFundo, alt, aoLongo)
    : new THREE.BoxGeometry(aoLongo, alt, aFundo)

  /* `l` é a posição ao longo da fileira, `d` a distância para dentro, `y` a altura */
  const por = (g, l, y, d, giro) => {
    g.rotateZ(fundoX ? 0 : giro)
    g.rotateX(fundoX ? giro : 0)
    g.translate(fundoX ? meio.x + d : meio.x + l, y, fundoX ? meio.z + l : meio.z + d)
    partes.push(g)
  }

  const MARGEM = .18
  for (const base of niveis) {
    const vao = .74                                   // altura livre média medida
    let l = -larg / 2 + MARGEM
    const fim = larg / 2 - MARGEM
    while (l < fim) {
      /* uma falha, porque estante cheia até a borda é estoque, não biblioteca */
      if (r() < .12) { l += .10 + r() * .22; continue }

      /* uma pilha deitada preenche o vão que a falha abriu */
      if (r() < .16) {
        const w = .30 + r() * .22
        if (l + w > fim) break
        let y = base
        const n = 2 + Math.floor(r() * 3)
        for (let i = 0; i < n; i++) {
          const h = .045 + r() * .02
          const g = caixa(w - i * .03, h, prof * (.52 + r() * .16))
          por(pintar(g, LOMBADAS[Math.floor(r() * LOMBADAS.length)]),
            l + w / 2, y + h / 2, -prof * .06, 0)
          y += h
        }
        l += w + .04
        continue
      }

      const esp = .045 + r() * .055                   // espessura da lombada
      if (l + esp > fim) break
      const alt = vao * (.52 + r() * .34)
      const pf = prof * (.55 + r() * .28)
      /* um tombado a cada tantos, e ele encosta no vizinho: por isso o giro é
         pequeno e o avanço da fileira não o acompanha inteiro */
      const giro = r() < .10 ? (r() < .5 ? -.16 : .16) : 0
      const g = caixa(esp, alt, pf)
      por(pintar(g, LOMBADAS[Math.floor(r() * LOMBADAS.length)]),
        l + esp / 2, base + alt / 2 + Math.abs(giro) * .12, -prof * .04, giro)
      l += esp + (giro ? .03 : .006)
    }
  }

  if (!partes.length) return null
  const m = new THREE.Mesh(mergeGeometries(partes, false), new THREE.MeshStandardMaterial({
    vertexColors: true, roughness: .92, metalness: 0,
  }))
  m.receiveShadow = true
  m.castShadow = false
  for (const g of partes) g.dispose()
  return m
}

/**
 * O inventário.
 *
 * `m` é a altura do móvel real em metros. `pos` é `[x, z]` no chão da sala — o `y` sai
 * da caixa envolvente, porque um modelo de biblioteca não vem com a base na origem e
 * confiar que venha é como o sofá acabou enterrado no próprio pé no exercício 04.
 * `ry` gira em torno do eixo vertical. `cor` é o tint sobre o mapa de cor, e é
 * multiplicativo: o mapa já é meio-tom, então um marrom médio aqui dá um móvel preto.
 * A primeira montagem errou exatamente assim e as oito peças entraram como silhuetas
 * ao lado de móveis procedurais bem mais claros. Os valores são claros de propósito —
 * o mapa carrega a cor, o tint só a puxa para a paleta, e o Sofa_01 é o que mais
 * precisa disso porque vem creme de catálogo e creme não existe nesta sala.
 *
 * As posições respeitam o que já está na sala. A parede de trás e as duas baias
 * laterais são de `room-decor.js`; a lareira, a porta, o espelho, o busto e os quadros
 * são de `room-baroque.js`. O que estava vazio era a **metade da frente** — e é
 * exatamente ela que a câmera de `?sala` vê, de cima, a 35°.
 */
const MOBILIA = [
  /* **A pegada do Altar encolheu, e é isto que esta tabela gasta.**

     O tampo cobria `x −7,6..+7,6` e `z −4,5..+4,5` a 2,95 do chão, como um telhado —
     um móvel posto ali não ficava escuro, sumia, e foi o que aconteceu com a poltrona
     em (7,2 · −1,4). A regra que sobrava era `|x| > 8,2` **ou** `|z| > 5,2`: uma faixa
     rente às paredes e uma tira na frente. Estas oito peças não estavam jogadas,
     estavam **exiladas** — não existia meio de quarto onde agrupar nada, e as
     coordenadas não eram uma composição, eram o que sobrou.

     Com o instrumento em `K = 0,46` a pegada proibida caiu para `|x| < 3,5` **e**
     `|z| < 2,1`, e o meio abriu. Continua valendo conferir antes de cada coordenada:
     a mesa ainda é um telhado, só que um telhado pequeno.

     **Agrupar é o que conserta "parece jogado".** Uma poltrona sozinha encarando a
     parede lê como objeto posto; duas poltronas e um sofá virados para o fogo leem
     como um lugar onde alguém senta. São quatro grupos e cada peça pertence a um: o
     estar virado para o Altar, o canto da lareira, o canto de leitura, a entrada.

     `ry` é o ângulo em torno da vertical, e `ry = 0` olha para `+z`. Onde uma peça
     pertence a um grupo, o ângulo dela **aponta para o que o grupo olha** — o Altar em
     `(0 · 0)` ou a lareira em `(+11,5 · −1)` — em vez de ser um valor achado no olho.

     A borda que continua de pé é o quadro: `?sala` olha de 45° a 31 de distância e o
     chão que ele enxerga acaba perto de `z = +7`. Móvel além disso é peso baixado à
     toa. */
  /* o estar: sofá e cadeira virados para o Altar, com o tapete entre eles */
  { arq: 'Sofa_01/Sofa_01_1k.gltf', m: .86, pos: [-5.2, 4.8], ry: 2.316, cor: 0x7E5A38 },
  /* o canto da lareira, na parede direita em (+11,5 · −1): o sofá de lado e a
     poltrona fechando o L, os dois olhando para o fogo */
  { arq: 'sofa_03/sofa_03_1k.gltf', m: .92, pos: [6.6, .4], ry: 1.849, cor: 0x8E6A5E },
  /* o canto de leitura, ao pé da estante em (+11 · +3,6) — a cadeira vira as
     costas para ela e olha para dentro do quarto, que é como se lê sentado */
  { arq: 'GreenChair_01/GreenChair_01_1k.gltf', m: .95, pos: [8.6, 6.0], ry: -2.18, cor: 0x8C9A82 },

  { arq: 'ArmChair_01/ArmChair_01_1k.gltf', m: 1.05, pos: [8.4, -5.0], ry: 0.659, cor: 0x8E6C50 },

  /* A cadeira do Altar, e ela **volta para 1,02 m**.

     Ela estava em 1,30 m, e o motivo era escrito e correto: a sala tinha dois
     registros. O Altar media 4,7 por 2,8 m na altura da cintura, monumental de
     propósito, e uma cadeira de 1,02 m ao lado dele lia como banquinho — móvel que
     encosta no Altar tomava o registro do Altar.

     **O segundo registro acabou.** Com `K = 0,46` o tampo é uma mesa de 2,21 × 1,33 m
     a 0,92 m do chão, que é uma mesa. A exceção que a protegia era uma resposta ao erro
     de razão, e sem o erro ela vira o erro: uma cadeira de 1,30 m encostada numa mesa
     de 0,92 m é a única peça do quarto que não obedece à porta, e agora sem razão. */
  { arq: 'WoodenChair_01/WoodenChair_01_1k.gltf', m: 1.02, pos: [.9, 3.4], ry: -2.883, cor: 0xC0A078 },

  /* A entrada. O console sobe para junto da porta — que vai de z +3,5 a +6,2 na
     parede esquerda — porque um console é onde se larga o que se traz, e um console
     no meio de uma parede cega é um móvel sem função. Continua encostado: a este é o
     único grupo do quarto que tem razão para estar na parede. */
  { arq: 'ClassicConsole_01/ClassicConsole_01_1k.gltf', m: .82, pos: [-10.5, 6.8], ry: Math.PI / 2, cor: 0xB89772 },
  { arq: 'Shelf_01/Shelf_01_1k.gltf', m: 1.75, pos: [11.0, 3.6], ry: -Math.PI / 2, cor: 0x8C6C4A, livros: 5171 },

  /* O armário vai para o canto do fundo à esquerda, e é o único lugar da sala onde
     ele cabe. A parede esquerda está tomada: a baia de discos ocupa z −7,4 a −1,4, o
     espelho fica sobre ela, o console entra em +1,4 e a porta vai de +3,5 a +6,2. O
     que sobrava era a frente, que a câmera corta. O canto do fundo estava vazio desde
     que a sala existe — e um canto vazio numa cena com quatro paredes é o lugar onde
     o olho descobre que aquilo é um cenário. */
  { arq: 'GothicCabinet_01/GothicCabinet_01_1k.gltf', m: 1.95, pos: [-9.5, -10.1], ry: .12, cor: 0xA88A66 },

  /* O busto, e ele **nao esta no chao**.
     O pedestal continua escrito em `room-baroque.js` — um torneado de gesso e coisa
     que este repositorio faz bem. O busto que estava em cima dele nao era: o
     comentario dele mesmo dizia que a forma era abstrata de proposito, porque *"um
     rosto reconhecivel modelado por aritmetica e estranho"*. Isso e o diagnostico do
     ADR-0029 escrito no lugar onde ele doi, e a resposta e a mesma — modelar em vez
     de escrever.
     `y` e o topo do pedestal, `floorY + 2,44`. E por isso que ele nao ganha mancha no
     chao: a base dele nao encosta no chao, e uma sombra de contato a dois metros e
     meio do objeto que a projeta e pior do que sombra nenhuma. */
  /**
   * O relogio na cornija da lareira, e ele e o Modulo em forma de objeto.
   *
   * TRAJETO e uma cronologia, e o `trilho.json` diz que a estacao e a lareira porque
   * uma cronologia quer uma linha e a cornija e uma linha. Um relogio de cornija e a
   * mesma frase dita outra vez, com a vantagem de ser a coisa que **mede** o tempo em
   * vez de representa-lo.
   *
   * **E ele nao fica na cornija, que era o lugar obvio.** Medido: a prateleira da
   * lareira esta em `y = 1,05` e projeta em `y = 81` de tela num quadro de 800 — a
   * borda de cima — e o relogio em cima dela saia **fora do quadro**. A estacao nao
   * mira a lareira: o `trilho.json` diz que o ponto e o centroide do grupo, e o grupo e
   * o sofa e a poltrona sobre o tapete. A cornija esta na estacao; nao esta na foto.
   *
   * O que esta no meio do quadro, medido, e o topo da credenza da direita — `y = -1,49`
   * projetando em `(680, 380)` de 1706 por 800. Um relogio de prateleira numa credenza
   * de discos e a mesma peca no mesmo tipo de lugar, com a diferenca de que se ve.
   *
   * Ver `montar` — `y` troca o chao por outro plano de apoio.
   */
  {
    arq: 'mantel_clock_01/mantel_clock_01_1k.gltf', m: .38, pos: [10.6, -2.55],
    y: -1.49, ry: -Math.PI / 2, cor: 0x8E7A5E, layout: 'cheio',
  },

  /**
   * O vaso no console da entrada.
   *
   * A estacao PORTA tinha um console entalhado com nada em cima. Um aparador vazio le
   * como movel de catalogo pela mesma razao que uma estante vazia le — e o argumento
   * que `encher` ja faz para a estante. Ceramica e nao latao de proposito: aquele canto
   * ja tem a macaneta, o filete das almofadas e a arandela, e mais um dourado ali seria
   * o quarto inteiro feito do mesmo material.
   */
  {
    arq: 'antique_ceramic_vase_01/antique_ceramic_vase_01_1k.gltf', m: .34,
    pos: [-10.2, 6.4], y: -.33, ry: .7, cor: 0x9A8E7E, layout: 'cheio',
  },

  {
    arq: 'marble_bust_01/marble_bust_01_1k.gltf', m: .52, pos: [10.1, -6.88],
    /* O tint desce para 0x8E8478 e nao e correcao de cor, e de composicao. O mapa da
       peca ja e marmore claro; com o tint em 0xC6BEAE o busto virava a coisa mais
       clara do quadro na estacao da oficina e puxava o olho para longe da baia de
       pedais, que e o assunto de HABILIDADES. Marmore num quarto a luz de vela pega
       luz, mas nao ganha do que o modulo esta contando. */
    y: -.51, ry: -Math.PI / 2, cor: 0x8E8478, layout: 'cheio',
  },
]

export function createMobilia(room, { floorY, layout = 'cheio' }) {
  /* um grupo só, como `createRoomDecor` — `__unit.perf()` precisa poder apagar a
     mobília inteira em um quadro para saber quanto ela custa */
  const group = new THREE.Group()
  room.add(group)

  const loader = new GLTFLoader()
  const halos = new THREE.Group()
  group.add(halos)

  const pecas = []
  let solta = null
  const pronto = new Promise(res => { solta = res })

  /**
   * **Nada baixa até o quarto acender.**
   *
   * `ROOM_K` começa em 0: o quarto está desligado para quem chega em `nanj.in`, e só
   * acende no `?sala` ou na bancada. A primeira versão disparava os oito `fetch` no
   * topo do módulo, o que fazia **todo visitante baixar 2,3 MB de móveis que ele
   * nunca vê** — e baixar disputando banda com uma abertura que custou uma sessão
   * inteira para chegar a 2,42 s (T-21).
   *
   * Então `setRoomAmount` chama isto quando o quarto passa a existir, e chamar duas
   * vezes não faz nada. É a mesma regra que já vale para as luzes do quarto: nada que
   * a câmera não pode ver deve estar sendo pago.
   */
  let pedido = false
  function carregar() {
    if (pedido) return pronto
    pedido = true
    /* Quase toda peça ignora o `layout`: os três arranjos de `createBaroque` são três
       respostas sobre *ornamento*, e um quarto sem onde sentar não é um arranjo mais
       sóbrio. O busto é a exceção porque ele **é** ornamento — estava sob
       `layout === 'cheio'` em `room-baroque.js` e continua onde estava. */
    const lista = MOBILIA.filter(i => !i.layout || i.layout === layout)
    let pendentes = lista.length
    const conta = () => { if (--pendentes === 0) solta(pecas) }
    for (const item of lista) {
      loader.load(ASSET(item.arq), gltf => { montar(gltf.scene, item); conta() },
        undefined,
        /* uma peça que não baixa não pode derrubar a sala: o quarto sem um armário
           ainda é um quarto, e o console diz qual faltou */
        err => { console.warn('[mobilia] falhou', item.arq, err?.message || err); conta() })
    }
    return pronto
  }

  function montar(raiz, item) {
    /* escala pela altura real, medida na caixa envolvente do próprio modelo */
    const cx = new THREE.Box3().setFromObject(raiz)
    raiz.scale.setScalar((item.m * POR_METRO) / cx.getSize(new THREE.Vector3()).y)

    /* recentra em x/z e apoia a base no chão — depois da escala, porque a caixa muda.
       `item.y` troca o chão por outro plano de apoio: um busto pousa no topo de um
       pedestal, não no piso. */
    raiz.updateMatrixWorld(true)
    const cx2 = new THREE.Box3().setFromObject(raiz)
    const ctr = cx2.getCenter(new THREE.Vector3())
    const base = item.y ?? floorY
    raiz.position.set(item.pos[0] - ctr.x, base - cx2.min.y, item.pos[1] - ctr.z)
    raiz.rotation.y = item.ry

    raiz.traverse(o => {
      if (!o.isMesh) return
      /**
       * **O relevo e a rugosidade ficam; a cor continua nossa.**
       *
       * Isto guardava so o `map` e punha rugosidade 0,86 chapada em tudo. As duas
       * outras metades do PBR — normal e roughness — vinham no download, eram
       * decodificadas, e eram **descartadas na linha seguinte**: banda paga por nada, e
       * todo movel do quarto com o mesmo acabamento fosco, que e metade do motivo de
       * eles lerem como render de catalogo apesar de serem malhas de verdade.
       *
       * O que a decisao original protegia era a **cor**, e ela continua protegida: o
       * `color` do item multiplica por cima, e e o que impede um sofa de chegar com a
       * cor do estudio de quem o fotografou. E a mesma regra da parede, da porta e do
       * `VELVET` — a fotografia sabe como um material se comporta e nao tem opiniao que
       * valha sobre que cor este objeto tem nesta sala.
       *
       * `roughness` vai a 1 quando ha mapa porque ai ele **multiplica** em vez de
       * substituir; sem mapa fica 0,86, como antes.
       */
      const antigo = o.material
      const temRug = !!antigo?.roughnessMap
      o.material = new THREE.MeshStandardMaterial({
        map: antigo?.map || null,
        normalMap: antigo?.normalMap || null,
        roughnessMap: antigo?.roughnessMap || null,
        color: item.cor,
        roughness: temRug ? 1 : .86,
        metalness: 0,
      })
      o.material.normalScale.set(.7, .7)
      antigo?.dispose?.()
      /* `groundShadows` roda uma vez no topo de `scene.js`, muito antes destes
         carregamentos terminarem. A política é a mesma dele, escrita aqui à mão:
         recebe sombra, não lança — quem lança é só a Unidade e o que está no Altar. */
      o.receiveShadow = true
      o.castShadow = false
    })

    raiz.name = item.arq.split('/')[0]
    group.add(raiz)
    pecas.push(raiz)

    /* uma estante vazia é um móvel de catálogo — ver `encher` */
    if (item.livros) {
      const l = encher(raiz, item.livros)
      if (l) { l.name = raiz.name + '_livros'; group.add(l) }
    }

    /* a mancha no chão, do tamanho da pegada da peça — só para quem está nele */
    if (item.y != null) return
    raiz.updateMatrixWorld(true)
    const cx3 = new THREE.Box3().setFromObject(raiz)
    const t = cx3.getSize(new THREE.Vector3())
    const h = new THREE.Mesh(
      new THREE.PlaneGeometry(t.x * 1.45, t.z * 1.45),
      new THREE.MeshBasicMaterial({
        map: HALO, color: 0x000000, transparent: true, opacity: .5,
        depthWrite: false,
      }))
    h.rotation.x = -Math.PI / 2
    h.position.set(item.pos[0], floorY + .02, item.pos[1])
    h.renderOrder = 1
    halos.add(h)
  }

  return { group, pronto, carregar }
}
