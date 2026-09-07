/* ═══════════════════════════════════════════════════════════════════════
   HUDDI stage — floating ASCII chrome under/over the canvas
   Extracted from SynthStation ports-osd + shape-drag (2026-07-21 latest)

   Product hit-tests / SPEC / glyph layout stay in the app.
   This module owns: cell measure · snap · place · skins · cursors · float knobs.
   ═══════════════════════════════════════════════════════════════════════ */

import {
  applyGrid, cellPx, wirePointerDrag, DENS, FRAME_MS, clamp, fmt,
} from './huddi.js';

// ── cell + snap ──────────────────────────────────────────────────────

/**
 * Measure Silkscreen cell size from a probe element (or document --s).
 * @param {HTMLElement|null} [probe]
 * @returns {{ cw: number, ch: number }}
 */
export function measureCell(probe) {
  let cw = cellPx(probe);
  let ch = cw;
  const gc = probe?.querySelector?.('.gc');
  if (gc) {
    if (gc.offsetWidth > 0) cw = gc.offsetWidth;
    if (gc.offsetHeight > 0) ch = gc.offsetHeight;
  } else {
    const s = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--s')) || 2;
    cw = ch = 8 * s;
  }
  return { cw, ch };
}

/**
 * Snap a screen point to the ASCII cell centre grid.
 * @param {number} x
 * @param {number} y
 * @param {HTMLElement|null} [probe]
 */
export function snapToAscii(x, y, probe = null) {
  const { cw, ch } = measureCell(probe);
  const col = Math.round((x - cw * 0.5) / cw);
  const row = Math.round((y - ch * 0.5) / ch);
  return {
    col,
    row,
    x: col * cw + cw * 0.5,
    y: row * ch + ch * 0.5,
  };
}

/**
 * Position an absolute wrap so grip cell centre sits under (x,y). Full-res — no snap.
 * @param {HTMLElement} wrap
 * @param {number} x
 * @param {number} y
 * @param {number} gripCol 0-based
 * @param {number} gripRow 0-based
 * @param {number} cols block width in cells
 * @param {number} rows block height in cells
 * @param {HTMLElement|null} [probe]
 */
export function placeAtGrip(wrap, x, y, gripCol, gripRow, cols, rows, probe = null) {
  const { cw, ch } = measureCell(probe);
  const left = x - (gripCol + 0.5) * cw;
  const top = y - (gripRow + 0.5) * ch;
  wrap.style.display = 'block';
  wrap.style.position = 'absolute';
  wrap.style.width = `${cols * cw}px`;
  wrap.style.height = `${rows * ch}px`;
  wrap.style.transform = 'none';
  wrap.style.left = `${left}px`;
  wrap.style.top = `${top}px`;
  return { cw, ch, left, top };
}

/** Centre a cols×rows block on (x,y). */
export function placeCentered(wrap, x, y, cols, rows, probe = null) {
  const { cw, ch } = measureCell(probe);
  const left = Math.round(x - (cols * cw) / 2);
  const top = Math.round(y - (rows * ch) / 2);
  wrap.style.display = 'block';
  wrap.style.position = 'absolute';
  wrap.style.width = `${cols * cw}px`;
  wrap.style.left = `${left}px`;
  wrap.style.top = `${top}px`;
  return { cw, ch, left, top };
}

// ── stage layer ──────────────────────────────────────────────────────

/**
 * Full-bleed stage host for floating knobs (ports / shape handles).
 * @param {HTMLElement} parent
 * @param {string} id
 * @param {'ports'|'shape'|string} [kind]
 */
export function createStageLayer(parent, id, kind = 'ports') {
  let layer = document.getElementById(id);
  if (!layer) {
    layer = document.createElement('div');
    layer.id = id;
    parent.appendChild(layer);
  }
  layer.classList.add('huddi-stage', `huddi-stage-${kind}`);
  return layer;
}

/**
 * Generic float knob: optional readout above + body grid.
 * @param {HTMLElement} layer
 * @param {{
 *   id: string,
 *   className?: string,
 *   hit?: boolean,
 *   readout?: boolean,
 *   label?: boolean,
 *   value?: boolean,
 * }} opts
 */
