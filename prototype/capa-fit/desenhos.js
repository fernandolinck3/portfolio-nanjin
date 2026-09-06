/**
 * Quatro desenhos de capa, para escolher olhando.
 *
 * Um site **não tem capa**. Não existe imagem certa a extrair de uma página de texto,
 * e é por isso que o recorte da primeira versão pegava palavras cortadas: a
 * matéria-prima estava errada, não o enquadramento. Uma capa de disco é *sobre* a
 * música, não uma fotografia da fita — então a capa de uma obra é desenhada sobre ela.
 *
 * Estes quatro são as quatro respostas possíveis a isso, e existem juntos porque a
 * escolha é de olho e não de argumento. Todos desenham no mesmo quadrado de 640 e
 * todos têm de passar no único teste que importa: ler a **cem pixels**, que é o
 * tamanho de uma capa na parede do acervo no enquadramento da estação.
 */

const BONE = '#DCD6C6', GOLD = '#C9BE96', EMBER = '#F87A5E', RED = '#C4281C', INK = '#0C0A0B'

export const NOMES = {
  tipo: 'A · TIPOGRÁFICA',
  campo: 'B · CAMPO DE COR',
  selo: 'C · SELO',
  detalhe: 'D · UM ELEMENTO SÓ',
  marca: 'E · A MARCA DO SITE',
}

function rng(seed) {
  let s = seed >>> 0
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296)
}

/** O meio-tom do quarto, usado por três dos quatro. */
function grao(g, S, rnd, densidade = .38) {
  for (let y = 0; y < S; y += 7) {
    for (let x = 0; x < S; x += 7) {
      if (rnd() > densidade) continue
      g.fillStyle = `rgba(201,190,150,${0.04 + rnd() * 0.09})`
      g.beginPath(); g.arc(x, y, 0.8 + rnd() * 1.8, 0, 6.2832); g.fill()
    }
  }
}

/** O número, embaixo à esquerda, do mesmo jeito em todos — é o que faz um selo. */
function numero(g, S, work, cor = GOLD) {
  g.fillStyle = cor
  g.font = `400 ${Math.round(S * 0.038)}px "Azeret Mono", ui-monospace, monospace`
  g.textAlign = 'left'
  g.fillText(work.no, S * 0.07, S * 0.945)
}

/**
 * A — tipográfica. O nome é o assunto.
 *
 * Blue Note e Factory: a capa é o nome, posto grande, quebrado em linhas, sobre campo
 * quase vazio. É o único dos quatro em que nada pode sair cortado, porque a palavra
 * inteira **é** o desenho — e é o que lê melhor a cem pixels, porque uma palavra curta
 * em corpo alto continua sendo uma mancha reconhecível quando o texto some.
 */
export function tipo(g, S, work, i) {
  const rnd = rng(300 + i * 31)
  g.fillStyle = INK; g.fillRect(0, 0, S, S)
  grao(g, S, rnd, .22)

  /* a barra de cor: identifica a obra antes de o nome ser legível, e é o que impede
     sete capas tipográficas de virarem sete retângulos pretos na parede */
  const tons = [RED, '#2E4750', '#7A6A4A', '#8A5A3C', '#3F5B4C', '#6B4463', '#8C3B2E']
  g.fillStyle = tons[i % tons.length]
  g.fillRect(0, S * 0.06, S, S * 0.055)

  const palavras = work.title.toUpperCase().split(/\s+/)
  const linhas = []
  for (const p of palavras) {
    if (linhas.length && (linhas[linhas.length - 1] + ' ' + p).length <= 9) linhas[linhas.length - 1] += ' ' + p
    else linhas.push(p)
  }
  const corpo = Math.min(S * 0.22, (S * 0.86) / Math.max(...linhas.map(l => l.length)) * 1.72)
  g.fillStyle = BONE
  g.textAlign = 'left'
  linhas.slice(0, 4).forEach((l, n) => {
    g.font = `700 ${Math.round(corpo)}px "Archivo", system-ui, sans-serif`
    g.fillText(l, S * 0.07, S * 0.34 + n * corpo * 1.02)
  })

  g.strokeStyle = GOLD; g.lineWidth = 2
  g.beginPath(); g.moveTo(S * 0.07, S * 0.88); g.lineTo(S * 0.93, S * 0.88); g.stroke()
  numero(g, S, work)
  g.fillStyle = GOLD
  g.font = `400 ${Math.round(S * 0.032)}px "Azeret Mono", ui-monospace, monospace`
  g.textAlign = 'right'
  g.fillText(work.kind.toUpperCase(), S * 0.93, S * 0.945)
}

