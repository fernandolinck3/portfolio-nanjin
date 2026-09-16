/**
 * The room, after Fernando's `roomexample` reference.
 *
 * The chapel the Unit was standing in was carved oak and stone — correct for the
 * Vigil, wrong for the thing on the table. The reference is a *studio*: a dark
 * painted room with arched acoustic panels, monitors either side, a credenza of
 * records, guitar pedals on a cabinet, and two warm globe lamps doing most of the
 * work the candles were doing alone.
 *
 * That is a better room for this object, and it does not cost the register. It is
 * still night, still lit in warm pools against deep shadow, still celestial — the
 * panels carry suns, crescents and stars, and the whole palette is the Plate's:
 * bone, ember red, cool blue-grey, on near-black.
 *
 * What it adds is *lived-in*. A chapel is a place you visit; a studio is a place
 * someone works, and the Unit is supposed to be something Fernando made rather
 * than an artefact on display.
 *
 * Everything here is furniture and fittings. The Altar, the Candles, the window
 * and the Portrait stay where they are.
 */

import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { medir } from './superficie.js'
import { sleeveFor } from './works-art.js'

const BONE = '#C9C2B0', EMBER = '#B4472A', COLD = '#6E8493'
const GILT = 0xB08D4A

function rng(seed) {
  let s = seed >>> 0
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296)
}

/** A baia do Acervo, numa pegada única para móvel, vitrola e prateleiras. */
const ACERVO = { W: 6.0, H: 1.45, D: 1.15, RECUO: .30, DZ: 6.4 }

/* ---------- acoustic panels ---------- */

/**
 * A panel's face: fabric, with one celestial mark drawn on it in gilt.
 *
 * Sparse on purpose. The reference gives each panel a single motif and lets the
 * colour do the rest; a busy panel would compete with the Plate, which is the
 * thing in the room that is allowed to be busy.
 */
function panelFace(colour, motif, seed) {
  const c = document.createElement('canvas'); c.width = 420; c.height = 900
  const g = c.getContext('2d')
  const rnd = rng(seed)
  g.fillStyle = colour; g.fillRect(0, 0, 420, 900)

  /* woven fabric: fine crosshatch, low contrast */
  g.globalAlpha = .05
  for (let i = 0; i < 900; i += 3) {
    g.strokeStyle = i % 6 ? '#000' : '#fff'
    g.beginPath(); g.moveTo(0, i); g.lineTo(420, i + (rnd() - .5) * 2); g.stroke()
  }
  for (let i = 0; i < 420; i += 3) {
    g.strokeStyle = i % 6 ? '#000' : '#fff'
    g.beginPath(); g.moveTo(i, 0); g.lineTo(i + (rnd() - .5) * 2, 900); g.stroke()
  }
  g.globalAlpha = 1

  const cx = 210, cy = 300
  g.strokeStyle = 'rgba(190,158,96,.85)'
  g.fillStyle = 'rgba(190,158,96,.85)'
  g.lineWidth = 3

  if (motif === 'sun') {
    g.beginPath(); g.arc(cx, cy, 46, 0, 6.2832); g.stroke()
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * 6.2832
      const r0 = 56, r1 = i % 2 ? 96 : 74
      g.beginPath()
      g.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0)
      g.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1)
      g.stroke()
    }
  } else if (motif === 'moon') {
    /* a big crescent, the panel's whole subject */
    g.beginPath()
    g.arc(cx, cy + 60, 120, 0, 6.2832)
    g.arc(cx + 58, cy + 20, 108, 0, 6.2832, true)
    g.fill('evenodd')
  } else {
    /* an eight-pointed star, long on the cardinals */
    g.beginPath()
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * 6.2832 - Math.PI / 2
      const r = i % 4 === 0 ? 108 : i % 2 === 0 ? 44 : 22
      const p = [cx + Math.cos(a) * r, cy + Math.sin(a) * r]
      i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])
    }
    g.closePath(); g.fill()
  }

  /* a few small marks lower down, so the panel is not one lonely symbol */
  for (let i = 0; i < 5; i++) {
    const x = 60 + rnd() * 300, y = 520 + rnd() * 320, r = 4 + rnd() * 7
    g.beginPath()
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * 6.2832 - Math.PI / 2
      const rr = k % 2 ? r * .38 : r
      const p = [x + Math.cos(a) * rr, y + Math.sin(a) * rr]
      k ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])
    }
    g.closePath(); g.fill()
  }

  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}

/** A round-arched panel: a rectangle with a half-round head. */
function archGeom(w, h, depth) {
  const s = new THREE.Shape()
  const r = w / 2
  s.moveTo(-r, 0)
  s.lineTo(-r, h - r)
  s.absarc(0, h - r, r, Math.PI, 0, true)
  s.lineTo(r, 0)
  s.closePath()
  const g = new THREE.ExtrudeGeometry(s, {
    depth, bevelEnabled: true, bevelThickness: .02, bevelSize: .02,
    bevelSegments: 2, curveSegments: 24,
  })
  /* the face maps 0..1 across the panel so the fabric is not stretched by the arch */
  g.computeBoundingBox()
  const bb = g.boundingBox
  const pos = g.attributes.position
  const uv = new Float32Array(pos.count * 2)
  for (let i = 0; i < pos.count; i++) {
    uv[i * 2] = (pos.getX(i) - bb.min.x) / (bb.max.x - bb.min.x)
    uv[i * 2 + 1] = (pos.getY(i) - bb.min.y) / (bb.max.y - bb.min.y)
  }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
  g.computeVertexNormals()
  return g
}

