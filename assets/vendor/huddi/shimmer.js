/* ═══════════════════════════════════════════════════════════════════════
   HUDDI shimmer — pure tokens, presets, phase math
   Runtime wiring (shimmerFrom / densityRow) stays in huddi.js createHuddi.
   Design: docs/SHIMMER.md · product freeze: docs/SS-SESSION-STATE.md
   ═══════════════════════════════════════════════════════════════════════ */

export const WAVE_MS = 140;
export const CELL_MS = 64;
export const FILL_MS = 80;
/** Default scramble decode budget per cell after wave hits (labels). Independent of fillMs. */
export const SCRAMBLE_MS = 90;
/** How long scramble lingers after decode window (trail / decay). */
export const SCRAMBLE_TRAIL_MS = 40;
/** ± random factor on scrambleMs (0 = none, 0.35 = legacy WORD_VAR-ish). */
export const SCRAMBLE_VAR = 0.2;
/**
 * Default max wall-clock for serial unit cascade when using cascadeMs.
 * stepMs_eff = min(stepMs, cascadeMs / (N-1)) — keeps long menus snappy.
 */
export const CASCADE_MS = 50;
/**
 * Menu two-phase: bodies start this many ms after headers begin (option A offset).
 * Keep &lt; 30 for slight delay / overlap feel.
 */
export const MENU_PHASE2_AT_MS = 20;

// ── scan / stagger tokens ─────────────────────────────────────────────

/** Cell dens scan inside one multi-line grid (local phase). */
export const SHIMMER_SCAN = Object.freeze({
  LTR: 'ltr',             // → columns left→right (default)
  RTL: 'rtl',             // ← columns right→left
  TTB: 'ttb',             // ↓ rows top→bottom
  BTT: 'btt',             // ↑ rows bottom→top
  INDEX: 'index',         // string-order dens index (legacy)
  DIAG_TL_BR: 'diag-tl-br', // ↘ top-left → bottom-right
  DIAG_TR_BL: 'diag-tr-bl', // ↙ top-right → bottom-left
  DIAG_BL_TR: 'diag-bl-tr', // ↗ bottom-left → top-right
  DIAG_BR_TL: 'diag-br-tl', // ↖ bottom-right → top-left
  RADIAL_OUT: 'radial-out', // center first → corners
  RADIAL_IN: 'radial-in',   // corners first → center
});

/** Unit stagger across a list (global delay wave). */
export const SHIMMER_STAGGER = Object.freeze({
  VERTICAL: 'vertical',     // top→bottom by cy
  HORIZONTAL: 'horizontal', // left→right by cx
  RADIAL: 'radial',         // distance from origin
  SERIAL: 'serial',         // list order (guaranteed offset even if rects stack)
  FROM_BL: 'from-bl',       // origin BL of unit bbox → wave toward TR
  FROM_BR: 'from-br',
  FROM_TL: 'from-tl',
  FROM_TR: 'from-tr',
  FROM_LEFT: 'from-left',
  FROM_RIGHT: 'from-right',
  FROM_TOP: 'from-top',
  FROM_BOTTOM: 'from-bottom',
});

/**
 * Named product presets — compose stagger + scan (+ force / timing).
 * Override any field: `{ ...SHIMMER.trkIn, waveMs: 200 }`.
 *
 * Timing axes (independent):
 *   stepMs / cascadeMs / waveMs — when each unit starts
 *     cascadeMs: cap total serial chain (step_eff = min(stepMs, cascadeMs/(N-1)))
 *   fillMs / cellMs             — dens chrome sweep (grids)
 *   scrambleMs / trail          — label scramble after wave hits
 *
 * Product locks (SynthStation):
 *   TRK  = diagUp / trkProduct  (fixed stepMs 20, no cascade cap)
 *   Menu = menuOpen / menuBloom (stepMs 15 max · cascadeMs 50)
 */