/**
 * B — campo de cor, tirado do site de verdade.
 *
 * A cor vem da captura: a média de uma faixa dela, empurrada para a paleta do quarto.
 * Não se lê nada e não é para ler — o que a capa entrega é **temperatura**, e a parede
 * ganha sete delas em vez de sete cinzas. Quando o case abre, a cor bate com o site.
 *
 * Precisa da imagem carregada; sem ela cai numa cor determinística pelo índice, que é
 * o que o desenho tem de fazer enquanto a captura não chegou.
 */
export function campo(g, S, work, i, img) {
  const rnd = rng(900 + i * 47)
  let cor = ['#5A2321', '#2E4750', '#7A6A4A', '#8A5A3C', '#3F5B4C', '#6B4463', '#8C3B2E'][i % 7]
  if (img) {
    const c = document.createElement('canvas'); c.width = 32; c.height = 32
    const gg = c.getContext('2d')
    gg.drawImage(img, 0, 0, 32, 32)
    const d = gg.getImageData(0, 0, 32, 32).data
    let r = 0, v = 0, b = 0, n = 0
    for (let k = 0; k < d.length; k += 4) {
      const l = (d[k] * .299 + d[k + 1] * .587 + d[k + 2] * .114) / 255
      /* branco de navegador e preto de texto não são a cor do site: só o meio conta */
      if (l < .12 || l > .88) continue
      r += d[k]; v += d[k + 1]; b += d[k + 2]; n++
    }
    if (n) cor = `rgb(${Math.round(r / n)},${Math.round(v / n)},${Math.round(b / n)})`
  }

  g.fillStyle = INK; g.fillRect(0, 0, S, S)
  g.fillStyle = cor; g.fillRect(0, 0, S, S)
  /* escurece por cima: a cor de um site é clara demais para este quarto, e a capa tem
     de pousar na parede sem virar uma lâmpada */
  g.fillStyle = 'rgba(12,10,11,.42)'; g.fillRect(0, 0, S, S)
  grao(g, S, rnd, .30)

  /* a forma: um arco cheio, e o vazio dele é o campo. Uma forma só, como um pôster. */
  g.save()
  g.beginPath(); g.arc(S * .5, S * .46, S * .30, Math.PI, 0); g.closePath()
  g.fillStyle = 'rgba(220,214,198,.90)'; g.fill()
  g.globalCompositeOperation = 'destination-out'
  g.beginPath(); g.arc(S * .5, S * .46, S * .17, 0, 6.2832); g.fill()
  g.restore()

  g.strokeStyle = 'rgba(201,190,150,.6)'; g.lineWidth = 2
  g.strokeRect(S * .045, S * .045, S * .91, S * .91)
  g.fillStyle = BONE
  g.font = `400 ${Math.round(S * 0.048)}px "Azeret Mono", ui-monospace, monospace`
  g.textAlign = 'center'
  g.fillText(work.title.toUpperCase(), S * .5, S * .84)
  numero(g, S, work, BONE)
}

/**
 * C — selo. Um brasão por obra.
 *
 * O mais barroco dos quatro, e o único que não depende de a captura ter um bom pedaço:
 * a marca é construída de um **fato** da obra — a inicial do nome, em blackletter,
 * dentro de um escudo com o ano embaixo. É também o único que sobrevive inteiro à
 * pixelização, se o registro de baixa resolução entrar: um brasão de seis formas
 * continua legível a 64 pixels, e uma fotografia não.
 */
