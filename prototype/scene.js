import * as THREE from 'three'
/* The copy is not in this file. ADR-0002: the DOM is truth and the Screen renders it,
   so both consumers read the same source. See src/content/modules.ts. */
import { MODULES } from '../src/content/modules.ts'
import { candle, RAMPS } from './light.js'
import { WORKS } from '../src/content/modules.ts'
import { createSummoning } from './summon.js'
import { createPortrait } from './portrait.js'
import { createDisplay } from './display.js'
import { printLayer, engravedLayer } from './plate-art.js'
import { padMaps, faderSlot, faderCap } from './control-faces.js';
import { deckMaps, deckGlow } from './deck-faces.js'
import { createRoomDecor } from './room-decor.js'
import { createAltarProps } from './altar-props.js'
import { createPost } from './post.js'
import { createFocus } from './focus.js'
import { createIntro, REST } from './intro.js'
import {
  buffer as screenBuffer, render as renderScreen, SCREEN_W, SCREEN_H, setBoot,
  setModule as setScreenModule, setVigil as setScreenVigil,
  setCrossfade as setScreenCrossfade, setFace as setScreenFace,
  setHoverWork, setPlinthWork, workRowAt,
} from './screen/render.js'
/* ============ Tenebrae — 3D material & form study ============ */
const W = () => innerWidth, H = () => innerHeight;

/**
 * Dark before anything else happens.
 *
 * `render.js` defaults `boot` to 1 — a Screen that is already on — and the Unit
 * paints the buffer several times during setup, well before `intro.js` exists to
 * say otherwise. So the first frames showed the Module in full and then cut back
 * to the power-on, which is the film running in the wrong order.
 *
 * Called here rather than at the intro's construction because "here" is the top of
 * the module, before a single pixel of the Screen has been drawn.
 */
setBoot(0);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
/* On a retina panel `devicePixelRatio` is 2, which is *four times* the fragments of
   1.0 — every shadow lookup, every PBR evaluation, four times over. It was the single
   most expensive number in the file and it was not buying much: this scene is dark,
   soft and largely textureless, which is exactly where supersampling shows least.
   1.5 is 1.8x cheaper than 2 and still resolves the Plate's engraving.
   `__unit.setQuality()` moves it. */
let PIXEL_RATIO = Math.min(devicePixelRatio, 1.5);
renderer.setPixelRatio(PIXEL_RATIO);

/**
 * Shadows. T-07, and the tickets are right that it is the biggest single win.
 *
 * Nothing in this scene cast one, which is most of why it read flat: with no
 * shadow, nothing sits *on* anything. The Unit floated on the cloth, the
 * candlesticks floated on the Altar, the furniture floated on the floor, and every
 * surface was lit from every direction at once like a product shot with no table.
 *
 * The rig carries them, not the Candles. Three directional lights need three cheap
 * 2D shadow maps; three point lights would need three *cube* maps — six renders
 * each — and this already runs on a machine that is struggling. The Candles keep
 * doing the colour and the falloff, the rig does the geometry of the dark.
 *
 * `__unit.setQuality()` turns them down or off if it costs too much.
 */
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.setSize(W(), H());
renderer.toneMapping = THREE.ACESFilmicToneMapping;
/**
 * Exposure, set by measuring rather than by eye.
 *
 * At 0.85 the Sun state read mean 34 / p50 16 with **67% of pixels below 32** —
 * night numbers, on the setting that is supposed to be daylight. Pushing the sun
 * harder did not fix it: p90 was already 165 and clipping while p50 stayed at 40,
 * which is a *contrast* problem, not a brightness one. The levers that lift shadows
 * are exposure and the environment, not the key.
 *
 * 1.75 puts Sun at mean 73 / p50 64 with 0.1% blown — a lit room with nothing
 * clipping.
 */
renderer.toneMappingExposure = 1.40;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.getElementById('stage').appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x060505);

const camera = new THREE.PerspectiveCamera(38, W() / H(), 0.1, 100);
/* CAM is the angle off vertical, in degrees. 0 is the spec-sheet view straight down;
   larger angles put the candlesticks into profile so they read as candles at all. */
/**
 * This version ships one angle: straight down.
 *
 * `CAM_LIMITS` used to open a 70-degree arc of tilt and 84 of yaw, which is how a
 * room got built that the default view could never see. The Plate is the object
 * and top-down is the angle it is designed to be read at, so the orbit is closed
 * and the only camera move that ships is the opening one (`intro.js`).
 */
let CAM = { ...REST };
/* Clamped so the visitor can look up into the room but never behind or under the Unit,
   whose sides are not modelled to hold up there. */
const CAM_LIMITS = { tilt: [4, 74], yaw: [-42, 42] };
/* Orbit is off for this version. The sliders in the workbench still drive `CAM`. */
const ORBIT = false;
/**
 * Is the focus flight driving the camera right now?
 *
 * A plain `let`, reassigned once `focus` exists, rather than a reference to
 * `focus` itself: `placeCamera()` runs during module init, hundreds of lines
 * before `focus` is declared, and a `const` in its temporal dead zone throws even
 * from `typeof` — which an undeclared name would not.
 */
let focusDriving = () => false;

function placeCamera() {
  /* the focus flight drives the camera outright while it runs; the rig must not
     fight it for the same transform */
  if (focusDriving()) return;
  const a = CAM.tilt * Math.PI / 180, y = CAM.yaw * Math.PI / 180;
  const h = Math.sin(a) * CAM.dist;
  camera.position.set(Math.sin(y) * h, Math.cos(a) * CAM.dist, Math.cos(y) * h);
  /* look a little higher as the view comes up, so the window enters frame naturally */
  camera.lookAt(0, .35 + Math.max(0, (CAM.tilt - 34) / 40) * 2.4, 0);
}
placeCamera();

/**
 * Wear: a grey noise field used as a roughness map.
 *
 * Uniform roughness is one of the loudest tells that a surface is CG. A real floor
 * is polished where feet fall and dull where they do not; real plaster takes light
 * unevenly; real marble is glassy in places and matte in others. With one roughness
 * value the specular is perfectly even everywhere and the eye reads "computer"
 * before it reads anything else.
 *
 * Two octaves of blobs, mid-grey, so it modulates roughness rather than replacing
 * it — the material's own `roughness` still sets the level, this only breaks it up.
 */
function wearMap(seed, blobs = 260, contrast = .28, repeat = 3) {
  const c = document.createElement('canvas'); c.width = c.height = 512;
  const g = c.getContext('2d');
  const rnd = rng(seed);
  const mid = 160;
  g.fillStyle = `rgb(${mid},${mid},${mid})`; g.fillRect(0, 0, 512, 512);
  for (let pass = 0; pass < 2; pass++) {
    const R = pass ? 90 : 26;
    for (let i = 0; i < blobs / (pass + 1); i++) {
      const x = rnd() * 512, y = rnd() * 512, r = R * (.4 + rnd());
      const v = Math.round(mid + (rnd() - .5) * 255 * contrast);
      const grad = g.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, `rgba(${v},${v},${v},.5)`);
      grad.addColorStop(1, `rgba(${v},${v},${v},0)`);
      g.fillStyle = grad;
      g.beginPath(); g.arc(x, y, r, 0, 6.2832); g.fill();
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  t.anisotropy = 4;
  return t;
}

/* ---------- environment: a studio built in a canvas ---------- */
function envTexture() {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 512;
  const g = c.getContext('2d');
  const sky = g.createLinearGradient(0, 0, 0, 512);
  sky.addColorStop(0, '#3a3026'); sky.addColorStop(0.46, '#1c1712');
  sky.addColorStop(0.54, '#0e0c0a'); sky.addColorStop(1, '#070606');
  g.fillStyle = sky; g.fillRect(0, 0, 1024, 512);
  // key softbox
  const key = g.createRadialGradient(300, 130, 10, 300, 130, 190);
  key.addColorStop(0, '#ffd9a0'); key.addColorStop(1, 'rgba(255,217,160,0)');
  g.fillStyle = key; g.fillRect(80, 0, 460, 320);
  // cool rim
  const rim = g.createRadialGradient(790, 190, 8, 790, 190, 150);
  rim.addColorStop(0, '#6b7f96'); rim.addColorStop(1, 'rgba(107,127,150,0)');
  g.fillStyle = rim; g.fillRect(620, 40, 340, 300);
  // warm bounce low
  const bo = g.createRadialGradient(520, 400, 8, 520, 400, 200);
  bo.addColorStop(0, 'rgba(196,40,28,.55)'); bo.addColorStop(1, 'rgba(196,40,28,0)');
  g.fillStyle = bo; g.fillRect(300, 300, 440, 210);
  const t = new THREE.CanvasTexture(c);
  t.mapping = THREE.EquirectangularReflectionMapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromEquirectangular(envTexture()).texture;

/**
 * Tenebrism, measured (ADR-0018).
 *
 * This used to be three directional lights — key, fill and a cold rim — with the
 * Candles adding colour on top. Measuring it against Fernando's reference is what
 * killed that rig: sampled at eight points around the room, the *distribution* was
 * close, but the Candles were contributing **2% of the light falling on the Altar
 * they stand on**. Environment plus key plus fill carried 94%, and none of those
 * three falls off with distance. Every surface in the room, from the Unit's face
 * to the far wall eleven units back, landed within 1.5x of every other. A room lit
 * to within 50% of itself everywhere is the definition of flat, and no amount of
 * ornament survives it.
 *
 * The reference is the opposite shape: mean luminance 21/255, 82% of its pixels
 * below 32, and a 30:1 centre-to-corner falloff. It is four pools of light in a
 * black room.
 *
 * So the key is a SpotLight now, standing where the Candles stand. A spot costs
 * exactly what a directional costs — one 2D shadow map, not the six-face cube a
 * PointLight needs — so the perf argument that put directionals here is satisfied
 * either way. What the cone buys is confinement: it lights the Altar and leaves
 * the floor behind it alone, which a directional cannot do at any intensity.
 *
 * `fill` is gone. The room's bounce is the environment, at a third of its old
 * strength. `rim` became the moon, which is the one source here that *should* be
 * directional — it is 384,000km away, its rays are parallel, and unlike a lamp it
 * does not go out with the Vigil.
 *
 * The numbers below are fitted, not chosen: `scratchpad/fit2.mjs` solves the rig
 * against eight luminances measured off the reference, and these are what it
 * returned. They are a starting point with arithmetic behind them, not a taste
 * judgement — `__unit.setLight()` is how they get judged.
 */
const key = new THREE.SpotLight(0xffc98a, 17, 22, 0.86, 0.85, 2);
key.position.set(-2.4, 4.6, 1.6);
key.target.position.set(0, .2, -.2);
scene.add(key); scene.add(key.target);

/* The moon in the sky — `moon` is already the Moon Deck. Parallel rays, cold,
   and it survives the Vigil — at the end of the
   rite it and the Screen's phosphor are the only things left. */
const moonlight = new THREE.DirectionalLight(0x8FA6C4, 0.42);
moonlight.position.set(1.1, 2.4, 4.2);
scene.add(moonlight);

/* Bounce. A uniform environment is a poor stand-in for GI — real bounce falls off
   into a corner and this does not — but it is the cheap half of the trick, and at
   0.31 it sits under the practicals instead of drowning them. */
/* The only omnidirectional term in the scene, and therefore the only one that
   lifts shadows rather than highlights. It carries the daylight state; `applyVigil`
   takes it to nothing by full Vigil, which is what keeps the night dark. */
scene.environmentIntensity = 1.85;

/**
 * Only the key casts, and it is framed tightly on the Unit.
 *
 * A shadow camera wide enough to cover the whole room spreads its texels so thin
 * that the Unit's own shadow turns to mush — and the Unit is the only place a
 * shadow has to be crisp. The room gets its darkness from falloff and from the
 * Candles dying, which is what tenebrism actually is.
 */
key.castShadow = true;
/* 2048 was chosen for a directional whose camera had to cover the whole room. The
   spot's cone covers the Altar and nothing else, so 1024 texels land denser here
   than 2048 did there — cheaper *and* crisper. */
key.shadow.mapSize.set(1024, 1024);
key.shadow.camera.near = 0.5;
key.shadow.camera.far = 22;
/* A spot's shadow camera is a perspective one and three derives its fov from the
   cone angle, so the ortho box the directional needed is gone. The cone is already
   the tight framing that comment above asks for — every texel it spends lands on
   the Altar and the Unit rather than on eleven units of empty floor. */
/* the Plate is a plane a hair above the Chassis: without a bias they z-fight in
   shadow and the whole faceplate crawls with acne */
key.shadow.bias = -0.0008;
key.shadow.normalBias = 0.022;
key.shadow.radius = 3;

/* ---------- ornament: drawn once, baked into the metal ---------- */
function cusp(g, x, y, a, len, d) {
  if (d <= 0 || len < 2) return;
  const x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len;
  g.beginPath(); g.moveTo(x, y);
  g.quadraticCurveTo(x + Math.cos(a - .5) * len * .6, y + Math.sin(a - .5) * len * .6, x2, y2);
  g.stroke();
  cusp(g, x2, y2, a - .62, len * .66, d - 1);
  cusp(g, x2, y2, a + .62, len * .66, d - 1);
  g.beginPath(); g.arc(x2, y2, len * .17, 0, 6.2832); g.stroke();
}
function rosette(g, cx, cy, R, N) {
  g.save();
  g.beginPath(); g.arc(cx, cy, R, 0, 6.2832); g.clip();
  g.lineWidth = R * .012;
  for (let y = -R; y < R; y += R * .045) { g.beginPath(); g.moveTo(cx - R, cy + y); g.lineTo(cx + R, cy + y + R * .3); g.stroke(); }
  g.restore();
  g.lineWidth = R * .022;
  [1, .74, .5, .26].forEach(k => { g.beginPath(); g.arc(cx, cy, R * k, 0, 6.2832); g.stroke(); });
  for (let i = 0; i < N; i++) {
    const a = (i / N) * 6.2832 - 1.5708;
    g.beginPath(); g.moveTo(cx + Math.cos(a) * R * .26, cy + Math.sin(a) * R * .26);
    g.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); g.stroke();
    g.beginPath(); g.arc(cx + Math.cos(a) * R * .62, cy + Math.sin(a) * R * .62, R * .115, 0, 6.2832); g.stroke();
    g.beginPath(); g.arc(cx + Math.cos(a + Math.PI / N) * R * .87, cy + Math.sin(a + Math.PI / N) * R * .87, R * .07, 0, 6.2832); g.stroke();
    cusp(g, cx + Math.cos(a) * R, cy + Math.sin(a) * R, a, R * .13, 3);
  }
}

/* ---------- foliate engraving ----------
   The references agree: a frame around a cleared field, corners carrying the weight,
   organic motif on a strict mirrored axis, density from repetition rather than thickness. */

/** One acanthus leaf, filled. The references get their weight from solid mass, not outline. */
function leaf(g, x, y, a, len, curl, w) {
  const tx = x + Math.cos(a) * len, ty = y + Math.sin(a) * len;
  const n = a + Math.PI / 2, sp = len * .46;
  g.beginPath();
  g.moveTo(x, y);
  g.quadraticCurveTo(x + Math.cos(a + curl) * sp + Math.cos(n) * sp * .9, y + Math.sin(a + curl) * sp + Math.sin(n) * sp * .9, tx, ty);
  g.quadraticCurveTo(x + Math.cos(a - curl * .5) * sp - Math.cos(n) * sp * .5, y + Math.sin(a - curl * .5) * sp - Math.sin(n) * sp * .5, x, y);
  g.fill();
  g.lineWidth = w; g.stroke();
  /* the midrib is cut back out, so the mass still reads as carved rather than blobbed */
  g.save(); g.globalCompositeOperation = 'destination-out';
  g.lineWidth = w * .9;
  g.beginPath(); g.moveTo(x, y);
  g.quadraticCurveTo(x + Math.cos(a + curl * .35) * sp, y + Math.sin(a + curl * .35) * sp, tx, ty);
  g.stroke(); g.restore();
}

/** A serpentine stem with leaves thrown alternately off each crest, and berries in the troughs. */
function vine(g, x0, y0, x1, y1, band, waves, w) {
  const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy);
  const ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
  const amp = band * .30, step = L / waves;
  g.lineWidth = w;
  g.beginPath(); g.moveTo(x0, y0);
  for (let i = 0; i < waves; i++) {
    const t0 = i * step, sgn = i % 2 ? -1 : 1;
    g.quadraticCurveTo(
      x0 + ux * (t0 + step * .5) + nx * amp * sgn, y0 + uy * (t0 + step * .5) + ny * amp * sgn,
      x0 + ux * (t0 + step),                       y0 + uy * (t0 + step));
  }
  g.stroke();
  for (let i = 0; i < waves; i++) {
    const t = (i + .5) * step, sgn = i % 2 ? -1 : 1;
    const cx = x0 + ux * t + nx * amp * sgn * .78, cy = y0 + uy * t + ny * amp * sgn * .78;
    const a = Math.atan2(ny, nx) * 1 + (sgn > 0 ? 0 : Math.PI);
    leaf(g, cx, cy, a, band * .60, .95 * sgn, w * .85);
    leaf(g, cx, cy, a - .85 * sgn, band * .38, .8 * sgn, w * .7);
    leaf(g, cx, cy, a + .80 * sgn, band * .30, .7 * sgn, w * .65);
    /* a smaller leaf thrown the other way keeps the run from reading as a single wave */
    const ox = x0 + ux * (t + step * .5), oy = y0 + uy * (t + step * .5);
    leaf(g, ox, oy, a + Math.PI, band * .26, -.7 * sgn, w * .6);
    const bx = x0 + ux * (i + 1) * step, by = y0 + uy * (i + 1) * step;
    g.lineWidth = w * .8;
    g.beginPath(); g.arc(bx - nx * amp * sgn * .18, by - ny * amp * sgn * .18, band * .055, 0, 6.2832); g.stroke();
  }
}

/** Corner scroll and palmette. The heaviest thing on the Plate. */
function cartouche(g, cx, cy, s, rot, w) {
  g.save(); g.translate(cx, cy); g.rotate(rot);
  g.lineWidth = w;
  for (const dir of [1, -1]) {
    g.beginPath();
    for (let t = 0; t <= 3.2 * Math.PI; t += .12) {
      const r = s * .085 * t, px = Math.cos(t * dir) * r, py = Math.sin(t * dir) * r - s * .1;
      t === 0 ? g.moveTo(px, py) : g.lineTo(px, py);
    }
    g.stroke();
  }
  for (let i = 0; i < 9; i++) {
    const a = -Math.PI * .96 + i * (Math.PI * .92 / 8);
    leaf(g, 0, 0, a, s * (.52 + .40 * Math.sin(i / 8 * Math.PI)), .9, w * .85);
  }
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI * .82 + i * (Math.PI * .64 / 4);
    leaf(g, 0, 0, a, s * .30, -.7, w * .6);
  }
  g.lineWidth = w * 1.3;
  g.beginPath(); g.arc(0, 0, s * .12, 0, 6.2832); g.fill(); g.stroke();
  g.restore();
}

/** The whole frame: two rules, four runs, four corners. */
function foliateBorder(g, x, y, w, h, band, waves, lw) {
  g.lineWidth = lw * 1.25;
  g.strokeRect(x, y, w, h);
  g.lineWidth = lw * .6;
  g.strokeRect(x + band, y + band, w - band * 2, h - band * 2);
  const i = band * .52;
  /* waves = 0 leaves the runs bare, which is the restrained Art Nouveau frame:
     a rule with rounded corners and ornament only where the corners turn. */
  if (waves >= 1) {
  vine(g, x + band * 1.5, y + i, x + w - band * 1.5, y + i, band, waves, lw);
  vine(g, x + w - band * 1.5, y + h - i, x + band * 1.5, y + h - i, band, waves, lw);
  vine(g, x + i, y + h - band * 1.5, x + i, y + band * 1.5, band, Math.round(waves * h / w), lw);
  vine(g, x + w - i, y + band * 1.5, x + w - i, y + h - band * 1.5, band, Math.round(waves * h / w), lw);
  }
  const c = band * 1.15;
  cartouche(g, x + band * .95, y + band * .95, c, Math.PI * .75, lw);
  cartouche(g, x + w - band * .95, y + band * .95, c, Math.PI * .25, lw);
  cartouche(g, x + w - band * .95, y + h - band * .95, c, -Math.PI * .25, lw);
  cartouche(g, x + band * .95, y + h - band * .95, c, -Math.PI * .75, lw);
}


