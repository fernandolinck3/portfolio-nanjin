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

/* No backtick may appear inside this template literal, comments included. */
const CSS = `
  html[data-flat] body { overflow:auto; background:#0A0A0B; }
  html[data-flat] #frame, html[data-flat] #stage, html[data-flat] .hud { display:none !important; }

  /* the clip from mirror.ts is undone here rather than edited there: that sheet is
     what keeps the pre-rendered mirror from flashing as a wall of text on a normal
     load, and it must go on doing that job */
  html[data-flat] #mirror { position:static; width:auto; height:auto; overflow:visible;
    display:block; max-width:74ch; margin:0 auto; padding:56px 22px 96px;
    font:400 15px/1.72 Archivo, "Helvetica Neue", Arial, sans-serif; color:#B9B2A2; }

  html[data-flat] #mirror h1 { font:400 40px/1.06 "Grenze Gotisch", Georgia, serif;
    color:#EDE5CF; margin:0 0 6px; letter-spacing:.01em; }
  html[data-flat] #mirror h2 { font:400 12px/1.4 "Azeret Mono", ui-monospace, monospace;
    letter-spacing:.26em; text-transform:uppercase; color:#8A7A54; margin:52px 0 14px;
    padding-top:18px; border-top:1px solid #221F1A; }
  html[data-flat] #mirror h3 { font:600 15px/1.4 Archivo, Arial, sans-serif;
    color:#E4DCC6; margin:22px 0 4px; }
  html[data-flat] #mirror p { margin:0 0 9px; }
  html[data-flat] #mirror ul { list-style:none; margin:0; padding:0; }
  html[data-flat] #mirror li { margin:0 0 4px; }
  html[data-flat] #mirror section > ul > li { margin:0 0 26px; }

  /* the item headings are buttons because the canvas needs them to be; with no canvas
     they are headings again, and must stop looking pressable */
  html[data-flat] #mirror h3 button { all:unset; display:block; cursor:default;
    font:inherit; color:inherit; }

  html[data-flat] #mirror a { color:#C6A961; text-underline-offset:3px; }
  html[data-flat] #mirror a:hover, html[data-flat] #mirror a:focus-visible { color:#EFD79B; }

  html[data-flat] .flat-note { margin:34px 0 0; padding:14px 16px; border:1px solid #221F1A;
    font:400 12px/1.6 "Azeret Mono", ui-monospace, monospace; color:#6E685A; }
  html[data-flat] .flat-write { all:unset; display:inline-block; margin:18px 0 0;
    border:1px solid #6E5F3E; color:#E8DFC4; padding:11px 24px; cursor:pointer;
    font:400 11px/1 "Azeret Mono", ui-monospace, monospace; letter-spacing:.24em;
    text-transform:uppercase; }
  html[data-flat] .flat-write:hover, html[data-flat] .flat-write:focus-visible {
    background:rgba(34,28,20,.9); border-color:#A8905C; color:#F4ECD4; }

  /* the focus escape hatch from the clipped mirror is meaningless once unclipped */
  html[data-flat] #mirror :is(button,a):focus { position:static; padding:0; background:none;
    color:inherit; border:0; max-width:none; font:inherit; letter-spacing:inherit; }
  html[data-flat] #mirror :is(button,a):focus-visible { outline:2px solid #8A7A54;
    outline-offset:3px; }
`

/**
 * Turn the clipped mirror into the page.
 *
 * @param {string} reason  what `probe3D()` decided, for the console only.
 */
export function flatten(reason) {
  const mirror = document.getElementById('mirror')
  /* Without the mirror there is nothing to reveal, and pretending otherwise would
     leave a black page wearing a stylesheet. */
  if (!mirror) return false

  const style = document.createElement('style')
  style.textContent = CSS
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
  write.textContent = 'Escrever'
  write.addEventListener('click', () => panel.open())

  const note = document.createElement('p')
  note.className = 'flat-note'
  note.textContent =
    'Esta é a versão em texto. O portfólio é um instrumento em 3D e o seu navegador '
    + 'não tem aceleração gráfica disponível, então ele não foi carregado — o conteúdo '
    + 'abaixo é o mesmo.'
  mirror.prepend(note)
  mirror.appendChild(write)

  console.info('[tenebrae] flat: ' + reason)
  return true
}
