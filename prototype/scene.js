import * as THREE from 'three'
/* The copy is not in this file. ADR-0002: the DOM is truth and the Screen renders it,
   so both consumers read the same source. See src/content/modules.ts. */
import { MODULES } from '../src/content/modules.ts'
/* ============ Tenebrae — 3D material & form study ============ */
const W = () => innerWidth, H = () => innerHeight;

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
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
function borderOrnament(g, x, y, w, h, s) {
  g.lineWidth = s * .1;
  g.strokeRect(x, y, w, h);
  g.strokeRect(x + s * .55, y + s * .55, w - s * 1.1, h - s * 1.1);
  const step = s * 1.9;
  for (let px = x + step / 2; px < x + w; px += step) {
    cusp(g, px, y + s * .55, -Math.PI / 2, s * .5, 2);
    cusp(g, px, y + h - s * .55, Math.PI / 2, s * .5, 2);
  }
  for (let py = y + step / 2; py < y + h; py += step) {
    cusp(g, x + s * .55, py, Math.PI, s * .5, 2);
    cusp(g, x + w - s * .55, py, 0, s * .5, 2);
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


/* ---------- field work ----------
   World space maps onto the Plate texture through PX / PY below. Reserves are the areas the Parts occupy: the
   engraving fills everything else and is then cut back out of them. */
/* The Plate is 5.58 x 3.26; the texture matches that ratio so ornament is never stretched. */
const TW = 2048, TH = 1196;
const PX = x => (x + 2.79) / 5.58 * TW, PY = z => (z + 1.63) / 3.26 * TH;
const RESERVES = [
  { r: [PX(-1.02), PY(-1.24), PX(1.02) - PX(-1.02), PY(-.06) - PY(-1.24)] },    // Screen + bezel
  { r: [PX(-1.00), PY(.34), PX(1.00) - PX(-1.00), PY(.76) - PY(.34)] },         // Pad row
  { r: [PX(-.58), PY(1.02), PX(.58) - PX(-.58), PY(1.30) - PY(1.02)] },         // Crossfader
  { c: [PX(-1.86), PY(-.10), PX(-1.86 + .98) - PX(-1.86)] },                    // Moon deck
  { c: [PX(1.86), PY(-.10), PX(1.86 + .98) - PX(1.86)] },                       // Sun deck
];
/* The Print gets cleared ground too — labels never fight the field. */
const PRINT_RESERVES = [
  [PX(-1.10), 54, PX(1.10) - PX(-1.10), 128],   // model name + serial, above the Screen
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
function cutReserves(g, base, lw) {
  g.save();
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
let ART = null;

/** Paint the ornament mask: white where the metal is cut away, black where it stands. */
function ornamentMask(w, h) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
  const sx = w / TW, sy = h / TH;
  g.save(); g.scale(sx, sy);
  g.strokeStyle = '#fff'; g.fillStyle = '#fff'; g.lineCap = 'round'; g.lineJoin = 'round';
  if (ART) {
    /* The painting itself takes a shallow relief, so it reads as printed on metal
       that has texture rather than as a flat sticker. */
    const k = Math.max(TW / ART.width, TH / ART.height) * ENG.artZoom;
    const dw = ART.width * k, dh = ART.height * k;
    g.save();
    g.filter = ENG.invert ? 'grayscale(1) contrast(1.7)' : 'grayscale(1) invert(1) contrast(1.7)';
    g.drawImage(ART, (TW - dw) / 2 + ENG.artX, (TH - dh) / 2 + ENG.artY, dw, dh);
    g.restore();
  } else if (ORN) {
    /* tiled artwork */
    const tw = ORN.width * ENG.tile, th = ORN.height * ENG.tile;
    for (let y = 54; y < TH - 54; y += th)
      for (let x = 54; x < TW - 54; x += tw) g.drawImage(ORN, x, y, tw, th);
  } else {
    /* fallback: the procedural vine, so the scene works before any artwork arrives */
    foliateBorder(g, 54, 54, TW - 108, TH - 108, ENG.band, ENG.waves, ENG.lw);
    if (ENG.waves >= 1) midOrnaments(g, 54, 54, TW - 108, TH - 108, ENG.band, ENG.lw);
    growField(g, ENG.band, ENG.lw * .92, ENG.grow, ENG.seed);
  }
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
            tile: 1, bevel: 10, depth: 11, scrim: .34, invert: 1, artZoom: 1, artX: 0, artY: 0 };
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
  if (ART) {
    /* cover-fit, so the art is never squashed to the Plate's ratio */
    const k = Math.max(TW / ART.width, TH / ART.height) * ENG.artZoom;
    const dw = ART.width * k, dh = ART.height * k;
    a.save();
    /* An engraving on parchment is dark ink on light ground. The Unit is the other way round,
       so the plate art is inverted: pale line on a dark field, which is also how the celestial
       charts in the reference read. */
    if (ENG.invert) a.filter = 'invert(1) saturate(.35) brightness(.92)';
    a.drawImage(ART, (TW - dw) / 2 + ENG.artX, (TH - dh) / 2 + ENG.artY, dw, dh);
    a.restore();
    /* a scrim keeps the Print readable over whatever the art is doing underneath */
    a.fillStyle = `rgba(10,11,13,${ENG.scrim})`; a.fillRect(0, 0, TW, TH);
  }
  
  h.fillStyle = '#808080'; h.fillRect(0, 0, TW, TH);

  /* engraved ornament — into both height and a darkened albedo */
  /* Both maps take the same marks; only the ink differs. */
  const plate = (g, base, ink, mass, ground, k) => {
    g.strokeStyle = ink; g.fillStyle = mass; g.lineCap = 'round'; g.lineJoin = 'round';
    /* The ground is cut into the metal, not printed onto it: strong in height, faint in colour. */
    if (ENG.hatch > 6) { g.strokeStyle = ground; hatch(g, ENG.hatch, -0.42, ENG.lw * .26); }
    g.strokeStyle = ink; g.fillStyle = mass;
    /* with Plate art present the frame steps back — OBNE panels carry no ornamental border */
    if (!ART) growField(g, ENG.band, ENG.lw * .92, ENG.grow, ENG.seed);
    if (!ART) {
    foliateBorder(g, 54, 54, TW - 108, TH - 108, ENG.band, ENG.waves, ENG.lw * k);
    foliateBorder(g, 54 + ENG.band * 1.15, 54 + ENG.band * 1.15,
      TW - 108 - ENG.band * 2.3, TH - 108 - ENG.band * 2.3, ENG.band * .62,
      Math.round(ENG.waves * 1.4), ENG.lw * .7 * k);
    }
    if (!ART && ENG.waves >= 1) midOrnaments(g, 54, 54, TW - 108, TH - 108, ENG.band, ENG.lw * k);
    cutReserves(g, base, ENG.lw * k);
  };
  plate(h, '#808080', '#0C0C0C', '#141414', '#4A4A4A', 1);
  /* The Plate is dark, so the engraving reads light — bare metal showing through the finish,
     which is how every one of the references carries its ornament. */
  plate(a, '#26282B', `rgba(206,203,193,${ENG.ink})`, `rgba(178,175,166,${ENG.ink * .26})`,
        `rgba(206,203,193,${ENG.ink * .20})`, .85);

  /* printed silkscreen — phosphorescent, so it survives the Vigil */
  ink(c => {
    c.textAlign = 'center';
    c.fillStyle = c === a ? '#E6E4DB' : '#CFEFE0';
    c.font = TITLE.font;
    c.letterSpacing = TITLE.track;
    c.fillText('TENEBRAE', TW / 2, 96);
    c.fillStyle = c === a ? '#8A8880' : '#5E8C7A';
    c.font = '500 26px "Azeret Mono", monospace';
    c.letterSpacing = '9px';
    c.fillText('FER BITTENCOURT / SER 001 / REV A', TW / 2, 146);

    c.fillStyle = c === a ? '#9A9890' : '#6FA891';
    c.font = '500 28px "Azeret Mono", monospace';
    c.fillText('HOT CUE', TW / 2, PY(.86) + 48);
    c.fillText('CROSSFADE', TW / 2, PY(1.34) + 24);
    c.fillStyle = c === a ? '#C4281C' : '#8E2418';
    c.fillText('MOON', PX(-1.86), PY(1.18) + 48);
    c.fillText('SUN', PX(1.86), PY(1.18) + 48);
    c.textAlign = 'left';
  });

  const at = new THREE.CanvasTexture(A); at.colorSpace = THREE.SRGBColorSpace; at.anisotropy = 8;
  const ht = new THREE.CanvasTexture(Hh); ht.anisotropy = 8;
  const et = new THREE.CanvasTexture(E); et.colorSpace = THREE.SRGBColorSpace; et.anisotropy = 8;
  return { albedo: at, height: ht, glow: et };
}
let maps = faceMaps();

/** Rebuild the Plate's Print. Webfonts land after first paint, so this runs again once they do. */
function regenFace() {
  const m = faceMaps();
  const r = reliefMaps(1024, 598);
  faceMat.map = m.albedo; faceMat.emissiveMap = m.glow; faceMat.normalMap = r.normal;
  /* a swapped-in CanvasTexture is not uploaded until it is marked dirty itself */
  [m.albedo, m.glow, r.normal].forEach(t => { t.needsUpdate = true; });
  faceMat.needsUpdate = true;
  maps = m;
}

/* jog plate texture */
/* ---------- deck faces ----------
   The two decks are the Vigil made physical, so their faces are the light itself:
   the Sun in full glory, the Moon in its phases. */

/** Alternating straight and wavy rays, a chased centre, an outer ring of beads. */
function sunFace(g, cx, cy, R) {
  g.lineWidth = R * .016;
  [1, .93, .62, .30, .17].forEach(k => { g.beginPath(); g.arc(cx, cy, R * k, 0, 6.2832); g.stroke(); });
  for (let i = 0; i < 24; i++) {
    const a = i / 24 * 6.2832;
    const inner = R * .64, outer = R * (i % 2 ? .90 : .84);
    if (i % 2) {
      /* straight ray, tapered to a point */
      g.beginPath();
      g.moveTo(cx + Math.cos(a - .038) * inner, cy + Math.sin(a - .038) * inner);
      g.lineTo(cx + Math.cos(a) * outer, cy + Math.sin(a) * outer);
      g.lineTo(cx + Math.cos(a + .038) * inner, cy + Math.sin(a + .038) * inner);
      g.closePath(); g.fill(); g.stroke();
    } else {
      /* flame ray, curling one way */
      g.beginPath();
      g.moveTo(cx + Math.cos(a - .030) * inner, cy + Math.sin(a - .030) * inner);
      g.quadraticCurveTo(cx + Math.cos(a + .10) * (inner + outer) * .5, cy + Math.sin(a + .10) * (inner + outer) * .5,
                         cx + Math.cos(a) * outer, cy + Math.sin(a) * outer);
      g.quadraticCurveTo(cx + Math.cos(a - .12) * (inner + outer) * .5, cy + Math.sin(a - .12) * (inner + outer) * .5,
                         cx + Math.cos(a + .030) * inner, cy + Math.sin(a + .030) * inner);
      g.closePath(); g.stroke();
    }
  }
  /* chasing between the inner rings */
  for (let i = 0; i < 48; i++) {
    const a = i / 48 * 6.2832;
    g.beginPath();
    g.moveTo(cx + Math.cos(a) * R * .30, cy + Math.sin(a) * R * .30);
    g.lineTo(cx + Math.cos(a + .05) * R * .62, cy + Math.sin(a + .05) * R * .62);
    g.stroke();
  }
  for (let i = 0; i < 60; i++) {
    const a = i / 60 * 6.2832;
    g.beginPath(); g.arc(cx + Math.cos(a) * R * .965, cy + Math.sin(a) * R * .965, R * .012, 0, 6.2832); g.stroke();
  }
}

/** The phases running the rim, a crescent at the centre, stars in the field. */
function moonFace(g, cx, cy, R) {
  g.lineWidth = R * .016;
  [1, .93, .70, .26].forEach(k => { g.beginPath(); g.arc(cx, cy, R * k, 0, 6.2832); g.stroke(); });
  const N = 16;
  for (let i = 0; i < N; i++) {
    const a = i / N * 6.2832 - Math.PI / 2;
    const px = cx + Math.cos(a) * R * .815, py = cy + Math.sin(a) * R * .815, r = R * .072;
    /* full disc, then the shadow bitten out of it by the phase */
    g.beginPath(); g.arc(px, py, r, 0, 6.2832); g.stroke();
    const phase = i / N;
    const k = Math.cos(phase * 6.2832);
    g.save(); g.beginPath(); g.arc(px, py, r, 0, 6.2832); g.clip();
    g.beginPath(); g.ellipse(px + k * r * .55, py, r * Math.abs(k) * .9 + r * .1, r, 0, 0, 6.2832);
    g.fill(); g.restore();
  }
  /* centre crescent */
  g.save();
  g.beginPath(); g.arc(cx, cy, R * .225, 0, 6.2832);
  g.arc(cx + R * .105, cy - R * .045, R * .195, 0, 6.2832, true);
  g.fill('evenodd'); g.stroke();
  g.restore();
  /* stars */
  for (let i = 0; i < 40; i++) {
    const a = i * 2.399963, rr = R * (.34 + .30 * ((i * 7919) % 97) / 97);
    const px = cx + Math.cos(a) * rr, py = cy + Math.sin(a) * rr, sr = R * .022;
    g.lineWidth = R * .009;
    g.beginPath();
    g.moveTo(px, py - sr); g.lineTo(px + sr * .28, py - sr * .28); g.lineTo(px + sr, py);
    g.lineTo(px + sr * .28, py + sr * .28); g.lineTo(px, py + sr);
    g.lineTo(px - sr * .28, py + sr * .28); g.lineTo(px - sr, py);
    g.lineTo(px - sr * .28, py - sr * .28); g.closePath(); g.fill();
  }
  g.lineWidth = R * .016;
}

function deckFace(kind, albedo) {
  const c = document.createElement('canvas'); c.width = c.height = 1024;
  const g = c.getContext('2d');
  g.fillStyle = albedo ? (kind === 'sun' ? '#CFC7B2' : '#BFC2C8') : '#9a9a9a';
  g.fillRect(0, 0, 1024, 1024);
  g.strokeStyle = albedo ? 'rgba(20,20,20,.85)' : '#141414';
  g.fillStyle = albedo ? 'rgba(20,20,20,.72)' : '#171717';
  g.lineCap = 'round'; g.lineJoin = 'round';
  (kind === 'sun' ? sunFace : moonFace)(g, 512, 512, 430);
  const t = new THREE.CanvasTexture(c);
  if (albedo) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8; return t;
}

const DECK = { sun: { alb: deckFace('sun', true), bump: deckFace('sun', false) },
               moon: { alb: deckFace('moon', true), bump: deckFace('moon', false) } };

/* screen texture — paged */
const scrCanvas = document.createElement('canvas');
scrCanvas.width = 1024; scrCanvas.height = 576;
const screenTex = new THREE.CanvasTexture(scrCanvas);
screenTex.colorSpace = THREE.SRGBColorSpace; screenTex.anisotropy = 8;
let curPage = 0, xfVal = 0.18;

function drawScreen() {
  const g = scrCanvas.getContext('2d'), P = MODULES[curPage];
  g.fillStyle = '#080B0A'; g.fillRect(0, 0, 1024, 576);
  g.strokeStyle = '#1F3830'; g.lineWidth = 3; g.strokeRect(14, 14, 996, 548);
  g.strokeStyle = '#24443A'; borderOrnament(g, 26, 26, 972, 524, 20);
  g.fillStyle = '#F03A22'; g.font = '500 22px "Azeret Mono", monospace'; g.letterSpacing = '6px';
  g.fillText('MOD 0' + P.slot + '/06', 70, 92);
  g.fillStyle = '#DCE4DE'; g.font = '700 30px Archivo, Arial'; g.letterSpacing = '7px';
  g.fillText(P.title, 400, 92);
  g.letterSpacing = '0px';
  let y = 180;
  switch (P.kind) {
    /* The Crossfader's own Module. The fader picks a side; the engraved index
       mark on the Plate does not move with it (ADR-0005). */
    case 'thesis': {
      const side = xfVal > .5 ? P.b : P.a;
      g.fillStyle = '#fff'; g.font = '700 27px Archivo, Arial';
      g.fillText(side.heading, 72, y); y += 46;
      g.fillStyle = '#DCE4DE'; g.font = '400 26px Archivo, Arial';
      side.lines.forEach(l => { g.fillText(l, 72, y); y += 38; });
      g.fillStyle = '#6E8079'; g.font = '400 22px "Azeret Mono", monospace';
      g.fillText('CROSSFADE  ' + String(Math.round(xfVal * 100)).padStart(3, '0') + ' / 100  — set honestly', 72, 430);
      g.fillStyle = '#1F3830'; g.fillRect(72, 452, 880, 10);
      g.fillStyle = '#F03A22'; g.fillRect(72 + xfVal * 866, 446, 14, 22);
      break;
    }
    case 'table': {
      g.font = '400 23px "Azeret Mono", monospace';
      g.fillStyle = '#F03A22';
      g.fillText(P.head[0], 72, 170); g.fillText(P.head[1], 620, 170); g.fillText(P.head[2], 840, 170);
      y = 214;
      P.rows.forEach(r => {
        g.fillStyle = '#DCE4DE'; g.fillText(r[0], 72, y);
        g.fillStyle = '#6E8079'; g.fillText(r[1], 620, y); g.fillText(r[2], 840, y);
        g.fillStyle = '#152420'; g.fillRect(72, y + 12, 880, 1); y += 48;
      });
      break;
    }
    case 'steps': {
      y = 176;
      P.steps.forEach((t, i) => {
        g.fillStyle = '#F03A22'; g.font = '400 20px "Azeret Mono", monospace';
        g.fillText('0' + (i + 1), 72, y);
        g.fillStyle = '#DCE4DE'; g.font = '400 25px Archivo, Arial';
        g.fillText(t, 130, y);
        g.fillStyle = '#152420'; g.fillRect(72, y + 12, 880, 1); y += 46;
      });
      break;
    }
    default: {
      g.fillStyle = '#DCE4DE'; g.font = '400 27px Archivo, Arial';
      P.lines.forEach(l => { g.fillText(l, 72, y); y += 40; });
      if (P.mail) { g.fillStyle = '#57C98E'; g.font = '500 28px "Azeret Mono", monospace'; y += 14; g.fillText(P.mail, 72, y); y += 44; }
      g.fillStyle = '#6E8079'; g.font = '400 23px Archivo, Arial';
      (P.dim || []).forEach(l => { g.fillText(l, 72, y); y += 34; });
    }
  }
  /* waveform footer — six segments, current one lit */
  for (let i = 0; i < 210; i++) {
    const t = i / 210, seg = Math.floor(t * 6);
    const env = .3 + .7 * Math.abs(Math.sin(t * 21) * Math.cos(t * 7));
    g.fillStyle = seg === curPage ? '#F03A22' : '#2E4A40';
    g.fillRect(70 + t * 880, 512 - env * 26, 3, env * 52);
  }
  screenTex.needsUpdate = true;
}
/* ---------- geometry ---------- */
function slab(w, d, h, r) {
  const s = new THREE.Shape();
  s.moveTo(-w / 2 + r, -d / 2);
  s.lineTo(w / 2 - r, -d / 2); s.quadraticCurveTo(w / 2, -d / 2, w / 2, -d / 2 + r);
  s.lineTo(w / 2, d / 2 - r); s.quadraticCurveTo(w / 2, d / 2, w / 2 - r, d / 2);
  s.lineTo(-w / 2 + r, d / 2); s.quadraticCurveTo(-w / 2, d / 2, -w / 2, d / 2 - r);
  s.lineTo(-w / 2, -d / 2 + r); s.quadraticCurveTo(-w / 2, -d / 2, -w / 2 + r, -d / 2);
  const g = new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: true, bevelThickness: .012, bevelSize: .012, bevelSegments: 3, curveSegments: 12 });
  g.rotateX(-Math.PI / 2); g.computeVertexNormals();
  return g;
}

