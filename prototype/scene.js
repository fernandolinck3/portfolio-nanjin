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
import { deckMaps, deckGlow } from './deck-faces.js'
import { createRoomDecor } from './room-decor.js'
import {
  buffer as screenBuffer, render as renderScreen, SCREEN_W, SCREEN_H,
  setModule as setScreenModule, setVigil as setScreenVigil,
  setCrossfade as setScreenCrossfade, setFace as setScreenFace,
  setHoverWork, setPlinthWork, workRowAt,
} from './screen/render.js'
/* ============ Tenebrae — 3D material & form study ============ */
const W = () => innerWidth, H = () => innerHeight;

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

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
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(W(), H());
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.92;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.getElementById('stage').appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x060505);

const camera = new THREE.PerspectiveCamera(38, W() / H(), 0.1, 100);
/* CAM is the angle off vertical, in degrees. 0 is the spec-sheet view straight down;
   larger angles put the candlesticks into profile so they read as candles at all. */
let CAM = { tilt: 28, dist: 7.4, yaw: 0 };
/* Clamped so the visitor can look up into the room but never behind or under the Unit,
   whose sides are not modelled to hold up there. */
const CAM_LIMITS = { tilt: [4, 74], yaw: [-42, 42] };
function placeCamera() {
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

/* Tenebrism: one warm source, deep shadow, a cold sliver for separation. The three
   directionals are the working rig; the candles below carry the visible light. */
scene.add(new THREE.AmbientLight(0xffe6c4, 0.10));
const key = new THREE.DirectionalLight(0xffc98a, 2.3); key.position.set(-4.2, 2.6, 3.0); scene.add(key);
const fill = new THREE.DirectionalLight(0xffd9ae, 0.6); fill.position.set(3.2, 5.4, 3.0); scene.add(fill);
const rim = new THREE.DirectionalLight(0x7d90a8, 1.5); rim.position.set(3.8, 1.9, -3.6); scene.add(rim);

/**
 * Only the key casts, and it is framed tightly on the Unit.
 *
 * A shadow camera wide enough to cover the whole room spreads its texels so thin
 * that the Unit's own shadow turns to mush — and the Unit is the only place a
 * shadow has to be crisp. The room gets its darkness from falloff and from the
 * Candles dying, which is what tenebrism actually is.
 */
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.camera.near = 0.5;
key.shadow.camera.far = 22;
key.shadow.camera.left = -7; key.shadow.camera.right = 7;
key.shadow.camera.top = 7; key.shadow.camera.bottom = -7;
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
const WHEEL = { r: .93, x: 1.99, z: -.12 };
const SCREEN_Z = -.58;                   // clear of the artwork's engraved band
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
  [PX(-1.05), PY(.86), PX(1.05) - PX(-1.05), 72],   // HOT CUE / CROSSFADE
  [PX(-2.30), PY(1.18), PX(-1.42) - PX(-2.30), 72], // MOON
  [PX(1.42), PY(1.18), PX(2.30) - PX(1.42), 72],    // SUN
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
    c.fillStyle = c === a ? '#C4281C' : '#8E2418';
    c.fillText('MOON', PX(-1.86), PY(1.18) + 48);
    c.fillText('SUN', PX(1.86), PY(1.18) + 48);
    /* boxed, the way the reference rules them — a cartouche around the label
       rather than a word floating on the field */
    c.strokeStyle = c === a ? 'rgba(196,40,28,.7)' : 'rgba(142,36,24,.7)';
    c.lineWidth = 2;
    for (const cx of [PX(-1.86), PX(1.86)])
      c.strokeRect(cx - 168, PY(1.18) + 12, 336, 54);
    c.textAlign = 'left';
  });

  const at = new THREE.CanvasTexture(A); at.colorSpace = THREE.SRGBColorSpace; at.anisotropy = 8;
  const ht = new THREE.CanvasTexture(Hh); ht.anisotropy = 8;
  const et = new THREE.CanvasTexture(E); et.colorSpace = THREE.SRGBColorSpace; et.anisotropy = 8;
  const mt = new THREE.CanvasTexture(M); mt.anisotropy = 8;
  return { albedo: at, height: ht, glow: et, metal: mt };
}
let maps = faceMaps();

