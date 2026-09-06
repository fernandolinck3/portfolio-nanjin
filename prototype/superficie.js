import * as THREE from 'three'
import { asset } from './asset.js'

/**
 * Relevo e rugosidade fotografados por cima de um material já autorado.
 *
 * ## Por que existe como módulo
 *
 * A parede fez isto primeiro, com dez linhas dentro do `scene.js`. A lareira e a porta
 * querem exatamente a mesma coisa, e `room-baroque.js` não pode importar do `scene.js`
 * — é o `scene.js` que importa dele. Copiar as dez linhas para o outro arquivo criaria
 * duas cópias de uma regra que já é uma decisão escrita, e é assim que duas paredes do
 * mesmo quarto acabam com escalas diferentes.
 *
 * ## A regra que ele executa
 *
 * De `public/textures/CREDITS.md`, e antes disso do `VELVET` em `room-baroque.js`:
 * **uma fotografia é muito boa em *como um material se comporta* e não tem opinião que
 * valha sobre *que cor este objeto tem nesta sala*.** Então o que entra é o relevo e a
 * rugosidade; a cor continua sendo autorada, e o `color` do material continua por cima.
 *
 * `cor` existe para a exceção, e ela é rara: quando o desenho **é** o material — o
 * veio de uma madeira, o entalhe de uma moldura — a foto passa a ser a geometria e não
 * o enfeite. `nogueira-cor.jpg` está no repositório por isso.
 *
 * ## E chega tarde de propósito
 *
 * `ROOM_K` começa em 0: o quarto está desligado para quem chega em `nanj.in`. Estes
 * arquivos são pequenos (dezenas de KB) mas a regra é a mesma da mobília — nada do
 * quarto entra no caminho crítico de quem nunca vê o quarto. Quem falhar fica com o
 * material autorado, que continua sendo um material e não um erro.
 */

/** `?tex=0` desliga tudo isto, e é como se compara o autorado com o medido. */
const desligado = () => typeof location !== 'undefined' && location.search.includes('tex=0')

/**
 * @param {THREE.MeshStandardMaterial} mat o material a enriquecer, no lugar
 * @param {{nor?: string, arm?: string, cor?: string}} arquivos nomes em `public/textures/`
 * @param {{repU?: number, repV?: number, forca?: number, base?: string}} opts
 *   `repU`/`repV` são repetições do ladrilho no espaço UV **daquela geometria** — quem
 *   chama tem que saber se ela emite 0 a 1 ou unidade de mundo. `forca` é a escala do
 *   relevo.
 * @returns {Promise<boolean>} se o material mudou
 */
export function medir(mat, { nor, arm, cor } = {}, { repU = 1, repV = repU, forca = .6, base = '/textures/' } = {}) {
  if (desligado()) return Promise.resolve(false)
  const load = new THREE.TextureLoader()
  const raiz = asset(base)
  const põe = arq => new Promise((ok, erro) => load.load(raiz + arq, t => {
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(repU, repV)
    t.anisotropy = 8
    ok(t)
  }, undefined, erro))

  const pedidos = []
  if (nor) pedidos.push(põe(nor).then(t => { mat.normalMap = t }))
  if (arm) pedidos.push(põe(arm).then(t => { mat.roughnessMap = t }))
  if (cor) pedidos.push(põe(cor).then(t => { t.colorSpace = THREE.SRGBColorSpace; mat.map = t }))
  if (!pedidos.length) return Promise.resolve(false)

  return Promise.all(pedidos).then(() => {
    /* o relevo desenhado sai quando o medido entra: dois relevos sobre a mesma
       superfície é o mesmo grão contado duas vezes */
    if (mat.normalMap) { mat.bumpMap?.dispose?.(); mat.bumpMap = null }
    mat.normalScale?.set(forca, forca)
    mat.needsUpdate = true
    return true
  }).catch(e => {
    console.warn('[superficie] fica o material autorado', e?.message || e)
    return false
  })
}