/* ---------- fittings ---------- */

/**
 * A frosted globe on a brass stem. The room's warm light that is not a Candle.
 *
 * `haste` é o comprimento do pé, e é o que separa uma luminária de mesa de uma de
 * chão. A do acervo virou de chão em 2026-09-06: com a vitrola no tampo, uma globo do
 * lado dela punha dois objetos brilhantes no mesmo móvel, e as referências que ele deu
 * põem a luz **ao lado** da parede de discos, no chão, iluminando as capas de baixo.
 */
function globeLamp(parent, x, y, z, haste = .34) {
  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(.05, .10, haste, 12),
    new THREE.MeshStandardMaterial({ color: GILT, metalness: .9, roughness: .32 }))
  stem.position.set(x, y + haste / 2, z); parent.add(stem)

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(.29, .022, 8, 32),
    new THREE.MeshStandardMaterial({ color: GILT, metalness: .95, roughness: .28 }))
  ring.position.set(x, y + haste + .26, z); ring.rotation.x = Math.PI / 2; parent.add(ring)

  const globe = new THREE.Mesh(
    new THREE.SphereGeometry(.27, 24, 18),
    new THREE.MeshStandardMaterial({
      color: 0xF6E3BE, emissive: 0xF3C878, emissiveIntensity: 1.5,
      roughness: .6, metalness: 0,
    }))
  globe.position.set(x, y + haste + .26, z); parent.add(globe)

  /* With skyLight demoted to real moonlight these two are the room's daylight, so
     they carry far more than they used to — and being point lights they do it in
     pools that fall off, which is the whole point. */
  const light = new THREE.PointLight(0xF3C070, 5.2, 16, 2)
  light.position.set(x, y + haste + .28, z); parent.add(light)
  return { globe, light }
}

/** A nearfield monitor on a stand: cabinet, woofer, tweeter, port. */
function monitor(parent, x, z, floorY, faceZ) {
  const dark = new THREE.MeshStandardMaterial({ color: 0x141516, roughness: .68, metalness: .1 })
  const stand = new THREE.Mesh(new THREE.BoxGeometry(.62, 2.30, .62), dark)
  stand.position.set(x, floorY + 1.15, z); parent.add(stand)
  const foot = new THREE.Mesh(new THREE.BoxGeometry(.95, .09, .95), dark)
  foot.position.set(x, floorY + .045, z); parent.add(foot)

  const box = new THREE.Mesh(new THREE.BoxGeometry(1.05, 1.48, .92),
    new THREE.MeshStandardMaterial({ color: 0x1A1B1D, roughness: .55, metalness: .16 }))
  box.position.set(x, floorY + 3.04, z); parent.add(box)

  const cone = new THREE.MeshStandardMaterial({ color: 0x0A0A0B, roughness: .85 })
  const surround = new THREE.MeshStandardMaterial({ color: 0x2A2724, roughness: .7, metalness: .3 })
  const front = z + .47
  const woofer = new THREE.Mesh(new THREE.CylinderGeometry(.30, .30, .05, 28), cone)
  woofer.rotation.x = Math.PI / 2
  woofer.position.set(x, floorY + 2.72, front); parent.add(woofer)
  const wRing = new THREE.Mesh(new THREE.TorusGeometry(.31, .035, 8, 28), surround)
  wRing.position.set(x, floorY + 2.72, front); parent.add(wRing)

  const tweeter = new THREE.Mesh(new THREE.CylinderGeometry(.11, .11, .05, 20), cone)
  tweeter.rotation.x = Math.PI / 2
  tweeter.position.set(x, floorY + 3.52, front); parent.add(tweeter)

  const port = new THREE.Mesh(new THREE.CylinderGeometry(.075, .075, .06, 16), cone)
  port.rotation.x = Math.PI / 2
  port.position.set(x, floorY + 3.20, front); parent.add(port)
}

/** A long low cabinet. `shelf` fills its front with whatever is passed back. */
/**
 * O nogueira medido, uma vez para toda a mobília deste arquivo.
 *
 * Mesma regra de `superficie.js` que o `room-baroque.js` já segue: a fotografia
 * entra pelo relevo e pela rugosidade, a cor continua autorada. `repV` alto porque
 * a credenza é comprida e baixa — um ladrilho quadrado nela lê como xadrez.
 */
const NOGUEIRA = new THREE.MeshStandardMaterial({ color: 0x3A2E26, roughness: .52, metalness: .05 })
medir(NOGUEIRA, { nor: 'nogueira-nor.jpg', arm: 'nogueira-arm.jpg' }, { repU: 3, repV: 1, forca: .45 })