const unit = new THREE.Group(); scene.add(unit);

/* chassis */
const chassisMat = new THREE.MeshPhysicalMaterial({
  color: 0x232528, metalness: .9, roughness: .34,
  clearcoat: .35, clearcoatRoughness: .5,
});
const chassis = new THREE.Mesh(slab(5.6, 3.28, .34, .09), chassisMat);
unit.add(chassis);

/* printed face (thin decal plane just above the metal) */
const relief = reliefMaps(1024, 598);
const faceMat = new THREE.MeshPhysicalMaterial({
  map: maps.albedo,
  normalMap: relief.normal, normalScale: new THREE.Vector2(1, 1),
  emissiveMap: maps.glow, emissive: 0xffffff, emissiveIntensity: 0,
  metalness: .85, roughness: .34, clearcoat: .3, clearcoatRoughness: .45,
});
const face = new THREE.Mesh(new THREE.PlaneGeometry(5.58, 3.26, 260, 152), faceMat);
face.rotation.x = -Math.PI / 2; face.position.y = .353; unit.add(face);

/* screen */
drawScreen();
const screenMat = new THREE.MeshBasicMaterial({ map: screenTex });
const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.94, 1.09), screenMat);
screen.rotation.x = -Math.PI / 2; screen.position.set(0, .452, -.65); unit.add(screen);
const bezel = new THREE.Mesh(slab(2.12, 1.27, .07, .03),
  new THREE.MeshPhysicalMaterial({ color: 0x0E0F10, metalness: .8, roughness: .3 }));
