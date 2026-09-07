/* ═══════════════════════════════════════════════════════════════════════
   HUDDI v0.2 — drop-in ASCII OSD kit + stage framework
   Menu chrome: createHuddi builders (slider/notch/joy/XY/VBar/…)
   Stage chrome: kit/stage.js (ports, shape skins, snap, cursors)
   Face: Silkscreen only · integer --s · cutout state · never opacity
   ═══════════════════════════════════════════════════════════════════════ */

export const VERSION = '0.2.0';
export const FILL = '░';
export const EMPTY = '─';
export const MENU_W = 20;
export const GUT_W = 2;
export const LAB_W = 8;
export const VAL_W = MENU_W - GUT_W - LAB_W;
export const BAR_W = MENU_W - GUT_W;
export const XY_W = 7;
export const XY_H = 5;
export const FRAME_MS = 16;
export const WORD_MS = 70;
export const WORD_VAR = 0.35;
export const FAST_BLINK_MS = 130;
export const CYCLE_BLINK_MS = 600;
export const OSD_MIN_MS = 1000;
export const DENS = ['·', '░', '▒', '▓'];
export const LOOK = {
  S: '5', 5: 'S', I: '1', O: '0', o: '0', A: '@', T: '7',
  G: '6', E: '3', B: '8', Z: '2', l: '1', N: 'M', M: 'N',
};
const POOL = '5108@7632#$%&';

// Shimmer design system — pure tokens / phase math in kit/shimmer.js
export {
  WAVE_MS,
  CELL_MS,
  FILL_MS,
  SCRAMBLE_MS,
  SCRAMBLE_TRAIL_MS,
  SCRAMBLE_VAR,
  CASCADE_MS,
  MENU_PHASE2_AT_MS,
  SHIMMER_SCAN,
  SHIMMER_STAGGER,
  SHIMMER,
  SHIMMER_GALLERY,
  shimmerOriginCorner,
  densCellPhase,
  staggerDistances,
  resolveStepMs,
  computeShimmerDelay,
} from './shimmer.js';

import {
  WAVE_MS,
  CELL_MS,
  FILL_MS,
  SCRAMBLE_MS,
  SCRAMBLE_TRAIL_MS,
  SCRAMBLE_VAR,
  MENU_PHASE2_AT_MS,
  SHIMMER_SCAN,
  SHIMMER,
  densCellPhase,
  staggerDistances,
  resolveStepMs,
  computeShimmerDelay,
} from './shimmer.js';

export function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
export function clip(s, w) { s = String(s); return s.length > w ? s.slice(0, w) : s; }
export function rowFit(s, w = MENU_W) {
  s = String(s);
  return s.length > w ? s.slice(0, w) : s.padEnd(w);
}
/** Display floats at 2 dp; keep integers clean. Precise values stay in SPEC. */
export function fmt(v) {
  if (typeof v !== 'number' || Number.isNaN(v)) return String(v);
  if (Number.isInteger(v)) return String(v);
  return (+v).toFixed(2);
}
export function fmtVal(v, w = VAL_W) {
  let s = fmt(v);
  if (s.length > w && typeof v === 'number' && !Number.isInteger(v)) {
    for (let d = 2; d >= 0; d--) { s = (+v).toFixed(d); if (s.length <= w) break; }
  }
  if (s.length > w) s = s.slice(0, w);
  return s.padStart(w);
}
export function buildBar(norm, barW = BAR_W, gut = GUT_W) {
  const n = Math.max(0, Math.min(barW, Math.round(clamp(norm, 0, 1) * barW)));
  return ' '.repeat(gut) + FILL.repeat(n) + EMPTY.repeat(barW - n);
}

/**
 * Discrete notch bar vocabulary (Silkscreen):
 *
 *   █  selected (enabled)
 *   ░  enabled, unselected
 *   ·  disabled notch
 *   ─  track between enabled notches
 *   ·  track segment touching a disabled notch (dotted rail)
 *
 * @param {number} index 0..count-1 selected (clamped to enabled if needed by caller)
 * @param {number} count number of notches (e.g. 3 for ALIGN / MODE)
 * @param {number[]} [disabled] indices that are off (e.g. [0] when SYMBOL mode off)
 */
export function buildNotchBar(index, count = 3, barW = BAR_W, gut = GUT_W, disabled = []) {
  const n = Math.max(2, count | 0);
  const dis = new Set((disabled || []).map((i) => i | 0).filter((i) => i >= 0 && i < n));
  let idx = clamp(Math.round(index), 0, n - 1);
  if (dis.has(idx)) {
    // fall to nearest enabled for glyph paint
    for (let d = 1; d < n; d++) {
      if (idx + d < n && !dis.has(idx + d)) { idx = idx + d; break; }
      if (idx - d >= 0 && !dis.has(idx - d)) { idx = idx - d; break; }
    }
  }
  const pos = [];
  for (let i = 0; i < n; i++) {
    pos.push(n === 1 ? 0 : Math.round((i / (n - 1)) * (barW - 1)));
  }
  let body = '';
  for (let c = 0; c < barW; c++) {
    const ni = pos.indexOf(c);
    if (ni >= 0) {
      if (dis.has(ni)) body += '·'; // disabled notch
      else if (ni === idx) body += '█';
      else body += FILL; // ░ enabled idle
    } else {
      // track cell — which segment?
      let leftNi = -1;
      let rightNi = -1;
      for (let i = 0; i < pos.length; i++) {
        if (pos[i] < c) leftNi = i;
        if (pos[i] > c && rightNi < 0) rightNi = i;
      }
      const touchDis =
        (leftNi >= 0 && dis.has(leftNi)) || (rightNi >= 0 && dis.has(rightNi));
      body += touchDis ? '·' : EMPTY; // · rail next to disabled, ─ otherwise
    }
  }
  return ' '.repeat(gut) + body;
}
export function subChar(c) {
  if (LOOK[c]) return LOOK[c];
  const u = c.toUpperCase();
  if (LOOK[u]) return LOOK[u];
  return /[A-Za-z0-9]/.test(c) ? POOL[(Math.random() * POOL.length) | 0] : c;
}
function esc(c) {
  return c === ' ' ? ' ' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '&' ? '&amp;' : c;
}
function cellText(ch, cut) {
  return cut && (ch === ' ' || ch === '\u00a0') ? '\u00a0' : ch;
}
function gridWrap(text, opts = {}) {
  const cut = !!opts.cutout;
  return String(text).split('\n').map(line => {
    const L = line.length ? line : ' ';
    return '<span class="gline">' + [...L].map(ch => {
      if (cut && (ch === ' ' || ch === '\u00a0')) return '<span class="gc cut">&nbsp;</span>';
      return `<span class="${cut ? 'gc cut' : 'gc'}">${esc(ch)}</span>`;
    }).join('') + '</span>';
  }).join('');
}

/** In-place patch — WebKit-safe (never destroy mousedown cell). */
export function applyGrid(el, text, opts = {}) {
  if (!el) return;
  el.classList.add('grid1');
  const cut = !!opts.cutout;
  const lines = String(text).split('\n');
  const head = el.firstElementChild;
  if (!head || !head.classList.contains('gline')) {
    el.innerHTML = gridWrap(text, opts);
    return;
  }
  while (el.childElementCount > lines.length) el.lastElementChild.remove();
  while (el.childElementCount < lines.length) {
    const g = document.createElement('span');
    g.className = 'gline';
    el.appendChild(g);
  }
  const inv = opts.invertRange || opts.cutRange || null;
  for (let i = 0; i < lines.length; i++) {
    const gline = el.children[i];
    const chars = [...(lines[i].length ? lines[i] : ' ')];
    while (gline.childElementCount > chars.length) gline.lastElementChild.remove();
    while (gline.childElementCount < chars.length) gline.appendChild(document.createElement('span'));
    for (let j = 0; j < chars.length; j++) {
      const cell = gline.children[j];
      const cutHere = (inv && j >= inv[0] && j < inv[1]) ? !cut : cut;
      const cls = cutHere ? 'gc cut' : 'gc';
      const txt = cellText(chars[j], cutHere);
      if (cell.className !== cls) cell.className = cls;
      if (cell.textContent !== txt) cell.textContent = txt;
    }
  }
}

export function mkEl(tag, cls, parent) {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  if (parent) parent.append(el);
  return el;
}
export function gap(parent) {
  const g = mkEl('div', 'osd-gap', parent);
  g.innerHTML = '<span class="gline"><span class="gc"> </span></span>';
  return g;
}
export function cellPx(el) {
  const c = el?.querySelector?.('.gc');
  if (c?.offsetWidth > 0) return c.offsetWidth;
  const s = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--s')) || 2;
  return 8 * s;
}

/**
 * Shared pointer drag (XY pad + ports + any free-move control).
 * Same semantics as the original wireXYDrag:
 *  - touch-action none on el
 *  - pointerdown → window capture move/up/cancel
 *  - mouse: only button 0; buttons===0 ends drag
 *  - onStart then onMove on down; onMove each move; onEnd on up
 *
 * @param {HTMLElement} el
 * @param {{
 *   onStart?: (e: PointerEvent) => void,
 *   onMove?: (e: PointerEvent) => void,
 *   onEnd?: (e: PointerEvent) => void,
 *   accept?: (e: PointerEvent) => boolean,
 * }} handlers
 */
export function wirePointerDrag(el, { onStart, onMove, onEnd, accept } = {}) {
  let active = false;
  el.style.touchAction = 'none';
  const winMove = (e) => {
    if (!active) return;
    if (e.pointerType === 'mouse' && e.buttons === 0) { winUp(e); return; }
    onMove?.(e);
    e.preventDefault?.();
  };
  const winUp = (e) => {
    if (!active) return;
    active = false;
    window.removeEventListener('pointermove', winMove, true);
    window.removeEventListener('pointerup', winUp, true);
    window.removeEventListener('pointercancel', winUp, true);
    onEnd?.(e);
  };
  el.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (accept && !accept(e)) return;
    e.preventDefault();
    active = true;
    window.addEventListener('pointermove', winMove, { capture: true, passive: false });
    window.addEventListener('pointerup', winUp, { capture: true });
    window.addEventListener('pointercancel', winUp, { capture: true });
    onStart?.(e);
    onMove?.(e);
  }, { passive: false });
}

