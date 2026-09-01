/**
 * The way to write to him, on a surface that can actually be typed into.
 *
 * The Screen is a 320x180 buffer drawn onto an angled Plate. A text field there would
 * be a picture of a text field: no caret, no selection, no autofill, no software
 * keyboard. So the form is DOM, over the canvas, the same decision ADR-0002 made for
 * the case overlay and for the same reason.
 *
 * It POSTs JSON to an endpoint (ADR-0027). There is no package and no SDK; this is a
 * fetch, which is the whole reason the ADR could extend ADR-0004 rather than break it.
 *
 * The one rule that outranks the others here: a form that pretends to send is worse
 * than no form. Every failure path below ends in something visible, and the address
 * stays on screen underneath as the route that works when this one does not.
 */

/**
 * Where it goes. Named once, so swapping the vendor is a URL and a key.
 *
 * The key ships in the markup on purpose — the vendor documents it as public ("You do
 * not need to hide the access key"), it authorises exactly one action, delivering mail
 * to its owner, and there is nowhere to hide a secret on a static site anyway.
 */
const ENDPOINT = 'https://api.web3forms.com/submit'
const ACCESS_KEY = 'a93f545a-cd2d-41e8-8331-f62dc1bb3aad'

/** Long enough that a person reads the confirmation, short enough not to strand them. */
const DONE_MS = 4200

