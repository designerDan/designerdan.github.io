# Refactor summary

Completed: **2026-07-12**

## Architecture (reuse-first)

| Layer | File | Role |
|-------|------|------|
| Tokens | `tokens.css` | Colors, type, `--asset-gap-*` |
| Shell | `layout.css` | Page shell, header, shared type roles |
| **Patterns** | **`patterns.css`** | **Single source for repeated layout + theme rules** |
| Case | `case-study.css` | Component-specific: hero layout, finish motion, handoff typography |
| Sections | `sections.css` | Component-specific: grids, banner, text-blocks |
| About / Landing | `about.css`, `landing.css` | Page-specific |
| Motion | `shared.js` | Bootstrap, nav sync, scroll reveals |

## What `patterns.css` consolidates

- Section vertical rhythm (was 9 duplicate margin blocks)
- Asset captions + duo/trio image base
- Section intro dividers (`*__wrap` top borders)
- Proof/CTA column (`text-cta` ↔ `results-section`)
- Finish act base (proof + CTA shared positioning)
- `[data-accent-theme]` → `--surface-*` (hero + finish)
- `[data-nav-theme]` on handoff → `--handoff-*`
- Sticky scroll tracks (finish + about bene)
- Image hover zoom (product showcase + about work)

## JS consolidation

- **One case/about bootstrap:** `onReady(initApp)` — includes `initHeroGallery()`
- **Landing:** `onReady(initLandingAnim)` + `shared.js`
- **Removed:** `getFinishProgress` / `getBeneProgress` wrappers, `revealAllAboutLineMasks`, 3× `DOMContentLoaded` handlers
- **Shared:** `initNavListeners`, `refreshScrollLayout`, `onDebouncedResize`

## Metrics

| | Before | After |
|--|--------|-------|
| `components.css` monolith | 3,312 | 8 (`@import` hub) |
| Split component CSS | 3,312 | **3,193** (−3.6%) |
| `patterns.css` | — | 264 (shared) |
| `case-study.css` | 1,083 | 848 |
| `sections.css` | 527 | 410 |
| JS total | 1,659 | 1,596 |

Reuse is the primary win: rhythm, proof columns, themes, and motion bootstrapping each have **one place to edit**.

## Still duplicated (by design)

- HTML `<head>` + header (~60 lines × 5 pages) — static GitHub Pages, no build step
- Case study body content — per-project copy/images
- `initFinishSequence` CTA reveals — scroll-progress driven, not generic

## Verify

`npm run lint:css` passes. Manually check handoff, finish, hero gallery, carousel, nav themes.
