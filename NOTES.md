# NOTES — Master Project Log

Full working log for the *Art of Chemex* workshop site. Someone opening this repo cold should be able to continue from here without prior chat context.

Live site: https://designst3in.github.io/art-of-chemex/  
Repo: https://github.com/designst3in/art-of-chemex

---

## 1. Working protocol

- **This repo holds everything** — course modules, assets, type tokens, art/media, workshop schedule, and decision log.
- **Sync = push.** After edits, commit and push `main`. GitHub Pages deploys from branch `main` / root (no Actions build).
- **Dual editors:** Abhishek and Coffee Scientist both manage content.
- **Approved = public.** Only material Coffee Scientist has gated/approved ships on the public Docsify site.
- **Coffee Scientist gates** public updates: keep structure clean and not stale; reconcile chat decisions vs repo vs user edits before publishing.
- **Git rollback** is the recovery path — rely on history; don’t invent parallel “backup” trees for teach content.
- **Design / art / media live here** — product refs, OG tokens, fonts, patents, and art direction all stay under this repo (not only in chat or ephemeral labs).
- Homepage rewrite remains gated until OG final is signed off and `assets/og.png` is in place (see §5).
- Log decisions and open **REVIEW** items in this file.

---

## 2. Type stack

| Role | Face | Notes |
|------|------|--------|
| **h1–h2** | Google Sans Flex (variable) | Thin / light axes; local `assets/fonts/GoogleSansFlex.woff2` |
| **h3** | Silkscreen **400** | HUD chrome — not Flex. Axes `--wght-h3` etc. removed |
| **Body** | Inter | Google Fonts |
| **HUDDI** | Internal only | Hidden from public site / sidebar / README. See §8 |

**Brand turquoise:** `#4bb4bb` · hover `#3a9ea5`  
(Also: cream `#F7F1E5`, coffee `#5C3A21`, ink `#2A1F18`.)

Theme files: `theme.css`, `docsify-config.js` (`themeColor`), `course/design-system.md` (Type tokens page). Cache-bust query currently `?v=6`.

---

## 3. Workshop — APPROVED 90-min schedule + kit

Canonical run of show approved **2026-09-07** — see `course/08-workshop-run-of-show.md`.

**Block structure (90 min = 60 workshop + ≥30 QA/open brew):**

| Min | Block | What |
|-----|-------|------|
| 0–20 | Intro | Design history + heritage + object (**one** presentation) |
| 20–32 | Unbox | Appreciate object; industrial design / materials / filters |
| 32–40 | Method | Short brew-method presentation + external links |
| 40–60 | Demos | Hot 3-pour · ice Stumptown-style · care |
| 60–90 | Buffer | QA, tasting, open brew / redo |

**Kit (required):** Chemex · bonded Chemex filters · grinder · scale · gooseneck kettle.  
**Alt filters:** post-shop only — not for timed demos.

Venue / headcount still TBD.

---

## 4. Brew recipes (house / canonical)

Documented in `course/07-brew-method.md`.

| Recipe | Spec |
|--------|------|
| **Hot** | **40 g → 640 ml** (1:16), usual **3-pour** (bloom + two follow-ons) |
| **Ice** | **24 g** coffee / **200 g** ice / **200 g** water — Stumptown-style flash/ice Chemex |

Ice demo in-session = assemble + explain only (not a full steep).  
> **REVIEW:** Stumptown YouTube URL still TODO — lock before teaching day.

---

## 5. OG status — locked layout from lab

Locked in OG lab (`/workspace/chemex-og-lab` on the shared box) and mirrored to `assets/og-tokens.json` + `assets/og.png`.

| Token | Value |
|-------|--------|
| wght | **90** |
| wdth | **112** |
| opsz | **144** |
| Title size | **113 px** |
| Image scale | **95%** |
| Subtitle | **HISTORY · DESIGN · BREW** |
| Background | `#4bb4bb` |
| Title color | white/cream (`#F7F1E5` in tokens; lab bake also used `#FFFFFF`) |
| Credits | Silkscreen coffee `#5C3A21`: **DESIGN SCIENTIST / × / KAT & KIN** |

**Method (approved):** white-bg Chemex studio photo + full-frame **`#4bb4bb` Color-blend** (CSS `mix-blend-mode: color` / Photoshop Color). Type over image. **Not** rembg transparent cutout for final OG.

**Rejected for OG accuracy:** transparent PNG at `assets/images/chemex-transparent.png` (rembg from studio-white-front-alt) — kept on disk for other compositing experiments, **do not** use for the public OG bake.

**Export:** `assets/og.png` copied from lab `exports/og-final.png` (Color-blend bake). Open Graph meta tags added in `index.html`.

**Still pending:** homepage rewrite after OG final export lands — **do not half-rewrite** the Docsify homepage until that pass is intentional. Tokens + `og.png` are enough for social previews now.

---

## 6. Desktop hygiene

- Keep **latest** working tabs open (OG lab, live Pages, repo, type/token refs).
- Close **stale** exploratory tabs (old turquoise option pages, rembg-only experiments once rejected).
- Document session-critical paths here in NOTES rather than relying on browser memory.
- Shared box labs (not in this git tree unless copied): `chemex-og-lab/`, `chemex-theme-lab/`, `chemex-research/` — treat as scratch; **promote** finished exports into `assets/`.

