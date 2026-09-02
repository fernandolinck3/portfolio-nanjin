import * as THREE from 'three'
import { caseOf } from '../src/content/modules.ts'
import { track, trackSettled } from './track.js'
import { UI } from '../src/content/strings.ts'

/**
 * Zoom to the Screen, then hand the Work to the DOM.
 *
 * **This reverses ADR-0017**, which sent a Work out to a plinth on the reasoning
 * that "a Work is an image and the Screen is a 590px inset — it cannot carry one".
 * That reasoning is still correct about the *buffer*: 320x180 upscaled to fill a
 * viewport is roughly 4.7x, which is beautiful for the Grimoire's pixel art and
 * mush for a photograph of a poster. And photographs of posters are what the Works
 * actually are.
 *
 * So the camera performs the move and the DOM holds the content. The fly-in lands
 * with the Screen filling the frame, and at that moment a real HTML panel — real
 * image, real text, real link — cross-fades over it.
 *
 * That is not a compromise, it is ADR-0002: **the DOM is truth**. It also means the
 * Works are indexable, readable by a screen reader, available at full resolution,
 * and reachable on a phone that never runs the WebGL scene at all.
 *
 * A prototype. The camera path and the hand-off are real; the panel's styling is
 * deliberately plain, because the question being answered is whether the *move*
 * feels right.
 */

const EASE = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

/**
 * Resolve a Work's still against the deployed base path.
 *
 * `modules.ts` stores these as `/works/foo.jpg`, which is the right shape for the
 * *data* — a bare, root-relative path that says nothing about where the site is
 * hosted. But the build emits its scripts relatively (`base: './'`), so the site
 * runs from a subdirectory as well as a domain root, and a root-absolute image URL
 * would resolve past that subdirectory to the server root and 404.
 *
 * That failure only ever appears in a deployed build — never in `npm run dev`,
 * where the site *is* at the root — which makes it precisely the kind of bug worth
 * spending four lines to never have.
 */