bezel.position.set(0, .341, -.65); unit.add(bezel);
const glow = new THREE.PointLight(0x7FD9B0, 2.4, 3.4, 2);
glow.position.set(0, .95, -.65); unit.add(glow);

/* ---------- the two decks ----------
   Sun raises the light, Moon puts it out. The rite performed with two hands: there is no
   Vigil knob, and the Pads carry navigation alone. */
/** Rays for the Sun, phases for the Moon — the face is the only thing that differs. */
function deck(x, kind) {
  const g = new THREE.Group(); g.position.set(x, .34, -.10); unit.add(g);
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(.98, .98, .1, 96, 1, false),
    new THREE.MeshPhysicalMaterial({ color: 0x8E8C84, metalness: 1, roughness: .22, clearcoat: .6 }));
  ring.position.y = .05; ring.userData.ctl = kind; g.add(ring);
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(.86, .86, .105, 128, 1),
    new THREE.MeshPhysicalMaterial({
      map: DECK[kind].alb, bumpMap: DECK[kind].bump, bumpScale: 4,
      metalness: kind === 'sun' ? .75 : .55, roughness: kind === 'sun' ? .30 : .44,
    }));
  plate.position.y = .056; plate.userData.ctl = kind; g.add(plate);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(.12, .12, .13, 48),
    new THREE.MeshPhysicalMaterial({ color: kind === 'sun' ? 0x2A2118 : 0x14161A, metalness: .9, roughness: .25 }));
  hub.position.y = .075; g.add(hub);
  return { group: g, ring, plate };
}
const moon = deck(-1.86, 'moon');
const sun = deck(1.86, 'sun');
const deckMats = [moon.plate.material, sun.plate.material];