export function selo(g, S, work, i) {
  const rnd = rng(1500 + i * 53)
  g.fillStyle = INK; g.fillRect(0, 0, S, S)
  grao(g, S, rnd, .34)

  const cx = S * .5, cy = S * .44, r = S * .27

  /* a orla dupla, que é o que faz uma marca ler como carimbo e não como ícone */
  g.strokeStyle = GOLD
  g.lineWidth = S * .012
  g.beginPath(); g.arc(cx, cy, r, 0, 6.2832); g.stroke()
  g.lineWidth = S * .004
  g.beginPath(); g.arc(cx, cy, r * .90, 0, 6.2832); g.stroke()

  /* os raios da orla: doze traços curtos, o vocabulário de uma medalha */
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * 6.2832
    g.beginPath()
    g.moveTo(cx + Math.cos(a) * r * .93, cy + Math.sin(a) * r * .93)
    g.lineTo(cx + Math.cos(a) * r * .985, cy + Math.sin(a) * r * .985)
    g.stroke()
  }

  /* o escudo */
  const w = r * .92, h = r * 1.06
  g.beginPath()
  g.moveTo(cx - w / 2, cy - h / 2)
  g.lineTo(cx + w / 2, cy - h / 2)
  g.lineTo(cx + w / 2, cy + h * .12)
  g.quadraticCurveTo(cx + w / 2, cy + h * .46, cx, cy + h / 2)
  g.quadraticCurveTo(cx - w / 2, cy + h * .46, cx - w / 2, cy + h * .12)
  g.closePath()
  g.fillStyle = RED; g.fill()
  g.lineWidth = S * .006; g.strokeStyle = GOLD; g.stroke()

  /* a inicial, na mesma blackletter que a abertura escreve o nome dele */
  g.fillStyle = BONE
  g.font = `700 ${Math.round(r * 1.0)}px "UnifrakturMaguntia", "Archivo", serif`
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillText(work.title.trim()[0].toUpperCase(), cx, cy - h * .02)
  g.textBaseline = 'alphabetic'

  g.strokeStyle = GOLD; g.lineWidth = 2
  g.beginPath(); g.moveTo(S * .18, S * .80); g.lineTo(S * .82, S * .80); g.stroke()
  g.fillStyle = GOLD
  g.font = `400 ${Math.round(S * 0.042)}px "Azeret Mono", ui-monospace, monospace`
  g.textAlign = 'center'
  g.fillText(work.title.toUpperCase(), S * .5, S * .875)
  numero(g, S, work)
}

/**
 * D — um elemento só, ampliado até virar abstração.
 *
 * Mantém a premissa de vir do site e resolve as palavras cortadas por força bruta:
 * amplia tanto que **não sobra palavra** — 6× em vez de 2,2×, num ponto da metade de
 * cima, onde uma página tem desenho e não texto corrido. O que sobra é cor, aresta e
 * ritmo, que é o que um pedaço muito ampliado de qualquer coisa vira.
 *
 * É o mais arriscado dos quatro: sete obras podem devolver sete manchas parecidas, e
 * isso só se sabe olhando as sete juntas — que é para isto que esta página existe.
 */
export function detalhe(g, S, work, i, img) {
  const rnd = rng(2100 + i * 61)
  g.fillStyle = INK; g.fillRect(0, 0, S, S)
  if (img) {
    const zoom = 6
    const escala = (S / Math.min(img.width, img.height)) * zoom
    const lw = img.width * escala, lh = img.height * escala
    const fx = .12 + (i % 4) * .21
    const fy = .05 + (i % 3) * .10
    g.save(); g.beginPath(); g.rect(0, 0, S, S); g.clip()
    g.drawImage(img, -(lw - S) * fx, -(lh - S) * fy, lw, lh)
    g.restore()

    /* duotone em quatro paradas: sem ele são sete retângulos de branco de navegador */
    const d = g.getImageData(0, 0, S, S)
    const px = d.data
    const paradas = [[12, 10, 11], [122, 40, 28], [201, 190, 150], [236, 230, 214]]
    for (let k = 0; k < px.length; k += 4) {
      const l = (px[k] * .299 + px[k + 1] * .587 + px[k + 2] * .114) / 255
      const t = l * (paradas.length - 1)
      const n = Math.min(paradas.length - 2, Math.floor(t))
      const f = t - n
      const a = paradas[n], b = paradas[n + 1]
      px[k] = a[0] + (b[0] - a[0]) * f
      px[k + 1] = a[1] + (b[1] - a[1]) * f
      px[k + 2] = a[2] + (b[2] - a[2]) * f
    }
    g.putImageData(d, 0, 0)
  } else {
    grao(g, S, rnd, .5)
  }

  const grad = g.createLinearGradient(0, S * .62, 0, S)
  grad.addColorStop(0, 'rgba(12,10,11,0)')
  grad.addColorStop(.5, 'rgba(12,10,11,.88)')
  grad.addColorStop(1, 'rgba(12,10,11,.97)')
  g.fillStyle = grad; g.fillRect(0, S * .62, S, S * .38)
  g.fillStyle = BONE
  g.font = `400 ${Math.round(S * 0.048)}px "Azeret Mono", ui-monospace, monospace`
  g.textAlign = 'left'
  g.fillText(work.title.toUpperCase(), S * .07, S * .875)
  numero(g, S, work)
}


