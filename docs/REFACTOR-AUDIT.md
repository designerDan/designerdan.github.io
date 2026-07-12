# Portfolio refactor audit

Baseline (pre-refactor): **2026-07-12**

| File | LOC |
|------|-----|
| `css/components.css` | 3,312 |
| `css/base.css` | 508 |
| `css/tokens.css` | 65 |
| **Total CSS** | **3,885** |
| `js/case-study.js` | 1,004 |
| `js/anim.js` | 498 |
| `js/hero-gallery.js` | 157 |
| **Total JS** | **1,659** |
| `zix.html` | 552 |
| `pixly.html` | 587 |
| `odl.html` | 609 |
| `about.html` | 341 |
| `index.html` | 193 |

---

## 1. Duplicated HTML blocks

### Head shell (~38 lines × 5 pages)
Identical across `index.html`, `about.html`, `zix.html`, `pixly.html`, `odl.html`:
- charset/viewport, favicon, font preconnect
- stylesheet chain: `normalize.css` → Google Fonts → `base.css` → `components.css`
- GSAP CDN scripts (case/about/index differ only by extra `hero-gallery.js`)

**Page-specific only:** title, description, canonical, OG/Twitter, JSON-LD, hero image preload.

### Site header (~20 lines × 5 pages)
Byte-identical: skip link, `site-head` lockup, LinkedIn, About/Contact nav.

### Case study tail (~45 lines × 3 pages)
`finish` + `project-handoff` share the same DOM skeleton. Variance:
- `finish--yellow` / `finish--brown` modifier classes
- `project-handoff--brown` / `project-handoff--brand` modifier classes
- CTA button class (`btn--inverse` vs `btn`) — intentional contrast per theme
- Content, images, `data-next-project`, handoff `data-nav-theme`

### `text-section` markup
Case pages use consistent structure; `about.html` adds `aria-labelledby` (good pattern to adopt everywhere).

### Finish CTA line-splitting
Pixly/ODL split headline lines differently from Zix — content choice, not structural.

---

## 2. CSS: near-duplicate blocks / modifier sprawl

### Theme modifiers (97 references to hero/finish/handoff/banner modifiers)
| Pattern | Classes | Consolidation target |
|---------|---------|---------------------|
| Hero bg | `project-hero--yellow`, `project-hero--brown` | `data-accent-theme` on `.project-hero--fold` |
| Finish bg | `finish--yellow`, `finish--brown` | `data-accent-theme` on `.finish` |
| Handoff bg | `project-handoff--brown`, `project-handoff--brand` | `data-nav-theme` (already on element) |
| Nav handoff | `data-handoff-theme` on `.site-head` | Keep — already attribute-driven |

### Header handoff theme blocks (lines ~91–137)
Four `is-handoff[data-handoff-theme]` blocks repeat the same custom-property set with different color values. Candidate for a shared custom-property map.

### Shared eyebrow/headline selectors
`.text-cta__eyebrow`, `.text-section__eyebrow`, `.product-showcase__eyebrow`, etc. are already grouped — good pattern to extend.

### `@media` duplication
78 `@media` blocks in `components.css`; many repeat `(width <= 600px)` / `(width >= 601px)` pairs across text-cta, handoff, hero, landing.

### Monolithic file
Single 3,312-line file mixes: case shell, header, hero, finish, sections, handoff, about, landing. No logical file boundaries in HTML.

### Dead / redundant candidates (grep before delete)
- `closing-cta` standalone block — marked "fallback"; verify usage
- `project-hero` without `--fold` — verify if legacy
- Inconsistent 2-space indent blocks (lines 162+) — formatting artifact, not functional

---

## 3. JS duplication

| Duplication | Locations | Fix |
|-------------|-----------|-----|
| `prefersReducedMotion()` | `case-study.js`, `hero-gallery.js` | `shared.js` |
| `clamp` / progress math | `getFinishProgress`, `getBeneProgress`, handoff budget | `shared.js` |
| ScrollTrigger reveal pattern | `initCaseStudy` lines, `initAboutLineMasks`, `initAboutReveals`, `initAboutQuoteBand`, `initAboutContactReveal` | `initScrollReveal()` helper (≥5 call sites) |
| `hgLerp` / `hgClamp` | `hero-gallery.js` | `shared.js` |
| Resize debounce | `case-study.js`, `initAbout` | Optional — only 2 sites |

### Init map (current)
| File | Owns |
|------|------|
| `anim.js` | Landing carousel, counters, GSAP headline, mobile infinite scroll |
| `case-study.js` | Case/about motion, nav sync, banner showroom, product showcase, finish, handoff |
| `hero-gallery.js` | Horizontal hero gallery parallax |

---

## 4. Proposed canonical component set

### `text-section`
```html
<section class="text-section" aria-labelledby="…-heading">
  <div class="cs-wrap text-section__wrap">
    <div class="text-section__header">
      <h2 id="…-heading" class="text-section__eyebrow">…</h2>
    </div>
    <div class="text-section__columns">
      <p class="text-section__headline">…</p>
      <div class="text-section__prose">…</div>
    </div>
  </div>
</section>
```

### `text-blocks__item`
```html
<div class="text-blocks__item scroll-reveal">
  <h3 class="text-blocks__item-title"><strong>…</strong></h3>
  <div class="text-blocks__prose">…</div>
</div>
```

### `finish`
```html
<section class="finish" data-nav-theme="paper" data-accent-theme="yellow|brown" data-nav-link-tone="dark|light" aria-label="Results and contact">
  <div class="finish__track">
    <div class="finish__sticky">
      <div class="finish__bg" aria-hidden="true"></div>
      <div class="finish__stage">…proof act… …cta act…</div>
    </div>
  </div>
</section>
```

### `project-handoff`
```html
<section class="project-handoff" data-nav-theme="yellow|brown|brand" aria-label="Next project">
  <a href="…" class="project-handoff__target"><span class="sr-only">…</span></a>
  …content…
  <p class="project-handoff__hint">Keep scrolling</p>
  <div class="project-handoff__progress" aria-hidden="true">
    <div class="project-handoff__progress-bar"></div>
  </div>
  <a href="…" class="project-handoff__skip">…</a>
</section>
```

### Theme tokens
| Attribute | Controls |
|-----------|----------|
| `data-nav-theme` | Handoff section bg + header handoff state |
| `data-nav-link-tone` | Header link contrast on hero/finish |
| `data-accent-theme` | Hero/finish accent background (yellow, brown; default = brand) |
| `data-handoff-theme` | Set on `.site-head` by JS from handoff `data-nav-theme` |

---

## 5. Refactor plan summary

1. **CSS:** Split `components.css` → `layout.css`, `sections.css`, `case-study.css`, `about.css`, `landing.css`; aggregate via `components.css` `@import`. Consolidate theme modifiers to data attributes.
2. **HTML:** Remove redundant modifier classes; standardize `text-section` aria; document shell template in `docs/CASE-STUDY-TEMPLATE.md`.
3. **JS:** Add `shared.js`; dedupe motion helpers and scroll-reveal init.
4. **Verify:** `npm run lint:css`, `npm run validate:html`, LOC metrics, QA checklist.