/* pads */
const padMat = () => new THREE.MeshPhysicalMaterial({ color: 0x101112, metalness: .3, roughness: .55 });
const lampMats = [];
const padMeshes = [];
for (let i = 0; i < 6; i++) {
  const px = -.85 + i * .34;
  const p = new THREE.Mesh(slab(.30, .30, .07, .02), padMat());
  p.position.set(px, .34, .55);
  p.userData.ctl = 'pad'; p.userData.i = i; unit.add(p); padMeshes.push(p);
  const lm = new THREE.MeshBasicMaterial({ color: i === 0 ? 0xF03A22 : 0x3A100C });
  lampMats.push(lm);
  const lamp = new THREE.Mesh(new THREE.PlaneGeometry(.22, .032), lm);
  lamp.rotation.x = -Math.PI / 2; lamp.position.set(px, .437, .48); unit.add(lamp);
}

/* crossfader */
const slot = new THREE.Mesh(slab(1.10, .12, .04, .015),
  new THREE.MeshPhysicalMaterial({ color: 0x0C0D0E, metalness: .5, roughness: .6 }));
slot.position.set(0, .335, 1.16); unit.add(slot);
const cap = new THREE.Mesh(slab(.11, .24, .11, .02),
  new THREE.MeshPhysicalMaterial({ color: 0xB6B4AA, metalness: .7, roughness: .28 }));
