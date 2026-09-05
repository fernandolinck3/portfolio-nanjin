/**
 * The portrait — Lyra, hanging in the chapel.
 *
 * Beatrice's portrait in the Ushiromiya mansion is never summoned and never
 * dismissed. It is simply always there, gilt-framed, with its plaque under it,
 * and the room is different because it is on the wall. That is the job here: the
 * Wizard currently exists only inside the Screen, which makes her a graphic the
 * Unit draws rather than someone whose room the visitor has walked into.
 *
 * It is deliberately NOT where Works go. A Work is called and dismissed; the
 * portrait is a fixture. Putting both on the wall would have made the wall mean
 * two different things, and the summoning would have read as "the painting
 * changed" instead of "something arrived".
 *
 * **Ela nao e mais uma pintura: e um mostrador.** A versao anterior era um oleo
 * procedural marcado como arte provisoria pelo ADR-0013, esperando uma pintura a mao.
 * Uma tela dentro da moldura resolve isso e resolve mais: o `CONTEXT.md` chama a Lyra
 * de a Maga que habita a Tela, e um painel na moldura torna a frase literal em vez de
 * metafora. O desenho e a animacao dela moram em `lyra-display.js`; este arquivo
 * pendura o objeto, carrega a moldura modelada e decide quando o painel repinta.
 */

import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { createDisplay } from './display.js'
import { criarLyra } from './lyra-display.js'

const GILT = 0xB08D4A

/**
 * O tamanho do painel dela, em pixels.
 *
 * A abertura da moldura tem proporcao 0,742 e este numero e orcamento, nao desenho —
 * `lyra-display.js` resolve o enquadramento em fracoes da altura justamente para que
 * trocar isto nao redesenhe nada. 240 x 324 da 0,7407, e `display.js` leva a 3x — 720
 * por 972, contra os 960 por 540 da Tela da Unidade. O pixel aparece de proposito.
 *
 * **Dobrou por causa do texto, e nao por gosto.** A 120 de largura, `11px VT323` cabia
 * em vinte e poucos caracteres: dava para o rosto dela e para nada mais. O oraculo pede
 * quatro perguntas legiveis e uma resposta de ate quarenta caracteres, e isso mede 240.
 * A altura acompanha porque a proporcao e da abertura da moldura e nao minha.
 *
 * O que o dobro custa e area de tratamento: `display.js` tem `SCALE = 3` fixo, entao a
 * vidraca passou de 360 x 486 para 720 x 972 e o `paint()` dela — um `drawImage` com
 * `blur`, mais tres composicoes — quadruplicou de area. Continua a 10 Hz e continua
 * so com o quarto aceso, e o desenho da figura nao mudou de preco: `drawSprite` faz um
 * `fillRect` por celula, e as celulas sao 28 x 40 em qualquer escala.
 */
const PAINEL = { w: 240, h: 324 }

/** The engraved plaque under it. Brass, and it says who she is. */
function plaqueTexture(name, line) {
  const c = document.createElement('canvas')
  c.width = 512; c.height = 128
  const g = c.getContext('2d')
  g.fillStyle = '#6E5A32'; g.fillRect(0, 0, 512, 128)
  const sheen = g.createLinearGradient(0, 0, 512, 128)
  sheen.addColorStop(0, 'rgba(228,205,146,.5)')
  sheen.addColorStop(0.5, 'rgba(120,98,52,.2)')
  sheen.addColorStop(1, 'rgba(214,190,132,.42)')
  g.fillStyle = sheen; g.fillRect(0, 0, 512, 128)
  g.textAlign = 'center'
  /* cut, not printed: a dark stroke with a light one above it reads as engraved */
  g.fillStyle = 'rgba(40,30,12,.85)'
  g.font = '400 44px UnifrakturMaguntia, serif'
  g.fillText(name, 256, 60)
  g.fillStyle = 'rgba(246,232,190,.35)'
  g.fillText(name, 256, 58.5)
  g.fillStyle = 'rgba(40,30,12,.7)'
  g.font = '500 17px "Azeret Mono", monospace'
  g.fillText(line, 256, 96)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}

/**
 * Hang the portrait.
 *
 * `wallFace` is the z of the wall's visible surface — the wall is an extrusion,
 * so its face is not at its position.
 */
