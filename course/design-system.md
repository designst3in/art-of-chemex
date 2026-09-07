# Design system

Scaffold for *Art of Chemex* visual language. Tokens live in `theme.css` (`:root`). Three type roles — do not mix.

## Type roles (strict)

| Role | Face | Weight / axes | Color | Where |
|------|------|---------------|-------|-------|
| **1 · HUD chrome** | Silkscreen (HUDDI) | **400 only** — never 700; 16px (= 8px×`--s:2`); no antialias | Coffee `#5C3A21` (active nav → turquoise) | Sidebar links, small labels, `.hud` / `.meta` / REVIEW badges, inline `code` |
| **2 · Headlines** | Google Sans Flex (variable) | Thin via `font-variation-settings` + CSS vars | **h1** turquoise · **h2/h3** coffee | `h1`–`h3`, `.app-name` |
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
  <div class="label">H3 · Flex · wght 280 · coffee</div>
</div>

### Borosilicate, wood, leather

<div class="type-specimen">
  <div class="label">HUD · Silkscreen 400 · 16px · unantialiased</div>
  <p class="hud">SIDEBAR · REVIEW · META · OSD</p>
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
| `--color-coffee` | `#5C3A21` | h2/h3, HUD, borders |
| `--color-ink` | `#2A1F18` | Body text |

## Flex axes (Google Sans Flex / ADD-dub)

Available variation axes on the checked-in `GoogleSansFlex.woff2`:

| Axis | Tag | Headline defaults |
|------|-----|-------------------|
| Weight | `wght` | h1 `120` · h2 `200` · h3 `280` (`--wght-h*`) |
| Width | `wdth` | h1 `100` · h2 `105` · h3 `100` |
| Optical size | `opsz` | h1 `144` · h2 `36` · h3 `24` |
| Grade | `GRAD` | `0` |
| Roundness | `ROND` | `0` |

Thin but not broken-hairline: prefer ~120+ for display; avoid `wght` 1 for long titles.

CSS variables to tune:

```css
--font-flex / --font-silkscreen / --font-body
--wght-h1 --wght-h2 --wght-h3
--wdth-h1 --opsz-h1
--color-cream --color-turquoise --color-coffee --color-ink
```

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

Animated Silkscreen OSD components live in sibling maker work (`viz-protos` / `huddi.css`: integer scale `8px×--s`, no antialias, no opacity state). This Docsify site uses the **same chrome rules** (Silkscreen 400, coffee, crisp) for sidebar/labels only — not a full HUDDI runtime embed yet.

## Related

- [ART-DIRECTION.md](/art-of-chemex/assets/reference/ART-DIRECTION.md)
- [09 · Art reference](09-art-reference.md)
- [SOURCES](/art-of-chemex/assets/SOURCES.md)