/**
 * The Screen's aperture.
 *
 * Declared here because the Chassis and the Plate are cut around it, and both are
 * built before the Screen is. Recessing the Screen without cutting these is what
 * made it go black — a panel below two solid surfaces is a panel nobody can see.
 *
 * The opening also has to clear the Decks. They begin at x = .88; the old bezel
 * reached 1.06 and overlapped both wheels.
 */
const FACE_Y = .353, WELL_Y = .272;

/**
 * The Unit's proportions, in one place, because they are a system.
 *
 * Three things were wrong and only one of them was visible:
 *
 *   - **The Decks overhung the Plate.** r .98 at x 1.86 reaches 2.84; the Plate's
 *     half-width is 2.79. The wheels hung .05 off the edge of the instrument.
 *   - **The Decks did not match the artwork.** The faceplate draws its circles at
 *     .79 — the wheels were 24% larger than the holes drawn for them, which is
 *     also what was strangling the Screen.
 *   - **The Pad row was wider than the Screen** — 2.00 against 1.50. The row of
 *     buttons was the widest element on the Plate and read as the main event.
 *
 * The Decks come back to the artwork's .79, which frees the centre; the Screen
 * takes that room and goes from 27% of the Plate's width to 33% — half again the
 * area; and the Pads shrink to sit *within* the Screen's width, where a
 * subordinate row belongs. The Crossfader is sized off the Screen rather than
 * chosen on its own.
 */
/**
 * The Plate got wider, and it is the artwork's doing.
 *
 * Bigger wheels and a bigger Screen were competing for one number: the Screen can
 * only be as wide as the gap the Decks leave, so at 5.58 across, every millimetre
 * given to a wheel came straight off the display. Shrinking the Decks to .79 to
 * fit the Screen made them too small, and that trade had no good position on it.
 *
 * The way out was to stop treating the Plate's width as fixed. Fernando's
 * faceplate is 1694 x 929 — an aspect of 1.82, noticeably wider than the 1.71 the
 * Plate had. The artwork was already telling us the instrument was too narrow, and
 * it was being stretched to fit a Plate it was never drawn for.
 *
 * So the Plate takes the artwork's own ratio. That buys .36 of width, which pays
 * for Decks at .93 — up 18% and nearly back to where they were — while the Screen
 * keeps every bit of the size it just gained. The artwork also stops being
 * stretched, and its drawn circles land on the wheels they were drawn for.
 */
const PLATE = { w: 5.94, d: 3.26 };      // 1.822 — the faceplate's own aspect
/**
 * The Decks are back at their original size.
 *
 * Widening the Screen meant shrinking them — r .93 to .84 — because their outer
 * edge was already five hundredths off the Plate's edge and there was nowhere else
 * for the room to come from. Fernando, looking at it: "the faceplate is off now".
 * He is right, and it is worth writing down why: the Plate takes its proportions
 * from his own faceplate artwork, and the two circles are the largest shapes on it.
 * Shrinking them by a tenth reads immediately as the whole face being wrong, in a
 * way a third more Screen does not repay.
 *
 * `SCREEN_Z` moves from -.58 to -.50 instead. Same Screen, eight hundredths lower
 * down the Plate, which is what buys clearance from the engraved band across the
 * top — the thing it was actually running into.
 */
const WHEEL = { r: .93, x: 1.99, z: -.12 };
const SCREEN_Z = -.50;                   // clear of the artwork's engraved band
const OPENING = { w: 1.84, d: 1.035 };   // 16:9, the buffer's own ratio
const RIM = { w: 1.96, d: 1.175 };
const PAD = { size: .23, pitch: .28, z: .55 };
const FADER = { len: 1.30, z: 1.16, travel: 1.12 };
const PAD_X0 = -PAD.pitch * 2.5;   // six on a centred pitch

/* Shapes are built in XY and rotated onto the Plate, which maps shape-y to world
   -z — so the aperture goes at -SCREEN_Z. */
const APERTURE = { w: OPENING.w, d: OPENING.d, y: -SCREEN_Z };

/* ---------- field work ----------
   World space maps onto the Plate texture through PX / PY below. Reserves are the areas the Parts occupy: the
   engraving fills everything else and is then cut back out of them. */
/* The texture matches PLATE's ratio, so ornament is never stretched. */
const TW = 2048, TH = 1124;              // matches PLATE's aspect, so nothing stretches
const PX = x => (x + PLATE.w / 2) / PLATE.w * TW;
const PY = z => (z + PLATE.d / 2) / PLATE.d * TH;
/**
 * What the Parts occupy, derived from the geometry rather than typed beside it.
 *
 * These were literals, and literals go stale the moment a Part moves — the Plate
 * then gets cut back for a Screen that is no longer that size and left uncut where
 * a Deck now sits. Everything here reads the same constants the meshes are built
 * from, so the artwork and the object cannot disagree.
 */
const RESERVES = [
  /* Screen: the rim's footprint, with a little air around it */
  { r: [PX(-RIM.w / 2 - .04), PY(SCREEN_Z - RIM.d / 2 - .04),
        PX(RIM.w / 2 + .04) - PX(-RIM.w / 2 - .04),
        PY(SCREEN_Z + RIM.d / 2 + .04) - PY(SCREEN_Z - RIM.d / 2 - .04)] },
  /* Pad row */
  { r: [PX(PAD_X0 - PAD.size), PY(PAD.z - PAD.size),
        PX(-PAD_X0 + PAD.size) - PX(PAD_X0 - PAD.size),
        PY(PAD.z + PAD.size) - PY(PAD.z - PAD.size)] },
  /* Crossfader */
  { r: [PX(-FADER.len / 2 - .06), PY(FADER.z - .20),
        PX(FADER.len / 2 + .06) - PX(-FADER.len / 2 - .06),
        PY(FADER.z + .20) - PY(FADER.z - .20)] },
  { c: [PX(-WHEEL.x), PY(WHEEL.z), PX(-WHEEL.x + WHEEL.r) - PX(-WHEEL.x)] },    // Moon deck
  { c: [PX(WHEEL.x), PY(WHEEL.z), PX(WHEEL.x + WHEEL.r) - PX(WHEEL.x)] },       // Sun deck
];
/* The Print gets cleared ground too — labels never fight the field. */
const PRINT_RESERVES = [
  /* the Pad label row — ornament must clear it the way it clears every other Print */
  [PX(PAD_X0 - PAD.size), PY(PAD.z - PAD.size * .60) - 22,
   PX(-PAD_X0 + PAD.size) - PX(PAD_X0 - PAD.size), 22],
  [PX(-1.05), PY(.86), PX(1.05) - PX(-1.05), 72],   // HOT CUE / CROSSFADE
  /* The MOON and SUN reserves went with their labels. A reserve is a clearing cut
     in the ornament so a word can sit on bare ground; leaving them behind would
     have left two bald patches where nothing is printed any more. */
];

/** A fine ruled ground. Engraving never leaves bare metal. */
function hatch(g, step, ang, w) {
  g.save(); g.lineWidth = w;
  g.beginPath();
  const D = 2600, ca = Math.cos(ang), sa = Math.sin(ang);
  for (let t = -D; t < D * 1.6; t += step) {
    g.moveTo(t * ca - D * sa, t * sa + D * ca);
    g.lineTo(t * ca + D * sa, t * sa - D * ca);
  }
  g.stroke(); g.restore();
}

/** Lozenge lattice with a quatrefoil at every node — the diaper of a carved ground. */
function diaper(g, x, y, w, h, s, lw) {
  g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
  g.lineWidth = lw;
  for (let py = y - s; py < y + h + s; py += s) {
    for (let px = x - s; px < x + w + s; px += s) {
      const o = (Math.round((py - y) / s) % 2) * s / 2;
      g.beginPath();
      g.moveTo(px + o, py - s / 2); g.lineTo(px + o + s / 2, py);
      g.lineTo(px + o, py + s / 2); g.lineTo(px + o - s / 2, py);
      g.closePath(); g.stroke();
      for (let k = 0; k < 4; k++) {
        const a = k * Math.PI / 2;
        g.beginPath();
        g.arc(px + o + Math.cos(a) * s * .17, py + Math.sin(a) * s * .17, s * .085, 0, 6.2832);
        g.stroke();
      }
    }
  }
  g.restore();
}

/** Cut the Parts back out of the field, then bead the edge so the cut reads as intentional. */
/**
 * Clear the ground the Parts and the Print stand on.
 *
 * With procedural ornament this is an opaque cut: the vine must not run under a
 * label. With a full-bleed painting it cannot be — filling a rectangle with the
 * plate's base colour stamps a grey box across the artwork, and the whole idea of
 * this approach is a control panel printed *over* a painting. So the art gets a
 * translucent scrim instead: knocked back far enough to read a label on, still
 * visibly the painting. The Parts themselves are opaque objects sitting on top,
 * so their reserves need nothing at all.
 */
function cutReserves(g, base, lw, overArt) {
  g.save();
  if (overArt) {
    g.fillStyle = 'rgba(10,11,13,.62)';
    PRINT_RESERVES.forEach(([x, y, w, h]) => { g.beginPath(); g.rect(x, y, w, h); g.fill(); });
    g.restore();
    return;
  }
  g.fillStyle = base;
  PRINT_RESERVES.forEach(([x, y, w, h]) => { g.beginPath(); g.rect(x, y, w, h); g.fill(); });
  RESERVES.forEach(o => {
    g.beginPath();
    if (o.r) { const [x, y, w, h] = o.r; g.rect(x - 16, y - 16, w + 32, h + 32); }
    else { const [cx, cy, r] = o.c; g.arc(cx, cy, r + 16, 0, 6.2832); }
    g.fill();
  });
  g.restore();
  g.lineWidth = lw * .8;
  RESERVES.forEach(o => {
    g.beginPath();
    if (o.r) { const [x, y, w, h] = o.r; g.rect(x - 16, y - 16, w + 32, h + 32); }
    else { const [cx, cy, r] = o.c; g.arc(cx, cy, r + 16, 0, 6.2832); }
    g.stroke();
    /* beading */
    if (o.c) {
      const [cx, cy, r] = o.c;
      for (let i = 0; i < 48; i++) {
        const a = i / 48 * 6.2832;
        g.beginPath(); g.arc(cx + Math.cos(a) * (r + 30), cy + Math.sin(a) * (r + 30), lw * 1.1, 0, 6.2832); g.stroke();
      }
    }
  });
}

/** A run of ornament pinned to the middle of each edge, as the reference plates all carry. */
function midOrnaments(g, x, y, w, h, band, lw) {
  cartouche(g, x + w / 2, y + band * .55, band * .9, Math.PI / 2, lw);
  cartouche(g, x + w / 2, y + h - band * .55, band * .9, -Math.PI / 2, lw);
  cartouche(g, x + band * .55, y + h / 2, band * .9, 0, lw);
  cartouche(g, x + w - band * .55, y + h / 2, band * .9, Math.PI, lw);
}


/** Deterministic noise. A dial change must not reshuffle the Plate, or nothing can be judged. */
function rng(seed) { let x = seed >>> 0; return () => (x = (x * 1664525 + 1013904223) >>> 0) / 4294967296; }

/** True where a Part or a label already owns the ground. */
function occupied(x, y, pad) {
  if (x < 40 || y < 40 || x > TW - 40 || y > TH - 40) return true;
  for (const [rx, ry, rw, rh] of PRINT_RESERVES)
    if (x > rx - pad && x < rx + rw + pad && y > ry - pad && y < ry + rh + pad) return true;
  for (const o of RESERVES) {
    if (o.r) { const [a2, b2, w2, h2] = o.r; if (x > a2 - pad && x < a2 + w2 + pad && y > b2 - pad && y < b2 + h2 + pad) return true; }
    else { const [cx, cy, r] = o.c; if (Math.hypot(x - cx, y - cy) < r + pad) return true; }
  }
  return false;
}

/** One growing stem. Branches, throws leaves, and dies where the ground is already taken. */
function tendril(g, x, y, ang, len, w, depth, rnd) {
  if (depth <= 0 || len < 11 || w < .45) return;
  /* A stem meeting a Part turns away from it rather than dying — that is what makes the
     field feel grown around the hardware instead of stamped behind it. */
  let curve = 0, mx = 0, my = 0, ex = 0, ey = 0, ok = false;
  for (let attempt = 0; attempt < 6 && !ok; attempt++) {
    curve = (rnd() - .5) * 1.15 + (attempt ? (attempt % 2 ? 1 : -1) * attempt * .38 : 0);
    mx = x + Math.cos(ang + curve * .5) * len * .55; my = y + Math.sin(ang + curve * .5) * len * .55;
    ex = x + Math.cos(ang + curve) * len; ey = y + Math.sin(ang + curve) * len;
    ok = !occupied(ex, ey, 12) && !occupied(mx, my, 10);
  }
  if (!ok) return;
  g.lineWidth = w;
  g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(mx, my, ex, ey); g.stroke();

  const side = rnd() < .5 ? 1 : -1;
  leaf(g, mx, my, ang + curve + side * 1.25, len * .52, .9 * side, w * .8);
  if (rnd() < .55) leaf(g, mx, my, ang + curve - side * 1.15, len * .34, -.8 * side, w * .65);
  if (rnd() < .30) { g.lineWidth = w * .7; g.beginPath(); g.arc(ex, ey, w * 1.5, 0, 6.2832); g.stroke(); }

  if (rnd() < .60) tendril(g, ex, ey, ang + curve + (rnd() < .5 ? 1 : -1) * (.6 + rnd() * .5), len * .66, w * .72, depth - 1, rnd);
  tendril(g, ex, ey, ang + curve, len * .90, w * .88, depth - 1, rnd);
}

/** Seed the field from the corners and the middle of each edge, and let it run inward. */
function growField(g, band, lw, depth, seed) {
  const rnd = rng(seed);
  const L = 54 + band, R = TW - 54 - band, T = 54 + band, B = TH - 54 - band;
  const seeds = [];
  /* seeded all along the inner frame, growing inward */
  for (let i = 0; i <= 14; i++) {
    const t = i / 14;
    seeds.push([L + (R - L) * t, T, Math.PI / 2], [L + (R - L) * t, B, -Math.PI / 2]);
  }
  for (let i = 1; i < 10; i++) {
    const t = i / 10;
    seeds.push([L, T + (B - T) * t, 0], [R, T + (B - T) * t, Math.PI]);
  }
  /* and out of the four corner cartouches, which is where the weight already is */
  seeds.push([L, T, .78], [R, T, Math.PI - .78], [R, B, Math.PI + .78], [L, B, -.78]);
  /* Open ground gets its own seeds — growth from the frame alone never reaches the middle. */
  const step = band * .78;
  for (let py = T; py < B; py += step)
    for (let px = L; px < R; px += step) {
      const jx = px + (rnd() - .5) * step * .7, jy = py + (rnd() - .5) * step * .7;
      if (!occupied(jx, jy, 34)) seeds.push([jx, jy, rnd() * 6.2832]);
    }
  for (const [sx, sy, sa] of seeds)
    for (let k = -1; k <= 1; k++)
      tendril(g, sx, sy, sa + k * .48, band * (1.1 + rnd() * .7), lw, depth, rnd);
}


/* ---------- relief ----------
   A line drawing shoved straight into bumpMap reads as a scratch. Real engraving has walls: the
   mark has to ramp from the surface down to its floor, and light has to catch that ramp. So the
   ornament is drawn as a coverage mask, blurred into a height field, and differentiated into a
   normal map. Motif-agnostic — the mask is the only thing that changes. */

/** Ornament artwork, once it exists. Null until a file is dropped in ornament/. */
let ORN = null;
/** Full-bleed Plate art — the OBNE move: a painting under a printed control panel. */
let ART = null, ART_DARK = false;

/** Paint the ornament mask: white where the metal is cut away, black where it stands. */
function ornamentMask(w, h) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
  const sx = w / TW, sy = h / TH;
  g.save(); g.scale(sx, sy);
  g.strokeStyle = '#fff'; g.fillStyle = '#fff'; g.lineCap = 'round'; g.lineJoin = 'round';
  if (useArt()) {
    /* The painting itself takes a shallow relief, so it reads as printed on metal
       that has texture rather than as a flat sticker. */
    const [ax, ay, aw, ah] = artRect();
    g.save();
    /* The mask is white where metal is cut away, so it takes the *same* inversion
       the albedo took — otherwise the relief is carved out of the background and
       the ornament stands in the trench. */
    g.filter = invertArt() ? 'grayscale(1) invert(1) contrast(1.7)' : 'grayscale(1) contrast(1.7)';
    g.drawImage(ART, ax, ay, aw, ah);
    g.restore();
  } else if (ORN) {
    /* tiled artwork */
    const tw = ORN.width * ENG.tile, th = ORN.height * ENG.tile;
    for (let y = 54; y < TH - 54; y += th)
      for (let x = 54; x < TW - 54; x += tw) g.drawImage(ORN, x, y, tw, th);
  } else if (ENG.foliate) {
    /* the procedural vine, kept behind a dial now that the Plate has a band */
    foliateBorder(g, 54, 54, TW - 108, TH - 108, ENG.band, ENG.waves, ENG.lw);
    if (ENG.waves >= 1) midOrnaments(g, 54, 54, TW - 108, TH - 108, ENG.band, ENG.lw);
    growField(g, ENG.band, ENG.lw * .92, ENG.grow, ENG.seed);
  }
  /* The reference's band, cut into the metal.
     This is the *only* place relief comes from — `faceMaps` builds a height canvas
     that nothing reads, so ornament drawn only there is ornament nobody sees. That
     is exactly how the band went missing the first time. */
  if (!useArt()) engravedLayer(g, '#fff', '#fff', { TW, TH }, 1);
  /* Parts and Print own their ground absolutely — nothing is cut inside a reserve. */
  g.fillStyle = '#000';
  PRINT_RESERVES.forEach(([x, y, rw, rh]) => g.fillRect(x, y, rw, rh));
  RESERVES.forEach(o => {
    g.beginPath();
    if (o.r) { const [x, y, rw, rh] = o.r; g.rect(x - 16, y - 16, rw + 32, rh + 32); }
    else { const [cx, cy, r] = o.c; g.arc(cx, cy, r + 16, 0, 6.2832); }
    g.fill();
  });
  g.restore();
  return c;
}

/** Blur the mask into a height field, then read its slope as a tangent-space normal map. */
function reliefMaps(w, h) {
  const mask = ornamentMask(w, h);
  const blurC = document.createElement('canvas'); blurC.width = w; blurC.height = h;
  const b = blurC.getContext('2d');
  b.filter = `blur(${ENG.bevel}px)`;
  b.drawImage(mask, 0, 0);
  b.filter = 'none';

  const src = b.getImageData(0, 0, w, h).data;
  const out = b.createImageData(w, h), o = out.data;
  const d = ENG.depth;
  for (let y = 0; y < h; y++) {
    const yUp = y > 0 ? y - 1 : 0, yDn = y < h - 1 ? y + 1 : h - 1;
    for (let x = 0; x < w; x++) {
      const xL = x > 0 ? x - 1 : 0, xR = x < w - 1 ? x + 1 : w - 1;
      /* the mask is depth, so height is its inverse; the sign flip is the cut going down */
      const gx = (src[(y * w + xR) * 4] - src[(y * w + xL) * 4]) / 255 * d;
      const gy = (src[(yDn * w + x) * 4] - src[(yUp * w + x) * 4]) / 255 * d;
      const len = Math.hypot(gx, gy, 1);
      const i = (y * w + x) * 4;
      o[i]     = (gx / len * .5 + .5) * 255;
      o[i + 1] = (-gy / len * .5 + .5) * 255;
      o[i + 2] = (1 / len * .5 + .5) * 255;
      o[i + 3] = 255;
    }
  }
  const normC = document.createElement('canvas'); normC.width = w; normC.height = h;
  normC.getContext('2d').putImageData(out, 0, 0);

  const nt = new THREE.CanvasTexture(normC); nt.anisotropy = 8; nt.needsUpdate = true;
  const bt = new THREE.CanvasTexture(blurC); bt.anisotropy = 8; bt.needsUpdate = true;
  return { normal: nt, height: bt, mask };
}