/**
 * A credenza — e por que ela deixou de ser uma caixa.
 *
 * ## O defeito
 *
 * Era um `BoxGeometry(w, h, d)` sobre quatro pinos, cor chapada, sem mapa. Medido na
 * estação do ACERVO: **11,2% do quadro**, mais que todo o resto somado, e o armário
 * gótico ao lado — que é um modelo de verdade — ocupa 2,8%. A diferença entre os dois
 * na tela é a diferença entre um móvel e uma caixa.
 *
 * Pior: **os quarenta discos estavam dentro dela.** Eles existem, têm seis cores de
 * lombada, e a caixa era desenhada em volta. O corpo ia de `floorY + 0,16` a
 * `floorY + 1,61` e os discos de `floorY + 0,27` a `floorY + 1,29` — enterrados
 * inteiros. O comentário deles diz que as lombadas *"são o único lugar do quarto com
 * cor arbitrária, e é o que faz aquilo ler como a coleção de alguém"*, e nenhuma delas
 * jamais chegou a um pixel.
 *
 * ## O que ela é agora
 *
 * Uma carcaça: base recuada, duas ilhargas, fundo, prateleira e um tampo saliente —
 * o vocabulário de um móvel de verdade, que é ter estrutura entre o topo e o chão. E
 * `aberta` abre a frente, que é o ponto todo: uma credenza de discos que esconde os
 * discos é uma caixa com um nome bonito.
 *
 * A baia dos pedais fica fechada, porque ali o assunto é o que está **em cima**.
 */
function credenza(parent, { x, z, w, h, d, floorY, aberta = false }) {
  const wood = NOGUEIRA
  const y0 = floorY + .16                      // onde o móvel começa
  const topY = y0 + h                          // a face de cima do tampo
  const BASE = .22, TAMPO = .09, LADO = .10

  const põe = (gw, gh, gd, px, py, pz) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(gw, gh, gd), wood)
    m.position.set(x + px, py, z + pz)
    parent.add(m)
    return m
  }

  /* a base recuada: um móvel deste peso pousa num soco, não em quatro pinos */
  põe(w - .20, BASE, d - .14, 0, y0 + BASE / 2, 0)
  /* o tampo, saliente dos dois lados — é a saliência que faz a sombra que diz que há
     um tampo */
  põe(w + .10, TAMPO, d + .06, 0, topY - TAMPO / 2, 0)

  const cavH = h - BASE - TAMPO
  const cavY = y0 + BASE + cavH / 2
  /* ilhargas e fundo */
  for (const sx of [-1, 1]) põe(LADO, cavH, d, sx * (w / 2 - LADO / 2), cavY, 0)
  põe(w - LADO * 2, cavH, .08, 0, cavY, -d / 2 + .04)
  /* a prateleira em que os discos pousam */
  põe(w - LADO * 2, .06, d - .10, 0, y0 + BASE + .03, 0)

  if (!aberta) {
    /* fechada: duas folhas com um filete entre elas, para não voltar a ser laje */
    const meia = (w - LADO * 2) / 2
    for (const sx of [-1, 1]) põe(meia - .04, cavH - .08, .06, sx * meia / 2, cavY, d / 2 - .03)
  }

  return { top: topY, front: z + d / 2, cavidade: { base: y0 + BASE + .06, altura: cavH - .06 } }
}

/* ---------- the room ---------- */

/**
 * Furnish the room.
 *
 * `wallFace` is the z of the far wall's visible surface — it is an extrusion, so
 * its face is not at its position.
 */
