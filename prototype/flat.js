/**
 * The Unit, when there is no machine to draw it on.
 *
 * `SPEC.md` §6 promises a Flat Plate for "no WebGL · low power" and calls it a
 * designed deliverable rather than a degraded screenshot. That is T-05 and it is not
 * built. This is not it, and does not pretend to be: it is the floor beneath it, so
 * that the answer to "no GPU" stops being a hung tab.
 *
 * It costs almost nothing because T-18 and T-26 already did the work. Every word of
 * every Module is in the document before any script runs — the mirror is clipped to
 * one pixel, not absent. So this file does not render anything. It takes the clip
 * off, gives the text a reading column, and turns the two routes that can act in a
 * page with no canvas into things that act: the address becomes a link, and the form
 * opens, because the form was always DOM and never needed the Unit at all.
 *
 * What is deliberately missing: the object. No approximation of the Plate, no
 * screenshot standing in for it, no apology. A portfolio that cannot show its own
 * instrument should show its work in plain type and say so in one line, not mock up
 * the thing it failed to load.
 */
import { MODULES } from '../src/content/modules.ts'
import { createContact } from './contact.js'
import { UI } from '../src/content/strings.ts'
import { FLAT_CSS } from './flat-skin.js'
import { REACTION_FRAMES, REACTION_W, REACTION_H } from './screen/reaction-frames.js'
import { createKnobReaction } from './screen/reaction.js'
import { drawSprite } from './screen/drawn.js'
import { lyraAt, LYRA_NAME, LYRA_IDLE_MS } from '../src/content/modules.ts'

/* No backtick may appear inside this template literal, comments included. */

/**
 * Turn the clipped mirror into the page.
 *
 * @param {string} reason  what `probe3D()` decided, for the console only.
 */
/**
 * LYRA, uma vez, no alto.
 *
 * **Uma e não seis.** No objeto ela reage ao Módulo que está vivo; aqui não há
 * Módulo vivo — a página inteira está aberta de uma vez — então seis delas seriam
 * seis cópias de uma coisa que só faz sentido com um cursor.
 *
 * Ela fala a linha do Módulo de identidade e troca para a de ocioso aos seis
 * segundos, como faz na Tela. As falas vêm de `modules.ts`, não daqui.
 *
 * **As falas dela não estão no espelho, e isso é decisão.** A regra do `CLAUDE.md`
 * — tudo que a Tela mostra existe no DOM — mira o conteúdo do portfólio. As falas
 * da LYRA são interface em personagem: no HTML que um ATS lê elas seriam ruído, e
 * quem usa leitor de tela já recebe a fala corrente pela região viva do espelho.
 * Por isso elas entram aqui, no desenho, e não lá.
 */
function lyraStrip() {
  const strip = document.createElement('div')
  strip.className = 'flat-lyra'

  const art = document.createElement('canvas')
  art.width = REACTION_W * 3
  art.height = REACTION_H * 3
  art.setAttribute('aria-hidden', 'true')

  const say = document.createElement('div')
  say.className = 'say'
  const who = document.createElement('p')
  who.className = 'who'
  who.textContent = LYRA_NAME
  const bubble = document.createElement('div')
  bubble.className = 'bubble'
  const line = document.createElement('p')

  const lyra = lyraAt(0)
  line.textContent = lyra.open.join(' ')
  setTimeout(() => { line.textContent = lyra.idle.join(' ') }, LYRA_IDLE_MS)

  bubble.appendChild(line)
  say.append(who, bubble)
  strip.append(art, say)

  /* Ela respira. `frameAt` é função pura do tempo decorrido, então um laço a
     dirige de graça — a mesma forma que a Tela usa. Sob movimento reduzido ela
     fica no quadro de repouso e o laço nem começa. */
  const g = art.getContext('2d')
  const react = createKnobReaction({ idle: true })
  const paint = () => {
    const c = getComputedStyle(document.documentElement)
    const tok = k => c.getPropertyValue(k).trim()
    g.clearRect(0, 0, art.width, art.height)
    drawSprite(g, REACTION_FRAMES[react.frameAt()], 0, 0, 3,
      tok('--ink'), tok('--mid'), tok('--dim'), tok('--bg'))
  }
  if (react.reducedMotion) paint()
  else react.subscribe(paint)

  return strip
}

export function flatten(reason) {
  const mirror = document.getElementById('mirror')
  /* Without the mirror there is nothing to reveal, and pretending otherwise would
     leave a black page wearing a stylesheet. */
  if (!mirror) return false

  const style = document.createElement('style')
  style.textContent = FLAT_CSS
  document.head.appendChild(style)
  document.documentElement.dataset.flat = '1'

  /* The Unit's own controls describe an object that is not here. */
  for (const sel of ['[data-mirror-nav]', '[data-mirror-live]', '[data-mirror-eclipse]']) {
    for (const el of mirror.querySelectorAll(sel)) el.remove()
  }

  /**
   * The two routes that can still act.
   *
   * The mirror writes every item's label as text, because on the canvas the Sun is
   * what opens it. With no canvas the Sun cannot be turned, so the label has to carry
   * its own destination or CONTATO becomes a list of things you cannot do.
   */
  const contact = MODULES.find(m => m.id === 'contact')
  for (const item of contact?.items || []) {
    if (!item.act || item.act.kind === 'form') continue
    const href = item.act.kind === 'mail' ? 'mailto:' + item.act.value : item.act.value
    for (const b of mirror.querySelectorAll('h3 button')) {
      if (b.textContent.trim() !== item.label) continue
      const a = document.createElement('a')
      a.href = href
      a.textContent = item.label
      if (item.act.kind === 'url') { a.target = '_blank'; a.rel = 'noopener' }
      b.replaceWith(a)
    }
  }

  /* The form never needed the Unit — it is DOM over a canvas that happens not to
     exist here. Mounting it is what keeps this a portfolio rather than a notice. */
  const panel = createContact({ mount: document.body })
  const write = document.createElement('button')
  write.type = 'button'
  write.className = 'flat-write'
  write.textContent = UI.contactTitle
  write.addEventListener('click', () => panel.open())

  const note = document.createElement('p')
  note.className = 'flat-note'
  note.textContent = UI.flatNote
  mirror.prepend(note)
  mirror.prepend(lyraStrip())
  mirror.appendChild(write)

  console.info('[tenebrae] flat: ' + reason)
  return true
}
