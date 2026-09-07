# Art direction — Chemex

Working notes for geometry, materials, camera, and raster treatment. Product stills live in `product/`. Patent line art lives under `../images/patents/`.

## Geometry (object)

- **Silhouette:** one-piece hourglass — upper cone (filter/funnel) + lower flask; continuous borosilicate wall.
- **Proportions:** Erlenmeyer-adjacent lower body; funnel angle and spout/lip from utility patent **US2241368** + design **USD137943**.
- **Collar:** wood (often walnut / teak family) with leather thong tie; sits at the waist notch.
- **Filter:** bonded paper, multi-layer; air channel / groove critical to flow (see course module 03).

## Materials

| Part | Material | Notes |
|------|----------|--------|
| Vessel | Borosilicate (Pyrex / Corning lineage) | Lab glass → kitchen; unregulated wartime materials story |
| Collar | Wood | Warm contrast to glass |
| Tie | Leather | Soft fastener; period craft |
| Filter | Bonded paper | Proprietary thickness / shape |

Palette on site: cream ground, turquoise display, coffee HUD, ink body — see [Type tokens](/art-of-chemex/course/design-system.md).

## Product reference stills (HQ)

| File | Shot |
|------|------|
| `product/chemex-studio-white-front.jpg` | Studio, white, front |
| `product/chemex-studio-white-front-alt.webp` | Studio white alt |
| `product/chemex-lifestyle-mugs-kitchen.webp` | Lifestyle / kitchen + mugs |
| `product/chemex-studio-sage-green.webp` | Studio, sage green ground |
| `product/chemex-anatomy-design-annotated.jpg` | Anatomy / design annotated |

> **REVIEW:** Confirm rights / attribution before public projection. Treat as **reference** until cleared; list in [SOURCES](../SOURCES.md).

## Patent figures (line art)

- `../images/patents/US2241368-fig-page1.jpg` / `…-page2.jpg` — utility drawings
- `../images/patents/USD137943-fig-page1.jpg` / `…-page2.jpg` — design patent

Render with `img.raster` / path heuristic (`pixelated`) so line weight stays crisp.

## Camera moves (placeholder)

> **TBD** — orbit / push-in / pour POV grammar for workshop video and PS1-style rasters.

Suggested placeholders to lock later:

1. **Hero orbit** — slow yaw around waist/collar at 3/4 eye level  
2. **Pour insert** — high angle into filter bed  
3. **Anatomy cut** — match annotated still to exploded / cross-section  
4. **Patent wipe** — line art → product photo match-cut  

## PS1 raster notes (placeholder)

> **TBD** — affine texture warps, limited palette dither, low-res Z-fighting as *art* not bug. Prefer intentional `image-rendering: pixelated` assets over CSS-only downscale for final frames.

## Related

- [Design attributes](/art-of-chemex/course/design-attributes.md)
- [Type tokens](/art-of-chemex/course/design-system.md)
- [09 · Art reference](/art-of-chemex/course/09-art-reference.md)
- Open course photos: `../images/` (Brooklyn CC BY, Unsplash CC0)