/** Rebuild the Plate's Print. Webfonts land after first paint, so this runs again once they do. */
function regenFace() {
  const m = faceMaps();
  const r = reliefMaps(1024, 562);
  faceMat.map = m.albedo; faceMat.emissiveMap = m.glow; faceMat.normalMap = r.normal;
  faceMat.metalnessMap = m.metal;
  /* a swapped-in CanvasTexture is not uploaded until it is marked dirty itself */
  [m.albedo, m.glow, r.normal, m.metal].forEach(t => { t.needsUpdate = true; });
  faceMat.needsUpdate = true;
  maps = m;
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
const chassisMat = new THREE.MeshPhysicalMaterial({
  color: 0x232528, metalness: .9, roughness: .34,
  roughnessMap: wearMap(6604, 180, .34, 2),
  clearcoat: .35, clearcoatRoughness: .5,
});
const chassis = new THREE.Mesh(slab(PLATE.w + .02, PLATE.d + .02, .34, .09, APERTURE), chassisMat);
unit.add(chassis);

/* printed face (thin decal plane just above the metal) */
const relief = reliefMaps(1024, 562);
const faceMat = new THREE.MeshPhysicalMaterial({
  map: maps.albedo,
  normalMap: relief.normal, normalScale: new THREE.Vector2(1, 1),
  emissiveMap: maps.glow, emissive: 0xffffff, emissiveIntensity: 0,
  /* `metalnessMap` is what lets the Print exist: bare Plate stays metal, and
     wherever ink was laid down the surface drops to a dielectric so its colour
     reads as colour instead of as a tint on a reflection. */
  metalnessMap: maps.metal,
  /* handled metal: the finish is not equally smooth everywhere it has been touched */
  roughnessMap: wearMap(5503, 240, .30, 2),
  metalness: .85, roughness: .34, clearcoat: .3, clearcoatRoughness: .45,
});
const face = new THREE.Mesh(plateGeom(PLATE.w, PLATE.d, APERTURE), faceMat);
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
  new THREE.MeshPhysicalMaterial({
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
const rimMat = new THREE.MeshPhysicalMaterial({
  color: 0x16181A, metalness: .88, roughness: .28, clearcoat: .4,
});
const giltMat = new THREE.MeshPhysicalMaterial({
  color: 0xB08D4A, metalness: .95, roughness: .3, clearcoat: .5,
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
  new THREE.MeshPhysicalMaterial({
    color: 0x9FB4B0, transparent: true, opacity: .055,
    metalness: 0, roughness: .06, clearcoat: 1, clearcoatRoughness: .04,
    depthWrite: false,
  }));
screenGlass.rotation.x = -Math.PI / 2;
screenGlass.position.set(0, FACE_Y + .006, SCREEN_Z); unit.add(screenGlass);
const glow = new THREE.PointLight(0x7FD9B0, 2.4, 3.4, 2);
glow.position.set(0, .95, SCREEN_Z); unit.add(glow);

/* ---------- the two decks ----------
   Sun raises the light, Moon puts it out. The rite performed with two hands: there is no
   Vigil knob, and the Pads carry navigation alone. */
/** Rays for the Sun, phases for the Moon — the face is the only thing that differs. */
function deck(x, kind) {
  const g = new THREE.Group(); g.position.set(x, .34, WHEEL.z); unit.add(g);
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(WHEEL.r, WHEEL.r, .1, 96, 1, false),
    new THREE.MeshPhysicalMaterial({ color: 0x8E8C84, metalness: 1, roughness: .22, clearcoat: .6 }));
  ring.position.y = .05; ring.userData.ctl = kind; g.add(ring);
  /* Stone, not metal: the tracery is carved and the light is behind it, so a
     mirror finish would fight the thing that makes it read. The emissive map is
     the piercings alone, and `applyVigil` decides how hard they burn. */
  const plateMat = new THREE.MeshPhysicalMaterial({
    map: DECK[kind].albedo, bumpMap: DECK[kind].height, bumpScale: 5,
    emissiveMap: DECK[kind].emissive,
    emissive: kind === 'sun' ? 0xF0A24A : 0x8FBEDC,
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
    new THREE.MeshPhysicalMaterial({ color: kind === 'sun' ? 0x2A2118 : 0x14161A, metalness: .9, roughness: .25 }));
  hub.position.y = .075; g.add(hub);
  return { group: g, ring, plate, mat: plateMat, lamp };
}
const moon = deck(-WHEEL.x, 'moon');
const sun = deck(WHEEL.x, 'sun');
const deckMats = [moon.plate.material, sun.plate.material];

/* pads */
const padMat = () => new THREE.MeshPhysicalMaterial({ color: 0x101112, metalness: .3, roughness: .55 });
const lampMats = [];
const padMeshes = [];
for (let i = 0; i < 6; i++) {
  const px = PAD_X0 + i * PAD.pitch;
  const p = new THREE.Mesh(slab(PAD.size, PAD.size, .07, .02), padMat());
  p.position.set(px, .34, PAD.z);
  p.userData.ctl = 'pad'; p.userData.i = i; unit.add(p); padMeshes.push(p);
  const lm = new THREE.MeshBasicMaterial({ color: i === 0 ? 0xF03A22 : 0x3A100C });
  lampMats.push(lm);
  const lamp = new THREE.Mesh(new THREE.PlaneGeometry(PAD.size * .74, .028), lm);
  lamp.rotation.x = -Math.PI / 2;
  lamp.position.set(px, .412, PAD.z - PAD.size * .30); unit.add(lamp);
}

/* crossfader */
const slot = new THREE.Mesh(slab(FADER.len, .14, .04, .015),
  new THREE.MeshPhysicalMaterial({ color: 0x0C0D0E, metalness: .5, roughness: .6 }));
slot.position.set(0, .335, FADER.z); unit.add(slot);
const cap = new THREE.Mesh(slab(.13, .26, .11, .02),
  new THREE.MeshPhysicalMaterial({ color: 0xB6B4AA, metalness: .7, roughness: .28 }));
/** Where the cap sits for a given crossfade, 0..1. */
const capX = v => -FADER.travel / 2 + v * FADER.travel;
cap.position.set(capX(.18), .35, FADER.z); cap.userData.ctl = 'fader'; unit.add(cap);

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

const mensa = new THREE.Mesh(new THREE.BoxGeometry(14.6, .62, 8.6),
  new THREE.MeshPhysicalMaterial({
    map: woodTexture(false), bumpMap: woodTexture(true), bumpScale: .5,
    color: 0xA08B78, metalness: 0, roughness: .46,
    clearcoat: .35, clearcoatRoughness: .30,   /* an old waxed top, not a matte board */
  }));
mensa.position.y = -.31; altar.add(mensa);

const cloth = new THREE.Mesh(new THREE.PlaneGeometry(7.6, 4.75),
  new THREE.MeshPhysicalMaterial({
    map: clothTexture(), transparent: true, roughness: .95, metalness: 0, color: 0x9a927f,
  }));
cloth.rotation.x = -Math.PI / 2; cloth.position.y = .004; altar.add(cloth);

/** A turned baluster candlestick, gilt, with a live flame and its own light. */
const GILT = new THREE.MeshPhysicalMaterial({
  color: 0xC9A03C, metalness: 1, roughness: .26, clearcoat: .5,
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
  const wax = new THREE.Mesh(new THREE.CylinderGeometry(.085, .095, .52, 24),
    new THREE.MeshPhysicalMaterial({
      color: 0xF3E7CE, roughness: .55, transmission: .35, thickness: .3, metalness: 0,
    }));
  wax.position.y = height * .98 + .26; g.add(wax);
  const flame = new THREE.Mesh(new THREE.SphereGeometry(.075, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0xFFD08A, transparent: true, blending: THREE.AdditiveBlending }));
  flame.scale.set(1, 2.1, 1);
  flame.position.y = height * .98 + .60; g.add(flame);
  const halo = new THREE.Mesh(new THREE.SphereGeometry(.20, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0xFF9A3C, transparent: true, opacity: .3, blending: THREE.AdditiveBlending }));
  halo.position.copy(flame.position); g.add(halo);
  const light = new THREE.PointLight(0xFFB162, 5.5, 13, 2);
  light.position.copy(flame.position); g.add(light);
  return { group: g, flame, halo, light, base: { flame: 1, light: 5.5, halo: .3 } };
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
const FLOOR_Y = -2.95, WALL_Z = -11.5, WALL_H = 12;
/* a lancet opening: jambs, springing, apex */
const WIN = { x: 2.45, y0: 0.20, spring: 3.55, y1: 6.10 };

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

const stoneMat = new THREE.MeshPhysicalMaterial({
  map: stoneTexture(false), bumpMap: stoneTexture(true), bumpScale: .5,
  color: 0x6E6862, roughness: .95, metalness: 0,
});
const panelMat = new THREE.MeshPhysicalMaterial({
  map: panelTexture(false), bumpMap: panelTexture(true), bumpScale: .5,
  roughnessMap: wearMap(4402, 200, .26, 4),
  /* near-white tint: the colour lives in the map now, and tinting paint brown was
     what made the old wall read as timber */
  color: 0xC8C6C2, roughness: .93, metalness: 0,
});

const floor = new THREE.Mesh(new THREE.PlaneGeometry(70, 70),
  new THREE.MeshPhysicalMaterial({
    map: woodTexture(false), bumpMap: woodTexture(true), bumpScale: .4,
    roughnessMap: wearMap(3301, 300, .42, 6),
    color: 0x6B584A, roughness: .62, metalness: 0, clearcoat: .25, clearcoatRoughness: .5,
  }));
floor.rotation.x = -Math.PI / 2; floor.position.y = FLOOR_Y; room.add(floor);

const rug = new THREE.Mesh(new THREE.PlaneGeometry(19, 13),
  new THREE.MeshPhysicalMaterial({ map: rugTexture(), roughness: .98, metalness: 0, color: 0x9a8f86 }));
rug.rotation.x = -Math.PI / 2; rug.position.set(0, FLOOR_Y + .01, 1.5); room.add(rug);

/* far wall, extruded around a lancet opening */
const wallShape = new THREE.Shape();
wallShape.moveTo(-15, FLOOR_Y); wallShape.lineTo(15, FLOOR_Y);
wallShape.lineTo(15, FLOOR_Y + WALL_H); wallShape.lineTo(-15, FLOOR_Y + WALL_H); wallShape.closePath();
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

/* side walls, so turning the view does not find a void */
for (const sx of [-15, 15]) {
  const w = new THREE.Mesh(new THREE.BoxGeometry(.7, WALL_H, 30), panelMat);
  w.position.set(sx, FLOOR_Y + WALL_H / 2, WALL_Z + 15); room.add(w);
}

/* the sky beyond: day and night, crossfaded by the Vigil */
function skyTexture(night) {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 1024;
  const g = c.getContext('2d');
  const rnd = rng(night ? 31337 : 8123);
  const sky = g.createLinearGradient(0, 0, 0, 1024);
  if (night) { sky.addColorStop(0, '#0d1626'); sky.addColorStop(.6, '#141d2c'); sky.addColorStop(1, '#1b2130'); }
  else { sky.addColorStop(0, '#9FB4C6'); sky.addColorStop(.55, '#C9CFCE'); sky.addColorStop(1, '#D8D2C2'); }
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
const stoneTrim = new THREE.MeshPhysicalMaterial({ color: 0x6B655C, roughness: .92 });
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
const velvet = new THREE.MeshPhysicalMaterial({
  map: velvetTexture(), color: 0x8C4A46, roughness: .96, metalness: 0, side: THREE.DoubleSide,
});
for (const sx of [-1, 1]) {
  const curtain = new THREE.Mesh(new THREE.CylinderGeometry(.62, .78, 8.0, 20, 1, true, 0, Math.PI), velvet);
  curtain.position.set(sx * (WIN.x + .95), WIN.y1 - 4.1, WALL_Z + .55);
  curtain.rotation.y = sx > 0 ? -Math.PI / 2 : Math.PI / 2;
  room.add(curtain);
}
const rail = new THREE.Mesh(new THREE.CylinderGeometry(.075, .075, WIN.x * 2 + 3.4, 16), GILT);
rail.rotation.z = Math.PI / 2; rail.position.set(0, WIN.y1 + .25, WALL_Z + .55); room.add(rail);

/* window light — the decks decide whether it is the sun or the moon out there */
const skyLight = new THREE.DirectionalLight(0xFFE4BC, 3.2);
skyLight.position.set(1.1, 4.6, WALL_Z); skyLight.target.position.set(0, 0, 1);
room.add(skyLight, skyLight.target);
const wallWash = new THREE.DirectionalLight(0xC8B79A, .5);
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
const portrait = createPortrait(scene, {
  x: -4.9, y: FLOOR_Y + 5.4, wallFace: WALL_Z + 0.7,
  height: 4.4, name: 'Lyra', line: 'KEEPER OF THE VIGIL',
});

/* ---------- the studio ----------
   Acoustic panels, monitors, the credenza of records, the pedal cabinet and the
   two globe lamps. The Altar, the Candles, the window and the Portrait are not
   touched — this furnishes the room around them. */
const decor = createRoomDecor(room, { floorY: FLOOR_Y, wallFace: WALL_Z + 0.7 });

/* canvas type is drawn once at load, before the webfonts land */
document.fonts?.ready?.then(() => summoning.refresh());

/* turned legs, so the table reads as furniture once the camera comes up */
const legProfile = [
  [.00, .00], [.30, .00], [.30, .10], [.17, .16], [.14, .34],
  [.22, .48], [.24, .60], [.16, .74], [.13, 1.0], [.20, 1.14],
  [.22, 1.30], [.15, 1.46], [.14, 1.90], [.24, 2.00], [.26, 2.16],
];
const legMat = new THREE.MeshPhysicalMaterial({
  map: woodTexture(false), color: 0x8A7563, roughness: .55, metalness: 0,
});
for (const lx of [-6.2, 6.2]) for (const lz of [-3.5, 3.5]) {
  const h = (-.62 - FLOOR_Y) / 2.16;
  const leg = new THREE.Mesh(
    new THREE.LatheGeometry(legProfile.map(([r, y]) => new THREE.Vector2(r, y * h)), 32), legMat);
  leg.position.set(lx, FLOOR_Y, lz); room.add(leg);
}

/* ---------- vigil: the lights go out one at a time (ADR-0006) ----------
   The three-point rig is the three candles. Rim dies first, then fill, then key.
   At full vigil only the Screen's phosphor is left, and it rakes across the Plate
   at a grazing angle so the Nightwork engraved there finally reads. */
let vigil = +(new URLSearchParams(location.search).get('vigil') || 0) / 100;

/** Grazing phosphor spill. Absent under room light, it is the only source at full vigil. */
const rake = new THREE.DirectionalLight(0x7FD9B0, 0);
rake.position.set(-3.4, .34, -2.2); unit.add(rake);

const KEY0 = key.intensity, FILL0 = fill.intensity, RIM0 = rim.intensity;
const ENV0 = scene.environmentIntensity ?? 1;

/* The ramps live in `light.js` now — the Screen reads the same three pairs to
   decide how far into the night it has travelled, and two files agreeing by hand
   about the same numbers is how they drift. */

function applyVigil() {
  rim.intensity  = RIM0  * candle(vigil, ...RAMPS[0]);
  fill.intensity = FILL0 * candle(vigil, ...RAMPS[1]);
  key.intensity  = KEY0  * candle(vigil, ...RAMPS[2]);

  CANDLES.forEach((c, i) => {
    const k = candle(vigil, ...RAMPS[i]);
    c.live = k;
    /* the flame shortens before it goes, the way a wick drowns in its own wax */
    c.flame.scale.set(.55 + k * .45, .7 + k * 1.4, .55 + k * .45);
    c.flame.material.opacity = Math.min(1, k * 1.6);
    c.halo.material.opacity = c.base.halo * k;
    c.light.intensity = c.base.light * k;
    c.flame.visible = c.halo.visible = k > .001;
  });
  scene.environmentIntensity = ENV0 * (1 - vigil * .88);

  /* The wheels show whose hand is winning. Light comes through their tracery: the
     Sun's holds while the room is lit and is out by the time the last Candle is;
     the Moon's is dark at first light and takes over as the room goes. They cross
     near the middle of the rite, where neither has won. */
  {
    const glow = deckGlow(vigil);
    sun.mat.emissiveIntensity = glow.sun * 1.5;
    moon.mat.emissiveIntensity = glow.moon * 1.5;
    sun.lamp.intensity = glow.sun * 1.1;
    moon.lamp.intensity = glow.moon * 1.1;
  }

  /* the studio's own lamps go out first, before the Candles */
  decor.update(vigil);

  /* the decks turn the day. Sun up, and it is afternoon outside; Moon up, and it is night. */
  nightSky.material.opacity = vigil;
  skyLight.intensity = 3.2 * (1 - vigil) + 1.1 * vigil;
  skyLight.color.setRGB(1 - vigil * .38, .894 - vigil * .18, .737 + vigil * .11);
  wallWash.intensity = .5 * (1 - vigil) + .3 * vigil;
  wallWash.color.setRGB(.784 - vigil * .22, .718 - vigil * .08, .604 + vigil * .16);

  /* the screen takes over the room */
  glow.intensity = 2.4 + vigil * 5.2;
  glow.distance = 3.4 + vigil * 2.6;
  rake.intensity = Math.max(0, (vigil - .42) / .58) * 3.1;

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
  lampMats.forEach((m, i) => m.color.setHex(i === curPage ? 0xF03A22 : 0x3A100C));
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
    if (c === 'pad') { setPage(hit.userData.i); return; }
    if (c === 'screen') {
      /* while a Work is up, the Screen is the way back — anywhere on it */
      if (rite.phase === 'rising' || rite.phase === 'held') { banish(); return; }
      const row = screenRowAt(e);
      if (row >= 0) { summonWork(row); return; }
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
  active = 'cam'; el.setPointerCapture(e.pointerId); el.style.cursor = 'grabbing';
});

el.addEventListener('pointermove', e => {
  if (!active) {
    const hit = pick(e);
    const ctl = hit && hit.userData.ctl;
    /* A row only lamps while it is actually callable — not while a Work is
       already up, when the whole Screen means "send it back" instead. */
    const row = (ctl === 'screen' && rite.phase === 'idle') ? screenRowAt(e) : -1;
    if (row !== hoverWork) { hoverWork = row; setHoverWork(row); drawScreen(); }
    el.style.cursor = ctl === 'pad' ? 'pointer'
      : ctl === 'fader' ? 'ew-resize'
      : ctl === 'screen' && (row >= 0 || rite.phase !== 'idle') ? 'pointer'
      : 'grab';
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
    setScreenCrossfade(xfVal);
    drawScreen();
  } else if (active === 'sun' || active === 'moon') {
    const d0 = active === 'sun' ? sun : moon;
    const a = deckAngle(e, d0.group); let d = a - jogLast;
    if (d > Math.PI) d -= 6.2832; if (d < -Math.PI) d += 6.2832;
    jogLast = a; d0.group.rotation.y -= d;
    /* Sun brings the light up, Moon puts it out — whichever way you turn it. */
    setVigil(vigil + (active === 'moon' ? 1 : -1) * Math.abs(d) * .34);
  }
});

el.addEventListener('pointerup', () => { active = null; el.style.cursor = 'default'; });

/* keyboard + screen-reader layer */
document.querySelectorAll('[data-act]').forEach(b => {
  b.addEventListener('click', () => {
    setPage(+b.dataset.act);
  });
});
const vslider = document.getElementById('vigil');
vslider.addEventListener('input', () => setVigil(+vslider.value / 100));

/* engraving dials — tune the Plate live against references */
const dial = (id, read, fmt) => {
  const el = document.getElementById(id), out = document.getElementById(id + 'v');
  el.addEventListener('input', () => {
    const v = read(+el.value);
    out.textContent = fmt(v);
    ENG = { ...ENG, [id]: v };
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
/* Ornament artwork, if it has been dropped in. Falls back to the procedural vine when absent. */
(async () => {
  for (const f of ['ornament/plate.png', 'ornament/plate.jpg', 'ornament/plate.svg']) {
    try {
      const res = await fetch(f, { method: 'HEAD' });
      if (!res.ok) continue;
      const img = new Image();
      await new Promise((ok, no) => { img.onload = ok; img.onerror = no; img.src = f; });
      ART = img; ART_DARK = artIsDark(img); regenFace();
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
      ORN = img; regenFace();
      console.log('[tenebrae] ornament loaded:', f, img.width + 'x' + img.height);
      return;
    } catch { /* not there yet */ }
  }
  console.log('[tenebrae] no ornament artwork; using the procedural vine');
})();

setVigil(vigil);

/* The Print is drawn before webfonts arrive, and document.fonts.ready does not load a face that
   nothing on the page has used yet — an unused family silently falls back. Ask for each one. */
Promise.all([
  ...Object.values(TITLES).map(t => document.fonts.load(t.font.replace(/^(\S+\s+\S+)/, '$1'))),
  document.fonts.load('500 30px "Azeret Mono"'),
  document.fonts.load('700 30px Archivo'),
  /* the Screen's own faces — it is drawn by screen/render.js now, and an unused
     family silently falls back rather than erroring */
  document.fonts.load('8px Silkscreen'),
  document.fonts.load('13px VT323'),
  document.fonts.load('17px UnifrakturMaguntia'),
]).then(regenFace);

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
groundShadows(scene);

window.__unit = {
  /** rAF is throttled in a background tab, so never trust the last frame's matrices. */
  render() { camera.updateMatrixWorld(true); scene.updateMatrixWorld(true); renderer.render(scene, camera); },
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
  setQuality(level) {
    if (level <= 0) { renderer.shadowMap.enabled = false; }
    else {
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = level >= 2 ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap;
      key.shadow.mapSize.set(level >= 2 ? 2048 : 1024, level >= 2 ? 2048 : 1024);
      if (key.shadow.map) { key.shadow.map.dispose(); key.shadow.map = null; }
    }
    scene.traverse(o => { if (o.isMesh && o.material) o.material.needsUpdate = true; });
    return level;
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

let t0 = 0;
function frame(t) {
  const dt = Math.min(.05, (t - t0) / 1000); t0 = t;
  /* the decks keep turning very slowly, opposite ways, so the Unit never looks frozen */
  sun.group.rotation.y -= dt * .04 * (1 - vigil);
  moon.group.rotation.y += dt * .04 * vigil;
  /* candlelight is never steady */
  CANDLES.forEach((c, i) => {
    if (!c.live) return;
    const f = .86 + .14 * Math.sin(t * .0043 + i * 2.1) * Math.sin(t * .0111 + i * 5.7);
    c.light.intensity = c.base.light * c.live * f;
    c.flame.scale.x = c.flame.scale.z = (.55 + c.live * .45) * (.94 + f * .08);
  });
  stepRite(dt);
  /* The Screen is never static — the raven flies, the Cast types, she breathes —
     so it is repainted every frame rather than only when something is set. */
  renderScreen(t / 1000, dt);
  display.paint();
  screenTex.needsUpdate = true;
  summoning.update(smooth(rite.k), t / 1000);
  portrait.update(vigil);
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