function cursorPrefix() { return '  '; }
export function rowSlider(label, v) {
  return cursorPrefix() + clip(label, LAB_W).padEnd(LAB_W) + fmtVal(v, VAL_W);
}
export function rowCycler(label, value) {
  const left = cursorPrefix() + label;
  const maxVal = Math.max(1, MENU_W - left.length - 1);
  const val = clip(String(value), maxVal);
  const padN = Math.max(1, MENU_W - left.length - val.length);
  const text = rowFit(left + ' '.repeat(padN) + val);
  return { text, range: [left.length + padN, left.length + padN + val.length] };
}
/** ON/OFF — ON always cutout-inverted on the value cells (the perfect switch). */
export function rowToggle(label, on) {
  const word = on ? 'ON' : 'OFF';
  const left = cursorPrefix() + clip(label, LAB_W).padEnd(LAB_W);
  const val = word.padStart(VAL_W);
  return { text: left + val, range: [left.length + VAL_W - word.length, left.length + VAL_W] };
}
export function rowHeader(mark, title, value = null) {
  const left = `${mark} ${title}`;
  if (value == null) return rowFit(left);
  const val = String(value);
  const padN = Math.max(1, MENU_W - left.length - val.length);
  return rowFit(left + ' '.repeat(padN) + val);
}
/** Full-row cutout button label (actions look like selections). */
export function rowButton(label) {
  return rowFit(cursorPrefix() + String(label));
}

// ── host factory ─────────────────────────────────────────────────────
/**
 * @param {HTMLElement} root  element with class "huddi"
 * @param {{ scale?: number, blend?: 'solid'|'difference', ink?: string, cut?: string }} [opts]
 */