/* face maps: albedo (printed) + height (engraved) + glow (phosphorescent Print) */
/* Display candidates for the Plate's model name. Flip with ?title=unifraktur|pirata|grenze. */
const TITLES = {
  archivo:    { font: '700 66px Archivo, Helvetica, Arial',      track: '13px', y: 148 },
  unifraktur: { font: '400 82px "UnifrakturMaguntia", serif',    track: '2px',  y: 155 },
  pirata:     { font: '400 88px "Pirata One", serif',            track: '6px',  y: 157 },
  grenze:     { font: '600 80px "Grenze Gotisch", serif',        track: '9px',  y: 152 },
};
/* Engraving parameters — the knobs we tune against references. */
let ENG = { band: 118, waves: 0, lw: 5.0, hatch: 5, grow: 0, seed: 20260825, ink: .30,
            tile: 1, bevel: 10, depth: 11, scrim: .34, invert: 'auto', artZoom: 1, artX: 0, artY: 0,
            /* The foliate frame was the Plate's ornament before Fernando's reference
               gave it a band, a landscape and a split. Both at once is two ornament
               systems fighting over one Plate, so the frame is off by default and
               `__unit.setEng({ foliate: 1 })` brings it back with all its dials. */
            foliate: 0,
            /* How strongly the Print reads, 0..1. It is a dial because ink on a dark
               metal plate is exactly the kind of value that has to be set by eye. */
            print: .85,
            /* Dropped-in artwork wins over the procedural Plate when it is present.
               `__unit.setEng({ art: 0 })` ignores the file and shows the procedural
               one instead, so the two can be compared without moving files. */
            art: 1, artFit: 'auto' };

/**
 * Does the artwork already read light-on-dark?
 *
 * The invert pass exists because an engraving on parchment is dark ink on a light
 * ground and the Unit is the other way round. Artwork that is *already* dark —
 * gilt on black, like a faceplate drawn for this Plate — must not be put through
 * it, or the Plate comes out white.
 *
 * Measured rather than configured: the mean luminance of the image decides, and
 * `ENG.invert` (0 | 1 | 'auto') overrides when the guess is wrong.
 */
function artIsDark(img) {
  const c = document.createElement('canvas'); c.width = 64; c.height = 36;
  const q = c.getContext('2d');
  q.drawImage(img, 0, 0, 64, 36);
  const d = q.getImageData(0, 0, 64, 36).data;
  let sum = 0;
  for (let i = 0; i < d.length; i += 4)
    sum += (d[i] * .2126 + d[i + 1] * .7152 + d[i + 2] * .0722) / 255;
  return sum / (d.length / 4) < .38;
}

/** Should the artwork be inverted on its way onto the Plate? */
const invertArt = () => ENG.invert === 'auto' ? !ART_DARK : !!ENG.invert;

/** Is dropped-in Plate artwork both present and wanted? */
const useArt = () => !!(ART && ENG.art);

/**
 * Where the dropped-in artwork lands on the Plate texture.
 *
 * Cover-fit is right for a painting that happens to be on the Plate, and wrong for
 * artwork *drawn as* the Plate: cover crops the long edge, which slides every
 * feature inward relative to the Plate and pulls the Deck circles off the Decks
 * they were drawn for. Purpose-made faceplates are stretched to fit exactly
 * instead — a few percent on one axis is invisible in organic ornament, and
 * alignment is not.
 *
 * Chosen by aspect: close to the Plate's own ratio means it was drawn for the
 * Plate. `ENG.artFit` ('auto' | 'fill' | 'cover') overrides.
 */
function artRect() {
  const pa = TW / TH, ia = ART.width / ART.height;
  const mode = ENG.artFit === 'auto'
    ? (Math.abs(ia - pa) / pa < .15 ? 'fill' : 'cover')
    : ENG.artFit;
  if (mode === 'fill')
    return [ENG.artX, ENG.artY, TW * ENG.artZoom, TH * ENG.artZoom];
  const k = Math.max(TW / ART.width, TH / ART.height) * ENG.artZoom;
  const dw = ART.width * k, dh = ART.height * k;
  return [(TW - dw) / 2 + ENG.artX, (TH - dh) / 2 + ENG.artY, dw, dh];
}
let TITLE = TITLES[new URLSearchParams(location.search).get('title')] || TITLES.archivo;
function faceMaps() {
  const A = document.createElement('canvas'); A.width = TW; A.height = TH;
  const Hh = document.createElement('canvas'); Hh.width = TW; Hh.height = TH;
  /* E carries the Print alone, on black: phosphorescent ink, so labels stay
     legible once the room is gone. Ornament is deliberately absent from it —
     ornament may overgrow, labels never move. */
  const E = document.createElement('canvas'); E.width = TW; E.height = TH;
  const a = A.getContext('2d'), h = Hh.getContext('2d'), e = E.getContext('2d');
  e.fillStyle = '#000'; e.fillRect(0, 0, TW, TH);
  /** Every stroke of the Print goes down twice: once as ink, once as glow. */
  const ink = (fn) => { fn(a); fn(e); };
  a.fillStyle = '#26282B'; a.fillRect(0, 0, TW, TH);
  if (useArt()) {
    const [ax, ay, aw, ah] = artRect();
    a.save();
    /* An engraving on parchment is dark ink on light ground. The Unit is the other way round,
       so the plate art is inverted: pale line on a dark field, which is also how the celestial
       charts in the reference read. */
    if (invertArt()) a.filter = 'invert(1) saturate(.35) brightness(.92)';
    a.drawImage(ART, ax, ay, aw, ah);
    a.restore();
    /* A scrim keeps the Print readable over whatever the art is doing underneath.
       Artwork that is already dark needs far less of one, and a heavy scrim on a
       purpose-made faceplate just makes it muddy. */
    const scrim = ART_DARK ? ENG.scrim * .34 : ENG.scrim;
    a.fillStyle = `rgba(10,11,13,${scrim})`; a.fillRect(0, 0, TW, TH);
  }
  
  /* The Print, from the reference: a cold half and a hot half with their own
     weather. Colour only — it never touches the height field, so the landscape
     cannot compete with the engraving for the Candles' light. Laid down before
     the engraving so the cut metal reads on top of it. */
  /* The Print is drawn to its own canvas first because it is needed twice: once
     composited onto the albedo, and once as a mask for metalness. Silkscreen on a
     faceplate is ink, not metal — and on a material at metalness .85 the albedo
     stops being diffuse colour at all and becomes a reflection tint, which is why
     printing straight onto `a` produced a Plate with no visible Print. */
  const P = document.createElement('canvas'); P.width = TW; P.height = TH;
  const pg = P.getContext('2d');
  /* Dropped-in artwork replaces the procedural Print rather than sitting under it
     — otherwise Fernando's faceplate would arrive with my landscape painted over
     the top of it. */
  if (!useArt()) printLayer(pg, { TW, TH, PX, PY, strength: ENG.print });
  a.save(); a.globalAlpha = ENG.print; a.drawImage(P, 0, 0); a.restore();

  /* the ink's silhouette, for the metalness map */
  const S = document.createElement('canvas'); S.width = TW; S.height = TH;
  const sg2 = S.getContext('2d');
  sg2.drawImage(P, 0, 0);
  sg2.globalCompositeOperation = 'source-in';
  sg2.fillStyle = '#2E2E2E'; sg2.fillRect(0, 0, TW, TH);

  const M = document.createElement('canvas'); M.width = TW; M.height = TH;
  const mg = M.getContext('2d');
  mg.fillStyle = '#D9D9D9'; mg.fillRect(0, 0, TW, TH);
  mg.globalAlpha = ENG.print;
  mg.drawImage(S, 0, 0);

  h.fillStyle = '#808080'; h.fillRect(0, 0, TW, TH);

  /* engraved ornament — into both height and a darkened albedo */
  /* Both maps take the same marks; only the ink differs. */
  const plate = (g, base, ink, mass, ground, k) => {
    g.strokeStyle = ink; g.fillStyle = mass; g.lineCap = 'round'; g.lineJoin = 'round';
    /* The ground is cut into the metal, not printed onto it: strong in height, faint in colour. */
    if (ENG.hatch > 6) { g.strokeStyle = ground; hatch(g, ENG.hatch, -0.42, ENG.lw * .26); }
    g.strokeStyle = ink; g.fillStyle = mass;
    /* with Plate art present the frame steps back — OBNE panels carry no ornamental border */
    const foliate = !useArt() && ENG.foliate;
    if (foliate) growField(g, ENG.band, ENG.lw * .92, ENG.grow, ENG.seed);
    if (foliate) {
    foliateBorder(g, 54, 54, TW - 108, TH - 108, ENG.band, ENG.waves, ENG.lw * k);
    foliateBorder(g, 54 + ENG.band * 1.15, 54 + ENG.band * 1.15,
      TW - 108 - ENG.band * 2.3, TH - 108 - ENG.band * 2.3, ENG.band * .62,
      Math.round(ENG.waves * 1.4), ENG.lw * .7 * k);
    }
    if (foliate && ENG.waves >= 1) midOrnaments(g, 54, 54, TW - 108, TH - 108, ENG.band, ENG.lw * k);
    /* the reference's band: roses at the corners, thorn chains, phases, a burst
       at the centre, over a fine scale ground. Cut, so it takes the light. */
    if (!useArt()) engravedLayer(g, ink, mass, { TW, TH }, k);
    cutReserves(g, base, ENG.lw * k, useArt());
  };
  plate(h, '#808080', '#0C0C0C', '#141414', '#4A4A4A', 1);
  /* The Plate is dark, so the engraving reads light — bare metal showing through the finish,
     which is how every one of the references carries its ornament. */
  plate(a, '#26282B', `rgba(206,203,193,${ENG.ink})`, `rgba(178,175,166,${ENG.ink * .26})`,
        `rgba(206,203,193,${ENG.ink * .20})`, .85);

  /* printed silkscreen — phosphorescent, so it survives the Vigil */
  ink(c => {
    c.textAlign = 'center';
    /* The model name is off the Plate. It sat in the middle of the engraved band,
       which the artwork now owns outright — a word printed across an ornament that
       was composed without it. The Unit says what it is by being it. */
    c.letterSpacing = '0px';
    c.fillStyle = c === a ? '#9A9890' : '#6FA891';
    c.font = '500 28px "Azeret Mono", monospace';
    c.fillText('HOT CUE', TW / 2, PY(.86) + 48);
    c.fillText('CROSSFADE', TW / 2, PY(1.34) + 24);
    /**
     * The Pads say what they select.
     *
     * Six unlabelled squares are six squares — Fernando: "the buttons on the cdj
     * should have some text to be clear how the user can interact with it". Every
     * other control on this Plate is named (HOT CUE, CROSSFADE, MOON, SUN); the
     * Pads were the one row left to guess at.
     *
     * Printed above the row rather than below it: below is where CROSSFADE and the
     * fader live, and a label under a pad would have collided with them.
     */
    c.save();
    /* 14px, not 17: a Pad's pitch is .28 units — about 96px on this texture — and
       at 17px the longer titles ran straight into their neighbours. */
    c.font = '500 14px "Azeret Mono", monospace';
    c.letterSpacing = '0.5px';
    c.fillStyle = c === a ? '#8E8C84' : '#5F8F7C';
    MODULES.forEach((m, i) => {
      /* The well is 1.20x the Pad, so its top edge is at PAD.z - PAD.size*.60 —
         the label hangs off *that*, not off the Pad, or it floats in the gap. */
      c.fillText(m.pad || m.title, PX(PAD_X0 + i * PAD.pitch), PY(PAD.z - PAD.size * .60) - 6);
    });
    c.restore();

    /* MOON and SUN are gone from the bottom corners at Fernando's ask. They named
       the two Decks, which sit directly above them and are already unmistakable —
       a boxed red label under each was the loudest thing on the Plate and it was
       labelling the one pair of controls nobody was going to misread. The Pads
       above got the labels instead, because six identical squares genuinely do
       need them. */
    c.textAlign = 'left';
  });

  const at = new THREE.CanvasTexture(A); at.colorSpace = THREE.SRGBColorSpace; at.anisotropy = 8;
  const ht = new THREE.CanvasTexture(Hh); ht.anisotropy = 8;
  const et = new THREE.CanvasTexture(E); et.colorSpace = THREE.SRGBColorSpace; et.anisotropy = 8;
  const mt = new THREE.CanvasTexture(M); mt.anisotropy = 8;
  return { albedo: at, height: ht, glow: et, metal: mt };
}
/**
 * The Plate starts blank, and is engraved when the machine finishes waking.
 *
 * Coalescing the three rebuilds into one was necessary and not sufficient: the
 * Plate is on screen from the first frame either way, so a single late swap is
 * still a visible swap — the engraving simply arrived once instead of three times.
 * Holding the camera did not help either; it only meant the change happened while
 * you were watching it from further away.
 *
 * So nothing is built at load. `faceMat` opens with bare dark metal and no maps at
 * all, and the engraving is assigned when the artwork and the webfonts have both
 * landed. That is not a workaround dressed up — a faceplate whose printing appears
 * as the unit powers on is what the boot sequence is *for*, and it means the first
 * frame is honest: the Plate really has nothing on it yet.
 *
 * `regenFace` handles the rest: it sets `needsUpdate` only on the first assignment,
 * because that is the one that changes the shader's defines.
 */
let maps = null;

/** Rebuild the Plate's Print. Webfonts land after first paint, so this runs again once they do. */
/**
 * Rebuild the Plate's four maps.
 *
 * This is the most expensive call in the file: three canvases at 2048x1124 with the
 * full ornament drawn into them, a normal map derived at 1024x562, and something like
 * 30MB of texture uploaded. It costs what a small level load costs, and that is fine
 * — provided it happens when something actually changed, and not per pointer move.
 *
 * Two things here were quietly wrong:
 *
 * **It leaked.** Every call built four fresh `CanvasTexture`s and abandoned the four
 * before them. Nothing disposes a texture on garbage collection — the GPU copy is
 * freed only by an explicit `dispose()` — so a single drag across one dial leaked
 * tens of megabytes of VRAM, and the machine got progressively worse the more it was
 * tuned. That is the opposite of what a debug knob should do.
 *
 * **It recompiled the shader.** `material.needsUpdate` tells three the program itself
 * must be rebuilt. Swapping one texture for another of the same kind does not need
 * that — only going from *no* map to *a* map does, because that changes the defines.
 * It is now set on the first build and never again.
 */
function regenFace() {
  const m = faceMaps();
  const r = reliefMaps(1024, 562);

  /* free the previous upload before dropping the reference to it */
  for (const t of [faceMat.map, faceMat.emissiveMap, faceMat.normalMap, faceMat.metalnessMap]) {
    if (t) t.dispose();
  }

  const first = !faceMat.map;
  faceMat.map = m.albedo; faceMat.emissiveMap = m.glow; faceMat.normalMap = r.normal;
  faceMat.metalnessMap = m.metal;
  /* a swapped-in CanvasTexture is not uploaded until it is marked dirty itself */
  [m.albedo, m.glow, r.normal, m.metal].forEach(t => { t.needsUpdate = true; });
  /* only the first build changes the shader's defines; the rest just change pixels */
  if (first) faceMat.needsUpdate = true;
  maps = m;
}

/**
 * `regenFace()`, at a rate a hand can drag against.
 *
 * A range input fires `input` on every pointer move — sixty to a hundred and twenty
 * times a second — and each one was triggering the whole rebuild above. That is the
 * stutter: not the scene, but a full texture regeneration per pixel of slider travel.
 *
 * Leading edge, so the first move answers immediately and the dial feels live; then
 * at most one rebuild per `FACE_THROTTLE`; then a trailing one so the value you let
 * go on is the value you see. The readout beside each dial is updated by the handler
 * itself and is never throttled, so the number tracks the thumb exactly even while
 * the Plate is catching up.
 */
const FACE_THROTTLE = 150;
let faceTimer = 0, faceQueued = false;
function scheduleFace() {
  if (faceTimer) { faceQueued = true; return; }
  regenFace();
  faceTimer = setTimeout(() => {
    faceTimer = 0;
    if (faceQueued) { faceQueued = false; scheduleFace(); }
  }, FACE_THROTTLE);
}

/* jog plate texture */
/* ---------- deck faces ----------
   The two decks are the Vigil made physical, so their faces are the light itself:
   the Sun in full glory, the Moon in its phases. */

/** Alternating straight and wavy rays, a chased centre, an outer ring of beads. */
/* The volvelle line-art faces that used to live here are gone — the Decks are
   pierced tracery now and their maps come from `deck-faces.js`. */

const DECK = { sun: deckMaps('sun'), moon: deckMaps('moon') };

/* The Screen is a panel, not a picture.
   `screen/render.js` draws the signal at 320x180; `display.js` puts it behind
   pixel structure, bloom, fall-off and glass at 3x. Mipmapped, because the Plate
   shows the Screen around 590px wide — the texture is being down-sampled, and the
   grille would crawl without them. */
const display = createDisplay(screenBuffer);
const screenTex = new THREE.CanvasTexture(display.canvas);
screenTex.colorSpace = THREE.SRGBColorSpace;
screenTex.anisotropy = 8;
let curPage = 0, xfVal = 0.18, hoverWork = -1;

/* Declared up here, not down with the rest of the rite, because `drawScreen` runs
   once at module load to fill the texture and reads this. */
let rite = { phase: 'idle', work: -1, k: 0, restore: 0 };

/**
 * The Screen is drawn by `screen/render.js` — the same renderer the workbench
 * shows, at 320x180, so the two can no longer disagree about what the Screen is.
 *
 * The Unit pins the Face to Grimoire. One instrument, one aesthetic, authored the
 * whole way through: Cracktro is a different model, not a mode of this one.
 *
 * `drawScreen` is kept because a dozen callers say it and they are all still
 * right to want it — but it does nothing now. The Screen animates whether or not
 * anything changed (the raven flies, the Cast types, she breathes), so it is
 * repainted every frame in the render loop rather than on demand. What those
 * callers actually needed was the state setters, which they now call too.
 */
setScreenFace('grimoire');
function drawScreen() {}

/* ---------- geometry ---------- */
function slab(w, d, h, r, hole) {
  const s = new THREE.Shape();
  s.moveTo(-w / 2 + r, -d / 2);
  s.lineTo(w / 2 - r, -d / 2); s.quadraticCurveTo(w / 2, -d / 2, w / 2, -d / 2 + r);
  s.lineTo(w / 2, d / 2 - r); s.quadraticCurveTo(w / 2, d / 2, w / 2 - r, d / 2);
  s.lineTo(-w / 2 + r, d / 2); s.quadraticCurveTo(-w / 2, d / 2, -w / 2, d / 2 - r);
  s.lineTo(-w / 2, -d / 2 + r); s.quadraticCurveTo(-w / 2, -d / 2, -w / 2 + r, -d / 2);
  if (hole) s.holes.push(rectPath(hole));
  const g = new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: true, bevelThickness: .012, bevelSize: .012, bevelSegments: 3, curveSegments: 12 });
  g.rotateX(-Math.PI / 2); g.computeVertexNormals();
  return g;
}

/** A rectangular hole, in shape coordinates. */
function rectPath({ w, d, y = 0, x = 0 }) {
  const p = new THREE.Path();
  p.moveTo(x - w / 2, y - d / 2);
  p.lineTo(x - w / 2, y + d / 2);
  p.lineTo(x + w / 2, y + d / 2);
  p.lineTo(x + w / 2, y - d / 2);
  p.closePath();
  return p;
}

/**
 * The Plate's printed face, cut around the Screen's aperture.
 *
 * `ShapeGeometry` hands back uv equal to the raw shape coordinates, so they are
 * rewritten to the 0..1 the Plate's textures are authored against — the same
 * mapping `PlaneGeometry` would have produced, hole aside.
 */
function plateGeom(w, d, hole) {
  const s = new THREE.Shape();
  s.moveTo(-w / 2, -d / 2); s.lineTo(w / 2, -d / 2);
  s.lineTo(w / 2, d / 2); s.lineTo(-w / 2, d / 2); s.closePath();
  if (hole) s.holes.push(rectPath(hole));
  const g = new THREE.ShapeGeometry(s, 12);
  const pos = g.attributes.position;
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    uv[i * 2] = (pos.getX(i) + w / 2) / w;
    uv[i * 2 + 1] = (pos.getY(i) + d / 2) / d;
  }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.rotateX(-Math.PI / 2); g.computeVertexNormals();
  return g;
}

const unit = new THREE.Group(); scene.add(unit);

/* chassis */
/**
 * Clearcoat is gone from everything except the Plate (ADR-0019).
 *
 * It is a *second specular lobe*, evaluated per light per fragment on top of the
 * base one. Measured on the machine this runs on, switching it off across the
 * thirty-six meshes that carried it took the frame from 119ms to 40ms — it was
 * costing two thirds of the render.
 *
 * On a metal it was buying nothing to begin with: metals have no dielectric coat
 * unless they are lacquered, and every one of these already had `metalness` near 1.
 * A touch less roughness gets the same read for free.
 */
const chassisMat = new THREE.MeshStandardMaterial({
  color: 0x232528, metalness: .9, roughness: .30,
  roughnessMap: wearMap(6604, 180, .34, 2),
});
const chassis = new THREE.Mesh(slab(PLATE.w + .02, PLATE.d + .02, .34, .09, APERTURE), chassisMat);
unit.add(chassis);