/**
 * A matéria — e é a resposta à queixa que valia pelas quatro.
 *
 * Ele viu os quatro desenhos e disse que **todos** estavam flat demais. Isso não é
 * crítica de composição, é de material: uma capa de disco não é uma arte, é uma arte
 * **impressa em papelão** e guardada por anos. O que faz o olho dizer "capa" antes de
 * ler o que quer que seja é a soma de coisas que nenhum dos quatro tinha — grão de
 * papel, retícula de impressão, o anel que o disco marca por dentro, o desgaste da
 * beirada e o brilho oblíquo de uma superfície levemente encerada.
 *
 * Por isso é uma **camada** e não um quinto desenho: passa por cima de qualquer
 * composição, e é o que separa "imagem quadrada" de "objeto".
 */
export function materia(g, S, i, { anel = true, desgaste = 1 } = {}) {
  const rnd = rng(5100 + i * 71)

  /* 1. o grão. Papelão tem fibra e fibra tem direção, então o ruído entra duas vezes
        com pesos diferentes em vez de uma vez uniforme. */
  const gr = g.getImageData(0, 0, S, S)
  const px = gr.data
  for (let k = 0; k < px.length; k += 4) {
    const n = (rnd() - .5) * 15 + (rnd() - .5) * 7
    px[k] = Math.max(0, Math.min(255, px[k] + n))
    px[k + 1] = Math.max(0, Math.min(255, px[k + 1] + n))
    px[k + 2] = Math.max(0, Math.min(255, px[k + 2] + n))
  }
  g.putImageData(gr, 0, 0)

  /* 2. a retícula, a 45°: a marca de que aquilo saiu de uma máquina e não de uma tela.
        Fina de propósito — visível de perto e sumindo a cem pixels, que é exatamente o
        que uma retícula de verdade faz. */
  g.save()
  g.globalAlpha = .10
  g.globalCompositeOperation = 'multiply'
  g.translate(S / 2, S / 2); g.rotate(Math.PI / 4); g.translate(-S / 2, -S / 2)
  g.fillStyle = '#000'
  for (let y = -S; y < S * 2; y += 4)
    for (let x = -S; x < S * 2; x += 4) { g.beginPath(); g.arc(x, y, 1.05, 0, 6.2832); g.fill() }
  g.restore()

  /* 3. o anel — o detalhe mais barato e o que mais diz "disco". O vinil marca o
        papelão por dentro, e a marca fica fora de centro porque ninguém guarda um
        disco alinhado. Sem ele é um quadrado impresso; com ele é uma capa com um
        disco dentro. */
  if (anel) {
    const cx = S * (.5 + (rnd() - .5) * .04), cy = S * (.5 + (rnd() - .5) * .04)
    g.save()
    g.globalCompositeOperation = 'overlay'
    for (const [r, a, w] of [[S * .385, .34, 2.4], [S * .376, .18, 1.2], [S * .128, .20, 1.6]]) {
      g.globalAlpha = a * desgaste
      g.strokeStyle = '#EFE7D2'; g.lineWidth = w
      g.beginPath(); g.arc(cx, cy, r, 0, 6.2832); g.stroke()
    }
    g.restore()
  }

  /* 4. a beirada e os dois cantos que sempre batem. A tinta sai antes do papel, então
        o desgaste **clareia**. */
  g.save()
  g.globalCompositeOperation = 'overlay'
  for (let k = 0; k < 46; k++) {
    const lado = Math.floor(rnd() * 4), t = rnd()
    let x, y
    if (lado === 0) { x = t * S; y = rnd() * 5 }
    else if (lado === 1) { x = S - rnd() * 5; y = t * S }
    else if (lado === 2) { x = t * S; y = S - rnd() * 5 }
    else { x = rnd() * 5; y = t * S }
    g.globalAlpha = (.10 + rnd() * .22) * desgaste
    g.fillStyle = '#EFE7D2'
    g.fillRect(x, y, 1 + rnd() * 7, 1 + rnd() * 3)
  }
  for (const [qx, qy] of [[S, S], [0, 0]]) {
    g.globalAlpha = .20 * desgaste
    g.beginPath(); g.arc(qx, qy, 16 + rnd() * 10, 0, 6.2832); g.fill()
  }
  g.restore()

  /* 5. o brilho oblíquo. O quarto tem um globo à esquerda e a capa é encerada: uma
        faixa larga e fraca cruzando é o que impede o quadrado de ler como papel fosco
        recortado e colado. */
  g.save()
  g.globalCompositeOperation = 'screen'
  const luz = g.createLinearGradient(0, S, S, 0)
  luz.addColorStop(0, 'rgba(255,246,224,0)')
  luz.addColorStop(.46, 'rgba(255,246,224,.05)')
  luz.addColorStop(.62, 'rgba(255,246,224,.085)')
  luz.addColorStop(.80, 'rgba(255,246,224,0)')
  g.fillStyle = luz; g.fillRect(0, 0, S, S)
  g.restore()

  /* 6. a sombra do vinco à esquerda: uma capa tem 3 mm de espessura e a lombada
        aparece. É o que dá volume a um plano de uma face só. */
  g.save()
  g.globalCompositeOperation = 'multiply'
  const vinco = g.createLinearGradient(0, 0, S * .06, 0)
  vinco.addColorStop(0, 'rgba(12,10,11,.55)')
  vinco.addColorStop(1, 'rgba(12,10,11,0)')
  g.fillStyle = vinco; g.fillRect(0, 0, S * .06, S)
  g.restore()
}