export function createHuddi(root, opts = {}) {
  if (!root) throw new Error('createHuddi: root required');
  root.classList.add('huddi');

  let scale = opts.scale ?? 2;
  let blend = opts.blend ?? 'solid';
  let focusId = null;
  let kbNav = false;
  let pressId = null;
  let ghosting = false;
  let dragging = false;
  const units = [];
  const headers = [];
  /** Per-channel gens (option B): same channel cancels prior; other channels run concurrent. */
  const shimGens = Object.create(null);
  function bumpShimGen(channel = 'default') {
    const ch = channel || 'default';
    shimGens[ch] = (shimGens[ch] || 0) + 1;
    return { channel: ch, gen: shimGens[ch] };
  }
  function liveShimGen(channel = 'default') {
    return shimGens[channel || 'default'] || 0;
  }
  let blinkGen = 0;

  function setColors({ ink, cut, solid } = {}) {
    if (ink) root.style.setProperty('--huddi-ink', ink);
    if (cut) root.style.setProperty('--huddi-cut', cut);
    if (solid || ink) root.style.setProperty('--huddi-solid', solid || ink);
  }
  function setScale(s) {
    scale = Math.max(1, Math.min(3, s | 0));
    root.style.setProperty('--s', scale);
    document.documentElement.style.setProperty('--s', scale);
  }
  function setBlend(mode) {
    blend = mode === 'difference' ? 'difference' : 'solid';
    root.classList.toggle('blend-difference', blend === 'difference');
    root.classList.toggle('blend-solid', blend !== 'difference');
  }
  setScale(scale);
  setBlend(blend);
  if (opts.ink || opts.cut) setColors({ ink: opts.ink, cut: opts.cut, solid: opts.solid || opts.ink });

  function cutOpts(id) {
    if (pressId === id || (kbNav && focusId === id)) return { cutout: true };
    return {};
  }
  function repaintAll() { units.forEach(u => { if (isShown(u.rows[0])) u.render(); }); }
  function focus(id) { focusId = id; repaintAll(); }
  function setPress(id) { pressId = id; repaintAll(); }
  function clearPress() { pressId = null; repaintAll(); }

  function isShown(el) {
    if (!el) return false;
    if (el.style.display === 'none') return false;
    let p = el.parentElement;
    while (p && p !== root) {
      if (p.style.display === 'none') return false;
      p = p.parentElement;
    }
    // Prefer layout visibility; fixed/sticky may have null offsetParent
    if (el.offsetParent !== null) return true;
    try {
      return el.getClientRects().length > 0;
    } catch {
      return root.contains(el);
    }
  }

  /** 'pad' (#trk) · 'menu' (#menu) · unit.navGroup override */
  function unitNavGroup(u) {
    if (u?.navGroup) return u.navGroup;
    const el = u?.rows?.[0];
    if (!el?.closest) return 'menu';
    if (el.closest('#trk')) return 'pad';
    if (el.closest('#menu')) return 'menu';
    return 'menu';
  }

  /**
   * Keyboard focus candidates.
   * @param {'menu'|'pad'|'all'} [scope='all']
   */
  function focusList(scope = 'all') {
    return units.filter((u) => {
      if (u.kind === 'readout') return false;
      if (!isShown(u.rows?.[0])) return false;
      if (scope === 'all') return true;
      return unitNavGroup(u) === scope;
    });
  }

  function scrollFocusUnit(u) {
    try {
      u?.rows?.[0]?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
    } catch { /* */ }
  }

  /** Index of focusId in list, or recover orphan → 0 */
  function resolveFocusIdx(list) {
    if (!list.length) return -1;
    const idx = list.findIndex((u) => u.id === focusId);
    if (idx >= 0) return idx;
    focusId = list[0].id;
    return 0;
  }

  /** PageUp/Down: next/prev header, else ±8 rows */
  function stepPage(list, idx, dir) {
    if (dir > 0) {
      for (let i = idx + 1; i < list.length; i++) {
        if (list[i].kind === 'header') return i;
      }
      return Math.min(list.length - 1, idx + 8);
    }
    for (let i = idx - 1; i >= 0; i--) {
      if (list[i].kind === 'header') return i;
    }
    return Math.max(0, idx - 8);
  }

  /** If focus sits on a hidden unit, snap to nearest shown (prefer parent header). */
  function recoverOrphanFocus(scope = 'all') {
    const list = focusList(scope);
    if (!list.length) return;
    if (list.some((u) => u.id === focusId)) return;
    // child of a header? land on that header if shown
    for (const h of headers) {
      if (h.childUnits?.some((c) => c.id === focusId) && isShown(h.rows?.[0])) {
        focusId = h.id;
        return;
      }
    }
    focusId = list[0].id;
  }

  // shimmer
  function shimStop(row, unit) {
    (row.__shimTimers || []).forEach(clearTimeout);
    row.__shimTimers = [];
    if (row.__shimRaf) cancelAnimationFrame(row.__shimRaf);
    row.__shimRaf = 0;
    row.__shimmering = false;
    if (unit && isShown(row)) unit.render();
  }
  function shimPush(row, fn, ms) {
    const id = setTimeout(fn, Math.max(0, ms));
    (row.__shimTimers ||= []).push(id);
  }
  function wordSpans(s) {
    const out = []; let i = 0;
    while (i < s.length) {
      while (i < s.length && s[i] === ' ') i++;
      const a = i;
      while (i < s.length && s[i] !== ' ') i++;
      if (i > a) out.push({ a, b: i });
    }
    return out;
  }
  /** Preserve spaces + newlines (multi-line pad grids use \n between rows). */
  function shimKeep(ch) {
    return ch === ' ' || ch === '\n' || ch === '\r';
  }
  /**
   * Target text for shimmer. Multi-line grids store one .gline per row —
   * textContent concatenates without \n, so rebuild from children.
   */
  function rowTargetText(row, unit) {
    if (row?.dataset?.target) return row.dataset.target;
    if (typeof unit?._target === 'function') {
      try {
        const t = unit._target(row);
        if (t != null && String(t).length) return String(t);
      } catch { /* fall through */ }
    }
    const glines = row?.querySelectorAll?.(':scope > .gline');
    if (glines && glines.length > 1) {
      return [...glines].map((g) => g.textContent || '').join('\n');
    }
    return row?.textContent || '';
  }
  /** Grid metrics for dens/text scan phases. */
  function gridMetrics(target) {
    let maxCol = 1;
    let maxRow = 1;
    let densN = 0;
    let col = 0;
    let rowI = 0;
    for (const ch of target) {
      if (ch === '\n' || ch === '\r') {
        rowI++;
        col = 0;
        if (rowI + 1 > maxRow) maxRow = rowI + 1;
        continue;
      }
      if (ch !== ' ') densN++;
      col++;
      if (col > maxCol) maxCol = col;
    }
    return { maxCol, maxRow, densN: Math.max(1, densN) };
  }

  function ghostMaskString(target) {
    let s = '';
    for (const ch of target) s += shimKeep(ch) ? ch : DENS[0];
    return s;
  }

  /**
   * Dens reveal inside one row/grid.
   * Knobs: fillMs (sweep budget), cellMs (per-cell ramp), scan.
   */
  function densityRow(row, target, unit, done, gen, fillOpts = {}, channel = 'default') {
    const scan = fillOpts.scan || SHIMMER_SCAN.LTR;
    const fillMs = fillOpts.fillMs ?? FILL_MS;
    const cellMs = fillOpts.cellMs ?? CELL_MS;
    const { maxCol, maxRow, densN } = gridMetrics(target);

    const start = performance.now();
    const step = (now) => {
      if (gen !== liveShimGen(channel) || !isShown(row)) { shimStop(row, unit); done?.(); return; }
      const el = now - start;
      let s = '';
      let col = 0;
      let rowI = 0;
      let di = 0;
      for (let i = 0; i < target.length; i++) {
        const ch = target[i];
        if (ch === '\n' || ch === '\r') {
          s += ch;
          rowI++;
          col = 0;
          continue;
        }
        if (ch === ' ') {
          s += ' ';
          col++;
          continue;
        }
        const phase = densCellPhase(col, rowI, maxCol, maxRow, di, densN, scan);
        di++;
        const f = (el - phase * fillMs) / cellMs;
        if (f >= 1) s += ch;
        else if (f < 0) s += DENS[0];
        else s += DENS[Math.min(3, Math.max(0, Math.floor(f * 4)))];
        col++;
      }
      applyGrid(row, s);
      if (el < fillMs + cellMs) { row.__shimRaf = requestAnimationFrame(step); return; }
      row.__shimmering = false;
      if (isShown(row)) unit ? unit.render() : applyGrid(row, target);
      done?.();
    };
    row.__shimRaf = requestAnimationFrame(step);
  }

  /**
   * Label / header reveal: ghost · → scramble trail → truth, scan-directed.
   * Knobs independent of dens:
   *   fillMs           — when wave front arrives (shared scan direction with dens)
   *   scrambleMs       — decode duration after front hits
   *   scrambleTrailMs  — extra linger as scramble (decay)
   *   scrambleVar      — ± random on scrambleMs
   */
  function textRow(row, target, unit, done, gen, fillOpts = {}, channel = 'default') {
    const scan = fillOpts.scan || SHIMMER_SCAN.LTR;
    const fillMs = fillOpts.fillMs ?? FILL_MS;
    const scrambleMs = fillOpts.scrambleMs ?? SCRAMBLE_MS;
    const scrambleTrailMs = fillOpts.scrambleTrailMs ?? SCRAMBLE_TRAIL_MS;
    const scrambleVar = fillOpts.scrambleVar ?? SCRAMBLE_VAR;
    const { maxCol, maxRow, densN } = gridMetrics(target);

    // Per-cell decode budget (stable for this wave)
    const budgets = [];
    {
      let col = 0;
      let rowI = 0;
      let di = 0;
      for (let i = 0; i < target.length; i++) {
        const ch = target[i];
        if (ch === '\n' || ch === '\r') {
          budgets[i] = 0;
          rowI++;
          col = 0;
          continue;
        }
        if (ch === ' ') {
          budgets[i] = 0;
          col++;
          continue;
        }
        const phase = densCellPhase(col, rowI, maxCol, maxRow, di, densN, scan);
        di++;
        const varMul = 1 + (Math.random() * 2 - 1) * scrambleVar;
        budgets[i] = {
          phase,
          scramble: Math.max(16, scrambleMs * varMul),
          trail: scrambleTrailMs,
        };
        col++;
      }
    }

    const totalMs = fillMs + scrambleMs * (1 + scrambleVar) + scrambleTrailMs + 48;
    const start = performance.now();
    const step = (now) => {
      if (gen !== liveShimGen(channel) || !isShown(row)) { shimStop(row, unit); done?.(); return; }
      const el = now - start;
      let s = '';
      for (let i = 0; i < target.length; i++) {
        const ch = target[i];
        if (shimKeep(ch)) {
          s += ch;
          continue;
        }
        const b = budgets[i];
        if (!b) {
          s += ch;
          continue;
        }
        const t0 = b.phase * fillMs;           // wave arrives (ghost until then)
        const t1 = t0 + b.scramble;            // scramble window
        const t2 = t1 + b.trail;               // trail decay → truth
        if (el < t0) s += DENS[0];
        else if (el < t1) s += subChar(ch);
        else if (el < t2) {
          // trail: mostly truth with occasional scramble flicker at start of trail
          const tf = (el - t1) / Math.max(1, b.trail);
          s += tf < 0.35 && Math.random() < (0.35 - tf) ? subChar(ch) : ch;
        } else s += ch;
      }
      applyGrid(row, s);
      if (el < totalMs) { row.__shimRaf = requestAnimationFrame(step); return; }
      row.__shimmering = false;
      if (isShown(row)) unit ? unit.render() : applyGrid(row, target);
      done?.();
    };
    row.__shimRaf = requestAnimationFrame(step);
  }

  /** Legacy word-serial type-in (still available via vocab: 'words'). */
  function typeRow(row, target, unit, done, gen, fillOpts = {}, channel = 'default') {
    const wordMs = fillOpts.scrambleMs ?? WORD_MS;
    const wordVar = fillOpts.scrambleVar ?? WORD_VAR;
    const words = wordSpans(target);
    if (!words.length) { row.__shimmering = false; done?.(); return; }
    let t = 0;
    const plan = words.map((w) => {
      const len = w.b - w.a;
      const dur = wordMs * (0.6 + len / 7) * (1 + (Math.random() * 2 - 1) * wordVar);
      const p = { ...w, start: t, dur }; t += dur; return p;
    });
    const total = t;
    const start = performance.now();
    const step = (now) => {
      if (gen !== liveShimGen(channel) || !isShown(row)) { shimStop(row, unit); done?.(); return; }
      const el = now - start;
      let s = '';
      for (let i = 0; i < target.length; i++) {
        const ch = target[i];
        if (shimKeep(ch)) { s += ch; continue; }
        const w = plan.find((p) => i >= p.a && i < p.b);
        if (!w) { s += ch; continue; }
        if (el >= w.start + w.dur) { s += ch; continue; }
        if (el < w.start) { s += subChar(ch); continue; }
        const f = (el - w.start) / w.dur;
        s += i < w.a + Math.floor(f * (w.b - w.a)) ? ch : subChar(ch);
      }
      applyGrid(row, s);
      if (el < total) { row.__shimRaf = requestAnimationFrame(step); return; }
      row.__shimmering = false;
      if (isShown(row)) unit ? unit.render() : applyGrid(row, target);
      done?.();
    };
    row.__shimRaf = requestAnimationFrame(step);
  }

  function rowVocab(unit) {
    return (unit?.kind === 'header' || unit?.kind === 'text' || unit?.kind === 'button') ? 'text' : 'density';
  }

  /**
   * Directional dens-or-text reveal. Ghost-first: never leaves full truth painted
   * between CSS show and wave start.
   *
   * @param {object[]|null} list units (default all)
   * @param {{x:number,y:number}|null} [origin] explicit origin (radial); or set via opts
   * @param {object} [opts]
   * @param {boolean} [opts.force] include __noShimmer rows (pads)
   * @param {string} [opts.stagger] SHIMMER_STAGGER — unit delay wave
   * @param {string} [opts.scan] SHIMMER_SCAN — dens/text fill direction
   * @param {{x:number,y:number}|null} [opts.origin]
   * @param {number} [opts.waveMs] spatial unit stagger budget (0 = off)
   * @param {number} [opts.stepMs] max fixed delay between successive units
   * @param {number} [opts.cascadeMs] cap total serial chain: step_eff = min(stepMs, cascadeMs/(N-1))
   * @param {number} [opts.fillMs] dens/wave-front budget (default FILL_MS)
   * @param {number} [opts.cellMs] dens cell ramp (default CELL_MS)
   * @param {number} [opts.scrambleMs] label decode after front (default SCRAMBLE_MS)
   * @param {number} [opts.scrambleTrailMs] scramble linger (default SCRAMBLE_TRAIL_MS)
   * @param {number} [opts.scrambleVar] ± random on scrambleMs
   * @param {'density'|'text'|'words'|'auto'} [opts.vocab]
   * @param {'ghost'|'blank'} [opts.face] start face (default ghost ·)
   * @param {() => void} [opts.onDone] after all units settle (skipped if wave cancelled)
   * @param {string} [opts.channel='default'] gen channel (B: concurrent waves on other channels)
   * @param {(i:number, ctx:object) => number} [opts.delayFor] absolute delay ms (A: body offset)
   * @param {number} [opts.baseDelayMs=0] added to every unit delay
   *
   * IMPORTANT: same `channel` cancels prior wave. Different channels run concurrent (B).
   * Prefer named SHIMMER presets.
   */
  function shimmerFrom(list, origin = null, opts = {}) {
    const oIn = opts || {};
    const force = !!oIn.force;
    const channel = oIn.channel || 'default';
    const scan = oIn.scan || SHIMMER_SCAN.LTR;
    const waveMs = oIn.waveMs != null ? oIn.waveMs : WAVE_MS;
    const stepMsOpt = oIn.stepMs != null ? oIn.stepMs : 0;
    const cascadeMs = oIn.cascadeMs != null ? oIn.cascadeMs : 0;
    const fillMs = oIn.fillMs ?? FILL_MS;
    const cellMs = oIn.cellMs ?? CELL_MS;
    const scrambleMs = oIn.scrambleMs ?? SCRAMBLE_MS;
    const scrambleTrailMs = oIn.scrambleTrailMs ?? SCRAMBLE_TRAIL_MS;
    const scrambleVar = oIn.scrambleVar ?? SCRAMBLE_VAR;
    const jitterMs = oIn.jitterMs ?? 0;
    const baseDelayMs = oIn.baseDelayMs != null ? oIn.baseDelayMs : 0;
    const delayFor = typeof oIn.delayFor === 'function' ? oIn.delayFor : null;
    const originOpt = origin || oIn.origin || null;
    const stagger = oIn.stagger || null;
    const face = oIn.face || 'ghost';
    const unitsList = list || units;

    // enabled() folds — may paint truth; we re-mask in the same turn (no frame yield)
    unitsList.forEach((u) => { try { u.render?.(); } catch { /* */ } });

    const rows = [];
    unitsList.forEach((u) => {
      (u.rows || []).forEach((r) => {
        if (!r) return;
        if (r.__noShimmer && !force) return;
        if (r.classList?.contains?.('osd-gap')) return;
        rows.push({ row: r, unit: u });
      });
    });
    if (!rows.length) return;

    const visible = rows.filter(({ row }) => isShown(row));
    if (!visible.length) return;

    // Capture targets + ghost-mask ALL rows before any paint frame can show truth
    const prepared = [];
    visible.forEach(({ row, unit }) => {
      shimStop(row, null); // clear timers; unit null → no truth re-render
      // Prefer logical target (avoids relying on painted textContent)
      let target = '';
      if (typeof unit?._target === 'function') {
        try {
          const t = unit._target(row);
          if (t != null) target = String(t);
        } catch { /* */ }
      }
      if (!target) target = rowTargetText(row, unit);
      if (!target || !String(target).trim()) return;
      row.__shimTarget = target;
      row.__shimmering = true;
      if (face === 'ghost' || face === 'blank') {
        applyGrid(row, face === 'blank'
          ? [...target].map((ch) => (shimKeep(ch) ? ch : ' ')).join('')
          : ghostMaskString(target));
      }
      let vocab = rowVocab(unit);
      if (oIn.vocab === 'density' || oIn.vocab === 'text' || oIn.vocab === 'words') {
        vocab = oIn.vocab;
      }
      prepared.push({ row, unit, target, vocab });
    });
    if (!prepared.length) return;

    const rects = prepared.map(({ row }) => {
      const r = row.getBoundingClientRect();
      return { cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
    });
    const { dists, dMax } = staggerDistances(rects, {
      stagger,
      origin: originOpt,
    });
    const { gen } = bumpShimGen(channel);
    const densOpts = { scan, fillMs, cellMs };
    const textOpts = {
      scan, fillMs, cellMs, scrambleMs, scrambleTrailMs, scrambleVar,
    };

    // Budget B: step_eff = min(stepMs, cascadeMs/(N-1)) when cascadeMs set
    const stepMs = resolveStepMs(prepared.length, {
      stepMs: stepMsOpt,
      cascadeMs,
    });

    let left = prepared.length;
    const noteDone = () => {
      if (gen !== liveShimGen(channel)) return; // cancelled — do not chain
      left -= 1;
      if (left <= 0) {
        try { oIn.onDone?.(); } catch (e) { console.warn('[huddi] shimmer onDone', e); }
      }
    };

    prepared.forEach((entry, i) => {
      const { row, unit, target, vocab } = entry;
      const jitter = jitterMs ? (Math.random() * 2 - 1) * jitterMs : 0;
      let delay;
      if (delayFor) {
        // Option A: absolute per-index delay (e.g. bodies at phase2At + j*step)
        delay = Math.max(0, delayFor(i, {
          unit, row, dist: dists[i], dMax, stepMs, waveMs, n: prepared.length,
        }) + jitter);
      } else {
        delay = baseDelayMs + computeShimmerDelay(i, dists[i], dMax, { stepMs, waveMs, jitter });
      }
      const serial = stepMs > 0 ? i * stepMs : 0;
      let unitDone = false;
      const finishUnit = () => {
        if (unitDone) return;
        unitDone = true;
        noteDone();
      };
      shimPush(row, () => {
        if (gen !== liveShimGen(channel)) return;
        if (vocab === 'text') textRow(row, target, unit, finishUnit, gen, textOpts, channel);
        else if (vocab === 'words') typeRow(row, target, unit, finishUnit, gen, textOpts, channel);
        else densityRow(row, target, unit, finishUnit, gen, densOpts, channel);
      }, delay);
      const localBudget = vocab === 'density'
        ? fillMs + cellMs
        : fillMs + scrambleMs * (1 + scrambleVar) + scrambleTrailMs + 80;
      const chain = serial + (waveMs || 0) + (jitterMs || 0);
      shimPush(row, () => {
        if (gen === liveShimGen(channel) && row.__shimmering) {
          shimStop(row, unit);
          finishUnit(); // safety settle still counts toward onDone
        }
      }, delay + localBudget + chain + 400);
    });
  }

  /**
   * Ghost-mask units immediately (· field) without starting fill.
   * Call sync after CSS show to kill truth flash; then shimmerFrom (reuses face).
   */
  function ghostMask(list, opts = {}) {
    const force = !!opts.force;
    const unitsList = list || units;
    unitsList.forEach((u) => { try { u.render?.(); } catch { /* */ } });
    unitsList.forEach((u) => {
      (u.rows || []).forEach((row) => {
        if (!row || (row.__noShimmer && !force)) return;
        if (row.classList?.contains?.('osd-gap')) return;
        if (!isShown(row)) return;
        let target = '';
        if (typeof u?._target === 'function') {
          try {
            const t = u._target(row);
            if (t != null) target = String(t);
          } catch { /* */ }
        }
        if (!target) target = rowTargetText(row, u);
        if (!target?.trim()) return;
        row.__shimTarget = target;
        row.__shimmering = true;
        applyGrid(row, ghostMaskString(target));
      });
    });
  }
  function shimmerOut(list, done) {
    const rows = [];
    (list || units).forEach(u => (u.rows || []).forEach(r => { if (isShown(r)) rows.push(r); }));
    if (!rows.length) { done?.(); return; }
    const ramp = [...DENS].reverse();
    const FRM = FRAME_MS / 2;
    const STAG = 6;
    const { gen } = bumpShimGen('default');
    rows.forEach((row, pos) => {
      shimStop(row, null);
      const target = rowTargetText(row, null);
      row.__shimmering = true;
      const mask = (d) => {
        let s = '';
        for (const ch of target) s += shimKeep(ch) ? ch : d;
        return s;
      };
      ramp.forEach((d, fi) => shimPush(row, () => {
        if (gen === liveShimGen('default')) applyGrid(row, mask(d));
      }, pos * STAG + fi * FRM));
      shimPush(row, () => {
        if (gen === liveShimGen('default')) {
          applyGrid(row, mask(' '));
          row.__shimmering = false;
        }
      }, pos * STAG + ramp.length * FRM);
    });
    setTimeout(() => {
      if (gen === liveShimGen('default')) done?.();
    }, (rows.length - 1) * STAG + (ramp.length + 1) * FRM);
  }

  /**
   * Ghost mode A (ADD 18 Jul) — while dragging one control, other *menu* rows
   * collapse to a dots wireframe. Active unit stays full truth.
   *
   * Safety vs the old broken port:
   *  - Only single-line menu kinds (slider/toggle/cycler/header/button/readout)
   *  - Never rewrite multi-line pad grids (xypad/joy/vbar) or __noShimmer rows
   *  - Call order: focus/press + active.render FIRST, dimExcept LAST
   *  - paint() skips liveSig while ghosting so it never clobbers the skeleton
   *  - undim() restores truth on release
   */
  const GHOST_KINDS = new Set(['slider', 'toggle', 'cycler', 'button', 'header', 'readout']);

  function isBarRow(r) {
    return !!(r && r.classList && r.classList.contains('osdsol-bar'));
  }

  function rowIsMultiline(r) {
    if (!r) return true;
    if (r.__noShimmer) return true;
    if (r.classList?.contains('osdsol-xy')) return true;
    if (r.classList?.contains('osd-gap')) return true;
    const n = r.querySelectorAll?.('.gline')?.length || 0;
    return n > 1;
  }

  function dimExcept(active) {
    ghosting = true;
    units.forEach((u) => {
      if (u === active) return;
      if (!GHOST_KINDS.has(u.kind)) return;
      (u.rows || []).forEach((r) => {
        if (!r || !isShown(r) || r.__shimmering) return;
        if (rowIsMultiline(r)) return;
        const raw = r.textContent || ' ';
        const len = Math.max(MENU_W, [...raw].length);
        let s;
        if (isBarRow(r)) {
          const n = Math.max(0, len - GUT_W);
          s = ' '.repeat(GUT_W)
            + Array.from({ length: n }, (_, i) => (i % 2 === 0 ? '·' : ' ')).join('');
        } else {
          s = ' '.repeat(GUT_W) + '·' + ' '.repeat(Math.max(0, len - GUT_W - 1));
        }
        if (s.length < len) s = s.padEnd(len);
        applyGrid(r, s);
      });
    });
  }

  function undim() {
    if (!ghosting) return;
    ghosting = false;
    units.forEach((u) => {
      (u.rows || []).forEach((r) => {
        if (r && isShown(r) && !r.__shimmering) {
          try { u.render(); } catch { /* */ }
        }
      });
    });
  }

  function wireDrag(barEl, { getNorm, setNorm, onStart, onEnd }) {
    let active = false, pending = false, startX = 0, startY = 0, startNorm = 0, cw = 8;
    const removeWin = () => {
      window.removeEventListener('pointermove', onMove, true);
      window.removeEventListener('pointerup', onUp, true);
      window.removeEventListener('pointercancel', onUp, true);
    };
    const begin = () => { active = true; dragging = true; startNorm = getNorm(); cw = cellPx(barEl); onStart?.(); };
    const onMove = (e) => {
      if (pending) {
        const dx = e.clientX - startX, dy = e.clientY - startY;
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
        pending = false;
        if (Math.abs(dy) > Math.abs(dx)) { removeWin(); return; }
        begin();
      }
      if (!active) return;
      if (e.pointerType === 'mouse' && e.buttons === 0) { onUp(); return; }
      setNorm(startNorm + (e.clientX - startX) / (cw * BAR_W));
      e.preventDefault?.();
    };
    const onUp = () => {
      const was = active; active = false; pending = false; dragging = false;
      removeWin(); if (was) onEnd?.();
    };
    barEl.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      startX = e.clientX; startY = e.clientY;
      window.addEventListener('pointermove', onMove, { capture: true, passive: false });
      window.addEventListener('pointerup', onUp, { capture: true });
      window.addEventListener('pointercancel', onUp, { capture: true });
      if (e.pointerType === 'mouse') { e.preventDefault(); begin(); } else pending = true;
    }, { passive: false });
  }

  function wireXYDrag(padEl, { setXY, onStart, onEnd, wrapX = false, cols = XY_W, rows = XY_H } = {}) {
    /** Field rect = only the char grid (cols×rows cells), not readout. */
    const fieldRect = () => {
      const r = padEl.getBoundingClientRect();
      const cw = cellPx(padEl);
      const gc = padEl.querySelector?.('.gc');
      const ch = (gc?.offsetHeight > 0) ? gc.offsetHeight : cw;
      return {
        left: r.left,
        top: r.top,
        width: cols * cw,
        height: rows * ch,
      };
    };
    const inField = (e, f) => (
      e.clientX >= f.left && e.clientX < f.left + f.width
      && e.clientY >= f.top && e.clientY < f.top + f.height
    );
    const compute = (e) => {
      const f = fieldRect();
      if (f.width < 1 || f.height < 1) return;
      const rawX = (e.clientX - f.left) / f.width;
      const rawY = (e.clientY - f.top) / f.height;
      const nx = wrapX ? (((rawX % 1) + 1) % 1) : clamp(rawX, 0, 1);
      const ny = clamp(1 - rawY, 0, 1);
      setXY(nx, ny);
    };
    // Same capture pipeline as ports / shared wirePointerDrag
    wirePointerDrag(padEl, {
      accept: (e) => inField(e, fieldRect()),
      onStart: (e) => { onStart?.(e); },
      onMove: (e) => { compute(e); },
      onEnd: (e) => { onEnd?.(e); },
    });
  }

  function register(unit) {
    units.push(unit);
    return unit;
  }

  // ── builders ─────────────────────────────────────────────────────
  /**
   * @param {object} opts
   * @param {number} [opts.notches] if set, discrete notch bar (see buildNotchBar vocabulary)
   * @param {string[]|function} [opts.labels] value labels for notch mode (or fn(v)=>string)
   * @param {number[]|function():number[]} [opts.disabledNotches] notch indices that are off
   */
  function buildSlider(parent, id, label, {
    get, set, min, max, step = 1, enabled, noGap, ghost = false,
    notches = null, labels = null, disabledNotches = null,
    noLabel = false, // bar-only (e.g. MODE notches under header value)
  } = {}) {
    const gapEl = noGap || noLabel ? null : gap(parent);
    const labelEl = noLabel ? null : mkEl('div', 'hit row', parent);
    const barEl = mkEl('div', 'hit row osdsol-bar', parent);
    const span = () => (max - min) || 1;
    const notchN = notches != null ? Math.max(2, notches | 0) : 0;
    const isNotch = notchN >= 2;
    const disabledList = () => {
      if (!disabledNotches) return [];
      const d = typeof disabledNotches === 'function' ? disabledNotches() : disabledNotches;
      return Array.isArray(d) ? d : [];
    };
    const isDisabledIdx = (i) => disabledList().includes(i | 0);
    /** Snap index away from disabled notches */
    const nearestEnabled = (i) => {
      const n = notchN;
      let idx = clamp(i | 0, 0, n - 1);
      if (!isDisabledIdx(idx)) return idx;
      for (let d = 1; d < n; d++) {
        if (idx + d < n && !isDisabledIdx(idx + d)) return idx + d;
        if (idx - d >= 0 && !isDisabledIdx(idx - d)) return idx - d;
      }
      return idx;
    };
    const getNorm = () => {
      if (isNotch) {
        const i = nearestEnabled(Math.round(get() - min));
        return notchN <= 1 ? 0 : i / (notchN - 1);
      }
      return clamp((get() - min) / span(), 0, 1);
    };
    const isOn = () => (enabled ? !!enabled() : true);
    const snap = (v) => {
      if (isNotch) {
        const i = nearestEnabled(Math.round(v - min));
        return min + i;
      }
      return step < 1
        ? Math.round(v * Math.round(1 / step)) / Math.round(1 / step)
        : Math.round(v / step) * step;
    };
    const formatVal = (v) => {
      if (typeof labels === 'function') return labels(v);
      if (Array.isArray(labels)) {
        const i = clamp(Math.round(v - min), 0, labels.length - 1);
        return labels[i] != null ? labels[i] : v;
      }
      // Display 2 dp; SPEC keeps full precision from set()
      return typeof v === 'number' ? fmt(v) : v;
    };
    const applyFromNorm = (n) => {
      if (!isOn()) return;
      let v;
      if (isNotch) {
        let i = clamp(Math.round(clamp(n, 0, 1) * (notchN - 1)), 0, notchN - 1);
        if (isDisabledIdx(i)) i = nearestEnabled(i);
        v = min + i;
      } else {
        v = clamp(snap(min + clamp(n, 0, 1) * span()), min, max);
      }
      set(v);
      unit.render();
    };
    const unit = {
      id, kind: 'slider',
      rows: [gapEl, labelEl, barEl].filter(Boolean),
      render() {
        if (!isOn()) {
          unit.rows.forEach((r) => { if (r) r.style.display = 'none'; });
          return;
        }
        unit.rows.forEach((r) => { if (r) r.style.display = ''; });
        const cut = cutOpts(id);
        const v = get();
        if (labelEl) applyGrid(labelEl, rowSlider(label, formatVal(v)), cut);
        if (isNotch) {
          const i = clamp(Math.round(v - min), 0, notchN - 1);
          applyGrid(barEl, buildNotchBar(i, notchN, BAR_W, GUT_W, disabledList()), cut);
        } else {
          applyGrid(barEl, buildBar(getNorm()), cut);
        }
      },
      liveSig: () => `${get()}|${isOn() ? 1 : 0}|${focusId === id ? 1 : 0}|${disabledList().join(',')}`,
      nudge(dir, coarse) {
        if (!isOn()) return;
        if (isNotch) {
          let i = clamp(Math.round(get() - min), 0, notchN - 1);
          for (let step = 0; step < notchN; step++) {
            i = clamp(i + dir, 0, notchN - 1);
            if (!isDisabledIdx(i)) {
              set(min + i);
              unit.render();
              return;
            }
          }
          return;
        }
        const stepN = step * (coarse ? 10 : 1);
        set(clamp(snap(get() + dir * stepN), min, max));
        unit.render();
      },
      activate() {},
    };
    if (labelEl) {
      labelEl.addEventListener('pointerdown', () => { focusId = id; setPress(id); });
      labelEl.addEventListener('pointerup', clearPress);
      wireDrag(labelEl, {
        getNorm,
        setNorm: applyFromNorm,
        onStart: () => {
          focusId = id;
          setPress(id);
          unit.render(); // truth first…
          dimExcept(unit); // …ghost others last
        },
        onEnd: () => {
          clearPress();
          undim();
          unit.render();
        },
      });
    }
    wireDrag(barEl, {
      getNorm,
      setNorm: applyFromNorm,
      onStart: () => {
        focusId = id;
        setPress(id);
        unit.render();
        dimExcept(unit);
      },
      onEnd: () => {
        clearPress();
        undim();
        unit.render();
      },
    });
    unit.render();
    return register(unit);
  }

  function buildToggle(parent, id, label, { get, set, enabled, gapBefore = true } = {}) {
    const gapEl = gapBefore ? gap(parent) : null;
    const el = mkEl('button', 'hit row', parent);
    el.type = 'button';
    let blinkUntil = 0;
    const isOn = () => (enabled ? !!enabled() : true);
    const unit = {
      id, kind: 'toggle', rows: gapEl ? [gapEl, el] : [el],
      render() {
        if (!isOn()) {
          unit.rows.forEach((r) => { if (r) r.style.display = 'none'; });
          return;
        }
        unit.rows.forEach((r) => { if (r) r.style.display = ''; });
        const on = !!get();
        const { text, range } = rowToggle(label, on);
        const cut = cutOpts(id);
        const opts = { ...cut };
        // ON value cells always inverted (switch language)
        if (on && !cut.cutout) opts.invertRange = range;
        if (cut.cutout) opts.invertRange = range; // value is odd one out when whole row cut
        if (performance.now() < blinkUntil && (Math.floor(performance.now() / FAST_BLINK_MS) % 2)) {
          applyGrid(el, text.slice(0, range[0]) + ' '.repeat(range[1] - range[0]) + text.slice(range[1]), cut);
          return;
        }
        applyGrid(el, text, opts);
      },
      liveSig: () => `${isOn() ? 1 : 0}|${get() ? 1 : 0}|${focusId === id ? 1 : 0}|${performance.now() < blinkUntil ? 1 : 0}`,
      activate() {
        if (!isOn()) return;
        set(!get());
        blinkUntil = performance.now() + CYCLE_BLINK_MS;
        unit.render();
      },
      nudge() { unit.activate(); },
    };
    el.addEventListener('click', (e) => { e.preventDefault(); if (!isOn()) return; focusId = id; unit.activate(); });
    el.addEventListener('pointerdown', () => { if (!isOn()) return; focusId = id; setPress(id); unit.render(); });
    el.addEventListener('pointerup', clearPress);
    unit.render();
    return register(unit);
  }

  function buildCycler(parent, id, label, { options, get, set, getLabel, onCycle, gapBefore = true, enabled } = {}) {
    const gapEl = gapBefore ? gap(parent) : null;
    const el = mkEl('button', 'hit row', parent);
    el.type = 'button';
    let blinkUntil = 0;
    const isOn = () => (enabled ? !!enabled() : true);
    const read = () => (getLabel ? getLabel() : get());
    const cycle = () => {
      if (onCycle) onCycle();
      else if (options && get && set) {
        const i = options.indexOf(get());
        set(options[(i + 1 + options.length) % options.length]);
      }
      blinkUntil = performance.now() + CYCLE_BLINK_MS;
    };
    const unit = {
      id, kind: 'cycler', rows: gapEl ? [gapEl, el] : [el],
      render() {
        if (!isOn()) {
          unit.rows.forEach((r) => { if (r) r.style.display = 'none'; });
          return;
        }
        unit.rows.forEach((r) => { if (r) r.style.display = ''; });
        const { text, range } = rowCycler(label, read());
        const cut = cutOpts(id);
        const opts = { ...cut };
        if (cut.cutout) opts.invertRange = range;
        if (performance.now() < blinkUntil && (Math.floor(performance.now() / FAST_BLINK_MS) % 2)) {
          applyGrid(el, text.slice(0, range[0]) + ' '.repeat(range[1] - range[0]) + text.slice(range[1]), cut);
          return;
        }
        applyGrid(el, text, opts);
      },
      liveSig: () => `${isOn() ? 1 : 0}|${read()}|${focusId === id ? 1 : 0}`,
      activate() { if (!isOn()) return; cycle(); unit.render(); },
      nudge(dir) {
        if (!isOn()) return;
        if (options && get && set) {
          const i = options.indexOf(get());
          const n = options.length;
          set(options[((i + (dir || 1)) % n + n) % n]);
          blinkUntil = performance.now() + CYCLE_BLINK_MS;
        } else cycle();
        unit.render();
      },
    };
    el.addEventListener('click', (e) => { e.preventDefault(); if (!isOn()) return; focusId = id; unit.activate(); });
    el.addEventListener('pointerdown', () => { if (!isOn()) return; focusId = id; setPress(id); unit.render(); });
    el.addEventListener('pointerup', clearPress);
    unit.render();
    return register(unit);
  }

  /**
   * Action button.
   * Default: full-row cutout when focused/pressed (selection language).
   * `{ plain: true }` — normal text (no cutout); blinks on activate.
   */
  function buildButton(parent, id, label, { onPress, enabled, gapBefore = true, plain = false } = {}) {
    const gapEl = gapBefore ? gap(parent) : null;
    const el = mkEl('button', 'hit row', parent);
    el.type = 'button';
    let blinkUntil = 0;
    const isOn = () => (enabled ? !!enabled() : true);
    const labelText = () => (plain
      ? rowFit(`${cursorPrefix()}${String(label)}`)
      : rowButton(label));
    const unit = {
      id, kind: 'button', rows: gapEl ? [gapEl, el] : [el], plain: !!plain,
      _target(row) { return row === el ? labelText() : ''; },
      render() {
        if (!isOn()) {
          unit.rows.forEach((r) => { if (r) r.style.display = 'none'; });
          return;
        }
        unit.rows.forEach((r) => { if (r) r.style.display = ''; });
        const text = labelText();
        // Plain: never cutout — blink whole label on activate
        if (plain) {
          if (performance.now() < blinkUntil && (Math.floor(performance.now() / FAST_BLINK_MS) % 2)) {
            applyGrid(el, rowFit(' '));
            return;
          }
          applyGrid(el, text, {});
          return;
        }
        const cut = cutOpts(id);
        if (cut.cutout) applyGrid(el, text, { cutout: true });
        else applyGrid(el, text, { invertRange: [GUT_W, MENU_W] });
      },
      liveSig: () => `${isOn() ? 1 : 0}|${focusId === id ? 1 : 0}|${plain && performance.now() < blinkUntil ? 1 : 0}`,
      activate() {
        if (!isOn()) return;
        onPress?.();
        if (plain) blinkUntil = performance.now() + CYCLE_BLINK_MS;
        unit.render();
      },
      nudge() { unit.activate(); },
    };
    el.addEventListener('click', (e) => { e.preventDefault(); if (!isOn()) return; focusId = id; unit.activate(); });
    el.addEventListener('pointerdown', () => {
      if (!isOn()) return;
      focusId = id;
      if (!plain) setPress(id);
      unit.render();
    });
    el.addEventListener('pointerup', clearPress);
    unit.render();
    return register(unit);
  }

  function buildReadout(parent, id, label, getVal, { noGap } = {}) {
    if (!noGap) gap(parent);
    const el = mkEl('div', 'row', parent);
    const unit = {
      id, kind: 'readout', rows: [el],
      render() { applyGrid(el, rowSlider(label, getVal())); },
      liveSig: () => String(getVal()),
      nudge() {}, activate() {},
    };
    unit.render();
    return register(unit);
  }

  function buildHeader(parent, id, title, { open = false, alwaysOpen = false, valueFn, accordion = true } = {}) {
    gap(parent);
    const el = mkEl('button', 'hit row osdsol-hdr', parent);
    el.type = 'button';
    const body = mkEl('div', 'group-body', parent);
    let expanded = alwaysOpen || open;
    const unit = {
      id, kind: 'header', rows: [el], body, childUnits: [],
      isOpen: () => expanded,
      render() {
        const mark = expanded ? '-' : '+';
        applyGrid(el, rowHeader(mark, title, valueFn ? valueFn() : null), cutOpts(id));
        body.style.display = expanded ? '' : 'none';
      },
      liveSig: () => `${expanded ? 1 : 0}|${valueFn ? valueFn() : ''}`,
      expand(origin) {
        if (expanded) return;
        if (accordion) headers.forEach(h => { if (h !== unit && !h._always) h.collapse(); });
        expanded = true;
        unit.render();
        // Layout body first, then shimmer all visible children (rAF for isShown/rects)
        unit.childUnits.forEach((c) => { try { c.render?.(); } catch { /* */ } });
        requestAnimationFrame(() => {
          // Same expand recipe as menu-open phase-2 (ghost dens/scramble)
          shimmerFrom(unit.childUnits, origin, { ...SHIMMER.expand });
        });
      },
      collapse() {
        if (!expanded || alwaysOpen) return;
        const focusInBody = unit.childUnits.some((c) => c.id === focusId);
        expanded = false;
        unit.render();
        // Orphan recovery: collapsed section must not leave kb on hidden rows
        if (focusInBody) focusId = id;
      },
      activate(origin) {
        if (alwaysOpen) return;
        if (expanded) unit.collapse(); else unit.expand(origin);
      },
      nudge() { unit.activate(); },
      _always: alwaysOpen,
      navGroup: 'menu',
    };
    if (!expanded) body.style.display = 'none';
    // Clean toggle: pointerup without drag — never steal child notch drags
    let hdrDown = null;
    el.style.cursor = 'pointer';
    el.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      hdrDown = { x: e.clientX, y: e.clientY, id: e.pointerId };
      focusId = id;
      setPress(id);
      unit.render();
    });
    const hdrUp = (e) => {
      if (!hdrDown || e.pointerId !== hdrDown.id) return;
      const dist = Math.hypot(e.clientX - hdrDown.x, e.clientY - hdrDown.y);
      hdrDown = null;
      clearPress();
      if (dist < 8) {
        e.preventDefault();
        unit.activate({ x: e.clientX, y: e.clientY });
        repaintAll();
      } else {
        unit.render();
      }
    };
    el.addEventListener('pointerup', hdrUp);
    el.addEventListener('pointercancel', () => { hdrDown = null; clearPress(); unit.render(); });
    // Kill legacy click double-fire after pointerup
    el.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); });
    unit.render();
    headers.push(unit);
    return register(unit);
  }

  /**
   * Ephemeral top readout — 2 lines above a pad.
   * Visible while interacting; after hideMs, density shimmer-out then hide.
   */
  function attachTopReadout(col, {
    linesFn, // () => [line0, line1]
    hideMs = 700,
  }) {
    const readEl = mkEl('div', 'pad-readout', col);
    readEl.style.display = 'none';
    let hideTimer = 0;
    let animTimers = [];
    let gen = 0;
    let visible = false;

    const clearAnim = () => {
      animTimers.forEach(clearTimeout);
      animTimers = [];
    };

    const paint = () => {
      const lines = linesFn() || [' ', ' '];
      applyGrid(readEl, `${lines[0] || ' '}\n${lines[1] || ' '}`, {});
    };

    const show = () => {
      if (hideTimer) { clearTimeout(hideTimer); hideTimer = 0; }
      clearAnim();
      gen += 1;
      visible = true;
      readEl.style.display = '';
      readEl.__shimmering = false;
      paint();
    };

    const scheduleHide = () => {
      if (hideTimer) clearTimeout(hideTimer);
      const g = ++gen;
      hideTimer = setTimeout(() => {
        if (g !== gen) return;
        clearAnim();
        const lines0 = linesFn() || [' ', ' '];
        const ramp = [...DENS].reverse();
        const FRM = FRAME_MS / 2;
        readEl.__shimmering = true;
        ramp.forEach((d, fi) => {
          animTimers.push(setTimeout(() => {
            if (g !== gen) return;
            const masked = lines0.map((ln) =>
              [...String(ln)].map((c) => (c === ' ' ? ' ' : d)).join('')
            ).join('\n');
            applyGrid(readEl, masked, {});
          }, fi * FRM));
        });
        animTimers.push(setTimeout(() => {
          if (g !== gen) return;
          readEl.__shimmering = false;
          readEl.style.display = 'none';
          visible = false;
          applyGrid(readEl, ' \n ', {});
        }, ramp.length * FRM + 40));
      }, hideMs);
    };

    return {
      el: readEl,
      show,
      paint,
      scheduleHide,
      isVisible: () => visible,
    };
  }

  /**
   * XY pad — column: 2-line top readout (drag only) + field.
   * axisLabels: [xLabel, yLabel] e.g. ['FRQ','AMP']
   * formatReadout: (nx,ny) => ({ x, y }) display strings
   */
  function buildXYPad(parent, id, label, {
    getXY, setXY, wrapX = false, ghost = false,
    axisLabels = null, formatReadout = null,
  } = {}) {
    const col = mkEl('div', 'pad-col xy-wrap', parent);
    col.__noShimmer = true;

    const read = attachTopReadout(col, {
      linesFn: () => {
        const { nx, ny } = getXY();
        let xLab = 'X', yLab = 'Y', xVal, yVal;
        if (axisLabels && axisLabels.length >= 2) {
          xLab = clip(String(axisLabels[0] || 'X'), 3);
          yLab = clip(String(axisLabels[1] || 'Y'), 3);
        } else if (label) {
          xLab = clip(String(label).replace('·', ''), 3);
          yLab = 'Y';
        }
        if (formatReadout) {
          const f = formatReadout(nx, ny);
          xVal = clip(String(f.x ?? ''), 4);
          yVal = clip(String(f.y ?? ''), 4);
        } else {
          xVal = `${Math.round(clamp(nx, 0, 1) * 99)}`.padStart(2, '0');
          yVal = `${Math.round(clamp(ny, 0, 1) * 99)}`.padStart(2, '0');
        }
        // two lines above pad: "AMP 0.15" / "FRQ 1.00" (y then x — amp on top)
        const L0 = clip(`${yLab} ${yVal}`, XY_W).padEnd(XY_W);
        const L1 = clip(`${xLab} ${xVal}`, XY_W).padEnd(XY_W);
        return [L0, L1];
      },
    });

    const padEl = mkEl('div', 'hit osdsol-xy xy-pad', col);
    padEl.__noShimmer = true;

    const padGrid = () => {
      const { nx, ny } = getXY();
      const colN = clamp(Math.round(clamp(nx, 0, 1) * (XY_W - 1)), 0, XY_W - 1);
      const row = clamp(Math.round((1 - clamp(ny, 0, 1)) * (XY_H - 1)), 0, XY_H - 1);
      const lines = [];
      for (let r = 0; r < XY_H; r++) {
        let s = '';
        for (let c = 0; c < XY_W; c++) s += (r === row && c === colN) ? '█' : '░';
        lines.push(s);
      }
      return lines.join('\n');
    };

    const unit = {
      id, kind: 'xypad', rows: [padEl], navGroup: 'pad',
      render() {
        applyGrid(padEl, padGrid(), {});
        if (read.isVisible()) read.paint();
      },
      liveSig: () => {
        const { nx, ny } = getXY();
        return `${nx.toFixed(4)}|${ny.toFixed(4)}|${read.isVisible() ? 1 : 0}`;
      },
      nudge(dir, coarse) {
        const { nx, ny } = getXY();
        let x = nx + (coarse ? 0.05 : 0.02) * dir;
        x = wrapX ? (((x % 1) + 1) % 1) : clamp(x, 0, 1);
        setXY(x, ny);
        read.show();
        unit.render();
        read.scheduleHide();
      },
      activate() {},
    };
    wireXYDrag(padEl, {
      wrapX,
      cols: XY_W,
      rows: XY_H,
      setXY: (nx, ny) => {
        setXY(nx, ny);
        read.show();
        unit.render();
      },
      onStart: () => {
        focusId = id;
        read.show();
        unit.render();
        dimExcept(unit);
      },
      onEnd: () => {
        undim();
        unit.render();
        read.scheduleHide();
      },
    });
    unit.render();
    return register(unit);
  }

  /**
   * Align joysquare — XY footprint. ░ snap notches · █ selection · cross tracks.
   * 2-line top readout only while drag; shimmer-out after release.
   */
  function buildJoySquare(parent, id, { getHV, setHV, gapBefore = false } = {}) {
    if (gapBefore) gap(parent);
    const col = mkEl('div', 'pad-col joy-wrap', parent);
    col.__noShimmer = true;

    const JW = XY_W;
    const JH = XY_H;
    const snapCol = (h) => (h === 0 ? 0 : h === 2 ? JW - 1 : (JW - 1) >> 1);
    const snapRow = (v) => (v === 0 ? 0 : v === 2 ? JH - 1 : (JH - 1) >> 1);
    const SNAP_CS = [snapCol(0), snapCol(1), snapCol(2)];
    const SNAP_RS = [snapRow(0), snapRow(1), snapRow(2)];

    let visC = snapCol(1);
    let visR = snapRow(1);
    let velC = 0;
    let velR = 0;
    let joyDrag = false;
    let lastTick = performance.now();
    const STIFF = 180;
    const DAMP = 16;

    const targetFromHV = () => {
      const { h, v } = getHV();
      return {
        c: snapCol(clamp(h | 0, 0, 2)),
        r: snapRow(clamp(v | 0, 0, 2)),
        h: clamp(h | 0, 0, 2),
        v: clamp(v | 0, 0, 2),
      };
    };

    const read = attachTopReadout(col, {
      linesFn: () => {
        const t = targetFromHV();
        const H = ['L', 'C', 'R'][t.h];
        const V = ['T', 'M', 'B'][t.v];
        return [
          clip(`ALN ${H}`, JW).padEnd(JW),
          clip(`    ${V}`, JW).padEnd(JW),
        ];
      },
    });

    const padEl = mkEl('div', 'hit osdsol-xy joy-pad', col);
    padEl.__noShimmer = true;

    const stepVis = () => {
      const now = performance.now();
      let dt = (now - lastTick) / 1000;
      lastTick = now;
      if (dt > 0.05) dt = 0.05;
      if (dt < 0.001) dt = 0.001;
      if (joyDrag) return;
      const t = targetFromHV();
      const ac = STIFF * (t.c - visC) - DAMP * velC;
      const ar = STIFF * (t.r - visR) - DAMP * velR;
      velC += ac * dt;
      velR += ar * dt;
      visC += velC * dt;
      visR += velR * dt;
      if (Math.abs(t.c - visC) < 0.02 && Math.abs(velC) < 0.05) { visC = t.c; velC = 0; }
      if (Math.abs(t.r - visR) < 0.02 && Math.abs(velR) < 0.05) { visR = t.r; velR = 0; }
    };

    const padGrid = () => {
      stepVis();
      const hc = clamp(Math.round(visC), 0, JW - 1);
      const hr = clamp(Math.round(visR), 0, JH - 1);
      const lines = [];
      for (let r = 0; r < JH; r++) {
        let s = '';
        for (let c = 0; c < JW; c++) {
          const isSnap = SNAP_CS.includes(c) && SNAP_RS.includes(r);
          const isKnob = (r === hr && c === hc);
          if (isKnob) s += '█';
          else if (isSnap) s += '░'; // light fill corner/mid markers
          else if (r === hr) s += '─';
          else if (c === hc) s += '│';
          else s += ' ';
        }
        lines.push(s);
      }
      return lines.join('\n');
    };

    const applyFromClient = (clientX, clientY) => {
      const r = padEl.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) return;
      const cw = cellPx(padEl);
      const gc = padEl.querySelector?.('.gc');
      const ch = (gc?.offsetHeight > 0) ? gc.offsetHeight : cw;
      const fw = JW * cw;
      const fh = JH * ch;
      const nx = clamp((clientX - r.left) / fw, 0, 1);
      const ny = clamp((clientY - r.top) / fh, 0, 1);
      visC = nx * (JW - 1);
      visR = ny * (JH - 1);
      velC = 0;
      velR = 0;
      const h = clamp(Math.round(nx * 2), 0, 2);
      const v = clamp(Math.round(ny * 2), 0, 2);
      setHV(h, v);
      read.show();
      unit.render();
    };

    const unit = {
      id, kind: 'joysquare', rows: [padEl], navGroup: 'pad',
      render() {
        applyGrid(padEl, padGrid(), {});
        if (read.isVisible()) read.paint();
      },
      liveSig: () => {
        stepVis();
        const t = targetFromHV();
        return `joy|${visC.toFixed(3)}|${visR.toFixed(3)}|${t.h}|${t.v}|${joyDrag ? 1 : 0}|${read.isVisible() ? 1 : 0}`;
      },
      nudge(dir) {
        const { h, v } = getHV();
        setHV(clamp(h + dir, 0, 2), v);
        read.show();
        unit.render();
        read.scheduleHide();
      },
      activate() {},
    };

    wirePointerDrag(padEl, {
      onStart: (e) => {
        focusId = id;
        setPress(id);
        joyDrag = true;
        read.show();
        applyFromClient(e.clientX, e.clientY);
        dimExcept(unit);
      },
      onMove: (e) => applyFromClient(e.clientX, e.clientY),
      onEnd: () => {
        joyDrag = false;
        clearPress();
        undim();
        unit.render();
        read.scheduleHide();
      },
    });
    {
      const t = targetFromHV();
      visC = t.c;
      visR = t.r;
    }
    unit.render();
    return register(unit);
  }

  /**
   * Vertical fill bar (e.g. wave SPEED) — same height as XY pad.
   * 2-line top readout only while drag; shimmer-out after.
   * get/set: 0..1 normalized (or use min/max with getValue/setValue)
   */
  function buildVBar(parent, id, {
    get, set, min = 0, max = 1,
    label = 'SPD',
    formatVal: fmtV = null,
    cols = 3,
  } = {}) {
    const col = mkEl('div', 'pad-col vbar-wrap', parent);
    col.__noShimmer = true;
    const H = XY_H;
    const W = Math.max(1, cols | 0);

    const norm = () => clamp((get() - min) / Math.max(1e-9, max - min), 0, 1);
    const fromNorm = (n) => min + clamp(n, 0, 1) * (max - min);

    const read = attachTopReadout(col, {
      linesFn: () => {
        const v = get();
        const vs = fmtV ? fmtV(v) : fmt(v);
        return [
          clip(String(label), W).padEnd(W),
          clip(String(vs), W).padStart(W),
        ];
      },
    });

    const padEl = mkEl('div', 'hit osdsol-xy vbar-pad', col);
    padEl.__noShimmer = true;

    const padGrid = () => {
      const n = norm();
      const fillRows = Math.round(n * H);
      const lines = [];
      for (let r = 0; r < H; r++) {
        // fill from bottom
        const fromBottom = H - 1 - r;
        const on = fromBottom < fillRows;
        lines.push((on ? '█' : '░').repeat(W));
      }
      return lines.join('\n');
    };

    const applyFromClient = (clientY) => {
      const r = padEl.getBoundingClientRect();
      if (r.height < 1) return;
      // top = max, bottom = min (drag up = faster)
      const ny = 1 - clamp((clientY - r.top) / r.height, 0, 1);
      set(fromNorm(ny));
      read.show();
      unit.render();
    };

    const unit = {
      id, kind: 'vbar', rows: [padEl], navGroup: 'pad',
      render() {
        applyGrid(padEl, padGrid(), {});
        if (read.isVisible()) read.paint();
      },
      liveSig: () => `${norm().toFixed(4)}|${read.isVisible() ? 1 : 0}`,
      nudge(dir, coarse) {
        const step = (max - min) * (coarse ? 0.1 : 0.02);
        set(clamp(get() + dir * step, min, max));
        read.show();
        unit.render();
        read.scheduleHide();
      },
      activate() {},
    };

    wirePointerDrag(padEl, {
      onStart: (e) => {
        focusId = id;
        setPress(id);
        applyFromClient(e.clientY);
        dimExcept(unit);
      },
      onMove: (e) => applyFromClient(e.clientY),
      onEnd: () => {
        clearPress();
        undim();
        unit.render();
        read.scheduleHide();
      },
    });
    unit.render();
    return register(unit);
  }

  /** Attach built control as child of header for shimmer-on-expand */
  function adopt(header, ...kids) {
    kids.forEach(k => header.childUnits.push(k));
    return kids;
  }

  function paint() {
    // While ghosting: do NOT liveSig-repaint — that would wipe the · skeleton (ADD lesson).
    if (ghosting) return;
    units.forEach(u => {
      if (!u.liveSig) return;
      if (u.rows[0]?.__shimmering) return;
      if (u.rows.some?.((r) => r?.__shimmering)) return;
      // skip the unit currently being dragged so we don't fight its own render
      if (dragging && (u.id === pressId || u.id === focusId)
        && (u.kind === 'slider' || u.kind === 'xypad' || u.kind === 'joysquare' || u.kind === 'vbar')) {
        return;
      }
      const sig = u.liveSig();
      if (sig !== u._sig) { u._sig = sig; u.render(); }
    });
  }

  /**
   * Keyboard navigation.
   * @param {{
   *   onHide?: () => void,
   *   filter?: (e: KeyboardEvent) => boolean,
   *   getScope?: () => 'menu'|'pad'|'all',  // menu open → 'menu'; closed → 'pad'
   * }} [opts]
   */
  function wireKeys({ onHide, filter, getScope } = {}) {
    const NAV = new Set([
      'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
      'Enter', ' ', 'PageUp', 'PageDown', 'Home', 'End',
    ]);
    window.addEventListener('keydown', (e) => {
      if (filter && !filter(e)) return;
      const tag = e.target?.tagName || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 'h' || e.key === 'H') { onHide?.(); return; }
      if (!NAV.has(e.key)) return;

      const scope = (typeof getScope === 'function' ? getScope() : null) || 'all';
      const list = focusList(scope);
      if (!list.length) return;

      kbNav = true;
      e.preventDefault();

      let idx = resolveFocusIdx(list);
      if (idx < 0) return;

      if (e.key === 'ArrowDown') {
        idx = (idx + 1) % list.length;
        focusId = list[idx].id;
        repaintAll();
        scrollFocusUnit(list[idx]);
      } else if (e.key === 'ArrowUp') {
        idx = (idx - 1 + list.length) % list.length;
        focusId = list[idx].id;
        repaintAll();
        scrollFocusUnit(list[idx]);
      } else if (e.key === 'PageDown') {
        idx = stepPage(list, idx, +1);
        focusId = list[idx].id;
        repaintAll();
        scrollFocusUnit(list[idx]);
      } else if (e.key === 'PageUp') {
        idx = stepPage(list, idx, -1);
        focusId = list[idx].id;
        repaintAll();
        scrollFocusUnit(list[idx]);
      } else if (e.key === 'Home') {
        idx = 0;
        focusId = list[idx].id;
        repaintAll();
        scrollFocusUnit(list[idx]);
      } else if (e.key === 'End') {
        idx = list.length - 1;
        focusId = list[idx].id;
        repaintAll();
        scrollFocusUnit(list[idx]);
      } else if (e.key === 'ArrowLeft') {
        list[idx].nudge?.(-1, e.shiftKey);
      } else if (e.key === 'ArrowRight') {
        list[idx].nudge?.(1, e.shiftKey);
      } else if (e.key === 'Enter' || e.key === ' ') {
        list[idx].activate?.();
        // After accordion toggle, list may change — recover if needed
        requestAnimationFrame(() => {
          recoverOrphanFocus(scope);
          repaintAll();
          const u = units.find((x) => x.id === focusId);
          if (u) scrollFocusUnit(u);
        });
      }
    });
  }

  // blink loop for toggles/cyclers/plain buttons
  function startBlink() {
    const g = ++blinkGen;
    const tick = () => {
      if (g !== blinkGen) return;
      units.forEach((u) => {
        // Never wipe an in-flight dens/scramble (plain RESET PORTS was stuck on truth)
        if ((u.rows || []).some((r) => r?.__shimmering)) return;
        if ((u.kind === 'toggle' || u.kind === 'cycler' || (u.kind === 'button' && u.plain))
          && isShown(u.rows[0])) u.render();
      });
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  startBlink();

  function clear() {
    units.length = 0;
    headers.length = 0;
  }

  // MIDI appear helper attached to host
  function createMidiAppear(osdEl, learnChipEl) {
    let transientTimer = null, osdHideTimer = null, osdShownAt = 0, learnActive = false, learnSlotIdx = 0;
    const held = new Map();
    const slotOrder = ['knob', 'B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B9', 'B10', 'B11', 'B12'];
    const NMSVE = { knob: { kind: 'cc', ch: 0, id: 1 } };
    for (let i = 0; i < 12; i++) NMSVE['B' + (i + 1)] = { kind: 'note', ch: 0, id: 36 + i };
    const bar = (norm) => {
      const n = 12, f = Math.max(0, Math.min(n, Math.round(norm * n)));
      return FILL.repeat(f) + EMPTY.repeat(n - f);
    };
    function render() {
      if (transientTimer) return;
      if (learnActive) {
        applyGrid(osdEl, rowFit(`learn  ${slotOrder[learnSlotIdx]}  · tab · esc · l`, 40));
        osdEl.classList.add('visible');
        if (learnChipEl) {
          learnChipEl.textContent = `learning ${slotOrder[learnSlotIdx]}  ·  l = nmsve`;
          learnChipEl.classList.add('visible');
        }
        return;
      }
      if (held.size > 0) {
        if (osdHideTimer) { clearTimeout(osdHideTimer); osdHideTimer = null; }
        applyGrid(osdEl, [...held.values()].map(p => {
          const v = p.get();
          return `${p.label}   ${bar((v - p.min) / (p.max - p.min || 1))}  ${p.fmt ? p.fmt(v) : fmt(v)}`;
        }).join('\n'));
        osdEl.classList.add('visible');
        if (!osdShownAt) osdShownAt = performance.now();
        return;
      }
      const elapsed = performance.now() - osdShownAt;
      if (osdShownAt > 0 && elapsed < OSD_MIN_MS) {
        if (osdHideTimer) clearTimeout(osdHideTimer);
        osdHideTimer = setTimeout(() => { osdHideTimer = null; render(); }, OSD_MIN_MS - elapsed);
        return;
      }
      osdEl.classList.remove('visible');
      osdShownAt = 0;
    }
    return {
      NMSVE,
      hold(id, slot) { held.set(id, slot); render(); },
      release(id) { held.delete(id); render(); },
      showTransient(msg, ms = 1200) {
        ms = Math.max(OSD_MIN_MS, ms);
        if (transientTimer) clearTimeout(transientTimer);
        applyGrid(osdEl, String(msg));
        osdEl.classList.add('visible');
        if (!osdShownAt) osdShownAt = performance.now();
        transientTimer = setTimeout(() => { transientTimer = null; render(); }, ms);
      },
      enterLearn() { learnActive = true; learnSlotIdx = 0; held.clear(); render(); },
      exitLearn() { learnActive = false; learnChipEl?.classList.remove('visible'); render(); },
      learnAdvance() { learnSlotIdx = (learnSlotIdx + 1) % slotOrder.length; render(); },
      loadNmsve() {
        this.showTransient('NMSVE preset loaded', 1500);
        setTimeout(() => { learnActive = false; learnChipEl?.classList.remove('visible'); render(); }, 1100);
        return { ...NMSVE };
      },
      get learnActive() { return learnActive; },
      render,
    };
  }

  function createCredits(host, lines) {
    let gen = 0;
    const timers = [];
    const clearT = () => { timers.forEach(clearTimeout); timers.length = 0; };
    const push = (fn, ms) => timers.push(setTimeout(fn, ms));
    return {
      intro() {
        clearT();
        const g = ++gen;
        host.style.display = '';
        host.innerHTML = '';
        const rows = lines.map(() => mkEl('div', 'credit-line', host));
        let t = 0;
        lines.forEach((text, i) => {
          push(() => {
            if (g !== gen) return;
            const row = rows[i];
            const start = performance.now();
            const step = (now) => {
              if (g !== gen) return;
              const el = now - start;
              let s = '';
              for (let j = 0; j < text.length; j++) {
                const ch = text[j];
                if (ch === ' ') { s += ' '; continue; }
                s += j < Math.floor((el / (WORD_MS * 1.2)) * text.length) ? ch : subChar(ch);
              }
              applyGrid(row, s);
              if (el < 280) requestAnimationFrame(step);
              else applyGrid(row, text);
            };
            requestAnimationFrame(step);
          }, t);
          t += 300;
        });
      },
      outro(fast = true) {
        const g = gen;
        const rows = [...host.querySelectorAll('.credit-line')];
        const ramp = [...DENS].reverse();
        const FRM = fast ? 8 : 16, STAG = fast ? 6 : 40;
        rows.forEach((row, pos) => {
          const target = row.textContent || '';
          const mask = (d) => { let s = ''; for (const ch of target) s += ch === ' ' ? ' ' : d; return s; };
          ramp.forEach((d, fi) => push(() => { if (g === gen) applyGrid(row, mask(d)); }, pos * STAG + fi * FRM));
          push(() => { if (g === gen) applyGrid(row, ' '); }, pos * STAG + ramp.length * FRM);
        });
        push(() => { if (g === gen) host.style.display = 'none'; }, rows.length * STAG + 80);
      },
      stop() { clearT(); ++gen; host.style.display = 'none'; },
    };
  }

  return {
    VERSION, root, units, headers,
    setScale, setBlend, setColors, get scale() { return scale; }, get blend() { return blend; },
    focus, setPress, clearPress, get focusId() { return focusId; }, set focusId(v) { focusId = v; },
    get kbNav() { return kbNav; }, set kbNav(v) { kbNav = !!v; },
    cutOpts, repaintAll, paint, clear,
    focusList, unitNavGroup, recoverOrphanFocus, scrollFocusUnit,
    shimmerFrom, shimmerOut, ghostMask, dimExcept, undim,
    buildSlider, buildToggle, buildCycler, buildButton, buildReadout, buildHeader, buildXYPad,
    buildJoySquare, buildVBar,
    adopt, gap, applyGrid, rowFit, wireKeys, wireDrag, wirePointerDrag, wireXYDrag,
    createMidiAppear, createCredits,
    register,
  };
}

// Stage framework (ports · shape skins · snap · float knobs) — single import path
export {
  measureCell,
  snapToAscii,
  placeAtGrip,
  placeCentered,
  createStageLayer,
  createFloatKnob,
  showReadoutLines,
  scheduleHideReadout,
  hideReadoutNow,
  PORT_COLS,
  PORT_ROWS,
  PORT_CENTER_COL,
  PORT_CENTER_ROW,
  PORT_GRIP_COL,
  PORT_GRIP_ROW,
  portBody,
  portReadoutLines,
  paintPortVisual,
  createPortKnobs,
  SHAPE,
  readyPhase,
  readyOpts,
  skinLedBody,
  skinLedLabel,
  skinHgtBody,
  skinHgtLabel,
  skinKrnLabel,
  skinKrnValue,
  skinKrnBody,
  skinWdtLabel,
  skinWdtValue,
  skinWdtBody,
  skinAspBody,
  skinAspLabel,
  portCursor,
  shapeCursor,
  paintShapeKnob,
  hideKnob,
} from './stage.js';

export default { VERSION, createHuddi, applyGrid, wirePointerDrag, MENU_W, XY_W, XY_H };