export function createFloatKnob(layer, opts) {
  const {
    id,
    className = 'stage-knob',
    hit = true,
    readout = false,
    label = false,
    value = false,
  } = opts;

  const wrap = document.createElement('div');
  wrap.className = `${className}${hit ? ' hit' : ''}`;
  wrap.dataset.knob = id;
  wrap.style.display = 'none';
  wrap.style.position = 'absolute';
  wrap.style.left = '0';
  wrap.style.top = '0';

  let read = null;
  if (readout) {
    read = document.createElement('div');
    read.className = 'stage-readout pad-readout';
    read.style.display = 'none';
    read.style.position = 'absolute';
    read.style.left = '0';
    read.style.bottom = '100%';
    read.style.pointerEvents = 'none';
    read.style.lineHeight = '1';
    wrap.appendChild(read);
  }

  let labelEl = null;
  if (label) {
    labelEl = document.createElement('div');
    labelEl.className = 'stage-readout';
    wrap.appendChild(labelEl);
  }

  let valueEl = null;
  if (value) {
    valueEl = document.createElement('div');
    valueEl.className = 'stage-readout';
    wrap.appendChild(valueEl);
  }

  const grid = document.createElement('div');
  grid.className = 'stage-knob-grid';
  wrap.appendChild(grid);
  layer.appendChild(wrap);

  return { id, wrap, grid, read, label: labelEl, value: valueEl };
}

// ── shimmer hide (ephemeral readouts) ────────────────────────────────

/**
 * Paint lines then schedule density shimmer-out hide.
 * @param {HTMLElement} el
 * @param {string[]} lines
 * @param {{ hideMs?: number, cutout?: boolean }} [opts]
 */
export function showReadoutLines(el, lines, opts = {}) {
  if (!el) return;
  const hideMs = opts.hideMs ?? 700;
  if (el._hideTimer) {
    clearTimeout(el._hideTimer);
    el._hideTimer = 0;
  }
  if (el._anim) {
    el._anim.forEach(clearTimeout);
    el._anim = [];
  }
  el._gen = (el._gen || 0) + 1;
  el.style.display = 'block';
  el.__shimmering = false;
  // cutout while drag — whole readout block matches port body invert language
  applyGrid(el, lines.join('\n'), { cutout: !!opts.cutout });
  el._lines0 = lines.map(String);
  return el._gen;
}

export function scheduleHideReadout(el, hideMs = 700) {
  if (!el) return;
  if (el._hideTimer) clearTimeout(el._hideTimer);
  const g = (el._gen = (el._gen || 0) + 1);
  const lines0 = el._lines0 || [' '];
  el._hideTimer = setTimeout(() => {
    if (g !== el._gen) return;
    const ramp = [...DENS].reverse();
    const FRM = FRAME_MS / 2;
    el.__shimmering = true;
    el._anim = [];
    ramp.forEach((d, fi) => {
      el._anim.push(setTimeout(() => {
        if (g !== el._gen) return;
        const masked = lines0.map((ln) =>
          [...String(ln)].map((c) => (c === ' ' ? ' ' : d)).join(''),
        ).join('\n');
        applyGrid(el, masked, {});
      }, fi * FRM));
    });
    el._anim.push(setTimeout(() => {
      if (g !== el._gen) return;
      el.__shimmering = false;
      el.style.display = 'none';
      applyGrid(el, lines0.map(() => ' ').join('\n'), {});
    }, ramp.length * FRM + 40));
  }, hideMs);
}

export function hideReadoutNow(el) {
  if (!el) return;
  if (el._hideTimer) clearTimeout(el._hideTimer);
  if (el._anim) el._anim.forEach(clearTimeout);
  el._gen = (el._gen || 0) + 1;
  el.style.display = 'none';
}

// ── port skins (idle 3×3 · grip bottom mid) ───────────────────────────

export const PORT_COLS = 3;
export const PORT_ROWS = 3;
/** Idle rest: centre empty cell over host point */
export const PORT_CENTER_COL = 1;
export const PORT_CENTER_ROW = 1;
/** Drag grip (PC + touch): 2nd char of last line */
export const PORT_GRIP_COL = 1;
export const PORT_GRIP_ROW = 2;

/**
 * Port body — no corner dots.
 *   ░
 * ░   ░   centre space = visual hole
 *   ░     bottom-mid = grip while dragging
 */