const _diagUp = Object.freeze({
  stagger: SHIMMER_STAGGER.SERIAL,
  scan: SHIMMER_SCAN.DIAG_BL_TR,
  force: true,
  face: 'ghost',
  waveMs: 0,   // no spatial slow-cascade
  stepMs: 20,  // joy → XY → spd: fixed 20ms kicks (no cascadeMs)
  fillMs: FILL_MS,
  cellMs: CELL_MS,
  jitterMs: 0,
});

/** Menu bloom from TR — product menu open (auto dens chrome + scramble labels). */
const _menuBloom = Object.freeze({
  stagger: SHIMMER_STAGGER.RADIAL,
  scan: SHIMMER_SCAN.RADIAL_OUT,
  face: 'ghost',
  waveMs: 0,
  stepMs: 15,            // max gap when few rows
  cascadeMs: CASCADE_MS, // whole list starts within ~50ms when N is large
  fillMs: FILL_MS,
  cellMs: CELL_MS,
  scrambleMs: SCRAMBLE_MS,
  scrambleTrailMs: SCRAMBLE_TRAIL_MS,
  scrambleVar: SCRAMBLE_VAR,
  jitterMs: 0,
  vocab: 'auto',       // dens grids · scramble labels
});

export const SHIMMER = Object.freeze({
  /**
   * Product menu open = bloom from TR (pass origin = menu TR).
   * dens chrome + scramble labels · ghost-first · cascade budget
   */
  menuOpen: _menuBloom,
  /** Alias / gallery name for menu open recipe */
  menuBloom: _menuBloom,
  /** TRK pad strip: wave BL→TR, dens → ; slight unit offset, keep snappy */
  trkIn: Object.freeze({
    stagger: SHIMMER_STAGGER.FROM_BL,
    scan: SHIMMER_SCAN.LTR,
    force: true,
    face: 'ghost',
    waveMs: WAVE_MS, // 140 — same as original snappy wave
    fillMs: FILL_MS,  // 80
    jitterMs: 14,     // light desync only (not a slow cascade)
  }),
  /** Accordion expand: radial from click / origin */
  expand: Object.freeze({
    stagger: SHIMMER_STAGGER.RADIAL,
    scan: SHIMMER_SCAN.LTR,
    face: 'ghost',
    waveMs: 0,
    stepMs: 15,
    cascadeMs: CASCADE_MS,
    fillMs: FILL_MS,
    cellMs: CELL_MS,
    scrambleMs: SCRAMBLE_MS,
    scrambleTrailMs: SCRAMBLE_TRAIL_MS,
    scrambleVar: SCRAMBLE_VAR,
    jitterMs: 0,
    vocab: 'auto',
  }),
  /** Full menu dens → left-to-right units */
  menuLtr: Object.freeze({
    stagger: SHIMMER_STAGGER.HORIZONTAL,
    scan: SHIMMER_SCAN.LTR,
    face: 'ghost',
    waveMs: 0,
    stepMs: 15,
    cascadeMs: CASCADE_MS,
    fillMs: FILL_MS,
    scrambleMs: SCRAMBLE_MS,
    scrambleTrailMs: SCRAMBLE_TRAIL_MS,
    jitterMs: 0,
    vocab: 'auto',
  }),
  /**
   * Menu candidate B — dens ↙ from TR (snappy chain, auto vocab).
   * Preview / alternate to menuBloom.
   */
  menuDiagTR: Object.freeze({
    stagger: SHIMMER_STAGGER.FROM_TR,
    scan: SHIMMER_SCAN.DIAG_TR_BL,
    face: 'ghost',
    waveMs: 0,
    stepMs: 15,
    cascadeMs: CASCADE_MS,
    fillMs: FILL_MS,
    cellMs: CELL_MS,
    scrambleMs: SCRAMBLE_MS,
    scrambleTrailMs: SCRAMBLE_TRAIL_MS,
    scrambleVar: SCRAMBLE_VAR,
    jitterMs: 0,
    vocab: 'auto',
  }),
  /** Diagonal dens ↘ + serial unit cascade (demo) */
  diagDown: Object.freeze({
    stagger: SHIMMER_STAGGER.SERIAL,
    scan: SHIMMER_SCAN.DIAG_TL_BR,
    force: true,
    waveMs: 160,
    jitterMs: 12,
  }),
  /**
   * Product TRK dens ↗ — full dens speed; 30ms serial between joy → XY → SPD.
   * SS consumes this as-is; do not re-wrap overrides in product chrome.
   */
  diagUp: _diagUp,
  /** Alias of diagUp — greppable product lock name */
  trkProduct: _diagUp,
  /** Bloom from center of each grid */
  bloom: Object.freeze({
    stagger: SHIMMER_STAGGER.FROM_BL,
    scan: SHIMMER_SCAN.RADIAL_OUT,
    force: true,
    waveMs: 160,
    fillMs: 90,
    jitterMs: 12,
  }),
  /** Collapse into center */
  implosion: Object.freeze({
    stagger: SHIMMER_STAGGER.SERIAL,
    scan: SHIMMER_SCAN.RADIAL_IN,
    force: true,
    waveMs: 150,
    fillMs: 90,
    jitterMs: 10,
  }),
  /** Rain: top→down units, dens top→bottom */
  rain: Object.freeze({
    stagger: SHIMMER_STAGGER.VERTICAL,
    scan: SHIMMER_SCAN.TTB,
    force: true,
    waveMs: WAVE_MS,
    jitterMs: 12,
  }),
  /** Reverse wind ← */
  windRtl: Object.freeze({
    stagger: SHIMMER_STAGGER.FROM_RIGHT,
    scan: SHIMMER_SCAN.RTL,
    force: true,
    waveMs: WAVE_MS,
    jitterMs: 12,
  }),
});