/**
 * E — a marca. O elemento que o D procurava, achado olhando em vez de por fórmula.
 *
 * Ele disse do D que *"precisaria só de fato acertar o elemento"*, e acertar não sai de
 * uma conta de deslocamento. Abri as sete capturas e olhei: **toda página tem a marca
 * no alto à esquerda**, e as sete são distintas entre si de um jeito que nenhum recorte
 * aleatório é — o emblema circular do Graecus, o wordmark pesado da CMP, o monograma
 * serifado da Maiara. É o que uma capa de selo faz com o artista: isola a marca dele.
 *
 * O fundo é a cor média da própria captura, escurecida para o quarto, então a capa
 * carrega **a marca e a temperatura** do site. Sem inventar nada e sem cortar palavra.
 */
export function marca(g, S, work, i, img) {
  const rnd = rng(3300 + i * 67)
  let cor = ['#5A2321', '#2E4750', '#7A6A4A', '#8A5A3C', '#3F5B4C', '#6B4463', '#8C3B2E'][i % 7]
  if (img) {
    const c = document.createElement('canvas'); c.width = 32; c.height = 32
    const gg = c.getContext('2d'); gg.drawImage(img, 0, 0, 32, 32)
    const d = gg.getImageData(0, 0, 32, 32).data
    let r = 0, v = 0, b = 0, n = 0
    for (let k = 0; k < d.length; k += 4) {
      const l = (d[k] * .299 + d[k + 1] * .587 + d[k + 2] * .114) / 255
      if (l < .10 || l > .90) continue
      r += d[k]; v += d[k + 1]; b += d[k + 2]; n++
    }
    if (n) cor = `rgb(${Math.round(r / n)},${Math.round(v / n)},${Math.round(b / n)})`
  }

  g.fillStyle = INK; g.fillRect(0, 0, S, S)
  g.fillStyle = cor; g.fillRect(0, 0, S, S)
  g.fillStyle = 'rgba(12,10,11,.50)'; g.fillRect(0, 0, S, S)
  grao(g, S, rnd, .26)

  if (img) {
    /* a região da marca: alto à esquerda, e as proporções vêm de olhar as sete —
       um cabeçalho ocupa uns 12% da altura e a marca uns 26% da largura */
    const sx = img.width * .012, sy = img.height * .004
    const sw = img.width * .27, sh = img.height * .115
    const alvoL = S * .70, alvoA = alvoL * (sh / sw)
    g.save()
    g.globalCompositeOperation = 'screen'
    g.drawImage(img, sx, sy, sw, sh, (S - alvoL) / 2, S * .34 - alvoA / 2, alvoL, alvoA)
    g.restore()
  }

  g.strokeStyle = 'rgba(201,190,150,.55)'; g.lineWidth = 2
  g.beginPath(); g.moveTo(S * .10, S * .60); g.lineTo(S * .90, S * .60); g.stroke()
  g.fillStyle = BONE
  g.font = `400 ${Math.round(S * 0.050)}px "Azeret Mono", ui-monospace, monospace`
  g.textAlign = 'center'
  g.fillText(work.title.toUpperCase(), S * .5, S * .70)
  g.fillStyle = GOLD
  g.font = `400 ${Math.round(S * 0.033)}px "Azeret Mono", ui-monospace, monospace`
  g.fillText(work.kind.toUpperCase(), S * .5, S * .77)
  numero(g, S, work)
}

export const DESENHOS = { tipo, campo, selo, detalhe, marca }