/* printed face (thin decal plane just above the metal) */
const relief = reliefMaps(1024, 562);
const faceMat = new THREE.MeshPhysicalMaterial({
  /* no `map`, `emissiveMap` or `metalnessMap` yet — see `maps` above. Bare metal
     until the engraving is ready, which the boot covers. */
  color: 0x26282B,
  normalMap: relief.normal, normalScale: new THREE.Vector2(1, 1),
  emissive: 0xffffff, emissiveIntensity: 0,
  /* `metalnessMap` is what lets the Print exist: bare Plate stays metal, and
     wherever ink was laid down the surface drops to a dielectric so its colour
     reads as colour instead of as a tint on a reflection. */
  /* handled metal: the finish is not equally smooth everywhere it has been touched */
  roughnessMap: wearMap(5503, 240, .30, 2),
  /* the one surviving clearcoat in the scene: the Plate is the object, and its
     lacquer over engraved metal is the whole reason it reads as a faceplate */
  metalness: .85, roughness: .34, clearcoat: .3, clearcoatRoughness: .45,
});
const face = new THREE.Mesh(plateGeom(PLATE.w, PLATE.d, APERTURE), faceMat);
/* the only thing the phosphor rake is allowed to touch — see `rake` below */
face.layers.enable(2);
/* No mesh rotation: `plateGeom` already lays the shape onto the Plate, the way
   `slab` does. Rotating again turned the printed face upside down, pointed its
   normals at the floor and had it backface-culled — the Chassis stayed and the
   artwork vanished. */
face.position.y = FACE_Y; unit.add(face);

/* screen */
drawScreen();
/**
 * The Screen emits its image and *also* takes the room.
 *
 * It was `MeshBasicMaterial`, which is unlit by definition — the panel could not
 * catch a candle, so it read as a lit rectangle floating in the Plate rather than
 * as glass set into it. Standard instead: the picture goes in as emissive, and a
 * near-black, low-roughness base underneath picks up real specular from the three
 * Candles and the window. Turn the Vigil and the reflections go out with them,
 * because they are the same lights.
 */
const screenMat = new THREE.MeshStandardMaterial({
  /* Roughness is up from a near-mirror: a smooth panel concentrates the key light
     into one hot spot that sits on top of the copy and makes it unreadable exactly
     when the room is brightest. Rough spreads the same energy into a sheen the
     text survives. The emissive is the signal and it has to win. */
  color: 0x05070A, roughness: .38, metalness: 0,
  emissiveMap: screenTex, emissive: 0xffffff, emissiveIntensity: 1.15,
});
/**
 * The Screen, set into the Chassis.
 *
 * It used to be a plane at y = .452 with a slab under it — a tenth of a unit
 * *above* the Plate's own face at .353. Nothing was holding it and nothing was
 * around it, so it read exactly as what it was: an image laid on top of the
 * product rather than a panel built into it.
 *
 * It is a well now. The aperture is cut at Plate level, the walls drop away from
 * it, the phosphor sits at the bottom, a milled rim stands slightly proud around
 * the opening, and there is glass across the top for the room to land on. The
 * depth is small — eight hundredths — but the camera looks down from 28 degrees
 * off vertical, so a near wall and a lit far wall are both in frame, and that is
 * what tells the eye it is looking into something.
 *
 * It also had to shrink. The old bezel was 2.12 wide, reaching x = 1.06, while the
 * Decks begin at x = .88: it was overlapping both wheels by .18 and its corners
 * sat .80 from the Deck centres when they needed to clear .98.
 */
const screen = new THREE.Mesh(new THREE.PlaneGeometry(OPENING.w, OPENING.d), screenMat);
screen.rotation.x = -Math.PI / 2; screen.position.set(0, WELL_Y, SCREEN_Z); unit.add(screen);
/* The Screen is a control now, but only inside PROJECTS — see `screenRowAt`. The
   Pads still own Module navigation (ADR-0009); this selects *within* a Module. */
screen.userData.ctl = 'screen';

/* The walls of the well: a box seen from the inside, so its four faces are the
   cut edges of the Chassis. Cheaper and tighter than four separate quads. */
const wellH = FACE_Y - WELL_Y;
const well = new THREE.Mesh(
  new THREE.BoxGeometry(OPENING.w, wellH + .02, OPENING.d),
  new THREE.MeshStandardMaterial({
    color: 0x0B0C0D, metalness: .55, roughness: .62, side: THREE.BackSide,
  }));
well.position.set(0, WELL_Y + (wellH + .02) / 2 - .012, SCREEN_Z); unit.add(well);

/* The rim: a frame, not a slab — a slab under the Screen is what made it look
   stuck on. This one has a hole in it and the Screen is behind the hole. */
function frameGeom(w, d, iw, id, h) {
  const o = new THREE.Shape();
  const r = .03;
  o.moveTo(-w / 2 + r, -d / 2);
  o.lineTo(w / 2 - r, -d / 2); o.quadraticCurveTo(w / 2, -d / 2, w / 2, -d / 2 + r);
  o.lineTo(w / 2, d / 2 - r); o.quadraticCurveTo(w / 2, d / 2, w / 2 - r, d / 2);
  o.lineTo(-w / 2 + r, d / 2); o.quadraticCurveTo(-w / 2, d / 2, -w / 2, d / 2 - r);
  o.lineTo(-w / 2, -d / 2 + r); o.quadraticCurveTo(-w / 2, -d / 2, -w / 2 + r, -d / 2);
  const i = new THREE.Path();
  i.moveTo(-iw / 2, -id / 2); i.lineTo(-iw / 2, id / 2);
  i.lineTo(iw / 2, id / 2); i.lineTo(iw / 2, -id / 2); i.closePath();
  o.holes.push(i);
  const g = new THREE.ExtrudeGeometry(o, {
    depth: h, bevelEnabled: true, bevelThickness: .006, bevelSize: .006,
    bevelSegments: 2, curveSegments: 8,
  });
  g.rotateX(-Math.PI / 2); g.computeVertexNormals();
  return g;
}
const rimMat = new THREE.MeshStandardMaterial({
  color: 0x16181A, metalness: .88, roughness: .24,
});
const giltMat = new THREE.MeshStandardMaterial({
  color: 0xB08D4A, metalness: .95, roughness: .26,
});
const bezel = new THREE.Mesh(frameGeom(RIM.w, RIM.d, OPENING.w, OPENING.d, .034), rimMat);
bezel.position.set(0, FACE_Y - .002, SCREEN_Z); unit.add(bezel);

/**
 * The rim's ornament.
 *
 * A plain frame reads as a cut-out; this is a mounted instrument window, so it is
 * dressed the way the Plate around it is — a gilt inlay following the aperture, a
 * course of beading outside it, and a screw at each corner. The vocabulary is the
 * artwork's own: gilt line on dark metal, and nothing that is not a real object
 * catching a real light.
 *
 * All of it is small. At the size the Screen actually draws these are a few pixels
 * each, and their job is to make the border look *made* rather than to be noticed
 * individually.
 */
{
  /* the gilt inlay, seated in the lip of the aperture */
  const inlay = new THREE.Mesh(
    frameGeom(OPENING.w + .048, OPENING.d + .048, OPENING.w + .012, OPENING.d + .012, .012),
    giltMat);
  inlay.position.set(0, FACE_Y + .012, SCREEN_Z); unit.add(inlay);

  /* a course of beading around the outside of the rim */
  const bead = new THREE.SphereGeometry(.012, 8, 6);
  const beads = new THREE.InstancedMesh(bead, giltMat, 96);
  const m = new THREE.Matrix4();
  const hw = RIM.w / 2 - .016, hd = RIM.d / 2 - .016;
  let n = 0;
  const place = (x, z) => { m.makeTranslation(x, FACE_Y + .026, z + SCREEN_Z); beads.setMatrixAt(n++, m); };
  const alongX = Math.floor(RIM.w / .072), alongZ = Math.floor(RIM.d / .072);
  for (let i = 0; i <= alongX && n < 96; i++) {
    const x = -hw + (i / alongX) * hw * 2;
    place(x, -hd); place(x, hd);
  }
  for (let i = 1; i < alongZ && n < 96; i++) {
    const z = -hd + (i / alongZ) * hd * 2;
    place(-hw, z); place(hw, z);
  }
  beads.count = n;
  beads.instanceMatrix.needsUpdate = true;
  unit.add(beads);

  /* a screw at each corner, slotted, turned to a different angle each — nothing
     on a real instrument is ever driven home at the same clock position */
  const screwGeom = new THREE.CylinderGeometry(.026, .026, .014, 12);
  const slotGeom = new THREE.BoxGeometry(.038, .006, .008);
  const angles = [.6, -1.1, 2.2, -.35];
  [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sz], i) => {
    const x = sx * (RIM.w / 2 - .042), z = sz * (RIM.d / 2 - .042) + SCREEN_Z;
    const screw = new THREE.Mesh(screwGeom, giltMat);
    screw.position.set(x, FACE_Y + .022, z); unit.add(screw);
    const slot = new THREE.Mesh(slotGeom, rimMat);
    slot.position.set(x, FACE_Y + .030, z);
    slot.rotation.y = angles[i]; unit.add(slot);
  });
}

/**
 * The glass over the well.
 *
 * Barely there — this is what makes the recess read as covered rather than open,
 * and it is the surface the Candles actually catch. Kept at very low opacity
 * because the panel underneath has to stay readable; it contributes a highlight,
 * not a veil. `__unit.setScreen({ glass })` tunes it.
 */
const screenGlass = new THREE.Mesh(new THREE.PlaneGeometry(RIM.w - .02, RIM.d - .02),
  new THREE.MeshStandardMaterial({
    color: 0x9FB4B0, transparent: true, opacity: .018,
    /* was clearcoat 1 — a full second lobe for a pane at 5.5% opacity */
    metalness: 0, roughness: .06,
    depthWrite: false,
  }));
screenGlass.rotation.x = -Math.PI / 2;
screenGlass.position.set(0, FACE_Y + .006, SCREEN_Z); unit.add(screenGlass);
/**
 * The phosphor's spill onto the Plate — and no further.
 *
 * At 2.4 it put a teal hotspot in the middle of the Screen and washed the type off
 * it: the light was drowning the thing it exists to represent. 1.05 halved it and
 * the blob was still there, because the problem is not how bright it is but *what
 * it lands on* — it sits inside the well, so the pane of glass over the Screen
 * catches it square.
 *
 * Low enough to read as a glow on the Plate around the aperture, which is what it
 * is for, and the glass is nearly clear so it has little left to catch.
 */
/**
 * The phosphor's spill — onto the Plate, and onto nothing else.
 *
 * This sits at y=0.95, which is six tenths of a unit *above* the glass: a lamp
 * hanging over the display, shining down onto the surface it is supposed to be
 * emitted by. That is why it put a teal hotspot in the middle of the Screen and
 * washed the type off it, and why turning it down from 2.4 to 1.05 to 0.42 kept
 * the blob and only made it fainter — the problem was never the brightness, it was
 * what the light was landing on.
 *
 * Layers again (see `rake`). The glow gets its own layer and only the Plate, the
 * Chassis and the rim opt in, so it washes the metal around the aperture — which
 * is the whole effect it exists for — and cannot touch the Screen or the glass.
 * Free to be bright again now that it lands somewhere useful.
 *
 * Fourth time a light in this scene has needed confining. The rule from ADR-0020
 * holds: say out loud what stops a light at the edge of its subject, and if the
 * answer is "nothing", it is aimed at the wrong thing.
 */
const GLOW_LAYER = 3;
const glow = new THREE.PointLight(0x7FD9B0, 1.9, 3.0, 2);
glow.position.set(0, .95, SCREEN_Z);
glow.layers.set(GLOW_LAYER);
unit.add(glow);
for (const m of [face, chassis, bezel]) m.layers.enable(GLOW_LAYER);

/* ---------- the two decks ----------
   Sun raises the light, Moon puts it out. The rite performed with two hands: there is no
   Vigil knob, and the Pads carry navigation alone. */
/** Rays for the Sun, phases for the Moon — the face is the only thing that differs. */
function deck(x, kind) {
  const g = new THREE.Group(); g.position.set(x, .34, WHEEL.z); unit.add(g);
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(WHEEL.r, WHEEL.r, .1, 96, 1, false),
    new THREE.MeshStandardMaterial({ color: 0x8E8C84, metalness: 1, roughness: .18 }));
  ring.position.y = .05; ring.userData.ctl = kind; g.add(ring);
  /* Stone, not metal: the tracery is carved and the light is behind it, so a
     mirror finish would fight the thing that makes it read. The emissive map is
     the piercings alone, and `applyVigil` decides how hard they burn. */
  const plateMat = new THREE.MeshStandardMaterial({
    map: DECK[kind].albedo, bumpMap: DECK[kind].height, bumpScale: 5,
    emissiveMap: DECK[kind].emissive,
    emissive: kind === 'sun' ? 0xE08A28 : 0x8FBEDC,
    emissiveIntensity: 0,
    metalness: .18, roughness: kind === 'sun' ? .62 : .68,
  });
  const plate = new THREE.Mesh(
    new THREE.CylinderGeometry(WHEEL.r * .88, WHEEL.r * .88, .105, 128, 1), plateMat);
  plate.position.y = .056; plate.userData.ctl = kind; g.add(plate);

  /* A real light at the hub, so the wheel throws colour onto the Plate around it
     rather than only glowing in its own texture. */
  const lamp = new THREE.PointLight(kind === 'sun' ? 0xF0A24A : 0x8FBEDC, 0, 2.6, 2);
  lamp.position.set(0, .30, 0); g.add(lamp);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(WHEEL.r * .125, WHEEL.r * .125, .13, 48),
    new THREE.MeshStandardMaterial({ color: kind === 'sun' ? 0x2A2118 : 0x14161A, metalness: .9, roughness: .25 }));
  hub.position.y = .075; g.add(hub);
  /* `spin` is the platter's angular velocity in rad/s — the drag feeds it and the
     frame loop bleeds it off against friction. See the Deck block in `frame`. */
  return { group: g, ring, plate, mat: plateMat, lamp, spin: 0 };
}
const moon = deck(-WHEEL.x, 'moon');
const sun = deck(WHEEL.x, 'sun');
const deckMats = [moon.plate.material, sun.plate.material];

/* pads */
/**
 * The Pads.
 *
 * They were a flat black tile with a lit strip lying on the Plate beside them —
 * two objects that happened to be adjacent, rather than one control. A performance
 * pad is a soft square sitting in a milled well, with the light coming from *under*
 * its edge rather than from a separate lamp next to it.
 *
 * So: a well cut into the Plate, a slightly domed pad standing proud of it, and a
 * ring of light in the gap between the two. The ring is emissive, so the lit Pad
 * actually throws a little colour onto the metal around it instead of merely being
 * a red rectangle.
 *
 * The colour stays the Plate's own ember (`0xC4281C` is the red the Print uses),
 * not the cyan-and-magenta a real controller would wear. The point is a lit
 * control, not a nightclub.
 */
/**
 * The Pad's face is drawn, not tinted.
 *
 * `color` is white-ish so the map reads true — it is a multiplier now, and the
 * hover works by moving it rather than by replacing a flat fill. The selected Pad
 * swaps to the bone map outright: on this Plate the difference between "on" and
 * "off" has to survive being seen at 40px across a dark room, and a change of
 * material does that where a change of brightness does not.
 */
const PADMAP = padMaps(PAD.size);
const padMat = () => new THREE.MeshStandardMaterial({
  color: 0xC6C6C6, map: PADMAP.dark,
  emissiveMap: PADMAP.lamp, emissive: new THREE.Color(0xC4601C), emissiveIntensity: .55,
  metalness: .16, roughness: .74,
});
/* the well the Pad sits in — darker, and rougher, so the two never read as one part */
const padWellMat = new THREE.MeshStandardMaterial({
  color: 0x08090A, metalness: .3, roughness: .9,
});
const lampMats = [];
const padMeshes = [];
for (let i = 0; i < 6; i++) {
  const px = PAD_X0 + i * PAD.pitch;

  /* the milled well */
  const well = new THREE.Mesh(slab(PAD.size * 1.20, PAD.size * 1.20, .045, .026), padWellMat);
  well.position.set(px, .332, PAD.z); unit.add(well);

  /* the light in the gap, under the Pad's edge */
  const lm = new THREE.MeshStandardMaterial({
    color: 0x1A0906,
    emissive: new THREE.Color(i === 0 ? 0xC4281C : 0x160603),
    emissiveIntensity: i === 0 ? 2.6 : 0.25,
    roughness: .5, metalness: 0,
  });
  lampMats.push(lm);
  const ring = new THREE.Mesh(slab(PAD.size * 1.10, PAD.size * 1.10, .030, .022), lm);
  ring.position.set(px, .352, PAD.z); unit.add(ring);

  /* the pad itself, standing proud of the ring so the light escapes round it */
  const p = new THREE.Mesh(slab(PAD.size, PAD.size, .085, .034), padMat());
  p.position.set(px, .366, PAD.z);
  p.userData.ctl = 'pad'; p.userData.i = i;
  /* Rest height, and where it travels to. A pad that does not move when pressed
     is a picture of a pad — the throw is small because the real ones are. */
  p.userData.restY = .366;
  p.userData.pressY = .366 - .030;
  unit.add(p); padMeshes.push(p);
}

/**
 * Pads answer to the hand.
 *
 * `padPress[i]` is 0 at rest and 1 fully depressed; `padHover` is which one the
 * pointer is over. Both are eased in the frame loop rather than set outright, so a
 * press has a fall and a return instead of snapping between two positions — a
 * sprung key, not a toggle.
 */
const padPress = new Array(6).fill(0);
let padHover = -1;
/**
 * Pads: hover is instant, light is eased.
 *
 * The hover was never actually delayed — it was invisible. `offsetHSL` by
 * .16 x .30 is five hundredths of lightness on a colour that is already almost
 * black, so the pad did change under the pointer and nobody could tell. Reading
 * that as lag is the right instinct: a response you cannot see and a response that
 * has not happened yet look identical.
 *
 * So hover is applied **outright**, at a magnitude you can see, and the two things
 * that genuinely want easing get it: the press travel, and the ember. The lamp
 * fading up and down is what Fernando asked for and it is also just true of a real
 * one — an LED behind a diffuser has a rise and a fall, it does not switch.
 */
const EASE_PRESS = 0.00004;   // per second; smaller is faster
const EASE_LAMP = 0.004;

function updatePads(dt) {
  padMeshes.forEach((p, i) => {
    /* press: eased, frame-rate independent */
    const kp = 1 - Math.pow(EASE_PRESS, dt);
    p.userData.k = (p.userData.k ?? 0) + (padPress[i] - (p.userData.k ?? 0)) * kp;
    const e = p.userData.k;
    p.position.y = p.userData.restY + (p.userData.pressY - p.userData.restY) * e;

    /* hover: immediate, and big enough to read on a near-black pad */
    const hot = padHover === i;
    /* the selected Pad is bone, the rest are graphite — a material change, not a
       brightness one, so the row can be read at a glance */
    const face = i === curPage ? PADMAP.lit : PADMAP.dark;
    if (p.material.map !== face) p.material.map = face;
    p.material.color.setHex(hot ? 0xFFFFFF : 0xC6C6C6);
    if (e > 0.001) p.material.color.offsetHSL(0, 0, -e * .06);
    /* the LED in the head: low on the bone Pad, where its recess is already
       painted hot, and brightest under the pointer */
    p.material.emissiveIntensity = i === curPage ? .18 : (hot ? 1.5 : .55);

    /* the ember, eased in and out */
    const m = lampMats[i];
    const want = i === curPage ? 2.6 : (hot ? 0.85 : 0.25);
    const kl = 1 - Math.pow(EASE_LAMP, dt);
    m.emissiveIntensity += (want - m.emissiveIntensity) * kl;
    /* colour follows the same curve, so a warming Pad passes through the ember
       rather than jumping to it */
    const f = Math.min(1, Math.max(0, (m.emissiveIntensity - 0.25) / 2.35));
    m.emissive.setRGB(.086 + f * .68, .024 + f * .134, .012 + f * .098);
  });
}

/* crossfader */
const slot = new THREE.Mesh(slab(FADER.len, .14, .04, .015),
  new THREE.MeshStandardMaterial({
    color: 0xFFFFFF, map: faderSlot(FADER.len, .14), metalness: .5, roughness: .6,
  }));
slot.position.set(0, .335, FADER.z); unit.add(slot);
const cap = new THREE.Mesh(slab(.13, .26, .11, .03),
  new THREE.MeshStandardMaterial({
    color: 0xFFFFFF, map: faderCap(.13, .26), metalness: .35, roughness: .42,
  }));