---

## 7. Open REVIEW list

| ID | Item | Status |
|----|------|--------|
| R1 | Stumptown ice Chemex **YouTube URL** | REVIEW TODO |
| R2 | Caplan “logic and madness” — **original quote + cite** | REVIEW |
| R3 | OG Color-blend final in `assets/og.png` | DONE (copied 2026-09-07); re-QA social preview |
| R4 | **Homepage sync / rewrite** after OG | PENDING |
| R5 | Immigration date: 1935 (MoMA) vs 1936 (Lemelson/Chemex) | REVIEW |
| R6 | IIT “100 best” 1956 vs 1958 | REVIEW |
| R7 | MoMA / LIFE image **rights** for public slides | REVIEW |
| R8 | LIFE Beautilities exact issue date | REVIEW |
| R9 | Workshop date / audience / branding | REVIEW |
| R10 | Brand annotated anatomy JPG rights before projection | REVIEW |
| R11 | Current vs historic production materials | REVIEW |
| R12 | Optional patent depth US2411340 / US2681154 | REVIEW (optional) |

---

## 8. Key URLs

| What | URL |
|------|-----|
| **Public site** | https://designst3in.github.io/art-of-chemex/ |
| **Repo** | https://github.com/designst3in/art-of-chemex |
| **Design attributes** | https://designst3in.github.io/art-of-chemex/#/course/design-attributes |
| **HUDDI (INTERNAL)** | https://github.com/designst3in/HUDDI · https://huddi.pages.dev — **do not** link from public sidebar / README / course pages |

Vendor copy may exist under `assets/vendor/huddi/` for makers; it is **not** wired into Docsify nav.

---

## 9. Change log — 2026-09-07 (and major SHAs)

### 2026-09-07 — documentation + OG bake promotion

- Expanded this NOTES into full project log (protocol, type, workshop, brew, OG lock, hygiene, REVIEW, URLs).
- Added `docs/PROJECT.md` cold-start TL;DR; `assets/og-tokens.json` locked tokens; copied Color-blend `og-final.png` → `assets/og.png`; OG meta in `index.html`; README Status blurb.

### Prior commits on `main` (major)

| SHA | Summary |
|-----|---------|
| `3c8b209` | Add transparent Chemex PNG for turquoise OG compositing |
| `0334275` | Update turquoise token to `#4bb4bb` (hover `#3a9ea5`) |
| `f6d1a6f` | Add Working protocol to NOTES; brief Working together pointer in README |
| `047aba8` | Hide HUDDI from public site; add Design attributes page |
| `f2961ed` | Approve canonical 90-min Chemex workshop schedule |
| `06df0c4` | Type: Flex h1/h2 only; h3 = Silkscreen HUD 400 |
| `c1051f8` | Fix Docsify nested-route 404s: absolute sidebar paths |
| `7e7975e` | Replace ADD-dub Flex subset with full Latin variable font |
| `4c08e46` | Fix Docsify Flex h1: kill vue bold/underline, font-synthesis none |
| `e2c9c64` | Flex thin headlines + design-system scaffold + HQ product refs |
| `bbb9793` | Restyle Docsify theme to ADD-dub art direction |
| `5db135a` | Fix Docsify GitHub Pages image paths and embed assets |
| `96975c9` | Fill Chemex course with verified research and patent assets |
| `99f737f` | Remove Actions workflow; document branch-based Pages |
| `d133588` | Scaffold Docsify Art of Chemex workshop site |

### Same-day notes already logged earlier

- OG direction evolved from rembg transparent → **Color-blend on white-bg photo** (transparent PNG rejected for final OG accuracy).
- Turquoise `#1AA7A0` → `#4bb4bb` / hover `#3a9ea5` across theme + design-system.
- Workshop schedule + house recipes approved; Stumptown YT still open.
- Public nav: Design attributes near top; HUDDI unlinked.

---

## Status legend

- **TODO** — content or asset not yet added  
- **REVIEW** — draft present; needs verification before teaching  
- **DONE** — verified / approved  

## Conventions

- Do **not** invent patent numbers or URLs.
- Prefer primary sources: USPTO, MoMA collection records, Chemex company history, museum catalogs.
- When an image is added under `assets/`, log credit + license in `assets/SOURCES.md` the same day.
- Keep `> **REVIEW:**` callouts in course pages until items close here.
- Never cite **US2399935** as Chemex.

## Closed / done highlights

| ID | Item | Status |
|----|------|--------|
| N7 | Utility US2241368 (1941) + design USD137943 (1944) | DONE |
| N8 | Cooper Hewitt “patented 1944” → USD137943 | DONE |
| N10 | Patent count ~300 (never 3000) | DONE |
| N11 | House recipes hot 40→640; ice 24/200/200 | DONE (approved 2026-09-07) |
| N12 | 90-min schedule | DONE schedule / REVIEW venue |
| N13 | Brooklyn + Unsplash + patents + MoMA bulletin | DONE |
| N15 | Never cite US2399935 as Chemex | DONE |
| N21 | HUDDI unlinked from public nav | DONE |