export function portBody(hot = false) {
  const f = hot ? '▓' : '░';
  return [
    ` ${f} `,
    `${f} ${f}`,
    ` ${f} `,
  ].join('\n');
}

/**
 * Single cutout policy for math ports (product lock):
 *   hot → 3×3 crosshair body cutout · readout text **uncut**
 *   idle → no cutout
 * SS ports-osd and createPortKnobs both call this — do not fork.
 *
 * @param {{ grid: HTMLElement, read?: HTMLElement|null }} knob
 * @param {boolean} hot
 * @param {object} [meta] readout meta when hot
 * @param {{ hideMs?: number }} [opts]
 */
export function paintPortVisual(knob, hot, meta = {}, opts = {}) {
  if (!knob?.grid) return;
  applyGrid(knob.grid, portBody(hot), hot ? { cutout: true } : {});
  if (hot && knob.read) {
    showReadoutLines(knob.read, portReadoutLines(meta), {
      cutout: false,
      hideMs: opts.hideMs,
    });
  }
}

/**
 * @param {{ glyphId?: string, u?: number, v?: number }} meta
 * @returns {string[]}
 */
export function portReadoutLines(meta = {}) {
  const id2 = String(meta.glyphId || '··').slice(0, 2).padEnd(2, '·');
  const u = String(Math.round(clamp(meta.u ?? 0, 0, 1) * 99)).padStart(2, '0');
  const v = String(Math.round(clamp(meta.v ?? 0, 0, 1) * 99)).padStart(2, '0');
  // Strict 3-col block width (readout uncut — see paintPortVisual)
  return [
    id2.padEnd(PORT_COLS).slice(0, PORT_COLS),
    `${u}${v}`.slice(0, PORT_COLS).padEnd(PORT_COLS),
  ];
}

/**
 * Mount a dragable port knob pair (or custom ids). Product supplies commit/active.
 * @param {HTMLElement} layer
 * @param {{
 *   ids?: string[],
 *   active?: () => boolean,
 *   onDrag?: (id: string, x: number, y: number, hot: boolean) => void,
 *   onEnd?: (id: string, x: number, y: number, snapped: {x,y,col,row}) => void,
 *   metaFor?: (id: string) => object,
 *   positionFor?: (id: string) => {x:number,y:number}|null,
 * }} handlers
 */
export function createPortKnobs(layer, handlers = {}) {
  const ids = handlers.ids || ['TR', 'BL'];
  /** @type {Record<string, ReturnType<typeof createFloatKnob>>} */
  const knobs = {};
  let dragLive = null;

  for (const id of ids) {
    const knob = createFloatKnob(layer, {
      id,
      className: 'port-knob stage-knob',
      hit: true,
      readout: true,
    });
    knobs[id] = knob;

    wirePointerDrag(knob.wrap, {
      accept: (e) => (handlers.active ? handlers.active(e) : true),
      onStart: (e) => {
        knob.wrap.classList.add('dragging');
        paintPort(id, e.clientX, e.clientY, true);
      },
      onMove: (e) => paintPort(id, e.clientX, e.clientY, true),
      onEnd: (e) => {
        if (e && e.clientX != null) {
          paintPort(id, e.clientX, e.clientY, false);
          const s = snapToAscii(e.clientX, e.clientY, knob.grid);
          handlers.onEnd?.(id, e.clientX, e.clientY, s);
        }
        dragLive = null;
        knob.wrap.classList.remove('dragging');
        if (knob.read) scheduleHideReadout(knob.read);
        paintIdle();
      },
    });
  }

  function paintPort(id, clientX, clientY, hot) {
    dragLive = { id, x: clientX, y: clientY };
    handlers.onDrag?.(id, clientX, clientY, hot);
    const knob = knobs[id];
    if (!knob) return;
    placeAtGrip(
      knob.wrap, clientX, clientY,
      PORT_GRIP_COL, PORT_GRIP_ROW, PORT_COLS, PORT_ROWS, knob.grid,
    );
    // Hit only while dragging — idle ports are pointer-events none via CSS
    knob.wrap.style.pointerEvents = hot ? 'auto' : '';
    paintPortVisual(knob, hot, handlers.metaFor?.(id) || {});
  }

  function placeIdle(id, hot = false) {
    const knob = knobs[id];
    if (!knob) return;
    const p = handlers.positionFor?.(id);
    if (!p) {
      knob.wrap.style.display = 'none';
      hideReadoutNow(knob.read);
      return;
    }
    placeAtGrip(
      knob.wrap, p.x, p.y,
      PORT_CENTER_COL, PORT_CENTER_ROW, PORT_COLS, PORT_ROWS, knobs[id].grid,
    );
    knob.wrap.style.pointerEvents = 'auto';
    paintPortVisual(knob, hot, handlers.metaFor?.(id) || {});
  }

  function paintIdle() {
    if (handlers.active && !handlers.active()) {
      for (const id of ids) {
        knobs[id].wrap.style.display = 'none';
        hideReadoutNow(knobs[id].read);
      }
      dragLive = null;
      return;
    }
    if (dragLive) {
      for (const id of ids) {
        if (id === dragLive.id) paintPort(id, dragLive.x, dragLive.y, true);
        else placeIdle(id, false);
      }
      return;
    }
    for (const id of ids) {
      const p = handlers.positionFor?.(id);
      if (p) {
        const s = snapToAscii(p.x, p.y, knobs[id].grid);
        // write-back via onEnd-like soft snap optional — paint only
        placeAtGrip(
          knobs[id].wrap, s.x, s.y,
          PORT_CENTER_COL, PORT_CENTER_ROW, PORT_COLS, PORT_ROWS, knobs[id].grid,
        );
        knobs[id].wrap.style.pointerEvents = 'auto';
        paintPortVisual(knobs[id], false);
      } else {
        knobs[id].wrap.style.display = 'none';
      }
    }
  }

  return {
    knobs,
    paint: paintIdle,
    paintPort,
    isDragging: () => !!dragLive,
    dragId: () => dragLive?.id || null,
  };
}