/** Where the cap sits for a given crossfade, 0..1. */
const capX = v => -FADER.travel / 2 + v * FADER.travel;
cap.position.set(capX(.18), .35, FADER.z); cap.userData.ctl = 'fader'; unit.add(cap);
/**
 * The light behind the cap.
 *
 * In the reference the two beads either side of the cap are burning and the rest
 * are cold — the lamp is *under* the cap and only the beads it is passing catch
 * it. Modelling that as six switchable lamps would be six materials to drive; one
 * short emissive strip that travels with the cap gives the same read, because what
 * the eye is actually seeing is a glow that moves with the handle.
 */
const capGlow = new THREE.Mesh(slab(.34, .055, .010, .027),
  new THREE.MeshStandardMaterial({
    color: 0x140901, emissive: new THREE.Color(0xD8801E), emissiveIntensity: 2.4,
    roughness: .55, metalness: 0,
  }));
capGlow.position.set(capX(.18), .346, FADER.z); unit.add(capGlow);

/* ---------- the altar ----------
   Baroque, not satanic: polished veined marble, an embroidered cloth, turned gilt
   candlesticks. Tenebrism is the model — one warm source, deep shadow, and the
   candles put out one at a time until only the Screen is left burning. */

/** Dark walnut: long grain drifting along the board, with cathedral figure and a few knots. */
function woodTexture(bump) {
  const c = document.createElement('canvas'); c.width = 2048; c.height = 1024;
  const g = c.getContext('2d');
  const rnd = rng(90210);
  g.fillStyle = bump ? '#808080' : '#20150F'; g.fillRect(0, 0, 2048, 1024);

  /* the grain: near-horizontal lines that wander, bunching into figure */
  for (let i = 0; i < 1700; i++) {
    const y0 = rnd() * 1024;
    const dark = rnd();
    g.strokeStyle = bump
      ? `rgba(${dark < .5 ? 40 : 200},${dark < .5 ? 40 : 200},${dark < .5 ? 40 : 200},${.05 + rnd() * .18})`
      : `rgba(${dark < .55 ? 18 : 74},${dark < .55 ? 11 : 48},${dark < .55 ? 7 : 30},${.08 + rnd() * .24})`;
    g.lineWidth = .5 + rnd() * 1.5;
    g.beginPath();
    let y = y0;
    g.moveTo(0, y);
    for (let x = 0; x <= 2048; x += 48) {
      y += (rnd() - .5) * 5 + Math.sin(x * .004 + y0 * .02) * 1.6;
      g.lineTo(x, y);
    }
    g.stroke();
  }
  /* cathedral figure — nested arches where the saw crossed the growth rings */
  for (let k = 0; k < 5; k++) {
    const cx = rnd() * 2048, cy = 200 + rnd() * 600;
    for (let r = 12; r < 260; r += 5 + rnd() * 7) {
      g.strokeStyle = bump ? `rgba(60,60,60,${.05 + rnd() * .08})` : `rgba(26,15,9,${.05 + rnd() * .12})`;
      g.lineWidth = 1 + rnd() * 2;
      g.beginPath();
      g.ellipse(cx, cy, r * (2.6 + rnd() * .5), r, 0, Math.PI * .12, Math.PI * .88);
      g.stroke();
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 1.4);
  if (!bump) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/** Ivory linen with a scalloped, pierced border — the cloth the instrument rests on. */
function clothTexture() {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 640;
  const g = c.getContext('2d');
  const M = 54, SC = 26;
  g.fillStyle = '#b8b0a0';
  g.beginPath(); g.roundRect(M, M, 1024 - M * 2, 640 - M * 2, 10); g.fill();
  /* scalloped edge */
  g.globalCompositeOperation = 'destination-out';
  for (let x = M; x <= 1024 - M; x += SC) {
    g.beginPath(); g.arc(x, M, SC * .5, 0, 6.2832); g.fill();
    g.beginPath(); g.arc(x, 640 - M, SC * .5, 0, 6.2832); g.fill();
  }
  for (let y = M; y <= 640 - M; y += SC) {
    g.beginPath(); g.arc(M, y, SC * .5, 0, 6.2832); g.fill();
    g.beginPath(); g.arc(1024 - M, y, SC * .5, 0, 6.2832); g.fill();
  }
  /* pierced eyelets just inside the hem */
  for (let x = M + SC; x < 1024 - M; x += SC) {
    g.beginPath(); g.arc(x, M + 30, 5, 0, 6.2832); g.fill();
    g.beginPath(); g.arc(x, 640 - M - 30, 5, 0, 6.2832); g.fill();
  }
  g.globalCompositeOperation = 'source-over';
  /* drawn-thread lines and a red embroidered rule */
  g.strokeStyle = 'rgba(140,128,104,.55)'; g.lineWidth = 2;
  g.strokeRect(M + 46, M + 46, 1024 - (M + 46) * 2, 640 - (M + 46) * 2);
  g.strokeStyle = 'rgba(150,44,32,.8)'; g.lineWidth = 3;
  g.strokeRect(M + 58, M + 58, 1024 - (M + 58) * 2, 640 - (M + 58) * 2);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

const altar = new THREE.Group(); scene.add(altar);

/**
 * The desk, with an edge.
 *
 * It was a `BoxGeometry` — a razor arris all the way round, which is the single
 * loudest tell that something was made in code rather than in a workshop. Nothing
 * has a perfectly sharp edge; every real table top is eased, and that eased edge is
 * where the light actually catches.
 *
 * `slab()` gives it a rounded profile for nothing, since it is the same extrusion
 * the Chassis and the Pads already use. This is the "bevels are free" line from
 * `docs/realism-budget.md`, spent on the largest surface in the frame.
 */
const mensa = new THREE.Mesh(slab(14.6, 8.6, .62, .07),
  new THREE.MeshStandardMaterial({
    map: woodTexture(false), bumpMap: woodTexture(true), bumpScale: .8,
    roughnessMap: wearMap(7711, 220, .38, 3),
    /* The Altar top is one of the two largest surfaces on screen, so its clearcoat
       was one of the two most expensive. Roughness alone still reads as waxed.
       Darkened from 0xA08B78: that was a *pale* wood, and at exposure 1.75 the
       largest surface in the frame was blowing toward white and dragging the whole
       image with it. The reference's table is dark walnut. */
    color: 0x554438, metalness: 0, roughness: .40,
  }));
/* `slab` extrudes from y=0 upward, so the top lands at 0 where the Box's centre did */
mensa.position.y = -.62; altar.add(mensa);

/**
 * The cloth, darkened — and flagged.
 *
 * At 0x9a927f this was a *pale* linen, and at exposure 1.75 it became the brightest
 * large surface in the frame: a washed-out rectangle sitting where the reference has
 * bare dark wood, dragging the whole picture up with it.
 *
 * **Contradicts `CONTEXT.md`**, which defines the Altar as "a slab of black veined
 * marble, an embroidered linen cloth, and the Candles". The cloth is canon and it is
 * not being removed here. Two things are worth Fernando's decision rather than mine:
 * the glossary says *marble* where the mensa has been wood for some time, and the
 * reference room — a studio since ADR-0017's furnishing pass, not a chapel — puts the
 * instrument straight onto the timber. The cloth may be a survival of the chapel this
 * room stopped being.
 */
const cloth = new THREE.Mesh(new THREE.PlaneGeometry(6.9, 4.2),
  new THREE.MeshStandardMaterial({
    map: clothTexture(), transparent: true, roughness: .95, metalness: 0, color: 0x4C4436,
  }));
cloth.rotation.x = -Math.PI / 2; cloth.position.y = .004; altar.add(cloth);

/** A turned baluster candlestick, gilt, with a live flame and its own light. */
const GILT = new THREE.MeshStandardMaterial({
  /* metalness 1 — a clearcoat on a solid metal is a second specular lobe for a
     coat that is not physically there. Roughness carries the gilt on its own. */
  color: 0xC9A03C, metalness: 1, roughness: .22,
});
function candlestick(x, z, height) {
  const g = new THREE.Group(); g.position.set(x, 0, z); altar.add(g);
  const prof = [
    [.00, .00], [.38, .00], [.40, .04], [.30, .07], [.26, .10],
    [.13, .14], [.11, .22], [.15, .28], [.13, .34], [.09, .40],
    [.14, .46], [.19, .52], [.15, .58], [.10, .64], [.09, .78],
    [.16, .84], [.22, .88], [.20, .92], [.12, .94], [.11, .98],
  ].map(([r, y]) => new THREE.Vector2(r * 1.0, y * height));
  const stick = new THREE.Mesh(new THREE.LatheGeometry(prof, 48), GILT);
  g.add(stick);
  /**
   * The wax was `transmission: .35`, and transmission is not a material property in
   * three — it is a **whole extra render of the scene** into a transmission buffer,
   * every frame, so that the surface has something to refract. Three candle stubs a
   * few pixels wide were charging the scene a second pass: 110ms down to 65ms with
   * it off, forty per cent of the frame for translucency nobody can see at this size.
   */
  const wax = new THREE.Mesh(new THREE.CylinderGeometry(.085, .095, .52, 24),
    new THREE.MeshStandardMaterial({
      color: 0xF3E7CE, roughness: .55, metalness: 0,
    }));
  wax.position.y = height * .98 + .26; g.add(wax);
  const flame = new THREE.Mesh(new THREE.SphereGeometry(.075, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0xFFD08A, transparent: true, blending: THREE.AdditiveBlending }));
  flame.scale.set(1, 2.1, 1);
  flame.position.y = height * .98 + .60; g.add(flame);
  const halo = new THREE.Mesh(new THREE.SphereGeometry(.20, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0xFF9A3C, transparent: true, opacity: .3, blending: THREE.AdditiveBlending }));
  halo.position.copy(flame.position); g.add(halo);
  /* 5.5 while three falloff-free directionals were doing the work; the fit against
     the reference puts it here now that this light is actually carrying the Altar.
     Lower number, far larger share — it went from 2% of the Altar to 54%. */
  const light = new THREE.PointLight(0xFFB162, 3.6, 15, 2);
  light.position.copy(flame.position); g.add(light);
  return { group: g, flame, halo, light, base: { flame: 1, light: 3.6, halo: .3 } };
}

/* A triangle, as the rite's hearse is a triangle. Ordered as they go out. */
/* Close enough that their flames stay in frame — an extinguished candle nobody
   sees go out is not a rite. */
const CANDLES = [
  candlestick(0, -2.05, 1.05),      // first to die
  candlestick(3.42, 1.35, 1.05),
  candlestick(-3.42, 1.35, 1.05),   // last to die
];

/* ---------- the room ----------
   The Unit stands on a table in a chapel-like room. Tilt the camera up and the far
   wall and its window come into view; at full Vigil, when the Candles are out, the
   moon through that window is the only thing left besides the Screen. */

const room = new THREE.Group(); scene.add(room);
/**
 * The room is a *corner*, not a backdrop.
 *
 * It was 30 wide, 11.5 deep and **12 tall**, with the side walls parked at x=+-15
 * where no camera angle in `CAM_LIMITS` can reach them. Everything therefore hung
 * on one flat plane at one distance, evenly spaced and mirrored, with eight units
 * of empty dark wall above it — which is exactly why it read as a stage flat and
 * not as a space.
 *
 * What makes the reference read as a room is that the **left wall is in frame and
 * receding**, and that the furniture stands against the sides and *overlaps* what
 * is behind it. Occlusion and convergence are what the eye takes for depth; a
 * chamfer on a card is still a card.
 *
 * So: the ceiling comes down to head height, the side walls come in to where they
 * are actually visible, and the room closes overhead.
 */
const FLOOR_Y = -2.95, WALL_Z = -11.5, WALL_H = 7.4;
const SIDE_X = 11.6;                       // side walls, now inside the view
const CEIL_Y = FLOOR_Y + WALL_H;
const DEPTH = 21;                          // how far the room runs toward the camera
/* a lancet opening: jambs, springing, apex */
/* lowered with the ceiling — the head used to spring at 3.55 and finish at 6.10,
   which in a 7.4-tall wall would leave almost no wall above it */
const WIN = { x: 2.30, y0: -0.10, spring: 2.20, y1: 3.95 };

/**
 * The wall: dark painted plaster with gilt celestial drawing on it.
 *
 * It was carved oak — fielded panels under blind Gothic arcading — which was right
 * for a chapel and wrong for the room in Fernando's reference. That room is
 * *painted*: a deep near-black green, flat, with sparse gilt suns and stars drawn
 * straight onto it. The ornament stops being architecture and becomes something
 * somebody put there, which is the difference between a nave and a studio.
 *
 * Sparse on purpose, and it has to stay sparse: this tiles across the whole wall
 * behind the acoustic panels, and a busy wall would compete with the Plate.
 */
function panelTexture(bump) {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 1024;
  const g = c.getContext('2d');
  const rnd = rng(5150);
  g.fillStyle = bump ? '#6a6a6a' : '#1B2523'; g.fillRect(0, 0, 1024, 1024);

  /* plaster tooth — fine, irregular, almost subliminal */
  for (let i = 0; i < 2600; i++) {
    g.fillStyle = bump
      ? `rgba(${120 + rnd() * 60},${120 + rnd() * 60},${120 + rnd() * 60},${rnd() * .2})`
      : `rgba(${28 + rnd() * 22},${38 + rnd() * 22},${36 + rnd() * 20},${rnd() * .5})`;
    g.fillRect(rnd() * 1024, rnd() * 1024, 1 + rnd() * 3, 1 + rnd() * 3);
  }

  const gilt = bump ? '#c4c4c4' : 'rgba(176,141,74,.44)';
  g.strokeStyle = gilt; g.fillStyle = gilt;

  /* one large rayed sun, high on the run */
  const sx = 250, sy = 300;
  g.lineWidth = bump ? 5 : 3;
  g.beginPath(); g.arc(sx, sy, 66, 0, 6.2832); g.stroke();
  for (let i = 0; i < 32; i++) {
    const a = (i / 32) * 6.2832;
    const r1 = i % 2 ? 168 : 112;
    g.beginPath();
    g.moveTo(sx + Math.cos(a) * 78, sy + Math.sin(a) * 78);
    g.lineTo(sx + Math.cos(a) * r1, sy + Math.sin(a) * r1);
    g.stroke();
  }

  /* a crescent further along, and stars scattered between them */
  g.beginPath();
  g.arc(760, 690, 74, 0, 6.2832);
  g.arc(796, 660, 66, 0, 6.2832, true);
  g.fill('evenodd');

  for (let i = 0; i < 16; i++) {
    const x = rnd() * 1024, y = rnd() * 1024, r = 9 + rnd() * 16;
    g.beginPath();
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * 6.2832 - Math.PI / 2;
      const rr = k % 2 ? r * .34 : r;
      const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr;
      k ? g.lineTo(px, py) : g.moveTo(px, py);
    }
    g.closePath(); g.fill();
  }

  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 1.1);
  if (!bump) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8; return t;
}

