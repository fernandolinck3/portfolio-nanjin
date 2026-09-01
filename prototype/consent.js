/**
 * The one question the visitor is asked before anything is measured.
 *
 * A GA4 tag is published and writes a cookie. LGPD applies the moment someone
 * arrives, and arriving is not a request — which is what separates this from the
 * form, where art. 7, V covers the processing because the visitor asked for contact
 * (ADR-0027). Nobody asks to be counted.
 *
 * So this is a gate, not a notice. `index.html` fetches nothing until `loadGTM()` is
 * called, and it is only called here, and only on yes. There is no Consent Mode, no
 * tag firing into denied storage, no third state to reason about: the script either
 * ran or it did not.
 *
 * **Refusing is exactly as easy as accepting.** Two buttons, same size, same weight,
 * same distance from the hand. A banner where "no" is a link in eight point grey is
 * a dark pattern wearing a compliance badge, and this object does not lie to people
 * anywhere else — see the LinkedIn row that stayed inert rather than guess a URL.
 *
 * It remembers in `localStorage`, not `sessionStorage`: asking again tomorrow is
 * nagging, and the answer did not expire overnight.
 *
 * **The wording is deliberately conventional, and it is the only place here that is.**
 * Everywhere else this object writes in its own voice; a cookie bar is one of the few
 * surfaces where a visitor is scanning for a familiar shape rather than reading, and
 * an authored sentence costs them a beat to parse for no gain. Recognisable beats
 * distinctive on this one bar.
 *
 * It names Google Analytics and the purpose — art. 9 wants the finality stated — and
 * it links no privacy policy, because there is no privacy policy. A link to a page
 * that does not exist would be the only false statement on the site.
 */

const KEY = 'tenebrae.consent'

/** @returns {'granted'|'denied'|null} */
function stored() {
  try { return localStorage.getItem(KEY) } catch { return null }
}

function remember(value) {
  try { localStorage.setItem(KEY, value) } catch { /* private mode: this visit only */ }
}

/* No backtick may appear inside this template literal, comments included. */
const CSS = `
  .cs-bar { position:fixed; left:0; right:0; bottom:0; z-index:80;
    display:flex; gap:18px; align-items:center; justify-content:center; flex-wrap:wrap;
    padding:14px 20px calc(14px + env(safe-area-inset-bottom));
    background:rgba(8,7,6,.94); border-top:1px solid #2A241C;
    backdrop-filter:blur(10px) saturate(.8);
    font:400 12px/1.6 "Azeret Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
    color:#8E8676; transform:translateY(100%); transition:transform .3s ease; }
  .cs-bar[data-up="1"] { transform:translateY(0); }

  .cs-bar p { margin:0; max-width:62ch; }
  .cs-bar b { color:#C9C2B0; font-weight:400; }

  .cs-acts { display:flex; gap:10px; flex-shrink:0; }
  /* both buttons are the same button: refusing must cost what accepting costs */
  .cs-acts button { background:rgba(20,17,14,.9); border:1px solid #5A4E34; color:#D8CFB4;
    padding:9px 20px; font:inherit; font-size:10px; letter-spacing:.22em; cursor:pointer;
    text-transform:uppercase; transition:.16s; }
  .cs-acts button:hover, .cs-acts button:focus-visible {
    background:rgba(34,28,20,.95); border-color:#A8905C; color:#F4ECD4; }
  .cs-acts button:focus-visible { outline:2px solid #8A7A54; outline-offset:2px; }

  @media (max-width: 620px) {
    .cs-bar { flex-direction:column; align-items:flex-start; gap:12px; font-size:11px; }
    .cs-acts { width:100%; }
    .cs-acts button { flex:1; padding:12px 0; }
  }
  @media (prefers-reduced-motion: reduce) { .cs-bar { transition:none; } }
`

/**
 * Ask, unless the answer is already known.
 *
 * @param {(granted: boolean) => void} [onDecide] told once, for whoever is listening.
 * @returns {boolean} whether a bar was actually put on screen.
 */
export function createConsent(onDecide) {
  const already = stored()
  if (already) {
    /* The loader in index.html already acted on a stored yes; this only closes the
       loop for anyone who asked to be told. */
    onDecide?.(already === 'granted')
    return false
  }

  const style = document.createElement('style')
  style.textContent = CSS
  document.head.appendChild(style)

  const bar = document.createElement('aside')
  bar.className = 'cs-bar'
  bar.dataset.up = '0'
  bar.setAttribute('aria-label', 'Medição e cookies')
  bar.innerHTML = `
    <p><b>Cookies.</b> Utilizamos cookies do Google Analytics para medir o tráfego
      deste site. Você pode aceitar ou recusar — recusar não afeta a navegação.</p>
    <div class="cs-acts">
      <button type="button" data-yes>Aceitar</button>
      <button type="button" data-no>Recusar</button>
    </div>`
  document.body.appendChild(bar)

  /* A forced reflow rather than a frame: rAF fires zero times in a hidden tab, and a
     bar that never slides up is a bar nobody can answer. Same reason as contact.js. */
  void bar.offsetWidth
  bar.dataset.up = '1'

  function decide(granted) {
    remember(granted ? 'granted' : 'denied')
    if (granted) window.loadGTM?.()
    bar.dataset.up = '0'
    setTimeout(() => bar.remove(), 320)
    onDecide?.(granted)
  }

  bar.querySelector('[data-yes]').addEventListener('click', () => decide(true))
  bar.querySelector('[data-no]').addEventListener('click', () => decide(false))
  /* Keystrokes stop here, or answering the bar would drive the Unit behind it. */
  bar.addEventListener('keydown', e => e.stopPropagation())

  return true
}