cap.position.set(-.47 + .18 * .88, .35, 1.16); cap.userData.ctl = 'fader'; unit.add(cap);

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

/** Dark carved panelling: fielded panels under a run of blind Gothic arcading. */
function panelTexture(bump) {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 1024;
  const g = c.getContext('2d');
  const rnd = rng(5150);
  g.fillStyle = bump ? '#6a6a6a' : '#241A15'; g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 500; i++) {
    g.strokeStyle = bump ? `rgba(120,120,120,${rnd() * .1})` : `rgba(58,40,29,${.04 + rnd() * .12})`;
    g.lineWidth = .5 + rnd() * 1.6;
    const y = rnd() * 1024;
    g.beginPath(); g.moveTo(0, y);
    for (let x = 0; x <= 1024; x += 64) g.lineTo(x, y + (rnd() - .5) * 4);
    g.stroke();
  }
  /* blind arcade across the top half */
  const bays = 4, bw = 1024 / bays;
  for (let b = 0; b < bays; b++) {
    const x = b * bw + 18, w = bw - 36;
    g.strokeStyle = bump ? '#d8d8d8' : 'rgba(126,101,74,.55)';
    g.lineWidth = bump ? 7 : 4;
    g.beginPath();
    g.moveTo(x, 470); g.lineTo(x, 250);
    g.quadraticCurveTo(x + w / 2, 90, x + w, 250);
    g.lineTo(x + w, 470); g.closePath(); g.stroke();
    /* cusped head */
    g.lineWidth = bump ? 4 : 2.5;
    g.beginPath();
    g.moveTo(x + w * .16, 268);
    g.quadraticCurveTo(x + w / 2, 168, x + w * .84, 268);
    g.stroke();
    /* fielded panel below */
    g.strokeRect(x + 14, 520, w - 28, 430);
    g.strokeRect(x + 30, 540, w - 60, 390);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(5, 1.5);
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
  map: panelTexture(false), bumpMap: panelTexture(true), bumpScale: .9,
  color: 0x8A7A6A, roughness: .74, metalness: 0,
});