function stoneTexture(bump) {
  const c = document.createElement('canvas'); c.width = c.height = 1024;
  const g = c.getContext('2d');
  const rnd = rng(1717);
  g.fillStyle = bump ? '#8c8c8c' : '#3B3733'; g.fillRect(0, 0, 1024, 1024);
  const H = 128;
  for (let row = 0, y = 0; y < 1024; row++, y += H) {
    const off = (row % 2) * 96;
    for (let x = -off; x < 1024; x += 200) {
      const w = 190 + rnd() * 16, h = H - 8;
      g.fillStyle = bump
        ? `rgba(${170 + rnd() * 50},${170 + rnd() * 50},${170 + rnd() * 50},1)`
        : `rgba(${44 + rnd() * 22},${32 + rnd() * 18},${24 + rnd() * 14},1)`;
      g.fillRect(x + 4, y + 4, w, h);
      for (let i = 0; i < 26; i++) {
        const px = x + 8 + rnd() * (w - 16), py = y + 8 + rnd() * (h - 16), pr = 1 + rnd() * 7;
        g.fillStyle = bump ? `rgba(120,120,120,${rnd() * .5})` : `rgba(22,15,10,${rnd() * .3})`;
        g.beginPath(); g.arc(px, py, pr, 0, 6.2832); g.fill();
      }
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(5, 5);
  if (!bump) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8; return t;
}

/** A worn medallion rug, muted red, to break up the boards. */
function rugTexture() {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 700;
  const g = c.getContext('2d');
  const rnd = rng(2468);
  g.fillStyle = '#5A2321'; g.fillRect(0, 0, 1024, 700);
  g.strokeStyle = '#8A5A3C'; g.lineWidth = 6;
  g.strokeRect(34, 34, 956, 632); g.strokeRect(66, 66, 892, 568);
  g.fillStyle = '#3E1A1A';
  g.beginPath(); g.ellipse(512, 350, 300, 200, 0, 0, 6.2832); g.fill();
  g.strokeStyle = '#B98A55'; g.lineWidth = 4;
  for (const k of [1, .74, .48]) { g.beginPath(); g.ellipse(512, 350, 300 * k, 200 * k, 0, 0, 6.2832); g.stroke(); }
  for (let i = 0; i < 16; i++) {
    const a = i / 16 * 6.2832;
    g.beginPath();
    g.moveTo(512 + Math.cos(a) * 120, 350 + Math.sin(a) * 80);
    g.lineTo(512 + Math.cos(a) * 292, 350 + Math.sin(a) * 194);
    g.stroke();
  }
  for (let i = 0; i < 1200; i++) {
    g.fillStyle = `rgba(0,0,0,${rnd() * .12})`;
    g.fillRect(rnd() * 1024, rnd() * 700, 3 + rnd() * 9, 2 + rnd() * 5);
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

const stoneMat = new THREE.MeshStandardMaterial({
  map: stoneTexture(false), bumpMap: stoneTexture(true), bumpScale: .5,
  color: 0x6E6862, roughness: .95, metalness: 0,
});
const panelMat = new THREE.MeshStandardMaterial({
  map: panelTexture(false), bumpMap: panelTexture(true), bumpScale: .5,
  roughnessMap: wearMap(4402, 200, .26, 4),
  /* near-white tint: the colour lives in the map now, and tinting paint brown was
     what made the old wall read as timber */
  color: 0xC8C6C2, roughness: .93, metalness: 0,
});

const floor = new THREE.Mesh(new THREE.PlaneGeometry(SIDE_X * 2, DEPTH),
  new THREE.MeshStandardMaterial({
    map: woodTexture(false), bumpMap: woodTexture(true), bumpScale: .4,
    roughnessMap: wearMap(3301, 300, .42, 6),
    /* the other large surface — see the Altar top above */
    color: 0x6B584A, roughness: .56, metalness: 0,
  }));
floor.rotation.x = -Math.PI / 2; floor.position.set(0, FLOOR_Y, WALL_Z + DEPTH / 2); room.add(floor);

const rug = new THREE.Mesh(new THREE.PlaneGeometry(19, 13),
  new THREE.MeshStandardMaterial({ map: rugTexture(), roughness: .98, metalness: 0, color: 0x9a8f86 }));
rug.rotation.x = -Math.PI / 2; rug.position.set(0, FLOOR_Y + .01, 1.5); room.add(rug);

/* far wall, extruded around a lancet opening */
const wallShape = new THREE.Shape();
wallShape.moveTo(-SIDE_X, FLOOR_Y); wallShape.lineTo(SIDE_X, FLOOR_Y);
wallShape.lineTo(SIDE_X, CEIL_Y); wallShape.lineTo(-SIDE_X, CEIL_Y); wallShape.closePath();
const hole = new THREE.Path();
hole.moveTo(-WIN.x, WIN.y0);
hole.lineTo(-WIN.x, WIN.spring);
hole.quadraticCurveTo(-WIN.x, WIN.y1, 0, WIN.y1);
hole.quadraticCurveTo(WIN.x, WIN.y1, WIN.x, WIN.spring);
hole.lineTo(WIN.x, WIN.y0);
hole.closePath();
wallShape.holes.push(hole);
const wall = new THREE.Mesh(new THREE.ExtrudeGeometry(wallShape, { depth: .7, bevelEnabled: false }), panelMat);
wall.position.z = WALL_Z; room.add(wall);

/**
 * Side walls, in frame now rather than hiding at +-15.
 *
 * These are the depth. The left one runs away from the camera and its perspective
 * is the strongest convergence cue in the picture — the reference leans on exactly
 * that, and carries its big gilt sun on the left wall for the same reason.
 */
for (const sx of [-SIDE_X, SIDE_X]) {
  const w = new THREE.Mesh(new THREE.BoxGeometry(.6, WALL_H, DEPTH), panelMat);
  w.position.set(sx, FLOOR_Y + WALL_H / 2, WALL_Z + DEPTH / 2); room.add(w);
}

/* A ceiling. Not to be looked at — to stop the room leaking into the void
   overhead, and to give the far corners somewhere to be dark against. */
const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(SIDE_X * 2, DEPTH),
  new THREE.MeshStandardMaterial({ color: 0x1A1613, roughness: .96, metalness: 0 }));
ceiling.rotation.x = Math.PI / 2;
ceiling.position.set(0, CEIL_Y, WALL_Z + DEPTH / 2); room.add(ceiling);

/* the sky beyond: day and night, crossfaded by the Vigil */
function skyTexture(night) {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 1024;
  const g = c.getContext('2d');
  const rnd = rng(night ? 31337 : 8123);
  const sky = g.createLinearGradient(0, 0, 0, 1024);
  if (night) { sky.addColorStop(0, '#0d1626'); sky.addColorStop(.6, '#141d2c'); sky.addColorStop(1, '#1b2130'); }
  /* The day sky is drawn unlit, so whatever hex goes here is very nearly what the
     pixel becomes. At the old values the window was a blown white rectangle and the
     brightest thing in the room by a wide margin — which is not what a window does,
     even at noon, seen from inside a dark room. */
  else { sky.addColorStop(0, '#5A6E82'); sky.addColorStop(.55, '#77807E'); sky.addColorStop(1, '#847F70'); }
  g.fillStyle = sky; g.fillRect(0, 0, 1024, 1024);
  if (night) {
    for (let i = 0; i < 700; i++) {
      const x = rnd() * 1024, y = rnd() * 1024, r = rnd() * 1.5 + .3;
      g.fillStyle = `rgba(214,224,240,${.15 + rnd() * .6})`;
      g.beginPath(); g.arc(x, y, r, 0, 6.2832); g.fill();
    }
  }
  const mx = 468, my = 648, mr = night ? 72 : 62;
  const halo = g.createRadialGradient(mx, my, mr * .6, mx, my, mr * (night ? 5 : 7));
  halo.addColorStop(0, night ? 'rgba(196,214,240,.42)' : 'rgba(255,244,214,.75)');
  halo.addColorStop(1, night ? 'rgba(196,214,240,0)' : 'rgba(255,244,214,0)');
  g.fillStyle = halo; g.beginPath(); g.arc(mx, my, mr * (night ? 5 : 7), 0, 6.2832); g.fill();
  g.fillStyle = night ? '#DCE6F4' : '#FFF8E0';
  g.beginPath(); g.arc(mx, my, mr, 0, 6.2832); g.fill();
  if (night) {
    for (let i = 0; i < 9; i++) {
      const a = rnd() * 6.2832, d = rnd() * mr * .7, r = mr * (.08 + rnd() * .16);
      g.fillStyle = `rgba(178,192,214,${.35 + rnd() * .3})`;
      g.beginPath(); g.arc(mx + Math.cos(a) * d, my + Math.sin(a) * d, r, 0, 6.2832); g.fill();
    }
  }
  /* bare branches across the opening, as in the reference */
  const branch = (x, y, a, len, w, d) => {
    if (d <= 0 || len < 6) return;
    const x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len;
    g.strokeStyle = night ? 'rgba(10,14,22,.85)' : 'rgba(38,34,28,.7)';
    g.lineWidth = w; g.beginPath(); g.moveTo(x, y); g.lineTo(x2, y2); g.stroke();
    branch(x2, y2, a - .38 - rnd() * .3, len * .74, w * .66, d - 1);
    branch(x2, y2, a + .38 + rnd() * .3, len * .70, w * .62, d - 1);
  };
  for (let i = 0; i < 4; i++) branch(120 + i * 260, 1024, -1.5 + (rnd() - .5) * .5, 150, 11, 6);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const daySky = new THREE.Mesh(new THREE.PlaneGeometry(26, 22),
  new THREE.MeshBasicMaterial({ map: skyTexture(false) }));
daySky.position.set(0, FLOOR_Y + 7.5, WALL_Z - 5); room.add(daySky);
const nightSky = new THREE.Mesh(new THREE.PlaneGeometry(26, 22),
  new THREE.MeshBasicMaterial({ map: skyTexture(true), transparent: true, opacity: 0 }));
nightSky.position.set(0, FLOOR_Y + 7.5, WALL_Z - 4.9); room.add(nightSky);

/* leaded diamond glazing across the opening */
function leadTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 512;
  const g = c.getContext('2d');
  g.clearRect(0, 0, 512, 512);
  g.strokeStyle = 'rgba(24,22,20,.92)'; g.lineWidth = 3;
  const S = 46;
  for (let i = -12; i < 24; i++) {
    g.beginPath(); g.moveTo(i * S, 0); g.lineTo(i * S + 512, 512); g.stroke();
    g.beginPath(); g.moveTo(i * S, 512); g.lineTo(i * S + 512, 0); g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 4);
  return t;
}
const glassShape = new THREE.Shape();
glassShape.moveTo(-WIN.x, WIN.y0); glassShape.lineTo(-WIN.x, WIN.spring);
glassShape.quadraticCurveTo(-WIN.x, WIN.y1, 0, WIN.y1);
glassShape.quadraticCurveTo(WIN.x, WIN.y1, WIN.x, WIN.spring);
glassShape.lineTo(WIN.x, WIN.y0); glassShape.closePath();
const glass = new THREE.Mesh(new THREE.ShapeGeometry(glassShape),
  new THREE.MeshBasicMaterial({ map: leadTexture(), transparent: true }));
glass.position.z = WALL_Z + .05; room.add(glass);

/* stone tracery: jambs, transom, mullion */
const stoneTrim = new THREE.MeshStandardMaterial({ color: 0x6B655C, roughness: .92 });
const bar = (w, h, x, y) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, .40), stoneTrim);
  m.position.set(x, y, WALL_Z + .06); room.add(m); return m;
};
bar(.22, WIN.spring - WIN.y0 + 3.0, 0, (WIN.y0 + WIN.spring) / 2 + .6);
bar(WIN.x * 2, .16, 0, WIN.y0 + (WIN.spring - WIN.y0) * .55);
bar(WIN.x * 2 + .7, .34, 0, WIN.y0 - .16);

