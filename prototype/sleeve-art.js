/**
 * A capa do Acervo: uma matéria, uma tinta, sete assinaturas.
 *
 * O desenho mora fora da cena para que `capa-fit` mostre exatamente os pixels que
 * viram textura no quarto. A assinatura completa é a regra; nome composto e símbolo
 * só se separam quando a assinatura real não sobreviver à distância.
 */

import { asset } from './asset.js'

const GOLD = '#C9BE96'
const INK = '#0C0A0B'

const ASSINATURAS = {
  graecus: { x: .155, y: .016, w: .205, h: .088 },
  cmpinox: { x: .022, y: .010, w: .125, h: .092 },
  maiara: { x: .020, y: .006, w: .220, h: .100 },
  anelise: { x: .035, y: .006, w: .315, h: .108 },
  helder: { x: .014, y: .004, w: .170, h: .094 },
}

function rng(seed) {
  let s = seed >>> 0
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296)
}

function smoothstep(a, b, x) {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

function grao(g, S, rnd) {
  for (let y = 0; y < S; y += 7) {
    for (let x = 0; x < S; x += 7) {
      if (rnd() > .18) continue
      g.fillStyle = `rgba(201,190,150,${.04 + rnd() * .09})`
      g.beginPath(); g.arc(x, y, .8 + rnd() * 1.8, 0, Math.PI * 2); g.fill()
    }
  }
}

/** Isola a marca do cabeçalho e a converte na única tinta do selo. */
function assinatura(g, S, img, spec) {
  const sw = Math.max(1, Math.round(img.width * spec.w))
  const sh = Math.max(1, Math.round(img.height * spec.h))
  const c = document.createElement('canvas'); c.width = sw; c.height = sh
  const gg = c.getContext('2d', { willReadFrequently: true })
  gg.drawImage(img, img.width * spec.x, img.height * spec.y, sw, sh, 0, 0, sw, sh)

  const d = gg.getImageData(0, 0, sw, sh)
  const px = d.data
  const cantos = [[2, 2], [sw - 3, 2], [2, sh - 3], [sw - 3, sh - 3]]
  const fundo = [0, 1, 2].map(ch => {
    const vals = cantos.map(([x, y]) => px[(y * sw + x) * 4 + ch]).sort((a, b) => a - b)
    return (vals[1] + vals[2]) / 2
  })
  const fundoL = fundo[0] * .299 + fundo[1] * .587 + fundo[2] * .114
  let minX = sw, minY = sh, maxX = 0, maxY = 0

  for (let k = 0; k < px.length; k += 4) {
    const dr = px[k] - fundo[0], dv = px[k + 1] - fundo[1], db = px[k + 2] - fundo[2]
    const distancia = Math.sqrt(dr * dr + dv * dv + db * db)
    const luz = px[k] * .299 + px[k + 1] * .587 + px[k + 2] * .114
    const sinal = Math.max(distancia / 150, (luz - fundoL) / 105)
    const a = Math.round(smoothstep(.10, .38, sinal) * 255)
    px[k] = 201; px[k + 1] = 190; px[k + 2] = 150; px[k + 3] = a
    if (a > 18) {
      const p = k / 4, x = p % sw, y = Math.floor(p / sw)
      minX = Math.min(minX, x); minY = Math.min(minY, y)
      maxX = Math.max(maxX, x); maxY = Math.max(maxY, y)
    }
  }
  gg.putImageData(d, 0, 0)
  if (minX > maxX || minY > maxY) return false

  const bw = maxX - minX + 1, bh = maxY - minY + 1
  const escala = Math.min(S * .72 / bw, S * .27 / bh)
  const dw = bw * escala, dh = bh * escala
  g.drawImage(c, minX, minY, bw, bh, (S - dw) / 2, S * .50 - dh / 2, dw, dh)
  return true
}

function textoAjustado(g, texto, familia, peso, max, inicial) {
  let corpo = inicial
  do {
    g.font = `${peso} ${Math.round(corpo)}px ${familia}`
    corpo -= 2
  } while (g.measureText(texto).width > max && corpo > 20)
}

function lettering(g, S, work) {
  const portfolio = work.id === 'portfolio'
  const texto = portfolio ? 'FER BITTENCOURT'
    : work.id === 'miscelanea' ? 'MISCELÂNEA'
      : (work.client || work.title).toUpperCase()
  const familia = portfolio ? '"UnifrakturMaguntia", "Archivo", serif'
    : '"Archivo", system-ui, sans-serif'
  textoAjustado(g, texto, familia, 700, S * .72, S * (portfolio ? .105 : .090))
  g.fillStyle = GOLD
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillText(texto, S * .5, S * .50)
  g.textBaseline = 'alphabetic'
}

let tile = null
function reticula(g) {
  if (!tile) {
    tile = document.createElement('canvas'); tile.width = tile.height = 4
    const t = tile.getContext('2d')
    t.fillStyle = '#000'
    t.beginPath(); t.arc(2, 2, 1.05, 0, Math.PI * 2); t.fill()
  }
  return g.createPattern(tile, 'repeat')
}

function materia(g, S, i) {
  const rnd = rng(5100 + i * 71)

  const gr = g.getImageData(0, 0, S, S)
  const px = gr.data
  for (let k = 0; k < px.length; k += 4) {
    const n = (rnd() - .5) * 15 + (rnd() - .5) * 7
    px[k] = Math.max(0, Math.min(255, px[k] + n))
    px[k + 1] = Math.max(0, Math.min(255, px[k + 1] + n))
    px[k + 2] = Math.max(0, Math.min(255, px[k + 2] + n))
  }
  g.putImageData(gr, 0, 0)

  g.save()
  g.globalAlpha = .10
  g.globalCompositeOperation = 'multiply'
  g.translate(S / 2, S / 2); g.rotate(Math.PI / 4); g.translate(-S / 2, -S / 2)
  /* one 4 px tile repeated, not a quarter of a million separate arcs: the dots never
     touch, so filling them one by one and filling the pattern once put down the same
     pixels — and the loop was half of the whole scene's start-up on a phone */
  g.fillStyle = reticula(g)
  g.translate(-2, -2)
  g.fillRect(-S, -S, S * 3, S * 3)
  g.restore()

  const cx = S * (.5 + (rnd() - .5) * .04), cy = S * (.5 + (rnd() - .5) * .04)
  g.save()
  g.globalCompositeOperation = 'overlay'
  for (const [r, a, w] of [[S * .385, .34, 2.4], [S * .376, .18, 1.2], [S * .128, .20, 1.6]]) {
    g.globalAlpha = a
    g.strokeStyle = '#EFE7D2'; g.lineWidth = w
    g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.stroke()
  }
  g.restore()

  g.save()
  g.globalCompositeOperation = 'overlay'
  for (let k = 0; k < 46; k++) {
    const lado = Math.floor(rnd() * 4), t = rnd()
    let x, y
    if (lado === 0) { x = t * S; y = rnd() * 5 }
    else if (lado === 1) { x = S - rnd() * 5; y = t * S }
    else if (lado === 2) { x = t * S; y = S - rnd() * 5 }
    else { x = rnd() * 5; y = t * S }
    g.globalAlpha = .10 + rnd() * .22
    g.fillStyle = '#EFE7D2'
    g.fillRect(x, y, 1 + rnd() * 7, 1 + rnd() * 3)
  }
  g.restore()

  g.save()
  g.globalCompositeOperation = 'screen'
  const luz = g.createLinearGradient(0, S, S, 0)
  luz.addColorStop(0, 'rgba(255,246,224,0)')
  luz.addColorStop(.46, 'rgba(255,246,224,.05)')
  luz.addColorStop(.62, 'rgba(255,246,224,.085)')
  luz.addColorStop(.80, 'rgba(255,246,224,0)')
  g.fillStyle = luz; g.fillRect(0, 0, S, S)
  g.restore()

  g.save()
  g.globalCompositeOperation = 'multiply'
  const vinco = g.createLinearGradient(0, 0, S * .06, 0)
  vinco.addColorStop(0, 'rgba(12,10,11,.55)')
  vinco.addColorStop(1, 'rgba(12,10,11,0)')
  g.fillStyle = vinco; g.fillRect(0, 0, S * .06, S)
  g.restore()
}

export function drawSleeve(g, S, work, index, img = null) {
  const rnd = rng(6100 + index * 83)
  g.clearRect(0, 0, S, S)
  g.fillStyle = INK; g.fillRect(0, 0, S, S)
  grao(g, S, rnd)

  const spec = ASSINATURAS[work.id]
  if (!(img && spec && assinatura(g, S, img, spec))) lettering(g, S, work)
  materia(g, S, index)
}

/** Canvas pronto para virar textura; redesenha quando a captura real chega. */
export function sleeveCanvas(work, index, aoCarregar) {
  const c = document.createElement('canvas')
  c.width = 640; c.height = 640
  const g = c.getContext('2d', { willReadFrequently: true })
  drawSleeve(g, c.width, work, index)

  const src = work.images?.[0]
  if (!src || !ASSINATURAS[work.id]) return c
  const img = new Image()
  img.onload = () => {
    drawSleeve(g, c.width, work, index, img)
    aoCarregar?.()
  }
  img.src = asset(src)
  return c
}