// ── shape handle skins (LED · KRN · HGT · WDT · ASP) ─────────────────

export const SHAPE = {
  LED_W: 8,
  HGT_W: 8,
  KRN_W: 2,
  KRN_H: 3,
  KRN_LAB: 7,
  WDT_LAB: 4,
  ASP_LAB: 4,
  BLINK_MS: 130, // keep in sync with FAST_BLINK_MS in huddi.js
};

/** Ready blink phase (130ms). */
export function readyPhase(ms = SHAPE.BLINK_MS) {
  return Math.floor(performance.now() / ms) % 2 === 1;
}

/**
 * Apply ready-state blink opts for a kind.
 * LED·HGT·ASP → cutout; KRN·WDT → invertRange on body pad.
 */
export function readyOpts(kind, hot, ready, invertRange = null) {
  if (hot || !ready || !readyPhase()) return {};
  if (kind === 'krn' || kind === 'wdt') {
    return invertRange ? { invertRange } : {};
  }
  return { cutout: true };
}

export function skinLedBody(hot = false) {
  return (hot ? '▓' : '░').repeat(SHAPE.LED_W);
}

export function skinLedLabel(value) {
  const v = typeof value === 'number' ? (+value).toFixed(2) : String(value);
  return (`LED ${v}`).slice(0, SHAPE.LED_W).padEnd(SHAPE.LED_W);
}

export function skinHgtBody(hot = false) {
  return (hot ? '▓' : '░').repeat(SHAPE.HGT_W);
}

export function skinHgtLabel(value) {
  const v = typeof value === 'number' ? (+value).toFixed(2) : String(value);
  return (`HGT ${v}`).slice(0, SHAPE.HGT_W).padEnd(SHAPE.HGT_W);
}

export function skinKrnLabel() {
  return '< KRN >'.padEnd(SHAPE.KRN_LAB).slice(0, SHAPE.KRN_LAB);
}

export function skinKrnValue(tracking) {
  const trk = tracking ?? 0;
  const valStr = (trk >= 0 ? '+' : '') + (trk * 100).toFixed(0);
  return valStr.padStart(SHAPE.KRN_LAB).slice(-SHAPE.KRN_LAB);
}

export function skinKrnBody(hot = false) {
  const f = hot ? '▓' : '░';
  const pad = Math.floor((SHAPE.KRN_LAB - SHAPE.KRN_W) / 2);
  const row = ' '.repeat(pad) + f.repeat(SHAPE.KRN_W) + ' '.repeat(SHAPE.KRN_LAB - pad - SHAPE.KRN_W);
  return {
    text: [row, row, row].join('\n'),
    invertRange: [pad, pad + SHAPE.KRN_W],
  };
}