export function createContact({ mount, onOpen, onClose, track }) {
  let opener = null
  let sending = false

  const panel = document.createElement('div')
  panel.className = 'ct-panel'
  panel.dataset.open = '0'
  panel.setAttribute('role', 'dialog')
  panel.setAttribute('aria-modal', 'true')
  panel.setAttribute('aria-labelledby', 'ct-title')
  panel.hidden = true

  const style = document.createElement('style')
  /* No backtick may appear between here and the closing quote, comments included:
     this is a template literal, and one backtick ends it. It has broken the build
     three times, each time pointing at an unrelated line. */
  style.textContent = `
    .ct-panel { position:absolute; inset:0; z-index:6; display:grid; place-items:center;
      opacity:0; pointer-events:none; transition:opacity .22s ease;
      background:rgba(6,5,4,.82); backdrop-filter:blur(14px) saturate(.75);
      font:400 14px/1.7 "Azeret Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
      color:#C9C2B0; }
    .ct-panel[data-open="1"] { opacity:1; pointer-events:auto; }

    .ct-frame { width:min(560px, 92vw); max-height:88vh; overflow:auto; position:relative;
      background:rgba(12,10,9,.94); border:1px solid #332C22; padding:34px 34px 30px; }

    .ct-frame h2 { font:400 30px/1.05 "Grenze Gotisch", "Pirata One", Georgia, serif;
      color:#E8E0CC; margin:0 0 6px; letter-spacing:.01em; }
    .ct-lead { color:#8E8676; font-size:12px; margin:0 0 22px; letter-spacing:.02em; }

    .ct-field { display:block; margin:0 0 16px; }
    .ct-field span { display:block; font-size:10px; letter-spacing:.22em; color:#7C745F;
      text-transform:uppercase; margin:0 0 7px; }
    .ct-field input, .ct-field textarea { width:100%; background:rgba(4,3,3,.7);
      border:1px solid #3C3428; color:#E4DCC6; padding:11px 13px; font:inherit;
      font-size:14px; transition:border-color .16s, background .16s; }
    .ct-field textarea { min-height:132px; resize:vertical; line-height:1.6; }
    .ct-field input:focus, .ct-field textarea:focus { outline:none; border-color:#8A7A54;
      background:rgba(10,8,6,.9); }
    .ct-field input:invalid:not(:placeholder-shown) { border-color:#8C4A38; }

    /* the honeypot: reachable by a bot reading the DOM, never by a person */
    .ct-trap { position:absolute; left:-9999px; width:1px; height:1px; overflow:hidden; }

    .ct-row { display:flex; gap:12px; align-items:center; margin-top:22px; flex-wrap:wrap; }
    .ct-send { background:rgba(20,17,14,.9); border:1px solid #6E5F3E; color:#E8DFC4;
      padding:12px 26px; font:inherit; font-size:11px; letter-spacing:.24em; cursor:pointer;
      text-transform:uppercase; transition:.18s; }
    .ct-send:hover:not(:disabled), .ct-send:focus-visible { background:rgba(34,28,20,.95);
      border-color:#A8905C; color:#F4ECD4; }
    .ct-send:disabled { opacity:.45; cursor:default; }
    .ct-cancel { background:none; border:none; color:#7C745F; font:inherit; font-size:10px;
      letter-spacing:.2em; cursor:pointer; text-transform:uppercase; padding:12px 4px; }
    .ct-cancel:hover, .ct-cancel:focus-visible { color:#C9C2B0; }

    /* the status line is a live region: it is the only thing that says a send worked */
    .ct-status { margin:16px 0 0; font-size:12px; min-height:1.6em; letter-spacing:.02em; }
    .ct-status[data-tone="ok"]   { color:#9DB48E; }
    .ct-status[data-tone="bad"]  { color:#C87A5E; }
    .ct-status[data-tone="work"] { color:#8E8676; }

    /* the route that works when this one does not, never hidden while the form is up */
    .ct-fallback { margin:22px 0 0; padding-top:16px; border-top:1px solid #2A241C;
      font-size:11px; color:#7C745F; line-height:1.7; }
    .ct-fallback a { color:#B39A63; }
    .ct-fallback a:hover { color:#E0CB92; }

    /* LGPD art. 9: what is collected, where it goes, what for — said plainly */
    .ct-notice { margin:12px 0 0; font-size:10px; line-height:1.65; color:#5F594B;
      letter-spacing:.01em; }

    @media (max-width: 620px) {
      .ct-frame { padding:26px 20px 22px; width:94vw; }
      .ct-frame h2 { font-size:25px; }
    }
    @media (prefers-reduced-motion: reduce) { .ct-panel { transition:none; } }
  `

  panel.innerHTML = `
    <form class="ct-frame" novalidate>
      <h2 id="ct-title">Escrever</h2>
      <p class="ct-lead">Uma vaga, um projeto ou uma ideia incomum.</p>

      <label class="ct-field">
        <span>Nome</span>
        <input name="name" type="text" required autocomplete="name" placeholder=" ">
      </label>
      <label class="ct-field">
        <span>E-mail</span>
        <input name="email" type="email" required autocomplete="email" placeholder=" ">
      </label>
      <label class="ct-field">
        <span>Mensagem</span>
        <textarea name="message" required placeholder=" "></textarea>
      </label>

      <div class="ct-trap" aria-hidden="true">
        <label>Não preencha<input type="checkbox" name="botcheck" tabindex="-1" autocomplete="off"></label>
      </div>

      <div class="ct-row">
        <button class="ct-send" type="submit">Enviar</button>
        <button class="ct-cancel" type="button">Voltar</button>
      </div>

      <p class="ct-status" role="status" aria-live="polite" data-tone="work"></p>

      <p class="ct-fallback">Se preferir o seu próprio cliente de e-mail:
        <a href="mailto:fernandolinck@outlook.com">fernandolinck@outlook.com</a></p>

      <p class="ct-notice">Nome, e-mail e mensagem são enviados por um serviço externo
        (Web3Forms, servidores nos EUA) e chegam à caixa de entrada do Fernando. Servem
        só para responder você. Não ficam armazenados no serviço e não vão para mais
        ninguém. Para corrigir ou apagar, escreva para o mesmo endereço.</p>
    </form>`

  panel.prepend(style)
  mount.appendChild(panel)

  const form   = panel.querySelector('form')
  const status = panel.querySelector('.ct-status')
  const send   = panel.querySelector('.ct-send')

  function say(text, tone) {
    status.textContent = text
    status.dataset.tone = tone
  }

  /**
   * Keystrokes stop here.
   *
   * The Unit listens for 1-6, the arrows, Home and End on the document, so a visitor
   * typing "Trabalho" into a field would otherwise walk the Modules while writing.
   * Escape is the one key allowed through, and it is handled rather than forwarded.
   */
  panel.addEventListener('keydown', e => {
    if (e.key === 'Escape') { e.stopPropagation(); if (!sending) close(); return }
    e.stopPropagation()
  })

  panel.querySelector('.ct-cancel').addEventListener('click', () => { if (!sending) close() })
  panel.addEventListener('click', e => { if (e.target === panel && !sending) close() })

  form.addEventListener('submit', async e => {
    e.preventDefault()
    if (sending) return

    const data = Object.fromEntries(new FormData(form))
    /* validate here rather than leaning on the browser: novalidate is set so the
       message lands in the object's own voice instead of a native bubble */
    if (!data.name?.trim() || !data.email?.trim() || !data.message?.trim()) {
      say('Preencha nome, e-mail e mensagem.', 'bad'); return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      say('Esse e-mail não parece completo.', 'bad'); return
    }

    sending = true
    send.disabled = true
    say('Enviando…', 'work')

    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: ACCESS_KEY,
          subject: 'nanj.in — ' + data.name,
          from_name: 'nanj.in',
          ...data,
        }),
      })
      const body = await res.json().catch(() => null)
      if (res.ok && body?.success) {
        say('Enviado. Ele responde nesse e-mail.', 'ok')
        track?.('contact_sent', { route: 'form' })
        form.reset()
        setTimeout(() => { if (panel.dataset.open === '1') close() }, DONE_MS)
      } else {
        /* the API answered and said no: quote nothing, offer the route that works */
        say('Não foi possível enviar. Escreva direto para o endereço abaixo.', 'bad')
        track?.('contact_failed', { route: 'form', status: String(res.status) })
      }
    } catch {
      /* offline, blocked, DNS — indistinguishable from here and identical to the visitor */
      say('Sem conexão com o envio. Escreva direto para o endereço abaixo.', 'bad')
      track?.('contact_failed', { route: 'form', status: 'network' })
    } finally {
      sending = false
      send.disabled = false
    }
  })

  function open() {
    opener = document.activeElement
    panel.hidden = false
    /**
     * A forced reflow, not a rAF.
     *
     * The transition needs the unhidden state to have been laid out before the flag
     * flips, or it has nothing to run from. The obvious way to buy that is a frame —
     * and `rAF` fires zero times in a hidden tab, which would leave the panel
     * unhidden, focused and permanently transparent. Reading `offsetWidth` flushes
     * layout synchronously and cannot be skipped, so the fade works everywhere and
     * the panel can be opened in a test.
     */
    void panel.offsetWidth
    panel.dataset.open = '1'
    say('', 'work')
    onOpen?.()
    form.querySelector('input[name="name"]')?.focus()
  }

  function close() {
    panel.dataset.open = '0'
    onClose?.()
    /* the opener is a canvas control; returning focus is what makes Escape survivable */
    if (opener && document.contains(opener)) opener.focus()
    opener = null
    setTimeout(() => { if (panel.dataset.open === '0') panel.hidden = true }, 240)
  }

  return { open, close, get isOpen() { return panel.dataset.open === '1' } }
}