const asset = p => (import.meta.env?.BASE_URL || '/') + String(p).replace(/^\//, '')

/**
 * Rejoin lines that were broken for a 320-pixel Screen.
 *
 * `modules.ts` stores prose as short lines, because that is what the Screen needs.
 * This panel is real HTML at real size, and rendering one `<p>` per stored line put
 * a paragraph break after every eight words — the case came out as a column of
 * fragments rather than as writing.
 *
 * A blank entry is a deliberate paragraph break and is the only thing that starts a
 * new one. Everything else flows, and the browser decides where the lines fall,
 * which is the same principle the Screen's own `lead` now follows.
 */
const paragraph = (lines = []) => {
  const paras = []
  let run = []
  for (const l of lines) {
    if (String(l).trim() === '') { if (run.length) paras.push(run.join(' ')); run = [] }
    else run.push(String(l).trim())
  }
  if (run.length) paras.push(run.join(' '))
  return paras.map(t => `<p>${t}</p>`).join('')
}

/**
 * Where the camera has to stand for the Screen to fill the frame.
 *
 * The Screen is set into a horizontal Plate, so it faces straight up and the
 * camera has to come directly over it — which the tilt/dist/yaw rig cannot
 * express, since its minimum tilt is 4 degrees and it always looks at the origin
 * rather than at the Screen's own centre. Hence a separate path that drives
 * `camera.position` and `camera.quaternion` outright.
 */
function screenFillPose(camera, { centre, width, depth }) {
  const vFov = THREE.MathUtils.degToRad(camera.fov)
  /* fit the tighter of the two axes, with a margin so it does not touch the edges */
  const forHeight = (depth / 2) / Math.tan(vFov / 2)
  const forWidth = (width / 2) / (Math.tan(vFov / 2) * camera.aspect)
  const dist = Math.max(forHeight, forWidth) * 1.08

  const pos = new THREE.Vector3(centre.x, centre.y + dist, centre.z)
  /* The Screen's texture runs with its top edge toward -z (the plane is laid down
     by a -90 degree turn about x), so the camera's up has to point that way or the
     Work arrives upside down. */
  const m = new THREE.Matrix4().lookAt(pos, centre, new THREE.Vector3(0, 0, -1))
  return { pos, quat: new THREE.Quaternion().setFromRotationMatrix(m) }
}

/**
 * @param camera        the scene camera
 * @param mount         element to put the panel in (the stage)
 * @param screen        { centre: Vector3, width, depth } of the Screen in world space
 * @param onProgress    0 idle -> 1 fully focused; the room dims on this
 * @param restore       called on exit, to hand the camera back to the rig
 */
export function createFocus({ camera, mount, screen, onProgress, restore, onStep }) {
  /* ---------- the panel ---------- */
  const panel = document.createElement('div')
  panel.className = 'work-panel'
  panel.setAttribute('role', 'dialog')
  panel.setAttribute('aria-modal', 'true')
  panel.hidden = true
  /**
   * Three ways back, because one was not enough.
   *
   * It shipped with Esc and a small chip in the corner. Esc is invisible until you
   * already know it, and does not exist at all on a phone — so on touch there was
   * no way out of the Work but the browser's own back button.
   *
   * `summon.js` had the right instinct for this object: "while a Work is up, the
   * Screen is the way back — anywhere on it". The Screen is now the thing filling
   * the frame, so **clicking anywhere off the Work returns** — which is also the
   * behaviour every dialog on the web already has, so nobody has to learn it.
   */
  panel.innerHTML = `
    <div class="work-frame">
      <button class="work-back" type="button">&larr;&nbsp; ${UI.touchBack}</button>
      <figure class="work-plate" role="button" tabindex="-1">
        <img class="work-shot" alt="" hidden>
        <ol class="work-strip" aria-label="${UI.workImages}"></ol>
        <figcaption class="work-count"></figcaption>
      </figure>
      <header class="work-head">
        <p class="work-no"></p>
        <h2 class="work-title" id="work-title"></h2>
        <p class="work-meta"></p>
        <div class="work-blurb"></div>
      </header>
      <div class="work-text" tabindex="0">
        <div class="work-case"></div>
        <p class="work-more"></p>
      </div>
      <nav class="work-rail" aria-label="${UI.workSections}" hidden>
        <ol class="work-marks"></ol>
        <span class="work-pos"></span>
      </nav>
    </div>
    <button class="work-step" data-d="-1" type="button" aria-label="${UI.workPrevImage}">&lsaquo;</button>
    <button class="work-step" data-d="1" type="button" aria-label="${UI.workNextImage}">&rsaquo;</button>
    <p class="work-hint">${UI.workHint}</p>`
  panel.setAttribute('aria-labelledby', 'work-title')
  mount.appendChild(panel)

  const style = document.createElement('style')
  /**
   * The panel is dressed in the object's own faces.
   *
   * It used to be `ui-monospace` and Georgia — system defaults that said nothing and
   * belonged to nothing: *"as fontes dessa tela do projeto aberto estão destoando do
   * design da página."* They were right for a prototype answering "does the *move*
   * feel right", and wrong the moment the move stopped being the question.
   *
   * The three roles map onto the three the Screen already has, so opening a project
   * reads as the same instrument at a larger size rather than as a web page arriving
   * over it:
   *
   *   Grenze Gotisch   the blackletter the Screen sets Module titles in
   *   Silkscreen       the Screen's own label face — eyebrows, headings, counters
   *   Azeret Mono      the running text, the face the rest of the page already uses
   *
   * All three are already in the document's font link, so this costs no new request.
   * Every one carries a real fallback stack: an unloaded face is a silent fallback,
   * not an error, and Silkscreen falling back to a proportional sans would take the
   * letter-spacing with it.
   *
   * The ground is **blurred**, not merely darkened. The Unit behind is high-contrast
   * engraving and lit brass, and prose over a gradient of it was fighting the detail
   * for the reader's eye — *"a tela no fundo deve ficar blurred ou algo pra dar
   * leitura."* The blur keeps the object present as colour and light while taking its
   * edges away, which is exactly what a backdrop should be. Where `backdrop-filter`
   * is unsupported the gradient alone still darkens it, so the text stays legible.
   *
   * ---
   *
   * **The architecture is a grid of named areas, and only one of them scrolls.**
   *
   * It used to be one flex row — image beside a single column that carried the number,
   * the title, the summary *and* the case — and that column was the `overflow:auto`
   * element. So the title scrolled away: two flicks into the Graecus case and nothing
   * on screen said which project you were reading. His brief asks for a *fixed*
   * textual header, and a header that scrolls is not one.
   *
   * So the frame is:
   *
   *     back   back   back      the way out, above everything
   *     media  head   rail      60% image · 40% title+summary · the indicator
   *     media  text   rail      the case, and the only scrollport in the panel
   *
   * `head` and `text` share a column, so the rule under the header runs the width of
   * the reading column and the case hangs off it — the same relationship the Screen's
   * own pages have with their header rule. The media column is 3fr against the text
   * column's 2fr, which is his 60/40 measured on the part of the frame that carries
   * content, the indicator rail being 22px of furniture rather than a share of it.
   *
   * `minmax(0, 1fr)` on the last row is what makes the header fixed. A `1fr` row
   * whose child has `overflow:auto` still takes its size from that child's content,
   * because the automatic minimum size of a grid item is its content — the row grows,
   * the frame overflows, and nothing ever scrolls. The `0` minimum is the whole fix.
   *
   * **The scrollbar is drawn, not inherited.** A white system scrollbar down the side
   * of this panel is the one piece of the operating system the object never invited
   * in, so the native one is removed and a rail takes its place: one mark per section
   * of the case, the current one brass and long, a Silkscreen counter under them.
   * That is the Screen's page-mark vocabulary, and it carries more than a thumb does —
   * it says how many sections there are, which one is being read, and (because the
   * marks are buttons) offers to go to any of them. It hides itself when the case
   * fits, because an indicator for a thing that cannot happen is furniture.
   *
   * **Mobile is the same areas in one column**, and the order is his: the way out
   * first and sticky, then the image, then the title and summary, then the case. The
   * frame itself becomes the scrollport there, the rail goes away with the second
   * column, and the prev/next arrows leave the edges of the image for a pair of 46px
   * targets above the home indicator.
   */
  style.textContent = `
    /* fixed, not absolute: the stage is not a positioned ancestor, so inset:0 was
       resolving somewhere unhelpful and the panel came out a few hundred pixels
       wide in the middle of the frame */
    .work-panel { position:fixed; inset:0; z-index:20; display:grid; place-items:center;
      opacity:0; pointer-events:none; transition:opacity .28s ease;
      background:linear-gradient(180deg, rgba(6,5,5,.62), rgba(6,5,5,.88));
      -webkit-backdrop-filter:blur(14px) saturate(.75);
      backdrop-filter:blur(14px) saturate(.75);
      font:400 14px/1.7 "Azeret Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
      color:#C9C2B0; }
    .work-panel[data-open="1"] { opacity:1; pointer-events:auto; }

    .work-frame { position:relative; z-index:1;
      /* 1420, not 1180: the reading column's own ceiling sets this. Body copy is
         capped at 62ch, so past the frame width where the text column reaches that,
         extra width lands as dead space beside the prose instead of on the picture.
         62ch of Azeret Mono measures 564px here, and 0.4 x (W - 110) = 564 back-solves
         to this W — the exact width at which the prose reaches its own limit and every
         further pixel would land as dead space beside it rather than on the picture.
         Measured at 1420 first: the column came out 524, forty short. */
      width:min(1520px, 92vw); height:min(824px, 84vh);
      display:grid; gap:20px 44px;
      /* minmax(0, …), not a bare fr: a track's automatic minimum is its content's
         min-content size, and the stretched plate carries an aspect ratio, so it
         asked for height x 1.6 of width and took it out of the reading column —
         which came out 127px wide with the title on four lines. Same failure as the
         row below, one axis over. */
      /* the rail's track is reserved, not measured: it hides itself on a case that
         fits, and an auto track that collapses moved the 60/40 split by nine pixels
         between one project and the next — the image visibly jumped on the way in */
      grid-template-columns:minmax(0, 3fr) minmax(0, 2fr) 22px;
      grid-template-rows:auto auto minmax(0, 1fr);
      grid-template-areas:
        "back  back  back"
        "media head  rail"
        "media text  rail"; }

    /**
     * A case with no stills is a reading page, not a picture page with a hole in it.
     *
     * Portfólio has no images, so the 60/40 grid drew a black 55% column and the
     * footer went on telling the visitor to click images to enlarge them. Stretching
     * the prose across the whole frame only moves the emptiness — body copy caps
     * itself at 62ch, so the extra width lands as dead space beside it, which is the
     * same mistake the image frame made before it was capped by the column.
     *
     * So the frame narrows to the reading measure instead, and the media area leaves
     * the grid. The rail's track stays: it is reserved rather than measured, for the
     * same reason it always was.
     */
    .work-panel[data-media="0"] .work-plate,
    .work-panel[data-media="0"] .work-hint { display:none; }

    @media (min-width: 861px) {
      .work-panel[data-media="0"] .work-frame {
        width:min(900px, 92vw);
        grid-template-columns:minmax(0, 1fr) 22px;
        grid-template-areas:
          "back  back"
          "head  rail"
          "text  rail"; }
    }

    .work-back { grid-area:back; justify-self:start; align-self:start;
      background:rgba(10,9,8,.6); cursor:pointer; border:1px solid #4A4136; color:#C9C2B0;
      padding:11px 18px; font-size:10px; letter-spacing:.24em; transition:.18s; }
    .work-back:hover, .work-back:focus-visible { color:#F0E8D2; border-color:#8A7A54;
      background:rgba(20,17,14,.85); }

    /* contain, not cover: these are posters and captures with type running to the
       edge, and cropping them to fill a 16:10 box would cut the work up */
    /**
       The frame is the work's own shape.

       It was a fixed 16:10 box with the image contained inside it, which is two bad
       fits at once: a widescreen capture left a couple of hundred pixels of nothing
       under it, and a portrait poster came out small and floating in the middle of a
       landscape frame with black to either side. Stretching the box to the column
       only moved that emptiness inside the border.

       So the border, the ground and the shadow move onto a real an image element, which takes
       the proportions of whatever it is showing and is capped by the column rather
       than shaped by it. A poster stands tall, a capture lies wide, and each is
       framed exactly. Being an element rather than a a background also gives it an
       an alt — until now the actual work was invisible to a screen reader, which is
       the wrong thing for the DOM-is-truth side of this panel to be missing.
     */
    /* a flex column, not two grid rows: with rows the caption was pinned to the floor
       of the media column and sat three hundred pixels below the picture it counts */
    .work-plate { grid-area:media; align-self:stretch; margin:0; min-height:0;
      display:flex; flex-direction:column; align-items:center; gap:12px; }
    .work-plate[data-many="1"] { cursor:pointer; }
    .work-plate[data-many="1"] .work-shot { max-height:calc(100% - 80px); }
    /* the picture's ceiling is the column less what stands under it: 30px of caption
       and gap on its own, 80px once the strip is there too. max-height:100% would let
       the picture take the whole column and push both out of the frame */
    .work-shot { flex:0 1 auto; min-height:0;
      max-width:100%; max-height:calc(100% - 30px); object-fit:contain;
      border:1px solid #3A322A; background:#14110F;
      box-shadow:0 24px 70px rgba(0,0,0,.6); }
    .work-count:empty { display:none; }
    .work-count { color:#8A7A54; font-size:10px; letter-spacing:.18em;
      font-variant-numeric:tabular-nums; flex:0 0 auto; }

    /**
       The set is shown, not stepped through blind.

       Clicking the picture advanced to the next one and wrapped, which is the whole
       of what a visitor could do with eight Graecus captures: click in the dark, one
       at a time, with no way back and no idea what was coming. A counter reading
       "3 / 8" tells you that you are lost, it does not help.

       So the images get what the case got — a map. Every still is on the strip, the
       current one lit, and any of them is one click away. Same principle as the rail,
       one axis over. The picture still advances on click, but that is now a shortcut
       through something visible rather than the only way through something that is not.
     */
    .work-strip:empty { display:none; }
    .work-strip { display:flex; gap:7px; margin:0; padding:2px; list-style:none;
      max-width:100%; overflow-x:auto; scrollbar-width:none;
      /* the picture is the flexible one in this column; the strip is furniture and
         gets squashed to a 19px band of clipped thumbnails if it is allowed to give */
      flex:0 0 auto; }
    .work-strip li { flex:0 0 auto; }
    .work-strip::-webkit-scrollbar { height:0; }
    .work-strip button { display:block; width:56px; height:38px; padding:0; cursor:pointer;
      border:1px solid #3A322A; background:#14110F center/contain no-repeat;
      opacity:.55; transition:opacity .18s ease, border-color .18s ease; }
    .work-strip button:hover, .work-strip button:focus-visible { opacity:1; border-color:#6A5F4C; }
    .work-strip button[aria-current="true"] { opacity:1; border-color:#C9A961; }

    .work-head { grid-area:head; align-self:start;
      border-bottom:1px solid #3A322A; padding-bottom:20px; }
    /* position:relative so a heading's offsetTop is measured against this box — the
       rail's marks are placed from those offsets against this element's scrollHeight,
       and an unpositioned scrollport hands them the panel's coordinates instead */
    .work-text { grid-area:text; position:relative; overflow:auto; min-height:0;
      padding-right:6px; scrollbar-width:none; -ms-overflow-style:none; }
    .work-text::-webkit-scrollbar { width:0; height:0; }
    .work-text:focus-visible { outline:1px solid #4A4136; outline-offset:6px; }

    .work-no, .work-meta, .work-client, .work-count, .work-hint, .work-back,
    .work-pos, .work-case h3 {
      font-family:Silkscreen, "Azeret Mono", ui-monospace, monospace; }

    .work-no { color:#8A7A54; font-size:10px; letter-spacing:.28em; margin:0 0 14px; }
    .work-title { font:400 40px/1.05 "Grenze Gotisch", "Pirata One", Georgia, serif;
      margin:0 0 10px; color:#E4DCC6; letter-spacing:.01em; text-wrap:balance; }
    .work-meta { color:#7E7565; font-size:10px; letter-spacing:.2em; margin:0 0 20px; }
    .work-client { color:#8A7A54; font-size:10px; letter-spacing:.2em; margin:0 0 14px; }
    .work-blurb p { margin:0 0 8px; color:#ADA491; max-width:62ch; }
    .work-blurb p:last-child { margin-bottom:0; }

    .work-case h3 { margin:0 0 8px; font-size:10px; letter-spacing:.22em;
      color:#C9BE96; font-weight:400; }
    .work-case h3 + p { margin-top:0; }
    .work-case > h3 ~ h3 { margin-top:26px; }
    .work-case p { margin:0 0 5px; color:#A9A292; max-width:62ch; }
    .work-more:empty { display:none; }
    .work-more { margin:26px 0 0; padding-top:14px; border-top:1px solid #2A2620;
      color:#8A8470; font-size:13px; letter-spacing:.04em; }

    /* the indicator: the Screen's page marks, stood on end */
    .work-rail { grid-area:rail; align-self:stretch; position:relative; width:22px; }
    .work-rail[hidden] { display:none; }
    /**
       "hidden" has to actually hide, and the display:grid above outranks it.

       The attribute's only power is the UA's [hidden]{display:none}, which any
       display in an author sheet beats — so a closed panel stayed display:grid,
       invisible by opacity:0 alone, and its back button and plate stayed **in the
       tab order**. A keyboard user met two controls belonging to an overlay that was
       not open, ahead of the Pads, before anything else on the object. Same rule the
       rail above already needed, for the same reason.

       The measuring in fill() is unaffected: enter() clears the attribute before it
       measures, which is what that comment is about.

       No backticks anywhere in here: this sheet is a JS template literal, and one
       would end it. That mistake is a blank page, not a warning.
     */
    .work-panel[hidden] { display:none; }
    .work-rail::before { content:""; position:absolute; left:50%; top:2px; bottom:24px;
      width:1px; background:#3A322A; }
    .work-marks { position:absolute; left:0; right:0; top:2px; bottom:24px;
      margin:0; padding:0; list-style:none; }
    .work-marks button { position:absolute; left:0; width:22px; height:16px;
      transform:translateY(-8px); background:none; border:0; padding:0; cursor:pointer;
      display:grid; place-items:center; }
    .work-marks button::before { content:""; width:9px; height:1px; background:#6A5F4C;
      transition:width .18s ease, background .18s ease; }
    .work-marks button[data-on="1"]::before { width:19px; height:2px; background:#C9A961; }
    .work-marks button:hover::before,
    .work-marks button:focus-visible::before { background:#C9BE96; width:19px; }
    .work-pos { position:absolute; bottom:0; left:50%; transform:translateX(-50%);
      font-size:9px; letter-spacing:.12em; color:#8A7A54; font-variant-numeric:tabular-nums; }

    .work-step { display:none; position:absolute; top:50%; transform:translateY(-50%); z-index:2;
      background:none; border:0; cursor:pointer; color:#5C5346; font-size:44px; line-height:1;
      padding:20px 26px; transition:.18s; }
    .work-panel[data-shots="1"] .work-step { display:block; }
    .work-step:hover, .work-step:focus-visible { color:#C9C2B0; }
    .work-step[data-d="-1"] { left:8px; }
    .work-step[data-d="1"] { right:8px; }
    .work-hint { position:absolute; bottom:24px; left:0; right:0; text-align:center;
      color:#5C5346; font-size:10px; letter-spacing:.2em; margin:0; pointer-events:none; }

    /**
       Full frame, because 67% of native is still not a website capture.

       The Graecus stills are 1265 x 712 and the widened panel shows them at 846 —
       better than the 642 he called small, and still two thirds of a screenshot whose
       whole content is small type. No split of a two-column layout fixes that; the
       picture has to be allowed to take the window.

       So the panel has a second state. The case, the header and the rail go away with
       display:none — not visibility or opacity, because the focus trap tests
       offsetParent and would keep handing Tab to a column nobody can see — and the
       media area takes the frame. The strip stays, so the set is still navigable from
       inside the enlargement.

       The picture is capped at its own natural width. A 1265px capture blown to 1900
       is softer than the same capture at 1265, and the 375px mobile still is honest at
       375 rather than impressive at 900. --nw carries that number from the image.
     */
    .work-panel[data-zoom="1"] .work-frame {
      width:min(2400px, 96vw); height:92vh;
      grid-template-columns:minmax(0, 1fr);
      grid-template-rows:auto minmax(0, 1fr);
      grid-template-areas: "back" "media"; }
    .work-panel[data-zoom="1"] .work-head,
    .work-panel[data-zoom="1"] .work-text,
    .work-panel[data-zoom="1"] .work-rail { display:none; }
    .work-panel[data-zoom="1"] .work-shot { max-width:min(100%, var(--nw, 100%)); }

    .work-plate[data-shot="1"] { cursor:zoom-in; }
    .work-panel[data-zoom="1"] .work-plate[data-shot="1"] { cursor:zoom-out; }
    .work-plate:focus-visible { outline:1px solid #8A7A54; outline-offset:8px; }

    @media (prefers-reduced-motion: reduce) { .work-panel { transition:none } }

    /* One column, and the frame itself is the scrollport. 860 rather than 760: at
       800px the 3fr/2fr split leaves the case about thirty characters wide, which is
       a column of fragments before it is a layout. */
    @media (max-width: 860px) {
      .work-frame { width:100vw; height:100vh; height:100dvh; gap:18px 0;
        grid-template-columns:minmax(0, 1fr);
        grid-template-rows:auto auto auto auto;
        grid-template-areas: "back" "media" "head" "text";
        overflow:auto; scrollbar-width:none;
        padding:0 18px calc(78px + env(safe-area-inset-bottom)); }
      .work-frame::-webkit-scrollbar { width:0; height:0; }
      .work-back { position:sticky; top:calc(14px + env(safe-area-inset-top)); z-index:3;
        margin-top:calc(14px + env(safe-area-inset-top)); }
      .work-title { font-size:30px; }
      .work-head { align-self:auto; }
      /* One column: the picture is capped by the viewport instead of by a row, and the
         media block is sized by its content. min-height:0 is the desktop rule that
         lets the plate shrink inside a fixed row — carried into the mobile grid it let
         the row compress the picture to a third of its size, so a portrait capture came
         out 146px wide with the strip crushed under it. */
      .work-plate { align-self:start; min-height:auto; }
      .work-shot { max-height:50vh; }
      .work-plate[data-many="1"] .work-shot { max-height:50vh; }
      .work-text { overflow:visible; padding-right:0; }
      .work-rail { display:none; }
      .work-hint { display:none; }
      .work-panel[data-zoom="1"] .work-frame {
        width:100vw; height:100dvh;
        grid-template-rows:auto minmax(0, 1fr);
        grid-template-areas: "back" "media"; }
      .work-panel[data-zoom="1"] .work-shot { max-height:none; }
      .work-panel[data-zoom="1"] .work-plate { align-self:stretch; min-height:0; }
      /* off the edges of the image and onto real targets: 46px, above the home bar */
      .work-panel[data-shots="1"] .work-step { display:grid; }
      .work-step { position:fixed; top:auto; transform:none; z-index:4;
        bottom:calc(16px + env(safe-area-inset-bottom));
        width:46px; height:46px; padding:0; font-size:26px;
        place-items:center; color:#C9C2B0;
        background:rgba(10,9,8,.78); border:1px solid #4A4136; }
      .work-step[data-d="-1"] { left:auto; right:76px; }
      .work-step[data-d="1"] { right:18px; }
    }`
  document.head.appendChild(style)

  /* ---------- state ---------- */
  let phase = 'idle'          // idle | in | held | out
  let k = 0                   // 0 .. 1
  const DUR = 0.78
  const from = { pos: new THREE.Vector3(), quat: new THREE.Quaternion() }
  let to = null
  let current = null

  /* which still of a multi-image Work is showing */
  let shot = 0

  function paintPlate() {
    const shots = current?.images || []
    const plate = panel.querySelector('.work-plate')
    const img = panel.querySelector('.work-shot')
    const count = panel.querySelector('.work-count')
    const n = shots.length
    const at = n ? ((shot % n) + n) % n : 0
    img.hidden = !n
    if (n) {
      img.src = asset(shots[at])
      /* the alt says which of how many, because the plate steps through them and a
         reader who cannot see it otherwise has no idea the others exist */
      /* O que a captura mostra vem do sufixo do arquivo — `cmpinox-produtos.jpg` diz
         "catálogo de produtos". O número fica junto, porque quem não vê a fileira não
         sabe que as outras existem. Sem sufixo conhecido, só o número: descrever uma
         captura que ninguém olhou seria pior que não descrever. */
      const slug = String(shots[at]).replace(/\.[a-z]+$/i, '').split(/[/-]/).pop()
      const what = UI.shotOf[slug] || UI.shotFallback
      img.alt = n > 1
        ? `${current.title} — ${what}, ${at + 1} de ${n}`
        : `${current.title} — ${what}`
    } else {
      img.removeAttribute('src')
      img.alt = ''
    }
    plate.dataset.many = n > 1 ? '1' : '0'
    /* no stills at all: the media column leaves the grid rather than standing
       there empty, and the hint that says to click them goes with it */
    panel.dataset.media = n ? '1' : '0'
    /* the arrows walk the set, so a Work without one has no arrows at all */
    panel.dataset.shots = n > 1 ? '1' : '0'
    /* a figure with no picture in it is not a control, so it leaves the tab order */
    plate.dataset.shot = n ? '1' : '0'
    plate.tabIndex = n ? 0 : -1
    plate.setAttribute('aria-label', n
      ? (zoomed() ? UI.workZoomOut : UI.workZoomIn)
      : '')
    setNatural()
    count.textContent = n > 1 ? `${at + 1} / ${n}` : ''

    const strip = panel.querySelector('.work-strip')
    for (const b of strip.querySelectorAll('button')) {
      const on = Number(b.dataset.i) === at
      b.setAttribute('aria-current', on ? 'true' : 'false')
      /**
       * One tab stop for the whole strip, not one per still.
       *
       * Eight thumbnails are eight tab stops, and they sit between VOLTAR and the
       * case — so reaching the writing by keyboard meant nine presses through
       * pictures of the same project. The strip is one control that happens to be
       * drawn as its contents; the arrows below move within it.
       */
      b.tabIndex = on ? 0 : -1
      /* keep the lit thumbnail reachable when the strip is wider than the column —
         and only then. scrollIntoView walks every scrollable ancestor, so calling it
         on a strip that already fits can move the panel behind it for no reason */
      if (on && strip.scrollWidth - strip.clientWidth > 4) {
        b.scrollIntoView({ block: 'nearest', inline: 'nearest' })
      }
    }
  }

  /**
   * The picture, at the size the file actually is.
   *
   * The panel's second state: the case, the header and the rail go away and the media
   * area takes the frame. The strip survives it, so the set stays navigable from
   * inside the enlargement, and the picture is capped at its own natural width — a
   * 1265px capture stretched to 1900 is softer than the same capture at 1265.
   */
  const zoomed = () => panel.dataset.zoom === '1'

  /**
   * Which still is showing, by name.
   *
   * `graecus-blog-archive` reads in a report; `3` does not, and stops meaning the same
   * thing the moment an image is inserted into the set.
   */
  const shotName = () => {
    const shots = current?.images || []
    if (!shots.length) return ''
    const at = ((shot % shots.length) + shots.length) % shots.length
    return String(shots[at]).split('/').pop().replace(/\.[a-z]+$/i, '')
  }

  /**
   * Next or previous still, wrapping. The set is a ring, like the Works were.
   *
   * Reported **settled**, for the same reason `item_select` is: a hand walking eight
   * captures would otherwise emit eight events saying only that a hand walks. What is
   * worth knowing is which capture it stopped on.
   */
  function stepShot(d) {
    if ((current?.images || []).length < 2) return
    shot += d
    paintPlate()
    trackSettled('image_step', { work: current.id, image: shotName() })
  }

  /** Hand the image's own pixel width to the stylesheet, once it is known. */
  function setNatural() {
    const img = panel.querySelector('.work-shot')
    if (img.naturalWidth) img.style.setProperty('--nw', img.naturalWidth + 'px')
    else img.style.removeProperty('--nw')
  }

  function setZoom(on) {
    const plate = panel.querySelector('.work-plate')
    if (plate.dataset.shot !== '1') on = false
    const opening = on && !zoomed()
    panel.dataset.zoom = on ? '1' : '0'
    plate.setAttribute('aria-label', on ? UI.workZoomOut : UI.workZoomIn)
    /* only on the way open, and only from a real gesture — `show()` and `enter()` both
       close it on the way past, and a close is not an event worth having */
    if (opening && current) track('image_open', { work: current.id, image: shotName() })
    panel.querySelector('.work-hint').textContent = on
      ? 'clique na imagem para reduzir · ← → para percorrer · Esc para voltar ao case'
      : 'clique na imagem para ampliar · ← → para percorrer as imagens'
    /* the strip is the only way between images while enlarged, and a rebuilt layout
       can leave the lit one out of view */
    paintPlate()
  }

  /**
   * The strip is built once per project, not once per still.
   *
   * `paintPlate` runs on every step, and rebuilding eight thumbnails to change which
   * one is lit would throw away the element the visitor is about to click — and, on a
   * strip that scrolls, the scroll position with it.
   */
  function buildStrip() {
    const strip = panel.querySelector('.work-strip')
    const shots = current?.images || []
    strip.innerHTML = ''
    if (shots.length < 2) return
    for (const [i, src] of shots.entries()) {
      const li = document.createElement('li')
      const b = document.createElement('button')
      b.type = 'button'
      b.dataset.i = String(i)
      b.tabIndex = -1
      b.style.backgroundImage = `url(${asset(src)})`
      b.setAttribute('aria-label', `Imagem ${i + 1} de ${shots.length}`)
      b.addEventListener('click', e => {
        e.stopPropagation()
        shot = i
        paintPlate()
        trackSettled('image_step', { work: current.id, image: shotName() })
      })
      li.appendChild(b)
      strip.appendChild(li)
    }
  }

  function fill(work) {
    panel.querySelector('.work-no').textContent = work.no ? 'NO. ' + work.no : ''
    panel.querySelector('.work-title').textContent = work.title || ''
    /* `contain`, not `cover`: these are posters and carousels with type running to
       the edge, and cropping them to fill a 16:10 box would cut the work up */
    panel.querySelector('.work-meta').textContent =
      [work.client, work.kind, work.year].filter(Boolean).join('  ·  ')
    panel.querySelector('.work-blurb').innerHTML = paragraph(work.blurb)

    /**
     * The case lives **here**, and only here.
     *
     * It used to be drawn on the Screen too, under the project list, where a 320x180
     * buffer had to carry five sections of prose at 12px and the reader met the case
     * before choosing the project. Fernando: *"o texto explicativo do projeto deve
     * apenas aparecer quando o usuário clica e a tela da zoom."* Right — this panel
     * is real HTML at real size, which is the one place the case is comfortable, and
     * the Screen goes back to being an index.
     */
    const secs = caseOf(work.id) || []
    panel.querySelector('.work-case').innerHTML = secs
      .filter(sec => sec.lines.length)
      .map(sec => `<h3>${sec.heading}</h3>` + paragraph(sec.lines))
      .join('')
    /**
     * A slot, and for now an empty one.
     *
     * It read *"Confira o case com mais detalhes — em breve."* on every project that
     * was not Miscelânea. There is no longer case to confer, no page for it to live
     * on, and nothing scheduled — so the line was a promise the object could not
     * keep, sitting under the one part of the panel that is entirely checkable. An
     * empty `.work-more` collapses (`:empty { display:none }`), so this costs no
     * space until there is a real destination to put in it.
     */
    panel.querySelector('.work-more').textContent = ''

    shot = 0
    buildStrip()
    paintPlate()
    /* the case just changed shape, so the indicator has to be rebuilt against it —
       and the reader is at the top of a *different* case, not partway down this one */
    panel.querySelector('.work-text').scrollTop = 0
    buildRail()
  }

  /**
   * The indicator, built from what the case actually rendered.
   *
   * One mark per heading, placed at the heading's own share of the scroll height, so
   * the rail is a map of the case rather than a proportional thumb: it says how many
   * sections there are and which one is under the eye. The marks are buttons because
   * a map you can point at is worth more than one you can only read.
   *
   * It hides itself when the case fits, and only then. An indicator for a case that
   * fits is furniture, and the whole reason the native scrollbar was removed was that
   * it was furniture from somewhere else — but a case that *does* scroll must show
   * one, whatever its section count. It used to also require two headings, which left
   * a long single-section case scrolling with no indicator at all and no native bar to
   * fall back on, because `scrollbar-width:none` had already taken that away.
   */
  let headTops = []

  function buildRail() {
    const text = panel.querySelector('.work-text')
    const rail = panel.querySelector('.work-rail')
    const marks = panel.querySelector('.work-marks')
    const heads = [...text.querySelectorAll('.work-case h3')]
    /* a few pixels of slack: sub-pixel layout leaves scrollHeight a hair over
       clientHeight on cases that visibly do not scroll */
    const overflows = text.scrollHeight - text.clientHeight > 4

    marks.innerHTML = ''
    headTops = []
    rail.hidden = !overflows
    if (rail.hidden) { panel.querySelector('.work-pos').textContent = ''; return }

    const span = text.scrollHeight
    for (const [i, h] of heads.entries()) {
      headTops.push(h.offsetTop)
      const li = document.createElement('li')
      const b = document.createElement('button')
      b.type = 'button'
      b.dataset.i = String(i)
      b.setAttribute('aria-label', h.textContent)
      b.style.top = (h.offsetTop / span * 100).toFixed(3) + '%'
      b.addEventListener('click', e => {
        e.stopPropagation()
        text.scrollTo({ top: Math.max(0, h.offsetTop - 10), behavior: SMOOTH ? 'smooth' : 'auto' })
      })
      li.appendChild(b)
      marks.appendChild(li)
    }
    markRail()
  }

  /** Which mark is lit, and the counter under them. */
  function markRail() {
    if (!headTops.length) return
    const text = panel.querySelector('.work-text')
    /* a heading counts as reached once it is near the top of the port, not once it
       has left it — otherwise the first section is never the current one */
    const y = text.scrollTop + 28
    let at = 0
    for (let i = 0; i < headTops.length; i++) if (headTops[i] <= y) at = i
    /* at the floor of the scroll the last section is what is being read, whatever
       the arithmetic says about where its heading sits */
    if (text.scrollTop + text.clientHeight >= text.scrollHeight - 4) at = headTops.length - 1

    const btns = panel.querySelectorAll('.work-marks button')
    btns.forEach((b, i) => { b.dataset.on = i === at ? '1' : '0' })
    panel.querySelector('.work-pos').textContent =
      String(at + 1).padStart(2, '0') + '/' + String(headTops.length).padStart(2, '0')
  }

  const SMOOTH = !matchMedia('(prefers-reduced-motion: reduce)').matches
  panel.querySelector('.work-text').addEventListener('scroll', markRail, { passive: true })
  /* a resize changes the wrap, which changes every offset the rail was built from */
  addEventListener('resize', () => { if (phase !== 'idle') buildRail() })

  /** Swap the Work without moving the camera — for prev/next while already in. */
  function show(work) {
    if (!work) return
    current = work
    /* the enlargement belongs to the picture that was enlarged; carrying it into the
       next project would open that one on an image with its case hidden */
    setZoom(false)
    fill(work)
    onStep?.(work)
  }

  /**
   * Who had focus before the overlay took it.
   *
   * Kept so it can be handed back. A dialog that closes and drops focus on `<body>`
   * sends a keyboard user to the top of the document — they were on a project row
   * and now they are nowhere, with no way back except Tab from the start. Restoring
   * is the whole difference between an overlay and a trapdoor.
   */
  let opener = null

  /** Everything inside the panel a keyboard can land on, in document order. */
  const focusables = () => [...panel.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')]
    /* `tabIndex >= 0` as well as the selector: a `button` matches the selector whatever
       its tabindex, so the strip's unlit thumbnails — which the browser skips — were
       still in this list. The trap's ends happened to be right anyway, but a list that
       disagrees with the real tab order is a trap waiting for the next element. */
    .filter(n => !n.disabled && n.tabIndex >= 0 && n.offsetParent !== null)

  function enter(work) {
    if (phase === 'in') return
    if (phase === 'held') { show(work); return }
    current = work
    /**
     * Unhidden *before* it is filled, because the rail measures.
     *
     * `fill()` ends by building the indicator out of `offsetTop` and `scrollHeight`,
     * and a `[hidden]` element has neither — every heading reports 0 and the rail
     * comes out as a stack of marks on the same pixel. Nothing else changes: the
     * panel is `opacity:0; pointer-events:none` until `data-open`, so it is invisible
     * and untouchable for the whole flight either way.
     */
    panel.hidden = false
    panel.dataset.zoom = '0'
    fill(work)
    /* only remember the opener on the way *in* — stepping between Works must not
       overwrite it with a button inside the panel */
    opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    from.pos.copy(camera.position); from.quat.copy(camera.quaternion)
    to = screenFillPose(camera, screen)
    phase = 'in'; k = 0
    /* focus moves in as soon as the panel exists, not when the flight lands: the
       flight is half a second and a keyboard user should not be stranded for it */
    focusables()[0]?.focus()
  }

  function exit() {
    if (phase === 'idle' || phase === 'out') return
    panel.dataset.zoom = '0'
    panel.dataset.open = '0'
    from.pos.copy(camera.position); from.quat.copy(camera.quaternion)
    phase = 'out'; k = 0
    /* hand focus back before the flight, for the same reason it was taken early */
    if (opener && document.contains(opener)) opener.focus()
    opener = null
  }

  panel.querySelector('.work-back').addEventListener('click', e => {
    e.stopPropagation()
    if (zoomed()) setZoom(false); else exit()
  })
  /**
   * The picture is a control now, and what it does is change its own size.
   *
   * It used to advance to the next still, which was the whole of what a visitor could
   * do with a set and is the thing he called *"ruim"*. Stepping belongs to the strip,
   * which shows what it is stepping to; the picture keeps the gesture that its own
   * cursor advertises — zoom-in, then zoom-out.
   */
  const plateEl = panel.querySelector('.work-plate')
  plateEl.addEventListener('click', e => {
    e.stopPropagation()
    if (plateEl.dataset.shot === '1') setZoom(!zoomed())
  })
  /* role=button means the keyboard expects both of these to work */
  plateEl.addEventListener('keydown', e => {
    if (e.key !== 'Enter' && e.key !== ' ') return
    e.preventDefault(); e.stopPropagation()
    if (plateEl.dataset.shot === '1') setZoom(!zoomed())
  })
  panel.querySelector('.work-shot').addEventListener('load', setNatural)
  /**
   * The arrows move through the pictures, not through the projects.
   *
   * They stepped between Works, which put the panel's largest, most obvious control on
   * its least likely action — you open a project to read *that* project, and the set of
   * stills is the thing you actually want to walk. Fernando: *"só removeria a seta pra
   * trocar de projeto e deixaria ela pra scrollar a imagem dentro da página."*
   *
   * Changing project keeps the route it always had and the one that matches the object:
   * VOLTAR to the index, or the LUA, which is the wheel that selects on that index.
   */
  for (const b of panel.querySelectorAll('.work-step')) {
    b.addEventListener('click', e => { e.stopPropagation(); stepShot(+b.dataset.d) })
  }
  /* click anywhere that is not the Work itself — the dialog convention, and the
     same instinct summon.js had about the Screen being the way back */
  panel.addEventListener('click', () => { if (zoomed()) setZoom(false); else exit() })
  panel.querySelector('.work-frame').addEventListener('click', e => e.stopPropagation())
  addEventListener('keydown', e => {
    if (!(phase === 'held' || phase === 'in')) return
    /**
     * Escape is **not** handled here, deliberately.
     *
     * It used to be, and `scene.js` handles it too — Escape is one of four ways into
     * `moonBack()`, the Unit's own Back. Both fired, so the first Escape on an enlarged
     * picture closed the enlargement *and* left the project. Stopping the event was the
     * obvious patch and the wrong one: which handler runs first depends on where the
     * key was pressed, because a real press targets the focused element and reaches the
     * window capture listener first, while a synthetic one targets the window and
     * reaches whichever listener was registered first — `scene.js`, as it happens.
     *
     * A back stack with two owners is the bug. There is one now: `moonBack()` calls
     * `back()` below, and this panel's levels are levels of the Unit's Back like any
     * other, LCD flash included.
     */
    /**
     * The arrows mean what is under the hand.
     *
     * They step between projects, which is right everywhere in this panel except one
     * place: with a thumbnail focused, the obvious reading of a right arrow is "the
     * next image", and getting a different project instead is the control lying about
     * what it does. So inside the strip they move the selection and carry focus with
     * it; everywhere else they are unchanged.
     */
    /* the keys say what the arrows say — everywhere in the panel, not only inside the
       strip. Two controls with the same shape and different meanings is the bug that
       the arrows themselves used to be. */
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      if ((current?.images || []).length > 1) {
        stepShot(e.key === 'ArrowRight' ? 1 : -1)
        /* keep focus on the thumbnail being moved between, when that is where it is */
        if (document.activeElement?.closest?.('.work-strip')) {
          panel.querySelector('.work-strip button[aria-current="true"]')?.focus()
        }
      }
      e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation()
      return
    }
    /**
     * The focus trap.
     *
     * Tab off either end of the panel comes back round to the other, so focus
     * cannot walk out into the page behind — which is still there, still has six
     * Pads and three wheel proxies in it, and would silently become reachable
     * underneath an overlay that is meant to be modal. Capture is not enough on its
     * own; the wrap has to be explicit because the elements behind are not hidden.
     */
    if (e.key === 'Tab') {
      const f = focusables()
      if (!f.length) return
      const first = f[0], last = f[f.length - 1]
      if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault() }
      else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault() }
    }
  }, true)

  function update(dt) {
    if (phase === 'idle') return
    if (phase === 'held') return
    k = Math.min(1, k + dt / DUR)
    const e = EASE(k)

    if (phase === 'in') {
      camera.position.lerpVectors(from.pos, to.pos, e)
      camera.quaternion.slerpQuaternions(from.quat, to.quat, e)
      onProgress?.(e)
      if (k >= 1) { phase = 'held'; panel.dataset.open = '1' }
    } else {
      /* on the way out the rig takes the camera back, so the target is wherever it
         wants the camera to be *now* — asking it each frame keeps the hand-back
         seamless even if the visitor dragged the view before entering */
      const home = restore()
      camera.position.lerpVectors(from.pos, home.pos, e)
      camera.quaternion.slerpQuaternions(from.quat, home.quat, e)
      onProgress?.(1 - e)
      if (k >= 1) { phase = 'idle'; panel.hidden = true; current = null }
    }
  }

  return {
    enter, exit, update, show,
    /**
     * Close one level, and say which one was closed.
     *
     * The overlay is two deep — an enlarged picture inside a Work — and the Unit's
     * Back is the single owner of both. Returns `'zoom'` when it closed the
     * enlargement and `'work'` when it left the project, so the caller can say the
     * right thing on the LCD.
     */
    back() {
      if (zoomed()) { setZoom(false); return 'zoom' }
      exit(); return 'work'
    },
    /** Browse to the next or previous Work without leaving the overlay. */
    step(d) { if (phase === 'held' || phase === 'in') onStep?.(d, 'request') },
    get active() { return phase !== 'idle' },
    get holding() { return phase === 'held' },
    get work() { return current },
  }
}