/**
 * Gallery for live demos — SS / framework Shift+S.
 * `originCorner` — optional; preview resolves origin from menu (#menu) or TRK (#trk).
 * Entries with `demo: true` are slow spatial demos (not product feel).
 * Each entry: { id, label, opts, demo?, originCorner? }
 */
export const SHIMMER_GALLERY = Object.freeze([
  { id: 'trkIn', label: 'TRK bl→tr dens→', opts: SHIMMER.trkIn },
  { id: 'diagUp', label: 'diag ↗ product TRK', opts: SHIMMER.diagUp },
  // Product menu open = menuBloom; menuDiagTR = alternate
  {
    id: 'menuBloom',
    label: 'menu bloom TR (product)',
    opts: SHIMMER.menuBloom,
    originCorner: 'tr',
  },
  {
    id: 'menuDiagTR',
    label: 'menu diag ↙ from TR',
    opts: SHIMMER.menuDiagTR,
    originCorner: 'tr',
  },
  { id: 'menuLtr', label: 'menu horizontal →', opts: SHIMMER.menuLtr, originCorner: 'tr' },
  { id: 'diagDown', label: 'diag ↘ serial', opts: SHIMMER.diagDown, demo: true },
  { id: 'bloom', label: 'bloom center→out', opts: SHIMMER.bloom, demo: true },
  { id: 'implosion', label: 'implode corners→in', opts: SHIMMER.implosion, demo: true },
  { id: 'rain', label: 'rain ↓', opts: SHIMMER.rain },
  { id: 'windRtl', label: 'wind ←', opts: SHIMMER.windRtl },
  {
    id: 'diag-tr-bl',
    label: 'diag ↙ from-tr (slow demo)',
    demo: true,
    opts: Object.freeze({
      stagger: SHIMMER_STAGGER.FROM_TR,
      scan: SHIMMER_SCAN.DIAG_TR_BL,
      force: true,
      waveMs: 250,
      jitterMs: 28,
    }),
  },
  {
    id: 'serial-ltr',
    label: 'serial cascade dens→ (slow demo)',
    demo: true,
    opts: Object.freeze({
      stagger: SHIMMER_STAGGER.SERIAL,
      scan: SHIMMER_SCAN.LTR,
      force: true,
      waveMs: 280,
      jitterMs: 0,
    }),
  },
]);

/**
 * Corner / edge origin from a DOMRect or element.
 * @param {DOMRect|{left:number,top:number,right:number,bottom:number,width?:number,height?:number}} rect
 * @param {'bl'|'br'|'tl'|'tr'|'c'|'left'|'right'|'top'|'bottom'} [corner='bl']
 * @returns {{x:number,y:number}}
 */