export function skinWdtLabel() {
  return 'WDT '.slice(0, SHAPE.WDT_LAB).padEnd(SHAPE.WDT_LAB);
}

export function skinWdtValue(wide) {
  return (+wide).toFixed(2).padStart(SHAPE.WDT_LAB).slice(-SHAPE.WDT_LAB);
}

export function skinWdtBody(hot = false) {
  const f = hot ? '▓' : '░';
  const pad = Math.floor((SHAPE.WDT_LAB - 2) / 2);
  const row = ' '.repeat(pad) + f.repeat(2) + ' '.repeat(SHAPE.WDT_LAB - pad - 2);
  return {
    text: [row, row, row].join('\n'),
    invertRange: [pad, pad + 2],
  };
}

/**
 * ASP corner glyph — 4 filled + 2 angled on second row.
 * @param {'NW'|'NE'|'SW'|'SE'} corner
 */
export function skinAspBody(corner, hot = false) {
  const f = hot ? '▓' : '░';
  const full = f.repeat(4);
  const halfL = f.repeat(2) + '  ';
  const halfR = '  ' + f.repeat(2);
  if (corner === 'NW') return `${full}\n${halfL}`;
  if (corner === 'NE') return `${full}\n${halfR}`;
  if (corner === 'SW') return `${halfL}\n${full}`;
  return `${halfR}\n${full}`;
}

export function skinAspLabel(asp) {
  return (`A${(+asp).toFixed(2)}`).padEnd(SHAPE.ASP_LAB).slice(0, SHAPE.ASP_LAB);
}

// ── cursors ──────────────────────────────────────────────────────────

/** CSS cursor for math ports. */
export function portCursor(hover, drag) {
  if (drag) return 'grabbing';
  if (hover) return 'grab';
  return '';
}

/**
 * CSS cursor for shape handles.
 * @param {string|null} kind  'lead'|'track'|'hgt'|'wdt'|'asp'
 * @param {string|null} [corner] for asp
 * @param {boolean} [armed]
 */
export function shapeCursor(kind, corner = null, armed = false) {
  if (!kind) return '';
  if (kind === 'asp') {
    return (corner === 'NE' || corner === 'SW') ? 'nesw-resize' : 'nwse-resize';
  }
  if (kind === 'track' || kind === 'wdt') return 'ew-resize';
  // lead, hgt
  return 'ns-resize';
}

// ── paint helpers for shape knobs ────────────────────────────────────

/**
 * Paint a standard shape float knob (label + optional value + bar).
 * @param {ReturnType<typeof createFloatKnob>} knob
 * @param {{
 *   x: number, y: number,
 *   cols: number,
 *   labelText?: string,
 *   valueText?: string|null,
 *   body: string,
 *   bodyOpts?: object,
 *   offsetRows?: number,  // extra rows above body for label stack
 *   bodyRows?: number,
 * }} layout
 */
export function paintShapeKnob(knob, layout) {
  if (!knob) return;
  const {
    x, y, cols,
    labelText = null,
    valueText = null,
    body,
    bodyOpts = {},
    offsetRows = 1,
    bodyRows = 1,
  } = layout;
  const { cw, ch } = measureCell(knob.grid);
  const left = Math.round(x - (cols * cw) / 2);
  const top = Math.round(y - (bodyRows * ch) / 2 - offsetRows * ch);
  knob.wrap.style.display = 'block';
  knob.wrap.style.left = `${left}px`;
  knob.wrap.style.top = `${top}px`;
  knob.wrap.style.width = `${cols * cw}px`;
  if (knob.label && labelText != null) {
    knob.label.style.display = 'block';
    applyGrid(knob.label, labelText, {});
  }
  if (knob.value) {
    if (valueText != null) {
      knob.value.style.display = 'block';
      applyGrid(knob.value, valueText, {});
    } else {
      knob.value.style.display = 'none';
    }
  }
  applyGrid(knob.grid, body, bodyOpts);
}

export function hideKnob(knob) {
  if (knob?.wrap) knob.wrap.style.display = 'none';
}

/** Re-export drag wire for stage consumers that only import stage. */
export { wirePointerDrag, applyGrid, clamp, fmt };