const floor = new THREE.Mesh(new THREE.PlaneGeometry(70, 70),
  new THREE.MeshPhysicalMaterial({
    map: woodTexture(false), bumpMap: woodTexture(true), bumpScale: .4,
    color: 0x6B584A, roughness: .62, metalness: 0, clearcoat: .25,
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

/** 1 while the candle burns, 0 once it is out. */
const candle = (v, from, to) => 1 - Math.min(1, Math.max(0, (v - from) / (to - from)));

/** When each candle dies. The rig light and its visible candle share a ramp. */
const RAMPS = [[.00, .34], [.28, .62], [.56, .94]];

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
function setPage(n) {
  curPage = (n + MODULES.length) % MODULES.length;
  lampMats.forEach((m, i) => m.color.setHex(i === curPage ? 0xF03A22 : 0x3A100C));
  drawScreen();
}
function setVigil(v) {
  vigil = Math.max(0, Math.min(1, v));
  applyVigil();
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
    if (c === 'fader') { active = 'fader'; startVal = xfVal; el.setPointerCapture(e.pointerId); setPage(1); return; }
    if (c === 'sun' || c === 'moon') {
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
    el.style.cursor = hit ? (hit.userData.ctl === 'pad' ? 'pointer'
      : hit.userData.ctl === 'fader' ? 'ew-resize' : 'grab') : 'grab';
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
    cap.position.x = -.47 + xfVal * .94;
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
      ART = img; regenFace();
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
]).then(regenFace);

/** Workbench hook: lets a browser session drive and verify the Unit without guessing pixels. */
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
  /** Tune the engraving: band width, wave count along the top run, line weight. */
  setEng(e) { ENG = { ...ENG, ...e }; regenFace(); },
  get eng() { return ENG; },
  get cam() { return { ...CAM, pos: camera.position.toArray().map(n => +n.toFixed(2)) }; },
  setCam(c) { Object.assign(CAM, c); placeCamera(); },
  parts: () => ({ cap, sun: sun.ring, moon: moon.ring, faceMat, face }),
  get title() { return TITLE; },
  get page() { return curPage; },
  get vigil() { return vigil; },
  get xf() { return xfVal; },
};

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
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