export function shimmerOriginCorner(rect, corner = 'bl') {
  const r = rect?.getBoundingClientRect ? rect.getBoundingClientRect() : rect;
  const cx = (r.left + r.right) / 2;
  const cy = (r.top + r.bottom) / 2;
  switch (corner) {
    case 'br': return { x: r.right, y: r.bottom };
    case 'tl': return { x: r.left, y: r.top };
    case 'tr': return { x: r.right, y: r.top };
    case 'c': return { x: cx, y: cy };
    case 'left': return { x: r.left, y: cy };
    case 'right': return { x: r.right, y: cy };
    case 'top': return { x: cx, y: r.top };
    case 'bottom': return { x: cx, y: r.bottom };
    case 'bl':
    default: return { x: r.left, y: r.bottom };
  }
}

/**
 * Local dens phase 0..1 for one cell (scan direction inside a grid).
 * @param {number} col 0-based
 * @param {number} row 0-based
 * @param {number} maxCol
 * @param {number} maxRow
 * @param {number} densIndex index among non-space dens cells
 * @param {number} densN total dens cells
 * @param {string} [scan='ltr']
 */
export function densCellPhase(col, row, maxCol, maxRow, densIndex, densN, scan = SHIMMER_SCAN.LTR) {
  const mc = Math.max(1, maxCol);
  const mr = Math.max(1, maxRow);
  const dn = Math.max(1, densN);
  const u = mc <= 1 ? 0 : col / (mc - 1);
  const v = mr <= 1 ? 0 : row / (mr - 1);
  switch (scan) {
    case SHIMMER_SCAN.RTL:
      return mc <= 1 ? 0 : (mc - 1 - col) / mc;
    case SHIMMER_SCAN.TTB:
      return mr <= 1 ? 0 : row / mr;
    case SHIMMER_SCAN.BTT:
      return mr <= 1 ? 0 : (mr - 1 - row) / mr;
    case SHIMMER_SCAN.INDEX:
      return densIndex / dn;
    case SHIMMER_SCAN.DIAG_TL_BR:
      return (u + v) / 2; // ↘
    case SHIMMER_SCAN.DIAG_TR_BL:
      return ((1 - u) + v) / 2; // ↙
    case SHIMMER_SCAN.DIAG_BL_TR:
      return (u + (1 - v)) / 2; // ↗
    case SHIMMER_SCAN.DIAG_BR_TL:
      return ((1 - u) + (1 - v)) / 2; // ↖
    case SHIMMER_SCAN.RADIAL_OUT: {
      const d = Math.hypot(u - 0.5, v - 0.5);
      return Math.min(1, d / Math.SQRT1_2);
    }
    case SHIMMER_SCAN.RADIAL_IN: {
      const d = Math.hypot(u - 0.5, v - 0.5);
      return 1 - Math.min(1, d / Math.SQRT1_2);
    }
    case SHIMMER_SCAN.LTR:
    default:
      return col / mc;
  }
}

/**
 * Unit stagger distances from rect centers.
 * @param {{cx:number,cy:number}[]} rects
 * @param {{ stagger?: string, origin?: {x:number,y:number}|null }} [opts]
 * @returns {{ dists: number[], origin: {x:number,y:number}, dMax: number }}
 */
