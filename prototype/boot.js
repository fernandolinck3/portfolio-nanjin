/**
 * The entry point, and the only place that decides whether the Unit is built.
 *
 * It exists because the decision has to be made *before* `scene.js` is imported: that
 * module builds a `WebGLRenderer` at module scope, so by the time anything in it can
 * ask a question, the context is already asked for and the software rasteriser is
 * already grinding. A dynamic import is what buys the ordering.
 *
 * `?flat` forces the text version on a machine that could draw the Unit, which is the
 * only way to look at it without disabling hardware acceleration first. Same shape as
 * `?debug`, `?turned` and `?film`: a flag that reveals a path nobody can otherwise
 * see.
 */
import { probe3D } from './capability.js'
import { createConsent } from './consent.js'

/* Asked on both paths and before either: the cookie question has nothing to do with
   whether this machine can draw the Unit, and a visitor who gets the text version is
   owed the same choice as one who gets the object. */
createConsent()

const forced = location.search.includes('flat')
const verdict = forced ? { ok: false, reason: 'forced' } : probe3D()

if (verdict.ok) {
  await import('./scene.js')
  await guardTheContext()
} else {
  const { flatten } = await import('./flat.js')
  flatten(verdict.reason)
}

/**
 * A cena está de pé, e a GPU ainda pode ir embora.
 *
 * `probe3D` responde uma pergunta de partida. Esta é a de meio de sessão, e a
 * resposta do navegador quando ninguém escuta é um retângulo preto permanente com o
 * portfólio inteiro atrás dele. O piso de texto já existe para o caso de não haver
 * GPU; não haver GPU **mais** é o mesmo destino.
 *
 * O import é dinâmico e só acontece na perda, então quem nunca perde o contexto —
 * quase todo mundo — não baixa o `flat.js` por causa disto. É o mesmo motivo pelo
 * qual ele já era um chunk separado.
 */
async function guardTheContext() {
  const canvas = document.querySelector('#stage canvas')
  if (!canvas) return
  const { onContextLost } = await import('./context-loss.js')
  onContextLost(canvas, async () => {
    console.warn('[tenebrae] WebGL context lost — falling back to the text version')
    const { flatten } = await import('./flat.js')
    flatten('context-lost')
  })
}
