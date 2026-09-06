import * as THREE from 'three'

/**
 * A chama desenhada — uma só, para as trinta e cinco que a peça tem.
 *
 * ## Por que existe como módulo
 *
 * O objeto tinha **duas** chamas escritas em dois arquivos, e as duas estavam erradas
 * pelo mesmo motivo. `room-baroque.js` fazia dois planos cruzados com `emissive`
 * 0xFFC66B chapado; `scene.js` fazia uma esfera com `MeshBasicMaterial` 0xFFD08A
 * chapado. Nenhuma das duas tinha branco na cor, e é o branco que faz uma chama.
 *
 * `scene.js` importa de `room-baroque.js`, então o desenho não podia morar lá — é a
 * mesma situação que fez `superficie.js` existir, e a regra é a mesma: uma decisão
 * escrita duas vezes é uma decisão que vai divergir.
 *
 * ## A regra que ele executa
 *
 * **O núcleo de uma chama é branco e o manto é laranja.** Um sensor que satura satura
 * nos três canais, então o centro de uma vela fotografada sai branco e a franja em
 * volta continua alaranjada. Cor chapada não consegue fazer isso: 0xFFC66B é
 * (1.00, 0.78, 0.42), e por mais que se levante a intensidade os três canais sobem
 * juntos e o tom nunca muda — o vermelho satura, o azul fica na metade do caminho.
 *
 * Medido no quadro que estava no ar: das 6.330 amostras de chama, 592 saturavam no
 * vermelho e **zero** no verde ou no azul. Nenhum pixel do quadro inteiro passava de
 * luminância 240. O lustre lia como dezesseis velas apagadas, porque o retângulo cor
 * de creme era indistinguível da cera cor de creme logo abaixo dele.
 *
 * Então o gradiente vai para a textura, e a cor do material passa a ser branca: o
 * mapa carrega a temperatura e a forma, o material carrega a intensidade, e a
 * intensidade é o que a Vigília caminha.
 *
 * ## E preto na borda, de propósito
 *
 * A silhueta é a própria queda da textura, o que quer dizer que não há mapa de alfa,
 * recorte nem aresta — e é por isso que a mistura é aditiva e não por alfa. É também
 * como as Velas do Altar sempre foram feitas, o que é um bom sinal para uma sala que
 * deveria parecer uma sala.
 *
 * Custo: uma textura de 64×128 construída uma vez, nenhuma geometria nova, nenhum
 * `draw call` novo e nenhuma luz nova. As chamas do quarto até ficaram **mais**
 * baratas — eram dois `Mesh` cada uma e agora são um.
 *
 * ## Duas coisas que este arquivo não faz, de propósito
 *
 * **As duas texturas são memoizadas e compartilhadas pelas trinta e cinco chamas.** Nada
 * hoje as descarta, e é bom que continue assim: um `dispose()` numa delas apagaria as
 * trinta e cinco de uma vez, e o memo devolveria a alça morta para quem pedisse depois.
 *
 * **`?tex=0` não desliga isto, e não deveria.** Aquele registro existe em
 * `superficie.js` para comparar o material *autorado* com o *medido* — ele desliga
 * fotografia. Aqui não há fotografia nenhuma: o gradiente é a autoria, e desligá-lo
 * devolveria a cor chapada que este arquivo existe para corrigir.
 *
 * ## O cálculo sai do `canvas`, para que exista teste
 *
 * `chamaPixels` e `brilhoPixels` devolvem o RGBA cru e não tocam em documento nenhum;
 * `chamaTex` e `brilhoTex` só carimbam esse resultado num `canvas`. Não é gosto por
 * função pequena: **o defeito que este arquivo corrige era invisível para qualquer
 * teste porque não havia costura por onde perguntar dele.** A regra que falhou por
 * tanto tempo — *o núcleo é branco* — é uma afirmação sobre números num buffer, e um
 * buffer é testável em node; um `canvas` em `jsdom` não é sem dependência nova.
 *
 * Ver `chama.test.js`, e a razão de ele existir está no `CLAUDE.md`: uma regra sem
 * teste é um desejo.
 */

/** O manto, na cor que o material chapado tinha. */
const MANTO = [1.0, 0.776, 0.420]

let _chama = null
let _brilho = null

/**
 * A gota: larga e redonda na base, puxada a ponta no alto, branca onde é mais quente.
 *
 * O corte do branco é o número que mais importa aqui, e foi medido. A 0.74 o desenho
 * tinha um centro branco que o render nunca mostrava: uma chama tem uns treze pixels
 * de largura no enquadramento entregue, e um núcleo daquela largura é dissolvido pela
 * minificação antes de chegar à tela — 454 amostras acima de luminância 240. A 0.40 as
 * mesmas chamas põem 789 amostras naquela faixa, com a mesma textura e a mesma
 * intensidade. Abaixo disso o manto começa a empalidecer, e aí a chama deixa de ser
 * laranja, que é a razão de haver um manto.
 */
export const CHAMA_W = 64, CHAMA_H = 128

