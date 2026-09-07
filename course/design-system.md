# Design system

Scaffold for *Art of Chemex* visual language. Tokens live in `theme.css` (`:root`). Three type roles — do not mix.

## Type roles (strict)

| Role | Face | Weight / axes | Color | Where |
|------|------|---------------|-------|-------|
| **1 · HUD chrome** | Silkscreen (HUDDI) | **400 only** — never 700; 16px (= 8px×`--s:2`); no antialias | Coffee `#5C3A21` (active nav → turquoise) | **`h3`+**, sidebar links, small labels, `.hud` / `.meta` / REVIEW badges, inline `code` |
| **2 · Headlines** | Google Sans Flex (variable) | Thin via `font-variation-settings` + CSS vars | **h1** turquoise · **h2** coffee | `h1`–`h2`, `.app-name` — **not** h3 |
| **3 · Body** | Inter | 400 (system stack) | Ink `#2A1F18` | Paragraphs, lists, tables, blockquotes — **all** running copy |

### Live specimens

<div class="type-specimen">
  <div class="label">H1 · Flex · wght 120 · turquoise</div>
</div>

# Art of Chemex

<div class="type-specimen">
  <div class="label">H2 · Flex · wght 200 · coffee</div>
</div>

## Filtering device as domestic object

<div class="type-specimen">
  <div class="label">H3 · Silkscreen HUD · 400 · 16px · coffee</div>
</div>

### Borosilicate, wood, leather

<div class="type-specimen">
  <div class="label">HUD · Silkscreen 400 · 16px · unantialiased</div>
  <p class="hud">SIDEBAR · REVIEW · META · OSD · H3+</p>
</div>

<div class="type-specimen">
  <div class="label">Body · Inter 400 · ink</div>
</div>

The Chemex is an hourglass pour-over: laboratory typology brought into the kitchen. Body copy stays Inter so long reading never competes with HUD chrome or Flex display.

## Color tokens

| Token | Value | Use |
|-------|-------|-----|
| `--color-cream` | `#F7F1E5` | Page / sidebar ground |
| `--color-turquoise` | `#1AA7A0` | h1, links, active nav, theme |
| `--color-coffee` | `#5C3A21` | h2, h3+ HUD, borders |
| `--color-ink` | `#2A1F18` | Body text |

## Flex axes (Google Sans Flex — full Latin variable)

> **NOTE — never use the ADD-dub glyph subset for body/headlines.**  
> `gsflex-aldyub.woff2` (~39KB) only covers letters in “ALL DAY DUB” (and similar). Missing glyphs fall back to Docsify/system bold and break thin Flex headlines (e.g. thin “A”, bold dark rest of “Art of Chemex”).  
> **Always ship the full Latin variable Flex** (`google-sans-flex-latin-full-normal.woff2` or equivalent, well above 100KB — typically ~200KB–2MB, with `wght` + `wdth` + `opsz` at minimum). Filename in-repo: `assets/fonts/GoogleSansFlex.woff2`.

Available variation axes on the checked-in full `GoogleSansFlex.woff2`:

| Axis | Tag | Headline defaults (h1/h2 only) |
|------|-----|-------------------|
| Weight | `wght` | h1 `120` · h2 `200` (`--wght-h*`) |
| Width | `wdth` | h1 `100` · h2 `105` |
| Optical size | `opsz` | h1 `144` · h2 `36` |
| Grade | `GRAD` | `0` |
| Roundness | `ROND` | `0` |

**h3 is not Flex** — Silkscreen 400 HUD chrome (same as sidebar / `.hud`). No `--wght-h3` / `--wdth-h3` / `--opsz-h3` required.

Thin but not broken-hairline: prefer ~120+ for display; avoid `wght` 1 for long titles.

CSS variables to tune:

```css
--font-flex / --font-silkscreen / --font-body
--wght-h1 --wght-h2
--wdth-h1 --wdth-h2 --opsz-h1 --opsz-h2
--color-cream --color-turquoise --color-coffee --color-ink
```

### Headline interaction (Flex axes)

Headlines animate via `font-variation-settings` (default tokens above; `transition: font-variation-settings 180ms ease`). Keep axes on CSS vars so future hover/scroll can retarget `wght` / `wdth` / `opsz` without swapping faces.

**Docsify `vue.css` must not win on type:** it sets heading `font-weight` bold/600 and an `h1` `border-bottom` theme-color line. `theme.css` overrides with high-specificity `!important`, `font-synthesis: none`, keyword-range `font-weight` (100/200 for Flex h1/h2; 400 for Silkscreen h3+), and `border-bottom: none` so Safari never mixes synthetic bold with thin Flex glyphs. Do not reintroduce `font-weight` on `h*` from vue or other theme sheets.

## Image rendering rules

| Class / path | Rendering | Use |
|--------------|-----------|-----|
| `img.smooth` | `auto` (smooth) | Product / lifestyle photos |
| `img.raster` / `img.pixel` / `src*="patents"` | `pixelated` / `crisp-edges` | Patent figs, PS1-style rasters |

HQ product refs: [`assets/reference/product/`](/art-of-chemex/assets/reference/ART-DIRECTION.md). Gallery: [09 · Art reference](09-art-reference.md).

## Camera moves / art style

> **TBD** — PS1-era raster look, camera moves, and motion grammar for workshop media. Placeholder until art direction is locked.

See **[ART-DIRECTION.md](/art-of-chemex/assets/reference/ART-DIRECTION.md)** for geometry, materials, product ref links, and patent figure notes.

## HUDDI note

Animated Silkscreen OSD components live in the maker HUDDI kit — **reuse `createHuddi` + shimmer; do not invent**.

| Path | Role |
|------|------|
| `designst3in/viz` → `vendor/huddi/` | Canonical kit (`huddi.js`, `huddi.css`, `shimmer.js`, `stage.js`, `fonts/`) |
| `/workspace/viz-protos/shared/huddi/` | Local checkout used by protos |
| `assets/vendor/huddi/` | Snapshot in this repo for future chrome (not loaded by Docsify yet) |
| [synthstation.pages.dev](https://synthstation.pages.dev) · [add-dub.pages.dev](https://add-dub.pages.dev) | Live demos |

Rules: integer scale `8px×--s`, no antialias, **Silkscreen weight 400 only** (never 700 / never bold). This Docsify site mirrors those chrome rules in `theme.css` for sidebar/labels — not a full HUDDI runtime embed yet.

## Related

- [ART-DIRECTION.md](/art-of-chemex/assets/reference/ART-DIRECTION.md)
- [09 · Art reference](09-art-reference.md)
- [SOURCES](/art-of-chemex/assets/SOURCES.md)
