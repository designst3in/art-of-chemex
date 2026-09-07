# NOTES — Master Review Log

Track fact-checks, missing sources, and open questions for the *Art of Chemex* workshop site.

## Working protocol

- This repo holds everything: course, assets, type tokens, art/media.
- Abhishek and Coffee Scientist both manage content.
- Approved material is public on GitHub Pages.
- Coffee Scientist gates public updates: keep structure clean and not stale; reconcile chat decisions vs repo vs user edits.
- Sync and push are the same action.
- Log decisions and open **REVIEW** items here in `NOTES.md`; rely on git history for rollback.
- Over time, design system, art, media, and content design all live in this repo.
- Homepage + OG image remain gated until OG lab sign-off.

## Status legend

- **TODO** — content or asset not yet added
- **REVIEW** — draft present; needs verification before teaching
- **DONE** — verified with a cited source

## Open items

| ID | Location | Item | Status |
|----|----------|------|--------|
| N1 | README | Workshop date / audience / branding | REVIEW |
| N2 | 01-history | Immigration 1935 (MoMA) vs 1936 (Lemelson/Chemex) | REVIEW |
| N3 | 01-history | IIT “100 best” 1956 vs 1958 | REVIEW |
| N4 | 01-history | LIFE Beautilities exact issue date | REVIEW |
| N5 | 02-design | Current production materials vs historic | REVIEW |
| N6 | 02 / SOURCES | MoMA / LIFE image clearance for public slides | REVIEW |
| N7 | 04-patents | Utility US2241368 (1941) + design USD137943 (1944) | DONE |
| N8 | 04 / 06 | Cooper Hewitt “patented 1944” → USD137943 | DONE (clarified) |
| N9 | 05-inventor | Caplan “logic and madness” — original text + cite | REVIEW |
| N10 | 05-inventor | Patent count ~300 (never 3000) | DONE |
| N11 | 07-brew | House recipes: hot 40g→640ml (1:16); ice 24g/200g/200g | DONE (approved 2026-09-07) |
| N12 | 08-run-of-show | 90-min schedule approved; venue/headcount still TBD | DONE schedule / REVIEW venue |
| N13 | assets | Brooklyn + Unsplash + patents + MoMA bulletin | DONE |
| N14 | research-brief | Timeline + links + design patent | DONE |
| N15 | global | Never cite US2399935 as Chemex | DONE |
| N16 | assets | IMAGES-AND-ESSAYS catalog checked in | DONE |
| N17 | 04-patents | Advanced track: US2411340 / US2681154 | REVIEW (optional depth) |
| N18 | theme | ADD-dub tokens: cream `#F7F1E5`, turquoise `#4bb4bb`, coffee `#5C3A21`, ink `#2A1F18`; Flex h1/h2 · Silkscreen h3+ HUD · Inter body | REVIEW |
| N19 | theme | **h3 = Silkscreen 400** (HUD), not Flex — axes `--wght-h3` etc. removed | REVIEW |
| N20 | design-attributes | Brand annotated anatomy JPG rights before projection | REVIEW |
| N21 | public site | HUDDI / maker chrome unlinked from public nav | DONE |


## Change log

- **2026-09-07** — Turquoise token updated `#1AA7A0` → `#4bb4bb` (hover `#158F89` → `#3a9ea5`). Updated `theme.css` (`--color-turquoise`, `--turquoise-hover`, `--theme-color`), `docsify-config.js` `themeColor`, `course/design-system.md`, cache-bust `theme.css?v=6` + `docsify-config.js?v=6`.
- **2026-09-07** — Added Working protocol (repo as source of truth; dual editors; Coffee Scientist gates public updates; sync=push; decisions/REVIEW in NOTES; homepage+OG still gated).
- **2026-09-07** — Public site: hide HUDDI; add `course/design-attributes.md` anatomy consolidation; sidebar → Design attributes near top; design-system reframed as Type tokens (no HUDDI catalog).
- **2026-09-07** — Workshop schedule **approved** as canonical (not draft). Updated `course/08-workshop-run-of-show.md` (90-min table, kit checklist, timing notes) and `course/07-brew-method.md` (hot 40g→640ml 1:16; ice 24g/200g ice/200g water). Stumptown ice YouTube URL still REVIEW TODO. README workshop cross-link added.

## Conventions

- Do **not** invent patent numbers or URLs.
- Prefer primary sources: USPTO, MoMA collection records, Chemex company history, museum catalogs.
- When an image is added under `/art-of-chemex/assets/`, log credit + license in `/art-of-chemex/assets/SOURCES.md` the same day.
- Keep `> **REVIEW:**` callouts in course pages until items close here.

> **REVIEW:** Keep this log updated as modules move from scaffold to teach-ready.

## Theme tokens (ADD-dub)

> **REVIEW:** Site theme restyled to ADD-dub art direction. Tokens — cream `#F7F1E5`, turquoise `#4bb4bb` (links + Flex h1), coffee `#5C3A21` (Flex h2 + Silkscreen h3+/sidebar HUD), ink `#2A1F18` (Inter body). Google Sans Flex local woff2 under `assets/fonts/`; Silkscreen + Inter via Google Fonts. Patent imgs pixelated by CSS; Brooklyn/Unsplash photos marked `class="smooth"`. Confirm visual QA on Pages after deploy.

> **REVIEW:** **h3 = Silkscreen weight 400** (HUD chrome, 16px, no antialias, coffee) — not Google Sans Flex. Flex axes apply to h1/h2 only. Cache-bust `theme.css?v=6`.


## Internal tooling

**HUDDI is internal; not for workshop site.** Do not link `assets/vendor/huddi/`, huddi.pages.dev, createHuddi, or shimmer from public sidebar / README / course pages. Maker chrome kit stays off the Docsify surface.
