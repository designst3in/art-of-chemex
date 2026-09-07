# Design system (internal)

Editor catalog for *Art of Chemex*. Source of truth for CSS tokens: [`../theme.css`](../theme.css).  
**Do not link this page from `_sidebar.md`.** Entry point for editors: [`NOTES.md`](../NOTES.md) §2.

---

## Parts catalog

### Colors

| Token | Hex | Use |
|-------|-----|-----|
| `--color-turquoise` | `#4bb4bb` | h1, links, active nav, Docsify `themeColor`, OG tint |
| `--color-turquoise` hover | `#3a9ea5` | Link / interactive hover |
| `--color-coffee` | `#5C3A21` | h2, h3+ Silkscreen chrome, borders, OG credits |
| `--color-cream` | `#F7F1E5` | Page / sidebar ground; OG title |
| `--color-ink` | `#2A1F18` | Body text |
| `--border-soft` | `rgba(92, 58, 33, 0.18)` | Soft separators / card edge |

Legacy aliases in CSS: `--cream`, `--turquoise`, `--coffee`, `--ink`.

### Type roles (strict — do not mix)

| Role | Face | Weight / axes | Color | Where |
|------|------|---------------|-------|-------|
| **Headlines** | Google Sans Flex (variable) | Thin via `font-variation-settings` | **h1** turquoise · **h2** coffee | `h1`–`h2`, `.app-name` — **not** h3 |
| **Chrome / labels** | Silkscreen | **400 only** — never 700; 16px; no antialias | Coffee (active nav → turquoise) | **`h3`+**, sidebar links, `.hud` / `.meta`, inline `code` |
| **Body** | Inter | 400 | Ink | Paragraphs, lists, tables, blockquotes |

**Font files**

- Flex (full Latin variable): `assets/fonts/GoogleSansFlex.woff2` — never the ADD-dub glyph subset
- Silkscreen + Inter: Google Fonts link in `index.html`

**Flex axis defaults** (`theme.css` `:root`)

| | h1 | h2 |
|--|----|----|
| `wght` | 120 | 200 |
| `wdth` | 100 | 105 |
| `opsz` | 144 | 36 |
| `GRAD` / `ROND` | 0 | 0 |

h3 is **not** Flex — no `--wght-h3`. Docsify `vue.css` heading bold/border must stay overridden (`font-synthesis: none`, keyword-range `font-weight`).

### Links & buttons

- In-content links: turquoise, 1px underline at ~35% opacity; hover `#3a9ea5`
- No dedicated button component yet — prefer text links or Silkscreen `.hud` chrome for CTAs
- Sidebar active: turquoise Silkscreen 400 (never 700)

### Spacing / layout

| Token / rule | Value |
|--------------|--------|
| `--sidebar-width` | `280px` |
| `--content-max-width` | `42rem` |
| `--base-font-size` | `16px` (body renders ~16.5px) |
| Section padding | `2.5rem 2.75rem` (`.markdown-section`) |
| h2 top margin | `2rem` + soft inset separator |
| Body line-height | `1.7` |

### Image rules

| Class / path | Rendering | Use |
|--------------|-----------|-----|
| `img.smooth` | `auto` (smooth) | Product / lifestyle photos |
| `img.raster` / `img.pixel` / `src*="patents"` | `pixelated` / `crisp-edges` | Patent figs, PS1-style rasters |

Always prefer explicit `class="smooth"` on photos in markdown.

### OG image

Locked tokens: [`../assets/og-tokens.json`](../assets/og-tokens.json) · bake: [`../assets/og.png`](../assets/og.png)

| Spec | Value |
|------|--------|
| Canvas | 1200×630 |
| Method | White-bg Chemex photo as base (**not** rembg); full-frame `#4bb4bb` **Color** blend (`mix-blend-mode: color` / Photoshop Color = SetLum(Cs, Lum(Cb))); type over image |
| Source photo | `assets/reference/product/chemex-studio-white-front.jpg` |
| Title | “Art of Chemex” — cream `#F7F1E5`, Flex ~wght 90 / wdth 112 / opsz 144 |
| Credits block | **DESIGN SCIENTIST × KAT & KIN** — Silkscreen Regular 400, coffee `#5C3A21`, bottom-left |
| Approved | 2026-09-07 |

If another agent is rewriting OG, coordinate on `assets/og.png` — do not fight concurrent bakes.

---

## Live specimens

<div class="type-specimen">
  <div class="label">H1 · Flex · wght 120 · turquoise</div>
</div>

# Art of Chemex

<div class="type-specimen">
  <div class="label">H2 · Flex · wght 200 · coffee</div>
</div>

## Filtering device as domestic object

<div class="type-specimen">
  <div class="label">H3 · Silkscreen · 400 · 16px · coffee</div>
</div>

### Borosilicate, wood, leather

<div class="type-specimen">
  <div class="label">Label · Silkscreen 400 · 16px · unantialiased</div>
  <p class="hud">SIDEBAR · META · H3+ · CREDITS</p>
</div>

<div class="type-specimen">
  <div class="label">Body · Inter 400 · ink</div>
</div>

The Chemex is an hourglass pour-over: laboratory typology brought into the kitchen. Body copy stays Inter so long reading never competes with label chrome or Flex display.

<div class="type-specimen">
  <div class="label">Credits · Silkscreen · coffee (OG / colophon)</div>
  <p class="hud">DESIGN SCIENTIST × KAT &amp; KIN</p>
</div>

---

## How to extend

1. **New color** — add `--color-*` in `theme.css` `:root`, mirror in this catalog, bump `index.html` `?v=` cache-bust.
2. **New type role** — do **not** invent a fourth face without updating NOTES + this page. Prefer mapping to Flex / Silkscreen / Inter.
3. **Tune Flex** — change `--wght-h*` / `--wdth-h*` / `--opsz-h*` only; keep `font-synthesis: none`.
4. **New component** — document class name, token deps, and a specimen here before shipping in course pages.
5. **OG change** — update `assets/og-tokens.json` first, then bake `assets/og.png`, then note SHA in NOTES.
6. **Cache-bust** — after `theme.css` or `docsify-config.js` changes, bump `?v=` on both in `index.html`.

CSS variables to remember:

```css
--font-flex / --font-silkscreen / --font-body
--wght-h1 --wght-h2
--wdth-h1 --wdth-h2 --opsz-h1 --opsz-h2
--color-cream --color-turquoise --color-coffee --color-ink
```

## Related (repo)

- Theme: `theme.css` · config: `docsify-config.js`
- Art direction (participant-linked): `assets/reference/ART-DIRECTION.md`
- Product refs: `course/09-art-reference.md`
- Legacy public stub: `course/design-system.md` → points here