export function createPortrait(scene, { x, y, wallFace, height = 4.2, name, line, camera }) {
  const group = new THREE.Group(); scene.add(group)
  const barras = new THREE.Group(); group.add(barras)

  /**
   * O painel dela, atras da mesma vidraca da Tela.
   *
   * `display.js` nao sabe nada sobre a Unidade — recebe uma tela de origem e devolve
   * outra com grade de pixel, sangramento de fosforo, queda nas bordas e o brilho do
   * quarto no vidro. Passar a Lyra por ele e o que faz o retrato ser o **mesmo tipo de
   * objeto** que o mostrador do instrumento, e nao uma imagem que por acaso brilha.
   */
  const lyra = criarLyra(PAINEL)
  /**
   * O tratamento vem mais seco que o da Unidade, e a razao e o **tamanho da area
   * clara**. O mostrador do instrumento e quase todo preto com letra fina em cima:
   * `bloom` em 0,17 espalha traco de uma letra, que e o que faz fosforo. Aqui a area
   * clara e a figura inteira, e o mesmo numero espalha uma nuvem.
   *
   * `sheen` cai de 0,045 para 0,010 pelo mesmo motivo em outro eixo. O brilho do
   * quarto no vidro e um degrade claro pintado sobre a tela toda, e no mostrador da
   * Unidade ele se ve como vidro porque o resto e preto e o texto e fino. Aqui, com a
   * emissao alta o bastante para ela ser a ultima coisa acesa do quarto, aquele
   * degrade virava um campo cinza uniforme atras dela: o painel lia como **papel**
   * dentro da moldura, e nao como tela. Menos brilho de vidro, mais queda na borda.
   */
  const painel = createDisplay(lyra.canvas, { bloom: .06, vignette: .42, sheen: .010 })
  const tex = new THREE.CanvasTexture(painel.canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  const w = height * (PAINEL.w / PAINEL.h)

  const giltMat = new THREE.MeshStandardMaterial({
    color: GILT, metalness: 0.92, roughness: 0.28,
  })

  /* O painel, recuado dentro da moldura para que o filete lance sombra sobre ele.
     O material e o mesmo raciocinio do `screenMat` da Unidade: chao quase preto,
     rugosidade alta o bastante para a luz do quadro virar brilho espalhado em vez de
     um ponto quente por cima da cara dela, e a emissao carregando o sinal. */
  const canvas = new THREE.Mesh(
    new THREE.PlaneGeometry(w, height),
    new THREE.MeshStandardMaterial({ color: 0x05070A, roughness: 0.42, metalness: 0 }),
  )
  canvas.position.set(x, y, wallFace + 0.06)
  /* nomeada para o raycast poder distinguir a tela da moldura: um clique na talha
     dourada nao e um clique numa pergunta */
  canvas.name = 'retrato:painel'
  group.add(canvas)

  /**
   * Para onde ela olha, e por que isso tem dois condutores.
   *
   * De longe o olhar segue a **camera**: quem se move e quem olha, e a conta e a
   * direcao da camera projetada no plano do quadro — que aqui e o plano xy do mundo,
   * porque o quadro esta na parede do fundo sem rotacao nenhuma.
   *
   * De perto a camera para. Numa pose fixa a dois metros e meio, seguir uma camera
   * parada nao e olhar, e pose. Ai quem se move e o **ponteiro**, e e ele que ela
   * segue.
   *
   * O ganho existe porque a folga dentro da orbita e minuscula. O vertical e menor que
   * o horizontal, ao contrario do que a elipse deitada sugere: medido, a camera do
   * quarto esta sempre acima do olho dela, e com ganho alto o eixo vertical ficava
   * grudado no batente em toda pose util. Ela olhando um pouco para cima esta certo;
   * sempre para cima nao e olhar, e pose de novo.
   *
   * `mirar(null)` volta para a camera; `mirar([nx, ny])` recebe o ponteiro em
   * coordenadas normalizadas de tela, -1 a 1, com y para cima.
   *
   * **O passeio da iris nao esta mais aqui.** Era um plano proprio, dois milimetros a
   * frente da pintura, porque uma orbita pintada nao se move. Num mostrador o olho e
   * desenhado a cada quadro: `lyra-display.js` recebe o alvo ja normalizado e resolve
   * o resto. Uma malha, uma textura e um clamp em unidades de mundo a menos.
   */
  const GAIN_X = 1.5, GAIN_Y = 1.2
  const OLHO = { x, y: y + height * 0.11, z: wallFace + 0.06 }
  let gx = 0, gy = 0

  /**
   * `mirar` continua sendo a porta, e o que mudou e o que ha atras dela.
   *
   * Era um deslocamento de iris. `REACTION_FRAMES` nao tem iris — e uma pintura em
   * baixa resolucao sem celulas de olho isolaveis — mas tem dez quadros de reacao. A
   * chamada agora **avisa** o painel de que houve movimento na frente dele, e ele
   * reage com a animacao que ela tem. Ver o cabecalho de `lyra-display.js`.
   *
   * `mirar(null)` nao faz nada por design: longe do quadro nao ha ponteiro sobre ela.
   */
  let alvoManual = null
  function mirar(alvo) {
    alvoManual = alvo
    if (alvo && lyra.ponteiro) lyra.ponteiro(alvo[0], alvo[1])
  }

  /**
   * A consulta, e as tres funcoes que a `scene.js` chama.
   *
   * As tres recebem o **UV da malha do painel**, que e o que o raycast do three.js ja
   * devolve de graca, e traduzem aqui para pixel da tela de origem. O `v` vem de baixo
   * para cima num `PlaneGeometry` e o pixel conta de cima para baixo, e essa inversao
   * mora nesta linha e em nenhuma outra.
   *
   * `apontar` devolve se ha algo clicavel sob o ponteiro, para o cursor da pagina.
   * `consultar` devolve se o clique foi consumido pela caixa — quando nao foi, quem
   * chamou trata como clique no retrato e o trilho faz o que fazia. `soltarConsulta`
   * fecha a resposta aberta, e existe porque sair da pose fechada com uma resposta na
   * tela deixaria a caixa contando uma consulta que ninguem esta fazendo.
   */
  const pxDe = (u, v) => [u * PAINEL.w, (1 - v) * PAINEL.h]
  /* `apontar(null)` e o ponteiro **fora** do painel, e nao a ausencia de noticia. Sem
     essa chamada a marca de seleção fica estacionada na ultima linha visitada: quem
     chama so a chamava quando havia acerto, entao sair do quadro nao apagava nada. */
  const apontar = (u, v) => lyra.apontar(...(u == null ? [-1, -1] : pxDe(u, v)))
  const consultar = (u, v) => lyra.clicar(...pxDe(u, v))
  const soltarConsulta = () => lyra.limpar()

  /* the moulding — four bars, mitred by overlap rather than by geometry */
  const M = 0.26, D = 0.22
  const bars = [
    [w + M * 2, M, x, y + height / 2 + M / 2],
    [w + M * 2, M, x, y - height / 2 - M / 2],
    [M, height, x - w / 2 - M / 2, y],
    [M, height, x + w / 2 + M / 2, y],
  ]
  for (const [bw, bh, bx, by] of bars) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, D), giltMat)
    bar.position.set(bx, by, wallFace + D / 2)
    barras.add(bar)
  }

  /* the plaque, on the wall below the frame */
  const plaque = new THREE.Mesh(
    new THREE.PlaneGeometry(1.5, 0.375),
    new THREE.MeshStandardMaterial({
      map: plaqueTexture(name, line), metalness: 0.85, roughness: 0.38,
    }),
  )
  plaque.position.set(x, y - height / 2 - M - 0.42, wallFace + 0.05)
  group.add(plaque)

  /**
   * Ela nao se apaga quando o quarto se apaga.
   *
   * Na Vigilia cheia toda Vela esta morta e uma pintura seria um retangulo preto. Um
   * painel nao tem esse problema — ele **e** a fonte — e por isso a emissao dela sobe
   * com a Vigilia em vez de descer: quando o quarto apaga, as duas ultimas coisas
   * acesas sao a Tela da Unidade e ela, que e a razao inteira de haver um retrato
   * pendurado. O piso e 0,62 e nao 0,05 porque um mostrador desligado de dia nao e
   * discricao, e um mostrador desligado.
   */
  canvas.material.emissiveMap = tex
  canvas.material.emissive = new THREE.Color(0xffffff)
  canvas.material.needsUpdate = true
  /* only the intensity moves per frame — reassigning the map would recompile the
     shader on every tick */
  /**
   * A moldura modelada, e por que ela chega tarde.
   *
   * As quatro barras acima sao quatro caixas com um chanfro — leem como moldura de
   * longe e como quatro caixas de perto, que e exatamente o diagnostico do ADR-0029
   * sobre construir mobilia a mao. `fancy_picture_frame_01` da Poly Haven resolve
   * isso, e resolve com uma sorte que vale registrar: o modelo traz a **tela como
   * malha separada**, com material proprio, e a abertura dela mede 0,539 x 0,400 m
   * — proporcao 0,742 contra os 0,745 da pintura da Lyra. Diferenca de 0,4%.
   *
   * Chega tarde porque `ROOM_K` comeca em 0. O retrato e cenario de quarto — entra
   * em `roomScenery` — e o quarto esta desligado para quem chega em `nanj.in`.
   * Construir isto no topo do modulo faria todo visitante baixar 328 KB de moldura
   * que ele nunca ve. Quem chama e `setRoomAmount`, junto da mobilia.
   *
   * Se o download falhar, as barras ficam. Um retrato com moldura de caixa ainda e
   * um retrato; um retrato sem moldura nenhuma e um erro na parede.
   */
  let pedida = false
  let molduraPronta = null
  const pronto = new Promise(res => { molduraPronta = res })
  function carregar() {
    if (pedida) return pronto
    pedida = true
    const url = (import.meta.env?.BASE_URL || '/') + 'mobilia/fancy_picture_frame_01/fancy_picture_frame_01_1k.gltf'
    new GLTFLoader().load(url, gltf => {
      const raiz = gltf.scene

      /* O modelo e paisagem — 0,603 de largura por 0,464 de altura — e a Lyra e
         retrato. Um quarto de volta no proprio plano resolve, e resolve **antes** de
         qualquer medida: girar depois de escalar mede a caixa errada. */
      raiz.rotation.z = Math.PI / 2
      raiz.updateMatrixWorld(true)

      /* A abertura e a regua, nao a caixa externa. Escalar pela caixa externa poria a
         moldura no tamanho certo e a pintura no tamanho errado, que e o unico dos dois
         que alguem olha. */
      let tela = null
      raiz.traverse(o => { if (o.isMesh && /canvas/i.test(o.material?.name || '')) tela = o })
      if (!tela) { console.warn('[retrato] a moldura veio sem tela; ficam as barras'); molduraPronta(null); return }
      const ab = new THREE.Box3().setFromObject(tela)
      const k = height / ab.getSize(new THREE.Vector3()).y
      raiz.scale.setScalar(k)
      raiz.updateMatrixWorld(true)

      /* Recentrar pela abertura, de novo — a escala move o centro dela. */
      const ab2 = new THREE.Box3().setFromObject(tela)
      const c = ab2.getCenter(new THREE.Vector3())
      raiz.position.set(x - c.x, y - c.y, wallFace + 0.06 - c.z)

      raiz.traverse(o => {
        if (!o.isMesh) return
        if (o === tela) return
        /**
         * **O mapa de normais fica, e esta e a excecao.**
         *
         * `public/mobilia/CREDITS.md` diz que de cada peca ficou a malha e o mapa de
         * cor, e o resto do PBR ficou no servidor — porque um PBR completo de
         * biblioteca faz um movel parecer render de catalogo. A regra esta certa para
         * um sofa, cuja forma o sustenta.
         *
         * Nao esta certa para esta peca. A malha da moldura tem 629 vertices: e um
         * perfil extrudado, liso. Todo o entalhe — o que faz dela uma moldura de
         * quadro e nao uma tira chanfrada — esta no mapa de normais. Sem ele o modelo
         * nao e melhor que as quatro barras que ele veio substituir, e foi exatamente
         * assim que a primeira montagem apareceu na tela.
         *
         * Quando a geometria carrega a peca, o mapa de normais e enfeite. Quando o
         * relevo *e* a peca, ele e a geometria — 211 KB dela.
         *
         * A excecao nao e nova: `VELVET`, em `room-baroque.js`, ja pega emprestados
         * normal e roughness de uma foto e mantem a cor autorada, com a razao escrita
         * ao lado — uma fotografia e muito boa em *como um material se comporta* e
         * nao tem opiniao que valha sobre *que cor este objeto tem nesta sala*. E a
         * mesma regra; o que muda e que aqui a cor tambem serve.
         */
        const antigo = o.material
        o.material = new THREE.MeshStandardMaterial({
          map: antigo?.map || null,
          normalMap: antigo?.normalMap || null,
          roughnessMap: antigo?.roughnessMap || null,
          color: GILT, roughness: .42, metalness: .55,
        })
        antigo?.dispose?.()
        o.receiveShadow = true
        o.castShadow = false
      })

      /* A tela do modelo sai **do grafo**, e nao apenas da vista.
         Escondida com `visible = false` ela voltaria: a varredura de `roomScenery`
         em `scene.js` percorre esta raiz depois e escreve `visible` em toda malha
         que encontra, o que a reacenderia disputando o mesmo plano da Lyra. Ela ja
         cumpriu o papel dela, que era ser a regua da escala. */
      tela.removeFromParent()

      group.add(raiz)
      barras.visible = false
      molduraPronta(raiz)
    }, undefined, err => {
      console.warn('[retrato] moldura nao baixou; ficam as barras', err?.message || err)
      molduraPronta(null)
    })
  }

  /**
   * O relogio do painel — 10 Hz, e nao 60.
   *
   * `display.paint()` da Unidade roda dentro do bloco de 24 Hz da Tela, e a razao esta
   * escrita la: copiar um buffer que so muda a 24 na cadencia de 60 e dois tercos de
   * blit jogados fora. Aqui a conta e mais dura ainda. Este painel desenha um rosto
   * que respira um pixel, pisca duas vezes por minuto e tem uma varredura que leva
   * onze segundos para atravessar — nada disso pede 60 quadros por segundo, e cada um
   * custa a repintura da fonte **mais** o tratamento de vidraca por cima dela. Dez
   * tambem e honesto com o que ela e: arte em pixel anima a oito ou doze quadros, e a
   * cadencia baixa le como o meio, nao como engasgo.
   *
   * E nao pinta nada com o quarto apagado. `ROOM_K` comeca em 0 e a malha esta
   * escondida; um retrato invisivel repintando quinze vezes por segundo e a mesma
   * classe de desperdicio que o bloom parado no `EffectComposer`, que ADR-0021 achou
   * tarde justamente porque nao aparecia na tela.
   */
  const PASSO = 1 / 10
  let relogio = 0, desde = 0, tempo = 0

  function update(vigil, dt = 0) {
    const em = 0.44 + vigil * 0.42
    canvas.material.emissiveIntensity = em

    /* o alvo do olhar, normalizado — quem conduz depende da distancia */
    let ax = 0, ay = 0
    if (alvoManual) {
      ax = alvoManual[0]; ay = alvoManual[1]
    } else if (camera) {
      const dz = Math.max(0.8, camera.position.z - OLHO.z)
      ax = (camera.position.x - OLHO.x) / dz * GAIN_X
      ay = (camera.position.y - OLHO.y) / dz * GAIN_Y
    }
    ax = Math.max(-1, Math.min(1, ax)); ay = Math.max(-1, Math.min(1, ay))
    /* Ela nao teleporta o olhar. Um oitavo por quadro a 60 chega em ~0,2s, que e o
       tempo de um olho de verdade largar um ponto e pegar outro. */
    const k = dt ? Math.min(1, dt * 8) : 1
    gx += (ax - gx) * k
    gy += (ay - gy) * k

    if (!canvas.visible) return
    tempo += dt; relogio += dt; desde += dt
    if (relogio < PASSO) return
    relogio = 0
    lyra.pintar(tempo, { vigil })
    desde = 0
    painel.paint()
    tex.needsUpdate = true
  }
  update(0)

  return { update, group, carregar, pronto, mirar, apontar, consultar, soltarConsulta }
}