export function staggerDistances(rects, opts = {}) {
  if (!rects.length) {
    return { dists: [], origin: { x: 0, y: 0 }, dMax: 1 };
  }
  const xs = rects.map((p) => p.cx);
  const ys = rects.map((p) => p.cy);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const midX = (minX + maxX) / 2;
  const midY = (minY + maxY) / 2;

  let stagger = opts.stagger || null;
  let origin = opts.origin || null;

  // List order — guaranteed mutual offset even if rects coincide
  if (stagger === SHIMMER_STAGGER.SERIAL || stagger === 'serial') {
    const dists = rects.map((_, i) => i);
    const dMax = Math.max(1, rects.length - 1);
    return { dists, origin: origin || { x: minX, y: minY }, dMax };
  }

  const presetOrigin = {
    [SHIMMER_STAGGER.FROM_BL]: { x: minX, y: maxY },
    [SHIMMER_STAGGER.FROM_BR]: { x: maxX, y: maxY },
    [SHIMMER_STAGGER.FROM_TL]: { x: minX, y: minY },
    [SHIMMER_STAGGER.FROM_TR]: { x: maxX, y: minY },
    [SHIMMER_STAGGER.FROM_LEFT]: { x: minX, y: midY },
    [SHIMMER_STAGGER.FROM_RIGHT]: { x: maxX, y: midY },
    [SHIMMER_STAGGER.FROM_TOP]: { x: midX, y: minY },
    [SHIMMER_STAGGER.FROM_BOTTOM]: { x: midX, y: maxY },
  };
  if (stagger && presetOrigin[stagger]) {
    origin = presetOrigin[stagger];
    stagger = SHIMMER_STAGGER.RADIAL;
  }

  if (!stagger) {
    stagger = origin ? SHIMMER_STAGGER.RADIAL : SHIMMER_STAGGER.VERTICAL;
  }
  if (!origin) {
    if (stagger === SHIMMER_STAGGER.HORIZONTAL) origin = { x: minX, y: midY };
    else if (stagger === SHIMMER_STAGGER.RADIAL) origin = { x: minX, y: minY };
    else origin = { x: midX, y: minY }; // vertical: top
  }

  let dists = rects.map((p) => {
    if (stagger === SHIMMER_STAGGER.HORIZONTAL || stagger === 'horizontal') {
      return Math.abs(p.cx - origin.x);
    }
    if (stagger === SHIMMER_STAGGER.RADIAL || stagger === 'radial') {
      return Math.hypot(p.cx - origin.x, p.cy - origin.y);
    }
    return Math.abs(p.cy - origin.y);
  });

  // If units share nearly the same distance (stacked rects), blend serial index
  const span = Math.max(...dists) - Math.min(...dists);
  if (rects.length > 1 && span < 4) {
    const n = rects.length - 1;
    dists = dists.map((d, i) => d + (i / n) * 12);
  }

  const dMax = Math.max(1, ...dists);
  return { dists, origin, dMax };
}

/**
 * Effective serial step for N units.
 * - stepMs only → fixed gap (TRK: 30)
 * - cascadeMs only → cascadeMs / (N-1)
 * - both → min(stepMs, cascadeMs / (N-1))  // cap long lists, keep max when few
 *
 * @param {number} n unit count
 * @param {{ stepMs?: number, cascadeMs?: number }} [opts]
 * @returns {number}
 */
export function resolveStepMs(n, opts = {}) {
  const count = Math.max(1, n | 0);
  const denom = Math.max(1, count - 1);
  const stepMs = opts.stepMs != null ? opts.stepMs : 0;
  const cascadeMs = opts.cascadeMs != null ? opts.cascadeMs : 0;
  if (cascadeMs > 0 && stepMs > 0) {
    return Math.min(stepMs, cascadeMs / denom);
  }
  if (cascadeMs > 0) return cascadeMs / denom;
  return stepMs > 0 ? stepMs : 0;
}

/**
 * Pure unit delay (ms) for index i — serial step + spatial wave + jitter.
 * Pass already-resolved stepMs (see resolveStepMs).
 *
 * @param {number} i unit index
 * @param {number} dist distance for this unit
 * @param {number} dMax max distance (normalize)
 * @param {{ stepMs?: number, waveMs?: number, jitter?: number }} [opts]
 * @returns {number}
 */
export function computeShimmerDelay(i, dist, dMax, opts = {}) {
  const stepMs = opts.stepMs != null ? opts.stepMs : 0;
  const waveMs = opts.waveMs != null ? opts.waveMs : 0;
  const jitter = opts.jitter != null ? opts.jitter : 0;
  const spatial = waveMs > 0 ? (dist / Math.max(1, dMax)) * waveMs : 0;
  const serial = stepMs > 0 ? i * stepMs : 0;
  return Math.max(0, serial + spatial + jitter);
}