export function createRoomDecor(room, { floorY, wallFace, sideX, obras = [] }) {
  /* Everything this builds goes in one group rather than loose into the room, so
     `__unit.perf()` can switch the whole furnishing off in a frame and price it.
     Reassigning the parameter keeps the sixty `room.add` calls below untouched. */
  const group = new THREE.Group()
  room.add(group)
  room = group

  const lamps = []
  /**
   * Staging (ADR-0020).
   *
   * Everything used to sit on the back wall, at one distance, mirrored left to
   * right: three panels each side, a credenza at x=-9.4 and a pedal cabinet at
   * x=+8.6, both facing the camera square-on. Nothing overlapped anything, so
   * there was nothing for the eye to read as depth, and the mirror symmetry read
   * as a stage set rather than a room somebody works in.
   *
   * The reference does the opposite, and it is the whole reason it reads as a
   * space: the furniture stands against the **side** walls, running away from the
   * camera, **overlapping** the panels behind it. Convergence and occlusion are
   * what depth actually is — a bevel on a card is still a card.
   *
   * So each side gets a `bay`: a group parked against its wall and rotated a
   * quarter turn, with its contents built in local coordinates. Rotating the group
   * rather than every mesh is what keeps this readable — local +x runs along the
   * wall, local +z comes out of it.
   */
  const bay = (x, z, turn) => {
    const g = new THREE.Group()
    g.position.set(x, 0, z)
    g.rotation.y = turn
    room.add(g)
    return g
  }

  /* ---- the left bay: the credenza of records, along the left wall ---- */
  const LEFT_D = ACERVO.D
  const left = bay(-sideX + ACERVO.RECUO + LEFT_D / 2, wallFace + ACERVO.DZ, Math.PI / 2)
  /* O móvel do Acervo não é mais aproximado por caixas. O tampo continua na mesma
     altura para preservar a vitrola, as capas, a estação e suas coordenadas; a forma
     visível chega do glTF e é ajustada dentro desta mesma pegada. */
  const leftTop = {
    top: floorY + .16 + ACERVO.H,
    front: LEFT_D / 2,
    cavidade: { base: floorY + .38, altura: ACERVO.H - .31 },
  }
  let pedirCredenza = null
  let resolverCredenza
  let podeCarregarCredenza = false
  const credenzaPronta = new Promise(resolve => { resolverCredenza = resolve })
  function carregarCredenza() {
    if (pedirCredenza) return pedirCredenza
    pedirCredenza = new GLTFLoader().loadAsync(
      (import.meta.env?.BASE_URL || '/') + 'mobilia/modern_wooden_cabinet/modern_wooden_cabinet_1k.gltf',
    ).then(gltf => {
      const raiz = gltf.scene
      raiz.name = 'acervo:credenza-modelada'

      /* O modelo mede 2,4 m no mundo real e já tem portas curvas, ripado e pés de
         metal. Ajustar cada eixo o encaixa na pegada aprovada sem acrescentar uma
         única peça procedural nem mover os objetos que dependem do tampo. */
      const caixa = new THREE.Box3().setFromObject(raiz)
      const tamanho = caixa.getSize(new THREE.Vector3())
      raiz.scale.set(
        (ACERVO.W * .96) / tamanho.x,
        ACERVO.H / tamanho.y,
        (ACERVO.D * .96) / tamanho.z,
      )
      raiz.updateMatrixWorld(true)
      const ajustada = new THREE.Box3().setFromObject(raiz)
      const centro = ajustada.getCenter(new THREE.Vector3())
      raiz.position.set(-centro.x, floorY + .16 - ajustada.min.y, -centro.z)

      raiz.traverse(o => {
        if (!o.isMesh) return
        o.castShadow = false
        o.receiveShadow = true
        const materiais = Array.isArray(o.material) ? o.material : [o.material]
        for (const material of materiais) {
          for (const mapa of [material.map, material.normalMap, material.roughnessMap,
            material.metalnessMap, material.aoMap]) {
            if (mapa) mapa.anisotropy = 4
          }
          if (material.map) material.map.colorSpace = THREE.SRGBColorSpace
          material.envMapIntensity = .45
        }
      })
      left.add(raiz)
      resolverCredenza(raiz)
      return raiz
    }).catch(erro => {
      console.warn('A credenza modelada não carregou.', erro)
      resolverCredenza(null)
      return null
    })
    return pedirCredenza
  }
  /**
   * A face **interna** da parede, em coordenadas da baia — e a primeira conta aqui
   * estava errada por 0,3, que é meia parede.
   *
   * A parede lateral é uma `BoxGeometry(.6, …)` **centrada** em `x = ±SIDE_X`
   * (`scene.js`), então a face que se vê está em `-SIDE_X + .3` e não em `-SIDE_X`. O
   * `RECUO` de .30 desta baia é exatamente essa meia espessura: a credenza encosta o
   * fundo na parede. Logo a face fica em `-D/2` daqui, e não em `-(RECUO + D/2)`.
   *
   * Contando errado, as prateleiras e as sete capas nasceram 17 cm **dentro** da
   * parede — invisíveis, e o realce de hover as empurrava .18 para fora, que é a
   * "arte bugada aparecendo do lado" que ele viu. Um objeto dentro de uma parede não
   * dá erro nenhum: é geometria válida.
   */
  const paredeZ = -LEFT_D / 2

  /**
   * A coleção deixa de ser sessenta lombadas procedurais.
   *
   * Fernando viu a faixa e não reconheceu discos — reconheceu retângulos coloridos.
   * O móvel fechado aprovado guarda a coleção sem fingir sessenta álbuns sem nome; as
   * sete capas reais na parede e a vitrola já dizem o que esta baia é.
   */
  const recAlt = leftTop.cavidade.altura - .10
  const discos = []

  /**
   * As obras dele vão para a **parede**, em prateleiras rasas — e a credenza volta a
   * ser o que ela é.
   *
   * As três referências que ele deu concordam numa anatomia só: as capas ficam na
   * parede, de frente, na altura do olho, em prateleiras de dois dedos de fundo; o
   * móvel embaixo guarda o resto de perfil; e no tampo fica a vitrola. É a diferença
   * entre exposição e coleção, e é exatamente a distinção que este Módulo precisa
   * fazer — sete obras dele contra sessenta discos que são o gosto dele.
   *
   * A tentativa anterior pôs as sete de frente na boca da cavidade. A face estava
   * certa e o móvel errado: uma capa na boca de uma credenza é uma capa **guardada**
   * virada para fora, que não é como ninguém expõe nada.
   *
   * Quatro em cima de três, centradas. Não é a grade cheia da referência porque a
   * parede aqui não é uma coleção — são sete, e sete fingindo ser vinte é a mesma
   * desonestidade que as sessenta lombadas anônimas eram.
   */
  const CAPA = recAlt * .96
  const sleeveGeo = new THREE.PlaneGeometry(1, 1)
  /* madeira da prateleira: a mesma da credenza, porque numa parede escura duas
     madeiras diferentes a um metro uma da outra leem como erro e não como escolha */
  const PRAT = { fundo: .20, tampo: .055, borda: .05, comp: ACERVO.W - .40 }
  /**
   * As prateleiras sobem, e o número saiu de um objeto e não do olho.
   *
   * A 1,10 do tampo, a fileira mais baixa fica onde a referência a põe — bem acima
   * do móvel, na altura do olho de quem está de pé, e não rente a ele.
   */
  const FILAS = [
    { n: 4, y: leftTop.top + 1.10 },
    { n: 3, y: leftTop.top + 2.28 },
  ]
  const PASSO = 1.16

  let posta = 0
  for (const fila of FILAS) {
    /* a prateleira: um tabuleiro e um filete na frente. O filete é o que segura a capa
       inclinada e é o que faz a peça ler como prateleira de disco em vez de tábua. */
    const tab = new THREE.Mesh(new THREE.BoxGeometry(PRAT.comp, PRAT.tampo, PRAT.fundo), NOGUEIRA)
    tab.position.set(0, fila.y, paredeZ + PRAT.fundo / 2)
    left.add(tab)
    const lip = new THREE.Mesh(new THREE.BoxGeometry(PRAT.comp, PRAT.borda, .022), NOGUEIRA)
    lip.position.set(0, fila.y + PRAT.tampo / 2 + PRAT.borda / 2, paredeZ + PRAT.fundo - .011)
    left.add(lip)

    const x0 = -((fila.n - 1) * PASSO) / 2
    for (let i = 0; i < fila.n && posta < obras.length; i++, posta++) {
      const obra = obras[posta]
      /* a captura chega depois do primeiro quadro, e a textura precisa saber. `tex`
         é declarada antes de propósito: o `onload` é assíncrono e chegaria depois de
         qualquer jeito, mas uma seta que alcança para a frente um `const` da linha
         seguinte é exatamente a forma do TDZ que já matou uma cena inteira aqui */
      let tex
      const cv = sleeveFor(obra, posta, () => { if (tex) tex.needsUpdate = true })
      tex = new THREE.CanvasTexture(cv)
      tex.colorSpace = THREE.SRGBColorSpace
      tex.anisotropy = 8
      const capa = new THREE.Mesh(sleeveGeo, new THREE.MeshStandardMaterial({
        map: tex, roughness: .80, metalness: 0,
      }))
      capa.scale.set(CAPA, CAPA, 1)
      /* encostada na parede e apoiada no filete, com a inclinação que isso obriga:
         uma capa a prumo numa prateleira rasa é uma capa colada, e o olho vê */
      capa.rotation.x = -.055
      capa.position.set(x0 + i * PASSO, fila.y + PRAT.tampo / 2 + CAPA / 2, paredeZ + .13)
      capa.name = 'acervo:obra'
      capa.userData.obra = obra.id
      capa.userData.repouso = capa.position.z
      discos.push(capa)
      left.add(capa)
    }
  }

  /**
   * O tampo, decidido objeto por objeto contra as três referências.
   *
   * Elas concordam na vitrola, que é o assunto, e o tampo fica livre ao redor dela.
   * A capa duplicada saiu: a obra já existe na parede e reaparecer sobre o móvel
   * confundia seleção com navegação.
   *
   * O amplificador saiu quando entrou a vitrola de corneta. Antes ele explicava como
   * a peça escrita tocava; agora repetia uma função que a corneta já torna visível e
   * ainda fazia dois volumes de madeira disputarem o centro do tampo.
   *
   * O que ficou de fora e por quê: caixas de som (a sala já tem dois monitores, e
   * repetir é o que fazia a mobília ler como cenário), planta (saiu na rodada
   * passada), luminária (desceu para o chão), quadrinhos e velas (a sala já tem
   * ambas em outros lugares, e aqui competiriam com as capas).
   *
   */

  /**
   * A vitrola, agora modelada — sem deixar de ser o lugar onde a obra toca.
   *
   * O primeiro arquivo escolhido, `50s Record Player Cabinet`, era um móvel de chão.
   * Embuti-lo no tampo apagou justamente pernas, frente e volume — a silhueta que dizia
   * o que ele era — e o disco escrito, maior que a profundidade restante, atravessou a
   * caixa. Não era ajuste de escala: era a peça errada para o lugar decidido na ADR-0031.
   *
   * `Vintage record player`, o segundo arquivo de Fernando, é uma vitrola de mesa. A
   * corneta dá uma leitura inequívoca mesmo no enquadramento distante e a base cabe no
   * tampo sem fingir ser parte da credenza. O dourado não é um adereço novo: conversa
   * com o filete das capas dentro da mesma Pool quente do globo.
   *
   * A malha baixada não separa o disco. Cobri-lo com outro cilindro produziu duas
   * superfícies quase coincidentes, e essa pequena diferença lia como defeito antes de
   * ler como movimento. O disco do modelo fica inteiro e estático. O fallback escrito
   * também sai: no Acervo, objeto visível é modelo.
   */
  const vit = new THREE.Group()
  vit.position.set(0, leftTop.top, .05)
  left.add(vit)

  let pedirVitrola = null
  let resolverVitrola
  let podeCarregarVitrola = false
  const vitrolaPronta = new Promise(resolve => { resolverVitrola = resolve })
  function carregarVitrola() {
    if (pedirVitrola) return pedirVitrola
    pedirVitrola = new GLTFLoader().loadAsync(
      (import.meta.env?.BASE_URL || '/') + 'mobilia/vintage_record_player/vintage_record_player.gltf',
    ).then(gltf => {
      const raiz = gltf.scene
      raiz.name = 'acervo:vitrola-modelada'
      raiz.scale.setScalar(.016)
      raiz.rotation.y = -.12
      /* O centro do disco da malha é (0, 1,64, -0,03). Depois da escala ele pousa
         exatamente em (-0,16, 0,165, 0), a coordenada da vitrola escrita. */
      raiz.position.set(-.16, .139, .0005)
      raiz.traverse(o => {
        if (!o.isMesh) return
        o.castShadow = false
        o.receiveShadow = true
        const materiais = Array.isArray(o.material) ? o.material : [o.material]
        const ajustados = materiais.map(material => {
          const m = material.clone()
          /* O mapa preserva a idade da peça; a resposta de luz vem do quarto. Sem os
             mapas PBR de catálogo ela compartilha a rugosidade fosca da credenza. */
          if (m.map) { m.map.colorSpace = THREE.SRGBColorSpace; m.map.anisotropy = 4 }
          m.roughness = .72
          m.metalness = .04
          m.envMapIntensity = .45
          return m
        })
        o.material = Array.isArray(o.material) ? ajustados : ajustados[0]
      })
      vit.add(raiz)
      resolverVitrola(raiz)
      return raiz
    }).catch(erro => {
      console.warn('A vitrola modelada não carregou.', erro)
      resolverVitrola(null)
      return null
    })
    return pedirVitrola
  }

  /* A sombra é uma mancha no tampo, não mais um caster no shadow map. Descentrada
     alguns centímetros para o lado oposto do globo, com borda larga: peso, não halo. */
  const shadowCanvas = document.createElement('canvas')
  shadowCanvas.width = shadowCanvas.height = 128
  const shadowCtx = shadowCanvas.getContext('2d')
  const shadowFade = shadowCtx.createRadialGradient(55, 69, 5, 61, 63, 61)
  shadowFade.addColorStop(0, 'rgba(255,255,255,.88)')
  shadowFade.addColorStop(.46, 'rgba(255,255,255,.55)')
  shadowFade.addColorStop(1, 'rgba(255,255,255,0)')
  shadowCtx.fillStyle = shadowFade
  shadowCtx.fillRect(0, 0, 128, 128)
  const shadowMap = new THREE.CanvasTexture(shadowCanvas)
  const contactShadow = new THREE.Mesh(
    new THREE.PlaneGeometry(1.34, .78),
    new THREE.MeshBasicMaterial({
      map: shadowMap, color: 0x090706, transparent: true, opacity: .44,
      depthWrite: false, side: THREE.DoubleSide,
    }),
  )
  contactShadow.rotation.x = -Math.PI / 2
  contactShadow.rotation.z = -.12
  contactShadow.position.set(.09, .006, .035)
  contactShadow.renderOrder = 1
  vit.add(contactShadow)

  /**
   * Duas peças de apoio, ambas modeladas.
   *
   * As três referências novas não pedem um tampo cheio: repetem uma vitrola dominante
   * com vida pequena nas laterais. A suculenta traz a irregularidade orgânica sem voltar
   * à "flor estranha" de cilindros e meios-círculos; a luminária de oficina troca o globo
   * escrito por metal, juntas, vidro e uma direção de luz legível. A assimetria é de
   * matéria e altura, não duas peças espelhadas.
   */
  function pousarPropNoTampo(raiz, { nome, altura, x, z, giro = 0, materialPronto }) {
    raiz.name = nome
    raiz.rotation.y = giro
    raiz.updateMatrixWorld(true)
    const caixa = new THREE.Box3().setFromObject(raiz)
    const tamanho = caixa.getSize(new THREE.Vector3())
    raiz.scale.setScalar(altura / tamanho.y)
    raiz.updateMatrixWorld(true)
    const ajustada = new THREE.Box3().setFromObject(raiz)
    const centro = ajustada.getCenter(new THREE.Vector3())
    raiz.position.set(x - centro.x, leftTop.top - ajustada.min.y, z - centro.z)

    raiz.traverse(o => {
      if (!o.isMesh) return
      o.castShadow = false
      o.receiveShadow = true
      const materiais = Array.isArray(o.material) ? o.material : [o.material]
      const ajustados = materiais.map(material => {
        const m = material.clone()
        for (const mapa of [m.map, m.normalMap, m.roughnessMap, m.metalnessMap,
          m.aoMap, m.emissiveMap]) {
          if (mapa) mapa.anisotropy = 4
        }
        if (m.map) m.map.colorSpace = THREE.SRGBColorSpace
        m.envMapIntensity = .45
        materialPronto?.(m)
        return m
      })
      o.material = Array.isArray(o.material) ? ajustados : ajustados[0]
    })
    left.add(raiz)
    return raiz
  }

  const luzAcervo = {
    light: new THREE.PointLight(0xF3C070, 0, 9, 2),
    glowMaterials: [],
    multiplier: .30,
  }
  luzAcervo.light.position.set(1.35, leftTop.top + .67, .04)
  left.add(luzAcervo.light)
  lamps.push(luzAcervo)

  let pedirPlanta = null
  let resolverPlanta
  const plantaPronta = new Promise(resolve => { resolverPlanta = resolve })
  function carregarPlanta() {
    if (pedirPlanta) return pedirPlanta
    pedirPlanta = new GLTFLoader().loadAsync(
      (import.meta.env?.BASE_URL || '/') + 'mobilia/potted_plant_04/potted_plant_04_1k.gltf',
    ).then(gltf => {
      const raiz = pousarPropNoTampo(gltf.scene, {
        nome: 'acervo:suculenta-modelada', altura: .68, x: -2.16, z: .02, giro: .34,
      })
      resolverPlanta(raiz)
      return raiz
    }).catch(erro => {
      console.warn('A suculenta modelada não carregou.', erro)
      resolverPlanta(null)
      return null
    })
    return pedirPlanta
  }

  let pedirLuminaria = null
  let resolverLuminaria
  const luminariaPronta = new Promise(resolve => { resolverLuminaria = resolve })
  function carregarLuminaria() {
    if (pedirLuminaria) return pedirLuminaria
    pedirLuminaria = new GLTFLoader().loadAsync(
      (import.meta.env?.BASE_URL || '/') + 'mobilia/industrial_pipe_lamp/industrial_pipe_lamp_1k.gltf',
    ).then(gltf => {
      const raiz = pousarPropNoTampo(gltf.scene, {
        nome: 'acervo:luminaria-modelada', altura: .88, x: 1.35, z: .03, giro: -.52,
        materialPronto: material => {
          if (!material.emissiveMap && material.emissive?.getHex() === 0) return
          material.emissiveIntensity = .05
          luzAcervo.glowMaterials.push(material)
        },
      })
      resolverLuminaria(raiz)
      return raiz
    }).catch(erro => {
      console.warn('A luminária modelada não carregou.', erro)
      resolverLuminaria(null)
      return null
    })
    return pedirLuminaria
  }

  /* ---- the right bay: a workbench, clear of the fireplace sightline ---- */
  const RIGHT_D = 1.10
  /* A antiga baia dividia o mesmo plano da lareira. O relógio e cinco pedais ficavam
     na frente do fogo nas duas estações e os objetos de trabalho viravam ruído. Ela
     avança para a metade da frente da parede: continua encostada, mas passa a ser um
     lugar próprio, com circulação entre bancada e estar. */
  const right = bay(sideX - 0.30 - RIGHT_D / 2, wallFace + 12.6, -Math.PI / 2)
  const rightTop = credenza(right, { x: 0, z: 0, w: 4.2, h: 1.30, d: RIGHT_D, floorY })
  const pedalCols = [0x8A2E12, 0x2E4750, 0x6B5A2A, 0x24303A, 0x5A2321]
  const pedalGeom = new THREE.BoxGeometry(.42, .16, .58)
  const knobGeom = new THREE.CylinderGeometry(.05, .05, .06, 10)
  const knobMat = new THREE.MeshStandardMaterial({ color: 0xC9C2B0, roughness: .4, metalness: .3 })
  for (let i = 0; i < 5; i++) {
    const pd = new THREE.Mesh(pedalGeom, new THREE.MeshStandardMaterial({
      color: pedalCols[i], roughness: .5, metalness: .5 }))
    pd.position.set(-1.35 + i * .58, rightTop.top + .08, -.02); right.add(pd)
    const kn = new THREE.Mesh(knobGeom, knobMat)
    kn.position.set(-1.35 + i * .58, rightTop.top + .19, -.16); right.add(kn)
  }
  /* coiled cables on the shelf below — one warm, one cold, like the Plate */
  const coilGeom = new THREE.TorusGeometry(.30, .045, 8, 28)
  for (const [i, col] of [[0, 0x8A2E12], [1, 0x2E5A70]]) {
    const coil = new THREE.Mesh(coilGeom, new THREE.MeshStandardMaterial({ color: col, roughness: .72 }))
    coil.rotation.x = Math.PI / 2
    coil.position.set(-.55 + i * .95, floorY + .72, .10); right.add(coil)
  }
  lamps.push(globeLamp(right, 1.75, rightTop.top, -.04))

  /* ---- arched acoustic panels: two on the left, three on the right ----
     Deliberately unequal. Six panels in two mirrored threes was the single
     loudest thing saying "this was arranged, not lived in". */
  const PANEL = { w: 1.52, h: 4.20, d: .16 }
  const geom = archGeom(PANEL.w, PANEL.h, PANEL.d)
  /**
   * Quatro, e não cinco — **o quinto estava por cima do retrato.**
   *
   * Havia um painel em `x = -6,35`, EMBER com a lua. Ele ocupa de -7,13 a -5,57 e a
   * face dele fica em `z = -10,60`; a pintura da Lyra está em -10,74 e vai de -6,43 a
   * -4,27. Medido: o painel adiantava **14 centímetros** em relação ao quadro e cobria
   * **40% da largura da pintura**. Não era penumbra nem enquadramento — era um objeto
   * na frente de outro, e o de trás era o assunto de um Módulo.
   *
   * Estava assim desde que os dois existem. A moldura escrita era uma barra chapada e
   * o corte não se lia; a moldura modelada tem um filete de ouro que some atrás do
   * vermelho, e aí ficou impossível não ver.
   *
   * Tirar o painel é a correção honesta: ninguém pendura um quadro em cima de um
   * painel acústico, tira o painel. E um mais três continua sendo a assimetria que o
   * comentário original pede — o que ele proíbe é três espelhando três.
   *
   * `alto` viaja no dado em vez de sair de `n % 2` para que remover uma entrada não
   * mexa na altura das outras quatro: as três da direita ficam exatamente onde
   * estavam.
   */
  const PAINEIS = [
    { x: -8.15, cor: BONE, motivo: 'star', alto: false, semente: 4000 },
    { x: 4.35, cor: COLD, motivo: 'sun', alto: false, semente: 4274 },
    { x: 6.15, cor: EMBER, motivo: 'moon', alto: true, semente: 4411 },
    { x: 7.95, cor: BONE, motivo: 'star', alto: false, semente: 4548 },
  ]
  for (const pn of PAINEIS) {
    const m = new THREE.Mesh(geom, new THREE.MeshStandardMaterial({
      map: panelFace(pn.cor, pn.motivo, pn.semente), roughness: .94, metalness: 0,
    }))
    /* heights nudged apart — a row of tops at one level is another giveaway */
    m.position.set(pn.x, floorY + 3.05 + (pn.alto ? .18 : -.12), wallFace + .02)
    room.add(m)
  }

  /* ---- monitors, forward of the wall on their stands, flanking the window ----
     Not mirrored: the left one stands closer and reads larger, which is what puts
     the two of them at different depths instead of on one line. */
  monitor(room, -3.30, wallFace + 2.10, floorY, wallFace + 2.10)
  monitor(room, 3.95, wallFace + 1.25, floorY, wallFace + 1.25)

  /**
   * The lamps go out with the room.
   *
   * `CONTEXT.md`: at Vigil 1 every lamp is out and the Screen's phosphor is the
   * only source. A studio lamp that stayed on would quietly break the one rule the
   * whole object is built around.
   *
   * They die *early* — gone by .55, before the last Candles. That is the order you
   * would actually do it in: kill the room lights, work by candle, and let the
   * Screen have the last of it.
   */
  let globeI = 5.2
  let lastK = 1
  let podeCarregarProps = false
  /**
   * `roomK` — how much room there is to light, 0..1.
   *
   * Without it these two lamps answered to the Vigil and to nothing else, so with the
   * room switched off they stayed lit at full intensity, illuminating furniture the
   * camera cannot see. That is precisely the waste ADR-0019 was written about: a
   * visible light compiles into the shader and is evaluated by every lit fragment
   * regardless of what it is pointed at.
   *
   * It arrives as an argument rather than being read from a module the decor does not
   * import, because the caller is the one that knows — and because the whole point is
   * that these lamps have **one** writer. `setRoomAmount` dimming them and `applyVigil`
   * turning them straight back on was the third instance of that bug in one session.
   */
  function update(vigil, roomK = 1) {
    if (podeCarregarCredenza && roomK > 0) carregarCredenza()
    if (podeCarregarVitrola && roomK > 0) carregarVitrola()
    if (podeCarregarProps && roomK > 0) {
      carregarPlanta()
      carregarLuminaria()
    }
    const k = Math.max(0, Math.min(1, 1 - vigil / .55))
    const e = k * k * (3 - 2 * k) * Math.max(0, Math.min(1, roomK))
    lastK = e
    for (const l of lamps) {
      l.light.intensity = e * globeI * (l.multiplier ?? 1)
      /* out means out of the shader, not multiplied by zero — see `dim()` */
      l.light.visible = l.light.intensity > 0.0005
      if (l.globe) l.globe.material.emissiveIntensity = .06 + e * 1.44
      for (const material of l.glowMaterials || []) material.emissiveIntensity = .05 + e * 2.15
    }
  }
  update(0)
  /* A chamada acima inicializa as lâmpadas antes de `scene.js` entregar o estado real
     da sala. Ela não é uma visita ao quarto e portanto não pode disparar o download. */
  podeCarregarVitrola = true
  podeCarregarCredenza = true
  podeCarregarProps = true

  /* `__unit.setLight({ globe })` — the fitted value needs eyes on it like the rest. */
  function setGlobe(i) {
    globeI = i
    for (const l of lamps) {
      l.light.intensity = lastK * globeI * (l.multiplier ?? 1)
      l.light.visible = l.light.intensity > 0.0005
    }
    return globeI
  }

  return {
    update, setGlobe, group, discos,
    lamps: lamps.map(l => l.light),
    pronto: Promise.all([vitrolaPronta, credenzaPronta, plantaPronta, luminariaPronta]),
  }
}
