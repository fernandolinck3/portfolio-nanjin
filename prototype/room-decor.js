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
import { medir } from './superficie.js'
import { sleeveFor } from './works-art.js'

const BONE = '#C9C2B0', EMBER = '#B4472A', COLD = '#6E8493'
const GILT = 0xB08D4A

function rng(seed) {
  let s = seed >>> 0
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296)
}

/**
 * A baia do acervo, em números — e eles saem daqui porque duas pessoas os leem.
 *
 * `summon.js` precisa saber onde a peça pousa, e a peça pousa **na vitrola**, que fica
 * no tampo desta credenza. Antes era um plinto de pedra com coordenada própria, escrita
 * num arquivo e conferida em nenhum: a lição do `screenHit` vale para geometria igual.
 */
const ACERVO = { W: 6.0, H: 1.45, D: 1.15, RECUO: .30, DZ: 6.4 }

/** Onde o disco pousa: o centro do prato da vitrola, em coordenadas de mundo. */
export function vitrolaPos({ floorY, sideX, wallFace }) {
  return {
    x: -sideX + ACERVO.RECUO + ACERVO.D / 2 + .05,
    y: floorY + .16 + ACERVO.H + .16,
    z: wallFace + ACERVO.DZ,
  }
}

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
  const leftTop = credenza(left, { x: 0, z: 0, w: ACERVO.W, h: ACERVO.H, d: LEFT_D, floorY, aberta: true })
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
   * Records: thin slabs leaning in a row. Their spines are the only place in the
   * room with arbitrary colour, which is what makes them read as somebody's
   * collection rather than as decoration.
   *
   * E até 2026-09-06 nenhuma delas chegou a um pixel: estavam a `floorY + .78`, dentro
   * de um corpo maciço que ia de `floorY + .16` a `floorY + 1.61`. A altura vem da
   * cavidade agora, e não de uma constante que ninguém reconferia quando a carcaça
   * mudava — é a mesma razão pela qual `credenza` devolve `top` em vez de o chamador
   * recalcular.
   *
   * **A paleta continua sendo a antiga, e a primeira tentativa aqui errou por isso.**
   * Abrindo a frente eu troquei os tons escuros por vivos — dourado, verde, terracota
   * — e quarenta lombadas acesas viraram uma faixa de blocos de criança atravessando
   * um quarto que é escuridão com poços de luz. `3A2E26` estar na lista **não** é um
   * bug por ser a cor da madeira: um disco que quase some contra o móvel é o que faz
   * os outros lerem como objetos separados. O que faltava era só a frente aberta.
   *
   * Uma cor entra, e é `8C3B2E`, para a fileira ter um ponto quente onde o globo bate.
   */
  const rnd = rng(8123)
  const spines = ['#5A2321', '#2E4750', '#7A6A4A', '#3A2E26', '#8A5A3C', '#243038', '#8C3B2E']
  const recAlt = leftTop.cavidade.altura - .10
  const recGeom = new THREE.BoxGeometry(1, recAlt, LEFT_D - .22)
  /* a fileira ocupa a cavidade inteira: quarenta discos a um passo fixo enchiam dois
     terços dela, e uma estante pela metade lê como inacabada e não como espaço */
  const DISCOS = 60
  const util = 6.0 - .10 * 2 - .30
  const passo = util / DISCOS

  /**
   * As obras dele ficam **na** baia, e é a diferença entre a cena dizer a verdade e não.
   *
   * A cenografia prometia um catálogo de sessenta lombadas para um portfólio de sete
   * obras, e — o que é pior para um portfólio — nada ali separava as dele das de
   * enchimento. O visitante ficava de pé dentro do arquivo sem que um único objeto da
   * cena fosse trabalho dele, e o plinto, único lugar onde o conteúdo do Módulo existe
   * fisicamente, ficava vazio o tempo todo em que ninguém invocasse nada.
   *
   * A distinção é de **silhueta antes de cor**: a esta distância uma lombada tem uns
   * dez pixels de largura e o tom sozinho não separa nada. Elas saem da fileira — mais
   * altas e puxadas para a frente — e é a quebra do alinhamento que o olho pega, do
   * outro lado da sala, antes de qualquer matiz.
   *
   * Espalhadas, não agrupadas: sete juntas leriam como uma prateleira reservada, e o
   * que se quer dizer é que o trabalho dele está no meio do que ele ouve.
   */
  const discos = []
  for (let i = 0; i < DISCOS; i++) {
    const rec = new THREE.Mesh(recGeom, new THREE.MeshStandardMaterial({
      color: spines[i % spines.length], roughness: .88, metalness: 0,
    }))
    /* 4 a 7 cm de lombada. Já é grosso para um disco — 5 mm seriam .016 aqui — e é
       assim de propósito: mais fino que isto e a lombada some no `anisotropy` a seis
       unidades de distância, que é o enquadramento entregue. */
    rec.scale.x = .04 + rnd() * .03
    /* encostados na frente, que é de onde se olha: um disco no fundo da cavidade fica
       na sombra da própria ilharga */
    rec.position.set(-util / 2 + passo * (i + .5), leftTop.cavidade.base + recAlt / 2, .10)
    rec.rotation.z = (rnd() - .5) * .05
    left.add(rec)
  }

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
   * A primeira fila estava a 30 cm do tampo, que é o suficiente para as capas da
   * parede e **não** para o que passou a ficar no tampo: uma capa encostada tem 94 cm
   * e atravessava a prateleira de baixo. A 1,10 ela passa com folga, e de quebra é
   * onde a referência põe a fila mais baixa — bem acima do móvel, na altura do olho
   * de quem está de pé, e não rente a ele.
   */
  const FILAS = [
    { n: 4, y: leftTop.top + 1.10 },
    { n: 3, y: leftTop.top + 2.28 },
  ]
  const PASSO = 1.16

  /* a textura de cada capa, para a que fica encostada no tampo não construir a sua */
  const texPorObra = new Map()
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
      texPorObra.set(obra.id, tex)
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
   * Elas concordam em três coisas e discordam no resto, e as três que sobrevivem são
   * as que **afirmam** alguma coisa em vez de decorar:
   *
   * - **a vitrola**, que é o assunto;
   * - **o amplificador** ao lado dela, porque uma vitrola sem nada ligado é um
   *   adereço — é o objeto que diz que aquilo toca;
   * - **a capa do que está tocando**, encostada, que é o que qualquer pessoa faz com
   *   o disco que acabou de pôr.
   *
   * O que ficou de fora e por quê: caixas de som (a sala já tem dois monitores, e
   * repetir é o que fazia a mobília ler como cenário), planta (saiu na rodada
   * passada), luminária (desceu para o chão), quadrinhos e velas (a sala já tem
   * ambas em outros lugares, e aqui competiriam com as capas).
   *
   * A capa encostada é a única **viva**: ela mostra a obra selecionada na Tela. É o
   * elo que faltava entre o display e a cena — o mesmo estado, duas representações,
   * como a linha da Tela e a capa na parede já são.
   */

  /**
   * A vitrola, e ela **não é digital** — foi a palavra dele.
   *
   * A Unidade é uma CDJ: um controlador sem disco, que é o que um portfólio de front-end
   * é. O acervo é o oposto exato, e a oposição é o motivo de o quarto existir. Comanda-se
   * no aparelho digital e o trabalho toca no analógico.
   *
   * Escrita e não baixada: procurei `turntable`, `record player`, `gramophone` e
   * `vinyl` nos modelos do Poly Haven e não existe nenhum. O ADR-0029 manda modelar o
   * cenário, e a razão dele é o capitonê de um Chesterfield — uma vitrola é caixa,
   * prato, disco e um braço, que é precisamente a peça que o código faz bem.
   */
  const PRETO = new THREE.MeshStandardMaterial({ color: 0x171314, roughness: .55, metalness: .1 })
  const METAL = new THREE.MeshStandardMaterial({ color: 0x8A8578, roughness: .35, metalness: .85 })
  const vit = new THREE.Group()
  vit.position.set(0, leftTop.top, .05)
  left.add(vit)

  const corpo = new THREE.Mesh(new THREE.BoxGeometry(1.42, .12, 1.02), NOGUEIRA)
  corpo.position.y = .06
  vit.add(corpo)
  const prato = new THREE.Mesh(new THREE.CylinderGeometry(.48, .48, .04, 32), METAL)
  prato.position.set(-.16, .14, 0)
  vit.add(prato)

  /* o disco no prato, e o rótulo dele — o rótulo é o que faz o giro se ver. Um disco
     preto liso girando é um disco preto parado. */
  const disco = new THREE.Group()
  disco.position.copy(prato.position)
  disco.position.y += .025
  vit.add(disco)
  disco.add(new THREE.Mesh(new THREE.CylinderGeometry(.46, .46, .008, 32), PRETO))
  const rot = new THREE.Mesh(new THREE.CylinderGeometry(.15, .15, .010, 24),
    new THREE.MeshStandardMaterial({ color: 0xC9BE96, roughness: .8 }))
  rot.position.y = .002
  disco.add(rot)
  /* a marca fora do centro: sem ela o rótulo é um círculo, e um círculo girando em
     torno do próprio centro é indistinguível de um parado */
  const mira = new THREE.Mesh(new THREE.BoxGeometry(.10, .012, .02),
    new THREE.MeshStandardMaterial({ color: 0x8C3B2E, roughness: .9 }))
  mira.position.set(.07, .008, 0)
  disco.add(mira)

  /* o braço: pivô atrás à direita, tubo por cima do disco, cápsula na ponta */
  const pivo = new THREE.Mesh(new THREE.CylinderGeometry(.07, .08, .10, 16), METAL)
  pivo.position.set(.52, .17, -.34)
  vit.add(pivo)
  const braco = new THREE.Mesh(new THREE.CylinderGeometry(.018, .018, .82, 12), METAL)
  braco.rotation.set(0, 0, Math.PI / 2)
  braco.rotation.y = -.62
  braco.position.set(.30, .22, -.16)
  vit.add(braco)
  const capsula = new THREE.Mesh(new THREE.BoxGeometry(.07, .05, .05), PRETO)
  capsula.position.set(.01, .19, .02)
  vit.add(capsula)

  /* o amplificador: caixa baixa, painel escovado, dois botões e o filete do mostrador.
     Fica à direita porque o braço da vitrola sai por ali e os dois lidos juntos leem
     como uma instalação em vez de duas peças postas lado a lado. */
  const amp = new THREE.Group()
  amp.position.set(1.42, leftTop.top, .02)
  left.add(amp)
  /* `position` de um Object3D é somente leitura: só `.set()` escreve nele. Um
     `Object.assign` com `position` lança em tempo de execução e mata a cena inteira,
     que foi como este bloco nasceu. */
  const caixaAmp = new THREE.Mesh(new THREE.BoxGeometry(1.06, .26, .86), PRETO)
  caixaAmp.position.set(0, .13, 0)
  amp.add(caixaAmp)
  const face = new THREE.Mesh(new THREE.BoxGeometry(1.02, .20, .03), METAL)
  face.position.set(0, .14, .43)
  amp.add(face)
  for (const bx of [-.34, -.16]) {
    const k = new THREE.Mesh(new THREE.CylinderGeometry(.055, .055, .05, 16), METAL)
    k.rotation.x = Math.PI / 2
    k.position.set(bx, .14, .46)
    amp.add(k)
  }
  const mostrador = new THREE.Mesh(new THREE.BoxGeometry(.34, .07, .01),
    new THREE.MeshStandardMaterial({ color: 0xC9BE96, emissive: 0xB08D4A, emissiveIntensity: .5, roughness: .7 }))
  mostrador.position.set(.26, .14, .45)
  amp.add(mostrador)

  /**
   * A capa do que está tocando — encostada no tampo, à esquerda da vitrola.
   *
   * Reaproveita a textura que a parede já construiu: `texPorObra` é o mesmo canvas,
   * então mostrar aqui não custa memória de vídeo nenhuma. Uma segunda cópia seria
   * uma segunda lista, e a esta altura o repositório já pagou por isso três vezes.
   */
  const encostada = new THREE.Mesh(sleeveGeo, new THREE.MeshStandardMaterial({
    map: null, roughness: .80, metalness: 0, transparent: true, opacity: 0,
  }))
  encostada.scale.set(CAPA, CAPA, 1)
  encostada.rotation.x = -.16
  encostada.position.set(-1.62, leftTop.top + CAPA / 2 - .02, paredeZ + .30)
  left.add(encostada)


  /**
   * A planta saiu.
   *
   * Era um vaso de cilindro e nove meios-círculos como folhas, herdada de quando esta
   * baia era "um estúdio" genérico. Numa parede de capas com uma vitrola embaixo ela
   * não é o objeto macio que justifica a exceção — é a peça pior feita do enquadramento,
   * e ele a viu na primeira olhada: *"uma flor estranha"*. Nada substitui: o assunto da
   * estação agora tem dono, e um objeto a mais em cima do móvel disputa com a vitrola.
   */

  /* no chão, passada a ponta da credenza: é onde as três referências põem a luz da
     parede de discos, e é o que tira o segundo objeto brilhante de cima do móvel */
  lamps.push(globeLamp(left, ACERVO.W / 2 + .55, floorY, -.10, 2.30))

  /* ---- the right bay: the pedal cabinet, along the right wall ---- */
  const RIGHT_D = 1.10
  const right = bay(sideX - 0.30 - RIGHT_D / 2, wallFace + 7.2, -Math.PI / 2)
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
  /**
   * O prato gira a 33⅓ — 3,49 rad/s, que é o número e não uma velocidade escolhida.
   *
   * O `dt` sai do relógio e não do laço porque `update` foi escrita com dois
   * argumentos e os dois são estado, não tempo. Assim um quadro perdido não vira giro
   * acumulado, e o disco para junto com o quarto: `roomK === 0` é quarto desligado, e
   * um `rotation.y` avançando para ninguém é trabalho pago por nada.
   */
  let ultimoGiro = 0
  function girar(roomK) {
    const agora = performance.now() / 1000
    const dt = ultimoGiro ? Math.min(.1, agora - ultimoGiro) : 0
    ultimoGiro = agora
    if (roomK > 0) disco.rotation.y += 3.49 * dt
  }

  function update(vigil, roomK = 1) {
    girar(roomK)
    const k = Math.max(0, Math.min(1, 1 - vigil / .55))
    const e = k * k * (3 - 2 * k) * Math.max(0, Math.min(1, roomK))
    lastK = e
    for (const l of lamps) {
      l.light.intensity = e * globeI
      /* out means out of the shader, not multiplied by zero — see `dim()` */
      l.light.visible = l.light.intensity > 0.0005
      l.globe.material.emissiveIntensity = .06 + e * 1.44
    }
  }
  update(0)

  /* `__unit.setLight({ globe })` — the fitted value needs eyes on it like the rest. */
  function setGlobe(i) {
    globeI = i
    for (const l of lamps) { l.light.intensity = lastK * globeI; l.light.visible = l.light.intensity > 0.0005 }
    return globeI
  }

  /* `lamps` so scene.js can put the globes out when the room itself is hidden —
     a light that illuminates nothing invisible still costs every lit fragment. */
  /**
   * Qual capa está encostada no tampo. `null` apaga.
   *
   * Chamada do laço com um guarda de igualdade: trocar de Módulo ou de linha na Tela
   * troca a capa aqui, e é assim que o quarto sabe o que o display está mostrando.
   */
  function destacar(obraId) {
    const tex = obraId ? texPorObra.get(obraId) : null
    encostada.material.map = tex || null
    encostada.material.opacity = tex ? 1 : 0
    encostada.material.needsUpdate = true
    encostada.visible = !!tex
  }
  destacar(null)

  return { update, setGlobe, destacar, group, discos, lamps: lamps.map(l => l.light) }
}