/* red velvet curtains either side, hung from a gilt rail */
function velvetTexture() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 512;
  const g = c.getContext('2d');
  const rnd = rng(9001);
  g.fillStyle = '#4A0F12'; g.fillRect(0, 0, 256, 512);
  for (let x = 0; x < 256; x += 4) {
    const k = Math.sin(x * .18) * .5 + .5;
    g.fillStyle = `rgba(${140 + k * 70},${28 + k * 26},${28 + k * 22},${.25 + k * .5})`;
    g.fillRect(x, 0, 4, 512);
  }
  for (let i = 0; i < 900; i++) {
    g.fillStyle = `rgba(0,0,0,${rnd() * .16})`;
    g.fillRect(rnd() * 256, rnd() * 512, 2, 3 + rnd() * 10);
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const velvet = new THREE.MeshStandardMaterial({
  map: velvetTexture(), color: 0x8C4A46, roughness: .96, metalness: 0, side: THREE.DoubleSide,
});
for (const sx of [-1, 1]) {
  /* 8.0 tall hanging from a 12-unit wall put its hem below the floorboards here */
  const curtain = new THREE.Mesh(new THREE.CylinderGeometry(.62, .78, 6.5, 20, 1, true, 0, Math.PI), velvet);
  curtain.position.set(sx * (WIN.x + .95), WIN.y1 - 3.25, WALL_Z + .55);
  curtain.rotation.y = sx > 0 ? -Math.PI / 2 : Math.PI / 2;
  room.add(curtain);
}
const rail = new THREE.Mesh(new THREE.CylinderGeometry(.075, .075, WIN.x * 2 + 3.4, 16), GILT);
rail.rotation.z = Math.PI / 2; rail.position.set(0, WIN.y1 + .25, WALL_Z + .55); room.add(rail);

/* window light — the decks decide whether it is the sun or the moon out there */
/**
 * The window's light, and nothing else's.
 *
 * `skyLight` was a falloff-free directional at **3.2** — the largest light in the
 * scene, declared six hundred lines from the rig and missed by the whole of
 * ADR-0018's analysis. Together with `wallWash` it carried 38-74% of every surface
 * in the room, which is why the back wall lit evenly and all six acoustic panels
 * read at the same brightness however far they sat from a lamp.
 *
 * That even wall is the thing that made the room a flat. In the reference the
 * panels fall off *across each group* — the one nearest the lamp is bright, the far
 * one is nearly gone — and that gradient is most of what says "these are objects in
 * a space" rather than "this is a printed backdrop".
 *
 * So it is moonlight now: cold, weak, and honestly directional, because a moon is.
 * The room is lit by its lamps and its Candles, and between them it is dark.
 */
/* Strong and warm at Sun, weak and cold at full Vigil — see `applyVigil`. Cutting
   it to a flat 0.45 fixed the night and put out the day with it. */
const skyLight = new THREE.DirectionalLight(0xFFE0B8, 3.0);
skyLight.position.set(1.1, 4.6, WALL_Z); skyLight.target.position.set(0, 0, 1);
room.add(skyLight, skyLight.target);
/* `wallWash` was the other half of the flat. Kept at a whisper so the far corners
   are dark rather than absent — a corner at pure zero reads as a hole, not a room. */
const wallWash = new THREE.DirectionalLight(0xC8B79A, .07);
wallWash.position.set(0, 5, 6); wallWash.target.position.set(0, 2, WALL_Z);
room.add(wallWash, wallWash.target);

/* ---------- the summoning ----------
   A Work is an image and the Screen is a 590px inset — it cannot carry one. So a
   Work leaves the Unit and stands on a plinth, and the Screen becomes its plaque.
   The plinth is empty until the visitor calls something to it. */
const summoning = createSummoning(scene, WORKS, { floorY: FLOOR_Y });

/* ---------- the portrait ----------
   Lyra, gilt-framed on the wall left of the window, with her plaque under her.
   She is a fixture, not a display: she is hanging there before the visitor
   touches anything and she is still there at full Vigil. */
/* Sized for the old 12-unit wall, she topped out at y=4.65 — above the new
   ceiling at 4.45, so her frame was growing through it. */
const portrait = createPortrait(scene, {
  x: -5.35, y: FLOOR_Y + 3.75, wallFace: WALL_Z + 0.7,
  height: 2.9, name: 'Lyra', line: 'KEEPER OF THE VIGIL',
});

/**
 * Her picture light.
 *
 * The middle of the far wall is the one region no other source reaches: the
 * Candles are eight units away across the Altar and the globe lamps are out at the
 * ends of the room. In the reference that whole stretch is lit by exactly one
 * thing — a faint teal wash behind the framed painting — and without an equivalent
 * the monitors and the wall between the panel groups fall to nothing.
 *
 * It sits in front of the frame rather than behind it. Behind, at the intensity
 * this needs, it burns a white hole in the plaster a foot away; in front it washes
 * her, the wall around her and the near monitor, which is what the reference does.
 * Teal because it is the Screen's phosphor — the same light, one wall over.
 */
/* Was 11 at distance 9, and in a room this size that is not a picture light, it is
   a green floodlight — at high Vigil it washed the entire right-hand wall teal.
   The reference's glow behind its painting is small, local and barely there. */
const pictureLight = new THREE.PointLight(0x8FD9C4, 2.6, 4.6, 2);
pictureLight.position.set(-4.9, FLOOR_Y + 5.4, WALL_Z + 1.9);
scene.add(pictureLight);
const PIC0 = pictureLight.intensity;

/* ---------- the studio ----------
   Acoustic panels, monitors, the credenza of records, the pedal cabinet and the
   two globe lamps. The Altar, the Candles, the window and the Portrait are not
   touched — this furnishes the room around them. */
const decor = createRoomDecor(room, { floorY: FLOOR_Y, wallFace: WALL_Z + 0.7, sideX: SIDE_X });

/* canvas type is drawn once at load, before the webfonts land */
document.fonts?.ready?.then(() => summoning.refresh());

/* turned legs, so the table reads as furniture once the camera comes up */
const legProfile = [
  [.00, .00], [.30, .00], [.30, .10], [.17, .16], [.14, .34],
  [.22, .48], [.24, .60], [.16, .74], [.13, 1.0], [.20, 1.14],
  [.22, 1.30], [.15, 1.46], [.14, 1.90], [.24, 2.00], [.26, 2.16],
];
const legMat = new THREE.MeshStandardMaterial({
  map: woodTexture(false), color: 0x8A7563, roughness: .55, metalness: 0,
});
for (const lx of [-6.2, 6.2]) for (const lz of [-3.5, 3.5]) {
  const h = (-.62 - FLOOR_Y) / 2.16;
  const leg = new THREE.Mesh(
    new THREE.LatheGeometry(legProfile.map(([r, y]) => new THREE.Vector2(r, y * h)), 32), legMat);
  leg.position.set(lx, FLOOR_Y, lz); room.add(leg);
}

/* ---------- what else is on the Altar ----------
   A book, a pen, two cards, a wand, headphones and a cable port. The Altar is the
   largest surface in frame and it carried three candlesticks and nothing else,
   which is most of why it read as a product shot. Geometry only — no new lights,
   nothing physical: clutter is the one thing this scene can afford (ADR-0019). */
const altarProps = createAltarProps(altar);

/* ---------- vigil: the lights go out one at a time (ADR-0006) ----------
   The three Candles *are* the three stages now. They used to be decoration on top
   of a three-point rig that did the actual dimming — rim on the first ramp, fill on
   the second, key on the third — which meant the rite was performed by three lights
   the visitor cannot see, standing in for three he can. Now that the Candles carry
   the Altar (ADR-0018) the staging is theirs, and the key rides the last ramp with
   the last of them because that is the Candle it stands for.
   At full vigil only the Screen's phosphor and the moon are left, and the phosphor
   rakes across the Plate at a grazing angle so the Nightwork engraved there reads. */
let vigil = +(new URLSearchParams(location.search).get('vigil') || 0) / 100;

/**
 * Grazing phosphor spill — for the Plate, and *only* the Plate.
 *
 * This is a DirectionalLight because it wants parallel rays raking across the
 * engraving at a shallow angle, which is what makes the Nightwork read at full
 * Vigil. But a directional has no position and no falloff, so it was raking the
 * whole room: as the Vigil rose the walls, the floor and the ceiling all turned
 * phosphor green, because nothing told it to stop at the edge of the Unit.
 *
 * Third time this exact shape of bug has appeared — `skyLight` flooding the back
 * wall, the key flooding the floor, now this. A directional cannot be aimed *at*
 * something; it can only be pointed in a direction and it hits everything facing
 * that way.
 *
 * Layers are the fix that keeps the grazing character. A light only illuminates
 * objects whose layers it shares, so putting both this and the Plate on layer 2
 * confines it exactly, with no cone to tune and no falloff to fake. The Plate stays
 * on layer 0 as well, so the camera still draws it.
 */
const RAKE_LAYER = 2;
const rake = new THREE.DirectionalLight(0x7FD9B0, 0);
rake.position.set(-3.4, .34, -2.2); unit.add(rake);
rake.layers.set(RAKE_LAYER);

const KEY0 = key.intensity, MOON0 = moonlight.intensity;
const ENV0 = scene.environmentIntensity ?? 1;

/* The ramps live in `light.js` now — the Screen reads the same three pairs to
   decide how far into the night it has travelled, and two files agreeing by hand
   about the same numbers is how they drift. */

function applyVigil() {
  dim(key, KEY0 * candle(vigil, ...RAMPS[2]));
  /* The moon does not go out. It is the only thing in here that is not a flame,
     and the room ending on it is the point of the rite. */
  dim(moonlight, MOON0);

  /* Her picture light is a fixture lamp, so it dies early with the other two —
     Lyra herself does not, she goes on rising on her own emissive. Her surviving
     the wall around her going black is the whole reason she is a fixture. */
  {
    const k = Math.max(0, Math.min(1, 1 - vigil / .55));
    dim(pictureLight, PIC0 * k * k * (3 - 2 * k));
  }

  CANDLES.forEach((c, i) => {
    const k = candle(vigil, ...RAMPS[i]);
    c.live = k;
    /* the flame shortens before it goes, the way a wick drowns in its own wax */
    c.flame.scale.set(.55 + k * .45, .7 + k * 1.4, .55 + k * .45);
    c.flame.material.opacity = Math.min(1, k * 1.6);
    c.halo.material.opacity = c.base.halo * k;
    dim(c.light, c.base.light * k);
    c.flame.visible = c.halo.visible = k > .001;
  });
  /**
   * Linear to zero, not to a floor.
   *
   * This used to be `ENV0 * (1 - vigil * .88)`, which bottoms out at 12% of full
   * — and with `ENV0` now carrying the daylight, that residue left the night at
   * mean 53 against the reference's 21. Tenebrism does not survive a floor under
   * the ambient: the whole effect is that there is *nothing* between the pools.
   */
  scene.environmentIntensity = ENV0 * (1 - vigil);

  /* The wheels show whose hand is winning. Light comes through their tracery: the
     Sun's holds while the room is lit and is out by the time the last Candle is;
     the Moon's is dark at first light and takes over as the room goes. They cross
     near the middle of the rite, where neither has won. */
  {
    /**
     * The gain dropped from 1.5 to 0.55, and not because it looked too bright.
     *
     * When the tracery's polarity was corrected — bars are stone, the field around
     * them is glass — the **lit area roughly quadrupled**. It used to be a course
     * of piercings on a solid disc; it is now the whole field minus eight petals.
     * The same intensity over four times the surface is four times the light, and
     * the Sun came out as a flat cream disc with the amber washed out of it.
     *
     * So this is the same wheel emitting the same amount of light, redistributed.
     * The number is a consequence of the geometry change, not a taste adjustment.
     */
    const glow = deckGlow(vigil);
    sun.mat.emissiveIntensity = glow.sun * .55;
    moon.mat.emissiveIntensity = glow.moon * .55;
    dim(sun.lamp, glow.sun * 1.1);
    dim(moon.lamp, glow.moon * 1.1);
  }

  /* the studio's own lamps go out first, before the Candles */
  decor.update(vigil);

  /* the decks turn the day. Sun up, and it is afternoon outside; Moon up, and it is night. */
  nightSky.material.opacity = vigil;
  /**
   * The window, across the whole Vigil.
   *
   * This is the one light that legitimately *is* a flat directional, because that
   * is what a sun or a moon through a window is. The mistake in ADR-0020 was
   * treating its flatness as the fault and cutting it everywhere; the fault was
   * only ever at **night**, where 3.2 of daylight-coloured wash was drowning the
   * Candles and the lamps and making every acoustic panel read alike.
   *
   * By day a room lit through a window really is broadly and evenly lit, and
   * fighting that just makes a dark room with a sun outside it. So it travels:
   * 2.6 and warm at Sun, 0.5 and cold at Moon, and the tenebrism arrives with the
   * night rather than being on all the time.
   */
  dim(skyLight, 3.0 * (1 - vigil) + 0.50 * vigil);
  skyLight.color.setRGB(1 - vigil * .34, .878 - vigil * .13, .722 + vigil * .14);
  skyLight.color.setRGB(1 - vigil * .38, .894 - vigil * .18, .737 + vigil * .11);
  dim(wallWash, .07 * (1 - vigil) + .04 * vigil);
  wallWash.color.setRGB(.784 - vigil * .22, .718 - vigil * .08, .604 + vigil * .16);

  /* the screen takes over the room */
  glow.intensity = 2.4 + vigil * 5.2;
  glow.distance = 3.4 + vigil * 2.6;
  dim(rake, Math.max(0, (vigil - .42) / .58) * 3.1);

  /* the phosphorescent Print charges under light and burns without it */
  faceMat.emissiveIntensity = Math.pow(vigil, 1.4) * 1.15;

  /* Nightwork: the engraving deepens as the light gets meaner */
  faceMat.normalScale.set(1 + vigil * 1.6, 1 + vigil * 1.6);
  deckMats.forEach(m => { m.bumpScale = 4 + vigil * 5; });
}

/* ---------- interaction: everything on the unit is clickable ---------- */
const ray = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const el = renderer.domElement;
/* The Unit does not move. It is a heavy object on a table, not a thing that follows a cursor. */
let active = null, px = 0, py = 0, startVal = 0, jogAcc = 0, jogLast = 0;

function pick(e) {
  const r = el.getBoundingClientRect();
  ndc.x = ((e.clientX - r.left) / r.width) * 2 - 1;
  ndc.y = -((e.clientY - r.top) / r.height) * 2 + 1;
  ray.setFromCamera(ndc, camera);
  const hits = ray.intersectObjects(unit.children, true);
  for (const h of hits) { if (h.object.userData.ctl) return h.object; }
  return null;
}
/**
 * Which Work row a pointer event is over, or -1.
 *
 * The Screen's texture is the renderer's 320x180 buffer, so a hit on the plane
 * carries a uv that maps straight onto it: u across, and 1-v down, because
 * `CanvasTexture` uploads with flipY so the buffer's first row is the plane's top
 * edge. `workRowAt` answers from the boxes the same pass drew, so a row can never
 * be clickable somewhere it is not painted.
 */
function screenRowAt(e) {
  if (MODULES[curPage].id !== 'project-001') return -1;
  const r = el.getBoundingClientRect();
  ndc.x = ((e.clientX - r.left) / r.width) * 2 - 1;
  ndc.y = -((e.clientY - r.top) / r.height) * 2 + 1;
  ray.setFromCamera(ndc, camera);
  const hit = ray.intersectObject(screen, false)[0];
  if (!hit || !hit.uv) return -1;
  return workRowAt(hit.uv.x * SCREEN_W, (1 - hit.uv.y) * SCREEN_H);
}

function setPage(n) {
  curPage = (n + MODULES.length) % MODULES.length;
  /* The lamps are eased toward their target in `updatePads`, so nothing is set
     here — a Pad that snapped on would undo the fade the moment the page changed. */
  setScreenModule(curPage);
  drawScreen();
}
function setVigil(v) {
  vigil = Math.max(0, Math.min(1, v));
  applyVigil();
  /* the Screen holds the Vigil too — it is what the reaction watches for a Deck
     being turned, and what the palette travels on */
  setScreenVigil(vigil);
  vslider.value = String(Math.round(vigil * 100));
  document.getElementById('vv').textContent = String(Math.round(vigil * 100)).padStart(2, '0');
}
function deckAngle(e, g) {
  const r = el.getBoundingClientRect();
  const p = new THREE.Vector3().setFromMatrixPosition(g.matrixWorld).project(camera);
  const cx = r.left + (p.x * .5 + .5) * r.width, cy = r.top + (-p.y * .5 + .5) * r.height;
  return Math.atan2(e.clientY - cy, e.clientX - cx);
}

el.addEventListener('pointerdown', e => {
  const hit = pick(e);
  px = e.clientX; py = e.clientY;
  if (hit) {
    const c = hit.userData.ctl;
    if (c === 'pad') { padPress[hit.userData.i] = 1; setPage(hit.userData.i); return; }
    if (c === 'screen') {
      /* while a Work is up, the Screen is the way back — anywhere on it */
      if (rite.phase === 'rising' || rite.phase === 'held') { banish(); return; }
      if (focus.active) { focus.exit(); return; }
      const row = screenRowAt(e);
      /* The plinth is still there and still works — `summonWork(row)` — but this
         is the move being tried instead: fly the camera in until the Screen fills
         the frame, then hand the Work to real HTML (ADR-0017 reversal, prototyped
         in `focus.js`). */
      if (row >= 0) { focus.enter(WORKS[row] || WORKS[0]); return; }
      /* not on a row: fall through, so the Screen is still somewhere you can grab
         the view from the way every other dead area of the Unit is */
    }
    if (c === 'fader') { active = 'fader'; startVal = xfVal; el.setPointerCapture(e.pointerId); setPage(1); return; }
    if (c === 'sun' || c === 'moon') {
      /* Light is what dispels her work. Touching the Sun while something is on the
         plinth sends it back and hands the Vigil to the visitor, rather than
         fighting the rite for control of the same number. */
      if (c === 'sun' && rite.phase !== 'idle') { banish(); return; }
      active = c; jogLast = deckAngle(e, c === 'sun' ? sun.group : moon.group);
      el.setPointerCapture(e.pointerId); return;
    }
  }
  /* nothing on the Unit: the drag moves the view instead */
  if (!ORBIT) { intro.skip(); return; }
  active = 'cam'; el.setPointerCapture(e.pointerId); el.style.cursor = 'grabbing';
});

el.addEventListener('pointermove', e => {
  if (!active) {
    const hit = pick(e);
    const ctl = hit && hit.userData.ctl;
    /* A row only lamps while it is actually callable — not while a Work is
       already up, when the whole Screen means "send it back" instead. */
    padHover = ctl === 'pad' ? hit.userData.i : -1;
    const row = (ctl === 'screen' && rite.phase === 'idle') ? screenRowAt(e) : -1;
    if (row !== hoverWork) { hoverWork = row; setHoverWork(row); drawScreen(); }
    el.style.cursor = ctl === 'pad' ? 'pointer'
      : ctl === 'fader' ? 'ew-resize'
      : ctl === 'screen' && (row >= 0 || rite.phase !== 'idle') ? 'pointer'
      : ORBIT ? 'grab' : 'default';
    return;
  }
  if (active === 'cam') {
    const cl = (v, [lo, hi]) => Math.max(lo, Math.min(hi, v));
    CAM.tilt = cl(CAM.tilt + (e.clientY - py) * .16, CAM_LIMITS.tilt);
    CAM.yaw  = cl(CAM.yaw  - (e.clientX - px) * .16, CAM_LIMITS.yaw);
    px = e.clientX; py = e.clientY;
    placeCamera();
    const t = document.getElementById('tilt'), d = document.getElementById('tiltv');
    if (t) { t.value = String(Math.round(CAM.tilt)); d.textContent = Math.round(CAM.tilt) + '\u00B0'; }
    return;
  }
  if (active === 'fader') {
    xfVal = Math.max(0, Math.min(1, startVal + (e.clientX - px) / 300));
    cap.position.x = capX(xfVal);
    capGlow.position.x = cap.position.x;
    setScreenCrossfade(xfVal);
    drawScreen();
  } else if (active === 'sun' || active === 'moon') {
    const d0 = active === 'sun' ? sun : moon;
    const a = deckAngle(e, d0.group); let d = a - jogLast;
    if (d > Math.PI) d -= 6.2832; if (d < -Math.PI) d += 6.2832;
    jogLast = a; d0.group.rotation.y -= d;
    /* Remember how fast the hand is moving, so letting go can hand the wheel its
       own momentum. Blended rather than replaced: one jittery sample should not
       decide how far a heavy platter coasts. */
    d0.spin = d0.spin * .55 + (-d / Math.max(dtNow, 1 / 120)) * .45;
    /* Sun brings the light up, Moon puts it out — whichever way you turn it. */
    setVigil(vigil + (active === 'moon' ? 1 : -1) * Math.abs(d) * .34);
  }
});

el.addEventListener('pointerup', () => {
  active = null; el.style.cursor = 'default';
  /* every Pad comes back up — release anywhere, not only over the one pressed */
  padPress.fill(0);
});

/* keyboard + screen-reader layer */
document.querySelectorAll('[data-act]').forEach(b => {
  b.addEventListener('click', () => {
    setPage(+b.dataset.act);
  });
});
/* Workbench: run the opening again without a reload. */
document.getElementById('replay')?.addEventListener('click', () => intro.replay());

const vslider = document.getElementById('vigil');
vslider.addEventListener('input', () => setVigil(+vslider.value / 100));

/* engraving dials — tune the Plate live against references */
const dial = (id, read, fmt) => {
  const el = document.getElementById(id), out = document.getElementById(id + 'v');
  /* the readout is instant; the Plate is throttled */
  el.addEventListener('input', () => {
    const v = read(+el.value);
    out.textContent = fmt(v);
    ENG = { ...ENG, [id]: v };
    scheduleFace();
  });
  /* `change` lands on release — the last value always gets a full, unthrottled build */
  el.addEventListener('change', () => {
    faceQueued = false;
    if (faceTimer) { clearTimeout(faceTimer); faceTimer = 0; }
    regenFace();
  });
};
dial('band', v => v, v => String(v));
dial('hatch', v => v, v => String(v));
dial('waves', v => v, v => String(v));
dial('lw', v => v / 10, v => v.toFixed(1));
dial('grow', v => v, v => String(v));
dial('ink', v => v / 100, v => v.toFixed(2));
dial('bevel', v => v, v => String(v));
dial('depth', v => v, v => String(v));
dial('tile', v => v / 100, v => v.toFixed(2));
dial('scrim', v => v / 100, v => v.toFixed(2));
dial('invert', v => v, v => v ? 'on' : 'off');
dial('artZoom', v => v / 100, v => v.toFixed(2));
dial('seed', v => 20260800 + v, v => String(v - 20260800));

addEventListener('resize', () => {
  camera.aspect = W() / H(); camera.updateProjectionMatrix(); renderer.setSize(W(), H());
  /* the composer owns its own render targets and does not learn about this
     otherwise — a resized canvas over stale targets is how post ends up stretched */
  post.setSize(W(), H());
});
/* the canvas is sized before layout settles often enough to be worth a second pass */
requestAnimationFrame(() => {
  camera.aspect = W() / H(); camera.updateProjectionMatrix(); renderer.setSize(W(), H());
});

const camDial = (id, key, fmt) => {
  const el = document.getElementById(id), out = document.getElementById(id + 'v');
  el.addEventListener('input', () => {
    CAM[key] = +el.value / (key === 'dist' ? 10 : 1);
    out.textContent = fmt(CAM[key]); placeCamera();
  });
};
camDial('tilt', 'tilt', v => v + '\u00B0');
camDial('dist', 'dist', v => v.toFixed(1));
/**
 * Load the Plate's assets, then rebuild it **once**.
 *
 * It used to rebuild on every arrival: once procedurally at module load, again
 * when the faceplate artwork landed, again when the webfonts did. Each rebuild
 * swaps four textures totalling about thirty megabytes, and each swap is visible —
 * which is the flicker Fernando saw, the Plate arriving in three versions.
 *
 * They are coalesced now. The assets resolve into `plateReady`; whoever finishes
 * last triggers a single rebuild, and `intro.js` holds the opening pose until that
 * has happened, so the one remaining swap lands while the camera is still far off
 * and the Screen has not booted.
 */
let plateResolve
const plateReady = new Promise(r => { plateResolve = r })

const artLoaded = (async () => {
  for (const f of ['ornament/plate.png', 'ornament/plate.jpg', 'ornament/plate.svg']) {
    try {
      const res = await fetch(f, { method: 'HEAD' });
      if (!res.ok) continue;
      const img = new Image();
      await new Promise((ok, no) => { img.onload = ok; img.onerror = no; img.src = f; });
      ART = img; ART_DARK = artIsDark(img);
      console.log('[tenebrae] plate art loaded:', f, img.width + 'x' + img.height);
      return;
    } catch { /* not there yet */ }
  }
  for (const f of ['ornament/pattern.svg', 'ornament/pattern.png']) {
    try {
      const res = await fetch(f, { method: 'HEAD' });
      if (!res.ok) continue;
      const img = new Image();
      await new Promise((ok, no) => { img.onload = ok; img.onerror = no; img.src = f; });
      ORN = img;
      console.log('[tenebrae] ornament loaded:', f, img.width + 'x' + img.height);
      return;
    } catch { /* not there yet */ }
  }
  console.log('[tenebrae] no ornament artwork; using the procedural vine');
})();

setVigil(vigil);

/* The Print is drawn before webfonts arrive, and document.fonts.ready does not load a face that
   nothing on the page has used yet — an unused family silently falls back. Ask for each one. */
const fontsLoaded = Promise.all([
  ...Object.values(TITLES).map(t => document.fonts.load(t.font.replace(/^(\S+\s+\S+)/, '$1'))),
  document.fonts.load('500 30px "Azeret Mono"'),
  document.fonts.load('700 30px Archivo'),
  /* the Screen's own faces — it is drawn by screen/render.js now, and an unused
     family silently falls back rather than erroring */
  document.fonts.load('8px Silkscreen'),
  document.fonts.load('13px VT323'),
  document.fonts.load('17px UnifrakturMaguntia'),
]);

/* Whoever finishes last rebuilds the Plate — once, with everything it needs. */
Promise.all([artLoaded, fontsLoaded]).then(() => {
  regenFace();
  /* the holding tint would otherwise multiply the albedo it was standing in for */
  faceMat.color.setHex(0xFFFFFF);
  plateResolve();
});
/* and a backstop, so a missing font or a dead fetch cannot hold the opening for ever */
setTimeout(() => plateResolve(), 6000);

/** Workbench hook: lets a browser session drive and verify the Unit without guessing pixels. */
/**
 * Decide, once, what casts and what receives.
 *
 * Set by traversal rather than by hand on forty meshes, because the rule is
 * simple and hand-setting it is how one object ends up floating for a week:
 *
 *   - anything unlit (`MeshBasicMaterial`) is light, not matter — flames, halos,
 *     the sky beyond the window. It neither casts nor receives.
 *   - anything transparent still *receives* — the cloth under the Unit is the most
 *     important shadow in the scene — but does not cast, or every pane of glass
 *     would throw a solid black rectangle.
 *   - anything drawn without depth is an overlay, and takes no part at all.
 *   - back-faced shells (the Screen's well) do not cast; their geometry is inside
 *     out and the shadow comes out inside out with it.
 */
function groundShadows(root) {
  root.traverse(o => {
    if (!(o.isMesh || o.isInstancedMesh)) return;
    const m = o.material;
    if (!m) return;
    const unlit = m.isMeshBasicMaterial === true;
    const overlay = m.depthWrite === false;
    const inverted = m.side === THREE.BackSide;
    o.receiveShadow = !unlit && !overlay;
    o.castShadow = !unlit && !overlay && !inverted && m.transparent !== true;
  });
}
/**
 * Receiving is cheap. Casting is a second draw call, every frame.
 *
 * `groundShadows` decides *eligibility* — what is solid enough to throw a shadow at
 * all — and running it over the whole scene set `castShadow` on the 70x70 floor, both
 * walls, the rug, forty-four records, six acoustic panels and the furniture. A shadow
 * map is a full render from the light's point of view, so that made **the entire scene
 * draw twice per frame**, for shadows almost none of which are ever visible: the key
 * is one spot over the Altar, and the comment on it says in as many words that it is
 * framed tightly on the Unit.
 *
 * So eligibility is not the same as worth it. Only the objects the visitor can watch
 * a shadow fall from actually cast: the Unit and what stands on the Altar with it,
 * plus the Plinth and whatever is summoned onto it. The room still *receives* — the
 * cloth taking the Unit's shadow is the most important shadow in the scene and it is
 * untouched — it simply stops paying to throw shadows nobody sees.
 */
function castOnly(...roots) {
  scene.traverse(o => { if (o.isMesh || o.isInstancedMesh) o.castShadow = false; });
  for (const r of roots) {
    if (!r) continue;
    r.traverse(o => {
      if (!(o.isMesh || o.isInstancedMesh) || !o.material) return;
      const m = o.material;
      if (m.isMeshBasicMaterial || m.depthWrite === false || m.side === THREE.BackSide) return;
      if (m.transparent === true) return;
      o.castShadow = true;
    });
  }
}
groundShadows(scene);
castOnly(unit, altar, summoning.group);

window.__unit = {
  /** rAF is throttled in a background tab, so never trust the last frame's matrices. */
  render() { camera.updateMatrixWorld(true); scene.updateMatrixWorld(true); post.render(performance.now() / 1000); },
  screenOf(o) {
    camera.updateMatrixWorld(true); scene.updateMatrixWorld(true);
    const v = new THREE.Vector3().setFromMatrixPosition(o.matrixWorld).project(camera);
    return [(v.x * .5 + .5) * W(), (-v.y * .5 + .5) * H()];
  },
  pads: () => padMeshes,
  /** Swap the Plate's display face and redraw the Print. */
  setTitle(t) { TITLE = t; regenFace(); },
  /** Tune the engraving: band width, wave count along the top run, line weight.
      `print` (0..1) is how strongly the Print reads; `foliate` brings the old vine back. */
  setEng(e) { ENG = { ...ENG, ...e }; regenFace(); return ENG; },
  /** Tune the panel: scan, comb, bloom, vignette, sheen — all 0..1. */
  setDisplay(d) { return display.set(d); },
  /**
   * Shadow cost, for machines that are struggling.
   *
   *   2  crisp — 2048 map, soft filter
   *   1  cheap — 1024 map, hard filter
   *   0  off
   */
  /**
   * Quality, by what it actually costs.
   *
   * Shadows were the only thing here, and they were never the expensive part. The
   * two numbers that decide whether this runs are the **pixel ratio** — 2.0 is four
   * times the fragments of 1.0 — and the **Screen's frame rate**, which drags a
   * software blur and a 2MB texture upload behind it every time it ticks.
   *
   *   2  crisp   — ratio 1.5, Screen at 24, soft shadows
   *   1  cheap   — ratio 1.0, Screen at 15, hard shadows
   *   0  survive — ratio 0.75, Screen at 10, no shadows
   */
  setQuality(level) {
    PIXEL_RATIO = level >= 2 ? Math.min(devicePixelRatio, 1.5) : level >= 1 ? 1 : 0.75;
    renderer.setPixelRatio(PIXEL_RATIO);
    renderer.setSize(W(), H());
    SCREEN_STEP = level >= 2 ? 1 / 24 : level >= 1 ? 1 / 15 : 1 / 10;
    /* occlusion and bloom are full-screen passes; at `survive` they are the first
       thing to go, because the scene still reads without them and does not without
       a frame rate */
    post.set({ on: level >= 1 });
    if (level <= 0) { renderer.shadowMap.enabled = false; }
    else {
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = level >= 2 ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap;
      key.shadow.mapSize.set(level >= 2 ? 1024 : 512, level >= 2 ? 1024 : 512);
      if (key.shadow.map) { key.shadow.map.dispose(); key.shadow.map = null; }
    }
    scene.traverse(o => { if (o.isMesh && o.material) o.material.needsUpdate = true; });
    return { level, pixelRatio: PIXEL_RATIO, screenFps: Math.round(1 / SCREEN_STEP) };
  },

  /**
   * Measure what this scene actually costs, and what each part of it costs.
   *
   * `__unit.perf()` — full sweep, about 25s. `__unit.perf(1)` — quick, about 10s.
   *
   * Nobody working on this can see the scene, so "it feels heavy" has to become a
   * number before it can become a fix. This runs the same scene under a series of
   * configurations, each one with a single suspect removed, and prices the
   * difference. A row's `saved` column is what switching that thing off gives back.
   *
   * Two clocks, because one of them lies:
   *
   *   - `interval` is wall time between frames. It is what the visitor feels, but
   *     with vsync it is quantised to the refresh rate, so a scene with 40% headroom
   *     and one with 5% both read 16.7ms. Use it to see *whether* frames are being
   *     dropped.
   *   - `work` is CPU spent inside the frame callback. It is not quantised and it is
   *     what tells you *which* thing to cut. GPU time lands here only where the
   *     driver blocks, so treat it as a floor, not a total.
   *
   * The first samples after a config change are discarded — a changed pixel ratio
   * reallocates buffers and a changed shadow map recompiles, and those one-off
   * costs are not what is being measured.
   */
  async perf(quick = 0) {
    const FRAMES = quick ? 45 : 110, WARMUP = quick ? 12 : 25;
    const run = () => new Promise(res => {
      const iv = [], wk = []; let n = 0;
      perfSample = (interval, work) => {
        if (++n <= WARMUP) return;
        iv.push(interval); wk.push(work);
        if (iv.length >= FRAMES) { perfSample = null; res({ iv, wk }); }
      };
    });
    const med = a => { const b = [...a].sort((x, y) => x - y); return b[b.length >> 1]; };
    const p95 = a => { const b = [...a].sort((x, y) => x - y); return b[Math.floor(b.length * .95)]; };

    /* saved and restored around the whole sweep */
    const S0 = {
      ratio: PIXEL_RATIO, step: SCREEN_STEP, screen: SCREEN_ON,
      shadows: renderer.shadowMap.enabled, decor: decor.group.visible,
      room: room.visible, env: scene.environmentIntensity,
    };
    const setRatio = r => { PIXEL_RATIO = r; renderer.setPixelRatio(r); renderer.setSize(W(), H()); };
    const restore = () => {
      setRatio(S0.ratio); SCREEN_STEP = S0.step; SCREEN_ON = S0.screen;
      renderer.shadowMap.enabled = S0.shadows; decor.group.visible = S0.decor;
      room.visible = S0.room; scene.environmentIntensity = S0.env;
    };

    const cases = [
      ['baseline (as shipped)',   () => {}],
      ['Screen off entirely',     () => { SCREEN_ON = false; }],
      ['Screen back at 60fps',    () => { SCREEN_STEP = 1 / 60; }],
      ['shadows off',             () => { renderer.shadowMap.enabled = false; }],
      ['pixel ratio 1.0',         () => setRatio(1)],
      ['pixel ratio 0.75',        () => setRatio(.75)],
      ['furnishing hidden',       () => { decor.group.visible = false; }],
      ['whole room hidden',       () => { room.visible = false; }],
      ['environment off',         () => { scene.environmentIntensity = 0; }],
      ['all of the above cheap',  () => { SCREEN_STEP = 1 / 10; renderer.shadowMap.enabled = false; setRatio(.75); }],
    ];

    const rows = [];
    for (const [name, apply] of cases) {
      restore(); apply();
      const { iv, wk } = await run();
      /* read the scene's size *now*, under this config — reading it after the sweep
         would report whatever the last and cheapest case happened to leave behind */
      rows.push({
        name, iv: med(iv), ivp95: p95(iv), wk: med(wk),
        calls: renderer.info.render.calls, tris: renderer.info.render.triangles,
      });
    }
    restore();

    const base = rows[0];
    const pad = (v, n) => String(v).padStart(n);
    const out = [
      '',
      'TENEBRAE PERF  ' + innerWidth + 'x' + innerHeight + ' @ ratio ' + S0.ratio +
        '  ·  ' + rows[0].tris.toLocaleString() + ' tris' +
        '  ·  ' + rows[0].calls + ' draw calls' +
        '  ·  ' + renderer.info.memory.textures + ' textures' +
        '  ·  ' + renderer.info.programs.length + ' programs',
      '',
      'configuration            interval  p95     work     saved   fps',
      '------------------------------------------------------------------',
    ];
    for (const r of rows) {
      const saved = r === base ? '' : (base.wk - r.wk >= 0 ? '-' : '+') + Math.abs(base.wk - r.wk).toFixed(1) + 'ms';
      out.push(
        r.name.padEnd(24) +
        pad(r.iv.toFixed(1), 7) + ' ' + pad(r.ivp95.toFixed(1), 6) + ' ' +
        pad(r.wk.toFixed(1) + 'ms', 8) + ' ' + pad(saved, 8) + ' ' +
        pad((1000 / r.iv).toFixed(0), 5));
    }
    out.push('------------------------------------------------------------------');
    out.push('interval = wall time between frames (vsync-quantised; 16.7 = a clean 60)');
    out.push('work     = CPU inside the frame callback; this is the one to cut');
    out.push('saved    = work given back vs baseline');
    out.push('');
    const text = out.join('\n');
    console.log(text);
    try { await navigator.clipboard.writeText(text); console.log('(copied to clipboard)'); } catch {}
    return text;
  },

  /**
   * Occlusion, bloom, grade and grain, live.
   *
   *   __unit.setPost({ on: true, bloomStrength: .38, bloomThreshold: 2.6,
   *                    bloomRadius: .35, ao: .85, aoRadius: .42,
   *                    grain: .055, vignette: .70, saturation: 1.06 })
   *
   * `bloomThreshold` is the one to reach for first: too low and the whole room
   * hazes over, which reads as fog rather than as light.
   */
  setPost(p) { return post.set(p); },

  /** Drive the focus flight without hunting for a row: `__unit.focusWork(1)`. */
  focusWork(i = 0) { focus.enter(WORKS[i] || WORKS[0]); return WORKS[i]?.title },
  unfocus() { focus.exit() },
  /* Advance the focus flight by hand. An automated tab is a *hidden* tab and
     Chrome throttles rAF to nothing in one, so the flight never runs there
     otherwise — the same trap that stopped `perf()` from ever completing. */
  focusStep(dt = 1 / 60, n = 1) { for (let i = 0; i < n; i++) focus.update(dt); return focus.holding },
  /* Same reason as `focusStep`: an automated tab is a hidden tab and rAF does not
     run in one, so the opening move has to be advanced by hand to be checked. */
  introStep(dt = 1 / 60, n = 1) {
    for (let i = 0; i < n; i++) intro.update(dt)
    renderScreen(0, dt); display.paint(); screenTex.needsUpdate = true
    return { running: intro.running, cam: { ...CAM } }
  },
  replayIntro() { intro.replay(); return 'playing' },
  /**
   * Park the Screen at any moment of its power-on, 0 to 1, and hold it there.
   *
   * The opening runs in under three seconds, which is right for a visitor and
   * useless for looking at one frame of it. Once the intro has finished this is
   * not fought over by anything, so the Screen simply stays where it is put:
   * `__unit.setBoot(.35)` is the name typing, `.6` the loading line, `1` normal.
   */
  setBoot(k) { setBoot(k); return k },
  /** `__unit.setRoom(true)` puts the walls, panels and furniture back. */
  setRoom(on) { setRoomLights(on); return setRoom(on) },

  /**
   * The rig, live.
   *
   * Every number in the light rig was fitted against measurements off Fernando's
   * reference rather than chosen by eye, which makes them defensible and does not
   * make them right — the fit knows eight sample points and nothing about how the
   * room reads. This is how they get judged. Values are the current ones:
   *
   *   __unit.setLight({ exposure: 1.40, env: 1.85, key: 17, moon: .42,
   *                     candle: 3.6, globe: 5.2, picture: 2.6 })
   *
   * `exposure` first. If the whole room is simply too dark on his display that is
   * the one dial to move, and moving it does not disturb the balance underneath.
   */
  setLight({ exposure, env, key: k, moon: mo, candle, globe, picture }) {
    if (exposure !== undefined) renderer.toneMappingExposure = exposure;
    if (env !== undefined) scene.environmentIntensity = env;
    if (k !== undefined) key.intensity = k;
    if (mo !== undefined) moonlight.intensity = mo;
    if (picture !== undefined) pictureLight.intensity = picture;
    if (candle !== undefined) CANDLES.forEach(c => { c.base.light = candle; c.light.intensity = candle * c.live; });
    if (globe !== undefined) decor.setGlobe(globe);
    return {
      exposure: renderer.toneMappingExposure, env: scene.environmentIntensity,
      key: key.intensity, moon: moonlight.intensity, picture: pictureLight.intensity,
      candle: CANDLES[0].base.light,
    };
  },

  /** How hard the Screen emits, and how glossy its glass is. */
  setScreen({ emissive, roughness, glass: gl }) {
    if (gl !== undefined) screenGlass.material.opacity = gl;
    if (emissive !== undefined) screenMat.emissiveIntensity = emissive;
    if (roughness !== undefined) screenMat.roughness = roughness;
    return { emissive: screenMat.emissiveIntensity, roughness: screenMat.roughness,
             glass: screenGlass.material.opacity };
  },
  get eng() { return ENG; },
  get cam() { return { ...CAM, pos: camera.position.toArray().map(n => +n.toFixed(2)) }; },
  setCam(c) { Object.assign(CAM, c); placeCamera(); },
  parts: () => ({ cap, sun: sun.ring, moon: moon.ring, faceMat, face }),
  get title() { return TITLE; },
  get page() { return curPage; },
  get vigil() { return vigil; },
  get xf() { return xfVal; },
};

/* ---------- the rite ----------
 *
 * Clicking a Work on the Screen does not just switch a texture on. The room
 * performs the rite: the Candles gutter out on their own, the plinth takes light,
 * and the Work assembles out of it. Then the Screen stops being a list and becomes
 * the Work's plaque — the image is legible because it is big, the words are
 * legible because they stayed on the Screen, and neither does the other's job.
 *
 * The Vigil is borrowed, not taken. `restore` remembers where the visitor had it
 * and the banishment hands it back, because the Decks own the Vigil (ADR-0009) and
 * a moment that keeps what it took would be stealing the instrument.
 *
 * Coming back has two doors, and both mean the same thing in the fiction:
 *   — click the Screen again, which is where the visitor already is
 *   — touch the Sun, because bringing the light up is what dispels her work
 */
const RITE = { UP: 1.15, DOWN: 0.75 };

/**
 * Reduced motion does not cancel the rite — it arrives instantly instead.
 *
 * The summoning is not decoration that can be dropped: without it there is no way
 * to see a Work at all. So what goes is the travel, not the destination. The room
 * is dark, the Work is on the plinth, the Screen is its plaque, and none of it
 * moved to get there.
 */
const stillness = matchMedia('(prefers-reduced-motion: reduce)');

const smooth = k => k * k * (3 - 2 * k);

function summonWork(i) {
  if (rite.phase === 'rising' || rite.phase === 'held') return;
  rite = { phase: 'rising', work: i, k: 0, restore: vigil };
  summoning.applyWork(i);
  setPlinthWork(i);
  setHoverWork(-1); hoverWork = -1;
  drawScreen();
}

function banish() {
  if (rite.phase === 'idle' || rite.phase === 'falling') return;
  rite.phase = 'falling';
  setPlinthWork(-1);
  drawScreen();
}

/** Advance the rite and drive the Vigil while it holds the room. */
function stepRite(dt) {
  if (rite.phase === 'idle') return;
  if (stillness.matches) {
    if (rite.phase === 'rising') { rite.k = 1; rite.phase = 'held'; drawScreen(); }
    else if (rite.phase === 'falling') {
      rite = { phase: 'idle', work: -1, k: 0, restore: rite.restore };
      setVigil(rite.restore); drawScreen(); return;
    }
    setVigil(1);
    return;
  }
  if (rite.phase === 'rising') {
    rite.k = Math.min(1, rite.k + dt / RITE.UP);
    if (rite.k >= 1) { rite.phase = 'held'; drawScreen(); }
  } else if (rite.phase === 'falling') {
    rite.k = Math.max(0, rite.k - dt / RITE.DOWN);
    if (rite.k <= 0) { rite = { phase: 'idle', work: -1, k: 0, restore: rite.restore }; drawScreen(); }
  }
  const k = smooth(rite.k);
  /* the room goes to full night and comes back to wherever the visitor left it */
  setVigil(rite.restore + (1 - rite.restore) * k);
}

/**
 * A light at intensity 0 is not a light that is off. It is a light that costs
 * exactly as much as one that is on.
 *
 * three.js gathers every *visible* light in the scene, packs it into the uniform
 * arrays, and compiles the shader with `NUM_POINT_LIGHTS` set accordingly. The
 * fragment shader then loops over all of them for every pixel of every lit
 * surface. Nothing checks whether the intensity happens to be zero, and nothing
 * checks whether the light is anywhere near the fragment.
 *
 * This scene keeps three lights parked at 0 most of the time — the Moon Deck's
 * lamp before the Vigil turns, the phosphor rake until the last Candle dies, and
 * the summoning light while the Plinth is empty. Measured here, those three alone
 * were **a third of the entire frame**: 108ms with them, 72ms with them hidden,
 * and not one pixel different on screen.
 *
 * `dim()` is how intensity gets set from now on. It flips `visible` with the value,
 * which takes the light out of the shader entirely rather than multiplying by zero
 * fifteen times per pixel.
 */
function dim(light, intensity) {
  light.intensity = intensity;
  light.visible = intensity > 0.0005;
}

/**
 * Occlusion, bloom, grade and grain (ADR-0021).
 *
 * Built here rather than beside the renderer because `RenderPass` needs the scene
 * fully populated, and the room, the Altar and the props are all assembled above.
 */
const post = createPost(renderer, scene, camera, { width: W(), height: H() });

/**
 * Zoom to the Screen, hand the Work to the DOM (prototype — reverses ADR-0017).
 *
 * `onProgress` dims the room on the way in, so the Unit is the only thing left lit
 * when the panel arrives. The Vigil is *not* touched: the visitor's own setting is
 * still theirs when they come back out.
 */
const ROOM_DIM = [];
scene.traverse(n => { if (n.isLight && n !== rake) ROOM_DIM.push([n, n.intensity]); });
const focus = createFocus({
  camera,
  mount: document.getElementById('stage'),
  screen: { centre: new THREE.Vector3(0, FACE_Y, SCREEN_Z), width: OPENING.w, depth: OPENING.d },
  onProgress(t) {
    /* the room falls away; the Screen's own glow and the phosphor do not */
    for (const [l, base] of ROOM_DIM) l.intensity = base * (1 - t * 0.88);
    post.set({ vignette: 0.70 + t * 0.5 });
  },
  /**
   * Prev/next while a Work is up, so browsing does not mean flying out and back in
   * for every piece. Wraps, because a portfolio is a ring, not a list with ends.
   */
  onStep(d) {
    if (typeof d !== 'number') return
    const i = WORKS.indexOf(focus.work)
    const n = ((i < 0 ? 0 : i) + d + WORKS.length) % WORKS.length
    focus.show(WORKS[n])
  },
  restore() {
    /* ask the rig where it wants the camera *now*, so a view dragged before
       entering is the view returned to */
    const a = CAM.tilt * Math.PI / 180, y = CAM.yaw * Math.PI / 180;
    const h = Math.sin(a) * CAM.dist;
    const pos = new THREE.Vector3(Math.sin(y) * h, Math.cos(a) * CAM.dist, Math.cos(y) * h);
    const look = new THREE.Vector3(0, .35 + Math.max(0, (CAM.tilt - 34) / 40) * 2.4, 0);
    const m = new THREE.Matrix4().lookAt(pos, look, new THREE.Vector3(0, 1, 0));
    return { pos, quat: new THREE.Quaternion().setFromRotationMatrix(m) };
  },
});
focusDriving = () => focus.active;

/**
 * Show the room, or don't.
 *
 * Everything behind the Altar — walls, ceiling, acoustic panels, both bays, the
 * window, the portrait, the rug — is scenery the camera barely sees at this
 * framing, and all of it is drawn every frame. Off, for now.
 *
 * **Meshes only, never the Group.** Hiding `room` itself would hide the lights
 * inside it: three skips invisible objects when it gathers lights, so `skyLight`,
 * `wallWash`, the globe lamps and Lyra's picture light would all go out with the
 * scenery and the Unit would lose most of its illumination. Hiding the meshes one
 * by one keeps every light exactly where it was.
 *
 * The floor stays. Without it the Altar's legs end in nothing.
 */
const roomScenery = [];
room.traverse(o => {
  if ((o.isMesh || o.isInstancedMesh) && o !== floor) roomScenery.push(o);
});
portrait.group?.traverse?.(o => { if (o.isMesh) roomScenery.push(o); });
function setRoom(on) {
  for (const m of roomScenery) m.visible = on;
  return { shown: on, meshes: roomScenery.length };
}
/**
 * Lights that lit only the room go out with it.
 *
 * `setRoom` deliberately hides meshes and not the Group, so the lights survive —
 * which was right when the room was still there and is waste now that it is not.
 * `wallWash` lit the far wall. The two globe lamps lit the bays. The picture light
 * lit Lyra's frame. All four are now illuminating nothing the camera can see, and
 * three.js has no idea: every visible light is compiled into the shader and
 * evaluated by **every lit fragment**, whatever it happens to be pointed at
 * (ADR-0019).
 *
 * Four of twelve, for no visible change at all. What stays is what actually falls
 * on the Unit and the desk: the key, the moon, the three Candles, the Deck lamps
 * and the phosphor.
 */
const roomOnlyLights = [wallWash, pictureLight, ...decor.lamps ?? []];
function setRoomLights(on) {
  for (const l of roomOnlyLights) if (l) l.visible = on;
}

setRoom(false);
setRoomLights(false);


/**
 * The opening move. It drives `CAM` rather than the camera directly, so it goes
 * through the same rig everything else does and hands over cleanly at the end.
 */
const intro = createIntro({
  apply(c) { Object.assign(CAM, c); placeCamera(); },
  onBoot(k) { setBoot(k); },
  /* Hold at the opening pose until the Plate has its final texture, so the one
     remaining rebuild lands while the camera is far off and the Screen is dark. */
  waitFor: plateReady,
});

/* The Screen's own frame rate, independent of the room's. */
let SCREEN_STEP = 1 / 24, screenClock = 0;
/* `__unit.perf()` switches the Screen off entirely to price it. Nothing else does. */
let SCREEN_ON = true;
/* When a measurement is running, the loop hands it every frame's timings. */
let perfSample = null;

/* The last frame's delta, so the pointer handler can turn a drag into a velocity.
   Pointer events do not carry one and `performance.now()` deltas between moves are
   noisier than the frame clock. */
let dtNow = 1 / 60;

/**
 * A live frame rate, in the workbench.
 *
 * Measuring this from an automated tab stopped being possible — the same
 * configuration benchmarked between 26ms and 110ms, a four-fold spread, because
 * the driving browser is worn out after a day of loading this scene. The only
 * trustworthy instrument left is the machine the thing is running on, so the
 * number goes where Fernando can read it.
 *
 * Averaged over half a second: an instantaneous readout flickers too much to judge
 * and a long one hides the stalls that actually matter.
 */
const fpsEl = document.getElementById('fps');
let fpsFrames = 0, fpsClock = 0;
function tickFps(dt) {
  if (!fpsEl) return;
  fpsFrames++; fpsClock += dt;
  if (fpsClock < 0.5) return;
  const fps = fpsFrames / fpsClock;
  fpsEl.textContent = fps.toFixed(0) + ' · ' + (1000 / fps).toFixed(1) + 'ms';
  fpsEl.dataset.ok = fps >= 55 ? '1' : '0';
  fpsFrames = 0; fpsClock = 0;
}

let t0 = 0;
function frame(t) {
  const dt = Math.min(.05, (t - t0) / 1000); t0 = t;
  dtNow = dt;
  const w0 = perfSample ? performance.now() : 0;
  /* the decks keep turning very slowly, opposite ways, so the Unit never looks frozen */
  /**
   * The platters have weight.
   *
   * They used to be driven directly by the pointer and otherwise creep at a fixed
   * rate, so letting go stopped them dead — which is the one thing a heavy wheel
   * never does. Each Deck now carries a `spin` in radians per second: the drag
   * feeds it, and it bleeds off against a drag coefficient instead of being
   * cleared.
   *
   * `Math.pow(FRICTION, dt)` rather than a per-frame multiply, so the coast lasts
   * the same wall-clock time at 24fps as at 120.
   *
   * The idle creep is still there underneath — the wheel whose hand is winning
   * turns slowly on its own — but it is added to the momentum rather than
   * replacing it, so a spun Deck settles back into its drift instead of snapping
   * to it.
   */
  const FRICTION = 0.12;                       // per second; lower is heavier
  for (const [d0, drift] of [[sun, -.04 * (1 - vigil)], [moon, .04 * vigil]]) {
    if (Math.abs(d0.spin) > 0.0004) {
      d0.group.rotation.y += d0.spin * dt;
      d0.spin *= Math.pow(FRICTION, dt);
      /* a spun Deck keeps working the Vigil as it coasts, the way it does under
         the hand — otherwise the throw stops mattering the moment you let go */
      setVigil(vigil + (d0 === moon ? 1 : -1) * Math.abs(d0.spin * dt) * .34);
    } else {
      d0.spin = 0;
      d0.group.rotation.y += drift * dt;
    }
  }
  /* candlelight is never steady */
  CANDLES.forEach((c, i) => {
    if (!c.live) return;
    const f = .86 + .14 * Math.sin(t * .0043 + i * 2.1) * Math.sin(t * .0111 + i * 5.7);
    dim(c.light, c.base.light * c.live * f);
    c.flame.scale.x = c.flame.scale.z = (.55 + c.live * .45) * (.94 + f * .08);
  });
  stepRite(dt);
  /**
   * The Screen is never static — the raven flies, the Cast types, she breathes —
   * but it does not have to move at 60fps, and it was the most expensive thing in
   * the file by a wide margin.
   *
   * Each repaint redraws the 320x180 buffer, upscales it to 960x540, runs a
   * `blur(4.8px)` over the whole of that for the phosphor bloom, composites three
   * more full-canvas layers and then re-uploads a 2MB texture. At 60fps that is a
   * software gaussian and ~120MB/s of upload every second, on top of the scene.
   *
   * It is a CRT. Running it at 24 gains nothing visually and gives back better than
   * half the frame budget — and 24 is a rate the eye already reads as motion.
   */
  screenClock += dt;
  if (SCREEN_ON && screenClock >= SCREEN_STEP) {
    renderScreen(t / 1000, screenClock);
    display.paint();
    screenTex.needsUpdate = true;
    screenClock = 0;
  }
  summoning.update(smooth(rite.k), t / 1000);
  portrait.update(vigil);
  tickFps(dt);
  updatePads(dt);
  if (intro.running && !focus.active) intro.update(dt);
  focus.update(dt);
  post.render(t / 1000);
  /* `interval` is what the visitor feels — wall time between frames, and with vsync
     on it is quantised to multiples of the refresh, so it shows dropped frames and
     nothing else. `work` is the CPU actually spent in here, which is what tells you
     *which* thing to cut. Both, or the numbers mislead. */
  if (perfSample) perfSample(dt * 1000, performance.now() - w0);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