/** O RGBA da gota, sem tocar em documento. @returns {Uint8ClampedArray} */
export function chamaPixels(w = CHAMA_W, h = CHAMA_H) {
  const px = new Uint8ClampedArray(w * h * 4)
  for (let y = 0; y < h; y++) {
    /* v corre 0 no pavio e 1 na ponta */
    const v = 1 - (y + .5) / h
    /* meia-largura nesta altura: arredondada embaixo, levada a um ponto em cima */
    const r = .46 * Math.pow(Math.sin(Math.PI * Math.pow(Math.max(v, 0), .72)), .9)
    /* o quente de uma vela fica logo acima do pavio, não no meio dela */
    const quente = Math.exp(-Math.pow((v - .30) / .26, 2))
    for (let x = 0; x < w; x++) {
      const u = (x + .5) / w - .5
      const d = r > 1e-4 ? Math.abs(u) / r : 9
      const f = d >= 1 ? 0 : 1 - d * d
      const b = Math.max(0, Math.min(1, f * (.30 + .70 * quente)))
      const k = Math.max(0, Math.min(1, (b - .40) / .34))
      const i = (y * w + x) * 4
      for (let c = 0; c < 3; c++) px[i + c] = Math.round(255 * b * (MANTO[c] + (1 - MANTO[c]) * k))
      px[i + 3] = 255
    }
  }
  return px
}

export function chamaTex() {
  if (_chama) return _chama
  return (_chama = paraTextura(chamaPixels(), CHAMA_W, CHAMA_H))
}

/**
 * O brilho em volta — uma queda radial, e a razão de ela existir separada.
 *
 * O halo do Altar era uma esfera de cor chapada em mistura aditiva, e uma esfera de
 * cor chapada em mistura aditiva desenha um **disco de borda dura**: era o anel
 * laranja que aparecia atrás da vela. Um brilho é justamente a coisa que não tem
 * borda, então ele precisa da queda, e a queda precisa ser gaussiana e não linear —
 * uma rampa linear tem um fim visível, que é o problema de novo com outro nome.
 */
export const BRILHO_N = 64

/** O RGBA do brilho, sem tocar em documento. @returns {Uint8ClampedArray} */
export function brilhoPixels(n = BRILHO_N) {
  const px = new Uint8ClampedArray(n * n * 4)
  /* o meio de um lado: o texel da borda mais próximo do centro, e portanto o mais claro */
  const borda = 1 - 1 / n
  const piso = Math.exp(-borda * borda * 4.2)
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const u = (x + .5) / n - .5, v = (y + .5) / n - .5
      const d = Math.sqrt(u * u + v * v) * 2
      /* Subtrai o valor da borda e renormaliza: sem isso a gaussiana chega ao limite do
         quadrado ainda valendo algo, e um brilho que termina no corte tem borda.
         `piso` é derivado e não constante porque o ponto mais claro da borda é o meio
         de um lado, não o canto — e onde ele fica depende de `n`. Escrito à mão como
         .0148 isto funcionava só em 64 e deixava 1/255 sobrando. */
      const b = Math.max(0, Math.exp(-d * d * 4.2) - piso) / (1 - piso)
      const i = (y * n + x) * 4
      for (let c = 0; c < 3; c++) px[i + c] = Math.round(255 * b * MANTO[c])
      px[i + 3] = 255
    }
  }
  return px
}

export function brilhoTex() {
  if (_brilho) return _brilho
  return (_brilho = paraTextura(brilhoPixels(), BRILHO_N, BRILHO_N))
}

/** O único ponto do arquivo que precisa de um documento. */
function paraTextura(px, w, h) {
  const cv = document.createElement('canvas')
  cv.width = w; cv.height = h
  const ctx = cv.getContext('2d')
  const img = ctx.createImageData(w, h)
  img.data.set(px)
  ctx.putImageData(img, 0, 0)
  const t = new THREE.CanvasTexture(cv)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

/**
 * Dois quadriláteros cruzados numa só geometria, centrados na origem.
 *
 * Cruzados porque um plano só desaparece de perfil. **Numa só geometria** porque a
 * versão anterior eram dois `Mesh` dentro de um `Group`, e o `Group` custava um
 * `draw call` a mais por chama sem entregar nada — trinta e dois deles no quarto.
 *
 * Centrados porque as duas animações que mexem nisto escalam a chama, e escalar em
 * volta do centro é o que a esfera do Altar fazia. Um pivô na base mudaria a posição
 * de repouso de todas as chamas da peça, o que é uma correção de enquadramento
 * disfarçada de correção de material.
 */
export function chamaGeo(w, h) {
  const x = w / 2, y = h / 2
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute([
    -x, -y, 0, x, -y, 0, x, y, 0, -x, y, 0,
    0, -y, -x, 0, -y, x, 0, y, x, 0, y, -x,
  ], 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute([
    0, 0, 1, 0, 1, 1, 0, 1,
    0, 0, 1, 0, 1, 1, 0, 1,
  ], 2))
  g.setIndex([0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7])
  g.computeVertexNormals()
  return g
}
